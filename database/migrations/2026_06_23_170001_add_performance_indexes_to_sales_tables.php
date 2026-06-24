<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add performance indexes for Sales, SalesReturn, and SalesItems.
     * We intentionally skip UNIQUE on sales.invoice because 19 duplicates
     * already exist in the database from the race condition bug (B5).
     * A separate data-cleanup process must de-duplicate before adding UNIQUE.
     */
    public function up(): void
    {
        // Index: sales.customer_id (ledger lookups)
        if (!$this->indexExists('sales', 'sales_customer_id_index')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->index('customer_id', 'sales_customer_id_index');
            });
        }

        // Index: sales.date (date range queries)
        if (!$this->indexExists('sales', 'sales_date_index')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->index('date', 'sales_date_index');
            });
        }

        // Index: sales.invoice (lookup by invoice number — non-unique due to existing duplicates)
        if (!$this->indexExists('sales', 'sales_invoice_index')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->index('invoice', 'sales_invoice_index');
            });
        }

        // Index: sales_returns.original_invoice (used in updateSaleStatusAndBalance)
        if (!$this->indexExists('sales_returns', 'sales_returns_original_invoice_index')) {
            Schema::table('sales_returns', function (Blueprint $table) {
                $table->index('original_invoice', 'sales_returns_original_invoice_index');
            });
        }

        // Index: sales_returns.customer_id
        if (!$this->indexExists('sales_returns', 'sales_returns_customer_id_index')) {
            Schema::table('sales_returns', function (Blueprint $table) {
                $table->index('customer_id', 'sales_returns_customer_id_index');
            });
        }

        // Index: sales_items.sale_id
        if (!$this->indexExists('sales_items', 'sales_items_sale_id_index')) {
            Schema::table('sales_items', function (Blueprint $table) {
                $table->index('sale_id', 'sales_items_sale_id_index');
            });
        }

        // Index: sales_return_items.sales_return_id
        if (!$this->indexExists('sales_return_items', 'sales_return_items_return_id_index')) {
            Schema::table('sales_return_items', function (Blueprint $table) {
                $table->index('sales_return_id', 'sales_return_items_return_id_index');
            });
        }

        // Index: payment_allocations.bill_id + bill_type (used in updateSaleStatusAndBalance)
        if (!$this->indexExists('payment_allocations', 'pa_bill_idx')) {
            Schema::table('payment_allocations', function (Blueprint $table) {
                $table->index(['bill_id', 'bill_type'], 'pa_bill_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndexIfExists('sales_customer_id_index');
            $table->dropIndexIfExists('sales_date_index');
            $table->dropIndexIfExists('sales_invoice_index');
        });
        Schema::table('sales_returns', function (Blueprint $table) {
            $table->dropIndexIfExists('sales_returns_original_invoice_index');
            $table->dropIndexIfExists('sales_returns_customer_id_index');
        });
        Schema::table('sales_items', function (Blueprint $table) {
            $table->dropIndexIfExists('sales_items_sale_id_index');
        });
        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->dropIndexIfExists('sales_return_items_return_id_index');
        });
        Schema::table('payment_allocations', function (Blueprint $table) {
            $table->dropIndexIfExists('pa_bill_idx');
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }
};
