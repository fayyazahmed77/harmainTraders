<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add is_return_refund flag to payments table.
     * This is used to distinguish cash refunds created during Sales Returns
     * from regular payments, preventing double-counting in the customer ledger.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->boolean('is_return_refund')->default(false)->after('cheque_status');
        });

        // Mark existing refund payments (created by SalesReturnController)
        // These can be identified by their remarks pattern
        DB::statement("
            UPDATE payments 
            SET is_return_refund = 1 
            WHERE type = 'PAYMENT' 
            AND remarks LIKE 'Refund for Return Invoice:%'
        ");
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('is_return_refund');
        });
    }
};
