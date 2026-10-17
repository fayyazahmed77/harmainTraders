<?php

use App\Models\Account;
use App\Models\AccountType;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Sales;
use App\Models\Purchase;
use App\Services\PaymentAllocationEngine;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->engine = new PaymentAllocationEngine();

    $this->custType = AccountType::firstOrCreate(['name' => 'Customers']);
    $this->suppType = AccountType::firstOrCreate(['name' => 'Supplier']);
    $this->cashType = AccountType::firstOrCreate(['name' => 'Cash']);

    $this->cash = Account::create([
        'code' => 'TEST-CSH-' . uniqid(),
        'title' => 'Test Cash Box',
        'type' => $this->cashType->id,
        'opening_balance' => 0,
        'opening_balance_type' => 'DR',
    ]);
});

it('settles opening balance before sales invoices in automatic FIFO mode', function () {
    $customer = Account::create([
        'code' => 'TEST-CST-1-' . uniqid(),
        'title' => 'Test Customer 1',
        'type' => $this->custType->id,
        'opening_balance' => 10000,
        'opening_balance_type' => 'DR',
        'sale' => 1,
    ]);

    $sale101 = Sales::create([
        'customer_id' => $customer->id,
        'invoice' => 'SLS-T101-' . uniqid(),
        'date' => '2026-10-10',
        'net_total' => 5000,
        'paid_amount' => 0,
        'remaining_amount' => 5000,
        'status' => 'Unpaid',
        'courier_charges' => 0,
    ]);

    $sale102 = Sales::create([
        'customer_id' => $customer->id,
        'invoice' => 'SLS-T102-' . uniqid(),
        'date' => '2026-10-12',
        'net_total' => 3000,
        'paid_amount' => 0,
        'remaining_amount' => 3000,
        'status' => 'Unpaid',
        'courier_charges' => 0,
    ]);

    $payment = Payment::create([
        'date' => '2026-10-17',
        'voucher_no' => 'CRV-TEST-1-' . uniqid(),
        'account_id' => $customer->id,
        'payment_account_id' => $this->cash->id,
        'amount' => 12000,
        'discount' => 0,
        'net_amount' => 12000,
        'type' => 'RECEIPT',
    ]);

    $result = $this->engine->allocateCustomerReceipt($payment, 12000, []);

    expect($result['opening_balance_allocated'])->toBe(10000.0)
        ->and($result['invoices_allocated'])->toHaveCount(1)
        ->and($result['invoices_allocated'][0]['bill_id'])->toBe($sale101->id)
        ->and($result['invoices_allocated'][0]['amount'])->toBe(2000.0)
        ->and($result['unallocated_advance'])->toBe(0.0);

    $sale101->refresh();
    $sale102->refresh();
    expect((float)$sale101->remaining_amount)->toBe(3000.0)
        ->and($sale101->status)->toBe('Partial')
        ->and((float)$sale102->remaining_amount)->toBe(3000.0)
        ->and($sale102->status)->toBe('Unpaid');

    expect($this->engine->getRemainingOpeningBalance($customer))->toBe(0.0);
});

