<?php

namespace App\Services;

use App\Models\CustomerCredit;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class CustomerCreditService
{
    /**
     * Process refund for a Customer Credit.
     */
    public function processCreditRefund(int $creditId, float $refundAmount, string $date, string $paymentMethod, ?int $paymentAccountId, string $remarks = ''): Payment
    {
        if ($refundAmount <= 0) {
            throw new \InvalidArgumentException("Refund amount must be greater than zero.");
        }

        return DB::transaction(function () use ($creditId, $refundAmount, $date, $paymentMethod, $paymentAccountId, $remarks) {
            // Find and lock the credit record
            $credit = CustomerCredit::lockForUpdate()->findOrFail($creditId);

            if (round($credit->available_balance, 2) < round($refundAmount, 2)) {
                throw new \Exception("Insufficient credit balance. Available: " . $credit->available_balance . ", Requested: " . $refundAmount);
            }

            // Deduct balance
            $credit->available_balance -= $refundAmount;
            
            if (round($credit->available_balance, 2) <= 0.005) {
                $credit->status = 'Refunded';
                $credit->available_balance = 0; // Prevent float drift
            } else {
                $credit->status = 'Partial';
            }
            $credit->save();

            // Determine voucher prefix
            $isBank = in_array(strtolower($paymentMethod), ['bank', 'cheque', 'online']);
            $prefix = $isBank ? 'BPV' : 'CPV';
            $voucherNo = $this->generateNextVoucherNo($prefix);

            // Create refund payment record
            $payment = Payment::create([
                'date' => $date,
                'voucher_no' => $voucherNo,
                'account_id' => $credit->customer_id,
                'payment_account_id' => $paymentAccountId,
                'amount' => $refundAmount,
                'net_amount' => $refundAmount,
                'type' => 'PAYMENT', // Money goes out of our bank/cash to customer
                'payment_method' => $paymentMethod,
                'cheque_status' => 'Refund',
                'remarks' => $remarks ?: 'Refund for Customer Credit (Credit Note ID: ' . $credit->id . ')',
                'is_return_refund' => true, // exclude from ledger double counting
                'customer_credit_id' => $credit->id,
            ]);

            return $payment;
        });
    }

    /**
     * Cancel/Void a credit refund payment.
     */
    public function cancelRefund(int $paymentId): void
    {
        DB::transaction(function () use ($paymentId) {
            $payment = Payment::lockForUpdate()->findOrFail($paymentId);

            if ($payment->cheque_status === 'Canceled') {
                return;
            }

            if (!$payment->customer_credit_id) {
                throw new \Exception("Payment is not associated with a Customer Credit refund.");
            }

            $credit = CustomerCredit::lockForUpdate()->find($payment->customer_credit_id);
            if ($credit) {
                // Restore balance
                $credit->available_balance += $payment->amount;
                
                if (round($credit->available_balance, 2) >= round($credit->amount, 2)) {
                    $credit->status = 'Available';
                    $credit->available_balance = $credit->amount; // Capping to avoid floating additions exceeding original
                } else {
                    $credit->status = 'Partial';
                }
                $credit->save();
            }

            // Set payment status as Canceled
            $payment->update([
                'cheque_status' => 'Canceled'
            ]);
        });
    }

    /**
     * Generate sequential voucher number using MySQL transaction lock.
     */
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
}
