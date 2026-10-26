<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\User;
use App\Services\ReportBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $this->customerType = AccountType::create(['name' => 'Customers']);
    $this->supplierType = AccountType::create(['name' => 'Suppliers']);

    $this->customer = Account::create([
        'code' => 'CST-001',
        'title' => 'Test Customer Alpha',
        'type' => $this->customerType->id,
        'sale' => 1,
        'purchase' => 0,
        'opening_balance' => 0,
    ]);

    $this->supplier = Account::create([
        'code' => 'SUP-001',
        'title' => 'Test Supplier Beta',
        'type' => $this->supplierType->id,
        'sale' => 0,
        'purchase' => 1,
        'opening_balance' => 0,
    ]);

    $this->hybrid = Account::create([
        'code' => 'HYB-001',
        'title' => 'Test Hybrid Trader',
        'type' => $this->customerType->id,
        'sale' => 1,
        'purchase' => 1,
        'opening_balance' => 0,
    ]);

    $this->reportBuilder = app(ReportBuilder::class);
});

it('includes older unpaid sales invoices originating before the as-of cutoff date in dueBills', function () {
    // Invoice 1 created 30 days ago
    Sales::create([
        'date' => '2026-01-10',
        'invoice' => 'SLS-101',
        'customer_id' => $this->customer->id,
        'gross_total' => 5000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 5000,
        'paid_amount' => 1000,
        'remaining_amount' => 4000,
        'courier_charges' => 0,
    ]);

    // Invoice 2 created 5 days ago
    Sales::create([
        'date' => '2026-02-05',
        'invoice' => 'SLS-102',
        'customer_id' => $this->customer->id,
        'gross_total' => 3000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 3000,
        'paid_amount' => 0,
        'remaining_amount' => 3000,
        'courier_charges' => 0,
    ]);

    // Query As-Of 2026-02-10: both bills should be included
    $results = $this->reportBuilder->dueBills($this->customer->id, '2026-02-10');

    expect($results)->toHaveCount(2);
    $invoices = collect($results)->pluck('voucher_no')->all();
    expect($invoices)->toContain('SLS-101', 'SLS-102');
});

it('verifies sequential bills show distinct remaining amounts versus cumulative running balance in dueBills', function () {
    Sales::create([
        'date' => '2026-01-01',
        'invoice' => 'SLS-201',
        'customer_id' => $this->customer->id,
        'gross_total' => 4000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 4000,
        'paid_amount' => 0,
        'remaining_amount' => 4000,
        'courier_charges' => 0,
    ]);

    Sales::create([
        'date' => '2026-01-05',
        'invoice' => 'SLS-202',
        'customer_id' => $this->customer->id,
        'gross_total' => 6000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 6000,
        'paid_amount' => 0,
        'remaining_amount' => 6000,
        'courier_charges' => 0,
    ]);

    $results = $this->reportBuilder->dueBills($this->customer->id, null, '2026-01-31');

    expect($results)->toHaveCount(2);

    $bill1 = $results[0];
    $bill2 = $results[1];

    // Bill 1 remaining is 4000, cumulative balance is 4000
    expect((float)$bill1['remaining'])->toEqual(4000.0);
    expect((float)$bill1['balance'])->toEqual(4000.0);

    // Bill 2 remaining is 6000, cumulative running balance is 10000 (4000 + 6000)
    expect((float)$bill2['remaining'])->toEqual(6000.0);
    expect((float)$bill2['balance'])->toEqual(10000.0);

    // Verify individual remaining differs from cumulative balance on second bill
    expect((float)$bill2['remaining'])->not->toEqual((float)$bill2['balance']);
});

it('settles oldest bills first via FIFO and omits bills that are 100% covered', function () {
    // Older Sale 1: 10,000 (net 10,000)
    Sales::create([
        'date' => '2026-01-01',
        'invoice' => 'SLS-OLD-01',
        'customer_id' => $this->customer->id,
        'gross_total' => 10000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 10000,
        'paid_amount' => 0,
        'remaining_amount' => 10000,
        'courier_charges' => 0,
    ]);

    // Newer Sale 2: 5,000 (net 5,000)
    Sales::create([
        'date' => '2026-01-15',
        'invoice' => 'SLS-NEW-02',
        'customer_id' => $this->customer->id,
        'gross_total' => 5000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 5000,
        'paid_amount' => 0,
        'remaining_amount' => 5000,
        'courier_charges' => 0,
    ]);

    // Unallocated Receipt of 12,000 covers 100% of Sale 1 (10,000) and 2,000 of Sale 2
    Payment::create([
        'account_id' => $this->customer->id,
        'type' => 'RECEIPT',
        'date' => '2026-01-20',
        'voucher_no' => 'REC-001',
        'amount' => 12000,
        'allocated_amount' => 0,
    ]);

    $results = $this->reportBuilder->dueBills($this->customer->id, null, '2026-01-31');

    // Sale 1 is 100% covered, so it MUST NOT be displayed!
    // Only Sale 2 survives with 3,000 remaining.
    expect($results)->toHaveCount(1);
    expect($results[0]['voucher_no'])->toEqual('SLS-NEW-02');
    expect((float)$results[0]['remaining'])->toEqual(3000.0);
    expect((float)$results[0]['balance'])->toEqual(3000.0);
});

it('correctly handles hybrid accounts having both sales and purchases with FIFO covering', function () {
    // Sale to hybrid party (+15,000 receivable)
    Sales::create([
        'date' => '2026-01-10',
        'invoice' => 'SLS-301',
        'customer_id' => $this->hybrid->id,
        'gross_total' => 15000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 15000,
        'paid_amount' => 0,
        'remaining_amount' => 15000,
        'courier_charges' => 0,
    ]);

    // Purchase from hybrid party (+9,000 payable)
    Purchase::create([
        'date' => '2026-01-15',
        'invoice' => 'PUR-301',
        'supplier_id' => $this->hybrid->id,
        'gross_total' => 9000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 9000,
        'paid_amount' => 0,
        'remaining_amount' => 9000,
        'courier_charges' => 0,
    ]);

    // In dueBills: the 9,000 purchase covers 9,000 of the 15,000 sale.
    // The purchase is 100% covered and omitted.
    // Only the remaining 6,000 of the sale displays.
    $results = $this->reportBuilder->dueBills($this->hybrid->id, null, '2026-01-31');

    expect($results)->toHaveCount(1);
    expect($results[0]['voucher_no'])->toEqual('SLS-301');
    expect((float)$results[0]['remaining'])->toEqual(6000.0);
    expect((float)$results[0]['balance'])->toEqual(6000.0);
});

it('ensures dueBillsPrint returns the blade view directly with print mode enabled', function () {
    $response = $this->get(route('reports.accounts.due_bills.print', [
        'account_id' => 'ALL',
        'to' => '2026-10-23',
    ]));

    $response->assertStatus(200);
    $response->assertViewIs('pdf.due-bills');
    $response->assertViewHas('is_print_mode', true);
});

it('ensures outstandingBillWisePrint returns the blade view directly with print mode enabled', function () {
    $response = $this->get(route('reports.accounts.outstanding_billwise.print', [
        'account_id' => 'ALL',
        'to' => '2026-10-23',
    ]));

    $response->assertStatus(200);
    $response->assertViewIs('pdf.outstanding-billwise');
    $response->assertViewHas('is_print_mode', true);
});

it('ensures batch preloading in outstandingBillWise runs cleanly in consolidated mode', function () {
    $results = $this->reportBuilder->outstandingBillWise('ALL', null, '2026-12-31');
    expect($results)->toBeIterable();
});
