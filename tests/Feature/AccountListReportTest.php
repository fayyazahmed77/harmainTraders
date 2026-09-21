<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Areas;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $role = Role::firstOrCreate(['name' => 'Admin']);
    Permission::firstOrCreate(['name' => 'view reports']);
    $role->givePermissionTo('view reports');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');
    $this->actingAs($this->admin);

    \App\Models\SiteSetting::firstOrCreate([], ['two_factor_enabled' => false]);

    // Setup types
    $this->companyType = AccountType::create(['name' => 'Company']);
    $this->customerType = AccountType::create(['name' => 'Customer']);

    // Setup areas
    $this->area = Areas::create(['name' => 'Gulshan e Maymar']);

    // Create accounts
    $this->account1 = Account::create([
        'code' => '0002',
        'title' => 'DALDA',
        'type' => $this->companyType->id,
        'area_id' => $this->area->id,
        'telephone1' => '03001234567',
        'opening_balance' => 0,
        'status' => true,
    ]);

    $this->account2 = Account::create([
        'code' => '0003',
        'title' => 'PEPSI',
        'type' => $this->companyType->id,
        'area_id' => $this->area->id,
        'opening_balance' => 0,
        'status' => true,
    ]);

    $this->account3 = Account::create([
        'code' => '0004',
        'title' => 'WALK-IN CUSTOMER',
        'type' => $this->customerType->id,
        'opening_balance' => 0,
        'status' => true,
    ]);
});

test('it returns accounts list json data with correct ordering', function () {
    $response = $this->getJson(route('reports.accounts.ledger', [
        'account_id' => 'ALL',
        'report_id' => 'account_list',
    ]));

    $response->assertOk();
    $data = $response->json('data');
    expect(count($data))->toBe(3);
    expect($data[0]['code'])->toBe('0002');
    expect($data[0]['title'])->toBe('DALDA');
});

test('it renders accounts list print view directly with account data', function () {
    $response = $this->get(route('reports.accounts.account_list.print', [
        'account_id' => 'ALL',
        'from' => '2026-08-21',
        'to' => '2026-09-21',
    ]));

    $response->assertOk();
    $response->assertViewIs('pdf.account-list');
    $response->assertSee('ACCOUNTS LIST');
    $response->assertSee('DALDA');
    $response->assertSee('PEPSI');
    $response->assertSee('WALK-IN CUSTOMER');
    $response->assertSee('0002');
    $response->assertSee('GULSHAN E MAYMAR');
    $response->assertSee('TOTAL ACCOUNTS LISTED: 3');
});

test('it delegates from ledger print route when report_id is account_list', function () {
    $response = $this->get(route('reports.accounts.ledger.print', [
        'account_id' => 'ALL',
        'report_id' => 'account_list',
        'from' => '2026-08-21',
        'to' => '2026-09-21',
    ]));

    $response->assertOk();
    $response->assertViewIs('pdf.account-list');
    $response->assertSee('ACCOUNTS LIST');
    $response->assertSee('DALDA');
    $response->assertSee('TOTAL ACCOUNTS LISTED: 3');
    // Ensure general ledger template is NOT rendered
    $response->assertDontSee('GENERAL LEDGER');
});

test('it filters accounts by type in print view', function () {
    $response = $this->get(route('reports.accounts.account_list.print', [
        'account_id' => 'ALL',
        'type' => $this->companyType->id,
        'from' => '2026-08-21',
        'to' => '2026-09-21',
    ]));

    $response->assertOk();
    $response->assertSee('DALDA');
    $response->assertSee('PEPSI');
    $response->assertDontSee('WALK-IN CUSTOMER');
    $response->assertSee('TOTAL ACCOUNTS LISTED: 2');
    $response->assertSee('TYPE: COMPANY');
});

test('it filters accounts by single account_id in print view', function () {
    $response = $this->get(route('reports.accounts.account_list.print', [
        'account_id' => $this->account1->id,
        'from' => '2026-08-21',
        'to' => '2026-09-21',
    ]));

    $response->assertOk();
    $response->assertSee('DALDA');
    $response->assertDontSee('PEPSI');
    $response->assertDontSee('WALK-IN CUSTOMER');
    $response->assertSee('TOTAL ACCOUNTS LISTED: 1');
    $response->assertSee('ACCOUNT: DALDA');
});
