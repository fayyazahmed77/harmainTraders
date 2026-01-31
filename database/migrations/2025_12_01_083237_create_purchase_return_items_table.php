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
        Schema::create('purchase_return_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_return_id');
            $table->unsignedBigInteger('item_id');

            $table->decimal('qty_carton', 10, 2)->default(0);
            $table->decimal('qty_pcs', 10, 2)->default(0);
            $table->decimal('total_pcs', 10, 2)->default(0);

            $table->decimal('trade_price', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('gst_amount', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);

            $table->timestamps();

            // Foreign keys
            $table->foreign('purchase_return_id')->references('id')->on('purchase_returns')->onDelete('cascade');
            // Assuming items table exists, but maybe not strict foreign key to avoid issues if item deleted? 
            // Usually good practice to have it.
            // $table->foreign('item_id')->references('id')->on('items'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_return_items');
    }
};
