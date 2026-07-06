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
        // Ensure payments table uses InnoDB engine to allow foreign keys on cPanel/MySQL
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE payments ENGINE=InnoDB');

        if (!Schema::hasColumn('payments', 'customer_credit_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->unsignedBigInteger('customer_credit_id')->nullable()->after('is_return_refund');
                $table->foreign('customer_credit_id')->references('id')->on('customer_credits')->onDelete('set null');
            });
        } else {
            // Column exists from a partially failed run, try to add constraint only
            try {
                Schema::table('payments', function (Blueprint $table) {
                    $table->foreign('customer_credit_id')->references('id')->on('customer_credits')->onDelete('set null');
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
            $table->dropForeign(['customer_credit_id']);
            $table->dropColumn('customer_credit_id');
        });
    }
};