it('enforces opening balance first in Mode B when funds exceed opening balance', function () {
    $customer = Account::create([
        'code' => 'TEST-CST-2-' . uniqid(),
        'title' => 'Test Customer 2',
        'type' => $this->custType->id,
        'opening_balance' => 10000,
        'opening_balance_type' => 'DR',
        'sale' => 1,
    ]);

    $sale201 = Sales::create([
        'customer_id' => $customer->id,
        'invoice' => 'SLS-T201-' . uniqid(),
        'date' => '2026-10-10',
        'net_total' => 5000,
        'paid_amount' => 0,
        'remaining_amount' => 5000,
        'status' => 'Unpaid',
        'courier_charges' => 0,
    ]);

    $sale202 = Sales::create([
        'customer_id' => $customer->id,
        'invoice' => 'SLS-T202-' . uniqid(),
        'date' => '2026-10-12',
        'net_total' => 3000,
        'paid_amount' => 0,
        'remaining_amount' => 3000,
        'status' => 'Unpaid',
        'courier_charges' => 0,
    ]);

    $payment = Payment::create([
        'date' => '2026-10-17',
        'voucher_no' => 'CRV-TEST-2-' . uniqid(),
        'account_id' => $customer->id,
        'payment_account_id' => $this->cash->id,
        'amount' => 12000,
        'discount' => 0,
        'net_amount' => 12000,
        'type' => 'RECEIPT',
    ]);

    $result = $this->engine->allocateCustomerReceipt($payment, 12000, [
        ['bill_id' => $sale202->id, 'amount' => 3000]
    ]);

    expect($result['opening_balance_allocated'])->toBe(10000.0)
        ->and($result['invoices_allocated'])->toHaveCount(1)
        ->and($result['invoices_allocated'][0]['bill_id'])->toBe($sale202->id)
        ->and($result['invoices_allocated'][0]['amount'])->toBe(2000.0);

    $sale201->refresh();
    $sale202->refresh();
    expect((float)$sale201->remaining_amount)->toBe(5000.0)
        ->and($sale201->status)->toBe('Unpaid')
        ->and((float)$sale202->remaining_amount)->toBe(1000.0)
        ->and($sale202->status)->toBe('Partial');
});

it('allocates zero to invoices in Mode B when payment funds do not fully settle opening balance', function () {
    $customer = Account::create([
        'code' => 'TEST-CST-3-' . uniqid(),
        'title' => 'Test Customer 3',
        'type' => $this->custType->id,
        'opening_balance' => 10000,
        'opening_balance_type' => 'DR',
        'sale' => 1,
    ]);

    $sale301 = Sales::create([
        'customer_id' => $customer->id,
        'invoice' => 'SLS-T301-' . uniqid(),
        'date' => '2026-10-10',
        'net_total' => 5000,
        'paid_amount' => 0,
        'remaining_amount' => 5000,
        'status' => 'Unpaid',
        'courier_charges' => 0,
    ]);

    $payment = Payment::create([
        'date' => '2026-10-17',
        'voucher_no' => 'CRV-TEST-3-' . uniqid(),
        'account_id' => $customer->id,
        'payment_account_id' => $this->cash->id,
        'amount' => 6000,
        'discount' => 0,
        'net_amount' => 6000,
        'type' => 'RECEIPT',
    ]);

    $result = $this->engine->allocateCustomerReceipt($payment, 6000, [
        ['bill_id' => $sale301->id, 'amount' => 5000]
    ]);

    expect($result['opening_balance_allocated'])->toBe(6000.0)
        ->and($result['invoices_allocated'])->toBeEmpty();

    $sale301->refresh();
    expect((float)$sale301->paid_amount)->toBe(0.0)
        ->and((float)$sale301->remaining_amount)->toBe(5000.0);

    expect($this->engine->getRemainingOpeningBalance($customer))->toBe(4000.0);
});

it('recognizes genuine advance only after clearing opening balance and bills', function () {
    $customer = Account::create([
        'code' => 'TEST-CST-4-' . uniqid(),
        'title' => 'Test Customer 4',
        'type' => $this->custType->id,
        'opening_balance' => 5000,
        'opening_balance_type' => 'DR',
        'sale' => 1,
    ]);

    $sale401 = Sales::create([
        'customer_id' => $customer->id,
        'invoice' => 'SLS-T401-' . uniqid(),
        'date' => '2026-10-10',
        'net_total' => 3000,
        'paid_amount' => 0,
        'remaining_amount' => 3000,
        'status' => 'Unpaid',
        'courier_charges' => 0,
    ]);

    $payment = Payment::create([
        'date' => '2026-10-17',
        'voucher_no' => 'CRV-TEST-4-' . uniqid(),
        'account_id' => $customer->id,
        'payment_account_id' => $this->cash->id,
        'amount' => 10000,
        'discount' => 0,
        'net_amount' => 10000,
        'type' => 'RECEIPT',
    ]);

    $result = $this->engine->allocateCustomerReceipt($payment, 10000, []);

    expect($result['opening_balance_allocated'])->toBe(5000.0)
        ->and($result['invoices_allocated'][0]['amount'])->toBe(3000.0)
        ->and($result['unallocated_advance'])->toBe(2000.0);
});

