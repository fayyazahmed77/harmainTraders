<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Services\AccessRequestService;
use App\Services\ComplianceAuditService;
use App\Models\AccessRequest;
use App\Models\AuditLedger;

$user = User::first();
if (!$user) {
    echo "ERROR: No user found in database. Please run database seeds first.\n";
    exit(1);
}

echo "---------------------------------------------------------\n";
echo "ANTIGRAVITY SYSTEM: INTEGRATION VERIFICATION - PHASE 2\n";
echo "---------------------------------------------------------\n\n";

// ---------------------------------------------------------
// 1. COMPLIANCE AUDIT LEDGER CRYPTO TEST
// ---------------------------------------------------------
echo "1. Testing ComplianceAuditService...\n";
$auditService = app(ComplianceAuditService::class);

// Ensure a target model exists
$testRequest = AccessRequest::first();
if (!$testRequest) {
    $testRequest = new AccessRequest([
        'user_id'       => $user->id,
        'resource_type' => 'test.baseline',
        'action_type'   => 'read',
        'justification' => 'Baseline test entry.',
        'ip_address'    => '127.0.0.1',
        'user_agent'    => 'CLI-Verifier',
    ]);
    $testRequest->save();
}

// Clean only previous test runs
AuditLedger::where('action', 'verifier.test.action')->delete();

// Snapshot the ID of the globally last entry BEFORE writing our first test entry
$priorLastId = AuditLedger::orderBy('id', 'desc')->value('id');
$priorHash   = $priorLastId
    ? AuditLedger::find($priorLastId)->checksum
    : str_repeat('0', 64);

echo "  - Writing first chained audit ledger entry...\n";
$auditService->log(
    'verifier.test.action',
    $testRequest,
    ['state' => 'old_state'],
    ['state' => 'new_state'],
    $user
);

// Capture the entry we just wrote (the newest by id)
$log1 = AuditLedger::orderBy('id', 'desc')->first();

if (!$log1) {
    echo "  - FAILURE: Log 1 not found after creation!\n";
    exit(1);
}
echo "  - Log 1 created! Checksum: " . $log1->checksum . "\n";

// Verify log1's own hash is correct
$ipAddress = $log1->ip_address;
$userAgent = $log1->user_agent;

