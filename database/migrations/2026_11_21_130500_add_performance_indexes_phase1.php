<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. purchase_items: critical foreign key index on purchase_id
        if (Schema::hasTable('purchase_items') && Schema::hasColumn('purchase_items', 'purchase_id')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                $table->index('purchase_id', 'purchase_items_purchase_id_idx');
                if (Schema::hasColumn('purchase_items', 'item_id')) {
                    $table->index(['purchase_id', 'item_id'], 'purchase_items_purch_item_idx');
                }
            });
        }

        // 2. sales: salesman foreign key & composite index
        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'salesman_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->index('salesman_id', 'sales_salesman_id_idx');
                if (Schema::hasColumn('sales', 'date')) {
                    $table->index(['salesman_id', 'date'], 'sales_salesman_date_idx');
                }
            });
        }

        // 3. purchases: salesman and firm composite index
        if (Schema::hasTable('purchases') && Schema::hasColumn('purchases', 'salesman_id')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->index('salesman_id', 'purchases_salesman_id_idx');
                if (Schema::hasColumn('purchases', 'firm_id') && Schema::hasColumn('purchases', 'date')) {
                    $table->index(['firm_id', 'date'], 'purchases_firm_date_idx');
                }
            });
        }

        // 4. sales_returns: salesman index
        if (Schema::hasTable('sales_returns') && Schema::hasColumn('sales_returns', 'salesman_id')) {
            Schema::table('sales_returns', function (Blueprint $table) {
                $table->index('salesman_id', 'sales_returns_salesman_id_idx');
            });
        }

        // 5. purchase_returns: salesman index
        if (Schema::hasTable('purchase_returns') && Schema::hasColumn('purchase_returns', 'salesman_id')) {
            Schema::table('purchase_returns', function (Blueprint $table) {
                $table->index('salesman_id', 'purchase_returns_salesman_id_idx');
            });
        }

        // 6. price_offer_to: live offer lookup and account index
        if (Schema::hasTable('price_offer_to')) {
            Schema::table('price_offer_to', function (Blueprint $table) {
                if (Schema::hasColumn('price_offer_to', 'is_live') && Schema::hasColumn('price_offer_to', 'offertype') && Schema::hasColumn('price_offer_to', 'date')) {
                    $table->index(['is_live', 'offertype', 'date'], 'pot_live_offer_date_idx');
                }
                if (Schema::hasColumn('price_offer_to', 'account_id')) {
                    $table->index('account_id', 'pot_account_id_idx');
                }
            });
        }

        // 7. online_order_items: offer item foreign key
        if (Schema::hasTable('online_order_items') && Schema::hasColumn('online_order_items', 'offer_item_id')) {
            Schema::table('online_order_items', function (Blueprint $table) {
                $table->index('offer_item_id', 'ooi_offer_item_id_idx');
            });
        }

        // 8. payments: customer credit and supplier credit reconciliation
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (Schema::hasColumn('payments', 'customer_credit_id')) {
                    $table->index('customer_credit_id', 'payments_cust_credit_id_idx');
                }
                if (Schema::hasColumn('payments', 'supplier_credit_id')) {
                    $table->index('supplier_credit_id', 'payments_supp_credit_id_idx');
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
                $table->dropIndex('purchase_items_purchase_id_idx');
                $table->dropIndex('purchase_items_purch_item_idx');
            });
        }

        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropIndex('sales_salesman_id_idx');
                $table->dropIndex('sales_salesman_date_idx');
            });
        }

        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->dropIndex('purchases_salesman_id_idx');
                $table->dropIndex('purchases_firm_date_idx');
            });
        }

        if (Schema::hasTable('sales_returns')) {
            Schema::table('sales_returns', function (Blueprint $table) {
                $table->dropIndex('sales_returns_salesman_id_idx');
            });
        }

        if (Schema::hasTable('purchase_returns')) {
            Schema::table('purchase_returns', function (Blueprint $table) {
                $table->dropIndex('purchase_returns_salesman_id_idx');
            });
        }

        if (Schema::hasTable('price_offer_to')) {
            Schema::table('price_offer_to', function (Blueprint $table) {
                $table->dropIndex('pot_live_offer_date_idx');
                $table->dropIndex('pot_account_id_idx');
            });
        }

        if (Schema::hasTable('online_order_items')) {
            Schema::table('online_order_items', function (Blueprint $table) {
                $table->dropIndex('ooi_offer_item_id_idx');
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropIndex('payments_cust_credit_id_idx');
                $table->dropIndex('payments_supp_credit_id_idx');
            });
        }
    }
};
