<?php

namespace App\Services;

use App\Models\Investor;
use App\Models\InvestorCapitalAccount;
use App\Models\CapitalHistory;
use App\Models\InvestorTransaction;
use App\Models\FinancialRequest;
use App\Models\Payment;
use App\Models\Account;
use App\Services\FinancialGovernanceService;
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
            
            // Governance Check
            app(FinancialGovernanceService::class)->validateDateNotLocked($request->effective_date ?? now());

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
        // Governance Check
        app(FinancialGovernanceService::class)->validateDateNotLocked($request->paid_at ?? now());

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
        // Governance Check
        app(FinancialGovernanceService::class)->validateDateNotLocked($request->effective_date ?? now());

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

    private function generateNextVoucherNo(string $prefix): string
    {
        $last = Payment::where('voucher_no', 'LIKE', $prefix . '-%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('voucher_no');

        $nextNum = 1;
        if ($last && preg_match('/' . preg_quote($prefix, '/') . '-(\d+)/', $last, $matches)) {
            $nextNum = (int)$matches[1] + 1;
        }

        return $prefix . '-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }

    private function mirrorToPayments(Investor $investor, float $amount, string $type, int $paymentAccountId, string $remarks): Payment
    {
        // Find matching Account for Day Book
        $account = Account::where('title', 'LIKE', "Capital - " . $investor->full_name)->first();
        
        if (!$account) {
            $latestAccount = Account::where('type', 9)->latest('id')->first();
            $nextCode = '000001';
            if ($latestAccount && preg_match('/(\d+)$/', $latestAccount->code, $matches)) {
                $number = intval($matches[1]);
                $nextCode = str_pad($number + 1, strlen($matches[1]), '0', STR_PAD_LEFT);
            }

            $account = Account::create([
                'code' => $nextCode,
                'title' => "Capital - " . $investor->full_name,
                'type' => 9,
                'status' => true,
            ]);
        }

        $prefix = $type === 'RECEIPT' ? 'CRV' : 'CPV';
        $voucherNo = $this->generateNextVoucherNo($prefix);

        return Payment::create([
            'date' => now()->format('Y-m-d'),
            'voucher_no' => $voucherNo,
            'account_id' => $account->id,
            'payment_account_id' => $paymentAccountId,
            'amount' => $amount,
            'net_amount' => $amount,
            'discount' => 0,
            'type' => $type,
            'remarks' => $remarks,
            'payment_method' => 'Cash',
            'cheque_status' => 'Clear',
        ]);
    }

    public function adjustCapital(
        int $investorId,
        float $amount,
        string $type,
        int $adminId,
        string $notes = '',
        ?int $paymentAccountId = null,
        string $paymentMethod = 'Cash',
        ?string $chequeNo = null,
        ?string $chequeDate = null,
        ?string $clearDate = null,
        ?int $chequeId = null,
        ?int $originalChequeId = null
    ): Payment {
        return DB::transaction(function () use (
            $investorId, $amount, $type, $adminId, $notes,
            $paymentAccountId, $paymentMethod, $chequeNo, $chequeDate,
            $clearDate, $chequeId, $originalChequeId
        ) {
            // Governance Check
            app(FinancialGovernanceService::class)->validateDateNotLocked(now());

            $investor = $investorId instanceof Investor ? $investorId : Investor::findOrFail($investorId);
            $capitalAccount = $investor->capitalAccount;

            $capitalBefore = (float)$capitalAccount->current_capital;
            $ownershipBefore = (float)$capitalAccount->ownership_percentage;
            $totalCapitalBefore = (float)InvestorCapitalAccount::sum('current_capital');

            if ($type === 'capital_in') {
                $capitalAccount->increment('current_capital', $amount);
            } else {
                $capitalAccount->decrement('current_capital', $amount);
            }

            $this->recalculateAllOwnerships();

            $capitalAfter = (float)$capitalAccount->fresh()->current_capital;
            $ownershipAfter = (float)$capitalAccount->fresh()->ownership_percentage;
            $totalCapitalAfter = (float)InvestorCapitalAccount::sum('current_capital');

            // Find matching Account for Day Book / General Ledger
            $account = Account::where('title', 'LIKE', "Capital - " . $investor->full_name)->first();
            if (!$account) {
                $latestAccount = Account::where('type', 9)->latest('id')->first();
                $nextCode = '000001';
                if ($latestAccount && preg_match('/(\d+)$/', $latestAccount->code, $matches)) {
                    $number = intval($matches[1]);
                    $nextCode = str_pad($number + 1, strlen($matches[1]), '0', STR_PAD_LEFT);
                }

                $account = Account::create([
                    'code' => $nextCode,
                    'title' => "Capital - " . $investor->full_name,
                    'type' => 9,
                    'status' => true,
                ]);
            }

            // Fallback default cash account if none provided
            if (!$paymentAccountId) {
                $cashAcc = Account::active()->whereHas('accountType', function ($q) {
                    $q->where('name', 'Cash');
                })->first();
                $paymentAccountId = $cashAcc ? $cashAcc->id : null;
            }

            $paymentAccount = $paymentAccountId ? Account::with('accountType')->find($paymentAccountId) : null;
            $accTypeName = strtolower($paymentAccount?->accountType?->name ?? '');

            $voucherPrefix = ($type === 'capital_in') ? 'CRV' : 'CPV';
            $voucherNo = $this->generateNextVoucherNo($voucherPrefix);
            $paymentType = ($type === 'capital_in') ? 'RECEIPT' : 'PAYMENT';

            // Determine cheque lifecycle & status
            $chequeStatus = 'Clear';

            if ($accTypeName === 'cheque in hand') {
                if ($paymentType === 'RECEIPT') {
                    $chequeStatus = 'In Hand';
                    $paymentMethod = 'Cheque';
                } elseif ($paymentType === 'PAYMENT') {
                    $chequeStatus = 'Distributed';
                    $paymentMethod = 'Cheque';
                    if ($originalChequeId) {
                        Payment::where('id', $originalChequeId)->update(['cheque_status' => 'Distributed']);
                    }
                }
            } elseif ($accTypeName === 'bank') {
                if ($paymentMethod === 'Cheque') {
                    $chequeStatus = 'Clear';
                    if ($paymentType === 'PAYMENT' && $chequeId) {
                        $leaf = \App\Models\Chequebook::find($chequeId);
                        if ($leaf && $leaf->status === 'unused') {
                            $leaf->update(['status' => 'issued']);
                        }
                    }
                }
            }

            $remarks = "Manual Capital " . ($type === 'capital_in' ? 'In' : 'Out') . " - " . $investor->full_name . ($notes ? " ({$notes})" : "");

            $payment = Payment::create([
                'date' => now()->format('Y-m-d'),
                'voucher_no' => $voucherNo,
                'account_id' => $account->id,
                'payment_account_id' => $paymentAccountId,
                'amount' => $amount,
                'net_amount' => $amount,
                'discount' => 0,
                'type' => $paymentType,
                'remarks' => $remarks,
                'payment_method' => $paymentMethod,
                'cheque_no' => $chequeNo,
                'cheque_date' => $chequeDate,
                'clear_date' => $clearDate,
                'cheque_id' => $chequeId,
                'source_payment_id' => $originalChequeId,
                'cheque_status' => $chequeStatus,
            ]);

            $historyEventType = match ($type) {
                'capital_in' => 'adjustment',
                'capital_out' => 'withdrawal',
                default => in_array($type, ['initial_investment', 'reinvestment', 'withdrawal', 'adjustment']) ? $type : 'adjustment',
            };

            CapitalHistory::create([
                'investor_id' => $investor->id,
                'event_type' => $historyEventType,
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
                'reference_id' => $payment->id,
                'notes' => $notes,
            ]);

            $destName = $paymentAccount ? $paymentAccount->title : 'Account';
            InvestorTransaction::create([
                'investor_id' => $investor->id,
                'type' => $type,
                'amount' => $amount,
                'balance_before' => $capitalBefore,
                'balance_after' => $capitalAfter,
                'reference_id' => $payment->id,
                'reference_type' => 'App\Models\Payment',
                'narration' => "Manual " . ($type === 'capital_in' ? 'Capital In' : 'Capital Out') . " via {$destName} [{$voucherNo}]" . ($notes ? " - {$notes}" : ""),
                'created_by' => $adminId,
            ]);

            return $payment;
        });
    }
}
