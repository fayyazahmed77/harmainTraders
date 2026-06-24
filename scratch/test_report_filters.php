<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\ReportBuilder;
use App\Models\Account;
use App\Models\Firm;
use App\Models\Saleman;
use App\Models\Areas;
use App\Models\Subarea;
use App\Models\AccountType;
use App\Models\AccountCategory;

echo "---------------------------------------------------------\n";
echo "REPORT FILTERS INTEGRATION TEST\n";
echo "---------------------------------------------------------\n\n";

$reportBuilder = app(ReportBuilder::class);

// Find some realistic entity IDs or use default 'ALL'
$account = Account::first();
$accountId = $account ? $account->id : 'ALL';
$firm = Firm::first();
$firmId = $firm ? $firm->id : 'ALL';
$saleman = Saleman::first();
$salemanId = $saleman ? $saleman->id : 'ALL';
$area = Areas::first();
$areaId = $area ? $area->id : 'ALL';
$subarea = Subarea::first();
$subareaId = $subarea ? $subarea->id : 'ALL';
$accType = AccountType::first();
$type = $accType ? $accType->id : 'ALL';
$category = AccountCategory::first();
$noteHead = $category ? $category->name : 'ALL'; // Wait, let's look at noteHead options

echo "Testing with Account ID: $accountId\n";
echo "Testing with Firm ID: $firmId\n";
echo "Testing with Salesman ID: $salemanId\n";
echo "Testing with Area ID: $areaId\n";
echo "Testing with Sub-Area ID: $subareaId\n";
echo "Testing with Type ID: $type\n";
echo "Testing with Category/Note Head: $noteHead\n\n";

$filters = [
    'firmId' => $firmId,
    'salemanId' => $salemanId,
    'areaId' => $areaId,
    'subareaId' => $subareaId,
    'type' => $type,
    'noteHead' => $noteHead,
    'nature' => $noteHead,
    'contraId' => 'ALL',
    'remarks' => 'test',
    'sortBy' => 'ID'
];

try {
    echo "1. Testing accountLedger...\n";
    if ($accountId !== 'ALL') {
        $ledger = $reportBuilder->accountLedger($accountId, date('Y-m-d', strtotime('-30 days')), date('Y-m-d'), 50, $filters);
        echo "   - PASSED (Ledger row count: " . count($ledger['data']) . ")\n";
    } else {
        echo "   - SKIPPED (No Account in DB)\n";
    }
} catch (\Exception $e) {
    echo "   - FAILURE in accountLedger: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

try {
    echo "2. Testing accountDetailLedger...\n";
    if ($accountId !== 'ALL') {
        $detailLedger = $reportBuilder->accountDetailLedger($accountId, date('Y-m-d', strtotime('-30 days')), date('Y-m-d'), 50, $filters);
        echo "   - PASSED (Detail Ledger row count: " . count($detailLedger['data']) . ")\n";
    } else {
        echo "   - SKIPPED (No Account in DB)\n";
    }
} catch (\Exception $e) {
    echo "   - FAILURE in accountDetailLedger: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

try {
    echo "3. Testing dueBills...\n";
    $dueBills = $reportBuilder->dueBills($accountId, date('Y-m-d'), $filters);
    echo "   - PASSED (Due Bills row count: " . count($dueBills) . ")\n";
} catch (\Exception $e) {
    echo "   - FAILURE in dueBills: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

try {
    echo "4. Testing accountAging...\n";
    $aging = $reportBuilder->accountAging($accountId, date('Y-m-d'), $filters);
    echo "   - PASSED (Aging row count: " . count($aging) . ")\n";
} catch (\Exception $e) {
    echo "   - FAILURE in accountAging: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

try {
    echo "5. Testing receivables...\n";
    $receivables = $reportBuilder->receivables(date('Y-m-d'), $filters);
    echo "   - PASSED (Receivables row count: " . count($receivables) . ")\n";
} catch (\Exception $e) {
    echo "   - FAILURE in receivables: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

try {
    echo "6. Testing payables...\n";
    $payables = $reportBuilder->payables(date('Y-m-d'), $filters);
    echo "   - PASSED (Payables row count: " . count($payables) . ")\n";
} catch (\Exception $e) {
    echo "   - FAILURE in payables: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

try {
    echo "7. Testing trialBalance6Col...\n";
    $tb6 = $reportBuilder->trialBalance6Col(date('Y-m-d', strtotime('-30 days')), date('Y-m-d'), $filters);
    echo "   - PASSED (6-Column Trial Balance row count: " . count($tb6) . ")\n";
} catch (\Exception $e) {
    echo "   - FAILURE in trialBalance6Col: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

try {
    echo "8. Testing paymentDetail...\n";
    $paymentDetail = $reportBuilder->paymentDetail($accountId, date('Y-m-d', strtotime('-30 days')), date('Y-m-d'), $filters);
    echo "   - PASSED (Payment details count: " . count($paymentDetail) . ")\n";
} catch (\Exception $e) {
    echo "   - FAILURE in paymentDetail: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n---------------------------------------------------------\n";
echo "REPORT FILTERS INTEGRATION TEST COMPLETE\n";
echo "---------------------------------------------------------\n";
