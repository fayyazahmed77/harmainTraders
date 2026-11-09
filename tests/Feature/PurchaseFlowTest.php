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
        'type' => $this->supplierType->id,
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

it('preserves multiple lines of the same item with different quantities, rates, and discounts on purchase create and edit', function () {
    $payload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'PUR-MULTI-001',
        'code' => 'SUP-INV-01',
        'supplier_id' => $this->supplier->id,
        'salesman_id' => $this->salesman->id,
        'no_of_items' => 2,
        'gross_total' => 1550,
        'discount_total' => 55,
        'tax_total' => 0,
        'net_total' => 1495,
        'paid_amount' => 0,
        'remaining_amount' => 1495,
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
            ],
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 50,
                'total_pcs' => 50,
                'trade_price' => 11,
                'discount' => 55,
                'gst_amount' => 0,
                'subtotal' => 495,
            ],
        ],
    ];

    $response = $this->postJson(route('purchase.store'), $payload);
    $response->assertRedirect();

    $purchase = Purchase::where('invoice', 'PUR-MULTI-001')->with('items')->first();
    expect($purchase)->not->toBeNull();
    expect($purchase->items)->toHaveCount(2);
    expect((float) $purchase->items[0]->trade_price)->toEqual(10.0);
    expect((float) $purchase->items[0]->subtotal)->toEqual(1000.0);
    expect((float) $purchase->items[1]->trade_price)->toEqual(11.0);
    expect((float) $purchase->items[1]->discount)->toEqual(55.0);
    expect((float) $purchase->items[1]->subtotal)->toEqual(495.0);

    // Combined 150 pcs added to initial 100 stock
    $this->item->refresh();
    expect((float) $this->item->stock_1)->toEqual(250.0);

    // Now edit only the second line (change from 50 pcs to 80 pcs)
    $updatePayload = [
        'date' => now()->format('Y-m-d'),
        'invoice' => 'PUR-MULTI-001',
        'code' => 'SUP-INV-01',
        'supplier_id' => $this->supplier->id,
        'salesman_id' => $this->salesman->id,
        'no_of_items' => 2,
        'gross_total' => 1880,
        'discount_total' => 88,
        'tax_total' => 0,
        'net_total' => 1792,
        'paid_amount' => 0,
        'remaining_amount' => 1792,
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
            ],
            [
                'item_id' => $this->item->id,
                'qty_carton' => 0,
                'qty_pcs' => 80,
                'total_pcs' => 80,
                'trade_price' => 11,
                'discount' => 88,
                'gst_amount' => 0,
                'subtotal' => 792,
            ],
        ],
    ];

    $updateResponse = $this->putJson("/purchase/{$purchase->id}", $updatePayload);
    $updateResponse->assertRedirect();

    $purchase->refresh();
    expect($purchase->items)->toHaveCount(2);
    expect((float) $purchase->items[0]->total_pcs)->toEqual(100.0);
    expect((float) $purchase->items[1]->total_pcs)->toEqual(80.0);
    expect((float) $purchase->net_total)->toEqual(1792.0);

    // Stock should now be 100 + 180 = 280
    $this->item->refresh();
    expect((float) $this->item->stock_1)->toEqual(280.0);
});
