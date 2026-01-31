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
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('invoice')->nullable(); // Return Invoice #
            $table->string('original_invoice')->nullable(); // Reference to original sales invoice
            $table->unsignedBigInteger('customer_id')->default(0);
            $table->unsignedBigInteger('salesman_id')->default(0);
            $table->integer('no_of_items')->default(0);
            $table->decimal('gross_total', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('net_total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0); // Amount refunded/paid back
            $table->decimal('remaining_amount', 15, 2)->default(0); // Balance to be adjusted
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_returns');
    }
};
