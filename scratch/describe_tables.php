<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    foreach (['payments', 'sales', 'sales_returns', 'purchase_returns', 'firms', 'salesmen', 'areas', 'subareas'] as $table) {
        echo "=== TABLE: $table ===\n";
        try {
            $cols = DB::select("DESCRIBE `$table`");
            foreach ($cols as $c) {
                echo "  {$c->Field} - {$c->Type}\n";
            }
        } catch (\Exception $e) {
            echo "  Error: " . $e->getMessage() . "\n";
        }
        echo "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
