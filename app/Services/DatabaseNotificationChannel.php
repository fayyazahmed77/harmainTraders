<?php

namespace App\Services;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Str;

class DatabaseNotificationChannel implements NotificationChannelInterface
{
    /**
     * Dispatch the notification and store it in the database.
     *
     * @param User $recipient
     * @param array $payload
     * @return void
     */
    public function dispatch(User $recipient, array $payload): void
    {
        Notification::create([
            'id' => Str::orderedUuid()->toString(),
            'type' => $payload['type'] ?? 'App\Notifications\AccessRequestNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $recipient->id,
            'data' => [
                'title' => $payload['title'] ?? 'System Notification',
                'message' => $payload['message'] ?? '',
                'action_url' => $payload['action_url'] ?? null,
            ],
            'priority' => $payload['priority'] ?? 'medium',
            'category' => $payload['category'] ?? 'general',
            'group_key' => $payload['group_key'] ?? null,
            'expires_at' => isset($payload['expires_at']) ? now()->parse($payload['expires_at']) : null,
            'read_at' => null,
        ]);
    }
}
