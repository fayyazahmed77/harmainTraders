<?php

use App\Models\User;
use App\Models\Notification;
use App\Models\AccessRequest;
use App\Services\AccessRequestService;
use App\Events\AccessRequestStatusChanged;
use App\Events\RealtimeNotificationEvent;
use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('user notifications relationship returns custom notification model', function () {
    $notification = Notification::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'type' => 'App\Notifications\AccessRequestNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $this->user->id,
        'data' => [
            'title' => 'Test Notification',
            'message' => 'This is a test notification',
        ],
        'priority' => 'medium',
        'category' => 'workflow',
        'read_at' => null,
    ]);

    $userNotifications = $this->user->notifications;

    expect($userNotifications)->not->toBeEmpty();
    expect($userNotifications->first())->toBeInstanceOf(Notification::class);
    expect($userNotifications->first()->id)->toBe($notification->id);
});

test('custom notification model scopes filter notifications correctly', function () {
    // Notification 1: category=workflow, priority=high, expires=null, group=g1
    $n1 = Notification::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'type' => 'App\Notifications\AccessRequestNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $this->user->id,
        'data' => ['title' => 'n1'],
        'priority' => 'high',
        'category' => 'workflow',
        'group_key' => 'g1',
        'expires_at' => null,
        'read_at' => null,
    ]);

    // Notification 2: category=security, priority=low, expires=expired, group=g2
    $n2 = Notification::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'type' => 'App\Notifications\AccessRequestNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $this->user->id,
        'data' => ['title' => 'n2'],
        'priority' => 'low',
        'category' => 'security',
        'group_key' => 'g2',
        'expires_at' => now()->subDay(),
        'read_at' => null,
    ]);

    // Notification 3: category=workflow, priority=critical, expires=future, group=g1
    $n3 = Notification::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'type' => 'App\Notifications\AccessRequestNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $this->user->id,
        'data' => ['title' => 'n3'],
        'priority' => 'critical',
        'category' => 'workflow',
        'group_key' => 'g1',
        'expires_at' => now()->addDay(),
        'read_at' => null,
    ]);

    // Test Category Scope
    $workflowNotifications = Notification::category('workflow')->get();
    expect($workflowNotifications)->toHaveCount(2);
    expect($workflowNotifications->pluck('id'))->toContain($n1->id, $n3->id);

    // Test Priority Scope
    $criticalNotifications = Notification::priority('critical')->get();
    expect($criticalNotifications)->toHaveCount(1);
    expect($criticalNotifications->first()->id)->toBe($n3->id);

    // Test Active (Unexpired) Scope
    $activeNotifications = Notification::active()->get();
    expect($activeNotifications)->toHaveCount(2); // n1 and n3
    expect($activeNotifications->pluck('id'))->toContain($n1->id, $n3->id);

    // Test Group Scope
    $groupNotifications = Notification::byGroup('g1')->get();
    expect($groupNotifications)->toHaveCount(2);
    expect($groupNotifications->pluck('id'))->toContain($n1->id, $n3->id);
});

test('access request status transition dispatches status changed event', function () {
    Event::fake([AccessRequestStatusChanged::class]);

    // Create a pending access request
    $request = AccessRequest::create([
        'user_id' => $this->user->id,
        'resource_type' => 'finance',
        'action_type' => 'view',
        'justification' => 'Need to view financial report',
        'status' => 'pending',
        'current_step' => 1,
        'sla_due_at' => now()->addHours(24),
        'ip_address' => '127.0.0.1',
        'user_agent' => 'PHPUnit',
    ]);

    $service = new AccessRequestService();
    $service->approveRequest($request->id, $this->user->id);

    Event::assertDispatched(AccessRequestStatusChanged::class, function ($event) use ($request) {
        return $event->accessRequest->id === $request->id && $event->previousStatus === 'pending';
    });
});

test('access request status changed listener triggers notification delivery', function () {
    Event::fake([RealtimeNotificationEvent::class]);

    // Create a pending access request
    $request = AccessRequest::create([
        'user_id' => $this->user->id,
        'resource_type' => 'finance',
        'action_type' => 'view',
        'justification' => 'Need to view financial report',
        'status' => 'pending',
        'current_step' => 1,
        'sla_due_at' => now()->addHours(24),
        'ip_address' => '127.0.0.1',
        'user_agent' => 'PHPUnit',
    ]);

    // Count existing notifications for this user
    $initialCount = $this->user->notifications()->count();

    $service = new AccessRequestService();
    $service->approveRequest($request->id, $this->user->id);

    // Ensure notification was written to database (via DatabaseNotificationChannel triggered by listener)
    $newCount = $this->user->notifications()->count();
    expect($newCount)->toBe($initialCount + 1);

    $notification = $this->user->notifications()->first();
    expect($notification->category)->toBe('workflow');
    expect($notification->priority)->toBe('high');
    expect($notification->data['title'])->toContain('Access Request Approved');

    // Also assert that the broadcast event was dispatched
    Event::assertDispatched(RealtimeNotificationEvent::class);
});
