<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$schemas = [];
$tables = ['purchase_items', 'purchases', 'items', 'accounts'];

foreach ($tables as $table) {
    try {
        $result = DB::select("SHOW CREATE TABLE $table");
        $stmt = "Create Table";
        $schemas[$table] = $result[0]->$stmt ?? $result[0]->{'Create View'} ?? 'Unknown';
    } catch (\Exception $e) {
        $schemas[$table] = "Error: " . $e->getMessage();
    }
}

file_put_contents(__DIR__ . '/schemas.txt', print_r($schemas, true));
echo "Done.";
