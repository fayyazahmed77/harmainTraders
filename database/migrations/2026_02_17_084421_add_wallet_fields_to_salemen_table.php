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
        Schema::table('salemen', function (Blueprint $table) {
            $table->decimal('wallet_balance', 15, 2)->default(0)->after('status');
            $table->decimal('commission_percentage', 5, 2)->default(0)->after('wallet_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salemen', function (Blueprint $table) {
            $table->dropColumn(['wallet_balance', 'commission_percentage']);
        });
    }
};
