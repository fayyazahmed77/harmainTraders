<?php

namespace App\Services;

use App\Models\User;
use App\Models\NotificationPreference;
use App\Models\SiteSetting;
use Illuminate\Support\Str;

class NotificationEngine
{
    /**
     * The map of channel names to their implementing classes.
     *
     * @var array<string, string>
     */
    protected array $channelMap = [
        'database'  => DatabaseNotificationChannel::class,
        'broadcast' => BroadcastNotificationChannel::class,
        'sms'       => SmsNotificationChannel::class,
    ];

    /**
     * Dispatch a notification to a recipient user.
     *
     * @param User $recipient
     * @param array $payload The notification attributes (title, message, category, priority, action_url, etc.)
     * @return void
     */
    public function send(User $recipient, array $payload): void
    {
        $category = $payload['category'] ?? 'general';

        // 1. Fetch user notification preferences for the category
        $preference = NotificationPreference::where('user_id', $recipient->id)
            ->where('category', $category)
            ->first();

        // 2. Check if the user has muted this category
        if ($preference && $preference->is_muted) {
            return;
        }

        // 3. Determine delivery channels (fallback to site settings or default database + broadcast)
        if ($preference) {
            $channels = $preference->channels;
        } else {
            $settings = SiteSetting::get();
            $globalSettings = $settings->notification_settings;
            $channels = $globalSettings[$category] ?? ['database', 'broadcast'];
        }

        // Assign a common unique notification ID if not provided
        if (!isset($payload['id'])) {
            $payload['id'] = Str::uuid()->toString();
        }

        // 4. Dispatch the payload through each configured channel
        foreach ($channels as $channelName) {
            if (isset($this->channelMap[$channelName])) {
                $channelClass = $this->channelMap[$channelName];
                app($channelClass)->dispatch($recipient, $payload);
            }
        }
    }
}
