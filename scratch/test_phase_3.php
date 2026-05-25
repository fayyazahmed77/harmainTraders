<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\AccessRequest;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Services\NotificationEngine;
use App\Policies\AccessRequestPolicy;
use App\Http\Controllers\SignedApprovalController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

$user = User::first();
if (!$user) {
    echo "ERROR: No user found in database. Please run database seeds first.\n";
    exit(1);
}

// Make sure user has Admin/Super Admin role for policy test or we'll mock role checks
if (!$user->hasRole('Admin') && !$user->hasRole('Super Admin')) {
    $user->assignRole('Admin');
}

echo "---------------------------------------------------------\n";
echo "ANTIGRAVITY SYSTEM: INTEGRATION VERIFICATION - PHASE 3\n";
echo "---------------------------------------------------------\n\n";

// ---------------------------------------------------------
// 1. ROUTE REGISTER CHECK
// ---------------------------------------------------------
echo "1. Checking Registered Routing Table...\n";
$targetRoutes = [
    'access-requests.store',
    'access-requests.pending',
    'access-requests.approve',
    'access-requests.reject',
    'access-requests.request-info',
    'notifications.center',
    'notifications.index',
    'notifications.read',
    'notifications.read-all',
    'signed.approve',
    'signed.reject',
];

foreach ($targetRoutes as $routeName) {
    if (Route::has($routeName)) {
        echo "  - Route '{$routeName}' is registered successfully.\n";
    } else {
        echo "  - FAILURE: Route '{$routeName}' is NOT registered!\n";
        exit(1);
    }
}
echo "  - All routes registered! PASSED\n\n";

// ---------------------------------------------------------
// 2. AUTHORIZATION POLICY CHECK
// ---------------------------------------------------------
echo "2. Testing AccessRequestPolicy...\n";
$policy = new AccessRequestPolicy();
$testRequest = AccessRequest::first() ?? AccessRequest::create([
    'user_id' => $user->id,
    'resource_type' => 'test.resource',
    'action_type' => 'write',
    'justification' => 'Integration policy testing.',
    'ip_address' => '127.0.0.1',
    'user_agent' => 'Verifier',
]);

$canViewAny = $policy->viewAny($user);
$canView = $policy->view($user, $testRequest);
$canApprove = $policy->approve($user, $testRequest);

echo "  - Admin canViewAny: " . ($canViewAny ? 'YES' : 'NO') . "\n";
echo "  - Admin canView: " . ($canView ? 'YES' : 'NO') . "\n";
echo "  - Admin canApprove: " . ($canApprove ? 'YES' : 'NO') . "\n";

if ($canViewAny && $canView && $canApprove) {
    echo "  - Policy assertions PASSED\n\n";
} else {
    echo "  - FAILURE: Policy rules did not resolve correctly!\n";
    exit(1);
}

// ---------------------------------------------------------
// 3. DYNAMIC NOTIFICATION ENGINE & CHANNEL PREFERENCES
// ---------------------------------------------------------
echo "3. Testing Dynamic Notification Engine...\n";

// Clean previous notifications
Notification::where('notifiable_id', $user->id)->delete();

// Setup fresh user preferences
NotificationPreference::where('user_id', $user->id)->delete();
NotificationPreference::create([
    'user_id' => $user->id,
    'category' => 'workflow',
    'channels' => ['database'], // Only send database for isolation testing
    'is_muted' => false,
]);

$payload = [
    'title' => 'Test Notification Title',
    'message' => 'Test message body for verification.',
    'category' => 'workflow',
    'priority' => 'critical',
    'action_url' => '/test-url-action',
];

$engine = app(NotificationEngine::class);
$engine->send($user, $payload);

$notification = Notification::where('notifiable_id', $user->id)
    ->where('category', 'workflow')
    ->orderBy('created_at', 'desc')
    ->first();

if ($notification && $notification->data['title'] === 'Test Notification Title' && $notification->priority === 'critical') {
    echo "  - Database notification written successfully.\n";
    echo "  - Notification ID: " . $notification->id . "\n";
    echo "  - Notification Priority: " . $notification->priority . "\n";
    echo "  - Notification Category: " . $notification->category . "\n";
    echo "  - PASSED\n\n";
} else {
    echo "  - FAILURE: Notification was not written or fields do not match!\n";
    exit(1);
}

// ---------------------------------------------------------
// 4. SIGNED URL & REPLAY PREVENTION
// ---------------------------------------------------------
echo "4. Testing Signed URL & Replay Prevention...\n";

$reqForSigned = AccessRequest::create([
    'user_id' => $user->id,
    'resource_type' => 'finance.signed.test',
    'action_type' => 'approve',
    'justification' => 'Signed URL testing verification.',
    'status' => 'pending',
    'ip_address' => '127.0.0.1',
    'user_agent' => 'Verifier',
]);

// 1. Generate standard expirable signed URL
$signedUrl = URL::temporarySignedRoute(
    'signed.approve',
    now()->addHour(),
    ['id' => $reqForSigned->id, 'actor_id' => $user->id]
);

echo "  - Generated Signed URL: " . $signedUrl . "\n";

// 2. Parse URL parameters to simulate Request
$urlParts = parse_url($signedUrl);
parse_str($urlParts['query'] ?? '', $queryParams);

$request = Request::create($signedUrl, 'GET', $queryParams);

// 3. Clear cache and trigger SignedApprovalController
$cacheKey = 'signed_action:' . md5($signedUrl);
Cache::forget($cacheKey);

$controller = app(SignedApprovalController::class);
$response = $controller->approve($request, $reqForSigned->id);

$reqForSigned->refresh();

if ($response->getStatusCode() === 200 && $reqForSigned->status === 'approved') {
    echo "  - First request: Successful. Request status transitioned to: " . $reqForSigned->status . "\n";
} else {
    echo "  - FAILURE: Signed URL transition failed!\n";
    exit(1);
}

// 4. Try replaying the exact same request
echo "  - Replaying signed URL...\n";
$replayResponse = $controller->approve($request, $reqForSigned->id);

if ($replayResponse->getStatusCode() === 409) {
    echo "  - Replay request: Correctly blocked with status 409 (Conflict).\n";
    echo "  - Replay prevention PASSED\n\n";
} else {
    echo "  - FAILURE: Replay attack was NOT blocked! Status returned: " . $replayResponse->getStatusCode() . "\n";
    exit(1);
}

echo "=========================================================\n";
echo "PHASE 3 VERIFICATION COMPLETE: ALL INTEGRATIONS PASSED!\n";
echo "=========================================================\n";
