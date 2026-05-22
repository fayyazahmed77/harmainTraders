<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\PermissionCat;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissionsByCategory = [
            'User Management' => [
                'manage roles',
                'manage permissions',
                'manage staff',
            ],
            'Firms & Banks' => [
                'view firms',
                'manage firms',
                'view banks',
                'manage banks',
                'manage cheques',
            ],
            'Geographic Master' => [
                'view areas',
                'edit areas',
                'delete areas',
                'view cities',
                'edit cities',
                'delete cities',
            ],
            'Accounts & Ledger' => [
                'view accounts',
                'manage accounts',
                'view ledger',
            ],
            'Inventory & Stock' => [
                'view stock',
                'manage stock',
                'adjust stock',
            ],
            'Purchases' => [
                'view purchases',
                'create purchases',
                'edit purchases',
                'delete purchases',
            ],
            'Sales' => [
                'view sales',
                'create sales',
                'edit sales',
                'delete sales',
            ],
            'Sales Returns' => [
                'view returns',
                'create returns',
                'edit returns',
                'delete returns',
            ],
            'Purchase Returns' => [
                'view purchase returns',
                'create purchase returns',
                'edit purchase returns',
                'delete purchase returns',
            ],
            'Journal Vouchers' => [
                'view jv',
                'create jv',
                'manage jv',
                'delete jv',
            ],
            'Payments & Receipts' => [
                'view payments',
                'create payments',
                'edit payments',
                'delete payments',
            ],
            'Reports' => [
                'view reports',
                'view profit reports',
                'export reports',
            ],
        ];

        $allPermissionNames = [];

        foreach ($permissionsByCategory as $catName => $permissions) {
            // Dynamically retrieve Category ID by name
            $category = PermissionCat::where('name', $catName)->first();
            if (!$category) {
                continue;
            }

            foreach ($permissions as $name) {
                $allPermissionNames[] = $name;

                // Idempotent find or save to prevent MassAssignmentException on custom columns
                $permission = Permission::where('name', $name)->where('guard_name', 'web')->first();
                if (!$permission) {
                    $permission = new Permission();
                    $permission->name = $name;
                    $permission->guard_name = 'web';
                    $permission->cat = $category->id;
                    $permission->created_by = 1;
                    $permission->save();
                } else {
                    // Update category and creator just in case
                    $permission->cat = $category->id;
                    $permission->save();
                }
            }
        }

        // Fetch or create Admin role
        $adminRole = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        foreach ($allPermissionNames as $permName) {
            if (!$adminRole->hasPermissionTo($permName)) {
                $adminRole->givePermissionTo($permName);
            }
        }

        // Fetch or create Salesman role
        $salesmanRole = Role::firstOrCreate(['name' => 'Salesman', 'guard_name' => 'web']);
        $salesmanPermissions = [
            'view sales',
            'create sales',
            'view purchases',
            'view payments',
            'view reports',
            'view stock',
        ];
        foreach ($salesmanPermissions as $permName) {
            if (!$salesmanRole->hasPermissionTo($permName)) {
                $salesmanRole->givePermissionTo($permName);
            }
        }

        // Forget Spatie permission cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
