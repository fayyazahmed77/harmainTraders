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
        Schema::table('investor_profit_shares', function (Blueprint $table) {
            $table->longText('calculation_meta')->nullable()->after('credited_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('investor_profit_shares', function (Blueprint $table) {
            $table->dropColumn('calculation_meta');
        });
    }
};
