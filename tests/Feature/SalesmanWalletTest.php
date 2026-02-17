<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Saleman;
use App\Models\Sales;
use App\Models\Items;
use App\Models\WalletTransaction;
use App\Models\Firm;

class SalesmanWalletTest extends TestCase
{
    // use RefreshDatabase; // Commented out to avoid wiping DB if not configured for testing

    protected function setUp(): void
    {
        parent::setUp();
        // Create a user and authenticate
        $user = User::first(); // Assuming seed data exists or use factory
        if (!$user) {
            $user = User::factory()->create();
        }
        $this->actingAs($user);
    }

    public function test_salesman_creation_with_commission()
    {
        $response = $this->post('/salemen', [
            'name' => 'Test Salesman',
            'shortname' => 'TS',
            'code' => '999',
            'date' => '2023-01-01',
            'status' => true,
            'defult' => false,
            'commission_percentage' => 5.5,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('salemen', [
            'code' => '999',
            'commission_percentage' => 5.5,
            'wallet_balance' => 0,
        ]);
    }

    public function test_sale_commission_calculation()
    {
        // 1. Create Salesman
        $salesman = Saleman::create([
            'name' => 'Commission Agent',
            'shortname' => 'CA',
            'code' => '888',
            'date' => now(),
            'commission_percentage' => 10, // 10%
            'wallet_balance' => 0,
            'created_by' => 1,
        ]);

        // 2. Create Item
        $item = Items::first();
        if (!$item) {
            // Create dummy item if none exists
            // Skip if no items table or factories setup, assuming existing DB
            $this->markTestSkipped('No items found for testing');
        }

        // 3. Create Sale
        $saleData = [
            'date' => now()->format('Y-m-d'),
            'invoice' => 'TEST-INV-001',
            'customer_id' => 1, // Assumed
            'salesman_id' => $salesman->id,
            'no_of_items' => 1,
            'gross_total' => 1000,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 1000,
            'paid_amount' => 0,
            'remaining_amount' => 1000,
            'items' => [
                [
                    'item_id' => $item->id,
                    'qty_carton' => 0,
                    'qty_pcs' => 10,
                    'total_pcs' => 10,
                    'trade_price' => 100,
                    'discount' => 0,
                    'gst_amount' => 0,
                    'subtotal' => 1000,
                ]
            ],
            'allow_negative_stock' => true
        ];

        $response = $this->post('/sales', $saleData);

        // 4. Assertions
        $response->assertSessionHasNoErrors();

        $salesman->refresh();
        $this->assertEquals(100, $salesman->wallet_balance); // 10% of 1000

        $this->assertDatabaseHas('wallet_transactions', [
            'salesman_id' => $salesman->id,
            'amount' => 100,
            'type' => 'credit',
        ]);
    }

    public function test_manual_wallet_transaction()
    {
        $salesman = Saleman::where('code', '888')->first();
        if (!$salesman) $this->markTestSkipped('Salesman not found');

        $initialBalance = $salesman->wallet_balance;

        $response = $this->post("/salemen/{$salesman->id}/wallet/transaction", [
            'type' => 'credit',
            'amount' => 500,
            'description' => 'Bonus',
            'status' => 'paid',
        ]);

        $response->assertSessionHasNoErrors();
        $salesman->refresh();
        $this->assertEquals($initialBalance + 500, $salesman->wallet_balance);
    }

    public function test_mark_commission_paid()
    {
        $salesman = Saleman::where('code', '888')->first();
        if (!$salesman) $this->markTestSkipped('Salesman not found');

        // Verify we have a credit transaction from previous test
        $transaction = WalletTransaction::where('salesman_id', $salesman->id)
            ->where('type', 'credit')
            ->where('status', 'unpaid')
            ->first();

        if (!$transaction) {
            // Create one if not exists
            $transaction = WalletTransaction::create([
                'salesman_id' => $salesman->id,
                'type' => 'credit',
                'amount' => 100,
                'description' => 'Test Commission',
                'status' => 'unpaid'
            ]);
            $salesman->wallet_balance += 100;
            $salesman->save();
        }

        $initialBalance = $salesman->wallet_balance;
        $amount = $transaction->amount;

        $response = $this->put("/salemen/wallet/transactions/{$transaction->id}/pay");

        $response->assertSessionHasNoErrors();

        $salesman->refresh();
        $transaction->refresh();

        $this->assertEquals('paid', $transaction->status);
        $this->assertEquals($initialBalance - $amount, $salesman->wallet_balance);
    }
}
