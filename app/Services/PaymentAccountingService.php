<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;

class PaymentAccountingService
{
    /**
     * Get recognized discount for a payment voucher.
     * Discount is recognized ONLY to the extent that Cash alone is insufficient to cover allocated settlement.
     * If Cash >= Allocated Settlement, recognized discount is 0.
     * Unallocated discount is 0 and CAN NEVER create store credit or advance.
     */
    public static function getRecognizedDiscount(Payment $payment): float
    {
        $allocatedSettlement = (float)$payment->allocations()->sum('amount');
        if ($allocatedSettlement > 0) {
            $cashAllocated = min((float)$payment->amount, $allocatedSettlement);
            return max(0.0, $allocatedSettlement - $cashAllocated);
        }
        return (float)($payment->discount ?? 0);
    }

    /**
     * Get recognized net settlement value for a payment voucher.
     * Recognized Settlement = Cash Amount + Recognized Discount.
     */
    public static function getRecognizedNetSettlement(Payment $payment): float
    {
        return (float)$payment->amount + self::getRecognizedDiscount($payment);
    }

    /**
     * Get unallocated cash (Advance Payment) for a payment voucher.
     * Advance Payment is strictly UNALLOCATED CASH (Cash Received - Cash Allocated to Bills).
     * Discount CAN NEVER generate, increase, or convert into an advance.
     */
    public static function getUnallocatedCash(Payment $payment): float
    {
        $allocatedSettlement = (float)$payment->allocations()->sum('amount');
        $cashAllocated = min((float)$payment->amount, $allocatedSettlement);
        return max(0.0, (float)$payment->amount - $cashAllocated);
    }

