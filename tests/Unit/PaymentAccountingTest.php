<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Sales;
use App\Services\PaymentAccountingService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->user = \App\Models\User::factory()->create();
    $this->actingAs($this->user);

    $this->customerType = AccountType::create(['name' => 'Customers']);
    $this->supplierType = AccountType::create(['name' => 'Supplier']);
    $this->cashType = AccountType::create(['name' => 'Cash']);

    $this->customer = Account::create([
        'code' => 'CST-100',
        'title' => 'Test Customer Account',
        'type' => $this->customerType->id,
        'opening_balance' => 0,
    ]);

    $this->supplier = Account::create([
        'code' => 'SUP-100',
        'title' => 'Test Supplier Account',
        'type' => $this->supplierType->id,
        'opening_balance' => 0,
    ]);

    $this->cashAccount = Account::create([
        'code' => 'CSH-100',
        'title' => 'Main Cash Box',
        'type' => $this->cashType->id,
        'opening_balance' => 0,
    ]);
});

it('calculates unallocated cash and advance balances correctly', function () {
    // Payment received: Cash 5000, Discount 0, Allocated 3000 to invoice
    $payment = Payment::create([
        'date' => '2026-07-25',
        'voucher_no' => 'CRV-0001',
        'account_id' => $this->customer->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 5000,
        'discount' => 0,
        'net_amount' => 5000,
        'type' => 'RECEIPT',
    ]);

    PaymentAllocation::create([
        'payment_id' => $payment->id,
        'bill_id' => 1,
        'bill_type' => 'App\Models\Sales',
        'amount' => 3000,
    ]);

    // Unallocated cash should be 5000 - 3000 = 2000
    expect(PaymentAccountingService::getUnallocatedCash($payment))->toBe(2000.0);
    expect(PaymentAccountingService::getAccountAdvanceBalance($this->customer))->toBe(2000.0);
});

it('recognizes discount only to the extent cash is insufficient to cover allocated settlement', function () {
    // Payment: Cash 1870000, Discount 9790, Net Amount 1879790
    $payment = Payment::create([
        'date' => '2026-07-25',
        'voucher_no' => 'CRV-0010',
        'account_id' => $this->customer->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 1870000,
        'discount' => 9790,
        'net_amount' => 1879790,
        'type' => 'RECEIPT',
    ]);

    // Allocation of 1879790 (full settlement)
    PaymentAllocation::create([
        'payment_id' => $payment->id,
        'bill_id' => 1,
        'bill_type' => 'App\Models\Sales',
        'amount' => 1879790,
    ]);

    // Recognized discount should be 1879790 - 1870000 = 9790
    expect(PaymentAccountingService::getRecognizedDiscount($payment))->toBe(9790.0);
    expect(PaymentAccountingService::getRecognizedNetSettlement($payment))->toBe(1879790.0);
    expect(PaymentAccountingService::getUnallocatedCash($payment))->toBe(0.0);
});

it('computes customer current balance accurately with sales and payment receipts', function () {
    // Sales invoice of 10,000
    Sales::create([
        'date' => '2026-07-20',
        'invoice' => 'SLS-101',
        'customer_id' => $this->customer->id,
        'gross_total' => 10000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 10000,
        'paid_amount' => 5000,
        'remaining_amount' => 5000,
        'courier_charges' => 0,
    ]);

    // Payment receipt: Cash 4800, Discount 200, Allocated 5000
    $payment = Payment::create([
        'date' => '2026-07-21',
        'voucher_no' => 'CRV-0002',
        'account_id' => $this->customer->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 4800,
        'discount' => 200,
        'net_amount' => 5000,
        'type' => 'RECEIPT',
    ]);

    PaymentAllocation::create([
        'payment_id' => $payment->id,
        'bill_id' => 1,
        'bill_type' => 'App\Models\Sales',
        'amount' => 5000,
    ]);

    // Net Customer Balance = Sales (10,000) - Recognized Net Settlement (5,000) = 5,000
    expect(PaymentAccountingService::getCustomerCurrentBalance($this->customer))->toBe(5000.0);
});
