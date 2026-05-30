<?php

namespace App\Listeners;

use App\Events\AccessRequestCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class StoreNotifications implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the queue the job should be sent to.
     *
     * @var string|null
     */
    public $queue = 'notifications';

    /**
     * Handle the event.
     *
     * @param AccessRequestCreated $event
     * @return void
     */
    public function handle(AccessRequestCreated $event): void
    {
        $request = $event->accessRequest;
        $requesterName = $request->user->name ?? 'A user';

        // Prepare the notification payload
        $payload = [
            'type' => 'App\Notifications\AccessRequestNotification',
            'title' => 'New Access Request',
            'message' => "{$requesterName} has requested {$request->action_type} access to {$request->resource_type}.",
            'category' => 'workflow',
            'priority' => 'high',
            'action_url' => '/admin/access-requests',
        ];

        // Fetch all administrator users safely by checking existing roles first
        $existingRoles = Role::pluck('name')->toArray();
        $adminRoles = array_intersect(['Admin', 'Super Admin'], $existingRoles);
        $admins = !empty($adminRoles) ? \App\Models\User::role($adminRoles)->get() : collect();

        // If no roles are defined (e.g. in test envs), notify all users as a fallback
        if ($admins->isEmpty()) {
            $admins = \App\Models\User::all();
        }

        $notificationEngine = app(\App\Services\NotificationEngine::class);

        foreach ($admins as $admin) {
            $notificationEngine->send($admin, $payload);
        }
    }
}
