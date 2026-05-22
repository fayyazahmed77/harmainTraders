<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PermissionCat;

class PermissionCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'User Management', 'icon' => 'ShieldAlert'],
            ['name' => 'Firms & Banks', 'icon' => 'Building2'],
            ['name' => 'Geographic Master', 'icon' => 'MapPin'],
            ['name' => 'Accounts & Ledger', 'icon' => 'NotebookTabs'],
            ['name' => 'Inventory & Stock', 'icon' => 'PackageSearch'],
            ['name' => 'Purchases', 'icon' => 'ShoppingBag'],
            ['name' => 'Sales', 'icon' => 'ReceiptCent'],
            ['name' => 'Sales Returns', 'icon' => 'Undo2'],
            ['name' => 'Purchase Returns', 'icon' => 'PackageOpen'],
            ['name' => 'Journal Vouchers', 'icon' => 'Layers3'],
            ['name' => 'Payments & Receipts', 'icon' => 'BadgeCent'],
            ['name' => 'Reports', 'icon' => 'TrendingUp'],
        ];

        foreach ($categories as $cat) {
            PermissionCat::firstOrCreate(
                ['name' => $cat['name']],
                ['icon' => $cat['icon']]
            );
        }
    }
}
