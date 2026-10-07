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
        $cashAllocated = min((float)$payment->amount, $allocatedSettlement);
        return max(0.0, $allocatedSettlement - $cashAllocated);
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
}
