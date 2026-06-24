<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SalesReturnItem;
use App\Models\SalesItem;
use Illuminate\Support\Facades\DB;

echo "=== Return Items for Sales Return ID 23 ===" . PHP_EOL;
// Fix total_pcs for RET-000023 manually first
SalesReturnItem::where('sales_return_id', 23)->where('item_id', 2)->update(['total_pcs' => 18]);

$retItems = SalesReturnItem::where('sales_return_id', 23)->get();
foreach ($retItems as $ri) {
    echo "  Item ID:{$ri->item_id} | qty_carton:{$ri->qty_carton} | qty_pcs:{$ri->qty_pcs} | total_pcs:{$ri->total_pcs} | bonus_qty_carton:{$ri->bonus_qty_carton} | bonus_qty_pcs:{$ri->bonus_qty_pcs}" . PHP_EOL;
}

echo PHP_EOL . "=== Sale Items for Sale ID 152 ===" . PHP_EOL;
$saleItems = SalesItem::where('sale_id', 152)->get();
foreach ($saleItems as $si) {
    echo "  Item ID:{$si->item_id} | total_pcs:{$si->total_pcs}" . PHP_EOL;
}

echo PHP_EOL . "=== Items Table check for ID 2 & 90 ===" . PHP_EOL;
$dbItems = DB::select("SELECT id, title, packing_qty, packing_full, trade_price FROM items WHERE id IN (2, 90)");
foreach ($dbItems as $i) {
    echo "  Item ID:{$i->id} | title:{$i->title} | packing_qty:{$i->packing_qty} | packing_full:{$i->packing_full} | trade_price:{$i->trade_price}" . PHP_EOL;
}
