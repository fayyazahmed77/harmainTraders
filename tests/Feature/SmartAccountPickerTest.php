<?php

use App\Http\Controllers\AccountController;
use App\Models\Account;
use App\Models\AccountCategory;
use App\Models\City;
use App\Models\Country;
use App\Models\Province;
use App\Models\Saleman;
use App\Models\Sales;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed canonical AccountType IDs matching production (1=Cash, 2=Bank, 3=Customers, 6=Supplier)
    DB::table('account_types')->insertOrIgnore([
        ['id' => 1, 'name' => 'Cash', 'created_at' => now(), 'updated_at' => now()],
        ['id' => 2, 'name' => 'Bank', 'created_at' => now(), 'updated_at' => now()],
        ['id' => 3, 'name' => 'Customers', 'created_at' => now(), 'updated_at' => now()],
        ['id' => 6, 'name' => 'Supplier', 'created_at' => now(), 'updated_at' => now()],
    ]);

    foreach ([
        'view accounts',
        'create sales',
        'edit sales',
        'create purchase',
        'edit purchase',
        'create returns',
        'edit returns',
        'create purchase returns',
        'edit purchase returns',
    ] as $perm) {
        Permission::findOrCreate($perm, 'web');
    }
});

test('account picker declares module permission middleware, blocks guests, and allows sales operators', function () {
    // Unauthenticated requests are blocked
    $this->getJson('/account/picker?context=sale')->assertUnauthorized();

    // Verify AccountController registers Spatie permission middleware covering all target modules on picker
    $pickerMiddlewares = collect(AccountController::middleware())
        ->filter(fn ($m) => in_array('picker', $m->only ?? [], true))
        ->pluck('middleware')
        ->all();

    expect($pickerMiddlewares)->not->toBeEmpty();
    expect($pickerMiddlewares[0])
        ->toContain('view accounts')
        ->toContain('create sales')
        ->toContain('edit sales')
        ->toContain('create purchase')
        ->toContain('edit purchase')
        ->toContain('create returns')
        ->toContain('create purchase returns');

    $salesOperator = User::factory()->create();
    $salesOperator->givePermissionTo('create sales');
    $this->actingAs($salesOperator)
        ->getJson('/account/picker?context=sale')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'per_page', 'total']]);
});

