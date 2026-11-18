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
        // Safe check for purchase_returns: ensure no duplicates exist before adding UNIQUE
        $dupPR = DB::select("SELECT invoice, COUNT(*) as cnt FROM purchase_returns WHERE invoice IS NOT NULL GROUP BY invoice HAVING COUNT(*) > 1");
        if (empty($dupPR) && Schema::hasTable('purchase_returns')) {
            $existingIndexes = collect(Schema::getIndexes('purchase_returns'))->pluck('name')->toArray();
            if (!in_array('purchase_returns_invoice_unique', $existingIndexes)) {
                Schema::table('purchase_returns', function (Blueprint $table) {
                    $table->unique('invoice', 'purchase_returns_invoice_unique');
                });
            }
        }

        // Safe check for online_orders: ensure idempotency_key is unique
        if (Schema::hasTable('online_orders')) {
            $dupOO = DB::select("SELECT idempotency_key, COUNT(*) as cnt FROM online_orders WHERE idempotency_key IS NOT NULL GROUP BY idempotency_key HAVING COUNT(*) > 1");
            if (empty($dupOO)) {
                $existingIndexes = collect(Schema::getIndexes('online_orders'))->pluck('name')->toArray();
                Schema::table('online_orders', function (Blueprint $table) use ($existingIndexes) {
                    if (in_array('online_orders_idempotency_key_index', $existingIndexes)) {
                        $table->dropIndex('online_orders_idempotency_key_index');
                    }
                    if (!in_array('online_orders_idempotency_key_unique', $existingIndexes)) {
                        $table->unique('idempotency_key', 'online_orders_idempotency_key_unique');
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('purchase_returns')) {
            $existingIndexes = collect(Schema::getIndexes('purchase_returns'))->pluck('name')->toArray();
            if (in_array('purchase_returns_invoice_unique', $existingIndexes)) {
                Schema::table('purchase_returns', function (Blueprint $table) {
                    $table->dropUnique('purchase_returns_invoice_unique');
                });
            }
        }

        if (Schema::hasTable('online_orders')) {
            $existingIndexes = collect(Schema::getIndexes('online_orders'))->pluck('name')->toArray();
            Schema::table('online_orders', function (Blueprint $table) use ($existingIndexes) {
                if (in_array('online_orders_idempotency_key_unique', $existingIndexes)) {
                    $table->dropUnique('online_orders_idempotency_key_unique');
                }
                if (!in_array('online_orders_idempotency_key_index', $existingIndexes)) {
                    $table->index('idempotency_key', 'online_orders_idempotency_key_index');
                }
            });
        }
    }
};
