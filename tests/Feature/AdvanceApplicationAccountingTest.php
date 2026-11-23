<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\CustomerCredit;
use App\Models\Items;
use App\Models\OpeningBalanceAllocation;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\Saleman;
use App\Models\Sales;
use App\Models\SalesReturn;
use App\Models\SupplierCredit;
use App\Models\User;
use App\Services\AdvanceAllocationService;
use App\Services\PaymentAccountingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    foreach ([
        'view sales', 'create sales', 'edit sales', 'delete sales',
        'view purchases', 'create purchases', 'edit purchases', 'delete purchases',
        'view accounts',
    ] as $perm) {
        Permission::firstOrCreate(['name' => $perm]);
    }
    $this->user->givePermissionTo(Permission::all());
    $this->actingAs($this->user);

    // Match production AccountType IDs (1=Cash, 3=Customers, 6=Supplier)
    \Illuminate\Support\Facades\DB::table('account_types')->insertOrIgnore([
        ['id' => 1, 'name' => 'Cash', 'created_at' => now(), 'updated_at' => now()],
        ['id' => 3, 'name' => 'Customers', 'created_at' => now(), 'updated_at' => now()],
        ['id' => 6, 'name' => 'Supplier', 'created_at' => now(), 'updated_at' => now()],
    ]);
    $this->cashType = AccountType::find(1);
    $this->customerType = AccountType::find(3);
    $this->supplierType = AccountType::find(6);

    $this->cashAccount = Account::create([
        'code'            => 'CSH-001',
        'title'           => 'Cash In Hand',
        'type'            => $this->cashType->id,
        'cashbank'        => true,
        'opening_balance' => 100000,
        'opening_balance_type' => 'DR',
        'status'          => true,
    ]);

    $this->salesman = Saleman::create(['name' => 'Ali', 'code' => 'SM-01']);

    $this->item = Items::create([
        'code'        => 'ITM-001',
        'title'       => 'Motor Oil',
        'stock_1'     => 500,
        'trade_price' => 1000,
        'retail'      => 1200,
        'packing_qty' => 1,
        'is_active'   => 1,
    ]);
});

function makeSalePayload(Account $customer, Saleman $salesman, Items $item, float $qtyPcs, float $rate, array $overrides = []): array
{
    $subtotal = $qtyPcs * $rate;
    return array_merge([
        'date'             => now()->format('Y-m-d'),
        'customer_id'      => $customer->id,
        'salesman_id'      => $salesman->id,
        'no_of_items'      => 1,
        'gross_total'      => $subtotal,
        'discount_total'   => 0,
        'extra_discount'   => 0,
        'tax_total'        => 0,
        'courier_charges'  => 0,
        'net_total'        => $subtotal,
        'paid_amount'      => 0,
        'remaining_amount' => $subtotal,
        'is_pay_now'       => false,
        'is_multi'         => true,
        'splits'           => [],
        'use_advance'      => false,
        'items'            => [
            [
                'item_id'      => $item->id,
                'qty_carton'   => 0,
                'qty_pcs'      => $qtyPcs,
                'total_pcs'    => $qtyPcs,
                'trade_price'  => $rate,
                'retail_price' => $rate,
                'discount'     => 0,
                'gst_amount'   => 0,
                'subtotal'     => $subtotal,
            ],
        ],
    ], $overrides);
}

function makePurchasePayload(Account $supplier, Saleman $salesman, Items $item, float $qtyPcs, float $rate, array $overrides = []): array
{
    $subtotal = $qtyPcs * $rate;
    return array_merge([
        'date'             => now()->format('Y-m-d'),
        'supplier_id'      => $supplier->id,
        'salesman_id'      => $salesman->id,
        'no_of_items'      => 1,
        'gross_total'      => $subtotal,
        'discount_total'   => 0,
        'extra_discount'   => 0,
        'tax_total'        => 0,
        'courier_charges'  => 0,
        'net_total'        => $subtotal,
        'paid_amount'      => 0,
        'remaining_amount' => $subtotal,
        'is_pay_now'       => false,
        'is_multi'         => true,
        'splits'           => [],
        'use_advance'      => false,
        'items'            => [
            [
                'item_id'     => $item->id,
                'qty_carton'  => 0,
                'qty_pcs'     => $qtyPcs,
                'total_pcs'   => $qtyPcs,
                'trade_price' => $rate,
                'discount'    => 0,
                'gst_amount'  => 0,
                'subtotal'    => $subtotal,
            ],
        ],
    ], $overrides);
}

