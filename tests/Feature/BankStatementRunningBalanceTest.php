<?php

use App\Models\Account;
use App\Models\Payment;
use App\Models\AccountType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = App\Models\User::factory()->create();
    $this->actingAs($this->user);
    
    $this->bankType = AccountType::create(['name' => 'Bank']);
    $this->customerType = AccountType::create(['name' => 'Customers']);
    
    $this->account = Account::create([
        'code' => 'B001',
        'title' => 'Test Bank Account',
        'type' => $this->bankType->id,
        'opening_balance' => 0,
    ]);
    
    $this->dummyCustomer = Account::create([
        'code' => 'C001',
        'title' => 'Dummy Customer',
        'type' => $this->customerType->id,
        'opening_balance' => 0,
    ]);
});

it('calculates the running balance correctly with mixed statuses, pagination, and self-transfer', function () {
    $account = $this->account;
    $dummy = $this->dummyCustomer;
    
    // 1. Active financial receipt (Index 1)
    Payment::create([
        'date' => '2026-07-01',
        'voucher_no' => 'FT-001',
        'payment_account_id' => $account->id,
        'account_id' => $dummy->id,
        'amount' => 1000,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
    ]);
    
    // 2. Inactive financial receipt - pending cheque (Index 2)
    Payment::create([
        'date' => '2026-07-02',
        'voucher_no' => 'FT-002',
        'payment_account_id' => $account->id,
        'account_id' => $dummy->id,
        'amount' => 2000,
        'type' => 'RECEIPT',
        'payment_method' => 'Cheque',
        'cheque_status' => 'Pending',
    ]);
    
    // 3. Active party receipt - pending cheque in hand (Index 3)
    Payment::create([
        'date' => '2026-07-03',
        'voucher_no' => 'FT-003',
        'account_id' => $account->id,
        'payment_account_id' => $dummy->id,
        'amount' => 3000,
        'type' => 'RECEIPT',
        'payment_method' => 'Cheque',
        'cheque_status' => 'Pending',
    ]);
    
    // 4. Inactive financial payment - canceled (Index 4)
    Payment::create([
        'date' => '2026-07-04',
        'voucher_no' => 'FT-004',
        'payment_account_id' => $account->id,
        'account_id' => $dummy->id,
        'amount' => 500,
        'type' => 'PAYMENT',
        'payment_method' => 'Cash',
        'cheque_status' => 'Canceled',
    ]);
    
    // 5. Inactive party receipt - canceled (Index 5)
    Payment::create([
        'date' => '2026-07-05',
        'voucher_no' => 'FT-005',
        'account_id' => $account->id,
        'payment_account_id' => $dummy->id,
        'amount' => 600,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'cheque_status' => 'Canceled',
    ]);

    // 6. Self-transfer transaction - should have net flow of 0 (Index 6)
    Payment::create([
        'date' => '2026-07-06',
        'voucher_no' => 'FT-SELF',
        'payment_account_id' => $account->id,
        'account_id' => $account->id,
        'amount' => 5000,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
    ]);
    
    // 7. Insert 16 simple active transactions (Index 7 to 22)
    for ($i = 7; $i <= 22; $i++) {
        Payment::create([
            'date' => '2026-07-07',
            'voucher_no' => "FT-" . str_pad($i, 3, '0', STR_PAD_LEFT),
            'payment_account_id' => $account->id,
            'account_id' => $dummy->id,
            'amount' => 100,
            'type' => 'RECEIPT',
            'payment_method' => 'Cash',
        ]);
    }
    
    // 8. Same-date mixed status party payments (Index 23, 24, 25)
    // Index 23 (CPV-0026: pending party payment, credit = 10000)
    Payment::create([
        'date' => '2026-07-15',
        'voucher_no' => 'CPV-0026',
        'account_id' => $account->id,
        'payment_account_id' => $dummy->id,
        'amount' => 10000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_status' => 'Pending',
    ]);
    
    // Index 24 (CPV-0027: clear party payment, credit = 0)
    Payment::create([
        'date' => '2026-07-15',
        'voucher_no' => 'CPV-0027',
        'account_id' => $account->id,
        'payment_account_id' => $dummy->id,
        'amount' => 0,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_status' => 'Clear',
    ]);
    
    // Index 25 (CPV-0028: clear party payment, credit = 2000)
    Payment::create([
        'date' => '2026-07-15',
        'voucher_no' => 'CPV-0028',
        'account_id' => $account->id,
        'payment_account_id' => $dummy->id,
        'amount' => 2000,
        'type' => 'PAYMENT',
        'payment_method' => 'Cheque',
        'cheque_status' => 'Clear',
    ]);
    
    // Verify current_balance matches expectation
    $account->refresh();
    // 0 + 1000 (Index 1) + 0 (Index 2) - 3000 (Index 3) + 0 (Index 4) + 0 (Index 5) + 0 (Index 6) + 1600 (Index 7-22) + 10000 (Index 23) + 0 (Index 24) + 2000 (Index 25) = 11600.0
    expect((float)$account->current_balance)->toEqual(11600.0);
    
    // Request Page 1
    $response1 = $this->getJson(route('account.history.bank-statement', ['account' => $account->id, 'page' => 1]));
    $response1->assertStatus(200);
    $data1 = $response1->json('data');
    
    // Page 1 has 20 items (Index 25 down to Index 6)
    expect(count($data1))->toEqual(20);
    
    // Assert ending balance for CPV-0028, CPV-0027, CPV-0026 individually (Index 25, 24, 23)
    expect($data1[0]['voucher_no'])->toEqual('CPV-0028');
    expect($data1[0]['running_balance'])->toEqual(11600.0);
    
    expect($data1[1]['voucher_no'])->toEqual('CPV-0027');
    expect($data1[1]['running_balance'])->toEqual(9600.0);
    
    expect($data1[2]['voucher_no'])->toEqual('CPV-0026');
    expect($data1[2]['running_balance'])->toEqual(9600.0);
    
    // Check oldest on page 1 (which is Index 6 - self-transfer)
    expect($data1[19]['voucher_no'])->toEqual('FT-SELF');
    expect($data1[19]['running_balance'])->toEqual(-2000.0); // Since self-transfer net flow is 0, it should equal balance before it.
    
    // Request Page 2
    $response2 = $this->getJson(route('account.history.bank-statement', ['account' => $account->id, 'page' => 2]));
    $response2->assertStatus(200);
    $data2 = $response2->json('data');
    
    // Page 2 has 5 items (Index 5 down to Index 1)
    expect(count($data2))->toEqual(5);
    
    // Index 5 (Canceled)
    expect($data2[0]['voucher_no'])->toEqual('FT-005');
    expect($data2[0]['running_balance'])->toEqual(-2000.0);
    
    // Index 4 (Canceled)
    expect($data2[1]['voucher_no'])->toEqual('FT-004');
    expect($data2[1]['running_balance'])->toEqual(-2000.0);
    
    // Index 3 (Active party pending cheque, value is -3000)
    expect($data2[2]['voucher_no'])->toEqual('FT-003');
    expect($data2[2]['running_balance'])->toEqual(-2000.0);
    
    // Index 2 (Inactive financial pending cheque, value is 0)
    expect($data2[3]['voucher_no'])->toEqual('FT-002');
    expect($data2[3]['running_balance'])->toEqual(1000.0);
    
    // Index 1 (Active financial receipt, value is +1000)
    expect($data2[4]['voucher_no'])->toEqual('FT-001');
    expect($data2[4]['running_balance'])->toEqual(1000.0);
    
    // Verify the newest row's running_balance on Page 1 equals $account->current_balance
    expect($data1[0]['running_balance'])->toEqual((float)$account->current_balance);
});
