<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SalesReturn;
use Illuminate\Support\Facades\DB;

echo "=== Recalculating Sale Balances & Statuses ===" . PHP_EOL;

// Loop through all sales returns
$returns = SalesReturn::all();
echo "Found " . $returns->count() . " sales returns." . PHP_EOL;

// Use reflection or make a public method wrapper or call the controller method.
// Wait! Instead of instantiating the controller, we can write a simple helper function
// inside this script that mimics the logic of `updateSaleStatusAndBalance` exactly!
// That is much cleaner and doesn't require instantiating a controller with middleware/requests.

function updateSale($invoiceNo, $saleId) {
    if (!$invoiceNo && !$saleId) return;

    $sale = $saleId ? \App\Models\Sales::find($saleId) : \App\Models\Sales::where('invoice', $invoiceNo)->first();
    if ($sale) {
        // Calculate Total Returns for this invoice
        $totalReturns = SalesReturn::where(function($q) use ($sale) {
            $q->where('sale_id', $sale->id)
              ->orWhere(function($sub) use ($sale) {
                  $sub->whereNull('sale_id')
                      ->where('original_invoice', $sale->invoice)
                      ->where('customer_id', $sale->customer_id);
              });
        })->sum('net_total');

        // Calculate Total Payments for this invoice
        $totalPayments = \App\Models\PaymentAllocation::where('bill_id', $sale->id)
            ->where('bill_type', 'App\Models\Sales')
            ->sum('amount');

        // Recalculate remaining balance
        $oldRem = $sale->remaining_amount;
        $sale->remaining_amount = max(0, $sale->net_total - ($totalPayments + $totalReturns));

        // Determine status based on returned quantity vs sold quantity
        $totalSoldQty = \App\Models\SalesItem::where('sale_id', $sale->id)->sum('total_pcs');
        $allReturnIds = SalesReturn::where(function($q) use ($sale) {
            $q->where('sale_id', $sale->id)
              ->orWhere(function($sub) use ($sale) {
                  $sub->whereNull('sale_id')
                      ->where('original_invoice', $sale->invoice)
                      ->where('customer_id', $sale->customer_id);
              });
        })->pluck('id');
        $totalReturnedQty = \App\Models\SalesReturnItem::whereIn('sales_return_id', $allReturnIds)->sum('total_pcs');

        $oldStatus = $sale->status;
        if ($totalReturnedQty >= $totalSoldQty && $totalSoldQty > 0) {
            $sale->status = 'Returned';
        } elseif ($totalReturnedQty > 0) {
            if ($sale->remaining_amount <= 0) {
                $sale->status = ($totalReturns >= $sale->net_total) ? 'Returned' : 'Paid';
            } else {
                $sale->status = 'Partial Return';
            }
        } elseif ($sale->remaining_amount <= 0) {
            $sale->status = 'Paid';
        } elseif ($totalPayments > 0) {
            $sale->status = 'Partial';
        } else {
            $sale->status = 'Completed';
        }

        if ($oldRem != $sale->remaining_amount || $oldStatus != $sale->status) {
            echo "  Sale ID {$sale->id} ({$sale->invoice}): remaining {$oldRem} -> {$sale->remaining_amount} | status {$oldStatus} -> {$sale->status}" . PHP_EOL;
            $sale->save();
        }
    }
}

DB::transaction(function() use ($returns) {
    foreach ($returns as $r) {
        updateSale($r->original_invoice, $r->sale_id);
    }
});

echo "Re-calculation complete!" . PHP_EOL;
