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

it('shows only cleared bank transactions ordered by bank clearing date using real bank statement Debit/Credit columns', function () {
    // 1. Cheque issued in Oct (2026-10-10), CLEARED in Nov (2026-11-05) -> Withdrawal / Bank DEBIT 15,000
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

    // 2. Cheque issued in Nov (2026-11-02), still PENDING -> MUST BE EXCLUDED
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

    // 3. Cheque issued in Oct (2026-10-15), RETURNED / CANCELED in Nov (2026-11-08) -> MUST BE EXCLUDED
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

    // 4. Online cleared deposit in Nov (2026-11-06) -> Deposit / Bank CREDIT 5,000
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

    // Nov 1 - Nov 30:
    // Opening before Nov 1 = OB 100,000 (CPV-CLEAR-01 cleared on Nov 5, NOT in Oct)
    // Row 1: CPV-CLEAR-01 (date=2026-11-05 clear_date, Debit=15,000, Credit=0, Balance=85,000)
    // Row 2: CRV-ONL-01   (date=2026-11-06 voucher date, Debit=0, Credit=5,000, Balance=90,000)
    // Pending (CPV-PEND-01) and Returned (CPV-RET-01) MUST NOT APPEAR!
    $res = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50);
    expect((float) $res['opening_balance'])->toBe(100000.0);
    expect((float) $res['total_debit'])->toBe(15000.0);
    expect((float) $res['total_cleared_withdrawals'])->toBe(15000.0);
    expect((float) $res['total_credit'])->toBe(5000.0);
    expect((float) $res['total_cleared_deposits'])->toBe(5000.0);
    expect((float) $res['total_uncleared_float'])->toBe(0.0);
    expect((float) $res['closing_bank_balance'])->toBe(90000.0);
    expect($res['cleared_count'])->toBe(2);
    expect($res['pending_count'])->toBe(0);
    expect($res['returned_count'])->toBe(0);

    $items = $res['data']->items();
    expect(collect($items)->pluck('voucher_no')->all())->toBe(['CPV-CLEAR-01', 'CRV-ONL-01']);
    expect($items[0]['date'])->toBe('2026-11-05');
    expect((float) $items[0]['debit'])->toBe(15000.0);
    expect((float) $items[0]['credit'])->toBe(0.0);
    expect((float) $items[0]['running_balance'])->toBe(85000.0);
    expect($items[1]['date'])->toBe('2026-11-06');
    expect((float) $items[1]['debit'])->toBe(0.0);
    expect((float) $items[1]['credit'])->toBe(5000.0);
    expect((float) $items[1]['running_balance'])->toBe(90000.0);

    // Oct 1 - Oct 31: CPV-CLEAR-01 was issued Oct 10 but cleared Nov 5 -> MUST NOT appear in Oct!
    $octRes = $builder->bankLedger($this->bank->id, '2026-10-01', '2026-10-31', 50);
    expect($octRes['data']->items())->toHaveCount(0);
    expect((float) $octRes['closing_bank_balance'])->toBe(100000.0);

    // Real bank account current_balance invariant matches!
    expect((float) $this->bank->fresh()->current_balance)->toBe(90000.0);

    // Print view renders Real Bank Statement columns (Debit, Credit) without Chq Date / Clear Date / Status / Pending Float
    $printRes = $this->get(route('reports.accounts.ledger.print', [
        'report_id' => 'bank_ledger',
        'account_id' => $this->bank->id,
        'from' => '2026-11-01',
        'to' => '2026-11-30',
    ]));
    $printRes->assertOk();
    $printRes->assertSee('Debit');
    $printRes->assertSee('Credit');
    $printRes->assertDontSee('Chq Date');
    $printRes->assertDontSee('Clear Date');
    $printRes->assertDontSee('Pending Cheques Float');
    $printRes->assertDontSee('CPV-PEND-01');
    $printRes->assertDontSee('CPV-RET-01');
});

it('filters Bank Ledger by Online, Cheque, Receipt (IN), Payment (OUT) on cleared entries only and preserves filters + search across pagination', function () {
    // 1. Online RECEIPT (IN / Credit)
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

    // 2. Online PAYMENT (OUT / Debit)
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

    // 3. Cleared Cheque RECEIPT (IN / Credit)
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

    // 4. Cleared Cheque PAYMENT (OUT / Debit) #1
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

    // 5. Cleared Cheque PAYMENT (OUT / Debit) #2
    Payment::create([
        'date' => '2026-11-06',
        'cheque_date' => '2026-11-06',
        'clear_date' => '2026-11-06',
        'voucher_no' => 'CPV-CHQ-105',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 5000,
        'net_amount' => 5000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_no' => 'CHQ-CCC',
        'cheque_status' => 'Clear',
    ]);

    // 6. Pending Cheque PAYMENT (OUT) -> MUST NEVER APPEAR
    Payment::create([
        'date' => '2026-11-07',
        'cheque_date' => '2026-11-07',
        'clear_date' => null,
        'voucher_no' => 'CPV-CHQ-PEND-106',
        'account_id' => $this->party->id,
        'payment_account_id' => $this->bank->id,
        'amount' => 9000,
        'net_amount' => 9000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_no' => 'CHQ-PEND',
        'cheque_status' => 'Pending',
    ]);

    $builder = new ReportBuilder();

    // Online filter
    $online = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['bankFilter' => 'online']);
    expect(collect($online['data']->items())->pluck('voucher_no')->all())->toBe(['CRV-ONL-101', 'CPV-ONL-102']);

    // Cheque filter (cleared cheques only — pending excluded!)
    $cheque = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['bankFilter' => 'cheque']);
    expect(collect($cheque['data']->items())->pluck('voucher_no')->all())->toBe(['CRV-CHQ-103', 'CPV-CHQ-104', 'CPV-CHQ-105']);

    // Receipt / Credit (IN) filter
    $receipt = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['bankFilter' => 'receipt']);
    expect(collect($receipt['data']->items())->pluck('voucher_no')->all())->toBe(['CRV-ONL-101', 'CRV-CHQ-103']);
    expect(collect($receipt['data']->items())->every(fn ($r) => $r['credit'] > 0 && $r['debit'] == 0))->toBeTrue();

    // Payment / Debit (OUT) filter (pending excluded!)
    $payment = $builder->bankLedger($this->bank->id, '2026-11-01', '2026-11-30', 50, ['bankFilter' => 'payment']);
    expect(collect($payment['data']->items())->pluck('voucher_no')->all())->toBe(['CPV-ONL-102', 'CPV-CHQ-104', 'CPV-CHQ-105']);
    expect(collect($payment['data']->items())->every(fn ($r) => $r['debit'] > 0 && $r['credit'] == 0))->toBeTrue();

    // HTTP endpoint test: bankFilter=cheque + per_page=2 -> Page 1 has 2 cheques, Page 2 has 1 cheque
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

    // HTTP endpoint test: bankFilter=payment + search=CHQ + per_page=1 -> preserves filter & search across pages
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
