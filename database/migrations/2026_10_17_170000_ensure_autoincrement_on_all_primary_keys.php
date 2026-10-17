<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'sales_returns',
            'sales_return_items',
            'sales_return_allocations',
            'sales',
            'sales_items',
            'salemen',
            'users',
            'user_verified_devices',
            'shifts',
            'site_settings',
            'subareas',
            'supplier_companies',
            'supplier_credits',
            'supplier_orders',
            'supplier_order_items',
            'wallet_transactions',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'id')) {
                // Ensure the id column is AUTO_INCREMENT
                try {
                    DB::statement("ALTER TABLE `{$table}` MODIFY COLUMN `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT");
                } catch (\Throwable $e) {
                    // Ignore if already auto_increment or not supported
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: AUTO_INCREMENT should always remain on primary key id
    }
};
