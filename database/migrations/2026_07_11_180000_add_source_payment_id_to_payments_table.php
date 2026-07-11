<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('source_payment_id')
                ->nullable()
                ->constrained('payments')
                ->nullOnDelete();
        });

        // Heuristically backfill existing distributed cheques
        $distributedReceipts = DB::table('payments')
            ->where('type', 'RECEIPT')
            ->where('cheque_status', 'Distributed')
            ->get();

        foreach ($distributedReceipts as $receipt) {
            // Find corresponding supplier payment matching number and amount
            $matchingPayment = DB::table('payments')
                ->where('type', 'PAYMENT')
                ->where('payment_method', 'Cheque')
                ->where('cheque_no', $receipt->cheque_no)
                ->where('amount', $receipt->amount)
                ->first();

            if ($matchingPayment) {
                DB::table('payments')
                    ->where('id', $matchingPayment->id)
                    ->update(['source_payment_id' => $receipt->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['source_payment_id']);
            $table->dropColumn('source_payment_id');
        });
    }
};
