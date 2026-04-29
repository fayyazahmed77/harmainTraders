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
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\InvestorListExport;

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
                'performed_by' => auth()->id(),
                'previous_status' => 'pending',
                'new_status' => $finRequest->fresh()->status,
                'note' => $request->admin_note ?? 'Request approved by admin',
            ]);
        });

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
                'reviewed_by' => auth()->id(),
                'admin_note' => $request->admin_note,
            ]);

            ApprovalLog::create([
                'request_id' => $finRequest->id,
                'action' => 'rejected',
                'performed_by' => auth()->id(),
                'previous_status' => 'pending',
                'new_status' => 'rejected',
                'note' => $request->admin_note,
            ]);
        });

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
            auth()->id(), 
            $request->notes ?? ''
        );

        return back()->with('success', 'Capital adjusted manually.');
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
            'transactions' => $investor->transactions,
            'firm' => $firm,
            'is_print_mode' => false
        ]);

        return $pdf->download('investor-ledger-' . str_replace(' ', '-', $investor->full_name) . '.pdf');
    }

    public function exportExcel()
    {
        $investors = Investor::with(['user', 'capitalAccount'])->get();
        return Excel::download(new InvestorListExport($investors), 'investor-list-' . date('d-M-Y') . '.xlsx');
    }
}
