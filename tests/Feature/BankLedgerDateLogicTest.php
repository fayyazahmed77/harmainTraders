<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Payment;
use App\Models\User;
use App\Services\ReportBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    DB::table('account_types')->insertOrIgnore([
        ['id' => 2, 'name' => 'Bank', 'created_at' => now(), 'updated_at' => now()],
        ['id' => 3, 'name' => 'Customers', 'created_at' => now(), 'updated_at' => now()],
    ]);

    $this->bank = Account::create([
        'code' => 'BNK-001',
        'title' => 'Al-Falah Bank',
        'type' => 2,
        'opening_balance' => 100000,
        'opening_balance_type' => 'DR',
        'status' => true,
    ]);

    $this->party = Account::create([
        'code' => 'CUS-001',
        'title' => 'Test Party',
        'type' => 3,
        'opening_balance' => 0,
        'opening_balance_type' => 'DR',
        'status' => true,
    ]);
});

it('filters Bank Ledger accurately by Voucher Date, Clear Cheque Date, and Return Cheque Date without distorting Real Bank Balance', function () {
    // 1. Cheque issued in Oct (2026-10-10), CLEARED in Nov (2026-11-05) -> Withdrawal 15,000
    Payment::create([
        'date' => '2026-10-10',
        'cheque_date' => '2026-11-01',
        'clear_date' => '2026-11-05',
        'voucher_no' => 'CPV-CLEAR-01',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 15000,
        'net_amount' => 15000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_no' => 'CHQ-101',
        'cheque_status' => 'Clear',
    ]);

    // 2. Cheque issued in Nov (2026-11-02), still PENDING -> Withdrawal 20,000 (float only)
    Payment::create([
        'date' => '2026-11-02',
        'cheque_date' => '2026-11-10',
        'clear_date' => null,
        'voucher_no' => 'CPV-PEND-01',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 20000,
        'net_amount' => 20000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_no' => 'CHQ-102',
        'cheque_status' => 'Pending',
    ]);

    // 3. Cheque issued in Oct (2026-10-15), RETURNED / CANCELED in Nov (2026-11-08) -> 30,000 (ZERO bank impact!)
    Payment::create([
        'date' => '2026-10-15',
        'cheque_date' => '2026-11-03',
        'clear_date' => null,
        'return_date' => '2026-11-08',
        'voucher_no' => 'CPV-RET-01',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 30000,
        'net_amount' => 30000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_no' => 'CHQ-103',
        'cheque_status' => 'Canceled',
    ]);

    // 4. Online cleared deposit in Nov (2026-11-06, clear_date null -> falls back to date) -> Deposit 5,000
    Payment::create([
        'date' => '2026-11-06',
        'voucher_no' => 'CRV-ONL-01',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 5000,
        'net_amount' => 5000,
        'type' => 'RECEIPT',
        'payment_method' => 'Online',
        'cheque_status' => 'Clear',
    ]);

    $builder = new ReportBuilder();

    // A) Mode 1: By Voucher Date ('invdate') for Nov 1 - Nov 30
    // Prior before Nov 1 = OB 100,000 - CPV-CLEAR-01 (date Oct 10) 15,000 = 85,000
    // In Nov: CPV-PEND-01 (pending float 20,000) + CRV-ONL-01 (+5,000) -> Closing 90,000
    $invRes = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['dateType' => 'invdate']);
    expect((float) $invRes['opening_balance'])->toBe(85000.0);
    expect((float) $invRes['total_cleared_deposits'])->toBe(5000.0);
    expect((float) $invRes['total_cleared_withdrawals'])->toBe(0.0);
    expect((float) $invRes['total_uncleared_float'])->toBe(20000.0);
    expect((float) $invRes['closing_bank_balance'])->toBe(90000.0);
    expect(collect($invRes['data']->items())->pluck('voucher_no')->all())->toBe(['CPV-PEND-01', 'CRV-ONL-01']);

    // B) Mode 2: By Clear Cheque Date ('cleardate') for Nov 1 - Nov 30
    // Strictly Cheque method ONLY, with BOTH Pending (by cheque_date Nov 10) & Cleared (by clear_date Nov 5) cheques!
    // Online (CRV-ONL-01) and Returned (CPV-RET-01) are EXCLUDED!
    $clearRes = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['dateType' => 'cleardate']);
    expect((float) $clearRes['opening_balance'])->toBe(100000.0);
    expect((float) $clearRes['total_cleared_deposits'])->toBe(0.0);
    expect((float) $clearRes['total_cleared_withdrawals'])->toBe(15000.0);
    expect((float) $clearRes['total_uncleared_float'])->toBe(20000.0);
    expect((float) $clearRes['closing_bank_balance'])->toBe(85000.0);
    expect(collect($clearRes['data']->items())->pluck('voucher_no')->all())->toBe(['CPV-CLEAR-01', 'CPV-PEND-01']);
    expect(collect($clearRes['data']->items())->pluck('method')->unique()->all())->toBe(['Cheque']);

    // C) Mode 3: By Return Cheque Date ('returndate') for Nov 1 - Nov 30
    // Only CPV-RET-01 (return_date Nov 8) appears, with is_returned=true and ZERO impact on bank balance!
    $retRes = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['dateType' => 'returndate']);
    expect($retRes['returned_count'])->toBe(1);
    expect((float) $retRes['total_returned_amount'])->toBe(30000.0);
    expect((float) $retRes['total_cleared_deposits'])->toBe(0.0);
    expect((float) $retRes['total_cleared_withdrawals'])->toBe(0.0);
    expect((float) $retRes['total_uncleared_float'])->toBe(0.0);
    expect((float) $retRes['closing_bank_balance'])->toBe((float) $retRes['opening_balance']);
    $retItems = $retRes['data']->items();
    expect($retItems)->toHaveCount(1);
    expect($retItems[0]['voucher_no'])->toBe('CPV-RET-01');
    expect($retItems[0]['is_returned'])->toBeTrue();
    expect($retItems[0]['return_date'])->toBe('2026-11-08');
    expect($retItems[0]['impacts_balance'])->toBeFalse();

    // Real bank account current_balance invariant untouched!
    expect((float) $this->bank->fresh()->current_balance)->toBe(90000.0);
});

