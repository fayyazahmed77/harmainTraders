<?php

namespace App\Http\Requests;

use App\Models\Account;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('edit payments') || $this->user()->hasRole('admin') || true;
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'account_id' => 'required|integer|exists:accounts,id',
            'payment_account_id' => 'nullable|integer|exists:accounts,id',
            'amount' => 'required|numeric|gt:0',
            'discount' => 'nullable|numeric|min:0',
            'type' => 'required|string|in:RECEIPT,PAYMENT',
            'payment_method' => 'nullable|string',
            'cheque_no' => 'nullable|string',
            'cheque_date' => 'nullable|date',
            'clear_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'message_line_id' => 'nullable|integer',
            'firm_id' => 'nullable|integer',
            'allocations' => 'nullable|array',
            'original_cheque_id' => 'nullable|string',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $accountId = $this->input('account_id');
            if ($accountId) {
                $account = Account::find($accountId);
                if ($account && (int)$account->status === 0) {
                    $validator->errors()->add('account_id', 'Selected account is inactive.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'account_id.required' => 'Please select a valid Ledger Party.',
            'amount.gt' => 'Payment amount must be greater than 0.',
        ];
    }
}
