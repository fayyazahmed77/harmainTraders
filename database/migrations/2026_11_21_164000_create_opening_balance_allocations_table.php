<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('opening_balance_allocations')) {
            Schema::create('opening_balance_allocations', function (Blueprint $table) {
                $table->id();
                $table->string('voucher_no')->unique(); // e.g., CRV-OB-0001, CPV-OB-0001
                $table->unsignedBigInteger('account_id');
                $table->string('bill_type'); // App\Models\Sales or App\Models\Purchase
                $table->unsignedBigInteger('bill_id');
                $table->date('date');
                $table->decimal('amount', 15, 2)->default(0);
                $table->text('remarks')->nullable();
                $table->timestamps();

                $table->index('account_id');
                $table->index(['bill_type', 'bill_id']);
            });
        }

        if (Schema::hasTable('payment_allocations') && !Schema::hasColumn('payment_allocations', 'is_advance')) {
            Schema::table('payment_allocations', function (Blueprint $table) {
                $table->boolean('is_advance')->default(false)->after('amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('payment_allocations') && Schema::hasColumn('payment_allocations', 'is_advance')) {
            Schema::table('payment_allocations', function (Blueprint $table) {
                $table->dropColumn('is_advance');
            });
        }

        Schema::dropIfExists('opening_balance_allocations');
    }
};
