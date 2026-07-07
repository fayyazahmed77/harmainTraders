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
        Schema::table('sales_returns', function (Blueprint $table) {
            $table->decimal('previous_balance', 15, 2)->default(0.00)->after('customer_id');
            $table->decimal('extra_discount', 15, 2)->default(0.00)->after('net_total');
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->decimal('previous_balance', 15, 2)->default(0.00)->after('supplier_id');
            $table->decimal('extra_discount', 15, 2)->default(0.00)->after('net_total');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_returns', function (Blueprint $table) {
            $table->dropColumn(['previous_balance', 'extra_discount']);
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->dropColumn(['previous_balance', 'extra_discount']);
        });
    }
};
