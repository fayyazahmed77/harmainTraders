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
        'type' => $this->customerType->id,
        'opening_balance' => 0,
    ]);

    $this->cashAccount = Account::create([
        'code' => 'CASH01',
        'title' => 'Main Cash',
        'type' => $this->cashType->id,
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
    $sale = Sales::first();
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
    $sale = Sales::first();
    $this->assertDatabaseHas('payment_allocations', [
        'bill_id' => $sale->id,
        'amount' => 100
    ]);
});

it('preserves multiple lines of the same item with different quantities, prices, and discounts on create and edit', function () {
    $payload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'SLS-MULTI-001',
        'customer_id' => $this->customer->id,
        'salesman_id' => $this->salesman->id,
        'no_of_items' => 2,
        'gross_total' => 220,
        'discount_total' => 12,
        'tax_total' => 0,
        'net_total' => 208,
        'paid_amount' => 0,
        'remaining_amount' => 208,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 1,
                'qty_pcs' => 0,
                'total_pcs' => 10,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 100,
            ],
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 10,
                'total_pcs' => 10,
                'trade_price' => 12,
                'discount' => 12,
                'gst_amount' => 0,
                'subtotal' => 108,
            ],
        ],
    ];

    $response = $this->postJson(route('sale.store'), $payload);
    $response->assertRedirect();

    $sale = Sales::where('invoice', 'SLS-MULTI-001')->with('items')->first();
    expect($sale)->not->toBeNull();
    expect($sale->items)->toHaveCount(2);
    expect((float) $sale->items[0]->trade_price)->toEqual(10.0);
    expect((float) $sale->items[0]->subtotal)->toEqual(100.0);
    expect((float) $sale->items[1]->trade_price)->toEqual(12.0);
    expect((float) $sale->items[1]->discount)->toEqual(12.0);
    expect((float) $sale->items[1]->subtotal)->toEqual(108.0);

    // Combined 20 pcs deducted from initial 100 stock
    $this->item->refresh();
    expect((float) $this->item->stock_1)->toEqual(80.0);

    // Now edit only the second line (increase from 10 pcs to 15 pcs)
    $updatePayload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'SLS-MULTI-001',
        'customer_id' => $this->customer->id,
        'salesman_id' => $this->salesman->id,
        'no_of_items' => 2,
        'gross_total' => 280,
        'discount_total' => 18,
        'tax_total' => 0,
        'net_total' => 262,
        'paid_amount' => 0,
        'remaining_amount' => 262,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 1,
                'qty_pcs' => 0,
                'total_pcs' => 10,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 100,
            ],
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 15,
                'total_pcs' => 15,
                'trade_price' => 12,
                'discount' => 18,
                'gst_amount' => 0,
                'subtotal' => 162,
            ],
        ],
    ];

    $updateResponse = $this->putJson("/sales/{$sale->id}", $updatePayload);
    $updateResponse->assertRedirect();

    $sale->refresh();
    expect($sale->items)->toHaveCount(2);
    expect((float) $sale->items[0]->total_pcs)->toEqual(10.0);
    expect((float) $sale->items[1]->total_pcs)->toEqual(15.0);
    expect((float) $sale->net_total)->toEqual(262.0);

    // Stock should now be 100 - 25 = 75
    $this->item->refresh();
    expect((float) $this->item->stock_1)->toEqual(75.0);
});
