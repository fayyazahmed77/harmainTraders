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
        // 1. Normalize purchase_items (Quantity from INT to Decimal, Prices to 15,2)
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('qty_carton', 15, 2)->change();
            $table->decimal('qty_pcs', 15, 2)->change();
            $table->decimal('total_pcs', 15, 2)->change();
            $table->decimal('trade_price', 15, 2)->change();
            $table->decimal('discount', 15, 2)->change();
            $table->decimal('gst_amount', 15, 2)->change();
            $table->decimal('subtotal', 15, 2)->change();
        });

        // 2. Normalize purchase_return_items (Quantity precision to 15,2)
        Schema::table('purchase_return_items', function (Blueprint $table) {
            $table->decimal('qty_carton', 15, 2)->change();
            $table->decimal('qty_pcs', 15, 2)->change();
            $table->decimal('total_pcs', 15, 2)->change();
        });

        // 3. Normalize purchases (Totals to 15,2)
        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('gross_total', 15, 2)->change();
            $table->decimal('discount_total', 15, 2)->change();
            $table->decimal('tax_total', 15, 2)->change();
            $table->decimal('net_total', 15, 2)->change();
            $table->decimal('paid_amount', 15, 2)->change();
            $table->decimal('remaining_amount', 15, 2)->change();
            $table->decimal('courier_charges', 15, 2)->change();
        });

        // 4. Normalize sales (Courier charges to 15,2)
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('courier_charges', 15, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We probably shouldn't revert to INT as it might cause data loss for existing decimals,
        // but for completeness of the migration:

        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('courier_charges', 12, 2)->change();
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('gross_total', 12, 2)->change();
            $table->decimal('discount_total', 12, 2)->change();
            $table->decimal('tax_total', 12, 2)->change();
            $table->decimal('net_total', 12, 2)->change();
            $table->decimal('paid_amount', 12, 2)->change();
            $table->decimal('remaining_amount', 12, 2)->change();
            $table->decimal('courier_charges', 12, 2)->change();
        });

        Schema::table('purchase_return_items', function (Blueprint $table) {
            $table->decimal('qty_carton', 10, 2)->change();
            $table->decimal('qty_pcs', 10, 2)->change();
            $table->decimal('total_pcs', 10, 2)->change();
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->integer('qty_carton')->change();
            $table->integer('qty_pcs')->change();
            $table->integer('total_pcs')->change();
            $table->decimal('trade_price', 10, 2)->change();
            $table->decimal('discount', 10, 2)->change();
            $table->decimal('gst_amount', 12, 2)->change();
            $table->decimal('subtotal', 12, 2)->change();
        });
    }
};
