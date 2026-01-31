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
        Schema::create('chequebooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_id')->constrained()->onDelete('cascade');
            $table->string('cheque_no')->unique();
            $table->date('entry_date')->nullable();
            $table->string('voucher_code')->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['unused', 'issued', 'cancelled'])->default('unused');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chequebooks');
    }
};
