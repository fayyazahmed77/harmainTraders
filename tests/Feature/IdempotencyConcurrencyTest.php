<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Account;
use App\Models\Items;
use App\Models\Sales;
use App\Models\SalesItem;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class IdempotencyConcurrencyTest extends TestCase
{
    /** @test */
    public function duplicate_submission_with_same_key_creates_only_one_sale_and_deducts_stock_once()
    {
        $user = User::first();
        if (!$user) {
            $this->markTestSkipped('No user found');
        }

        $customer = Account::where('sale', 1)->first();
        if (!$customer) {
            $this->markTestSkipped('No customer found');
        }

        $item = Items::where('is_active', 1)->first();
        if (!$item) {
            $this->markTestSkipped('No item found');
        }

        $idempotencyKey = (string) Str::uuid();

        // Notice: One item entered TWICE on two separate rows in the same invoice!
        $payload = [
            'idempotency_key' => $idempotencyKey,
            'date' => now()->toDateString(),
            'customer_id' => $customer->id,
            'no_of_items' => 2,
            'gross_total' => 2000,
            'discount_total' => 0,
            'tax_total' => 0,
            'courier_charges' => 0,
            'net_total' => 2000,
            'paid_amount' => 0,
            'remaining_amount' => 2000,
            'items' => [
                [
                    'item_id' => $item->id,
                    'qty_carton' => 1,
                    'qty_pcs' => 0,
                    'total_pcs' => $item->packing_qty ?: 1,
                    'trade_price' => 1000,
                    'discount' => 0,
                    'gst_amount' => 0,
                    'subtotal' => 1000,
                ],
                [
                    'item_id' => $item->id,
                    'qty_carton' => 1,
                    'qty_pcs' => 0,
                    'total_pcs' => $item->packing_qty ?: 1,
                    'trade_price' => 1000,
                    'discount' => 0,
                    'gst_amount' => 0,
                    'subtotal' => 1000,
                ]
            ]
        ];

        $initialSalesCount = DB::table('sales')->count();
        $initialSalesItemsCount = DB::table('sales_items')->count();

        // 1. First submission (original)
        $res1 = $this->actingAs($user)->post('/sales', $payload);
        $res1->assertSessionHasNoErrors();
        $res1->assertRedirect();

        $saleId1 = session('id') ?? session('success_dialog.saleId');
        $this->assertNotNull($saleId1, "Sale was not created on first submission");

        // 2. Second submission (duplicate click / retry with SAME idempotency key)
        $res2 = $this->actingAs($user)->post('/sales', $payload);
        $res2->assertSessionHasNoErrors();
        $res2->assertRedirect();

        // Verify that exactly ONE sale was created in the database
        $finalSalesCount = DB::table('sales')->count();
        $this->assertEquals($initialSalesCount + 1, $finalSalesCount, "Duplicate sale created!");

        // Verify that exactly TWO sales_items rows were created (since the invoice had 2 rows of the same item)
        $finalSalesItemsCount = DB::table('sales_items')->count();
        $this->assertEquals($initialSalesItemsCount + 2, $finalSalesItemsCount, "Duplicate sales items rows created!");

        // Verify that the second response returned the same sale
        $this->assertEquals($saleId1, session('id') ?? session('success_dialog.saleId'));

        // 3. Third submission with a FRESH idempotency key (genuinely new invoice for same customer & items)
        $freshPayload = $payload;
        $freshPayload['idempotency_key'] = (string) Str::uuid();

        $res3 = $this->actingAs($user)->post('/sales', $freshPayload);
        $res3->assertSessionHasNoErrors();
        $res3->assertRedirect();

        // Now exactly ONE MORE sale must be created
        $this->assertEquals($finalSalesCount + 1, DB::table('sales')->count(), "Fresh key did not create new sale!");

        // Clean up test sales from DB to keep environment pristine
        $saleId3 = session('id') ?? session('success_dialog.saleId');
        DB::table('sales_items')->whereIn('sale_id', [$saleId1, $saleId3])->delete();
        DB::table('sales')->whereIn('id', [$saleId1, $saleId3])->delete();
        DB::table('idempotency_keys')->whereIn('key', [$idempotencyKey, $freshPayload['idempotency_key']])->delete();
    }
}