    /**
     * Calculate Customer Ledger Balance.
     */
    public static function getCustomerCurrentBalance(Account $account): float
    {
        $totalSales = (float)$account->sales()->sum('net_total') - (float)$account->sales()->sum('extra_discount');
        $totalReturns = (float)$account->salesReturns()->sum('net_total') - (float)$account->salesReturns()->sum('extra_discount');

        $receipts = $account->partyPayments()->where('type', 'RECEIPT')
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
            })->with('allocations')->get();

        $totalReceiptsSettlement = 0.0;
        foreach ($receipts as $r) {
            $totalReceiptsSettlement += self::getRecognizedNetSettlement($r);
        }

        $payments = $account->partyPayments()->where('type', 'PAYMENT')
            ->where('is_return_refund', false)
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
            })->with('allocations')->get();

        $totalPaymentsSettlement = 0.0;
        foreach ($payments as $p) {
            $totalPaymentsSettlement += self::getRecognizedNetSettlement($p);
        }

        // getSignedOpeningBalance() returns:
        //   +OB if customer has DR opening (money owed to us) → adds to balance
        //   -OB if customer has CR opening (advance received) → reduces balance
        return $account->getSignedOpeningBalance() + $totalSales + $totalPaymentsSettlement - $totalReturns - $totalReceiptsSettlement;
    }

    /**
     * Calculate Supplier Ledger Balance.
     */
    public static function getSupplierCurrentBalance(Account $account): float
    {
        $totalPurchases = (float)$account->purchases()->sum('net_total') - (float)$account->purchases()->sum('extra_discount');
        $totalReturns = (float)$account->purchaseReturns()->sum('net_total') - (float)$account->purchaseReturns()->sum('extra_discount');

        $payments = $account->partyPayments()->where('type', 'PAYMENT')
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
            })->with('allocations')->get();

        $totalPaymentsSettlement = 0.0;
        foreach ($payments as $p) {
            $totalPaymentsSettlement += self::getRecognizedNetSettlement($p);
        }

        $receipts = $account->partyPayments()->where('type', 'RECEIPT')
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
            })->with('allocations')->get();

        $totalReceiptsSettlement = 0.0;
        foreach ($receipts as $r) {
            $totalReceiptsSettlement += self::getRecognizedNetSettlement($r);
        }

        // getSignedOpeningBalance() returns:
        //   +OB if supplier has CR opening (money we owe supplier) → adds to balance
        //   -OB if supplier has DR opening (advance paid to supplier) → reduces balance
        return $account->getSignedOpeningBalance() + $totalPurchases + $totalReceiptsSettlement - $totalReturns - $totalPaymentsSettlement;
    }

    /**
     * Get Total Advance Balance for an Account (Sum of unallocated cash across active payments).
     */
    public static function getAccountAdvanceBalance(Account $account): float
    {
        $type = strtolower($account->accountType->name ?? '');

        if ($type === 'customers') {
            $receipts = $account->partyPayments()->where('type', 'RECEIPT')
                ->whereNotIn('cheque_status', ['Canceled', 'Returned'])
                ->where('is_return_refund', false)
                ->with('allocations')->get();

            $totalUnallocatedCash = 0.0;
            foreach ($receipts as $r) {
                $totalUnallocatedCash += self::getUnallocatedCash($r);
            }
            return $totalUnallocatedCash;
        } elseif ($type === 'supplier') {
            $payments = $account->partyPayments()->where('type', 'PAYMENT')
                ->whereNotIn('cheque_status', ['Canceled', 'Returned'])
                ->with('allocations')->get();

            $totalUnallocatedCash = 0.0;
            foreach ($payments as $p) {
                $totalUnallocatedCash += self::getUnallocatedCash($p);
            }
            return $totalUnallocatedCash;
        }

        return 0.0;
    }

    /**
     * Calculate Unified Net Party Balance for Multi-Role or Cross-Module Accounts.
     * Follows standard double-entry principles:
     *   Debits (DR):
     *     - DR Opening Balance (money owed to us)
     *     - Sales (Invoices owed by customer)
     *     - Payments made TO party (Debit party)
     *     - Purchase Returns
     *   Credits (CR):
     *     - CR Opening Balance (money owed by us / advance received)
     *     - Purchases (Bills owed to supplier)
     *     - Receipts received FROM party (Credit party)
     *     - Sales Returns
     */
    public static function getPartyNetBalance(Account $account): array
    {
        $totalSales = (float)$account->sales()->sum(DB::raw('net_total - COALESCE(extra_discount, 0)'));
        $totalSalesReturns = (float)$account->salesReturns()->sum(DB::raw('net_total - COALESCE(extra_discount, 0)'));

        $totalPurchases = (float)$account->purchases()->sum(DB::raw('net_total - COALESCE(extra_discount, 0)'));
        $totalPurchaseReturns = (float)$account->purchaseReturns()->sum(DB::raw('net_total - COALESCE(extra_discount, 0)'));

        $receipts = $account->partyPayments()->where('type', 'RECEIPT')
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
            })->with('allocations')->get();

        $totalReceiptsSettlement = 0.0;
        foreach ($receipts as $r) {
            $totalReceiptsSettlement += self::getRecognizedNetSettlement($r);
        }

        $payments = $account->partyPayments()->where('type', 'PAYMENT')
            ->where('is_return_refund', false)
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
            })->with('allocations')->get();

        $totalPaymentsSettlement = 0.0;
        foreach ($payments as $p) {
            $totalPaymentsSettlement += self::getRecognizedNetSettlement($p);
        }

        $rawOB = (float)($account->opening_balance ?? 0);
        $obType = strtoupper($account->opening_balance_type ?? 'DR');
        $obDR = $obType === 'DR' ? $rawOB : 0.0;
        $obCR = $obType === 'CR' ? $rawOB : 0.0;

        $totalDR = $obDR + $totalSales + $totalPaymentsSettlement + $totalPurchaseReturns;
        $totalCR = $obCR + $totalPurchases + $totalReceiptsSettlement + $totalSalesReturns;

        $netDiff = $totalDR - $totalCR;

        return [
            'total_dr'        => $totalDR,
            'total_cr'        => $totalCR,
            'net_balance'     => abs($netDiff),
            'signed_balance'  => $netDiff,
            'orientation'     => $netDiff >= 0 ? 'DR' : 'CR',
        ];
    }

    /**
     * Efficiently bulk-calculate and attach real-time current_balance to a collection of accounts.
     * Prevents N+1 queries during listing / serialization while ensuring 100% accurate balances.
     */
    public static function attachBulkBalances($accounts): void
    {
        if (!$accounts || $accounts->isEmpty()) {
            return;
        }

        // Defensive check: ensure opening balance fields are loaded on all models
        $missingOBIds = $accounts->filter(function ($a) {
            return !array_key_exists('opening_balance', $a->getAttributes()) || !array_key_exists('opening_balance_type', $a->getAttributes());
        })->pluck('id')->toArray();

        if (!empty($missingOBIds)) {
            $obs = DB::table('accounts')->whereIn('id', $missingOBIds)->select('id', 'opening_balance', 'opening_balance_type')->get()->keyBy('id');
            foreach ($accounts as $a) {
                if (isset($obs[$a->id])) {
                    $a->setAttribute('opening_balance', $obs[$a->id]->opening_balance);
                    $a->setAttribute('opening_balance_type', $obs[$a->id]->opening_balance_type);
                }
            }
        }

        // Ensure purchase and sale flags are loaded
        $missingFlags = $accounts->filter(function ($a) {
            return !array_key_exists('purchase', $a->getAttributes()) || !array_key_exists('sale', $a->getAttributes());
        })->pluck('id')->toArray();

        if (!empty($missingFlags)) {
            $flags = DB::table('accounts')->whereIn('id', $missingFlags)->select('id', 'purchase', 'sale')->get()->keyBy('id');
            foreach ($accounts as $a) {
                if (isset($flags[$a->id])) {
                    $a->setAttribute('purchase', $flags[$a->id]->purchase);
                    $a->setAttribute('sale', $flags[$a->id]->sale);
                }
            }
        }

        // Group accounts by role
        $customerIds = [];
        $supplierIds = [];

        foreach ($accounts as $account) {
            if (array_key_exists('current_balance', $account->getAttributes()) && $account->getAttributes()['current_balance'] !== null) {
                continue;
            }

            $type = strtolower($account->accountType->name ?? '');
            $hasPurchase = (bool)($account->purchase ?? false);
            $hasSale = (bool)($account->sale ?? false);

            if ($hasPurchase && $hasSale) {
                $customerIds[] = $account->id;
                $supplierIds[] = $account->id;
            } elseif ($type === 'customers') {
                $customerIds[] = $account->id;
            } elseif ($type === 'supplier') {
                $supplierIds[] = $account->id;
            }
        }

        $customerIds = array_values(array_unique($customerIds));
        $supplierIds = array_values(array_unique($supplierIds));
        $allPartyIds = array_values(array_unique(array_merge($customerIds, $supplierIds)));

        // Bulk load sales & returns
        $custSales = empty($customerIds) ? collect() : \App\Models\Sales::whereIn('customer_id', $customerIds)
            ->selectRaw('customer_id, SUM(net_total - COALESCE(extra_discount, 0)) as total')
            ->groupBy('customer_id')
            ->pluck('total', 'customer_id');

        $custReturns = empty($customerIds) ? collect() : \App\Models\SalesReturn::whereIn('customer_id', $customerIds)
            ->selectRaw('customer_id, SUM(net_total - COALESCE(extra_discount, 0)) as total')
            ->groupBy('customer_id')
            ->pluck('total', 'customer_id');

        // Bulk load purchases & returns
        $suppPurchases = empty($supplierIds) ? collect() : \App\Models\Purchase::whereIn('supplier_id', $supplierIds)
            ->selectRaw('supplier_id, SUM(net_total - COALESCE(extra_discount, 0)) as total')
            ->groupBy('supplier_id')
            ->pluck('total', 'supplier_id');

        $suppReturns = empty($supplierIds) ? collect() : \App\Models\PurchaseReturn::whereIn('supplier_id', $supplierIds)
            ->selectRaw('supplier_id, SUM(net_total - COALESCE(extra_discount, 0)) as total')
            ->groupBy('supplier_id')
            ->pluck('total', 'supplier_id');

        // Bulk load payments for parties
        $partyReceipts = empty($allPartyIds) ? collect() : \App\Models\Payment::whereIn('account_id', $allPartyIds)
            ->where('type', 'RECEIPT')
            ->where(function ($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
            })
            ->with('allocations')
            ->get()
            ->groupBy('account_id');

        $partyPayments = empty($allPartyIds) ? collect() : \App\Models\Payment::whereIn('account_id', $allPartyIds)
            ->where('type', 'PAYMENT')
            ->where(function ($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
            })
            ->with('allocations')
            ->get()
            ->groupBy('account_id');

        // Pre-compute settlement sums per account in memory
        $receiptSettlements = [];
        foreach ($partyReceipts as $accId => $receipts) {
            $sum = 0.0;
            foreach ($receipts as $r) {
                $sum += self::getRecognizedNetSettlement($r);
            }
            $receiptSettlements[$accId] = $sum;
        }

        $paymentSettlements = [];
        $custPaymentSettlements = [];
        foreach ($partyPayments as $accId => $payments) {
            $allSum = 0.0;
            $custSum = 0.0;
            foreach ($payments as $p) {
                $rec = self::getRecognizedNetSettlement($p);
                $allSum += $rec;
                if (!$p->is_return_refund) {
                    $custSum += $rec;
                }
            }
            $paymentSettlements[$accId] = $allSum;
            $custPaymentSettlements[$accId] = $custSum;
        }

        // Attach balances to every account
        foreach ($accounts as $account) {
            if (array_key_exists('current_balance', $account->getAttributes()) && $account->getAttributes()['current_balance'] !== null) {
                continue;
            }

            $type = strtolower($account->accountType->name ?? '');
            $hasPurchase = (bool)($account->purchase ?? false);
            $hasSale = (bool)($account->sale ?? false);

            if ($hasPurchase && $hasSale) {
                $rawOB = (float)($account->opening_balance ?? 0);
                $obType = strtoupper($account->opening_balance_type ?? 'DR');
                $obDR = $obType === 'DR' ? $rawOB : 0.0;
                $obCR = $obType === 'CR' ? $rawOB : 0.0;

                $totalS = (float)($custSales[$account->id] ?? 0);
                $totalSR = (float)($custReturns[$account->id] ?? 0);
                $totalP = (float)($suppPurchases[$account->id] ?? 0);
                $totalPR = (float)($suppReturns[$account->id] ?? 0);
                $rSettlement = (float)($receiptSettlements[$account->id] ?? 0);
                $pSettlement = (float)($paymentSettlements[$account->id] ?? 0);

                $totalDR = $obDR + $totalS + $pSettlement + $totalPR;
                $totalCR = $obCR + $totalP + $rSettlement + $totalSR;

                $bal = $type === 'supplier' ? ($totalCR - $totalDR) : ($totalDR - $totalCR);
                $account->setAttribute('current_balance', round($bal, 2));
                $account->memoizedCurrentBalance = round($bal, 2);
            } elseif ($type === 'customers') {
                $totalS = (float)($custSales[$account->id] ?? 0);
                $totalSR = (float)($custReturns[$account->id] ?? 0);
                $rSettlement = (float)($receiptSettlements[$account->id] ?? 0);
                $pSettlement = (float)($custPaymentSettlements[$account->id] ?? 0);

                $bal = $account->getSignedOpeningBalance() + $totalS + $pSettlement - $totalSR - $rSettlement;
                $account->setAttribute('current_balance', round($bal, 2));
                $account->memoizedCurrentBalance = round($bal, 2);
            } elseif ($type === 'supplier') {
                $totalP = (float)($suppPurchases[$account->id] ?? 0);
                $totalPR = (float)($suppReturns[$account->id] ?? 0);
                $rSettlement = (float)($receiptSettlements[$account->id] ?? 0);
                $pSettlement = (float)($paymentSettlements[$account->id] ?? 0);

                $bal = $account->getSignedOpeningBalance() + $totalP + $rSettlement - $totalPR - $pSettlement;
                $account->setAttribute('current_balance', round($bal, 2));
                $account->memoizedCurrentBalance = round($bal, 2);
            } else {
                // Non-customer/non-supplier accounts (bank, cash, expense, etc.)
                $bal = (float)$account->current_balance;
                $account->setAttribute('current_balance', round($bal, 2));
                $account->memoizedCurrentBalance = round($bal, 2);
            }
        }
    }
}
