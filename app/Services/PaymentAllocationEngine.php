<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\SalesReturn;
use App\Models\PurchaseReturn;
use App\Models\SalesReturnAllocation;
use App\Models\PurchaseReturnAllocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentAllocationEngine
{
    /**
     * Get verified remaining opening balance for an account.
     *
     * @param Account $account
     * @param string|null $beforeDate Optional date cutoff
     * @return float Remaining unsettled opening balance (always >= 0)
     */
    public function getRemainingOpeningBalance(Account $account, ?string $beforeDate = null): float
    {
        $rawOB = (float)($account->opening_balance ?? 0);
        if ($rawOB <= 0.005) {
            return 0.0;
        }

        $type = strtolower($account->accountType->name ?? '');
        $isCrNormal = in_array((int)$account->type, [6, 9, 17, 18])
            || in_array($type, ['supplier', 'capital', 'amanat payable', 'reserve'])
            || (bool)($account->purchase ?? false);

        $obType = strtoupper($account->opening_balance_type ?? ($isCrNormal ? 'CR' : 'DR'));

        // Only natural debt can be settled via receipts/payments:
        // - DR opening balance on Customer represents receivable debt to be settled by receipts.
        // - CR opening balance on Supplier represents payable debt to be settled by payments.
        $isSettleable = ($isCrNormal && $obType === 'CR') || (!$isCrNormal && $obType === 'DR');
        if (!$isSettleable) {
            return 0.0;
        }

        $query = PaymentAllocation::where('bill_type', Account::class)
            ->where('bill_id', $account->id);

        if ($beforeDate) {
            $query->whereHas('payment', function ($q) use ($beforeDate) {
                $q->whereDate('date', '<=', $beforeDate)
                  ->where(function ($sub) {
                      $sub->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])
                          ->orWhereNull('cheque_status');
                  });
            });
        } else {
            $query->whereHas('payment', function ($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])
                  ->orWhereNull('cheque_status');
            });
        }

        $settledOB = (float)$query->sum('amount');
        return max(0.0, round($rawOB - $settledOB, 2));
    }

    /**
     * Allocate Customer Receipt with Mandatory Opening Balance First.
     *
     * @param Payment|iterable $payments Single payment or collection/array of split payments
     * @param float|null $grossAmount Optional explicit amount (Cash + Discount). If null, computed from payments.
     * @param array $selectedBills Optional explicit bills from user (Mode B)
     * @return array Allocation audit breakdown
     */
    public function allocateCustomerReceipt($payments, ?float $grossAmount = null, array $selectedBills = []): array
    {
        return DB::transaction(function () use ($payments, $grossAmount, $selectedBills) {
            $paymentList = $this->resolvePaymentList($payments);
            if (empty($paymentList)) {
                return ['opening_balance_allocated' => 0.0, 'invoices_allocated' => [], 'unallocated_advance' => 0.0];
            }

            $firstPayment = $paymentList[0];
            $account = Account::lockForUpdate()->findOrFail($firstPayment->account_id);

            $paymentTrackers = $this->buildPaymentTrackers($paymentList);
            $totalAvailable = collect($paymentTrackers)->sum(fn($t) => $t['cash'] + $t['discount']);
            $remainingFunds = $grossAmount !== null ? round(min($grossAmount, $totalAvailable), 2) : round($totalAvailable, 2);

            $breakdown = [
                'opening_balance_allocated' => 0.0,
                'invoices_allocated'        => [],
                'unallocated_advance'       => 0.0,
            ];

            // ─────────────────────────────────────────────────────────────
            // PRIORITY 1: MANDATORY OPENING BALANCE FIRST
            // ─────────────────────────────────────────────────────────────
            $unsettledOB = $this->getRemainingOpeningBalance($account);

            if ($unsettledOB > 0.005 && $remainingFunds > 0.005) {
                $allocToOB = round(min($unsettledOB, $remainingFunds), 2);
                if ($allocToOB > 0.005) {
                    $actualOBAlloc = $this->recordAllocation($paymentTrackers, Account::class, $account->id, $allocToOB);
                    $remainingFunds = round($remainingFunds - $actualOBAlloc, 2);
                    $breakdown['opening_balance_allocated'] = $actualOBAlloc;
                }
            }

            // If funds are exhausted by Opening Balance, STOP. Invoices receive ZERO allocation.
            if ($remainingFunds <= 0.005) {
                $breakdown['unallocated_advance'] = 0.0;
                return $breakdown;
            }

            // ─────────────────────────────────────────────────────────────
            // PRIORITY 2: INVOICE SETTLEMENT (Mode B or Mode A)
            // ─────────────────────────────────────────────────────────────
            $normalizedSelections = $this->normalizeSelections($selectedBills);
            $hasExplicitSelections = !empty($normalizedSelections);

            if ($hasExplicitSelections) {
                // MODE B: User-Selected Invoices
                foreach ($normalizedSelections as $selection) {
                    if ($remainingFunds <= 0.005) break;

                    $saleId = $selection['bill_id'];
                    $sale = Sales::where('id', $saleId)
                        ->where('customer_id', $account->id)
                        ->whereNotIn('status', ['Canceled', 'Cancelled'])
                        ->lockForUpdate()
                        ->first();

                    if (!$sale) continue;

                    $netPayable = max(0.0, (float)$sale->net_total - (float)($sale->extra_discount ?? 0));
                    $returns = $this->getTotalReturns($sale, Sales::class);
                    $billRem = max(0.0, round($netPayable - (float)$sale->paid_amount - $returns, 2));

                    if ($billRem <= 0.005) continue;

                    $requestedAmount = $selection['amount'] !== null ? min((float)$selection['amount'], $billRem) : $billRem;
                    $canAllocate = round(min($remainingFunds, $requestedAmount, $billRem), 2);

                    if ($canAllocate > 0.005) {
                        $actualAlloc = $this->recordAllocation($paymentTrackers, Sales::class, $sale->id, $canAllocate);

                        $sale->paid_amount = round((float)$sale->paid_amount + $actualAlloc, 2);
                        $sale->remaining_amount = max(0.0, round($netPayable - $sale->paid_amount - $returns, 2));
                        $sale->status = $sale->remaining_amount <= 0.005 ? 'Paid' : 'Partial';
                        $sale->save();

                        $remainingFunds = round($remainingFunds - $actualAlloc, 2);
                        $breakdown['invoices_allocated'][] = [
                            'bill_id'    => $sale->id,
                            'invoice_no' => $sale->invoice,
                            'amount'     => $actualAlloc,
                            'remaining'  => $sale->remaining_amount,
                        ];
                    }
                }
            } else {
                // MODE A: Automatic FIFO (Oldest Date first, then Lowest ID)
                $unpaidSales = Sales::where('customer_id', $account->id)
                    ->where('remaining_amount', '>', 0.005)
                    ->whereNotIn('status', ['Canceled', 'Cancelled', 'Returned'])
                    ->orderBy('date', 'asc')
                    ->orderBy('id', 'asc')
                    ->lockForUpdate()
                    ->get();

                foreach ($unpaidSales as $sale) {
                    if ($remainingFunds <= 0.005) break;

                    $netPayable = max(0.0, (float)$sale->net_total - (float)($sale->extra_discount ?? 0));
                    $returns = $this->getTotalReturns($sale, Sales::class);
                    $billRem = max(0.0, round($netPayable - (float)$sale->paid_amount - $returns, 2));

                    if ($billRem <= 0.005) continue;

                    $canAllocate = round(min($remainingFunds, $billRem), 2);

                    if ($canAllocate > 0.005) {
                        $actualAlloc = $this->recordAllocation($paymentTrackers, Sales::class, $sale->id, $canAllocate);

                        $sale->paid_amount = round((float)$sale->paid_amount + $actualAlloc, 2);
                        $sale->remaining_amount = max(0.0, round($netPayable - $sale->paid_amount - $returns, 2));
                        $sale->status = $sale->remaining_amount <= 0.005 ? 'Paid' : 'Partial';
                        $sale->save();

                        $remainingFunds = round($remainingFunds - $actualAlloc, 2);
                        $breakdown['invoices_allocated'][] = [
                            'bill_id'    => $sale->id,
                            'invoice_no' => $sale->invoice,
                            'amount'     => $actualAlloc,
                            'remaining'  => $sale->remaining_amount,
                        ];
                    }
                }
            }

            // ─────────────────────────────────────────────────────────────
            // PRIORITY 3: GENUINE SURPLUS CASH (Customer Advance)
            // ─────────────────────────────────────────────────────────────
            $breakdown['unallocated_advance'] = max(0.0, $remainingFunds);
            return $breakdown;
        });
    }

    /**
     * Allocate Supplier Payment with Mandatory Opening Balance First.
     *
     * @param Payment|iterable $payments Single payment or collection/array of split payments
     * @param float|null $grossAmount Optional explicit amount (Cash + Discount). If null, computed from payments.
     * @param array $selectedBills Optional explicit bills from user (Mode B)
     * @return array Allocation audit breakdown
     */
    public function allocateSupplierPayment($payments, ?float $grossAmount = null, array $selectedBills = []): array
    {
        return DB::transaction(function () use ($payments, $grossAmount, $selectedBills) {
            $paymentList = $this->resolvePaymentList($payments);
            if (empty($paymentList)) {
                return ['opening_balance_allocated' => 0.0, 'invoices_allocated' => [], 'unallocated_advance' => 0.0];
            }

            $firstPayment = $paymentList[0];
            $account = Account::lockForUpdate()->findOrFail($firstPayment->account_id);

            $paymentTrackers = $this->buildPaymentTrackers($paymentList);
            $totalAvailable = collect($paymentTrackers)->sum(fn($t) => $t['cash'] + $t['discount']);
            $remainingFunds = $grossAmount !== null ? round(min($grossAmount, $totalAvailable), 2) : round($totalAvailable, 2);

            $breakdown = [
                'opening_balance_allocated' => 0.0,
                'invoices_allocated'        => [],
                'unallocated_advance'       => 0.0,
            ];

            // ─────────────────────────────────────────────────────────────
            // PRIORITY 1: MANDATORY OPENING BALANCE FIRST
            // ─────────────────────────────────────────────────────────────
            $unsettledOB = $this->getRemainingOpeningBalance($account);

            if ($unsettledOB > 0.005 && $remainingFunds > 0.005) {
                $allocToOB = round(min($unsettledOB, $remainingFunds), 2);
                if ($allocToOB > 0.005) {
                    $actualOBAlloc = $this->recordAllocation($paymentTrackers, Account::class, $account->id, $allocToOB);
                    $remainingFunds = round($remainingFunds - $actualOBAlloc, 2);
                    $breakdown['opening_balance_allocated'] = $actualOBAlloc;
                }
            }

            // If funds are exhausted by Opening Balance, STOP. Purchase bills receive ZERO allocation.
            if ($remainingFunds <= 0.005) {
                $breakdown['unallocated_advance'] = 0.0;
                return $breakdown;
            }

            // ─────────────────────────────────────────────────────────────
            // PRIORITY 2: PURCHASE BILL SETTLEMENT (Mode B or Mode A)
            // ─────────────────────────────────────────────────────────────
            $normalizedSelections = $this->normalizeSelections($selectedBills);
            $hasExplicitSelections = !empty($normalizedSelections);

            if ($hasExplicitSelections) {
                // MODE B: User-Selected Purchases
                foreach ($normalizedSelections as $selection) {
                    if ($remainingFunds <= 0.005) break;

                    $purchaseId = $selection['bill_id'];
                    $purchase = Purchase::where('id', $purchaseId)
                        ->where('supplier_id', $account->id)
                        ->whereNotIn('status', ['Canceled', 'Cancelled'])
                        ->lockForUpdate()
                        ->first();

                    if (!$purchase) continue;

                    $netPayable = max(0.0, (float)$purchase->net_total - (float)($purchase->extra_discount ?? 0));
                    $returns = $this->getTotalReturns($purchase, Purchase::class);
                    $billRem = max(0.0, round($netPayable - (float)$purchase->paid_amount - $returns, 2));

                    if ($billRem <= 0.005) continue;

                    $requestedAmount = $selection['amount'] !== null ? min((float)$selection['amount'], $billRem) : $billRem;
                    $canAllocate = round(min($remainingFunds, $requestedAmount, $billRem), 2);

                    if ($canAllocate > 0.005) {
                        $actualAlloc = $this->recordAllocation($paymentTrackers, Purchase::class, $purchase->id, $canAllocate);

                        $purchase->paid_amount = round((float)$purchase->paid_amount + $actualAlloc, 2);
                        $purchase->remaining_amount = max(0.0, round($netPayable - $purchase->paid_amount - $returns, 2));

                        if ($returns >= $netPayable) {
                            $purchase->status = 'Returned';
                        } elseif ($returns > 0) {
                            $purchase->status = 'Partial Return';
                        } else {
                            $purchase->status = 'Completed';
                        }
                        $purchase->save();

                        $remainingFunds = round($remainingFunds - $actualAlloc, 2);
                        $breakdown['invoices_allocated'][] = [
                            'bill_id'    => $purchase->id,
                            'invoice_no' => $purchase->invoice,
                            'amount'     => $actualAlloc,
                            'remaining'  => $purchase->remaining_amount,
                        ];
                    }
                }
            } else {
                // MODE A: Automatic FIFO (Oldest Date first, then Lowest ID)
                $unpaidPurchases = Purchase::where('supplier_id', $account->id)
                    ->where('remaining_amount', '>', 0.005)
                    ->whereNotIn('status', ['Canceled', 'Cancelled', 'Returned'])
                    ->orderBy('date', 'asc')
                    ->orderBy('id', 'asc')
                    ->lockForUpdate()
                    ->get();

                foreach ($unpaidPurchases as $purchase) {
                    if ($remainingFunds <= 0.005) break;

                    $netPayable = max(0.0, (float)$purchase->net_total - (float)($purchase->extra_discount ?? 0));
                    $returns = $this->getTotalReturns($purchase, Purchase::class);
                    $billRem = max(0.0, round($netPayable - (float)$purchase->paid_amount - $returns, 2));

                    if ($billRem <= 0.005) continue;

                    $canAllocate = round(min($remainingFunds, $billRem), 2);

                    if ($canAllocate > 0.005) {
                        $actualAlloc = $this->recordAllocation($paymentTrackers, Purchase::class, $purchase->id, $canAllocate);

                        $purchase->paid_amount = round((float)$purchase->paid_amount + $actualAlloc, 2);
                        $purchase->remaining_amount = max(0.0, round($netPayable - $purchase->paid_amount - $returns, 2));

                        if ($returns >= $netPayable) {
                            $purchase->status = 'Returned';
                        } elseif ($returns > 0) {
                            $purchase->status = 'Partial Return';
                        } else {
                            $purchase->status = 'Completed';
                        }
                        $purchase->save();

                        $remainingFunds = round($remainingFunds - $actualAlloc, 2);
                        $breakdown['invoices_allocated'][] = [
                            'bill_id'    => $purchase->id,
                            'invoice_no' => $purchase->invoice,
                            'amount'     => $actualAlloc,
                            'remaining'  => $purchase->remaining_amount,
                        ];
                    }
                }
            }

            // ─────────────────────────────────────────────────────────────
            // PRIORITY 3: GENUINE SURPLUS CASH (Supplier Advance)
            // ─────────────────────────────────────────────────────────────
            $breakdown['unallocated_advance'] = max(0.0, $remainingFunds);
            return $breakdown;
        });
    }

    /**
     * Reverse and delete all allocations for one or more payment vouchers.
     * Safely restores invoice paid amounts, remaining amounts, and statuses.
     * Restores opening balance by removing the allocation row.
     *
     * @param Payment|iterable $payments
     */
    public function reverseAllocations($payments): void
    {
        $paymentList = $this->resolvePaymentList($payments);

        DB::transaction(function () use ($paymentList) {
            foreach ($paymentList as $payment) {
                if (!$payment) continue;
                $allocations = PaymentAllocation::where('payment_id', $payment->id)->get();

                foreach ($allocations as $allocation) {
                    if ($allocation->bill_type === Sales::class) {
                        $sale = Sales::lockForUpdate()->find($allocation->bill_id);
                        if ($sale) {
                            $sale->paid_amount = max(0.0, round((float)$sale->paid_amount - (float)$allocation->amount, 2));
                            $netPayable = max(0.0, (float)$sale->net_total - (float)($sale->extra_discount ?? 0));
                            $returns = $this->getTotalReturns($sale, Sales::class);
                            $sale->remaining_amount = max(0.0, round($netPayable - $sale->paid_amount - $returns, 2));
                            $sale->status = ($sale->remaining_amount <= 0.005) ? 'Paid' : (($sale->paid_amount > 0) ? 'Partial' : 'Unpaid');
                            $sale->save();
                        }
                    } elseif ($allocation->bill_type === Purchase::class) {
                        $purchase = Purchase::lockForUpdate()->find($allocation->bill_id);
                        if ($purchase) {
                            $purchase->paid_amount = max(0.0, round((float)$purchase->paid_amount - (float)$allocation->amount, 2));
                            $netPayable = max(0.0, (float)$purchase->net_total - (float)($purchase->extra_discount ?? 0));
                            $returns = $this->getTotalReturns($purchase, Purchase::class);
                            $purchase->remaining_amount = max(0.0, round($netPayable - $purchase->paid_amount - $returns, 2));

                            if ($returns >= $netPayable) {
                                $purchase->status = 'Returned';
                            } elseif ($returns > 0) {
                                $purchase->status = 'Partial Return';
                            } else {
                                $purchase->status = 'Completed';
                            }
                            $purchase->save();
                        }
                    }
                    // For Account::class, deleting the allocation row automatically restores the opening balance.
                    $allocation->delete();
                }
            }
        });
    }

    /**
     * Record allocation across payment(s), allocating physical cash first, then discount.
     *
     * @param array &$paymentTrackers
     * @param string $billType
     * @param int $billId
     * @param float $amountToAllocate
     * @return float Amount actually allocated
     */
    private function recordAllocation(array &$paymentTrackers, string $billType, int $billId, float $amountToAllocate): float
    {
        $amountRemaining = round($amountToAllocate, 2);
        if ($amountRemaining <= 0.005) {
            return 0.0;
        }

        // Pass 1: Draw from available physical cash first
        foreach ($paymentTrackers as &$tracker) {
            if ($amountRemaining <= 0.005) break;
            if ($tracker['cash'] > 0.005) {
                $canAlloc = round(min($amountRemaining, $tracker['cash']), 2);
                if ($canAlloc > 0.005) {
                    PaymentAllocation::create([
                        'payment_id' => $tracker['payment']->id,
                        'bill_type'  => $billType,
                        'bill_id'    => $billId,
                        'amount'     => $canAlloc,
                    ]);
                    $tracker['cash'] = round($tracker['cash'] - $canAlloc, 2);
                    $amountRemaining = round($amountRemaining - $canAlloc, 2);
                }
            }
        }
        unset($tracker);

        // Pass 2: Draw from available discount if cash was exhausted
        foreach ($paymentTrackers as &$tracker) {
            if ($amountRemaining <= 0.005) break;
            if ($tracker['discount'] > 0.005) {
                $canAlloc = round(min($amountRemaining, $tracker['discount']), 2);
                if ($canAlloc > 0.005) {
                    PaymentAllocation::create([
                        'payment_id' => $tracker['payment']->id,
                        'bill_type'  => $billType,
                        'bill_id'    => $billId,
                        'amount'     => $canAlloc,
                    ]);
                    $tracker['discount'] = round($tracker['discount'] - $canAlloc, 2);
                    $amountRemaining = round($amountRemaining - $canAlloc, 2);
                }
            }
        }
        unset($tracker);

        return round($amountToAllocate - $amountRemaining, 2);
    }

    /**
     * Convert Payment|iterable to a flat array of Payment models.
     */
    private function resolvePaymentList($payments): array
    {
        if ($payments instanceof Payment) {
            return [$payments];
        }
        if (is_array($payments)) {
            return array_values($payments);
        }
        if (is_iterable($payments)) {
            return iterator_to_array($payments, false);
        }
        return [];
    }

    /**
     * Build allocation trackers for a list of payments.
     */
    private function buildPaymentTrackers(array $paymentList): array
    {
        $trackers = [];
        foreach ($paymentList as $p) {
            $trackers[] = [
                'payment'  => $p,
                'cash'     => max(0.0, (float)$p->amount),
                'discount' => max(0.0, (float)($p->discount ?? 0)),
            ];
        }
        return $trackers;
    }

    /**
     * Compute total returns applied to a sales or purchase document.
     */
    public function getTotalReturns($bill, string $billType): float
    {
        if ($billType === Sales::class) {
            $allocatedReturns = (float) SalesReturnAllocation::where('sale_id', $bill->id)->sum('amount');
            $directReturns = (float) SalesReturn::where(function ($q) use ($bill) {
                $q->where('sale_id', $bill->id)
                  ->orWhere(function ($sub) use ($bill) {
                      $sub->whereNull('sale_id')
                          ->where('original_invoice', $bill->invoice)
                          ->where('customer_id', $bill->customer_id);
                  });
            })->whereNotIn('id', function ($sub) {
                $sub->select('sales_return_id')->from('sales_return_allocations');
            })->sum(DB::raw('net_total - extra_discount'));

            return round($allocatedReturns + $directReturns, 2);
        } else {
            $allocatedReturns = (float) PurchaseReturnAllocation::where('purchase_id', $bill->id)->sum('amount');
            $directReturns = (float) PurchaseReturn::where('original_invoice', $bill->invoice)
                ->where('supplier_id', $bill->supplier_id)
                ->whereNotIn('id', function ($sub) {
                    $sub->select('purchase_return_id')->from('purchase_return_allocations');
                })->sum(DB::raw('net_total - extra_discount'));

            return round($allocatedReturns + $directReturns, 2);
        }
    }

    /**
     * Normalize incoming bill selection payload from UI / API.
     */
    private function normalizeSelections(array $selectedBills): array
    {
        $normalized = [];
        foreach ($selectedBills as $key => $item) {
            if (is_array($item)) {
                $billId = $item['bill_id'] ?? $item['id'] ?? null;
                $amount = isset($item['amount']) && is_numeric($item['amount']) ? (float)$item['amount'] : null;
                $type = $item['bill_type'] ?? $item['type'] ?? null;
            } elseif (is_numeric($item) && is_numeric($key)) {
                $billId = (int)$item;
                $amount = null;
                $type = null;
            } elseif (is_numeric($item) && !is_numeric($key)) {
                $billId = (int)$key;
                $amount = (float)$item;
                $type = null;
            } else {
                continue;
            }

            // Exclude opening balance (handled automatically in Priority 1) and zero-amount entries
            if ($billId && $type !== Account::class) {
                if ($amount !== null && $amount <= 0.005) {
                    continue;
                }
                $normalized[] = [
                    'bill_id' => (int)$billId,
                    'amount'  => $amount,
                ];
            }
        }
        return $normalized;
    }
}
