<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Account;
use App\Models\AccountType;
use App\Models\User;
use App\Http\Controllers\PaymentController;
use App\Services\PaymentAccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

echo "==========================================================" . PHP_EOL;
echo "  ERP PAYMENT MODULE — 5 CORE SCENARIOS AUDIT SUITE       " . PHP_EOL;
echo "==========================================================" . PHP_EOL . PHP_EOL;

$passCount = 0;
$failCount = 0;

function assertTest($condition, $testName, $details = "") {
    global $passCount, $failCount;
    if ($condition) {
        echo " [PASS] {$testName}" . PHP_EOL;
        if ($details) echo "        └─ {$details}" . PHP_EOL;
        $passCount++;
    } else {
        echo " [FAIL] {$testName}" . PHP_EOL;
        if ($details) echo "        └─ {$details}" . PHP_EOL;
        $failCount++;
    }
}

$adminUser = User::first();
if ($adminUser) {
    Auth::login($adminUser);
}

DB::beginTransaction();

try {
    $customerType = AccountType::where('name', 'Customers')->firstOrFail();
    $cashType = AccountType::where('name', 'Cash')->firstOrFail();
    $bankType = AccountType::where('name', 'Bank')->firstOrFail();

    $cashAccount = Account::where('type', $cashType->id)->first() ?? Account::create(['code' => 'CASH-' . rand(100,999), 'title' => 'Test Cash ' . rand(100,999), 'type' => $cashType->id, 'opening_balance' => 0, 'status' => 1]);
    $bankAccount = Account::where('type', $bankType->id)->first() ?? Account::create(['code' => 'BANK-' . rand(100,999), 'title' => 'Test Bank ' . rand(100,999), 'type' => $bankType->id, 'opening_balance' => 0, 'status' => 1]);
    $controller = new PaymentController();

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 1: Invoice 5373, Cash 5373, Discount 373
    // Expected: Settled 5373 (Rem 0), Rec Disc 0, Advance 0, Balance 0
    // ─────────────────────────────────────────────────────────────
    echo "--- Scenario 1: Invoice = 5,373 \| Cash = 5,373, Discount = 373 ---" . PHP_EOL;
    $c1 = Account::create(['code' => 'C1-' . time(), 'title' => 'Cust 1 ' . rand(100,999), 'type' => $customerType->id, 'opening_balance' => 0, 'status' => 1]);
    $s1 = Sales::create(['date' => now()->toDateString(), 'invoice' => 'SLS-S1-' . rand(100,999), 'customer_id' => $c1->id, 'no_of_items' => 1, 'gross_total' => 5373, 'discount_total' => 0, 'tax_total' => 0, 'courier_charges' => 0, 'extra_discount' => 0, 'net_total' => 5373, 'paid_amount' => 0, 'remaining_amount' => 5373, 'status' => 'Unpaid']);

    $req1 = new Request([
        'date' => now()->toDateString(),
        'account_id' => $c1->id,
        'payment_account_id' => $cashAccount->id,
        'amount' => 5373,
        'discount' => 373,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [['bill_id' => $s1->id, 'bill_type' => 'App\Models\Sales', 'amount' => 5373]]
    ]);
    $controller->store($req1);

    $s1->refresh();
    $c1->refresh();
    $p1 = Payment::where('account_id', $c1->id)->latest('id')->first();

    $recDisc1 = PaymentAccountingService::getRecognizedDiscount($p1);
    $adv1 = PaymentAccountingService::getAccountAdvanceBalance($c1);

    assertTest($s1->remaining_amount == 0 && $s1->status === 'Paid', "Invoice SLS-S1 (5,373) is Paid (remaining = 0)", "Actual remaining: {$s1->remaining_amount}");
    assertTest($recDisc1 == 0, "Recognized Discount is 0 (since Cash covered 100% of debt)", "Actual: {$recDisc1}");
    assertTest($adv1 == 0, "Advance Payment is 0 (No phantom advance created!)", "Actual: {$adv1}");
    assertTest($c1->current_balance == 0, "Customer Current Balance is 0", "Actual: {$c1->current_balance}");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 2: Invoice 6000, Cash 5500, Discount 500
    // Expected: Settled 6000 (Rem 0), Rec Disc 500, Advance 0, Balance 0
    // ─────────────────────────────────────────────────────────────
    echo PHP_EOL . "--- Scenario 2: Invoice = 6,000 \| Cash = 5,500, Discount = 500 ---" . PHP_EOL;
    $c2 = Account::create(['code' => 'C2-' . time(), 'title' => 'Cust 2 ' . rand(100,999), 'type' => $customerType->id, 'opening_balance' => 0, 'status' => 1]);
    $s2 = Sales::create(['date' => now()->toDateString(), 'invoice' => 'SLS-S2-' . rand(100,999), 'customer_id' => $c2->id, 'no_of_items' => 1, 'gross_total' => 6000, 'discount_total' => 0, 'tax_total' => 0, 'courier_charges' => 0, 'extra_discount' => 0, 'net_total' => 6000, 'paid_amount' => 0, 'remaining_amount' => 6000, 'status' => 'Unpaid']);

    $req2 = new Request([
        'date' => now()->toDateString(),
        'account_id' => $c2->id,
        'payment_account_id' => $cashAccount->id,
        'amount' => 5500,
        'discount' => 500,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [['bill_id' => $s2->id, 'bill_type' => 'App\Models\Sales', 'amount' => 6000]]
    ]);
    $controller->store($req2);

    $s2->refresh();
    $c2->refresh();
    $p2 = Payment::where('account_id', $c2->id)->latest('id')->first();

    $recDisc2 = PaymentAccountingService::getRecognizedDiscount($p2);
    $adv2 = PaymentAccountingService::getAccountAdvanceBalance($c2);

    assertTest($s2->remaining_amount == 0 && $s2->status === 'Paid', "Invoice SLS-S2 (6,000) is Paid (remaining = 0)", "Actual remaining: {$s2->remaining_amount}");
    assertTest($recDisc2 == 500, "Recognized Discount is 500", "Actual: {$recDisc2}");
    assertTest($adv2 == 0, "Advance Payment is 0", "Actual: {$adv2}");
    assertTest($c2->current_balance == 0, "Customer Current Balance is 0", "Actual: {$c2->current_balance}");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 3: Invoice 5000, Cash 6000, Discount 0
    // Expected: Settled 5000 (Rem 0), Rec Disc 0, Advance 1000, Balance -1000
    // ─────────────────────────────────────────────────────────────
    echo PHP_EOL . "--- Scenario 3: Invoice = 5,000 \| Cash = 6,000, Discount = 0 ---" . PHP_EOL;
    $c3 = Account::create(['code' => 'C3-' . time(), 'title' => 'Cust 3 ' . rand(100,999), 'type' => $customerType->id, 'opening_balance' => 0, 'status' => 1]);
    $s3 = Sales::create(['date' => now()->toDateString(), 'invoice' => 'SLS-S3-' . rand(100,999), 'customer_id' => $c3->id, 'no_of_items' => 1, 'gross_total' => 5000, 'discount_total' => 0, 'tax_total' => 0, 'courier_charges' => 0, 'extra_discount' => 0, 'net_total' => 5000, 'paid_amount' => 0, 'remaining_amount' => 5000, 'status' => 'Unpaid']);

    $req3 = new Request([
        'date' => now()->toDateString(),
        'account_id' => $c3->id,
        'payment_account_id' => $cashAccount->id,
        'amount' => 6000,
        'discount' => 0,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [['bill_id' => $s3->id, 'bill_type' => 'App\Models\Sales', 'amount' => 5000]]
    ]);
    $controller->store($req3);

    $s3->refresh();
    $c3->refresh();
    $p3 = Payment::where('account_id', $c3->id)->latest('id')->first();

    $recDisc3 = PaymentAccountingService::getRecognizedDiscount($p3);
    $adv3 = PaymentAccountingService::getAccountAdvanceBalance($c3);

    assertTest($s3->remaining_amount == 0 && $s3->status === 'Paid', "Invoice SLS-S3 (5,000) is Paid", "Actual remaining: {$s3->remaining_amount}");
    assertTest($recDisc3 == 0, "Recognized Discount is 0", "Actual: {$recDisc3}");
    assertTest($adv3 == 1000, "Advance Payment is 1,000 (Pure Cash Overpayment)", "Actual: {$adv3}");
    assertTest($c3->current_balance == -1000, "Customer Current Balance is -1,000 (Credit of 1,000)", "Actual: {$c3->current_balance}");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 4: Invoice 5000, Cash 6000, Discount 500
    // Expected: Settled 5000 (Rem 0), Rec Disc 0, Advance 1000, Balance -1000
    // ─────────────────────────────────────────────────────────────
    echo PHP_EOL . "--- Scenario 4: Invoice = 5,000 \| Cash = 6,000, Discount = 500 ---" . PHP_EOL;
    $c4 = Account::create(['code' => 'C4-' . time(), 'title' => 'Cust 4 ' . rand(100,999), 'type' => $customerType->id, 'opening_balance' => 0, 'status' => 1]);
    $s4 = Sales::create(['date' => now()->toDateString(), 'invoice' => 'SLS-S4-' . rand(100,999), 'customer_id' => $c4->id, 'no_of_items' => 1, 'gross_total' => 5000, 'discount_total' => 0, 'tax_total' => 0, 'courier_charges' => 0, 'extra_discount' => 0, 'net_total' => 5000, 'paid_amount' => 0, 'remaining_amount' => 5000, 'status' => 'Unpaid']);

    $req4 = new Request([
        'date' => now()->toDateString(),
        'account_id' => $c4->id,
        'payment_account_id' => $cashAccount->id,
        'amount' => 6000,
        'discount' => 500,
        'type' => 'RECEIPT',
        'payment_method' => 'Cash',
        'allocations' => [['bill_id' => $s4->id, 'bill_type' => 'App\Models\Sales', 'amount' => 5000]]
    ]);
    $controller->store($req4);

    $s4->refresh();
    $c4->refresh();
    $p4 = Payment::where('account_id', $c4->id)->latest('id')->first();

    $recDisc4 = PaymentAccountingService::getRecognizedDiscount($p4);
    $adv4 = PaymentAccountingService::getAccountAdvanceBalance($c4);

    assertTest($s4->remaining_amount == 0 && $s4->status === 'Paid', "Invoice SLS-S4 (5,000) is Paid", "Actual remaining: {$s4->remaining_amount}");
    assertTest($recDisc4 == 0, "Recognized Discount is 0 (Unused discount ignored)", "Actual: {$recDisc4}");
    assertTest($adv4 == 1000, "Advance Payment is 1,000 (NOT 1,500! Discount NEVER increases Advance)", "Actual: {$adv4}");
    assertTest($c4->current_balance == -1000, "Customer Current Balance is -1,000 (Credit of 1,000)", "Actual: {$c4->current_balance}");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO 5: Multi-Payment (Invoice 44,900, Online 30k + Cheque 14.9k + Disc 900)
    // Expected: Settled 44,900 (Rem 0), Rec Disc 0, Advance 0, Balance 0
    // ─────────────────────────────────────────────────────────────
    echo PHP_EOL . "--- Scenario 5: Multi-Payment Invoice = 44,900 \| Online 30k + Cheque 14.9k + Disc 900 ---" . PHP_EOL;
    $c5 = Account::create(['code' => 'C5-' . time(), 'title' => 'Cust 5 ' . rand(100,999), 'type' => $customerType->id, 'opening_balance' => 0, 'status' => 1]);
    $s5 = Sales::create(['date' => now()->toDateString(), 'invoice' => 'SLS-S5-' . rand(100,999), 'customer_id' => $c5->id, 'no_of_items' => 1, 'gross_total' => 44900, 'discount_total' => 0, 'tax_total' => 0, 'courier_charges' => 0, 'extra_discount' => 0, 'net_total' => 44900, 'paid_amount' => 0, 'remaining_amount' => 44900, 'status' => 'Unpaid']);

    $req5 = new Request([
        'is_multi' => true,
        'date' => now()->toDateString(),
        'account_id' => $c5->id,
        'type' => 'RECEIPT',
        'discount' => 900,
        'splits' => [
            ['payment_account_id' => $bankAccount->id, 'amount' => 30000, 'payment_method' => 'Online'],
            ['payment_account_id' => $bankAccount->id, 'amount' => 14900, 'payment_method' => 'Cheque', 'cheque_no' => 'CHQ-9900'],
        ],
        'allocations' => [['bill_id' => $s5->id, 'bill_type' => 'App\Models\Sales', 'amount' => 44900]]
    ]);
    $controller->store($req5);

    $s5->refresh();
    $c5->refresh();

    $adv5 = PaymentAccountingService::getAccountAdvanceBalance($c5);

    assertTest($s5->remaining_amount == 0 && $s5->status === 'Paid', "Invoice SLS-S5 (44,900) is Paid", "Actual remaining: {$s5->remaining_amount}");
    assertTest($adv5 == 0, "Multi-Payment Advance Payment is Rs 0 (NOT Rs 900!)", "Actual advance: {$adv5}");
    assertTest($c5->current_balance == 0, "Customer Current Balance is Rs 0", "Actual balance: {$c5->current_balance}");

    DB::rollBack();
    echo PHP_EOL . "Rollbacked test transaction cleanly." . PHP_EOL . PHP_EOL;

} catch (\Exception $e) {
    DB::rollBack();
    echo "ERROR in Test Suite: " . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
    exit(1);
}

echo "==========================================================" . PHP_EOL;
echo "  FINAL TEST RESULT: PASS = {$passCount} | FAIL = {$failCount} " . PHP_EOL;
echo "==========================================================" . PHP_EOL;
