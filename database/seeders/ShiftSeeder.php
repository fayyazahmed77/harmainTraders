<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shift;

class ShiftSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shifts = [
            [
                'name' => 'Morning',
                'start_time' => '09:00',
                'end_time' => '17:00',
                'break_duration_minutes' => 30,
                'overtime_limit_minutes' => 60,
                'color' => '#6366f1',
                'is_active' => true,
            ],
            [
                'name' => 'Evening',
                'start_time' => '17:00',
                'end_time' => '01:00',
                'break_duration_minutes' => 30,
                'overtime_limit_minutes' => 60,
                'color' => '#f59e0b',
                'is_active' => true,
            ],
            [
                'name' => 'Night',
                'start_time' => '01:00',
                'end_time' => '09:00',
                'break_duration_minutes' => 60,
                'overtime_limit_minutes' => null,
                'color' => '#10b981',
                'is_active' => true,
            ],
        ];

        foreach ($shifts as $shift) {
            Shift::updateOrCreate(
                ['name' => $shift['name']],
                $shift
            );
        }
    }
}
