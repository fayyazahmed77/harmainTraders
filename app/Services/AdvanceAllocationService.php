<?php

namespace App\Services;

use App\Models\Account;
use App\Models\CustomerCredit;
use App\Models\OpeningBalanceAllocation;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Purchase;
use App\Models\PurchaseReturnAllocation;
use App\Models\Sales;
use App\Models\SalesReturnAllocation;
use App\Models\SupplierCredit;

/**
 * Single source of truth for Available Advance calculation, application,
 * rollback, excess-allocation trimming, and checkout-voucher identification
 * across Sales & Purchases.
 *
 * Golden Accounting Invariants:
 * 1. Applying an advance NEVER modifies Cash/Bank/Cheque counter-accounts (0.00 impact).
 * 2. Applying/releasing an advance NEVER modifies any independent Payment voucher's master amount/net_amount.
 * 3. Only genuine unallocated CASH (PaymentAccountingService::getUnallocatedCash) is eligible —
 *    payment discounts, canceled cheques, bounced/returned cheques, and return refunds NEVER create advance.
 * 4. Manual /payment allocations (is_advance = false) are strictly preserved during bill edits
 *    (only trimmed if bill net drops below total allocations).
 * 5. Opening balance advances (CR on Customer / DR on Supplier) are tracked in
 *    `opening_balance_allocations` with sequential CRV-OB-xxxx / CPV-OB-xxxx voucher numbers,
 *    keeping the `payments` table 100% pure so Trial Balance, Ledger, Cashbook, and Reports never double-count.
 */
class AdvanceAllocationService
{
    /**
     * Strictly determine whether a Payment voucher was auto-generated as an Instant Checkout
     * payment for THIS specific bill (Sale or Purchase).
     * Independent advance vouchers from /payment or checkout vouchers from OTHER bills ALWAYS return false.
     */
    public static function isCheckoutPaymentForBill(?Payment $payment, string $invoiceNo): bool
    {
        if (!$payment || trim($invoiceNo) === '') {
            return false;
        }

        $remarks = (string) ($payment->remarks ?? '');
        if (!str_contains($remarks, $invoiceNo)) {
            return false;
        }

        return str_contains($remarks, 'Instance Checkout')
            || str_contains($remarks, 'Instant Checkout')
            || str_contains($remarks, 'Auto-generated from Purchase')
            || str_contains($remarks, 'Auto-generated from Sale');
    }

    /**
     * Get the total amount paid via non-advance payments (Instant Checkout + manual /payment allocations)
     * linked to THIS bill. Used on Edit pages to isolate this bill's settled cash from applied advances.
     */
    public static function getNonAdvancePaidForBill(string $billType, int $billId, string $invoiceNo): array
    {
        $allocations = PaymentAllocation::where('bill_id', $billId)
            ->where('bill_type', $billType)
            ->with('payment')
            ->get();

        $checkoutPaid = 0.0;
        $manualPaymentPaid = 0.0;

        foreach ($allocations as $alloc) {
            if (self::isCheckoutPaymentForBill($alloc->payment, $invoiceNo)) {
                $checkoutPaid += (float) $alloc->amount;
            } elseif (!$alloc->is_advance) {
                $manualPaymentPaid += (float) $alloc->amount;
            }
        }

        return [
            'checkout_paid'       => round($checkoutPaid, 2),
            'manual_payment_paid' => round($manualPaymentPaid, 2),
            'total_non_advance'   => round($checkoutPaid + $manualPaymentPaid, 2),
        ];
    }