it('applies unallocated cash advance to sale without touching cash counter-account and respects unchecked toggle', function () {
    $customer = Account::create([
        'code' => 'C-ADV-1', 'title' => 'Advance Customer', 'type' => $this->customerType->id,
        'sale' => true, 'opening_balance' => 0, 'opening_balance_type' => 'DR', 'status' => true,
    ]);

    // Pre-existing advance receipt of Rs 6,575
    $advanceReceipt = Payment::create([
        'date' => now()->subDay()->format('Y-m-d'), 'voucher_no' => 'CRV-ADV-001',
        'account_id' => $customer->id, 'payment_account_id' => $this->cashAccount->id,
        'amount' => 6575, 'discount' => 0, 'net_amount' => 6575,
        'type' => 'RECEIPT', 'payment_method' => 'Cash', 'cheque_status' => 'Clear',
        'remarks' => 'Cash Advance from Customer',
    ]);

    $cashBefore = (float) $this->cashAccount->fresh()->current_balance;
    expect($cashBefore)->toBe(106575.0);
    expect((float) $customer->fresh()->current_balance)->toBe(-6575.0);

    // 1. Sale with use_advance = FALSE -> advance NOT applied
    $this->post(route('sale.store'), makeSalePayload($customer, $this->salesman, $this->item, 10, 1000, [
        'use_advance' => false,
    ]))->assertRedirect();

    $sale1 = Sales::latest('id')->first();
    expect((float) $sale1->paid_amount)->toBe(0.0);
    expect((float) $sale1->remaining_amount)->toBe(10000.0);
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(106575.0);
    expect((float) $customer->fresh()->current_balance)->toBe(3425.0); // -6575 + 10000
    expect(PaymentAccountingService::getUnallocatedCash($advanceReceipt->fresh()))->toBe(6575.0);

    // Delete sale1 to reset cleanly, then create with use_advance = TRUE
    $this->delete(route('sale.destroy', $sale1->id))->assertRedirect();
    expect((float) $customer->fresh()->current_balance)->toBe(-6575.0);

    // 2. Sale with use_advance = TRUE -> Rs 6,575 applied cleanly
    $this->post(route('sale.store'), makeSalePayload($customer, $this->salesman, $this->item, 10, 1000, [
        'use_advance' => true,
    ]))->assertRedirect();

    $sale2 = Sales::latest('id')->first();
    expect((float) $sale2->paid_amount)->toBe(6575.0);
    expect((float) $sale2->remaining_amount)->toBe(3425.0);
    // Cash counter-account MUST NOT CHANGE!
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(106575.0);
    // Customer ledger MUST equal -6575 + 10000 = +3425 (no double deduction!)
    expect((float) $customer->fresh()->current_balance)->toBe(3425.0);
    // Master advance receipt untouched
    expect((float) $advanceReceipt->fresh()->amount)->toBe(6575.0);
    expect(PaymentAccountingService::getUnallocatedCash($advanceReceipt->fresh()))->toBe(0.0);
});

it('applies Opening Balance CR advance via CRV-OB voucher with zero cash impact and zero double-deduction', function () {
    $customer = Account::create([
        'code' => 'C-OB-1', 'title' => 'Opening CR Customer', 'type' => $this->customerType->id,
        'sale' => true, 'opening_balance' => 6575, 'opening_balance_type' => 'CR', 'status' => true,
    ]);

    expect((float) $customer->fresh()->current_balance)->toBe(-6575.0);

    // Sale #1 of Rs 10,000 with use_advance = true
    $this->post(route('sale.store'), makeSalePayload($customer, $this->salesman, $this->item, 10, 1000, [
        'use_advance' => true,
    ]))->assertRedirect();

    $sale1 = Sales::latest('id')->first();
    expect((float) $sale1->paid_amount)->toBe(6575.0);
    expect((float) $sale1->remaining_amount)->toBe(3425.0);

    // Formal CRV-OB voucher created in opening_balance_allocations, ZERO rows in payments table!
    $obAlloc = OpeningBalanceAllocation::where('bill_id', $sale1->id)->where('bill_type', Sales::class)->first();
    expect($obAlloc)->not->toBeNull();
    expect($obAlloc->voucher_no)->toStartWith('CRV-OB-');
    expect((float) $obAlloc->amount)->toBe(6575.0);
    expect(Payment::count())->toBe(0);

    // Cash in Hand untouched, Customer ledger = -6575 + 10000 = +3425 (NO double-deduction!)
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(100000.0);
    expect((float) $customer->fresh()->current_balance)->toBe(3425.0);

    // Sale #2 of Rs 5,000 with use_advance = true -> Opening Balance advance is exhausted -> 0 applied!
    $this->post(route('sale.store'), makeSalePayload($customer, $this->salesman, $this->item, 5, 1000, [
        'use_advance' => true,
    ]))->assertRedirect();

    $sale2 = Sales::latest('id')->first();
    expect((float) $sale2->paid_amount)->toBe(0.0);
    expect((float) $sale2->remaining_amount)->toBe(5000.0);
    expect((float) $customer->fresh()->current_balance)->toBe(8425.0); // 3425 + 5000
});

