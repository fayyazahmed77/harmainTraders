<?php

use App\Models\Account;
use App\Models\Items;
use App\Models\Purchase;
use App\Models\Saleman;
use App\Models\AccountType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = App\Models\User::factory()->create();
    $this->actingAs($this->user);
    // Setup Account Types
    $this->supplierType = AccountType::create(['name' => 'Supplier']);

    // Setup Accounts
    $this->supplier = Account::create([
        'code' => 'S001',
        'title' => 'Test Supplier',
        'type' => 'Supplier',
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

it('verifies that creating a purchase increases stock and sets remaining balance correctly', function () {
    $payload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => '123',
        'code' => '456',
        'supplier_id' => $this->supplier->id,
        'salesman_id' => $this->salesman->id,
        'no_of_items' => 1,
        'gross_total' => 1000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 1000,
        'paid_amount' => 200,
        'remaining_amount' => 800,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 1,
                'qty_pcs' => 0,
                'total_pcs' => 100,
                'trade_price' => 10,
                'discount' => 0,
                'gst_amount' => 0,
                'subtotal' => 1000,
            ]
        ]
    ];

    $response = $this->postJson(route('purchase.store'), $payload);

    $response->assertRedirect();

    // Verify Purchase Record
    $purchase = Purchase::where('invoice', '123')->first();
    expect($purchase)->not->toBeNull();
    expect($purchase->remaining_amount)->toEqual(800);

    // Verify Stock Increase
    $this->item->refresh();
    expect($this->item->stock_1)->toEqual(200);
});
