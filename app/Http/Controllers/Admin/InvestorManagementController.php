<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\FinancialRequest;
use App\Models\ApprovalLog;
use App\Models\Firm;
use App\Services\InvestorCapitalService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\EmailTemplateService;
use App\Mail\DynamicEmail;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\InvestorListExport;
use Illuminate\Support\Facades\Mail;
use App\Mail\FinancialRequestStatusMail;
use App\Mail\InvestorWelcomeMail;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\InvestorCapitalAccount;
use Illuminate\Support\Facades\Auth;
use App\Models\Account;


class InvestorManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/investors/index', [
            'investors' => Investor::with('capitalAccount')->get()->map(function($investor) {
                return [
                    'id' => $investor->id,
                    'name' => $investor->full_name,
                    'capital' => (float)$investor->capitalAccount->current_capital,
                    'ownership' => (float)$investor->capitalAccount->ownership_percentage,
                    'status' => $investor->status,
                ];
            })
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'cnic' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'initial_capital' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function() use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'status' => 'active',
            ]);

            $user->assignRole('investor');

            // 1. Create Ledger Account (Day Book Integration)
            $latestAccount = Account::where('type', 9) // Capital Type
                ->latest('id')
                ->first();

            $nextCode = '000001';
            if ($latestAccount && preg_match('/(\d+)$/', $latestAccount->code, $matches)) {
                $number = intval($matches[1]);
                $nextCode = str_pad($number + 1, strlen($matches[1]), '0', STR_PAD_LEFT);
            }

            Account::create([
                'code' => $nextCode,
                'title' => "Capital - " . $request->name,
                'type' => 9,
                'status' => true,
                'opening_balance' => (float)($request->initial_capital ?? 0),
                'opening_date' => now(),
            ]);

            // 2. Create Investor Profile
            $investor = Investor::create([
                'user_id' => $user->id,
                'full_name' => $request->name,
                'phone' => $request->phone,
                'cnic' => $request->cnic,
                'address' => $request->address,
                'joining_date' => now(),
                'status' => 'active',
            ]);

            // Create initial account record
            InvestorCapitalAccount::create([
                'investor_id' => $investor->id,
                'current_capital' => 0,
                'ownership_percentage' => 0,
            ]);

            // Process initial capital if provided
            if ($request->initial_capital > 0) {
                app(InvestorCapitalService::class)->adjustCapital(
                    $investor->id,
                    (float)$request->initial_capital,
                    'capital_in',
                    Auth::id(),
                    'Initial capital injection upon registration'
                );
            }
        });

        // Send Welcome Email
        try {
            $user = User::where('email', $request->email)->first();
            Mail::to($request->email)->send(new InvestorWelcomeMail($user, $request->password));
        } catch (\Exception $e) {
            Log::error("Failed to send welcome email: " . $e->getMessage());
        }

        return back()->with('success', 'Investor created successfully.');
    }

    public function show(int $id)
    {
        $investor = Investor::with(['capitalAccount', 'capitalHistory.approvedBy', 'transactions.creator'])->findOrFail($id);
        
        return Inertia::render('admin/investors/show', [
            'investor' => $investor,
            'pending_requests' => FinancialRequest::where('investor_id', $id)->where('status', 'pending')->get(),
            'available_balance' => app(InvestorCapitalService::class)->getAvailableBalance($id),
        ]);
    }

    public function approveRequest(int $id, Request $request)
    {
        $request->validate([
            'payment_account_id' => 'nullable|exists:accounts,id', // Required for external withdrawals
        ]);

        $finRequest = FinancialRequest::findOrFail($id);
        $service = app(InvestorCapitalService::class);

        DB::transaction(function () use ($finRequest, $service, $request) {
            if ($finRequest->request_type === 'reinvestment') {
                $service->processReinvestment($finRequest->id);
            } else {
                $service->processWithdrawal($finRequest->id, $request->payment_account_id);
            }

            ApprovalLog::create([
                'request_id' => $finRequest->id,
                'action' => 'approved',
                'performed_by' => Auth::id(),
                'previous_status' => 'pending',
                'new_status' => $finRequest->fresh()->status,
                'note' => $request->admin_note ?? 'Request approved by admin',
            ]);
        });

        // Send Email Notification
        try {
            $service = app(EmailTemplateService::class);
            $rendered = $service->render('financial-request-status', [
                'name' => $finRequest->investor->full_name,
                'status' => 'Approved',
                'type' => ucwords(str_replace('_', ' ', $finRequest->request_type)),
                'amount' => 'PKR ' . number_format($finRequest->amount, 2),
                'date' => $finRequest->created_at->format('d M Y, h:i A'),
                'note' => $request->admin_note,
                'dashboard_url' => config('app.url') . '/investor/dashboard',
            ]);

            Mail::to($finRequest->investor->user->email)->send(new DynamicEmail($rendered['subject'], $rendered['content']));
        } catch (\Exception $e) {
            Log::error("Failed to send approval email: " . $e->getMessage());
        }

        return back()->with('success', 'Request processed successfully.');
    }

    public function rejectRequest(int $id, Request $request)
    {
        $request->validate([
            'admin_note' => 'required|string|max:500',
        ]);

        $finRequest = FinancialRequest::findOrFail($id);

        DB::transaction(function () use ($finRequest, $request) {
            $finRequest->update([
                'status' => 'rejected',
                'reviewed_at' => now(),
                'reviewed_by' => Auth::id(),
                'admin_note' => $request->admin_note,
            ]);

            ApprovalLog::create([
                'request_id' => $finRequest->id,
                'action' => 'rejected',
                'performed_by' => Auth::id(),
                'previous_status' => 'pending',
                'new_status' => 'rejected',
                'note' => $request->admin_note,
            ]);
        });

        // Send Email Notification
        try {
            $service = app(EmailTemplateService::class);
            $rendered = $service->render('financial-request-status', [
                'name' => $finRequest->investor->full_name,
                'status' => 'Rejected',
                'type' => ucwords(str_replace('_', ' ', $finRequest->request_type)),
                'amount' => 'PKR ' . number_format($finRequest->amount, 2),
                'date' => $finRequest->created_at->format('d M Y, h:i A'),
                'note' => $request->admin_note,
                'dashboard_url' => config('app.url') . '/investor/dashboard',
            ]);

            Mail::to($finRequest->investor->user->email)->send(new DynamicEmail($rendered['subject'], $rendered['content']));
        } catch (\Exception $e) {
            Log::error("Failed to send rejection email: " . $e->getMessage());
        }

        return back()->with('success', 'Request rejected.');
    }

    public function adjustCapital(int $id, Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'type' => 'required|in:capital_in,capital_out',
            'notes' => 'nullable|string|max:500',
        ]);

        app(InvestorCapitalService::class)->adjustCapital(
            $id, 
            $request->amount, 
            $request->type, 
            Auth::id(), 
            $request->notes ?? ''
        );

        return back()->with('success', 'Capital adjusted manually.');
    }

    public function bulkApproveRequests(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:financial_requests,id',
            'payment_account_id' => 'nullable|exists:accounts,id',
        ]);

        $service = app(InvestorCapitalService::class);
        $count = 0;

        DB::transaction(function () use ($request, $service, &$count) {
            foreach ($request->ids as $id) {
                $finRequest = FinancialRequest::find($id);
                if ($finRequest->status !== 'pending') continue;

                if ($finRequest->request_type === 'reinvestment') {
                    $service->processReinvestment($finRequest->id);
                } else {
                    $service->processWithdrawal($finRequest->id, $request->payment_account_id);
                }

                ApprovalLog::create([
                    'request_id' => $finRequest->id,
                    'action' => 'approved',
                    'performed_by' => Auth::id(),
                    'previous_status' => 'pending',
                    'new_status' => 'approved',
                    'note' => 'Bulk approved by admin',
                ]);
                $count++;
            }
        });

        return back()->with('success', "$count requests approved successfully.");
    }

    public function recalculateOwnership()
    {
        DB::transaction(function() {
            app(InvestorCapitalService::class)->recalculateAllOwnerships();
        });

        return back()->with('success', 'All ownership percentages recalculated.');
    }

    public function exportPdf(int $id)
    {
        $investor = Investor::with(['capitalAccount', 'transactions'])->findOrFail($id);
        $firm = Firm::where('defult', 1)->first() ?? Firm::first();

        $pdf = PDF::loadView('pdf.investor-ledger', [
            'investor' => $investor,
            'transactions' => $investor->transactions()->orderBy('created_at', 'desc')->get(),
            'firm' => $firm,
            'is_print_mode' => false
        ]);

        return $pdf->download('investor-ledger-' . str_replace(' ', '-', $investor->full_name) . '.pdf');
    }

    public function exportMonthlyStatement(int $id, Request $request)
    {
        $request->validate(['period' => 'required|date_format:Y-m']);
        $period = $request->period;
        $investor = Investor::with(['capitalAccount'])->findOrFail($id);
        $firm = Firm::where('defult', 1)->first() ?? Firm::first();

        $startDate = \Carbon\Carbon::parse($period . '-01')->startOfMonth();
        $endDate = \Carbon\Carbon::parse($period . '-01')->endOfMonth();

        $transactions = $investor->transactions()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'asc')
            ->get();

        $openingBalance = $investor->transactions()
            ->where('created_at', '<', $startDate)
            ->orderBy('id', 'desc')
            ->first()?->balance_after ?? 0;

        $pdf = PDF::loadView('pdf.investor-statement', [
            'investor' => $investor,
            'transactions' => $transactions,
            'opening_balance' => $openingBalance,
            'period' => $startDate->format('F Y'),
            'firm' => $firm
        ]);

        return $pdf->download('statement-' . $period . '-' . str_replace(' ', '-', $investor->full_name) . '.pdf');
    }

    public function exportExcel()
    {
        $investors = Investor::with(['user', 'capitalAccount'])->get();
        return Excel::download(new InvestorListExport($investors), 'investor-list-' . date('d-M-Y') . '.xlsx');
    }
}
