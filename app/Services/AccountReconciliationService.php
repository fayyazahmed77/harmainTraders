<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\SalesReturn;
use App\Models\PurchaseReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountReconciliationService
{
    protected PaymentAllocationEngine $engine;

    public function __construct(PaymentAllocationEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Reconcile a single customer or supplier account.
     *
     * @param Account $account
     * @param array $options [
     *     'dry_run'                => bool,
     *     'auto_close_rounding'    => bool,
     *     'rounding_threshold'     => float,
     *     'cleanup_test_vouchers'  => bool,
     *     'reconcile_ob'           => bool,
     *     'reconcile_fifo_bills'   => bool,
     * ]
     * @return array
     */
    public function reconcileAccount(Account $account, array $options = []): array
    {
        $dryRun = $options['dry_run'] ?? true;
        $autoCloseRounding = $options['auto_close_rounding'] ?? true;
        $roundingThreshold = (float)($options['rounding_threshold'] ?? 5.00);
        $cleanupTestVouchers = $options['cleanup_test_vouchers'] ?? false;
        $reconcileOB = $options['reconcile_ob'] ?? true;
        $reconcileFifoBills = $options['reconcile_fifo_bills'] ?? true;

        $report = [
            'account_id'              => $account->id,
            'title'                   => $account->title,
            'type'                    => $account->sale ? 'Customer' : ($account->purchase ? 'Supplier' : 'General'),
            'opening_balance'         => (float)$account->opening_balance,
            'test_vouchers_removed'   => [],
            'ob_allocated'            => 0.0,
            'bills_allocated'         => [],
            'rounding_gaps_closed'    => [],
            'initial_remaining_ob'    => 0.0,
            'final_remaining_ob'      => 0.0,
            'unallocated_cash_before' => 0.0,
            'unallocated_cash_after'  => 0.0,
            'ledger_balance_before'   => (float)$account->current_balance,
            'ledger_balance_after'    => (float)$account->current_balance,
            'is_fully_reconciled'     => false,
        ];

        $isCustomer = (bool)$account->sale;
        $isSupplier = (bool)$account->purchase;

        if (!$isCustomer && !$isSupplier) {
            return $report;
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 0: Optional Test Vouchers Cleanup
        // ─────────────────────────────────────────────────────────────
        $simulatedOBReversal = 0.0;
        $simulatedLedgerDiff = 0.0;

        if ($cleanupTestVouchers) {
            $testPayments = Payment::where('account_id', $account->id)
                ->where('remarks', 'LIKE', '%test%')
                ->get();

            foreach ($testPayments as $tp) {
                $report['test_vouchers_removed'][] = [
                    'id'         => $tp->id,
                    'voucher_no' => $tp->voucher_no,
                    'amount'     => (float)$tp->amount,
                ];

                if ($dryRun) {
                    $tpOBAlloc = (float)PaymentAllocation::where('payment_id', $tp->id)
                        ->where('bill_type', Account::class)
                        ->sum('amount');
                    $simulatedOBReversal += $tpOBAlloc;
                    if ($tp->type === 'RECEIPT') {
                        $simulatedLedgerDiff += (float)$tp->net_amount;
                    } else {
                        $simulatedLedgerDiff -= (float)$tp->net_amount;
                    }
                } else {
                    $this->engine->reverseAllocations($tp);
                    $tp->delete();
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 1: Current State Assessment
        // ─────────────────────────────────────────────────────────────
        $currentRemainingOB = $this->engine->getRemainingOpeningBalance($account);
        $report['initial_remaining_ob'] = round($currentRemainingOB + $simulatedOBReversal, 2);

        $pmtType = $isCustomer ? 'RECEIPT' : 'PAYMENT';
        $paymentsQuery = Payment::where('account_id', $account->id)
            ->where('type', $pmtType)
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc');

        if ($cleanupTestVouchers) {
            $paymentsQuery->where(function ($sub) {
                $sub->whereNull('remarks')
                    ->orWhere('remarks', 'NOT LIKE', '%test%');
            });
        }

        $payments = $paymentsQuery->get();

        $totalPaid = (float)$payments->sum('amount');
        $totalAllocatedBefore = (float)PaymentAllocation::whereIn('payment_id', $payments->pluck('id'))->sum('amount');
        $report['unallocated_cash_before'] = round(max(0.0, $totalPaid - $totalAllocatedBefore), 2);

        $runningRemainingOB = $report['initial_remaining_ob'];

        // Load eligible bills and track remaining amounts in-memory
        $eligibleBills = $isCustomer
            ? Sales::where('customer_id', $account->id)
                ->where('remaining_amount', '>', 0.005)
                ->whereNotIn('status', ['Paid', 'Canceled', 'Cancelled', 'Returned'])
                ->orderBy('date', 'asc')
                ->orderBy('id', 'asc')
                ->get()
            : Purchase::where('supplier_id', $account->id)
                ->where('remaining_amount', '>', 0.005)
                ->whereNotIn('status', ['Paid', 'Canceled', 'Cancelled', 'Returned'])
                ->orderBy('date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

        $billRemTrackers = [];
        foreach ($eligibleBills as $b) {
            $billRemTrackers[$b->id] = (float)$b->remaining_amount;
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 2: Reconcile Unallocated Cash from Historical Payments
        // ─────────────────────────────────────────────────────────────
        foreach ($payments as $payment) {
            $paymentAllocSum = (float)PaymentAllocation::where('payment_id', $payment->id)->sum('amount');
            $paymentUnallocated = round(max(0.0, (float)$payment->amount - $paymentAllocSum), 2);

            if ($paymentUnallocated <= 0.005) {
                continue;
            }

            // Priority 1: Opening Balance First
            if ($reconcileOB && $runningRemainingOB > 0.005) {
                $obAlloc = round(min($paymentUnallocated, $runningRemainingOB), 2);

                if ($obAlloc > 0.005) {
                    $report['ob_allocated'] = round($report['ob_allocated'] + $obAlloc, 2);
                    $runningRemainingOB = round($runningRemainingOB - $obAlloc, 2);
                    $paymentUnallocated = round($paymentUnallocated - $obAlloc, 2);

                    if (!$dryRun) {
                        PaymentAllocation::create([
                            'payment_id' => $payment->id,
                            'bill_id'    => $account->id,
                            'bill_type'  => Account::class,
                            'amount'     => $obAlloc,
                        ]);
                    }
                }
            }

            // Priority 2: Oldest Unpaid Bills in FIFO order
            if ($reconcileFifoBills && $paymentUnallocated > 0.005) {
                foreach ($eligibleBills as $bill) {
                    if ($paymentUnallocated <= 0.005) break;

                    $rem = $billRemTrackers[$bill->id] ?? 0.0;
                    if ($rem <= 0.005) continue;

                    $canAlloc = round(min($paymentUnallocated, $rem), 2);

                    if ($canAlloc > 0.005) {
                        $paymentUnallocated = round($paymentUnallocated - $canAlloc, 2);
                        $billRemTrackers[$bill->id] = round($rem - $canAlloc, 2);

                        $report['bills_allocated'][] = [
                            'payment_id' => $payment->id,
                            'bill_id'    => $bill->id,
                            'invoice_no' => $bill->invoice,
                            'amount'     => $canAlloc,
                        ];

                        if (!$dryRun) {
                            PaymentAllocation::create([
                                'payment_id' => $payment->id,
                                'bill_id'    => $bill->id,
                                'bill_type'  => $isCustomer ? Sales::class : Purchase::class,
                                'amount'     => $canAlloc,
                            ]);

                            $bill->paid_amount = round((float)$bill->paid_amount + $canAlloc, 2);
                            $bill->remaining_amount = $billRemTrackers[$bill->id];
                            if ($isCustomer) {
                                $bill->status = $bill->remaining_amount <= 0.005 ? 'Paid' : 'Partial';
                            } else {
                                $returns = $this->engine->getTotalReturns($bill, Purchase::class);
                                $netPayable = max(0.0, (float)$bill->net_total - (float)($bill->extra_discount ?? 0));
                                if ($returns >= $netPayable && $netPayable > 0) {
                                    $bill->status = 'Returned';
                                } elseif ($returns > 0) {
                                    $bill->status = 'Partial Return';
                                } else {
                                    $bill->status = 'Completed';
                                }
                            }
                            $bill->save();
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 3: Auto-Close Fractional Rounding Gaps on Returned Invoices
        // ─────────────────────────────────────────────────────────────
        if ($autoCloseRounding) {
            if ($isCustomer) {
                $roundingSales = Sales::where('customer_id', $account->id)
                    ->where('remaining_amount', '>', 0.00)
                    ->where('remaining_amount', '<=', $roundingThreshold)
                    ->where('status', 'Returned')
                    ->get();

                foreach ($roundingSales as $rs) {
                    $report['rounding_gaps_closed'][] = [
                        'bill_id'    => $rs->id,
                        'invoice_no' => $rs->invoice,
                        'residual'   => (float)$rs->remaining_amount,
                    ];

                    if (!$dryRun) {
                        $rs->remaining_amount = 0.00;
                        $rs->save();
                    }
                }
            } else {
                $roundingPurchases = Purchase::where('supplier_id', $account->id)
                    ->where('remaining_amount', '>', 0.00)
                    ->where('remaining_amount', '<=', $roundingThreshold)
                    ->where('status', 'Returned')
                    ->get();

                foreach ($roundingPurchases as $rp) {
                    $report['rounding_gaps_closed'][] = [
                        'bill_id'    => $rp->id,
                        'invoice_no' => $rp->invoice,
                        'residual'   => (float)$rp->remaining_amount,
                    ];

                    if (!$dryRun) {
                        $rp->remaining_amount = 0.00;
                        $rp->save();
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 4: Final Summary & Verification
        // ─────────────────────────────────────────────────────────────
        $report['final_remaining_ob'] = round($runningRemainingOB, 2);

        $totalAllocatedAfter = (float)PaymentAllocation::whereIn('payment_id', $payments->pluck('id'))->sum('amount')
            + ($dryRun ? ($report['ob_allocated'] + collect($report['bills_allocated'])->sum('amount')) : 0);

        $report['unallocated_cash_after'] = round(max(0.0, $totalPaid - $totalAllocatedAfter), 2);
        
        if ($dryRun) {
            $report['ledger_balance_after'] = round((float)$account->current_balance + $simulatedLedgerDiff, 2);
        } else {
            $report['ledger_balance_after'] = (float)$account->fresh()->current_balance;
        }

        $report['is_fully_reconciled'] = (
            $report['ob_allocated'] > 0 ||
            count($report['bills_allocated']) > 0 ||
            count($report['rounding_gaps_closed']) > 0 ||
            count($report['test_vouchers_removed']) > 0
        );

        return $report;
    }

    /**
     * Reconcile all customer and supplier accounts in the system.
     */
    public function reconcileAll(array $options = []): array
    {
        $dryRun = $options['dry_run'] ?? true;

        $parties = Account::where(function ($q) {
            $q->where('sale', 1)->orWhere('purchase', 1);
        })->orderBy('id', 'asc')->get();

        $results = [
            'total_parties_scanned'   => $parties->count(),
            'reconciled_accounts'     => [],
            'total_ob_allocated'      => 0.0,
            'total_bills_settled'     => 0,
            'total_rounding_closed'   => 0,
            'total_test_removed'      => 0,
            'dry_run'                 => $dryRun,
        ];

        DB::beginTransaction();
        try {
            foreach ($parties as $party) {
                $report = $this->reconcileAccount($party, $options);

                if ($report['is_fully_reconciled']) {
                    $results['reconciled_accounts'][] = $report;
                    $results['total_ob_allocated'] = round($results['total_ob_allocated'] + $report['ob_allocated'], 2);
                    $results['total_bills_settled'] += count($report['bills_allocated']);
                    $results['total_rounding_closed'] += count($report['rounding_gaps_closed']);
                    $results['total_test_removed'] += count($report['test_vouchers_removed']);
                }
            }

            if ($dryRun) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error during reconcileAll: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            throw $e;
        }

        return $results;
    }
}
