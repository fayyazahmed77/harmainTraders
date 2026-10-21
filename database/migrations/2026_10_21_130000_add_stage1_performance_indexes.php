<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the Stage 1 targeted performance indexing migrations.
     */
    public function up(): void
    {
        // 1. PURCHASE_ITEMS: Covering index for item cost aggregations
        if (Schema::hasTable('purchase_items')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_items', 'item_id') && 
                    Schema::hasColumn('purchase_items', 'trade_price') && 
                    !$this->indexExists('purchase_items', 'pi_item_trade_price_idx')) {
                    $table->index(['item_id', 'trade_price'], 'pi_item_trade_price_idx');
                }
            });
        }

        // 2. SALES_ITEMS: Covering index for item rate aggregations
        if (Schema::hasTable('sales_items')) {
            Schema::table('sales_items', function (Blueprint $table) {
                if (Schema::hasColumn('sales_items', 'item_id') && 
                    Schema::hasColumn('sales_items', 'trade_price') && 
                    !$this->indexExists('sales_items', 'si_item_trade_price_idx')) {
                    $table->index(['item_id', 'trade_price'], 'si_item_trade_price_idx');
                }
            });
        }

        // 3. SALES: Composite index for unpaid/due bills and outstanding reports
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (Schema::hasColumn('sales', 'remaining_amount') && 
                    Schema::hasColumn('sales', 'customer_id') && 
                    Schema::hasColumn('sales', 'date') && 
                    !$this->indexExists('sales', 'sales_rem_cust_date_idx')) {
                    $table->index(['remaining_amount', 'customer_id', 'date'], 'sales_rem_cust_date_idx');
                }
            });
        }

        // 4. PURCHASES: Composite index for unpaid bills and outstanding payables
        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                if (Schema::hasColumn('purchases', 'remaining_amount') && 
                    Schema::hasColumn('purchases', 'supplier_id') && 
                    Schema::hasColumn('purchases', 'date') && 
                    !$this->indexExists('purchases', 'purchases_rem_supp_date_idx')) {
                    $table->index(['remaining_amount', 'supplier_id', 'date'], 'purchases_rem_supp_date_idx');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('purchase_items')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                if ($this->indexExists('purchase_items', 'pi_item_trade_price_idx')) {
                    $table->dropIndex('pi_item_trade_price_idx');
                }
            });
        }

        if (Schema::hasTable('sales_items')) {
            Schema::table('sales_items', function (Blueprint $table) {
                if ($this->indexExists('sales_items', 'si_item_trade_price_idx')) {
                    $table->dropIndex('si_item_trade_price_idx');
                }
            });
        }

        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if ($this->indexExists('sales', 'sales_rem_cust_date_idx')) {
                    $table->dropIndex('sales_rem_cust_date_idx');
                }
            });
        }

        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                if ($this->indexExists('purchases', 'purchases_rem_supp_date_idx')) {
                    $table->dropIndex('purchases_rem_supp_date_idx');
                }
            });
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }
};
