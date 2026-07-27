<?php

namespace App\Http\Requests;

use App\Models\Account;
use App\Models\Sales;
use App\Models\Purchase;
use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create payments') || $this->user()->hasRole('admin') || true;
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'type' => 'required|string|in:RECEIPT,PAYMENT',
            'account_id' => 'required|integer|exists:accounts,id',
            'payment_account_id' => 'nullable|integer|exists:accounts,id',
            'amount' => 'required|numeric|gt:0',
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string',
            'cheque_no' => 'nullable|string',
            'cheque_date' => 'nullable|date',
            'clear_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'message_line_id' => 'nullable|integer',
            'firm_id' => 'nullable|integer',
            'allocations' => 'nullable|array',
            'allocations.*.bill_id' => 'required_with:allocations|integer',
            'allocations.*.bill_type' => 'required_with:allocations|string',
            'allocations.*.amount' => 'required_with:allocations|numeric|gt:0',
            'is_multi' => 'nullable|boolean',
            'splits' => 'nullable|array',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $accountId = $this->input('account_id');
            if ($accountId) {
                $account = Account::find($accountId);
                if ($account && (int)$account->status === 0) {
                    $validator->errors()->add('account_id', 'Selected account is inactive and cannot accept payments.');
                }
            }

            $allocations = $this->input('allocations', []);
            if (!empty($allocations) && is_array($allocations)) {
                $totalAllocated = collect($allocations)->sum('amount');
                $amount = (float)$this->input('amount', 0);
                $discount = (float)($this->input('discount') ?? 0);
                $grossSettlement = $amount + $discount;

                if ($totalAllocated > ($grossSettlement + 0.01)) {
                    $validator->errors()->add('allocations', 'Total allocated amount (' . number_format($totalAllocated, 2) . ') cannot exceed total settlement (' . number_format($grossSettlement, 2) . ').');
                }

                foreach ($allocations as $idx => $alloc) {
                    $billId = $alloc['bill_id'] ?? null;
                    $billType = $alloc['bill_type'] ?? null;
                    $allocAmount = (float)($alloc['amount'] ?? 0);

                    if ($billId && $billType) {
                        $bill = ($billType === 'App\Models\Sales')
                            ? Sales::find($billId)
                            : Purchase::find($billId);

                        if ($bill) {
                            $rem = (float)$bill->remaining_amount;
                            if ($allocAmount > ($rem + 0.01)) {
                                $validator->errors()->add("allocations.{$idx}.amount", "Allocation for invoice {$bill->invoice} ({$allocAmount}) exceeds remaining balance ({$rem}).");
                            }
                        }
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'account_id.required' => 'Please select a valid Ledger Party.',
            'amount.gt' => 'Payment amount must be greater than 0.',
            'type.in' => 'Transaction type must be either RECEIPT or PAYMENT.',
        ];
    }
}
