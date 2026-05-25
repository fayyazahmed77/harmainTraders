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
        // 1. Create or fetch permission category for Journal Vouchers
        $category = DB::table('permission_cats')->where('name', 'Journal Voucher')->first();
        if ($category) {
            $categoryId = $category->id;
        } else {
            $categoryId = DB::table('permission_cats')->insertGetId([
                'name' => 'Journal Voucher',
                'icon' => 'Receipt',
            ]);
        }

        // 2. Insert new permissions for Journal Vouchers if not already present
        $permissions = [
            'view_journal_vouchers',
            'create_journal_vouchers',
            'delete_journal_vouchers'
        ];

        foreach ($permissions as $permName) {
            $exists = DB::table('permissions')
                ->where('name', $permName)
                ->where('guard_name', 'web')
                ->exists();

            if (!$exists) {
                DB::table('permissions')->insert([
                    'cat' => $categoryId,
                    'name' => $permName,
                    'guard_name' => 'web',
                    'created_by' => 1, // Default to admin or system ID
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
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
