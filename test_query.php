<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$start = microtime(true);
try {
    $result = DB::table('purchase_items')
        ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
        ->join('items', 'purchase_items.item_id', '=', 'items.id')
        ->leftJoin('accounts', 'purchases.supplier_id', '=', 'accounts.id')
        ->where('purchase_items.item_id', 2)
        ->orderBy('purchases.created_at', 'desc')
        ->select('purchase_items.id as pi_id', 'purchases.id as p_id')
        ->first();
    
    echo "Query Time: " . (microtime(true) - $start) . "s\n";
    print_r($result);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
