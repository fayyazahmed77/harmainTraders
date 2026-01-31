<?php

use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\AccountType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = App\Models\User::factory()->create();
    $this->actingAs($this->user);
    // Setup Account Types
    $this->customerType = AccountType::create(['name' => 'Customers']);
    $this->supplierType = AccountType::create(['name' => 'Supplier']);
    $this->cashType = AccountType::create(['name' => 'Cash']);

    // Setup Accounts
    $this->customer = Account::create([
        'code' => 'C001',
        'title' => 'Test Customer',
        'type' => 'Customers',
        'opening_balance' => 0,
    ]);

    $this->supplier = Account::create([
        'code' => 'S001',
        'title' => 'Test Supplier',
        'type' => 'Supplier',
        'opening_balance' => 0,
    ]);

    $this->cashAccount = Account::create([
        'code' => 'CASH01',
        'title' => 'Main Cash',
        'type' => 'Cash',
        'opening_balance' => 0,
    ]);
});

it('verifies that manual payment reduces remaining balance of a sale via allocation', function () {
    // Create an unpaid sale
    $sale = Sales::create([
        'date' => now()->format('Y-m-d'),
        'invoice' => 'SLS-UNPAID',
        'customer_id' => $this->customer->id,
        'gross_total' => 1000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 1000,
        'paid_amount' => 0,
        'remaining_amount' => 1000,
        'courier_charges' => 0,
    ]);

    $payload = [
        'date' => now()->format('Y-m-d'),
        'account_id' => $this->customer->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 1000,
        'type' => 'RECEIPT',
        'payment_method' => 'Online Transfer',
        'allocations' => [
            [
                'bill_id' => $sale->id,
                'bill_type' => 'App\Models\Sales',
                'amount' => 1000
            ]
        ]
    ];

    $response = $this->post(route('payments.store'), $payload);

    $response->assertRedirect();

    // Verify Payment and Allocation
    $this->assertDatabaseHas('payments', ['amount' => 1000, 'type' => 'RECEIPT']);
    $this->assertDatabaseHas('payment_allocations', ['bill_id' => $sale->id, 'amount' => 1000]);

    // Verify Sale Balance Updated
    $sale->refresh();
    expect($sale->remaining_amount)->toEqual(0);
    expect($sale->paid_amount)->toEqual(1000);
});

it('verifies that manual payment reduces remaining balance of a purchase via allocation', function () {
    // Create an unpaid purchase
    $purchase = Purchase::create([
        'date' => now()->format('Y-m-d'),
        'invoice' => 1,
        'code' => 1,
        'supplier_id' => $this->supplier->id,
        'gross_total' => 500,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 500,
        'paid_amount' => 0,
        'remaining_amount' => 500,
        'courier_charges' => 0,
    ]);

    $payload = [
        'date' => now()->format('Y-m-d'),
        'account_id' => $this->supplier->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 500,
        'type' => 'PAYMENT',
        'payment_method' => 'Online Transfer',
        'allocations' => [
            [
                'bill_id' => $purchase->id,
                'bill_type' => 'App\Models\Purchase',
                'amount' => 500
            ]
        ]
    ];

    $response = $this->post(route('payments.store'), $payload);

    $response->assertRedirect();

    // Verify Payment and Allocation
    $this->assertDatabaseHas('payments', ['amount' => 500, 'type' => 'PAYMENT']);
    $this->assertDatabaseHas('payment_allocations', ['bill_id' => $purchase->id, 'amount' => 500]);

    // Verify Purchase Balance Updated
    $purchase->refresh();
    expect($purchase->remaining_amount)->toEqual(0);
    expect($purchase->paid_amount)->toEqual(500);
});
