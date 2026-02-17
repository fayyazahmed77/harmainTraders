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
        if (!Schema::hasColumn('sales', 'firm_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->unsignedBigInteger('firm_id')->nullable()->after('salesman_id');
                $table->foreign('firm_id')->references('id')->on('firms')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['firm_id']);
            $table->dropColumn('firm_id');
        });
    }
};
