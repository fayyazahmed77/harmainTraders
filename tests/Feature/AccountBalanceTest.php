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
        'type' => $this->customerType->id,
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

it('calculates available amount of check correctly for cheque in hand account type', function () {
    $chequeType = AccountType::create(['name' => 'Cheque in hand']);
    $chequeAccount = Account::create([
        'code' => 'CHQ-001',
        'title' => 'Cheque In Hand Account',
        'type' => $chequeType->id,
        'opening_balance' => 0,
    ]);

    // 1. Receive customer cheque into Cheque in hand
    $receipt1 = \App\Models\Payment::create([
        'voucher_no' => 'REC-001',
        'account_id' => $this->customer->id,
        'payment_account_id' => $chequeAccount->id,
        'type' => 'RECEIPT',
        'amount' => 50000,
        'discount' => 0,
        'payment_method' => 'Cheque',
        'cheque_status' => 'In Hand',
        'date' => '2026-01-01',
    ]);

    expect($chequeAccount->fresh()->current_balance)->toBe(50000.0);

    // 2. Pass cheque to supplier -> cheque_status becomes 'Distributed'
    $receipt1->update(['cheque_status' => 'Distributed']);

    expect($chequeAccount->fresh()->current_balance)->toBe(0.0);

    // 3. Receive another cheque of 30,000
    $receipt2 = \App\Models\Payment::create([
        'voucher_no' => 'REC-002',
        'account_id' => $this->customer->id,
        'payment_account_id' => $chequeAccount->id,
        'type' => 'RECEIPT',
        'amount' => 30000,
        'discount' => 0,
        'payment_method' => 'Cheque',
        'cheque_status' => 'In Hand',
        'date' => '2026-01-02',
    ]);

    expect($chequeAccount->fresh()->current_balance)->toBe(30000.0);

    // 4. Deposit cheque into bank -> cheque_status becomes 'Deposit'
    $receipt2->update(['cheque_status' => 'Deposit']);

    expect($chequeAccount->fresh()->current_balance)->toBe(0.0);
});

