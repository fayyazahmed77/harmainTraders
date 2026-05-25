<?php

namespace App\Listeners;

use App\Events\AccessRequestStatusChanged;
use App\Services\NotificationEngine;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendAccessRequestStatusNotification implements ShouldQueue
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
     * @param AccessRequestStatusChanged $event
     * @return void
     */
    public function handle(AccessRequestStatusChanged $event): void
    {
        $request = $event->accessRequest;
        $recipient = $request->user;

        if (!$recipient) {
            return;
        }

        $statusLabel = match ($request->status) {
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'more_info_requested' => 'Clarification Requested',
            default => ucfirst($request->status),
        };

        $priority = match ($request->status) {
            'approved' => 'high',
            'rejected' => 'critical',
            'more_info_requested' => 'medium',
            default => 'medium',
        };

        // Prepare the notification payload for the user
        $payload = [
            'type' => 'App\Notifications\AccessRequestStatusNotification',
            'title' => "Access Request {$statusLabel}",
            'message' => "Your request for {$request->action_type} access to {$request->resource_type} has been {$request->status}.",
            'category' => 'workflow',
            'priority' => $priority,
            'action_url' => '/notifications', // Directs to user's notifications center
        ];

        app(NotificationEngine::class)->send($recipient, $payload);
    }
}