it('never truncates or destroys independent Rs 50,000 advance voucher when editing or shrinking a sale', function () {
    $customer = Account::create([
        'code' => 'C-EDIT-1', 'title' => 'Big Advance Customer', 'type' => $this->customerType->id,
        'sale' => true, 'opening_balance' => 0, 'opening_balance_type' => 'DR', 'status' => true,
    ]);

    // Independent advance receipt of Rs 50,000 (remarks intentionally mention "Sale" to test old bug!)
    $bigAdvance = Payment::create([
        'date' => now()->subDay()->format('Y-m-d'), 'voucher_no' => 'CRV-0042',
        'account_id' => $customer->id, 'payment_account_id' => $this->cashAccount->id,
        'amount' => 50000, 'discount' => 0, 'net_amount' => 50000,
        'type' => 'RECEIPT', 'payment_method' => 'Cash', 'cheque_status' => 'Clear',
        'remarks' => 'Advance for upcoming Sale',
    ]);

    // Create Sale #1 of Rs 10,000 using advance
    $this->post(route('sale.store'), makeSalePayload($customer, $this->salesman, $this->item, 10, 1000, [
        'use_advance' => true,
    ]))->assertRedirect();

    $sale = Sales::latest('id')->first();
    expect((float) $sale->paid_amount)->toBe(10000.0);
    expect((float) $sale->remaining_amount)->toBe(0.0);
    expect(PaymentAccountingService::getUnallocatedCash($bigAdvance->fresh()))->toBe(40000.0);

    // Verify Edit Balance API returns exact pre-bill balance (-50,000) and NOT hidden balance!
    $balRes = $this->getJson("/account/{$customer->id}/balance?role=sale&exclude_bill_id={$sale->id}")
        ->assertOk()
        ->json();
    expect((float) $balRes['effective_previous_balance'])->toBe(-50000.0);
    expect((float) $balRes['advance_breakdown']['applicable_advance'])->toBe(50000.0);

    // Edit #1: Shrink Sale #1 from Rs 10,000 down to Rs 6,000 (with use_advance = true)
    $this->put(route('sale.update', $sale->id), makeSalePayload($customer, $this->salesman, $this->item, 6, 1000, [
        'invoice'     => $sale->invoice,
        'use_advance' => true,
        'is_pay_now'  => false,
    ]))->assertRedirect();

    $sale->refresh();
    $bigAdvance->refresh();
    expect((float) $sale->paid_amount)->toBe(6000.0);
    expect((float) $sale->remaining_amount)->toBe(0.0);
    // CRITICAL INVARIANT: Master voucher amount & Cash in Hand MUST STAY Rs 50,000 / 150,000!
    expect((float) $bigAdvance->amount)->toBe(50000.0);
    expect((float) $bigAdvance->net_amount)->toBe(50000.0);
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(150000.0);
    // Excess Rs 4,000 returned cleanly -> unallocated cash = Rs 44,000 (ZERO trapped advance!)
    expect(PaymentAccountingService::getUnallocatedCash($bigAdvance))->toBe(44000.0);

    // Edit #2: Uncheck use_advance = false -> releases full Rs 6,000 back to unallocated advance!
    $this->put(route('sale.update', $sale->id), makeSalePayload($customer, $this->salesman, $this->item, 6, 1000, [
        'invoice'     => $sale->invoice,
        'use_advance' => false,
        'is_pay_now'  => false,
    ]))->assertRedirect();

    $sale->refresh();
    $bigAdvance->refresh();
    expect((float) $sale->paid_amount)->toBe(0.0);
    expect((float) $sale->remaining_amount)->toBe(6000.0);
    expect((float) $bigAdvance->amount)->toBe(50000.0);
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(150000.0);
    expect(PaymentAccountingService::getUnallocatedCash($bigAdvance))->toBe(50000.0);
});

