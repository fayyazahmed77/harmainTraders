<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$columns = Schema::getColumnListing('payments');
echo "Payments Table Columns:\n";
print_r($columns);

$payment = DB::table('payments')->where('id', 100)->first();
echo "\nPayment ID 100 details:\n";
print_r($payment);
