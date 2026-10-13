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
        // 1. Create or fetch permission category for Orders
        $category = DB::table('permission_cats')->where('name', 'Orders')->first();
        if ($category) {
            $categoryId = $category->id;
        } else {
            $categoryId = DB::table('permission_cats')->insertGetId([
                'name' => 'Orders',
                'icon' => 'ShoppingCart',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Define permissions to add
        $permissions = [
            'view supplier orders',
            'create supplier orders',
            'delete supplier orders',
            'manage supplier companies',
            'view orders',
            'create orders',
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

        // 4. Grant newly created permissions to Admin role
        $adminRole = Role::where('name', 'Admin')->where('guard_name', 'web')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
        }

        // Clear Spatie permission cache after assigning
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissions = [
            'view supplier orders',
            'create supplier orders',
            'delete supplier orders',
            'manage supplier companies',
            'view orders',
            'create orders',
        ];

        $category = DB::table('permission_cats')->where('name', 'Orders')->first();

        // Detach and delete permissions
        foreach ($permissions as $permName) {
            $perm = Permission::where('name', $permName)->where('guard_name', 'web')->first();
            if ($perm) {
                $perm->roles()->detach();
                $perm->delete();
            }
        }

        if ($category) {
            $remaining = DB::table('permissions')->where('cat', $category->id)->count();
            if ($remaining === 0) {
                DB::table('permission_cats')->where('id', $category->id)->delete();
            }
        }

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
};
