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
        Schema::create('items', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->date('date')->nullable();
            $table->string('code')->nullable();
            $table->string('title')->nullable();
            $table->string('short_name')->nullable();
            $table->string('company')->nullable();

            // Pricing
            $table->decimal('trade_price', 10, 2)->nullable();
            $table->decimal('retail', 10, 2)->nullable();
            $table->decimal('retail_tp_diff', 10, 2)->nullable();

            // Inventory & Packing
            $table->integer('reorder_level')->nullable();
            $table->integer('packing_qty')->nullable();
            $table->string('packing_size')->nullable();
            $table->integer('pcs')->nullable();

            // Selects
            $table->string('formation')->nullable();
            $table->string('type')->nullable();
            $table->string('category')->nullable();
            $table->string('shelf')->nullable();

            // GST
            $table->decimal('gst_percent', 10, 2)->nullable();
            $table->decimal('gst_amount', 10, 2)->nullable();

            // Advanced Tax
            $table->decimal('adv_tax_filer', 10, 2)->nullable();
            $table->decimal('adv_tax_non_filer', 10, 2)->nullable();
            $table->decimal('adv_tax_manufacturer', 10, 2)->nullable();

            // Right Section
            $table->decimal('discount', 10, 2)->nullable();
            $table->integer('packing_full')->nullable();
            $table->integer('packing_pcs')->nullable();

            $table->integer('limit_pcs')->nullable();
            $table->integer('order_qty')->nullable();
            $table->decimal('weight', 10, 2)->nullable();

            // Stock (two fields)
            $table->integer('stock_1')->nullable();
            $table->integer('stock_2')->nullable();

            // Checkboxes
            $table->boolean('is_import')->default(false);
            $table->boolean('is_fridge')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_recipe')->default(false);

            // P.T. (2 to 7)
            $table->decimal('pt2', 10, 2)->nullable();
            $table->decimal('pt3', 10, 2)->nullable();
            $table->decimal('pt4', 10, 2)->nullable();
            $table->decimal('pt5', 10, 2)->nullable();
            $table->decimal('pt6', 10, 2)->nullable();
            $table->decimal('pt7', 10, 2)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
