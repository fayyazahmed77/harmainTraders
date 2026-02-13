<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $coordinates = [
            'Sindh' => ['lat' => 25.8943, 'lon' => 68.5247],
            'Punjab' => ['lat' => 31.1704, 'lon' => 72.7097],
            'Balochistan' => ['lat' => 28.4907, 'lon' => 65.0958],
            'Khyber Pakhtunkhwa' => ['lat' => 34.0151, 'lon' => 71.5249],
            'Gilgit-Baltistan' => ['lat' => 35.8026, 'lon' => 74.9832],
            'Azad Jammu and Kashmir' => ['lat' => 33.9256, 'lon' => 73.7478],
            'Islamabad' => ['lat' => 33.6844, 'lon' => 73.0479],
        ];

        foreach ($coordinates as $name => $coords) {
            DB::table('provinces')
                ->where('name', 'like', '%' . $name . '%')
                ->update([
                    'latitude' => $coords['lat'],
                    'longitude' => $coords['lon'],
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('provinces')->update(['latitude' => null, 'longitude' => null]);
    }
};
