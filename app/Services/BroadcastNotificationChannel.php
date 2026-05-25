<?php

namespace App\Services;

use App\Models\User;
use App\Events\RealtimeNotificationEvent;
use Illuminate\Support\Str;

class BroadcastNotificationChannel implements NotificationChannelInterface
{
    /**
     * Dispatch the notification as a real-time WebSocket broadcast.
     *
     * @param User $recipient
     * @param array $payload
     * @return void
     */
    public function dispatch(User $recipient, array $payload): void
    {
        // Broadcast the real-time event to the recipient's private channel
        broadcast(new RealtimeNotificationEvent($recipient->id, [
            'id' => $payload['id'] ?? Str::uuid()->toString(),
            'title' => $payload['title'] ?? 'System Notification',
            'message' => $payload['message'] ?? '',
            'actionUrl' => $payload['action_url'] ?? null,
            'category' => $payload['category'] ?? 'general',
            'priority' => $payload['priority'] ?? 'medium',
            'read' => false,
            'createdAt' => now()->toIso8601String(),
        ]));
    }
}
