<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Payment;
use App\Models\Account;

$date = '2026-04-17';
$bank = Account::where('title', 'like', '%Alfalah%')->first();

if (!$bank) {
    echo "Bank Alfalah not found.\n";
    exit;
}

echo "Bank Alfalah ID: " . $bank->id . " (Type: " . $bank->type . ")\n";

$payments = Payment::where('account_id', $bank->id)
    ->whereDate('date', $date)
    ->get();

echo "Found " . $payments->count() . " payments for $date.\n";

foreach ($payments as $p) {
    echo "ID: " . $p->id . " | Type: " . $p->type . " | Amount: " . $p->amount . " | Date: " . $p->date . " | Status: " . $p->status . "\n";
}

// Also check all payments for that date to see if it's under a different account
echo "\nAll Payments on $date:\n";
$allPayments = Payment::whereDate('date', $date)->get();
foreach ($allPayments as $p) {
    $acc = Account::find($p->account_id);
    echo "ID: " . $p->id . " | Acc: " . ($acc->title ?? 'N/A') . " (ID: " . $p->account_id . ") | Type: " . $p->type . " | Amount: " . $p->amount . "\n";
}
