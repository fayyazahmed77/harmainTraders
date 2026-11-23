<?php

use App\Models\Account;
use App\Models\AccountCategory;
use App\Models\Items;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    DB::table('account_types')->insertOrIgnore([
        ['id' => 4, 'name' => 'Suppliers', 'created_at' => now(), 'updated_at' => now()],
    ]);

    $this->category3 = AccountCategory::create([
        'name' => 'Markup 3%',
        'percentage' => 3,
    ]);

    $this->category0 = AccountCategory::create([
        'name' => 'Markup 0%',
        'percentage' => 0,
    ]);

    $this->supplier = Account::create([
        'code' => 'SUP-001',
        'title' => 'ABD BIN ASIF',
        'type' => 4,
        'category' => $this->category3->id,
        'purchase' => 1,
        'opening_balance' => 0,
        'opening_balance_type' => 'CR',
        'status' => true,
    ]);

    $this->supplierZero = Account::create([
        'code' => 'SUP-002',
        'title' => 'ZERO MARKUP SUPPLIER',
        'type' => 4,
        'category' => $this->category0->id,
        'purchase' => 1,
        'opening_balance' => 0,
        'opening_balance_type' => 'CR',
        'status' => true,
    ]);

    $this->item = Items::create([
        'code' => 'ITM-1032',
        'title' => 'ABC PASTE ORANGE',
        'trade_price' => 170.00,
        'retail' => 220.00,
        'packing_qty' => 1,
        'packing_full' => 1,
        'is_active' => true,
    ]);
});

it('updates item trade_price from Net Rate (after discount) + supplier markup on store & update, and returns Net Rate as last purchase rate', function () {
    // 1. Store purchase: Rate 200, Disc 25% -> Net Rate 150.00, Markup 3% -> New TP = 154.50
    $storeRes = $this->post('/purchase', [
        'date' => '2026-11-23',
        'invoice' => 'PUR-NET-001',
        'supplier_id' => $this->supplier->id,
        'no_of_items' => 1,
        'gross_total' => 20200,
        'discount_total' => 5050,
        'extra_discount' => 0,
        'courier_charges' => 0,
        'net_total' => 15150,
        'paid_amount' => 0,
        'remaining_amount' => 15150,
        'update_prices' => true,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 101,
                'qty_pcs' => 0,
                'total_pcs' => 101,
                'trade_price' => 200,
                'net_rate' => 150,
                'discount' => 5050,
                'gst_amount' => 0,
                'subtotal' => 20200,
            ],
        ],
    ]);

    $storeRes->assertRedirect(route('purchase.index'));

    // Item trade_price MUST be 154.50 (150 * 1.03), NOT 206.00 (200 * 1.03)
    expect((float) $this->item->fresh()->trade_price)->toBe(154.50);

    // PurchaseItem retains gross rate & discount cleanly
    $purchase = Purchase::with('items')->latest('id')->firstOrFail();
    expect((float) $purchase->items->first()->trade_price)->toBe(200.0);
    expect((float) $purchase->items->first()->discount)->toBe(5050.0);
    expect((float) $purchase->items->first()->subtotal)->toBe(20200.0);

    // Last purchase info endpoint returns Net Rate (150.00), NOT gross rate (200.00)
    $lastInfo = $this->getJson("/api/purchase/last-purchase-info?item_id={$this->item->id}");
    $lastInfo->assertOk();
    expect((float) $lastInfo->json('previous_retail_price'))->toBe(150.0);
    expect((float) $lastInfo->json('average_price'))->toBe(150.0);

    // 2. Update purchase: Rate 200, Disc 10% -> Net Rate 180.00, Markup 3% -> New TP = 185.40
    $updateRes = $this->put("/purchase/{$purchase->id}", [
        'date' => '2026-11-23',
        'invoice' => 'PUR-NET-001',
        'supplier_id' => $this->supplier->id,
        'no_of_items' => 1,
        'gross_total' => 20200,
        'discount_total' => 2020,
        'extra_discount' => 0,
        'courier_charges' => 0,
        'net_total' => 18180,
        'paid_amount' => 0,
        'remaining_amount' => 18180,
        'update_prices' => true,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 101,
                'qty_pcs' => 0,
                'total_pcs' => 101,
                'trade_price' => 200,
                'net_rate' => 180,
                'discount' => 2020,
                'gst_amount' => 0,
                'subtotal' => 20200,
            ],
        ],
    ]);

    $updateRes->assertRedirect(route('purchase.index'));
    expect((float) $this->item->fresh()->trade_price)->toBe(185.40);

    // 3. Store purchase with update_prices = false -> trade_price remains 185.40
    $noUpdRes = $this->post('/purchase', [
        'date' => '2026-11-23',
        'invoice' => 'PUR-NET-002',
        'supplier_id' => $this->supplier->id,
        'no_of_items' => 1,
        'gross_total' => 1000,
        'discount_total' => 100,
        'extra_discount' => 0,
        'courier_charges' => 0,
        'net_total' => 900,
        'paid_amount' => 0,
        'remaining_amount' => 900,
        'update_prices' => false,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 10,
                'qty_pcs' => 0,
                'total_pcs' => 10,
                'trade_price' => 100,
                'net_rate' => 90,
                'discount' => 100,
                'gst_amount' => 0,
                'subtotal' => 1000,
            ],
        ],
    ]);
    $noUpdRes->assertRedirect(route('purchase.index'));
    expect((float) $this->item->fresh()->trade_price)->toBe(185.40);

    // 4. Supplier with 0% markup + update_prices = true -> updates directly to Net Rate (150.00)
    $zeroMarkupRes = $this->post('/purchase', [
        'date' => '2026-11-23',
        'invoice' => 'PUR-NET-003',
        'supplier_id' => $this->supplierZero->id,
        'no_of_items' => 1,
        'gross_total' => 2000,
        'discount_total' => 500,
        'extra_discount' => 0,
        'courier_charges' => 0,
        'net_total' => 1500,
        'paid_amount' => 0,
        'remaining_amount' => 1500,
        'update_prices' => true,
        'items' => [
            [
                'item_id' => $this->item->id,
                'qty_carton' => 10,
                'qty_pcs' => 0,
                'total_pcs' => 10,
                'trade_price' => 200,
                'net_rate' => 150,
                'discount' => 500,
                'gst_amount' => 0,
                'subtotal' => 2000,
            ],
        ],
    ]);
    $zeroMarkupRes->assertRedirect(route('purchase.index'));
    expect((float) $this->item->fresh()->trade_price)->toBe(150.0);
});
