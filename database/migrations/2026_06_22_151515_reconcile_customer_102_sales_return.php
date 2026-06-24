<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Sales;
use App\Models\SalesReturn;
use App\Models\PaymentAllocation;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function () {
            // 1. Link Sales Return RET-000017 to Sales Invoice SLS-000001
            $return = SalesReturn::where('invoice', 'RET-000017')
                ->where('customer_id', 102)
                ->first();

            $sale = Sales::where('invoice', 'SLS-000001')
                ->where('customer_id', 102)
                ->first();

            if ($return && $sale) {
                // Link return
                $return->original_invoice = 'SLS-000001';
                $return->remaining_amount = 0.00;
                $return->save();

                // Recalculate Sale Remaining Amount
                $totalPayments = PaymentAllocation::where('bill_id', $sale->id)
                    ->where('bill_type', 'App\Models\Sales')
                    ->sum('amount');

                $sale->remaining_amount = max(0, $sale->net_total - ($totalPayments + $return->net_total));
                $sale->status = $sale->remaining_amount <= 0 ? 'Returned' : 'Partial Return';
                $sale->save();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::transaction(function () {
            // Rollback link
            $return = SalesReturn::where('invoice', 'RET-000017')
                ->where('customer_id', 102)
                ->first();

            $sale = Sales::where('invoice', 'SLS-000001')
                ->where('customer_id', 102)
                ->first();

            if ($return && $sale) {
                $return->original_invoice = '';
                $return->remaining_amount = $return->net_total;
                $return->save();

                $sale->remaining_amount = $sale->net_total;
                $sale->status = 'Completed';
                $sale->save();
            }
        });
    }
};
