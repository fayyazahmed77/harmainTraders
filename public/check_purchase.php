<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$purchase = App\Models\Purchase::with('items')->latest()->first();
echo "PURCHASE ID: " . $purchase->id . "\n";
foreach($purchase->items as $item) {
    echo "Item ID: {$item->item_id} | Carton: {$item->qty_carton} | PCS: {$item->qty_pcs} | TOTAL_PCS: {$item->total_pcs}\n";
}

$coke = App\Models\Items::find(3);
echo "\nCOKE STOCK: {$coke->stock_1} Full, {$coke->stock_2} Pcs | Total PCS: {$coke->total_stock_pcs}\n";
