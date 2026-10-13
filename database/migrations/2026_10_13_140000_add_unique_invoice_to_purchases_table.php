<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Clean up any existing duplicate purchase invoices before creating unique constraint.
        // Suffix any duplicates with _dup<id> to preserve historical records while guaranteeing uniqueness.
        $duplicates = DB::table('purchases')
            ->select('invoice', DB::raw('COUNT(*) as cnt'))
            ->groupBy('invoice')
            ->having('cnt', '>', 1)
            ->get();

        foreach ($duplicates as $dup) {
            $rows = DB::table('purchases')
                ->where('invoice', $dup->invoice)
                ->orderBy('id')
                ->get();

            // Keep the first record as original, suffix subsequent duplicates
            foreach ($rows->skip(1) as $row) {
                DB::table('purchases')
                    ->where('id', $row->id)
                    ->update(['invoice' => $row->invoice . '_dup' . $row->id]);
            }
        }

        // Step 2: Add unique index to purchases.invoice
        Schema::table('purchases', function (Blueprint $table) {
            $table->string('invoice')->nullable(false)->change();
            $table->unique('invoice', 'purchases_invoice_unique');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropUnique('purchases_invoice_unique');
            $table->string('invoice')->nullable()->change();
        });
    }
};
