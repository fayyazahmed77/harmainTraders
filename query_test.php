<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

foreach (\App\Models\Payment::where('account_id', 113)->get() as $p) {
    echo "Payment ID: " . $p->id . ", Amount: " . $p->amount . ", Discount: " . $p->discount . "\n";
}
