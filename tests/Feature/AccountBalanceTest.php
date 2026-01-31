<?php

use App\Models\Account;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\SalesReturn;
use App\Models\PurchaseReturn;
use App\Models\AccountType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = App\Models\User::factory()->create();
    $this->actingAs($this->user);
    // Setup Account Types
    $this->customerType = AccountType::create(['name' => 'Customers']);

    // Setup Customer
    $this->customer = Account::create([
        'code' => 'C001',
        'title' => 'Ledger Customer',
        'type' => 'Customers',
        'opening_balance' => 100, // Opening Dr
    ]);
});

it('calculates the net account balance correctly across multiple modules', function () {
    // 1. Unpaid Sale (+1000)
    Sales::create([
        'date' => '2026-01-01',
        'invoice' => 'SLS-001',
        'customer_id' => $this->customer->id,
        'gross_total' => 1000,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 1000,
        'paid_amount' => 0,
        'remaining_amount' => 1000,
        'courier_charges' => 0,
    ]);

    // 2. Unpaid Sales Return (-200)
    SalesReturn::create([
        'date' => '2026-01-02',
        'invoice' => 'SRT-001',
        'customer_id' => $this->customer->id,
        'gross_total' => 200,
        'discount_total' => 0,
        'tax_total' => 0,
        'net_total' => 200,
        'paid_amount' => 0,
        'remaining_amount' => 200,
        'courier_charges' => 0,
    ]);

    // Current expected balance = 100 (opening) + 1000 (sales) - 200 (returns) = 900

    $response = $this->get(route('account.balance', $this->customer->id));

    $response->assertStatus(200);
    $response->assertJson(['balance' => 900]);
});