test('account picker filters by context, search (name/code/phone), city, area, salesman, tp, and paginates with balances', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('view accounts');

    $country = Country::create(['name' => 'Pakistan', 'code' => 'PK', 'is_active' => true]);
    $province = Province::create(['name' => 'Sindh', 'code' => 'SD', 'country_id' => $country->id, 'is_active' => true]);
    $cityA = City::create(['name' => 'Karachi', 'code' => 'KHI', 'country_id' => $country->id, 'is_active' => true]);
    $cityB = City::create(['name' => 'Lahore', 'code' => 'LHE', 'country_id' => $country->id, 'is_active' => true]);
    $areaAId = DB::table('areas')->insertGetId([
        'name' => 'Saddar',
        'country_id' => $country->id,
        'provience_id' => $province->id,
        'city_id' => $cityA->id,
        'status' => 'active',
        'created_by' => $user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $salemanA = Saleman::create(['name' => 'Ali', 'shortname' => 'ALI', 'code' => 'S01']);
    $suppCat = AccountCategory::create(['name' => 'Wholesale 8%', 'percentage' => 8]);

    $cust1 = Account::create([
        'code' => 'C-1001',
        'title' => 'Alpha Mart',
        'type' => 3,
        'sale' => true,
        'purchase' => false,
        'status' => true,
        'mobile' => '0300 1234567',
        'city_id' => $cityA->id,
        'area_id' => $areaAId,
        'saleman_id' => $salemanA->id,
        'item_category' => '2',
        'opening_balance' => 15000,
        'opening_balance_type' => 'DR',
        'aging_days' => 15,
        'credit_limit' => 50000,
    ]);

    $cust2 = Account::create([
        'code' => 'C-1002',
        'title' => 'Beta Store',
        'type' => 3,
        'sale' => true,
        'purchase' => false,
        'status' => true,
        'mobile' => '0321-9876543',
        'city_id' => $cityB->id,
        'item_category' => null,
        'opening_balance' => 3000,
        'opening_balance_type' => 'CR',
    ]);

    $inactiveCust = Account::create([
        'code' => 'C-9999',
        'title' => 'Inactive Shop',
        'type' => 3,
        'sale' => true,
        'purchase' => false,
        'status' => false,
    ]);

    $supplier = Account::create([
        'code' => 'S-2001',
        'title' => 'Mega Distributors',
        'type' => 6,
        'sale' => false,
        'purchase' => true,
        'status' => true,
        'mobile' => '03335556667',
        'category' => (string) $suppCat->id,
        'opening_balance' => 25000,
        'opening_balance_type' => 'CR',
    ]);

    // Give cust1 a sale so sales_return context includes only cust1
    Sales::create([
        'date' => now()->toDateString(),
        'invoice' => 'SLS-000001',
        'customer_id' => $cust1->id,
        'salesman_id' => $salemanA->id,
        'no_of_items' => 1,
        'gross_total' => 5000,
        'discount_total' => 0,
        'extra_discount' => 0,
        'courier_charges' => 0,
        'tax_total' => 0,
        'net_total' => 5000,
        'paid_amount' => 0,
        'remaining_amount' => 5000,
        'status' => 'Unpaid',
    ]);

    // 1. Sale context with filter_options
    $saleRes = $this->actingAs($user)
        ->getJson('/account/picker?context=sale&include_filters=1')
        ->assertOk();

    $saleIds = collect($saleRes->json('data'))->pluck('id')->all();
    expect($saleIds)->toContain($cust1->id, $cust2->id)
        ->not->toContain($inactiveCust->id)
        ->not->toContain($supplier->id);

    $alphaRow = collect($saleRes->json('data'))->firstWhere('id', $cust1->id);
    expect($alphaRow['phone'])->toBe('0300 1234567')
        ->and($alphaRow['tp_label'])->toBe('TP 2')
        ->and((float) $alphaRow['current_balance'])->toBe(20000.0) // 15,000 OB + 5,000 Sale
        ->and($alphaRow['balance_side'])->toBe('DR')
        ->and($alphaRow['city_name'])->toBe('Karachi')
        ->and($alphaRow['area_name'])->toBe('Saddar')
        ->and($alphaRow['saleman_name'])->toBe('Ali');

    $betaRow = collect($saleRes->json('data'))->firstWhere('id', $cust2->id);
    expect($betaRow['tp_label'])->toBe('Retail')
        ->and((float) $betaRow['current_balance'])->toBe(-3000.0)
        ->and($betaRow['balance_side'])->toBe('CR');

    expect($saleRes->json('filter_options.cities'))->toHaveCount(2);

    // 2. Search by phone ignoring spaces
    $this->actingAs($user)
        ->getJson('/account/picker?context=sale&search=03001234567')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $cust1->id);

    // 3. Filter by city + area + salesman + TP tier
    $this->actingAs($user)
        ->getJson("/account/picker?context=sale&city_id={$cityA->id}&area_id={$areaAId}&saleman_id={$salemanA->id}&tp=2")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $cust1->id);

    // 4. Purchase context includes supplier category percentage + CR balance
    $purRes = $this->actingAs($user)
        ->getJson('/account/picker?context=purchase&include_filters=1')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $supplier->id)
        ->assertJsonPath('data.0.account_category.percentage', 8)
        ->assertJsonPath('data.0.balance_side', 'CR');
    expect((float) $purRes->json('data.0.current_balance'))->toBe(25000.0);

    // 5. Sales return context returns only customers with sales
    $this->actingAs($user)
        ->getJson('/account/picker?context=sales_return')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $cust1->id);

    // 6. Purchase return context returns supplier
    $this->actingAs($user)
        ->getJson('/account/picker?context=purchase_return')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $supplier->id);

    // 7. Create/Edit helper never loads full table (returns single formatted account for Edit)
    $singleEdit = AccountController::loadSingleForPicker($cust1->id, 'sale');
    expect($singleEdit)->toHaveCount(1)
        ->and($singleEdit[0]['id'])->toBe($cust1->id)
        ->and($singleEdit[0]['item_category'])->toBe('2')
        ->and($singleEdit[0]['aging_days'])->toBe(15);
});
