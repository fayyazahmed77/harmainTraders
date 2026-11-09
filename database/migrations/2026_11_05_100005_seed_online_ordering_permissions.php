<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create or fetch permission category for Online Orders
        $category = DB::table('permission_cats')->where('name', 'Online Orders')->first();
        if ($category) {
            $categoryId = $category->id;
        } else {
            $categoryId = DB::table('permission_cats')->insertGetId([
                'name' => 'Online Orders',
                'icon' => 'Globe',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Define permissions to add
        $permissions = [
            'view online orders',
            'review online orders',
            'edit online orders',
            'create online order revisions',
            'apply online order discounts',
            'manage online order delivery charges',
            'confirm online orders',
            'cancel online orders',
            'resend online order notifications',
            'view pending customers',
            'approve customers',
            'reject customers',
            'link customer accounts',
        ];

        foreach ($permissions as $permName) {
            $perm = Permission::firstOrCreate(
                ['name' => $permName, 'guard_name' => 'web'],
                ['cat' => $categoryId, 'created_by' => 1]
            );

            if ($perm->cat !== $categoryId) {
                $perm->update(['cat' => $categoryId]);
            }
        }

        // 3. Clear Spatie permission cache before assigning
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 4. Assign to Super Admin / Admin roles
        $adminRoles = Role::whereIn('name', ['admin', 'super-admin', 'Super Admin', 'Admin'])->get();
        foreach ($adminRoles as $role) {
            $role->givePermissionTo($permissions);
        }

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissions = [
            'view online orders',
            'review online orders',
            'edit online orders',
            'create online order revisions',
            'apply online order discounts',
            'manage online order delivery charges',
            'confirm online orders',
            'cancel online orders',
            'resend online order notifications',
            'view pending customers',
            'approve customers',
            'reject customers',
            'link customer accounts',
        ];

        Permission::whereIn('name', $permissions)->delete();
        DB::table('permission_cats')->where('name', 'Online Orders')->delete();
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
};

