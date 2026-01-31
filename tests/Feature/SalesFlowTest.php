<?php

use App\Models\Account;
use App\Models\Items;
use App\Models\Sales;
use App\Models\Saleman;
use App\Models\AccountType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
    // Setup Account Types
    $this->customerType = AccountType::create(['name' => 'Customers']);
    $this->cashType = AccountType::create(['name' => 'Cash']);

    // Setup Accounts
    $this->customer = Account::create([
        'code' => 'C001',
        'title' => 'Test Customer',
        'type' => 'Customers',
        'opening_balance' => 0,
    ]);

    $this->cashAccount = Account::create([
        'code' => 'CASH01',
        'title' => 'Main Cash',
        'type' => 'Cash',
        'opening_balance' => 0,
    ]);

    // Setup Salesman
    $this->salesman = Saleman::create(['name' => 'Test Salesman', 'code' => 'SM01']);

    // Setup Items
    $this->item = Items::create([
        'code' => 'ITM001',
        'title' => 'Test Item',
        'stock_1' => 100,
        'trade_price' => 10,
    ]);
});

it('verifies that creating a sale reduces stock and sets remaining balance correctly', function () {
    $payload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'SLS-TEST-001',
        'customer_id' => $this->customer->id,
        'salesman_id' => $this->salesman->id,
        'no_of_items' => 1,
        'gross_total' => 100,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 100,
        'paid_amount' => 40,
        'remaining_amount' => 60,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 10,
                'total_pcs' => 10,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 100,
            ]
        ]
    ];

    $response = $this->postJson(route('sale.store'), $payload);

    $response->assertRedirect();

    // Verify Sale Record
    $sale = Sales::where('invoice', 'SLS-TEST-001')->first();
    expect($sale)->not->toBeNull();
    expect($sale->remaining_amount)->toEqual(60);

    // Verify Stock Reduction
    $this->item->refresh();
    expect($this->item->stock_1)->toEqual(90);
});

it('verifies that "Pay Now" option creates a payment record and allocates correctly', function () {
    $payload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'SLS-PAY-001',
        'customer_id' => $this->customer->id,
        'salesman_id' => $this->salesman->id,
        'no_of_items' => 1,
        'gross_total' => 100,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 100,
        'paid_amount' => 100,
        'remaining_amount' => 0,
        'is_pay_now' => true,
        'payment_account_id' => $this->cashAccount->id,
        'payment_method' => 'Online Transfer',
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 10,
                'total_pcs' => 10,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 100,
            ]
        ]
    ];

    $response = $this->postJson(route('sale.store'), $payload);

    $response->assertRedirect();

    // Verify Payment Record
    $this->assertDatabaseHas('payments', [
        'account_id' => $this->customer->id,
        'amount' => 100,
        'type' => 'RECEIPT'
    ]);

    // Verify Allocation
    $sale = Sales::where('invoice', 'SLS-PAY-001')->first();
    $this->assertDatabaseHas('payment_allocations', [
        'bill_id' => $sale->id,
        'amount' => 100
    ]);
});
