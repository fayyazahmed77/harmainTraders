<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');
    $this->actingAs($this->admin);

    \App\Models\SiteSetting::firstOrCreate([], ['two_factor_enabled' => false]);

    // Setup Account Types
    $this->capitalType = AccountType::create(['id' => 9, 'name' => 'Capital']);
    $this->drawingsType = AccountType::create(['id' => 8, 'name' => 'Drawings']);
    $this->amanatType = AccountType::create(['id' => 17, 'name' => 'AMANAT PAYABLE']);
    $this->reserveType = AccountType::create(['id' => 18, 'name' => 'RESERVE']);
    $this->cashType = AccountType::create(['name' => 'Cash']);
    $this->bankType = AccountType::create(['name' => 'Bank']);

    // Setup Cash Account
    $this->cashAccount = Account::create([
        'code' => 'CSH-001',
        'title' => 'Main Cash Desk',
        'type' => $this->cashType->id,
        'opening_balance' => 500000,
        'status' => true,
    ]);

    // Setup accounts for each tested type
    $this->capitalAccount = Account::create([
        'code' => 'CAP-001',
        'title' => 'Capital - Partner A',
        'type' => $this->capitalType->id,
        'opening_balance' => 1000000,
        'status' => true,
    ]);

    $this->drawingsAccount = Account::create([
        'code' => 'DRW-001',
        'title' => 'Drawings - Partner A',
        'type' => $this->drawingsType->id,
        'opening_balance' => 0,
        'status' => true,
    ]);

    $this->amanatAccount = Account::create([
        'code' => 'AMN-001',
        'title' => 'Amanat - Custody Deposit',
        'type' => $this->amanatType->id,
        'opening_balance' => 0,
        'status' => true,
    ]);

    $this->reserveAccount = Account::create([
        'code' => 'RSV-001',
        'title' => 'General Reserve Account',
        'type' => $this->reserveType->id,
        'opening_balance' => 200000,
        'status' => true,
    ]);
});

it('includes Capital, Drawings, Amanat Payable, and Reserve in Payment create page accounts prop', function () {
    $response = $this->get(route('payment.create'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('daily/payment/create')
        ->has('accounts')
        ->where('accounts', function ($accounts) {
            $accountIds = collect($accounts)->pluck('id')->all();
            return in_array($this->capitalAccount->id, $accountIds) &&
                   in_array($this->drawingsAccount->id, $accountIds) &&
                   in_array($this->amanatAccount->id, $accountIds) &&
                   in_array($this->reserveAccount->id, $accountIds);
        })
    );
});

it('records Capital Payment In (Receipt) and increases Capital balance', function () {
    $response = $this->post(route('payment.store'), [
        'is_multi' => false,
        'date' => '2026-09-21',
        'account_id' => $this->capitalAccount->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 250000,
        'discount' => 0,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('payments.index'));

    $payment = Payment::where('account_id', $this->capitalAccount->id)->first();
    expect($payment)->not->toBeNull();
    expect($payment->type)->toBe('RECEIPT');
    expect((float)$payment->amount)->toBe(250000.0);
    expect($payment->voucher_no)->toStartWith('CRV-');

    // Capital balance: 1,000,000 + 250,000 = 1,250,000
    expect((float)$this->capitalAccount->fresh()->current_balance)->toBe(1250000.0);
});

it('records Capital Payment Out (Withdrawal) and decreases Capital balance', function () {
    $response = $this->post(route('payment.store'), [
        'is_multi' => false,
        'date' => '2026-09-21',
        'account_id' => $this->capitalAccount->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 150000,
        'discount' => 0,
        'type' => 'PAYMENT',
        'payment_method' => 'Cash',
        'allocations' => [],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('payments.index'));

    $payment = Payment::where('account_id', $this->capitalAccount->id)->first();
    expect($payment)->not->toBeNull();
    expect($payment->type)->toBe('PAYMENT');
    expect((float)$payment->amount)->toBe(150000.0);
    expect($payment->voucher_no)->toStartWith('CPV-');

    // Capital balance: 1,000,000 - 150,000 = 850,000
    expect((float)$this->capitalAccount->fresh()->current_balance)->toBe(850000.0);
});

it('records Drawings Payment Out and increases Drawings taken', function () {
    $response = $this->post(route('payment.store'), [
        'is_multi' => false,
        'date' => '2026-09-21',
        'account_id' => $this->drawingsAccount->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 50000,
        'discount' => 0,
        'type' => 'PAYMENT',
        'payment_method' => 'Cash',
        'allocations' => [],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('payments.index'));

    $payment = Payment::where('account_id', $this->drawingsAccount->id)->first();
    expect($payment)->not->toBeNull();
    expect($payment->type)->toBe('PAYMENT');
    expect((float)$payment->amount)->toBe(50000.0);
    expect($payment->voucher_no)->toStartWith('CPV-');

    // Drawings balance: 0 + 50,000 = 50,000
    expect((float)$this->drawingsAccount->fresh()->current_balance)->toBe(50000.0);
});

it('records Amanat Payable Receipt (In) and Payment (Out) with correct liability balance', function () {
    // 1. Receive Amanat (50,000)
    $this->post(route('payment.store'), [
        'is_multi' => false,
        'date' => '2026-09-21',
        'account_id' => $this->amanatAccount->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 50000,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [],
    ])->assertSessionHasNoErrors();

    expect((float)$this->amanatAccount->fresh()->current_balance)->toBe(50000.0);

    // 2. Return part of Amanat (20,000)
    $this->post(route('payment.store'), [
        'is_multi' => false,
        'date' => '2026-09-21',
        'account_id' => $this->amanatAccount->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 20000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cash',
        'allocations' => [],
    ])->assertSessionHasNoErrors();

    // Amanat liability remaining: 50,000 - 20,000 = 30,000
    expect((float)$this->amanatAccount->fresh()->current_balance)->toBe(30000.0);
});

it('records Reserve Payment In and reflects in getUnpaidBills endpoint', function () {
    // 1. Deposit to Reserve
    $this->post(route('payment.store'), [
        'is_multi' => false,
        'date' => '2026-09-21',
        'account_id' => $this->reserveAccount->id,
        'payment_account_id' => $this->cashAccount->id,
        'amount' => 100000,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [],
    ])->assertSessionHasNoErrors();

    // Reserve balance: 200,000 + 100,000 = 300,000
    expect((float)$this->reserveAccount->fresh()->current_balance)->toBe(300000.0);

    // Check getUnpaidBills endpoint
    $res = $this->get(route('payment.unpaid-bills', ['account_id' => $this->reserveAccount->id]));
    $res->assertStatus(200);
    $res->assertJson([
        'bills' => [],
        'current_balance' => 300000,
        'orientation' => 'cr',
        'total_received_paid' => 100000,
        'total_balance' => 300000,
    ]);
});
