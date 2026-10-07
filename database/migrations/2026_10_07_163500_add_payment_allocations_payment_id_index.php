<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations to add missing performance indexes on payment_allocations and payments.
     */
    public function up(): void
    {
        if (Schema::hasTable('payment_allocations')) {
            Schema::table('payment_allocations', function (Blueprint $table) {
                if (!$this->indexExists('payment_allocations', 'pa_payment_id_idx')) {
                    $table->index('payment_id', 'pa_payment_id_idx');
                }
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!$this->indexExists('payments', 'payments_pay_acc_idx')) {
                    $table->index('payment_account_id', 'payments_pay_acc_idx');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('payment_allocations')) {
            Schema::table('payment_allocations', function (Blueprint $table) {
                $table->dropIndexIfExists('pa_payment_id_idx');
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropIndexIfExists('payments_pay_acc_idx');
            });
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }
};
