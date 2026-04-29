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
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('free_carton', 15, 2)->nullable()->default(0)->after('gst_amount');
            $table->decimal('free_pcs', 15, 2)->nullable()->default(0)->after('free_carton');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn(['free_carton', 'free_pcs']);
        });
    }
};
