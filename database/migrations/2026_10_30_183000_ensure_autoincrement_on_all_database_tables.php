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
            'sales_items',
            'sales_return_items',
            'sales_return_allocations',
            'purchase_items',
            'purchase_return_items',
            'purchase_return_allocations',
            'items',
            'item_categories',
            'item_images',
            'offer_lists',
            'supplier_orders',
            'supplier_order_items',
            'customer_credits',
            'supplier_credits',
            'supplier_companies',
            'chequebooks',
            'banks',
            'firms',
            'subareas',
            'cities',
            'countries',
            'provinces',
            'bookers',
            'salemen',
            'shifts',
            'site_settings',
            'users',
            'user_verified_devices',
            'roles',
            'permissions',
            'permission_cats',
            'price_offer_to',
            'daily_item_profit',
            'audit_ledgers',
            'access_requests',
            'access_request_histories',
            'capital_history',
            'email_templates',
            'failed_jobs',
            'financial_requests',
            'investors',
            'investor_capital_accounts',
            'investor_profit_shares',
            'investor_transactions',
            'message_lines',
            'profit_distributions',
            'wallet_transactions',
            'jobs',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'id')) {
                try {
                    // Check if column is an integer type and not already auto_increment
                    $cols = DB::select("SHOW COLUMNS FROM `{$table}` WHERE Field = 'id'");
                    if (!empty($cols)) {
                        $col = $cols[0];
                        $type = strtolower($col->Type ?? '');
                        $extra = strtolower($col->Extra ?? '');

                        if (strpos($type, 'int') !== false && strpos($extra, 'auto_increment') === false) {
                            DB::statement("ALTER TABLE `{$table}` MODIFY `id` {$col->Type} NOT NULL AUTO_INCREMENT");
                        }
                    }
                } catch (\Throwable $e) {
                    // Continue gracefully if table or permissions restrict modification
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