    /**
     * Get Instant Checkout payment splits belonging ONLY to this bill (safe for Edit dialog).
     * Never exposes independent advance vouchers or manual /payment vouchers into the checkout splitter.
     */
    public static function getCheckoutSplitsForBill(string $billType, int $billId, string $invoiceNo): array
    {
        return PaymentAllocation::where('bill_id', $billId)
            ->where('bill_type', $billType)
            ->with('payment')
            ->get()
            ->filter(fn ($alloc) => self::isCheckoutPaymentForBill($alloc->payment, $invoiceNo))
            ->map(function ($alloc) {
                $p = $alloc->payment;
                return [
                    'id'                 => $alloc->id,
                    'allocation_id'      => $alloc->id,
                    'payment_id'         => $alloc->payment_id,
                    'voucher_no'         => $p->voucher_no ?? null,
                    'payment_account_id' => $p && $p->payment_account_id ? (string) $p->payment_account_id : '',
                    'amount'             => (float) $alloc->amount,
                    'payment_method'     => $p->payment_method ?? 'Cash',
                    'cheque_no'          => $p->cheque_no ?? '',
                    'cheque_date'        => $p->cheque_date ?? '',
                    'clear_date'         => $p->clear_date ?? '',
                    'cheque_id'          => $p->cheque_id ?? null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Get a read-only summary of all advance allocations currently applied to this bill.
     */
    public static function getAppliedAdvanceSummaryForBill(string $billType, int $billId, string $invoiceNo): array
    {
        $paymentAdvance = (float) PaymentAllocation::where('bill_id', $billId)
            ->where('bill_type', $billType)
            ->where('is_advance', true)
            ->sum('amount');

        $returnCreditAdvance = 0.0;
        if ($billType === Sales::class) {
            $returnCreditAdvance = (float) SalesReturnAllocation::where('sale_id', $billId)
                ->whereIn('sales_return_id', function ($q) {
                    $q->select('sales_return_id')->from('customer_credits');
                })
                ->sum('amount');
        } elseif ($billType === Purchase::class) {
            $returnCreditAdvance = (float) PurchaseReturnAllocation::where('purchase_id', $billId)
                ->whereIn('purchase_return_id', function ($q) {
                    $q->select('purchase_return_id')->from('supplier_credits');
                })
                ->sum('amount');
        }

        $obAdvance = (float) OpeningBalanceAllocation::where('bill_type', $billType)
            ->where('bill_id', $billId)
            ->sum('amount');

        $total = round($paymentAdvance + $returnCreditAdvance + $obAdvance, 2);

        return [
            'payment_advance'         => round($paymentAdvance, 2),
            'return_credit_advance'   => round($returnCreditAdvance, 2),
            'opening_balance_advance' => round($obAdvance, 2),
            'total_applied_advance'   => $total,
            'has_advance_allocated'   => $total > 0.005,
        ];
    }

    /**
     * Compute remaining unallocated Opening Balance Advance for a party.
     * - Customer ('sale' role): only when opening_balance > 0 AND opening_balance_type === 'CR'
     * - Supplier ('purchase' role): only when opening_balance > 0 AND opening_balance_type === 'DR'
     */
    public static function getAvailableOpeningBalanceAdvance(Account $account, string $role): float
    {
        $rawOB = (float) ($account->opening_balance ?? 0);
        if ($rawOB <= 0.005) {
            return 0.0;
        }

        $obType = strtoupper((string) ($account->opening_balance_type ?? ''));
        $isAdvanceOB = ($role === 'sale' && $obType === 'CR')
            || ($role === 'purchase' && $obType === 'DR');

        if (!$isAdvanceOB) {
            return 0.0;
        }

        $billType = $role === 'sale' ? Sales::class : Purchase::class;
        $alreadyAllocated = (float) OpeningBalanceAllocation::where('account_id', $account->id)
            ->where('bill_type', $billType)
            ->sum('amount');

        return max(0.0, round($rawOB - $alreadyAllocated, 2));
    }

    /**
     * Compute the full available advance breakdown for an account.
     * When editing an existing bill ($excludeBillType / $excludeBillId), computes the exact
     * pre-bill balance & advance pool as if this bill's advances were released.
     */
    public static function getAvailableAdvanceBreakdown(
        Account $account,
        string $role,
        ?string $excludeBillType = null,
        ?int $excludeBillId = null
    ): array {
        $account->loadMissing('accountType');
        $currentBalance = (float) $account->current_balance;
        $effectivePreviousBalance = $currentBalance;

        $releasedPaymentAdvance = 0.0;
        $releasedReturnCredit = 0.0;
        $releasedOBAdvance = 0.0;

        if ($excludeBillType && $excludeBillId) {
            if ($excludeBillType === Sales::class) {
                $bill = Sales::find($excludeBillId);
                if ($bill && (int) $bill->customer_id === (int) $account->id) {
                    $origNet = max(0.0, (float) $bill->net_total - (float) ($bill->extra_discount ?? 0));
                    $nonAdv = self::getNonAdvancePaidForBill(Sales::class, $bill->id, (string) $bill->invoice);
                    // Ledger impact of this bill = +origNet - nonAdvanceCashPaid
                    $effectivePreviousBalance = round($currentBalance - ($origNet - $nonAdv['total_non_advance']), 2);

                    $applied = self::getAppliedAdvanceSummaryForBill(Sales::class, $bill->id, (string) $bill->invoice);
                    $releasedPaymentAdvance = $applied['payment_advance'];
                    $releasedReturnCredit = $applied['return_credit_advance'];
                    $releasedOBAdvance = $applied['opening_balance_advance'];
                }
            } elseif ($excludeBillType === Purchase::class) {
                $bill = Purchase::find($excludeBillId);
                if ($bill && (int) $bill->supplier_id === (int) $account->id) {
                    $origNet = max(0.0, (float) $bill->net_total - (float) ($bill->extra_discount ?? 0));
                    $nonAdv = self::getNonAdvancePaidForBill(Purchase::class, $bill->id, (string) $bill->invoice);
                    $effectivePreviousBalance = round($currentBalance - ($origNet - $nonAdv['total_non_advance']), 2);

                    $applied = self::getAppliedAdvanceSummaryForBill(Purchase::class, $bill->id, (string) $bill->invoice);
                    $releasedPaymentAdvance = $applied['payment_advance'];
                    $releasedReturnCredit = $applied['return_credit_advance'];
                    $releasedOBAdvance = $applied['opening_balance_advance'];
                }
            }
        }

        // Source 1: Unallocated genuine CASH vouchers
        $unallocatedCash = self::getEligibleUnallocatedPayments($account->id, $role)
            ->sum(fn ($p) => PaymentAccountingService::getUnallocatedCash($p));
        $unallocatedCash = round($unallocatedCash + $releasedPaymentAdvance, 2);

        // Source 2: Available Return Credit Notes
        if ($role === 'sale') {
            $creditBalance = (float) CustomerCredit::where('customer_id', $account->id)
                ->where('status', '!=', 'Refunded')
                ->where('available_balance', '>', 0)
                ->sum('available_balance');
        } else {
            $creditBalance = (float) SupplierCredit::where('supplier_id', $account->id)
                ->where('status', '!=', 'Refunded')
                ->where('available_balance', '>', 0)
                ->sum('available_balance');
        }
        $creditBalance = round($creditBalance + $releasedReturnCredit, 2);

        // Source 3: Remaining Opening Balance Advance
        $obAdvance = round(self::getAvailableOpeningBalanceAdvance($account, $role) + $releasedOBAdvance, 2);

        $totalSources = round($unallocatedCash + $creditBalance + $obAdvance, 2);
        $netCredit = max(0.0, round(-$effectivePreviousBalance, 2));

        // Applicable advance is strictly capped by BOTH true net credit and allocatable sources
        $applicableAdvance = min($netCredit, $totalSources);

        return [
            'effective_previous_balance' => $effectivePreviousBalance,
            'net_credit'                 => $netCredit,
            'unallocated_cash'           => $unallocatedCash,
            'credit_balance'             => $creditBalance,
            'opening_balance_advance'    => $obAdvance,
            'total_allocatable_sources'  => $totalSources,
            'applicable_advance'         => round($applicableAdvance, 2),
        ];
    }

    /**
     * Fetch unallocated active cash/bank/cheque vouchers eligible to be applied as advance.
     * Strictly excludes canceled/returned cheques and return refund vouchers, and uses
     * cash-only unallocated amount (discount NEVER creates advance).
     */
    private static function getEligibleUnallocatedPayments(int $accountId, string $role)
    {
        $paymentType = $role === 'sale' ? 'RECEIPT' : 'PAYMENT';

        return Payment::where('account_id', $accountId)
            ->where('type', $paymentType)
            ->where(function ($q) {
                $q->where('is_return_refund', false)
                  ->orWhereNull('is_return_refund');
            })
            ->where(function ($q) {
                $q->whereNull('cheque_status')
                  ->orWhereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned', 'Refund']);
            })
            ->with('allocations')
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->filter(fn ($p) => PaymentAccountingService::getUnallocatedCash($p) > 0.005);
    }

    /**
     * Apply available advance to a Sales invoice up to the bill's remaining amount and the customer's true net credit.
     * MUST be called inside a DB transaction.
     */
    public static function applyAdvanceToSale(Sales $sale, ?float $maxCap = null): float
    {
        if (!$sale->customer_id || $sale->remaining_amount <= 0.005) {
            return 0.0;
        }

        $customer = Account::with('accountType')->lockForUpdate()->find($sale->customer_id);
        if (!$customer) {
            return 0.0;
        }

        // Compute true net credit BEFORE this sale's own unpaid impact
        $origNet = max(0.0, (float) $sale->net_total - (float) ($sale->extra_discount ?? 0));
        $nonAdv = self::getNonAdvancePaidForBill(Sales::class, $sale->id, (string) $sale->invoice);
        $preSaleBalance = round((float) $customer->current_balance - ($origNet - $nonAdv['total_non_advance']), 2);
        $netCredit = max(0.0, round(-$preSaleBalance, 2));

        $budget = min((float) $sale->remaining_amount, $netCredit);
        if ($maxCap !== null) {
            $budget = min($budget, max(0.0, round($maxCap, 2)));
        }

        if ($budget <= 0.005) {
            return 0.0;
        }

        $totalApplied = 0.0;

        // 1. Unallocated Cash Receipts (FIFO, strictly cash only — never discount)
        $unallocatedReceipts = self::getEligibleUnallocatedPayments($customer->id, 'sale');
        foreach ($unallocatedReceipts as $p) {
            if ($budget <= 0.005) {
                break;
            }
            $p->load('allocations');
            $availCash = PaymentAccountingService::getUnallocatedCash($p);
            $allocAmt = round(min($budget, $availCash), 2);

            if ($allocAmt > 0.005) {
                PaymentAllocation::create([
                    'payment_id' => $p->id,
                    'bill_id'    => $sale->id,
                    'bill_type'  => Sales::class,
                    'amount'     => $allocAmt,
                    'is_advance' => true,
                ]);
                $budget = round($budget - $allocAmt, 2);
                $totalApplied = round($totalApplied + $allocAmt, 2);
            }
        }

        // 2. CustomerCredit Notes (from Sales Returns, FIFO)
        if ($budget > 0.005) {
            $availableCredits = CustomerCredit::where('customer_id', $customer->id)
                ->where('status', '!=', 'Refunded')
                ->where('available_balance', '>', 0)
                ->orderBy('created_at', 'asc')
                ->lockForUpdate()
                ->get();

            foreach ($availableCredits as $credit) {
                if ($budget <= 0.005) {
                    break;
                }
                $creditAmt = round(min($budget, (float) $credit->available_balance), 2);
                if ($creditAmt > 0.005) {
                    SalesReturnAllocation::create([
                        'sales_return_id' => $credit->sales_return_id,
                        'sale_id'         => $sale->id,
                        'amount'          => $creditAmt,
                    ]);

                    $credit->available_balance = round((float) $credit->available_balance - $creditAmt, 2);
                    if ($credit->available_balance <= 0.005) {
                        $credit->available_balance = 0;
                        $credit->status = 'Used';
                    } else {
                        $credit->status = 'Partial';
                    }
                    $credit->save();

                    $budget = round($budget - $creditAmt, 2);
                    $totalApplied = round($totalApplied + $creditAmt, 2);
                }
            }
        }

        // 3. Opening Balance Advance (CR opening balance -> CRV-OB-xxxx)
        if ($budget > 0.005) {
            $availOB = self::getAvailableOpeningBalanceAdvance($customer, 'sale');
            $obAmt = round(min($budget, $availOB), 2);
            if ($obAmt > 0.005) {
                OpeningBalanceAllocation::create([
                    'voucher_no' => self::generateNextOpeningOffsetVoucherNo('CRV-OB-'),
                    'account_id' => $customer->id,
                    'bill_type'  => Sales::class,
                    'bill_id'    => $sale->id,
                    'date'       => $sale->date ?? now()->toDateString(),
                    'amount'     => $obAmt,
                    'remarks'    => 'Opening Balance Credit Advance applied to Sale ' . $sale->invoice,
                ]);
                $budget = round($budget - $obAmt, 2);
                $totalApplied = round($totalApplied + $obAmt, 2);
            }
        }

        self::recalculateSaleSettlement($sale);

        return $totalApplied;
    }

    /**
     * Apply available advance to a Purchase bill up to the bill's remaining amount and the supplier's true net credit.
     * MUST be called inside a DB transaction.
     */
    public static function applyAdvanceToPurchase(Purchase $purchase, ?float $maxCap = null): float
    {
        if (!$purchase->supplier_id || $purchase->remaining_amount <= 0.005) {
            return 0.0;
        }

        $supplier = Account::with('accountType')->lockForUpdate()->find($purchase->supplier_id);
        if (!$supplier) {
            return 0.0;
        }

        // Compute true net credit BEFORE this purchase's own unpaid impact
        $origNet = max(0.0, (float) $purchase->net_total - (float) ($purchase->extra_discount ?? 0));
        $nonAdv = self::getNonAdvancePaidForBill(Purchase::class, $purchase->id, (string) $purchase->invoice);
        $prePurchaseBalance = round((float) $supplier->current_balance - ($origNet - $nonAdv['total_non_advance']), 2);
        $netCredit = max(0.0, round(-$prePurchaseBalance, 2));

        $budget = min((float) $purchase->remaining_amount, $netCredit);
        if ($maxCap !== null) {
            $budget = min($budget, max(0.0, round($maxCap, 2)));
        }

        if ($budget <= 0.005) {
            return 0.0;
        }

        $totalApplied = 0.0;

        // 1. Unallocated Cash Payments (FIFO, strictly cash only — never discount)
        $unallocatedPayments = self::getEligibleUnallocatedPayments($supplier->id, 'purchase');
        foreach ($unallocatedPayments as $p) {
            if ($budget <= 0.005) {
                break;
            }
            $p->load('allocations');
            $availCash = PaymentAccountingService::getUnallocatedCash($p);
            $allocAmt = round(min($budget, $availCash), 2);

            if ($allocAmt > 0.005) {
                PaymentAllocation::create([
                    'payment_id' => $p->id,
                    'bill_id'    => $purchase->id,
                    'bill_type'  => Purchase::class,
                    'amount'     => $allocAmt,
                    'is_advance' => true,
                ]);
                $budget = round($budget - $allocAmt, 2);
                $totalApplied = round($totalApplied + $allocAmt, 2);
            }
        }

        // 2. SupplierCredit Notes (from Purchase Returns, FIFO)
        if ($budget > 0.005) {
            $availableCredits = SupplierCredit::where('supplier_id', $supplier->id)
                ->where('status', '!=', 'Refunded')
                ->where('available_balance', '>', 0)
                ->orderBy('created_at', 'asc')
                ->lockForUpdate()
                ->get();

            foreach ($availableCredits as $credit) {
                if ($budget <= 0.005) {
                    break;
                }
                $creditAmt = round(min($budget, (float) $credit->available_balance), 2);
                if ($creditAmt > 0.005) {
                    PurchaseReturnAllocation::create([
                        'purchase_return_id' => $credit->purchase_return_id,
                        'purchase_id'        => $purchase->id,
                        'amount'             => $creditAmt,
                    ]);

                    $credit->available_balance = round((float) $credit->available_balance - $creditAmt, 2);
                    if ($credit->available_balance <= 0.005) {
                        $credit->available_balance = 0;
                        $credit->status = 'Used';
                    } else {
                        $credit->status = 'Partial';
                    }
                    $credit->save();

                    $budget = round($budget - $creditAmt, 2);
                    $totalApplied = round($totalApplied + $creditAmt, 2);
                }
            }
        }

        // 3. Opening Balance Advance (DR opening balance -> CPV-OB-xxxx)
        if ($budget > 0.005) {
            $availOB = self::getAvailableOpeningBalanceAdvance($supplier, 'purchase');
            $obAmt = round(min($budget, $availOB), 2);
            if ($obAmt > 0.005) {
                OpeningBalanceAllocation::create([
                    'voucher_no' => self::generateNextOpeningOffsetVoucherNo('CPV-OB-'),
                    'account_id' => $supplier->id,
                    'bill_type'  => Purchase::class,
                    'bill_id'    => $purchase->id,
                    'date'       => $purchase->date ?? now()->toDateString(),
                    'amount'     => $obAmt,
                    'remarks'    => 'Opening Balance Debit Advance applied to Purchase ' . $purchase->invoice,
                ]);
                $budget = round($budget - $obAmt, 2);
                $totalApplied = round($totalApplied + $obAmt, 2);
            }
        }

        self::recalculatePurchaseSettlement($purchase);

        return $totalApplied;
    }

    /**
     * Safely release ONLY advance allocations (is_advance = true PaymentAllocations,
     * CustomerCredit allocations, and OpeningBalanceAllocations) from a Sale.
     * NEVER touches manual /payment allocations or independent Payment voucher master amounts.
     */
    public static function releaseAdvanceFromSale(Sales $sale): void
    {
        PaymentAllocation::where('bill_id', $sale->id)
            ->where('bill_type', Sales::class)
            ->where('is_advance', true)
            ->delete();

        $returnAllocs = SalesReturnAllocation::where('sale_id', $sale->id)->get();
        foreach ($returnAllocs as $retAlloc) {
            $credit = CustomerCredit::where('sales_return_id', $retAlloc->sales_return_id)->lockForUpdate()->first();
            if ($credit) {
                $credit->available_balance = round((float) $credit->available_balance + (float) $retAlloc->amount, 2);
                if ($credit->available_balance >= round((float) $credit->amount, 2) - 0.005) {
                    $credit->available_balance = (float) $credit->amount;
                    $credit->status = 'Available';
                } else {
                    $credit->status = 'Partial';
                }
                $credit->save();
                $retAlloc->delete();
            }
        }

        OpeningBalanceAllocation::where('bill_type', Sales::class)
            ->where('bill_id', $sale->id)
            ->delete();

        self::recalculateSaleSettlement($sale);
    }

    /**
     * Safely release ONLY advance allocations from a Purchase bill.
     * NEVER touches manual /payment allocations or independent Payment voucher master amounts.
     */
    public static function releaseAdvanceFromPurchase(Purchase $purchase): void
    {
        PaymentAllocation::where('bill_id', $purchase->id)
            ->where('bill_type', Purchase::class)
            ->where('is_advance', true)
            ->delete();

        $returnAllocs = PurchaseReturnAllocation::where('purchase_id', $purchase->id)->get();
        foreach ($returnAllocs as $retAlloc) {
            $credit = SupplierCredit::where('purchase_return_id', $retAlloc->purchase_return_id)->lockForUpdate()->first();
            if ($credit) {
                $credit->available_balance = round((float) $credit->available_balance + (float) $retAlloc->amount, 2);
                if ($credit->available_balance >= round((float) $credit->amount, 2) - 0.005) {
                    $credit->available_balance = (float) $credit->amount;
                    $credit->status = 'Available';
                } else {
                    $credit->status = 'Partial';
                }
                $credit->save();
                $retAlloc->delete();
            }
        }

        OpeningBalanceAllocation::where('bill_type', Purchase::class)
            ->where('bill_id', $purchase->id)
            ->delete();

        self::recalculatePurchaseSettlement($purchase);
    }

    /**
     * If a bill's net_payable was reduced on Edit below its remaining payment allocations,
     * trim the excess allocation rows (newest first) so no advance is permanently trapped.
     * NEVER modifies independent Payment vouchers' master amount — the trimmed amount
     * naturally returns to the party as unallocated cash advance.
     */
    public static function trimExcessPaymentAllocations(string $billType, int $billId, float $maxAllowed): void
    {
        $maxAllowed = max(0.0, round($maxAllowed, 2));
        $allocs = PaymentAllocation::where('bill_id', $billId)
            ->where('bill_type', $billType)
            ->orderByDesc('is_advance')
            ->orderByDesc('id')
            ->get();

        $totalAllocated = round((float) $allocs->sum('amount'), 2);
        $excess = round($totalAllocated - $maxAllowed, 2);

        if ($excess <= 0.005) {
            return;
        }

        foreach ($allocs as $alloc) {
            if ($excess <= 0.005) {
                break;
            }
            $amt = (float) $alloc->amount;
            if ($amt <= $excess + 0.005) {
                $excess = round($excess - $amt, 2);
                $alloc->delete();
            } else {
                $alloc->amount = round($amt - $excess, 2);
                $alloc->save();
                $excess = 0.0;
            }
        }
    }

    /**
     * Recompute exact paid_amount and remaining_amount on a Sale from actual DB allocations.
     */
    public static function recalculateSaleSettlement(Sales $sale): void
    {
        $netPayable = max(0.0, round((float) $sale->net_total - (float) ($sale->extra_discount ?? 0), 2));

        $paymentAllocs = (float) PaymentAllocation::where('bill_id', $sale->id)
            ->where('bill_type', Sales::class)
            ->sum('amount');

        $obAllocs = (float) OpeningBalanceAllocation::where('bill_type', Sales::class)
            ->where('bill_id', $sale->id)
            ->sum('amount');

        $creditReturnAllocs = (float) SalesReturnAllocation::where('sale_id', $sale->id)
            ->whereIn('sales_return_id', function ($q) {
                $q->select('sales_return_id')->from('customer_credits');
            })
            ->sum('amount');

        $directReturnAllocs = (float) SalesReturnAllocation::where('sale_id', $sale->id)
            ->whereNotIn('sales_return_id', function ($q) {
                $q->select('sales_return_id')->from('customer_credits');
            })
            ->sum('amount');

        $settledAsPaid = min($netPayable, round($paymentAllocs + $obAllocs + $creditReturnAllocs, 2));
        $remaining = max(0.0, round($netPayable - $settledAsPaid - $directReturnAllocs, 2));

        $sale->paid_amount = $settledAsPaid;
        $sale->remaining_amount = $remaining;
        $sale->save();
    }

    /**
     * Recompute exact paid_amount and remaining_amount on a Purchase from actual DB allocations.
     */
    public static function recalculatePurchaseSettlement(Purchase $purchase): void
    {
        $netPayable = max(0.0, round((float) $purchase->net_total - (float) ($purchase->extra_discount ?? 0), 2));

        $paymentAllocs = (float) PaymentAllocation::where('bill_id', $purchase->id)
            ->where('bill_type', Purchase::class)
            ->sum('amount');

        $obAllocs = (float) OpeningBalanceAllocation::where('bill_type', Purchase::class)
            ->where('bill_id', $purchase->id)
            ->sum('amount');

        $creditReturnAllocs = (float) PurchaseReturnAllocation::where('purchase_id', $purchase->id)
            ->whereIn('purchase_return_id', function ($q) {
                $q->select('purchase_return_id')->from('supplier_credits');
            })
            ->sum('amount');

        $directReturnAllocs = (float) PurchaseReturnAllocation::where('purchase_id', $purchase->id)
            ->whereNotIn('purchase_return_id', function ($q) {
                $q->select('purchase_return_id')->from('supplier_credits');
            })
            ->sum('amount');

        $settledAsPaid = min($netPayable, round($paymentAllocs + $obAllocs + $creditReturnAllocs, 2));
        $remaining = max(0.0, round($netPayable - $settledAsPaid - $directReturnAllocs, 2));

        $purchase->paid_amount = $settledAsPaid;
        $purchase->remaining_amount = $remaining;
        $purchase->save();
    }

    /**
     * Generate sequential CRV-OB-0001 / CPV-OB-0001 voucher numbers inside the current DB transaction.
     */
    public static function generateNextOpeningOffsetVoucherNo(string $prefix): string
    {
        $last = OpeningBalanceAllocation::where('voucher_no', 'LIKE', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('voucher_no');

        $nextNum = 1;
        if ($last && preg_match('/' . preg_quote(rtrim($prefix, '-'), '/') . '-(\d+)/', $last, $matches)) {
            $nextNum = (int) $matches[1] + 1;
        }

        $candidate = $prefix . str_pad((string) $nextNum, 4, '0', STR_PAD_LEFT);
        while (OpeningBalanceAllocation::where('voucher_no', $candidate)->exists()) {
            $nextNum++;
            $candidate = $prefix . str_pad((string) $nextNum, 4, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }
}
