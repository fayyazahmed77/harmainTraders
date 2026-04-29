<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Investor;
use App\Models\InvestorCapitalAccount;
use App\Models\Account;
use App\Models\AccountType;
use Illuminate\Support\Facades\Hash;

class InvestorSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure Capital account type exists (id 9 as per existing database)
        AccountType::updateOrCreate(['id' => 9], ['name' => 'Capital']);

        $testInvestors = [
            [
                'name' => 'Ahmed Khan',
                'email' => 'ahmed@example.com',
                'capital' => 1000000,
            ],
            [
                'name' => 'Sara Malik',
                'email' => 'sara@example.com',
                'capital' => 1500000,
            ],
            [
                'name' => 'Raza Sheikh',
                'email' => 'raza@example.com',
                'capital' => 500000,
            ],
        ];

        $totalCapital = collect($testInvestors)->sum('capital');

        foreach ($testInvestors as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password'),
                    'status' => 'active',
                ]
            );

            if (!$user->hasRole('investor')) {
                $user->assignRole('investor');
            }

            $investor = Investor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'full_name' => $data['name'],
                    'phone' => '03001234567',
                    'cnic' => '42101-1234567-1',
                    'joining_date' => now()->subMonths(6),
                    'status' => 'active',
                ]
            );

            $ownership = ($data['capital'] / $totalCapital) * 100;

            InvestorCapitalAccount::updateOrCreate(
                ['investor_id' => $investor->id],
                [
                    'initial_capital' => $data['capital'],
                    'current_capital' => $data['capital'],
                    'ownership_percentage' => $ownership,
                    'last_recalculated_at' => now(),
                ]
            );

            // Also create a main Account (Type 9) for the Day Book integration
            Account::updateOrCreate(
                ['title' => "Capital - " . $data['name']],
                [
                    'type' => 9, // Capital
                    'opening_balance' => $data['capital'],
                    'opening_date' => now()->subMonths(6)->format('Y-m-d'),
                    'status' => true,
                ]
            );
        }
    }
}
