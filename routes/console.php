<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\DB;

Artisan::command('app:reset-tables {--force : Force without prompt}', function () {
    $force = $this->option('force');

    if (!$force && !$this->confirm('Are you sure you want to reset records to 0 for Area, Sub Area, Item Category, Msg Line, Staff (salemen), and Country?', false)) {
        $this->warn('Operation cancelled.');
        return 0;
    }

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    // 1) Area
    DB::table('areas')->truncate();
    $this->info('[1/6] Cleared: areas (Area)');

    // 2) Sub Area
    DB::table('subareas')->truncate();
    $this->info('[2/6] Cleared: subareas (Sub Area)');

    // 3) Item Category
    DB::table('item_categories')->truncate();
    $this->info('[3/6] Cleared: item_categories (Item Category)');

    // 4) Msg Line
    DB::table('message_lines')->truncate();
    $this->info('[4/6] Cleared: message_lines (Msg Line)');

    // 5) Staff (Salesmen - users table is EXCLUDED)
    DB::table('salemen')->truncate();
    $this->info('[5/6] Cleared: salemen (Staff / Salesmen)');

    // 6) Country ("County")
    DB::table('countries')->truncate();
    $this->info('[6/6] Cleared: countries (Country)');

    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    $this->newLine();
    $this->info('SUCCESS: All 6 tables have been reset to 0 records! (users table remained untouched)');
    return 0;
})->purpose('Reset records to 0 for Area, Sub Area, Item Category, Msg Line, Staff (salemen), and Country tables (users table excluded)');

Schedule::command('app:check-sla-breaches')->hourly();