it('never creates phantom advance from payment discounts', function () {
    $customer = Account::create([
        'code' => 'C-DISC-1', 'title' => 'Discount Customer', 'type' => $this->customerType->id,
        'sale' => true, 'opening_balance' => 0, 'opening_balance_type' => 'DR', 'status' => true,
    ]);

    // Old sale of Rs 10,000 settled with Rs 9,000 cash + Rs 1,000 discount
    $oldSale = Sales::create([
        'date' => now()->subDays(5)->format('Y-m-d'), 'invoice' => 'SLS-OLD-01',
        'customer_id' => $customer->id, 'salesman_id' => $this->salesman->id,
        'no_of_items' => 1, 'gross_total' => 10000, 'discount_total' => 0,
        'tax_total' => 0, 'courier_charges' => 0, 'net_total' => 10000,
        'extra_discount' => 0, 'paid_amount' => 9000, 'remaining_amount' => 1000,
    ]);

    $receiptWithDisc = Payment::create([
        'date' => now()->subDays(2)->format('Y-m-d'), 'voucher_no' => 'CRV-DISC-01',
        'account_id' => $customer->id, 'payment_account_id' => $this->cashAccount->id,
        'amount' => 9000, 'discount' => 1000, 'net_amount' => 10000,
        'type' => 'RECEIPT', 'payment_method' => 'Cash', 'cheque_status' => 'Clear',
    ]);

    PaymentAllocation::create([
        'payment_id' => $receiptWithDisc->id, 'bill_id' => $oldSale->id,
        'bill_type' => Sales::class, 'amount' => 9000, 'is_advance' => false,
    ]);

    // Attempt new Sale of Rs 5,000 with use_advance = true -> MUST NOT allocate Rs 1,000 discount as advance!
    $this->post(route('sale.store'), makeSalePayload($customer, $this->salesman, $this->item, 5, 1000, [
        'use_advance' => true,
    ]))->assertRedirect();

    $newSale = Sales::latest('id')->first();
    expect((float) $newSale->paid_amount)->toBe(0.0);
    expect((float) $newSale->remaining_amount)->toBe(5000.0);
});

it('handles purchase advance checkbox, SupplierCredit, and Opening Balance DR (CPV-OB) accurately', function () {
    $supplier = Account::create([
        'code' => 'S-OB-1', 'title' => 'Opening DR Supplier', 'type' => $this->supplierType->id,
        'purchase' => true, 'opening_balance' => 6575, 'opening_balance_type' => 'DR', 'status' => true,
    ]);

    expect((float) $supplier->fresh()->current_balance)->toBe(-6575.0);

    // 1. Purchase Create with use_advance = FALSE -> checkbox MUST be respected (0 advance applied!)
    $this->post(route('purchase.store'), makePurchasePayload($supplier, $this->salesman, $this->item, 10, 1000, [
        'use_advance' => false,
    ]))->assertRedirect();

    $purchase = Purchase::latest('id')->first();
    expect((float) $purchase->paid_amount)->toBe(0.0);
    expect((float) $purchase->remaining_amount)->toBe(10000.0);
    expect(OpeningBalanceAllocation::count())->toBe(0);
    expect((float) $supplier->fresh()->current_balance)->toBe(3425.0); // -6575 + 10000

    // 2. Purchase Edit with use_advance = TRUE -> creates CPV-OB-0001 for 6,575
    $this->put(route('purchase.update', $purchase->id), makePurchasePayload($supplier, $this->salesman, $this->item, 10, 1000, [
        'invoice'     => $purchase->invoice,
        'use_advance' => true,
    ]))->assertRedirect();

    $purchase->refresh();
    expect((float) $purchase->paid_amount)->toBe(6575.0);
    expect((float) $purchase->remaining_amount)->toBe(3425.0);

    $obAlloc = OpeningBalanceAllocation::where('bill_id', $purchase->id)->where('bill_type', Purchase::class)->first();
    expect($obAlloc)->not->toBeNull();
    expect($obAlloc->voucher_no)->toStartWith('CPV-OB-');
    expect((float) $obAlloc->amount)->toBe(6575.0);
    expect(Payment::count())->toBe(0);

    // Cash untouched, Supplier balance = +3,425 (ZERO double-deduction!)
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(100000.0);
    expect((float) $supplier->fresh()->current_balance)->toBe(3425.0);

    // 3. Purchase Edit with use_advance = FALSE -> cleanly releases CPV-OB allocation
    $this->put(route('purchase.update', $purchase->id), makePurchasePayload($supplier, $this->salesman, $this->item, 10, 1000, [
        'invoice'     => $purchase->invoice,
        'use_advance' => false,
    ]))->assertRedirect();

    $purchase->refresh();
    expect((float) $purchase->paid_amount)->toBe(0.0);
    expect((float) $purchase->remaining_amount)->toBe(10000.0);
    expect(OpeningBalanceAllocation::where('bill_id', $purchase->id)->count())->toBe(0);
});

