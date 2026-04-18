<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$types = DB::table('account_types')->get();
echo "Account Types:\n";
foreach ($types as $t) {
    echo "ID: " . $t->id . " | Name: " . $t->name . "\n";
}

$chequeAccounts = DB::table('accounts')->where('type', 14)->get();
echo "\nAccounts of Type 14 (Cheque):\n";
foreach ($chequeAccounts as $a) {
    echo "ID: " . $a->id . " | Title: " . $a->title . "\n";
}
