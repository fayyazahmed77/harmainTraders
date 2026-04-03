<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sales = \App\Models\Sales::where('customer_id', 9)->sum('net_total');
$receipts = \App\Models\Payment::where('account_id', 9)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled')->sum('amount');
$payments = \App\Models\Payment::where('account_id', 9)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled')->sum('amount');
$returns = \App\Models\SalesReturn::where('customer_id', 9)->sum('net_total');

$salesData = \App\Models\Sales::where('customer_id', 9)->get(['invoice', 'net_total', 'paid_amount', 'remaining_amount', 'status']);
$paymentData = \App\Models\Payment::where('account_id', 9)->get(['voucher_no', 'amount', 'type', 'cheque_status', 'payment_method']);
$returnData = \App\Models\SalesReturn::where('customer_id', 9)->get(['invoice', 'net_total']);

echo json_encode([
    'sales' => $sales,
    'receipts' => $receipts,
    'payments' => $payments,
    'returns' => $returns,
    'salesData' => $salesData,
    'paymentData' => $paymentData,
    'returnData' => $returnData
]);
