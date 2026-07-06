<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Items;
use App\Models\Sales;
use App\Models\SalesReturn;
use App\Models\CustomerCredit;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnAllocation;
use App\Models\SupplierCredit;
use App\Services\FIFOAllocationService;
use App\Services\CustomerCreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReturnSettlementServiceTest extends TestCase
{
    use RefreshDatabase;

    public $customer;
    public $cashAccount;
    public $item;
    public $fifoService;
    public $creditService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fifoService = new FIFOAllocationService();
        $this->creditService = new CustomerCreditService();

        // Setup Account Types
        $customerType = AccountType::create(['name' => 'Customers']);
        $cashType = AccountType::create(['name' => 'Cash']);

        // Setup Accounts
        $this->customer = Account::create([
            'code' => 'C001',
            'title' => 'Test Customer',
            'type' => $customerType->id,
            'opening_balance' => 0,
        ]);

        $this->cashAccount = Account::create([
            'code' => 'CASH01',
            'title' => 'Main Cash',
            'type' => $cashType->id,
            'opening_balance' => 0,
        ]);

        // Setup Items
        $this->item = Items::create([
            'code' => 'ITM001',
            'title' => 'Test Item',
            'stock_1' => 100,
            'trade_price' => 10,
        ]);
    }

    /** @test */
    public function it_allocates_return_value_to_oldest_invoices_first_fifo()
    {
        // 1. Create Invoice 1: Rs 2000 (oldest)
        $invoice1 = Sales::create([
            'date' => '2026-07-01',
            'invoice' => 'SLS-001',
            'customer_id' => $this->customer->id,
            'no_of_items' => 1,
            'gross_total' => 2000,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 2000,
            'paid_amount' => 0,
            'remaining_amount' => 2000,
            'courier_charges' => 0.00,
            'status' => 'Completed',
        ]);

        // 2. Create Invoice 2: Rs 3000
        $invoice2 = Sales::create([
            'date' => '2026-07-02',
            'invoice' => 'SLS-002',
            'customer_id' => $this->customer->id,
            'no_of_items' => 1,
            'gross_total' => 3000,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 3000,
            'paid_amount' => 0,
            'remaining_amount' => 3000,
            'courier_charges' => 0.00,
            'status' => 'Completed',
        ]);

        // 3. Create a Sales Return for Rs 3500
        $return = SalesReturn::create([
            'date' => '2026-07-03',
            'invoice' => 'RET-001',
            'original_invoice' => 'SLS-001',
            'sale_id' => $invoice1->id,
            'customer_id' => $this->customer->id,
            'gross_total' => 3500,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 3500,
        ]);

        // Run allocation
        $this->fifoService->allocate($return, 3500);

        // Verify Invoice 1 is completely paid (remaining = 0)
        $invoice1->refresh();
        $this->assertEquals(0, $invoice1->remaining_amount);
        $this->assertEquals('Returned', $invoice1->status);

        // Verify Invoice 2 has remaining balance reduced from 3000 to 1500
        $invoice2->refresh();
        $this->assertEquals(1500, $invoice2->remaining_amount);
        $this->assertEquals('Partial Return', $invoice2->status);

        // Verify no CustomerCredit note was created (no excess)
        $this->assertEquals(0, CustomerCredit::count());
    }

    /** @test */
    public function it_creates_customer_credit_for_excess_returns()
    {
        // 1. Create Invoice 1: Rs 1000
        $invoice1 = Sales::create([
            'date' => '2026-07-01',
            'invoice' => 'SLS-001',
            'customer_id' => $this->customer->id,
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

        // 2. Create Sales Return for Rs 1500 (exceeds SLS-001 debt of 1000 by 500)
        $return = SalesReturn::create([
            'date' => '2026-07-02',
            'invoice' => 'RET-001',
            'original_invoice' => 'SLS-001',
            'sale_id' => $invoice1->id,
            'customer_id' => $this->customer->id,
            'gross_total' => 1500,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 1500,
        ]);

        // Run allocation
        $this->fifoService->allocate($return, 1500);

        // Verify Invoice 1 remaining is 0
        $invoice1->refresh();
        $this->assertEquals(0, $invoice1->remaining_amount);

        // Verify Customer Credit Note of 500 is created
        $this->assertEquals(1, CustomerCredit::count());
        $credit = CustomerCredit::first();
        $this->assertEquals(500, $credit->amount);
        $this->assertEquals(500, $credit->available_balance);
        $this->assertEquals('Available', $credit->status);
    }

    /** @test */
    public function it_refunds_available_credit_balance()
    {
        $invoice = Sales::create([
            'date' => '2026-07-01',
            'invoice' => 'SLS-001',
            'customer_id' => $this->customer->id,
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

        $return = SalesReturn::create([
            'date' => '2026-07-02',
            'invoice' => 'RET-001',
            'original_invoice' => 'SLS-001',
            'sale_id' => $invoice->id,
            'customer_id' => $this->customer->id,
            'gross_total' => 1000,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 1000,
        ]);

        $credit = CustomerCredit::create([
            'customer_id' => $this->customer->id,
            'sales_return_id' => $return->id,
            'amount' => 1000,
            'available_balance' => 1000,
            'status' => 'Available',
        ]);

        // Refund Rs 400
        $payment = $this->creditService->processCreditRefund(
            $credit->id,
            400,
            '2026-07-02',
            'Cash',
            $this->cashAccount->id,
            'Partial refund'
        );

        $credit->refresh();
        $this->assertEquals(600, $credit->available_balance);
        $this->assertEquals('Partial', $credit->status);

        $this->assertEquals($credit->id, $payment->customer_credit_id);
    }

    /** @test */
    public function it_allocates_purchase_return_value_to_oldest_purchases_first_fifo()
    {
        // 1. Create Purchase 1: Rs 2000 (oldest)
        $purchase1 = Purchase::create([
            'date' => '2026-07-01',
            'invoice' => 'PUR-001',
            'supplier_id' => $this->customer->id,
            'no_of_items' => 1,
            'gross_total' => 2000,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 2000,
            'paid_amount' => 0,
            'remaining_amount' => 2000,
            'courier_charges' => 0.00,
            'status' => 'Completed',
        ]);

        // 2. Create Purchase 2: Rs 3000
        $purchase2 = Purchase::create([
            'date' => '2026-07-02',
            'invoice' => 'PUR-002',
            'supplier_id' => $this->customer->id,
            'no_of_items' => 1,
            'gross_total' => 3000,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 3000,
            'paid_amount' => 0,
            'remaining_amount' => 3000,
            'courier_charges' => 0.00,
            'status' => 'Completed',
        ]);

        // 3. Create a Purchase Return for Rs 3500
        $return = PurchaseReturn::create([
            'date' => '2026-07-03',
            'invoice' => 'PRET-001',
            'original_invoice' => 'PUR-001',
            'supplier_id' => $this->customer->id,
            'gross_total' => 3500,
            'discount_total' => 0,
            'tax_total' => 0,
            'net_total' => 3500,
            'paid_amount' => 0,
            'remaining_amount' => 3500,
        ]);

        // Run allocation
        $this->fifoService->allocatePurchaseReturn($return, 3500);

        // Verify Purchase 1 is completely paid/returned (remaining = 0)
        $purchase1->refresh();
        $this->assertEquals(0, $purchase1->remaining_amount);
        $this->assertEquals('Returned', $purchase1->status);

        // Verify Purchase 2 has remaining balance reduced from 3000 to 1500
        $purchase2->refresh();
        $this->assertEquals(1500, $purchase2->remaining_amount);
        $this->assertEquals('Partial Return', $purchase2->status);

        // Verify no SupplierCredit was created
        $this->assertEquals(0, SupplierCredit::count());
    }
}
