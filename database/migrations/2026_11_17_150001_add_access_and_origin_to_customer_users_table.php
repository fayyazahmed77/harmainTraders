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
        Schema::table('customer_users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('password')->index();
            $table->boolean('must_change_password')->default(false)->after('is_active');
            $table->enum('registered_via', ['self_registered', 'erp_linked'])->default('self_registered')->after('must_change_password')->index();
            $table->unique('account_id', 'customer_users_account_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_users', function (Blueprint $table) {
            $table->dropUnique('customer_users_account_id_unique');
            $table->dropColumn(['is_active', 'must_change_password', 'registered_via']);
        });
    }
};
