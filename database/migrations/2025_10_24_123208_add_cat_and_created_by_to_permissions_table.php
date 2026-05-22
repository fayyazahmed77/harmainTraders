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
        $tableNames = config('permission.table_names');
        $tableName = $tableNames['permissions'] ?? 'permissions';

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (!Schema::hasColumn($tableName, 'cat')) {
                $table->unsignedBigInteger('cat')->nullable()->after('guard_name');
                $table->foreign('cat')->references('id')->on('permission_cats')->onDelete('set null');
            }
            if (!Schema::hasColumn($tableName, 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('cat');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableNames = config('permission.table_names');
        $tableName = $tableNames['permissions'] ?? 'permissions';

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            $table->dropForeign([$tableName . '_cat_foreign']);
            $table->dropColumn(['cat', 'created_by']);
        });
    }
};
