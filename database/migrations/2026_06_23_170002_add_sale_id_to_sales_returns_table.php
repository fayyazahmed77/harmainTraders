<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add column and foreign key constraint
        Schema::table('sales_returns', function (Blueprint $table) {
            $table->unsignedBigInteger('sale_id')->nullable()->after('original_invoice');
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('set null');
        });

        // 2. Backfill existing returns with correct sale_id mapping
        $returns = DB::table('sales_returns')->get();
        foreach ($returns as $return) {
            // Find the most recent sale matching the invoice and customer_id
            $sale = DB::table('sales')
                ->where('invoice', $return->original_invoice)
                ->where('customer_id', $return->customer_id)
                ->orderBy('id', 'desc')
                ->first();

            if ($sale) {
                DB::table('sales_returns')
                    ->where('id', $return->id)
                    ->update(['sale_id' => $sale->id]);
            } else {
                // Fallback: match by invoice string alone if customer_id differs
                $saleFallback = DB::table('sales')
                    ->where('invoice', $return->original_invoice)
                    ->orderBy('id', 'desc')
                    ->first();
                if ($saleFallback) {
                    DB::table('sales_returns')
                        ->where('id', $return->id)
                        ->update(['sale_id' => $saleFallback->id]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('sales_returns', function (Blueprint $table) {
            $table->dropForeign(['sale_id']);
            $table->dropColumn('sale_id');
        });
    }
};
