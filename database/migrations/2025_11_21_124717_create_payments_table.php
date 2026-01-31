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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('voucher_no')->unique(); // e.g., CPV-1001, CRV-1001
            $table->unsignedBigInteger('account_id'); // Party (Customer/Supplier)
            $table->unsignedBigInteger('payment_account_id')->nullable(); // Cash/Bank Account
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2)->default(0);
            $table->string('type'); // 'RECEIPT' or 'PAYMENT'

            // Instrument details
            $table->string('cheque_no')->nullable();
            $table->date('cheque_date')->nullable();
            $table->date('clear_date')->nullable();

            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
