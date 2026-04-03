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
        Schema::table('offer_lists', function (Blueprint $table) {
            $table->string('scheme')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offer_lists', function (Blueprint $table) {
            $table->decimal('scheme', 10, 2)->nullable()->change();
        });
    }
};
