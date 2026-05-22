<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create permission category for Journal Vouchers
        $categoryId = DB::table('permission_cats')->insertGetId([
            'name' => 'Journal Voucher',
            'icon' => 'Receipt',
        ]);

        // 2. Insert new permissions for Journal Vouchers
        $permissions = [
            [
                'cat' => $categoryId,
                'name' => 'view_journal_vouchers',
                'guard_name' => 'web',
                'created_by' => 1, // Default to admin or system ID
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cat' => $categoryId,
                'name' => 'create_journal_vouchers',
                'guard_name' => 'web',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cat' => $categoryId,
                'name' => 'delete_journal_vouchers',
                'guard_name' => 'web',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('permissions')->insert($permissions);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $category = DB::table('permission_cats')->where('name', 'Journal Voucher')->first();

        if ($category) {
            DB::table('permissions')->where('cat', $category->id)->delete();
            DB::table('permission_cats')->where('id', $category->id)->delete();
        }
    }
};
