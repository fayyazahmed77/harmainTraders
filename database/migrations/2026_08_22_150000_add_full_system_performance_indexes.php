<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the performance indexing migrations.
     */
    public function up(): void
    {
        // 1. PURCHASES INDEXES
        if (Schema::hasTable('purchases')) {
            Schema::table('purchases', function (Blueprint $table) {
                if (!$this->indexExists('purchases', 'purchases_supplier_date_idx')) {
                    $table->index(['supplier_id', 'date'], 'purchases_supplier_date_idx');
                }
                if (Schema::hasColumn('purchases', 'status') && !$this->indexExists('purchases', 'purchases_status_date_idx')) {
                    $table->index(['status', 'date'], 'purchases_status_date_idx');
                }
                if (!$this->indexExists('purchases', 'purchases_date_idx')) {
                    $table->index('date', 'purchases_date_idx');
                }
            });
        }

        // 2. PAYMENTS INDEXES
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!$this->indexExists('payments', 'payments_acc_date_idx')) {
                    $table->index(['account_id', 'date'], 'payments_acc_date_idx');
                }
                if (!$this->indexExists('payments', 'payments_pay_acc_type_date_idx')) {
                    $table->index(['payment_account_id', 'type', 'date'], 'payments_pay_acc_type_date_idx');
                }
                if (!$this->indexExists('payments', 'payments_date_idx')) {
                    $table->index('date', 'payments_date_idx');
                }
                if (!$this->indexExists('payments', 'payments_type_idx')) {
                    $table->index('type', 'payments_type_idx');
                }
            });
        }

        // 3. ITEMS INDEXES
        if (Schema::hasTable('items')) {
            Schema::table('items', function (Blueprint $table) {
                if (Schema::hasColumn('items', 'category') && Schema::hasColumn('items', 'is_active') && !$this->indexExists('items', 'items_cat_active_idx')) {
                    $table->index(['category', 'is_active'], 'items_cat_active_idx');
                }
                if (Schema::hasColumn('items', 'code') && !$this->indexExists('items', 'items_code_idx')) {
                    $table->index('code', 'items_code_idx');
                }
            });
        }

        // 4. ACCOUNTS INDEXES
        if (Schema::hasTable('accounts')) {
            Schema::table('accounts', function (Blueprint $table) {
                if (Schema::hasColumn('accounts', 'type') && Schema::hasColumn('accounts', 'status') && !$this->indexExists('accounts', 'accounts_type_status_idx')) {
                    $table->index(['type', 'status'], 'accounts_type_status_idx');
                }
                if (Schema::hasColumn('accounts', 'city_id') && !$this->indexExists('accounts', 'accounts_city_idx')) {
                    $table->index('city_id', 'accounts_city_idx');
                }
                if (Schema::hasColumn('accounts', 'area_id') && !$this->indexExists('accounts', 'accounts_area_idx')) {
                    $table->index('area_id', 'accounts_area_idx');
                }
                if (Schema::hasColumn('accounts', 'saleman_id') && !$this->indexExists('accounts', 'accounts_saleman_idx')) {
                    $table->index('saleman_id', 'accounts_saleman_idx');
                }
            });
        }

        // 5. SALES COMPOSITE INDEXES
        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                if (!$this->indexExists('sales', 'sales_cust_date_idx')) {
                    $table->index(['customer_id', 'date'], 'sales_cust_date_idx');
                }
                if (Schema::hasColumn('sales', 'status') && !$this->indexExists('sales', 'sales_status_date_idx')) {
                    $table->index(['status', 'date'], 'sales_status_date_idx');
                }
                if (Schema::hasColumn('sales', 'firm_id') && !$this->indexExists('sales', 'sales_firm_date_idx')) {
                    $table->index(['firm_id', 'date'], 'sales_firm_date_idx');
                }
            });
        }

        // 6. SALES RETURNS INDEXES
        if (Schema::hasTable('sales_returns')) {
            Schema::table('sales_returns', function (Blueprint $table) {
                if (!$this->indexExists('sales_returns', 'sr_cust_date_idx')) {
                    $table->index(['customer_id', 'date'], 'sr_cust_date_idx');
                }
            });
        }

        // 7. PURCHASE RETURNS INDEXES
        if (Schema::hasTable('purchase_returns')) {
            Schema::table('purchase_returns', function (Blueprint $table) {
                if (!$this->indexExists('purchase_returns', 'pr_supp_date_idx')) {
                    $table->index(['supplier_id', 'date'], 'pr_supp_date_idx');
                }
            });
        }

        // 8. WALLET TRANSACTIONS INDEXES
        if (Schema::hasTable('wallet_transactions')) {
            Schema::table('wallet_transactions', function (Blueprint $table) {
                if (!$this->indexExists('wallet_transactions', 'wt_salesman_status_idx')) {
                    $table->index(['salesman_id', 'status'], 'wt_salesman_status_idx');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndexIfExists('purchases_supplier_date_idx');
            $table->dropIndexIfExists('purchases_status_date_idx');
            $table->dropIndexIfExists('purchases_date_idx');
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndexIfExists('payments_acc_date_idx');
            $table->dropIndexIfExists('payments_pay_acc_type_date_idx');
            $table->dropIndexIfExists('payments_date_idx');
            $table->dropIndexIfExists('payments_type_idx');
        });
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndexIfExists('items_cat_active_idx');
            $table->dropIndexIfExists('items_code_idx');
        });
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndexIfExists('accounts_type_status_idx');
            $table->dropIndexIfExists('accounts_city_idx');
            $table->dropIndexIfExists('accounts_area_idx');
            $table->dropIndexIfExists('accounts_saleman_idx');
        });
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndexIfExists('sales_cust_date_idx');
            $table->dropIndexIfExists('sales_status_date_idx');
            $table->dropIndexIfExists('sales_firm_date_idx');
        });
        Schema::table('sales_returns', function (Blueprint $table) {
            $table->dropIndexIfExists('sr_cust_date_idx');
        });
        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->dropIndexIfExists('pr_supp_date_idx');
        });
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropIndexIfExists('wt_salesman_status_idx');
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }
};
