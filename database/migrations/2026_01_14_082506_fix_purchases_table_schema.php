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
            $table->string('invoice')->change();
            $table->string('code')->nullable()->change();
            $table->decimal('courier_charges', 12, 2)->default(0)->after('remaining_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->integer('invoice')->change();
            $table->integer('code')->change();
            $table->dropColumn('courier_charges');
        });
    }
};
