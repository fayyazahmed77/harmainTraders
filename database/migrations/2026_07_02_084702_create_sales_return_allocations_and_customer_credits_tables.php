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
        Schema::create('sales_return_allocations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_return_id');
            $table->unsignedBigInteger('sale_id');
            $table->decimal('amount', 15, 2);
            $table->timestamps();

            $table->foreign('sales_return_id')->references('id')->on('sales_returns')->onDelete('cascade');
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('cascade');
            $table->index(['sales_return_id', 'sale_id'], 'idx_sales_return_allocs');
        });

        Schema::create('customer_credits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('sales_return_id');
            $table->decimal('amount', 15, 2);
            $table->decimal('available_balance', 15, 2);
            $table->string('status', 50)->default('Available'); // Available, Partial, Refunded, Canceled
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('accounts')->onDelete('cascade');
            $table->foreign('sales_return_id')->references('id')->on('sales_returns')->onDelete('cascade');
            $table->index(['customer_id', 'status'], 'idx_customer_credits');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_credits');
        Schema::dropIfExists('sales_return_allocations');
    }
};
