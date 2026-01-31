<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ItemCategory;

class ItemCategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            'Electronics',
            'Computers',
            'Smartphones',
            'Accessories',
            'Furniture',
            'Clothing',
            'Footwear',
            'Groceries',
            'Beverages',
            'Stationery',
            'Books',
            'Toys',
            'Sports',
            'Automotive',
            'Beauty',
            'Health',
            'Home Decor',
            'Kitchenware',
            'Tools',
            'Gardening',
            'General', // From ItemsSeeder
            'Food',    // From ItemsSeeder
            'Medicine', // From ItemsSeeder
            'Snacks',
            'Dairy',
            'Biscuits',
            'Confectionery',
            'Personal Care',
            'Detergents',
            'Cooking Oil',
            'Rice',
            'Flour',
            'Spices',
            'Tea',
            'Coffee',
            'Noodles',
            'Pasta',
            'Sauces',
            'Juices',
        ];

        foreach ($categories as $category) {
            ItemCategory::create([
                'name' => $category,
                'status' => 'active',
                'created_by' => 1, // Assuming admin user ID 1
            ]);
        }
    }
}
