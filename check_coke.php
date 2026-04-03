<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$coke = App\Models\Items::find(3);
echo "\nPACKING_QTY: " . json_encode($coke->packing_qty);
echo "\nPACKING_FULL: " . json_encode($coke->packing_full) . "\n";
