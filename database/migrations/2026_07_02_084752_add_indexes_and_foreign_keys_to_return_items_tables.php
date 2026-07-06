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
        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->foreign('sales_return_id')->references('id')->on('sales_returns')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
            $table->index('sales_return_id');
            $table->index('item_id');
        });

        Schema::table('purchase_return_items', function (Blueprint $table) {
            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
            $table->index('purchase_return_id');
            $table->index('item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->dropForeign(['sales_return_id']);
            $table->dropForeign(['item_id']);
            $table->dropIndex(['sales_return_id']);
            $table->dropIndex(['item_id']);
        });

        Schema::table('purchase_return_items', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
            $table->dropIndex(['purchase_return_id']);
            $table->dropIndex(['item_id']);
        });
    }
};
