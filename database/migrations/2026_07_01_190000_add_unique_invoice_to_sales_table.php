<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Fix any existing duplicates before adding the constraint.
        // Append the ID to make each duplicate unique: SLS-000005_2, etc.
        $duplicates = DB::table('sales')
            ->select('invoice', DB::raw('COUNT(*) as cnt'))
            ->groupBy('invoice')
            ->having('cnt', '>', 1)
            ->get();

        foreach ($duplicates as $dup) {
            $rows = DB::table('sales')
                ->where('invoice', $dup->invoice)
                ->orderBy('id')
                ->get();

            // Keep the first one as-is, suffix the rest with _<id>
            foreach ($rows->skip(1) as $row) {
                DB::table('sales')
                    ->where('id', $row->id)
                    ->update(['invoice' => $row->invoice . '_dup' . $row->id]);
            }
        }

        // Step 2: Add the unique index
        Schema::table('sales', function (Blueprint $table) {
            $table->string('invoice')->nullable(false)->change();
            $table->unique('invoice', 'sales_invoice_unique');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique('sales_invoice_unique');
            $table->string('invoice')->nullable()->change();
        });
    }
};
