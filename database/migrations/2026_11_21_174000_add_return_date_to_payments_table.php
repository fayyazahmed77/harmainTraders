<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payments') && !Schema::hasColumn('payments', 'return_date')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->date('return_date')->nullable()->after('clear_date');
                $table->index('return_date');
            });

            // Safely backfill return_date for existing returned/canceled cheques
            DB::statement("
                UPDATE payments
                SET return_date = COALESCE(cheque_date, DATE(updated_at), date)
                WHERE return_date IS NULL
                  AND cheque_status IN ('Canceled', 'Cancelled', 'Returned', 'Refund')
            ");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'return_date')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropIndex(['return_date']);
                $table->dropColumn('return_date');
            });
        }
    }
};
