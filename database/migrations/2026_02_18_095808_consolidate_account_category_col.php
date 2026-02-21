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
        Schema::table('accounts', function (Blueprint $table) {
            // Drop the redundant column if it exists
            if (Schema::hasColumn('accounts', 'account_category_id')) {
                // Drop foreign key first
                $table->dropForeign(['account_category_id']);
                $table->dropColumn('account_category_id');
            }
            // Ensure category column can store the ID
            // It's currently varchar(100), which is sufficient to store a numeric ID as a string.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->unsignedBigInteger('account_category_id')->nullable();
            $table->foreign('account_category_id')->references('id')->on('account_categories')->onDelete('set null');
        });
    }
};
