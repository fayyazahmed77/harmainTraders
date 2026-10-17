<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Sales;
use App\Models\Purchase;
use App\Services\AccountReconciliationService;
use App\Services\PaymentAllocationEngine;
use Illuminate\Support\Facades\DB;

class AccountReconciliationServiceTest extends TestCase
{
    protected AccountReconciliationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(AccountReconciliationService::class);
    }

    public function test_reconcile_single_customer_absorbs_unallocated_cash_to_opening_balance(): void
    {
        DB::beginTransaction();

        try {
            // Create test customer with Opening Balance of 50,000
            $customer = Account::create([
                'title' => 'TEST RECON CUSTOMER ' . uniqid(),
                'type' => 3,
                'sale' => 1,
                'opening_balance' => 50000.00,
                'opening_balance_type' => 'DR',
                'current_balance' => 50000.00,
                'status' => 'active',
            ]);

            // Create historical payment of 30,000 with 0 allocations
            $payment = Payment::create([
                'voucher_no' => 'CRV-TEST-' . rand(1000, 9999),
                'date' => '2026-10-01',
                'account_id' => $customer->id,
                'type' => 'RECEIPT',
                'amount' => 30000.00,
                'discount' => 0.00,
                'net_amount' => 30000.00,
                'status' => 'completed',
            ]);

            // Reconcile in dry run
            $dryReport = $this->service->reconcileAccount($customer, ['dry_run' => true]);
            $this->assertEquals(50000.00, $dryReport['initial_remaining_ob']);
            $this->assertEquals(30000.00, $dryReport['ob_allocated']);
            $this->assertEquals(20000.00, $dryReport['final_remaining_ob']);
            $this->assertEquals(0, PaymentAllocation::where('payment_id', $payment->id)->count());

            // Reconcile with apply (dry_run: false)
            $liveReport = $this->service->reconcileAccount($customer, ['dry_run' => false]);
            $this->assertEquals(30000.00, $liveReport['ob_allocated']);
            $this->assertEquals(20000.00, $liveReport['final_remaining_ob']);
            
            // Verify allocation was created
            $alloc = PaymentAllocation::where('payment_id', $payment->id)->first();
            $this->assertNotNull($alloc);
            $this->assertEquals(30000.00, (float)$alloc->amount);
            $this->assertEquals(Account::class, $alloc->bill_type);
            $this->assertEquals($customer->id, $alloc->bill_id);

            // Verify engine now reports remaining OB as 20,000
            $engine = app(PaymentAllocationEngine::class);
            $this->assertEquals(20000.00, $engine->getRemainingOpeningBalance($customer));

        } finally {
            DB::rollBack();
        }
    }

    public function test_reconcile_closes_rounding_discrepancies_on_returned_invoices(): void
    {
        DB::beginTransaction();

        try {
            $customer = Account::create([
                'title' => 'TEST ROUNDING CUSTOMER ' . uniqid(),
                'type' => 3,
                'sale' => 1,
                'opening_balance' => 0.00,
                'current_balance' => 0.00,
                'status' => 'active',
            ]);

            $sale = Sales::create([
                'customer_id' => $customer->id,
                'invoice' => 'SLS-TEST-' . rand(1000, 9999),
                'date' => '2026-10-01',
                'net_total' => 10000.00,
                'paid_amount' => 0.00,
                'remaining_amount' => 1.40,
                'status' => 'Returned',
            ]);

            // Reconcile
            $report = $this->service->reconcileAccount($customer, [
                'dry_run' => false,
                'auto_close_rounding' => true,
                'rounding_threshold' => 5.00,
            ]);

            $this->assertCount(1, $report['rounding_gaps_closed']);
            $this->assertEquals(1.40, $report['rounding_gaps_closed'][0]['residual']);

            $freshSale = Sales::find($sale->id);
            $this->assertEquals(0.00, (float)$freshSale->remaining_amount);

        } finally {
            DB::rollBack();
        }
    }
}
