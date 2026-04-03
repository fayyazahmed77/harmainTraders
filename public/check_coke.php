<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$coke = App\Models\Items::find(3);
echo json_encode([
    'packing_qty' => $coke->packing_qty, 
    'packing_full' => $coke->packing_full
]);
