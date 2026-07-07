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
        DB::table('accounts')
            ->where('title', '')
            ->update(['title' => null]);

        // 2. Find and de-duplicate duplicate account titles
        $duplicates = DB::table('accounts')
            ->select('title', DB::raw('count(*) as count'))
            ->groupBy('title')
            ->having('count', '>', 1)
            ->whereNotNull('title')
            ->where('title', '!=', '')
            ->get();

        foreach ($duplicates as $duplicate) {
            $accounts = DB::table('accounts')
                ->where('title', $duplicate->title)
                ->orderBy('id')
                ->get();

            foreach ($accounts as $account) {
                $suffix = $account->code ? " ({$account->code})" : " (#{$account->id})";
                $newTitle = $account->title . $suffix;

                DB::table('accounts')
                    ->where('id', $account->id)
                    ->update(['title' => $newTitle]);
            }
        }

        // 3. Add the unique constraint
        Schema::table('accounts', function (Blueprint $table) {
            $table->unique('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropUnique(['title']);
        });
    }
};
