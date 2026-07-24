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

        return (float)$account->opening_balance + $totalSales + $totalPaymentsSettlement - $totalReturns - $totalReceiptsSettlement;
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

        return (float)$account->opening_balance + $totalPurchases + $totalReceiptsSettlement - $totalReturns - $totalPaymentsSettlement;
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
}
