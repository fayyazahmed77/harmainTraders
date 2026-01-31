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
        Schema::create('sales_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('qty_carton', 15, 2)->default(0);
            $table->decimal('qty_pcs', 15, 2)->default(0);
            $table->decimal('total_pcs', 15, 2)->default(0);
            $table->decimal('trade_price', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('gst_amount', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->timestamps();

            // Foreign keys (optional but good practice)
            // $table->foreign('sale_id')->references('id')->on('sales')->onDelete('cascade');
            // $table->foreign('item_id')->references('id')->on('items');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_items');
    }
};