it('reverses allocations safely restoring opening balance and invoice balances', function () {
    $supplier = Account::create([
        'code' => 'TEST-SUP-1-' . uniqid(),
        'title' => 'Test Supplier 1',
        'type' => $this->suppType->id,
        'opening_balance' => 10000,
        'opening_balance_type' => 'CR',
        'purchase' => 1,
    ]);

    $purchase = Purchase::create([
        'supplier_id' => $supplier->id,
        'invoice' => 'PUR-T501-' . uniqid(),
        'date' => '2026-10-10',
        'gross_total' => 5000,
        'discount_total' => 0,
        'net_total' => 5000,
        'paid_amount' => 0,
        'remaining_amount' => 5000,
        'courier_charges' => 0,
        'status' => 'Completed',
    ]);

    $payment = Payment::create([
        'date' => '2026-10-17',
        'voucher_no' => 'CPV-TEST-5-' . uniqid(),
        'account_id' => $supplier->id,
        'payment_account_id' => $this->cash->id,
        'amount' => 12000,
        'discount' => 0,
        'net_amount' => 12000,
        'type' => 'PAYMENT',
    ]);

    $this->engine->allocateSupplierPayment($payment, 12000, []);

    expect($this->engine->getRemainingOpeningBalance($supplier))->toBe(0.0);

    // Reverse
    $this->engine->reverseAllocations($payment);

    $purchase->refresh();
    expect((float)$purchase->paid_amount)->toBe(0.0)
        ->and((float)$purchase->remaining_amount)->toBe(5000.0)
        ->and($this->engine->getRemainingOpeningBalance($supplier))->toBe(10000.0);
});

it('handles multi-payment split vouchers allocating cash first across payments then discount', function () {
    $customer = Account::create([
        'code' => 'TEST-CST-7-' . uniqid(),
        'title' => 'Test Customer 7 (Splits)',
        'type' => $this->custType->id,
        'opening_balance' => 6000,
        'opening_balance_type' => 'DR',
        'sale' => 1,
    ]);

    $sale = Sales::create([
        'customer_id' => $customer->id,
        'invoice' => 'SLS-T701-' . uniqid(),
        'date' => '2026-10-10',
        'net_total' => 4000,
        'paid_amount' => 0,
        'remaining_amount' => 4000,
        'status' => 'Unpaid',
        'courier_charges' => 0,
    ]);

    $split1 = Payment::create([
        'date' => '2026-10-17',
        'voucher_no' => 'CRV-SPLIT-1-' . uniqid(),
        'account_id' => $customer->id,
        'payment_account_id' => $this->cash->id,
        'amount' => 5000,
        'discount' => 0,
        'net_amount' => 5000,
        'type' => 'RECEIPT',
    ]);
    $split1->update(['group_id' => $split1->id]);

    $split2 = Payment::create([
        'date' => '2026-10-17',
        'voucher_no' => 'CRV-SPLIT-2-' . uniqid(),
        'account_id' => $customer->id,
        'payment_account_id' => $this->cash->id,
        'amount' => 6000,
        'discount' => 500,
        'net_amount' => 6500,
        'type' => 'RECEIPT',
        'group_id' => $split1->id,
    ]);

    $result = $this->engine->allocateCustomerReceipt([$split1, $split2], null, []);

    expect($result['opening_balance_allocated'])->toBe(6000.0)
        ->and($result['invoices_allocated'][0]['amount'])->toBe(4000.0)
        ->and($result['unallocated_advance'])->toBe(1500.0);

    $split1Allocations = PaymentAllocation::where('payment_id', $split1->id)->get();
    $split2Allocations = PaymentAllocation::where('payment_id', $split2->id)->get();

    expect($split1Allocations)->toHaveCount(1)
        ->and((float)$split1Allocations[0]->amount)->toBe(5000.0)
        ->and($split2Allocations)->toHaveCount(2);

    $this->engine->reverseAllocations([$split1, $split2]);
    $sale->refresh();
    expect((float)$sale->remaining_amount)->toBe(4000.0)
        ->and((float)$sale->paid_amount)->toBe(0.0)
        ->and($this->engine->getRemainingOpeningBalance($customer))->toBe(6000.0);
});

