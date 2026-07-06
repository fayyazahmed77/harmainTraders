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
        if (!Schema::hasTable('purchase_return_allocations')) {
            Schema::create('purchase_return_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('purchase_return_id')
                    ->constrained('purchase_returns')
                    ->onDelete('cascade');
                $table->foreignId('purchase_id')
                    ->constrained('purchases')
                    ->onDelete('cascade');
                $table->decimal('amount', 15, 2);
                $table->timestamps();

                // Add index for performance
                $table->index(['purchase_return_id', 'purchase_id'], 'pr_alloc_indices');
            });
        }

        if (!Schema::hasTable('supplier_credits')) {
            Schema::create('supplier_credits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('supplier_id')
                    ->constrained('accounts')
                    ->onDelete('cascade');
                $table->foreignId('purchase_return_id')
                    ->constrained('purchase_returns')
                    ->onDelete('cascade');
                $table->decimal('amount', 15, 2);
                $table->decimal('available_balance', 15, 2);
                $table->string('status', 20)->default('Available'); // Available, Partial, Used, Refunded
                $table->timestamps();

                // Add index for performance
                $table->index(['supplier_id', 'status'], 'supp_credit_indices');
            });
        }

        // Ensure payments collation matches Laravel defaults to allow foreign keys
        try {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE payments CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        } catch (\Exception $e) {
            // Ignore if charset alter fails or is not supported
        }

        if (!Schema::hasColumn('payments', 'supplier_credit_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->unsignedBigInteger('supplier_credit_id')->nullable()->after('customer_credit_id');
                $table->foreign('supplier_credit_id')->references('id')->on('supplier_credits')->onDelete('set null');
            });
        } else {
            try {
                Schema::table('payments', function (Blueprint $table) {
                    $table->foreign('supplier_credit_id')->references('id')->on('supplier_credits')->onDelete('set null');
                });
            } catch (\Exception $e) {
                // Ignore if constraint already exists
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['supplier_credit_id']);
            $table->dropColumn('supplier_credit_id');
        });

        Schema::dropIfExists('supplier_credits');
        Schema::dropIfExists('purchase_return_allocations');
    }
};
