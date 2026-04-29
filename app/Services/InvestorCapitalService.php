<?php

namespace App\Services;

use App\Models\Investor;
use App\Models\InvestorCapitalAccount;
use App\Models\CapitalHistory;
use App\Models\InvestorTransaction;
use App\Models\FinancialRequest;
use App\Models\Payment;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InvestorCapitalService
{
    /**
     * Recalculates ownership for all active investors.
     * Must be called inside a transaction.
     */
    public function recalculateAllOwnerships(): void
    {
        $totalCapital = InvestorCapitalAccount::sum('current_capital');

        if ($totalCapital <= 0) {
            return;
        }

        $accounts = InvestorCapitalAccount::all();

        foreach ($accounts as $account) {
            $newOwnership = ($account->current_capital / $totalCapital) * 100;

            $account->update([
                'ownership_percentage' => round($newOwnership, 2),
                'last_recalculated_at' => now(),
            ]);
        }
    }

    /**
     * Get the current available balance for an investor from their transaction ledger.
     */
    public function getAvailableBalance(int $investorId): float
    {
        $lastTransaction = InvestorTransaction::where('investor_id', $investorId)
            ->orderBy('id', 'desc')
            ->first();

        return $lastTransaction ? (float)$lastTransaction->balance_after : 0.0;
    }

    public function processReinvestment(int $requestId): void
    {
        DB::transaction(function () use ($requestId) {
            $request = FinancialRequest::findOrFail($requestId);
            $investor = $request->investor;
            $capitalAccount = $investor->capitalAccount;

            $balanceBefore = $this->getAvailableBalance($investor->id);
            $capitalBefore = $capitalAccount->current_capital;
            $ownershipBefore = $capitalAccount->ownership_percentage;
            $totalCapitalBefore = InvestorCapitalAccount::sum('current_capital');

            // 1. Internal balance movement
            InvestorTransaction::create([
                'investor_id' => $investor->id,
                'type' => 'reinvestment',
                'amount' => $request->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceBefore - $request->amount,
                'reference_id' => $request->id,
                'reference_type' => 'FinancialRequest',
                'narration' => "Reinvestment of profit PKR " . number_format($request->amount),
                'created_by' => auth()->id(),
            ]);

            // 2. Update Capital
            $capitalAccount->increment('current_capital', $request->amount);
            
            // 3. Recalculate Ownership (Atomic)
            $this->recalculateAllOwnerships();
            
            $capitalAfter = $capitalAccount->fresh()->current_capital;
            $ownershipAfter = $capitalAccount->fresh()->ownership_percentage;
            $totalCapitalAfter = InvestorCapitalAccount::sum('current_capital');

            // 4. Log Capital History
            CapitalHistory::create([
                'investor_id' => $investor->id,
                'event_type' => 'reinvestment',
                'amount' => $request->amount,
                'capital_before' => $capitalBefore,
                'capital_after' => $capitalAfter,
                'ownership_before' => $ownershipBefore,
                'ownership_after' => $ownershipAfter,
                'total_capital_before' => $totalCapitalBefore,
                'total_capital_after' => $totalCapitalAfter,
                'effective_date' => $request->effective_date ?? now(),
                'effective_from_period' => Carbon::parse($request->effective_date ?? now())->addMonth()->format('Y-m'),
                'approved_by' => auth()->id(),
                'reference_id' => $request->id,
            ]);

            $request->update([
                'status' => 'approved', 
                'reviewed_at' => now(), 
                'reviewed_by' => auth()->id()
            ]);
        });
    }

    public function processWithdrawal(int $requestId, int $paymentAccountId = null): void
    {
        DB::transaction(function () use ($requestId, $paymentAccountId) {
            $request = FinancialRequest::findOrFail($requestId);
            $investor = $request->investor;
            $capitalAccount = $investor->capitalAccount;

            if ($request->request_type === 'profit_withdrawal') {
                $this->handleProfitWithdrawal($request, $paymentAccountId);
            } else {
                $this->handleCapitalWithdrawal($request, $paymentAccountId);
            }
        });
    }

    private function handleProfitWithdrawal(FinancialRequest $request, int $paymentAccountId = null): void
    {
        $investor = $request->investor;
        $balanceBefore = $this->getAvailableBalance($investor->id);

        // 1. Update internal balance
        InvestorTransaction::create([
            'investor_id' => $investor->id,
            'type' => 'withdrawal',
            'amount' => $request->amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceBefore - $request->amount,
            'reference_id' => $request->id,
            'reference_type' => 'FinancialRequest',
            'narration' => "Profit withdrawal PKR " . number_format($request->amount),
            'created_by' => auth()->id(),
        ]);

        // 2. External movement (Day Book)
        if ($paymentAccountId) {
            $this->mirrorToPayments($investor, $request->amount, 'PAYMENT', $paymentAccountId, "Profit withdrawal - " . $investor->full_name);
            $request->update(['status' => 'paid', 'paid_at' => now()]);
        } else {
            $request->update(['status' => 'approved', 'reviewed_at' => now(), 'reviewed_by' => auth()->id()]);
        }
    }

    private function handleCapitalWithdrawal(FinancialRequest $request, int $paymentAccountId = null): void
    {
        $investor = $request->investor;
        $capitalAccount = $investor->capitalAccount;

        $capitalBefore = $capitalAccount->current_capital;
        $ownershipBefore = $capitalAccount->ownership_percentage;
        $totalCapitalBefore = InvestorCapitalAccount::sum('current_capital');

        // 1. Update Capital
        $capitalAccount->decrement('current_capital', $request->amount);
        
        // 2. Recalculate Ownership
        $this->recalculateAllOwnerships();

        $capitalAfter = $capitalAccount->fresh()->current_capital;
        $ownershipAfter = $capitalAccount->fresh()->ownership_percentage;
        $totalCapitalAfter = InvestorCapitalAccount::sum('current_capital');

        // 3. Log History
        CapitalHistory::create([
            'investor_id' => $investor->id,
            'event_type' => 'withdrawal',
            'amount' => $request->amount,
            'capital_before' => $capitalBefore,
            'capital_after' => $capitalAfter,
            'ownership_before' => $ownershipBefore,
            'ownership_after' => $ownershipAfter,
            'total_capital_before' => $totalCapitalBefore,
            'total_capital_after' => $totalCapitalAfter,
            'effective_date' => $request->effective_date ?? now(),
            'effective_from_period' => Carbon::parse($request->effective_date ?? now())->addMonth()->format('Y-m'),
            'approved_by' => auth()->id(),
            'reference_id' => $request->id,
        ]);

        // 4. External movement
        if ($paymentAccountId) {
            $this->mirrorToPayments($investor, $request->amount, 'PAYMENT', $paymentAccountId, "Capital withdrawal - " . $investor->full_name);
            $request->update(['status' => 'paid', 'paid_at' => now()]);
        } else {
            $request->update(['status' => 'approved', 'reviewed_at' => now(), 'reviewed_by' => auth()->id()]);
        }
    }

    private function mirrorToPayments(Investor $investor, float $amount, string $type, int $paymentAccountId, string $remarks): void
    {
        // Find matching Account for Day Book
        $account = Account::where('title', 'LIKE', "Capital - " . $investor->full_name)->first();
        
        if (!$account) {
            // Fallback: create if not found (should be seeded)
            $account = Account::create([
                'title' => "Capital - " . $investor->full_name,
                'type' => 9,
                'status' => true,
            ]);
        }

        Payment::create([
            'date' => now()->format('Y-m-d'),
            'account_id' => $account->id,
            'payment_account_id' => $paymentAccountId,
            'amount' => $amount,
            'net_amount' => $amount,
            'type' => $type,
            'remarks' => $remarks,
            'payment_method' => 'Cash', // Default, can be refined
            'cheque_status' => 'Clear',
        ]);
    }

    public function adjustCapital(int $investorId, float $amount, string $type, int $adminId, string $notes = ''): void
    {
        DB::transaction(function () use ($investorId, $amount, $type, $adminId, $notes) {
            $investor = Investor::findOrFail($investorId);
            $capitalAccount = $investor->capitalAccount;

            $capitalBefore = $capitalAccount->current_capital;
            $ownershipBefore = $capitalAccount->ownership_percentage;
            $totalCapitalBefore = InvestorCapitalAccount::sum('current_capital');

            if ($type === 'capital_in') {
                $capitalAccount->increment('current_capital', $amount);
            } else {
                $capitalAccount->decrement('current_capital', $amount);
            }

            $this->recalculateAllOwnerships();

            $capitalAfter = $capitalAccount->fresh()->current_capital;
            $ownershipAfter = $capitalAccount->fresh()->ownership_percentage;
            $totalCapitalAfter = InvestorCapitalAccount::sum('current_capital');

            CapitalHistory::create([
                'investor_id' => $investor->id,
                'event_type' => 'adjustment',
                'amount' => $amount,
                'capital_before' => $capitalBefore,
                'capital_after' => $capitalAfter,
                'ownership_before' => $ownershipBefore,
                'ownership_after' => $ownershipAfter,
                'total_capital_before' => $totalCapitalBefore,
                'total_capital_after' => $totalCapitalAfter,
                'effective_date' => now(),
                'effective_from_period' => now()->addMonth()->format('Y-m'),
                'approved_by' => $adminId,
                'notes' => $notes,
            ]);
        });
    }
}