it('filters Bank Ledger by Online, Cheque, Receipt (IN), Payment (OUT) and preserves filters + search across pagination', function () {
    // 1. Online RECEIPT (IN)
    Payment::create([
        'date' => '2026-11-02',
        'voucher_no' => 'CRV-ONL-101',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 1000,
        'net_amount' => 1000,
        'type' => 'RECEIPT',
        'payment_method' => 'Online',
        'cheque_status' => 'Clear',
    ]);

    // 2. Online PAYMENT (OUT)
    Payment::create([
        'date' => '2026-11-03',
        'voucher_no' => 'CPV-ONL-102',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 2000,
        'net_amount' => 2000,
        'type' => 'PAYMENT',
        'payment_method' => 'Online',
        'cheque_status' => 'Clear',
    ]);

    // 3. Cheque RECEIPT (IN)
    Payment::create([
        'date' => '2026-11-04',
        'cheque_date' => '2026-11-04',
        'clear_date' => '2026-11-04',
        'voucher_no' => 'CRV-CHQ-103',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 3000,
        'net_amount' => 3000,
        'type' => 'RECEIPT',
        'payment_method' => 'Cheque',
        'cheque_no' => 'CHQ-AAA',
        'cheque_status' => 'Clear',
    ]);

    // 4. Cheque PAYMENT (OUT) #1
    Payment::create([
        'date' => '2026-11-05',
        'cheque_date' => '2026-11-05',
        'clear_date' => '2026-11-05',
        'voucher_no' => 'CPV-CHQ-104',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 4000,
        'net_amount' => 4000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_no' => 'CHQ-BBB',
        'cheque_status' => 'Clear',
    ]);

    // 5. Cheque PAYMENT (OUT) #2
    Payment::create([
        'date' => '2026-11-06',
        'cheque_date' => '2026-11-06',
        'clear_date' => null,
        'voucher_no' => 'CPV-CHQ-105',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 5000,
        'net_amount' => 5000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_no' => 'CHQ-CCC',
        'cheque_status' => 'Pending',
    ]);

    $builder = new ReportBuilder();

    // Online filter
    $online = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['bankFilter' => 'online']);
    expect(collect($online['data']->items())->pluck('voucher_no')->all())->toBe(['CRV-ONL-101', 'CPV-ONL-102']);

    // Cheque filter
    $cheque = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['bankFilter' => 'cheque']);
    expect(collect($cheque['data']->items())->pluck('voucher_no')->all())->toBe(['CRV-CHQ-103', 'CPV-CHQ-104', 'CPV-CHQ-105']);

    // Receipt (IN) filter
    $receipt = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['bankFilter' => 'receipt']);
    expect(collect($receipt['data']->items())->pluck('voucher_no')->all())->toBe(['CRV-ONL-101', 'CRV-CHQ-103']);
    expect(collect($receipt['data']->items())->every(fn ($r) => $r['deposit'] > 0 && $r['withdrawal'] == 0))->toBeTrue();

    // Payment (OUT) filter
    $payment = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['bankFilter' => 'payment']);
    expect(collect($payment['data']->items())->pluck('voucher_no')->all())->toBe(['CPV-ONL-102', 'CPV-CHQ-104', 'CPV-CHQ-105']);
    expect(collect($payment['data']->items())->every(fn ($r) => $r['withdrawal'] > 0 && $r['deposit'] == 0))->toBeTrue();

    // HTTP endpoint test: bankFilter=cheque + per_page=2 -> Page 1 has 2 cheques, Page 2 (last page) has 1 cheque
    $page1 = $this->getJson(route('reports.accounts.ledger', [
        'reportId' => 'bank_ledger',
        'account_id' => $this->bank->id,
        'from' => '2026-11-01',
        'to' => '2026-11-30',
        'bankFilter' => 'cheque',
        'per_page' => 2,
        'page' => 1,
    ]));
    $page1->assertOk();
    expect($page1->json('data.total'))->toBe(3);
    expect($page1->json('data.last_page'))->toBe(2);
    expect(collect($page1->json('data.data'))->pluck('voucher_no')->all())->toBe(['CRV-CHQ-103', 'CPV-CHQ-104']);

    $page2 = $this->getJson(route('reports.accounts.ledger', [
        'reportId' => 'bank_ledger',
        'account_id' => $this->bank->id,
        'from' => '2026-11-01',
        'to' => '2026-11-30',
        'bankFilter' => 'cheque',
        'per_page' => 2,
        'page' => 2,
    ]));
    $page2->assertOk();
    expect($page2->json('data.current_page'))->toBe(2);
    expect($page2->json('data.last_page'))->toBe(2);
    expect(collect($page2->json('data.data'))->pluck('voucher_no')->all())->toBe(['CPV-CHQ-105']);

    // HTTP endpoint test: bankFilter=payment + search=CHQ + per_page=1 -> Page 1 & Page 2 preserve both filter & search
    $searchP1 = $this->getJson(route('reports.accounts.ledger', [
        'reportId' => 'bank_ledger',
        'account_id' => $this->bank->id,
        'from' => '2026-11-01',
        'to' => '2026-11-30',
        'bankFilter' => 'payment',
        'search' => 'CHQ-',
        'per_page' => 1,
        'page' => 1,
    ]));
    $searchP1->assertOk();
    expect($searchP1->json('data.total'))->toBe(2);
    expect(collect($searchP1->json('data.data'))->pluck('voucher_no')->all())->toBe(['CPV-CHQ-104']);

    $searchP2 = $this->getJson(route('reports.accounts.ledger', [
        'reportId' => 'bank_ledger',
        'account_id' => $this->bank->id,
        'from' => '2026-11-01',
        'to' => '2026-11-30',
        'bankFilter' => 'payment',
        'search' => 'CHQ-',
        'per_page' => 1,
        'page' => 2,
    ]));
    $searchP2->assertOk();
    expect($searchP2->json('data.total'))->toBe(2);
    expect(collect($searchP2->json('data.data'))->pluck('voucher_no')->all())->toBe(['CPV-CHQ-105']);
});
