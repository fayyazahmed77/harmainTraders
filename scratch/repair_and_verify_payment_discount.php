<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Account;
use App\Models\SalesReturn;
use App\Models\PurchaseReturn;
use Illuminate\Support\Facades\DB;

echo "==========================================================" . PHP_EOL;
echo "  ERP PAYMENT MODULE — DATA REPAIR & AUDIT SCRIPT         " . PHP_EOL;
echo "==========================================================" . PHP_EOL . PHP_EOL;

DB::beginTransaction();
try {
    // Step 1: Repair Payment net_amount fields
    $payments = Payment::where('discount', '>', 0)->get();
    echo "Found " . $payments->count() . " payments with discount." . PHP_EOL;

    $repairedCount = 0;
    foreach ($payments as $p) {
        $expectedNet = (float)$p->amount + (float)$p->discount;
        if (abs((float)$p->net_amount - $expectedNet) > 0.001) {
            echo "  Payment #{$p->id} (Voucher: {$p->voucher_no}): amount={$p->amount}, discount={$p->discount} | net_amount {$p->net_amount} -> {$expectedNet}" . PHP_EOL;
            $p->net_amount = $expectedNet;
            $p->save();
            $repairedCount++;
        }
    }
    echo "Repaired {$repairedCount} Payment records." . PHP_EOL . PHP_EOL;

    // Step 2: Re-synchronize Sales Invoices (paid_amount, remaining_amount, status)
    $sales = Sales::all();
    echo "Auditing " . $sales->count() . " Sales Invoices..." . PHP_EOL;
    $updatedSales = 0;
    foreach ($sales as $s) {
        $totalAllocated = PaymentAllocation::where('bill_id', $s->id)
            ->where('bill_type', 'App\Models\Sales')
            ->sum('amount');
        
        $totalReturns = SalesReturn::where(function($q) use ($s) {
            $q->where('sale_id', $s->id)
              ->orWhere(function($sub) use ($s) {
                  $sub->whereNull('sale_id')
                      ->where('original_invoice', $s->invoice)
                      ->where('customer_id', $s->customer_id);
              });
        })->sum(DB::raw('net_total - extra_discount'));

        $netPayable = max(0, (float)$s->net_total - (float)($s->extra_discount ?? 0));
        $expectedPaid = (float)$totalAllocated;
        $expectedRem = max(0, $netPayable - $expectedPaid - (float)$totalReturns);

        if ($expectedRem <= 0.001) {
            $expectedRem = 0;
            $expectedStatus = ($totalReturns >= $netPayable) ? 'Returned' : 'Paid';
        } elseif ($expectedPaid > 0) {
            $expectedStatus = 'Partial';
        } else {
            $expectedStatus = 'Unpaid';
        }

        if (abs((float)$s->paid_amount - $expectedPaid) > 0.001 ||
            abs((float)$s->remaining_amount - $expectedRem) > 0.001 ||
            $s->status !== $expectedStatus) {
            echo "  Sales Invoice #{$s->id} ({$s->invoice}):" . PHP_EOL;
            echo "    paid_amount: {$s->paid_amount} -> {$expectedPaid}" . PHP_EOL;
            echo "    remaining_amount: {$s->remaining_amount} -> {$expectedRem}" . PHP_EOL;
            echo "    status: {$s->status} -> {$expectedStatus}" . PHP_EOL;

            $s->paid_amount = $expectedPaid;
            $s->remaining_amount = $expectedRem;
            $s->status = $expectedStatus;
            $s->save();
            $updatedSales++;
        }
    }
    echo "Updated {$updatedSales} Sales Invoices." . PHP_EOL . PHP_EOL;

    // Step 3: Re-synchronize Purchase Bills
    $purchases = Purchase::all();
    echo "Auditing " . $purchases->count() . " Purchase Bills..." . PHP_EOL;
    $updatedPurchases = 0;
    foreach ($purchases as $p) {
        $totalAllocated = PaymentAllocation::where('bill_id', $p->id)
            ->where('bill_type', 'App\Models\Purchase')
            ->sum('amount');

        $totalReturns = PurchaseReturn::where('original_invoice', $p->invoice)
            ->where('supplier_id', $p->supplier_id)
            ->sum(DB::raw('net_total - extra_discount'));

        $netPayable = max(0, (float)$p->net_total - (float)($p->extra_discount ?? 0));
        $expectedPaid = (float)$totalAllocated;
        $expectedRem = max(0, $netPayable - $expectedPaid - (float)$totalReturns);

        if ($expectedRem <= 0.001) {
            $expectedRem = 0;
            $expectedStatus = 'Completed';
        } elseif ($expectedPaid > 0) {
            $expectedStatus = 'Completed';
        } else {
            $expectedStatus = 'Completed';
        }

        if (abs((float)$p->paid_amount - $expectedPaid) > 0.001 ||
            abs((float)$p->remaining_amount - $expectedRem) > 0.001) {
            echo "  Purchase Bill #{$p->id} ({$p->invoice}):" . PHP_EOL;
            echo "    paid_amount: {$p->paid_amount} -> {$expectedPaid}" . PHP_EOL;
            echo "    remaining_amount: {$p->remaining_amount} -> {$expectedRem}" . PHP_EOL;

            $p->paid_amount = $expectedPaid;
            $p->remaining_amount = $expectedRem;
            $p->save();
            $updatedPurchases++;
        }
    }
    echo "Updated {$updatedPurchases} Purchase Bills." . PHP_EOL . PHP_EOL;

    DB::commit();
    echo "DB Repair Transaction Committed Successfully!" . PHP_EOL;
} catch (\Exception $e) {
    DB::rollBack();
    echo "ERROR during Repair: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