$log1ExpectedPayload = json_encode([
    'action'         => 'verifier.test.action',
    'auditable_type' => $log1->auditable_type,
    'auditable_id'   => $log1->auditable_id,
    'old_state'      => ['state' => 'old_state'],
    'new_state'      => ['state' => 'new_state'],
    'user_id'        => $user->id,
    'ip_address'     => $ipAddress,
    'user_agent'     => $userAgent,
    'previous_hash'  => $priorHash,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

$log1ExpectedChecksum = hash_hmac('sha256', $log1ExpectedPayload, config('app.key'));
if ($log1->checksum !== $log1ExpectedChecksum) {
    echo "  - FAILURE: Log 1 self-verification failed!\n";
    echo "    Expected: " . $log1ExpectedChecksum . "\n";
    echo "    Actual:   " . $log1->checksum . "\n";
    exit(1);
}
echo "  - Log 1 self-verification PASSED!\n";

echo "  - Writing second chained audit ledger entry...\n";
$auditService->log(
    'verifier.test.action',
    $testRequest,
    ['state' => 'new_state'],
    ['state' => 'final_state'],
    $user
);

$log2 = AuditLedger::orderBy('id', 'desc')->first();

echo "\n2. Validating Cryptographic Chain Continuity (Log1 -> Log2)...\n";
echo "  - Log 1 checksum (previous): " . $log1->checksum . "\n";
echo "  - Log 2 checksum (current):  " . $log2->checksum . "\n";

// Re-compute what log2's hash SHOULD be using log1's checksum as previous_hash
$log2ExpectedPayload = json_encode([
    'action'         => 'verifier.test.action',
    'auditable_type' => $log2->auditable_type,
    'auditable_id'   => $log2->auditable_id,
    'old_state'      => ['state' => 'new_state'],
    'new_state'      => ['state' => 'final_state'],
    'user_id'        => $user->id,
    'ip_address'     => $log2->ip_address,
    'user_agent'     => $log2->user_agent,
    'previous_hash'  => $log1->checksum,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

$log2ExpectedChecksum = hash_hmac('sha256', $log2ExpectedPayload, config('app.key'));

if ($log2->checksum === $log2ExpectedChecksum) {
    echo "  - SUCCESS: Cryptographic chain PASSED — Log2 correctly references Log1!\n";
} else {
    echo "  - FAILURE: Hash chain broken!\n";
    echo "    Expected: " . $log2ExpectedChecksum . "\n";
    echo "    Actual:   " . $log2->checksum . "\n";
    exit(1);
}

// ---------------------------------------------------------
// 2. ACCESS REQUEST FLOW STATE MACHINE TEST
// ---------------------------------------------------------
echo "\n3. Testing AccessRequestService Submission Flow...\n";
$requestService = app(AccessRequestService::class);

$newRequest = $requestService->createRequest([
    'resource_type' => 'financial.ledgers',
    'action_type'   => 'approve-large-disbursement',
    'justification' => 'Need authorization for Harnain warehouse ledger allocations.',
], $user);

echo "  - Created Request UUID: " . $newRequest->id . "\n";
echo "  - Initial Status:       " . $newRequest->status . " (Step: " . $newRequest->current_step . ")\n";

echo "\n4. Verifying Workflow State Machine Transitions...\n";

// Transition 1: pending -> more_info_requested
echo "  - Requesting more info...\n";
$requestService->requestMoreInfo($newRequest->id, 'Provide department voucher scope.', $user->id);
$newRequest->refresh();
echo "    -> " . $newRequest->status . " (Step " . $newRequest->current_step . ") OK\n";

// Transition 2: more_info_requested -> approved
echo "  - Approving request...\n";
$requestService->approveRequest($newRequest->id, $user->id);
$newRequest->refresh();
echo "    -> " . $newRequest->status . " (Step " . $newRequest->current_step . ") OK\n";

// Transition 3: approved -> rejected (should throw, terminal state)
echo "  - Testing illegal terminal state transition protection...\n";
try {
    $requestService->rejectRequest($newRequest->id, 'Rejecting anyway', $user->id);
    echo "    ERROR: Invalid transition was NOT blocked!\n";
    exit(1);
} catch (\InvalidArgumentException $e) {
    echo "    SUCCESS: Blocked correctly — " . $e->getMessage() . "\n";
}

// ---------------------------------------------------------
// 3. TRANSITION HISTORY SIGNATURE VERIFICATION
// ---------------------------------------------------------
echo "\n5. Verifying HMAC Signatures on transition history logs...\n";
$histories = $newRequest->histories()->orderBy('step_number', 'asc')->get();

foreach ($histories as $hist) {
    echo "  - Step {$hist->step_number}: {$hist->previous_status} -> {$hist->new_status}\n";

    $sigPayload = json_encode([
        'access_request_id' => $newRequest->id,
        'actor_id'          => $hist->actor_id,
        'previous_status'   => $hist->previous_status,
        'new_status'        => $hist->new_status,
        'step_number'       => $hist->step_number,
        'action_notes'      => $hist->action_notes,
        'ip_address'        => $hist->ip_address,
        'user_agent'        => $hist->user_agent,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    $expectedSig = hash_hmac('sha256', $sigPayload, config('app.key'));

    if ($hist->signature === $expectedSig) {
        echo "    Signature: VALID\n";
    } else {
        echo "    Signature: INVALID!\n";
        echo "    Expected: " . $expectedSig . "\n";
        echo "    Actual:   " . $hist->signature . "\n";
        exit(1);
    }
}

echo "\n=========================================================\n";
echo "PHASE 2 VERIFICATION COMPLETE: ALL ASSERTIONS PASSED!\n";
echo "=========================================================\n";
