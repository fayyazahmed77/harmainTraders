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
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['customer_id', 'date']);
            $table->index('date');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->index(['supplier_id', 'date']);
            $table->index('date');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['account_id', 'date']);
            $table->index('date');
        });

        Schema::table('sales_returns', function (Blueprint $table) {
            $table->index(['customer_id', 'date']);
            $table->index('date');
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->index(['supplier_id', 'date']);
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'date']);
            $table->dropIndex(['date']);
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'date']);
            $table->dropIndex(['date']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'date']);
            $table->dropIndex(['date']);
        });

        Schema::table('sales_returns', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'date']);
            $table->dropIndex(['date']);
        });

        Schema::table('purchase_returns', function (Blueprint $table) {
            $table->dropIndex(['account_id', 'date']);
            $table->dropIndex(['date']);
        });
    }
};
