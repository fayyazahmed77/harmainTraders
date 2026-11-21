<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add composite index on offer_lists(offer_id, status) — eliminates full table scan
        // on the order placement path: WHERE offer_id = ? AND status = 'active'
        // Before: type=ALL, rows=52440 (~70ms)
        // After:  type=ref, rows=~897 (~2ms)
        if (Schema::hasTable('offer_lists')) {
            $existing = collect(DB::select("SHOW INDEX FROM offer_lists WHERE Key_name = 'ol_offer_status_idx'"));
            if ($existing->isEmpty()) {
                Schema::table('offer_lists', function (Blueprint $table) {
                    $table->index(['offer_id', 'status'], 'ol_offer_status_idx');
                });
            }
        }

        // Add index on offer_lists(item_id, offer_id) for reverse lookups
        if (Schema::hasTable('offer_lists')) {
            $existing = collect(DB::select("SHOW INDEX FROM offer_lists WHERE Key_name = 'ol_item_offer_idx'"));
            if ($existing->isEmpty()) {
                Schema::table('offer_lists', function (Blueprint $table) {
                    $table->index(['item_id', 'offer_id'], 'ol_item_offer_idx');
                });
            }
        }

        // Add index on online_orders(customer_user_id, status) for eligibility check
        if (Schema::hasTable('online_orders')) {
            $existing = collect(DB::select("SHOW INDEX FROM online_orders WHERE Key_name = 'oo_customer_status_idx'"));
            if ($existing->isEmpty()) {
                Schema::table('online_orders', function (Blueprint $table) {
                    $table->index(['customer_user_id', 'status'], 'oo_customer_status_idx');
                });
            }
        }

        // Add index on online_orders(idempotency_key, customer_user_id) for fast idempotency check
        // Note: idempotency_key already has a unique index; skip to avoid duplicate key
    }

    public function down(): void
    {
        if (Schema::hasTable('offer_lists')) {
            Schema::table('offer_lists', function (Blueprint $table) {
                $table->dropIndex('ol_offer_status_idx');
                $table->dropIndex('ol_item_offer_idx');
            });
        }

        if (Schema::hasTable('online_orders')) {
            Schema::table('online_orders', function (Blueprint $table) {
                $table->dropIndex('oo_customer_status_idx');
            });
        }
    }
};
