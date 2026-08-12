<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chequebooks', function (Blueprint $table) {
            // Drop old single-column unique index on cheque_no if exists
            try {
                $table->dropUnique('chequebooks_cheque_no_unique');
            } catch (\Exception $e) {
                // In case index name differs or already dropped
            }

            // Standardize prefix to empty string if null for index consistency
            DB::statement("UPDATE chequebooks SET prefix = '' WHERE prefix IS NULL");

            // Add composite unique constraint (bank_id, prefix, cheque_no)
            $table->unique(['bank_id', 'prefix', 'cheque_no'], 'chequebooks_bank_prefix_chequeno_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chequebooks', function (Blueprint $table) {
            $table->dropUnique('chequebooks_bank_prefix_chequeno_unique');
            $table->unique('cheque_no', 'chequebooks_cheque_no_unique');
        });
    }
};
