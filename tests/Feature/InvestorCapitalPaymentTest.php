<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Investor;
use App\Models\InvestorCapitalAccount;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');
    $this->actingAs($this->admin);

    \App\Models\SiteSetting::firstOrCreate([], ['two_factor_enabled' => false]);

    // Setup Account Types
    $this->capitalType = AccountType::create(['id' => 9, 'name' => 'Capital']);
    $this->cashType = AccountType::create(['name' => 'Cash']);
    $this->bankType = AccountType::create(['name' => 'Bank']);
    $this->chequeType = AccountType::create(['name' => 'Cheque in hand']);

    // Setup Payment Accounts
    $this->cashAccount = Account::create([
        'code' => 'CSH-001',
        'title' => 'Main Cash in Hand',
        'type' => $this->cashType->id,
        'opening_balance' => 100000,
        'status' => true,
    ]);

    $this->bankAccount = Account::create([
        'code' => 'BNK-001',
        'title' => 'HBL Bank Account',
        'type' => $this->bankType->id,
        'opening_balance' => 200000,
        'status' => true,
    ]);

    $this->chequeAccount = Account::create([
        'code' => 'CHQ-001',
        'title' => 'Cheque In Hand Account',
        'type' => $this->chequeType->id,
        'opening_balance' => 0,
        'status' => true,
    ]);

    // Setup Investor
    $investorUser = User::factory()->create();
    $this->investor = Investor::create([
        'user_id' => $investorUser->id,
        'full_name' => 'Tariq Mehmood',
        'phone' => '03001234567',
        'cnic' => '12345-1234567-1',
        'status' => 'active',
        'joining_date' => now(),
    ]);

    $this->capitalAccount = InvestorCapitalAccount::create([
        'investor_id' => $this->investor->id,
        'initial_capital' => 500000,
        'current_capital' => 500000,
        'ownership_percentage' => 100,
    ]);

    // Capital ledger account
    $this->investorLedgerAccount = Account::create([
        'code' => 'CAP-001',
        'title' => 'Capital - Tariq Mehmood',
        'type' => 9,
        'opening_balance' => 500000,
        'status' => true,
    ]);
});

it('processes manual capital in via cash account and reflects in cash balance and capital', function () {
    $response = $this->post("/admin/investors/{$this->investor->id}/adjust-capital", [
        'amount' => 50000,
        'type' => 'capital_in',
        'payment_account_id' => $this->cashAccount->id,
        'payment_method' => 'Cash',
        'notes' => 'Cash capital injection',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    // 1. Investor Capital Account increased
    expect((float)$this->capitalAccount->fresh()->current_capital)->toBe(550000.0);

    // 2. Payment voucher created
    $payment = Payment::where('account_id', $this->investorLedgerAccount->id)->first();
    expect($payment)->not->toBeNull();
    expect($payment->type)->toBe('RECEIPT');
    expect($payment->amount)->toBe('50000.00');
    expect($payment->voucher_no)->toStartWith('CRV-');
    expect($payment->payment_account_id)->toBe($this->cashAccount->id);

    // 3. Cash account balance increased (opening 100,000 + 50,000 = 150,000)
    expect((float)$this->cashAccount->fresh()->current_balance)->toBe(150000.0);

    // 4. Investor Capital ledger account balance reflects (opening 500,000 + 50,000 = 550,000)
    expect((float)$this->investorLedgerAccount->fresh()->current_balance)->toBe(550000.0);
});

it('processes manual capital in via bank account with online transfer', function () {
    $response = $this->post("/admin/investors/{$this->investor->id}/adjust-capital", [
        'amount' => 75000,
        'type' => 'capital_in',
        'payment_account_id' => $this->bankAccount->id,
        'payment_method' => 'Online',
        'notes' => 'Direct IBFT transfer',
    ]);

    $response->assertSessionHasNoErrors();

    // 1. Investor Capital Account increased
    expect((float)$this->capitalAccount->fresh()->current_capital)->toBe(575000.0);

    // 2. Bank balance increased (opening 200,000 + 75,000 = 275,000)
    expect((float)$this->bankAccount->fresh()->current_balance)->toBe(275000.0);
});

it('processes manual capital in via cheque in hand and sets status In Hand', function () {
    $response = $this->post("/admin/investors/{$this->investor->id}/adjust-capital", [
        'amount' => 120000,
        'type' => 'capital_in',
        'payment_account_id' => $this->chequeAccount->id,
        'payment_method' => 'Cheque',
        'cheque_no' => 'MCB-998821',
        'cheque_date' => '2026-09-10',
        'notes' => 'Crossed cheque received',
    ]);

    $response->assertSessionHasNoErrors();

    $payment = Payment::where('cheque_no', 'MCB-998821')->first();
    expect($payment)->not->toBeNull();
    expect($payment->cheque_status)->toBe('In Hand');
    expect($payment->type)->toBe('RECEIPT');

    // Cheque In Hand account balance increased by 120,000
    expect((float)$this->chequeAccount->fresh()->current_balance)->toBe(120000.0);
});

it('processes manual capital out via bank and reduces bank balance', function () {
    $response = $this->post("/admin/investors/{$this->investor->id}/adjust-capital", [
        'amount' => 40000,
        'type' => 'capital_out',
        'payment_account_id' => $this->bankAccount->id,
        'payment_method' => 'Online',
        'notes' => 'Partial capital withdrawal',
    ]);

    $response->assertSessionHasNoErrors();

    // 1. Investor capital decreased (500,000 - 40,000 = 460,000)
    expect((float)$this->capitalAccount->fresh()->current_capital)->toBe(460000.0);

    // 2. Bank balance decreased (200,000 - 40,000 = 160,000)
    expect((float)$this->bankAccount->fresh()->current_balance)->toBe(160000.0);

    // 3. Payment voucher CPV created
    $payment = Payment::where('account_id', $this->investorLedgerAccount->id)->first();
    expect($payment->type)->toBe('PAYMENT');
    expect($payment->voucher_no)->toStartWith('CPV-');
});

it('processes manual capital out with existing in-hand cheque and marks it Distributed', function () {
    // 1. Receive a cheque first
    $sourcePayment = Payment::create([
        'voucher_no' => 'CRV-0010',
        'account_id' => $this->investorLedgerAccount->id,
        'payment_account_id' => $this->chequeAccount->id,
        'type' => 'RECEIPT',
        'amount' => 60000,
        'net_amount' => 60000,
        'payment_method' => 'Cheque',
        'cheque_no' => 'HBL-004411',
        'cheque_status' => 'In Hand',
        'date' => '2026-09-01',
    ]);

    expect((float)$this->chequeAccount->fresh()->current_balance)->toBe(60000.0);

    // 2. Now distribute/endorse it to investor as capital out
    $response = $this->post("/admin/investors/{$this->investor->id}/adjust-capital", [
        'amount' => 60000,
        'type' => 'capital_out',
        'payment_account_id' => $this->chequeAccount->id,
        'payment_method' => 'Cheque',
        'original_cheque_id' => $sourcePayment->id,
        'cheque_no' => 'HBL-004411',
        'notes' => 'Endorsed in-hand cheque to investor',
    ]);

    $response->assertSessionHasNoErrors();

    // Source cheque is now marked Distributed
    expect($sourcePayment->fresh()->cheque_status)->toBe('Distributed');

    // Cheque in hand balance is now 0
    expect((float)$this->chequeAccount->fresh()->current_balance)->toBe(0.0);
});
