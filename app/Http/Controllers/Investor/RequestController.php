<?php

namespace App\Http\Controllers\Investor;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\FinancialRequest;
use App\Models\ApprovalLog;
use App\Services\InvestorCapitalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RequestController extends Controller
{
    public function index(Request $request)
    {
        $investor = Investor::where('user_id', $request->user()->id)->firstOrFail();
        return $investor->financialRequests()
            ->orderBy('id', 'desc')
            ->paginate(10);
    }

    public function reinvest(Request $request)
    {
        $investor = Investor::where('user_id', $request->user()->id)->firstOrFail();
        $capitalService = app(InvestorCapitalService::class);
        $available = $capitalService->getAvailableBalance($investor->id);

        $request->validate([
            'amount' => "required|numeric|min:5000|max:{$available}",
            'investor_note' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($request, $investor) {
            $finRequest = FinancialRequest::create([
                'investor_id' => $investor->id,
                'request_type' => 'reinvestment',
                'amount' => $request->amount,
                'status' => 'pending',
                'investor_note' => $request->investor_note,
                'requested_at' => now(),
            ]);

            ApprovalLog::create([
                'request_id' => $finRequest->id,
                'action' => 'submitted',
                'performed_by' => $request->user()->id,
                'new_status' => 'pending',
                'note' => 'Request submitted by investor',
            ]);
        });

        return back()->with('success', 'Reinvestment request submitted successfully.');
    }

    public function withdrawProfit(Request $request)
    {
        $investor = Investor::where('user_id', $request->user()->id)->firstOrFail();
        $capitalService = app(InvestorCapitalService::class);
        $available = $capitalService->getAvailableBalance($investor->id);

        $request->validate([
            'amount' => "required|numeric|min:1000|max:{$available}",
            'investor_note' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($request, $investor) {
            $finRequest = FinancialRequest::create([
                'investor_id' => $investor->id,
                'request_type' => 'profit_withdrawal',
                'amount' => $request->amount,
                'status' => 'pending',
                'investor_note' => $request->investor_note,
                'requested_at' => now(),
            ]);

            ApprovalLog::create([
                'request_id' => $finRequest->id,
                'action' => 'submitted',
                'performed_by' => $request->user()->id,
                'new_status' => 'pending',
                'note' => 'Profit withdrawal request submitted by investor',
            ]);
        });

        return back()->with('success', 'Profit withdrawal request submitted.');
    }

    public function withdrawCapital(Request $request)
    {
        $investor = Investor::where('user_id', $request->user()->id)->firstOrFail();
        $currentCapital = $investor->capitalAccount->current_capital;
        $maxAllowed = $currentCapital * 0.50;

        // Check 90-day cooldown
        $lastWithdrawal = FinancialRequest::where('investor_id', $investor->id)
            ->where('request_type', 'capital_withdrawal')
            ->whereIn('status', ['approved', 'paid'])
            ->orderBy('id', 'desc')
            ->first();

        if ($lastWithdrawal && Carbon::parse($lastWithdrawal->reviewed_at)->addDays(90)->isFuture()) {
            return back()->withErrors(['amount' => 'You cannot withdraw capital within 90 days of your last withdrawal.']);
        }

        $request->validate([
            'amount' => "required|numeric|min:10000|max:{$maxAllowed}",
            'investor_note' => 'required|string|min:10|max:500',
        ]);

        DB::transaction(function () use ($request, $investor) {
            $finRequest = FinancialRequest::create([
                'investor_id' => $investor->id,
                'request_type' => 'capital_withdrawal',
                'amount' => $request->amount,
                'status' => 'pending',
                'investor_note' => $request->investor_note,
                'requested_at' => now(),
            ]);

            ApprovalLog::create([
                'request_id' => $finRequest->id,
                'action' => 'submitted',
                'performed_by' => $request->user()->id,
                'new_status' => 'pending',
                'note' => 'Capital withdrawal request submitted by investor',
            ]);
        });

        return back()->with('success', 'Capital withdrawal request submitted for review.');
    }

    public function cancel(int $id, Request $request)
    {
        $finRequest = FinancialRequest::findOrFail($id);
        
        // Security check
        $investor = Investor::where('user_id', $request->user()->id)->firstOrFail();
        if ($finRequest->investor_id !== $investor->id) {
            abort(403);
        }

        if ($finRequest->status !== 'pending') {
            return back()->withErrors(['status' => 'Only pending requests can be cancelled.']);
        }

        DB::transaction(function () use ($finRequest, $request) {
            $finRequest->update(['status' => 'cancelled']);

            ApprovalLog::create([
                'request_id' => $finRequest->id,
                'action' => 'cancelled',
                'performed_by' => $request->user()->id,
                'previous_status' => 'pending',
                'new_status' => 'cancelled',
                'note' => 'Request cancelled by investor',
            ]);
        });

        return back()->with('success', 'Request cancelled.');
    }
}
