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
        Schema::table('sales_items', function (Blueprint $table) {
            $table->decimal('bonus_qty_carton', 15, 2)->default(0)->after('qty_pcs');
            $table->decimal('bonus_qty_pcs', 15, 2)->default(0)->after('bonus_qty_carton');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_items', function (Blueprint $table) {
            $table->dropColumn(['bonus_qty_carton', 'bonus_qty_pcs']);
        });
    }
};
