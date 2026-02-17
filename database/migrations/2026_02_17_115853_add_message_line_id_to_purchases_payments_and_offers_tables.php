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
        Schema::table('purchases', function (Blueprint $table) {
            $table->foreignId('message_line_id')->nullable()->after('salesman_id')->constrained('message_lines')->nullOnDelete();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('message_line_id')->nullable()->after('payment_method')->constrained('message_lines')->nullOnDelete();
        });

        Schema::table('price_offer_to', function (Blueprint $table) {
            $table->foreignId('message_line_id')->nullable()->after('offertype')->constrained('message_lines')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropForeign(['message_line_id']);
            $table->dropColumn('message_line_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['message_line_id']);
            $table->dropColumn('message_line_id');
        });

        Schema::table('price_offer_to', function (Blueprint $table) {
            $table->dropForeign(['message_line_id']);
            $table->dropColumn('message_line_id');
        });
    }
};
