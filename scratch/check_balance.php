<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Account;
use Illuminate\Support\Facades\DB;

$a = Account::find(8);
$p = $a->purchases()->sum('net_total');
$pm = $a->partyPayments()->where('type', 'PAYMENT')->where(function($q) {
    $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
})->sum(DB::raw('amount + discount'));

$pr = $a->partyPayments()->where('type', 'RECEIPT')->where(function($q) {
    $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
})->sum(DB::raw('amount + discount'));

$returns = $a->purchaseReturns()->sum('net_total');

echo "Account: " . $a->title . "\n";
echo "Opening: " . $a->opening_balance . "\n";
echo "Purchases: " . $p . "\n";
echo "Returns: " . $returns . "\n";
echo "Payments: " . $pm . "\n";
echo "Receipts: " . $pr . "\n";
echo "Calculated Balance (O+P+R-Ret-PM): " . ($a->opening_balance + $p + $pr - $returns - $pm) . "\n";
echo "Model Balance: " . $a->current_balance . "\n";
