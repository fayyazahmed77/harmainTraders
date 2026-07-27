<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Payment;
use App\Models\Sales;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $this->customerType = AccountType::create(['name' => 'Customers']);
    $this->supplierType = AccountType::create(['name' => 'Supplier']);
    $this->cashType = AccountType::create(['name' => 'Cash']);

    $this->customer = Account::create([
        'code' => 'CST-001',
        'title' => 'Workflow Customer',
        'type' => $this->customerType->id,
        'opening_balance' => 0,
    ]);

    $this->cashAccount = Account::create([
        'code' => 'CSH-001',
        'title' => 'Office Cash',
        'type' => $this->cashType->id,
        'opening_balance' => 0,
    ]);
});

it('creates a single payment receipt and auto-allocates to unpaid sale via FIFO', function () {
    // 1. Create unpaid sale
    $sale = Sales::create([
        'date' => '2026-07-25',
        'invoice' => 'SLS-90001',
        'customer_id' => $this->customer->id,
        'gross_total' => 5000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 5000,
        'paid_amount' => 0,
        'remaining_amount' => 5000,
        'courier_charges' => 0,
    ]);

    // 2. Post receipt without explicit allocation payload (triggers auto-FIFO)
    $response = $this->post(route('payment.store'), [
        'is_multi' => false,
        'date' => '2026-07-25',
        'account_id' => $this->customer->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 5000,
        'discount' => 0,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [],
    ]);

    $response->assertRedirect(route('payment.create'));
    $response->assertSessionHas('success');

    // 3. Assert sale is now fully paid
    $sale->refresh();
    expect((float)$sale->paid_amount)->toBe(5000.0);
    expect((float)$sale->remaining_amount)->toBe(0.0);
    expect($sale->status)->toBe('Paid');
});

it('fetches unpaid bills accurately via getUnpaidBills endpoint', function () {
    Sales::create([
        'date' => '2026-07-25',
        'invoice' => 'SLS-90002',
        'customer_id' => $this->customer->id,
        'gross_total' => 2500,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 2500,
        'paid_amount' => 500,
        'remaining_amount' => 2000,
        'courier_charges' => 0,
    ]);

    $response = $this->get(route('payment.unpaid-bills', ['account_id' => $this->customer->id]));

    $response->assertStatus(200);
    $response->assertJsonFragment([
        'invoice_no' => 'SLS-90002',
        'remaining_amount' => 2000,
    ]);
});

it('handles decimal precision in allocations without rounding artifacts', function () {
    $sale = Sales::create([
        'date' => '2026-07-25',
        'invoice' => 'SLS-90003',
        'customer_id' => $this->customer->id,
        'gross_total' => 1879790.75,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 1879790.75,
        'paid_amount' => 0,
        'remaining_amount' => 1879790.75,
        'courier_charges' => 0,
    ]);

    $response = $this->post(route('payment.store'), [
        'is_multi' => false,
        'date' => '2026-07-25',
        'account_id' => $this->customer->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 1870000.50,
        'discount' => 9790.25,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [],
    ]);

    $response->assertRedirect(route('payment.create'));

    $sale->refresh();
    expect((float)$sale->paid_amount)->toBe(1879790.75);
    expect((float)$sale->remaining_amount)->toBe(0.0);
    expect($sale->status)->toBe('Paid');
});
