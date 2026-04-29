<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AccountType;

foreach(AccountType::all() as $t) {
    echo $t->id . ': ' . $t->name . "\n";
}
