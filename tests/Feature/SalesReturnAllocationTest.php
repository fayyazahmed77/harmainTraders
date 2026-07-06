<?php

use App\Models\Account;
use App\Models\Items;
use App\Models\Sales;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\Saleman;
use App\Models\AccountType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
/**
 * @var \Tests\TestCase $this
 * @property \App\Models\User $user
 * @property \App\Models\AccountType $customerType
 * @property \App\Models\AccountType $cashType
 * @property \App\Models\Account $customer
 * @property \App\Models\Account $cashAccount
 * @property \App\Models\Saleman $salesman
 * @property \App\Models\Items $item
 * @property \App\Models\Sales $sale
 */
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

    // Create a sale to return against
    $this->sale = Sales::create([
        'date' => now()->format('Y-m-d'),
        'invoice' => 'SLS-RET-001',
        'customer_id' => $this->customer->id,
        'salesman_id' => $this->salesman->id,
        'no_of_items' => 1,
        'gross_total' => 1000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 1000,
        'paid_amount' => 0,
        'remaining_amount' => 1000,
        'courier_charges' => 0.00,
        'status' => 'Completed',
    ]);

    \App\Models\SalesItem::create([
        'sale_id' => $this->sale->id,
        'item_id' => $this->item->id,
        'qty_carton' => 0,
        'qty_pcs' => 100,
        'total_pcs' => 100,
        'trade_price' => 10,
        'discount' => 0,
        'gst_amount' => 0,
        'subtotal' => 1000,
    ]);
});

it('requires a valid original invoice for sales returns', function () {
    $payload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'RET-001',
        'original_invoice' => '', // Empty original invoice
        'customer_id' => $this->customer->id,
        'gross_total' => 200,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 200,
        'paid_amount' => 0,
        'remaining_amount' => 200,
        'no_of_items' => 1,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 20,
                'total_pcs' => 20,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 200,
            ]
        ]
    ];

    $response = $this->postJson(route('sales_return.store'), $payload);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['original_invoice']);
});

it('verifies that creating a sales return reduces sale remaining_amount and updates status', function () {
    $payload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'RET-002',
        'original_invoice' => 'SLS-RET-001',
        'customer_id' => $this->customer->id,
        'gross_total' => 200,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 200,
        'paid_amount' => 0,
        'remaining_amount' => 200,
        'no_of_items' => 1,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 20,
                'total_pcs' => 20,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 200,
            ]
        ]
    ];

    $response = $this->postJson(route('sales_return.store'), $payload);

    $response->assertRedirect();

    // Verify sale remaining_amount was reduced from 1000 to 800
    $this->sale->refresh();
    expect($this->sale->remaining_amount)->toEqual(800);
    expect($this->sale->status)->toEqual('Partial Return');
});

it('rejects sales returns when return amount exceeds outstanding balance', function () {
    $payload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'RET-003',
        'original_invoice' => 'SLS-RET-001',
        'customer_id' => $this->customer->id,
        'gross_total' => 1200, // Exceeds sale net_total of 1000
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 1200,
        'paid_amount' => 0,
        'remaining_amount' => 1200,
        'no_of_items' => 1,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 120,
                'total_pcs' => 120,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 1200,
            ]
        ]
    ];

    $response = $this->postJson(route('sales_return.store'), $payload);

    // It should return validation errors
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['net_total']);

    // Verify sale remaining_amount is unaffected
    $this->sale->refresh();
    expect($this->sale->remaining_amount)->toEqual(1000);
});

it('correctly handles multiple returns and updates remaining_amount and status to Returned', function () {
    // Return 1: Rs 600
    $payload1 = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'RET-004',
        'original_invoice' => 'SLS-RET-001',
        'customer_id' => $this->customer->id,
        'gross_total' => 600,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 600,
        'paid_amount' => 0,
        'remaining_amount' => 600,
        'no_of_items' => 1,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 60,
                'total_pcs' => 60,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 600,
            ]
        ]
    ];
    $this->postJson(route('sales_return.store'), $payload1)->assertRedirect();
    $this->sale->refresh();
    expect($this->sale->remaining_amount)->toEqual(400);
    expect($this->sale->status)->toEqual('Partial Return');

    // Return 2: Rs 400
    $payload2 = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'RET-005',
        'original_invoice' => 'SLS-RET-001',
        'customer_id' => $this->customer->id,
        'gross_total' => 400,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 400,
        'paid_amount' => 0,
        'remaining_amount' => 400,
        'no_of_items' => 1,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 40,
                'total_pcs' => 40,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 400,
            ]
        ]
    ];
    $this->postJson(route('sales_return.store'), $payload2)->assertRedirect();
    $this->sale->refresh();
    expect($this->sale->remaining_amount)->toEqual(0);
    expect($this->sale->status)->toEqual('Returned');
});
