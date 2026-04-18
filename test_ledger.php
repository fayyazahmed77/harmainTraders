<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

try {
    $builder = app(App\Services\ReportBuilder::class);
    $res = $builder->accountLedger(3, '2026-03-16', '2026-04-16');
    echo 'SUCCESS! Count: ' . count($res['data']);
} catch(Exception $e) {
    echo 'ERROR: ' . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