it('does not delete Sale 1 checkout payment when deleting Sale 2 that used Sale 1 surplus advance', function () {
    $customer = Account::create([
        'code' => 'C-DEL-1', 'title' => 'Surplus Customer', 'type' => $this->customerType->id,
        'sale' => true, 'opening_balance' => 0, 'opening_balance_type' => 'DR', 'status' => true,
    ]);

    // Sale #1 for Rs 10,000, paid Rs 15,000 cash at instant checkout -> Rs 5,000 surplus advance
    $this->post(route('sale.store'), makeSalePayload($customer, $this->salesman, $this->item, 10, 1000, [
        'is_pay_now' => true,
        'is_multi'   => true,
        'paid_amount' => 15000,
        'splits'     => [
            [
                'payment_account_id' => $this->cashAccount->id,
                'amount'             => 15000,
                'payment_method'     => 'Cash',
            ],
        ],
    ]))->assertRedirect();

    $sale1 = Sales::latest('id')->first();
    $checkoutPayment1 = Payment::latest('id')->first();
    expect((float) $sale1->paid_amount)->toBe(10000.0);
    expect((float) $sale1->remaining_amount)->toBe(0.0);
    expect((float) $customer->fresh()->current_balance)->toBe(-5000.0);
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(115000.0);

    // Sale #2 for Rs 8,000 using Rs 5,000 surplus advance from Sale #1
    $this->post(route('sale.store'), makeSalePayload($customer, $this->salesman, $this->item, 8, 1000, [
        'use_advance' => true,
    ]))->assertRedirect();

    $sale2 = Sales::latest('id')->first();
    expect((float) $sale2->paid_amount)->toBe(5000.0);
    expect((float) $sale2->remaining_amount)->toBe(3000.0);

    // Delete Sale #2 -> Sale #1's Rs 15,000 checkout payment MUST survive 100% intact!
    $this->delete(route('sale.destroy', $sale2->id))->assertRedirect();

    expect(Payment::find($checkoutPayment1->id))->not->toBeNull();
    expect((float) $checkoutPayment1->fresh()->amount)->toBe(15000.0);
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(115000.0);
    expect((float) $customer->fresh()->current_balance)->toBe(-5000.0);
    expect(PaymentAccountingService::getUnallocatedCash($checkoutPayment1->fresh()))->toBe(5000.0);
});

it('applies and rolls back SupplierCredit advance on Purchase create, edit, and delete', function () {
    $supplier = Account::create([
        'code' => 'S-CRED-1', 'title' => 'Credit Note Supplier', 'type' => $this->supplierType->id,
        'purchase' => true, 'opening_balance' => 0, 'opening_balance_type' => 'CR', 'status' => true,
    ]);

    $purchaseReturn = PurchaseReturn::create([
        'date'             => now()->subDays(2)->format('Y-m-d'),
        'invoice'          => 'PRET-0001',
        'supplier_id'      => $supplier->id,
        'salesman_id'      => $this->salesman->id,
        'no_of_items'      => 1,
        'gross_total'      => 4000,
        'discount_total'   => 0,
        'extra_discount'   => 0,
        'tax_total'        => 0,
        'net_total'        => 4000,
        'paid_amount'      => 0,
        'remaining_amount' => 0,
    ]);

    $credit = SupplierCredit::create([
        'supplier_id'        => $supplier->id,
        'purchase_return_id' => $purchaseReturn->id,
        'amount'             => 4000,
        'available_balance'  => 4000,
        'status'             => 'Available',
    ]);

    expect((float) $supplier->fresh()->current_balance)->toBe(-4000.0);

    // 1. Purchase Create with use_advance = true -> consumes Rs 4,000 SupplierCredit
    $this->post(route('purchase.store'), makePurchasePayload($supplier, $this->salesman, $this->item, 10, 1000, [
        'use_advance' => true,
    ]))->assertRedirect();

    $purchase = Purchase::latest('id')->first();
    expect((float) $purchase->paid_amount)->toBe(4000.0);
    expect((float) $purchase->remaining_amount)->toBe(6000.0);
    expect((float) $credit->fresh()->available_balance)->toBe(0.0);
    expect($credit->fresh()->status)->toBe('Used');
    expect((float) $this->cashAccount->fresh()->current_balance)->toBe(100000.0);

    // 2. Delete Purchase -> SupplierCredit restored to Rs 4,000 Available!
    $this->delete(route('purchase.destroy', $purchase->id))->assertRedirect();
    expect((float) $credit->fresh()->available_balance)->toBe(4000.0);
    expect($credit->fresh()->status)->toBe('Available');
    expect((float) $supplier->fresh()->current_balance)->toBe(-4000.0);
});
