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
        // 1. Convert empty string titles to null (since MySQL allows multiple NULLs in unique keys but not empty strings)
        DB::table('items')
            ->where('title', '')
            ->update(['title' => null]);

        // 2. Find and de-duplicate duplicate item titles
        $duplicates = DB::table('items')
            ->select('title', DB::raw('count(*) as count'))
            ->groupBy('title')
            ->having('count', '>', 1)
            ->whereNotNull('title')
            ->where('title', '!=', '')
            ->get();

        foreach ($duplicates as $duplicate) {
            $items = DB::table('items')
                ->where('title', $duplicate->title)
                ->orderBy('id')
                ->get();

            foreach ($items as $item) {
                $suffix = $item->code ? " ({$item->code} - #{$item->id})" : " (#{$item->id})";
                $newTitle = $item->title . $suffix;

                DB::table('items')
                    ->where('id', $item->id)
                    ->update(['title' => $newTitle]);
            }
        }

        // 3. Add the unique constraint
        Schema::table('items', function (Blueprint $table) {
            $table->unique('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropUnique(['title']);
        });
    }
};
