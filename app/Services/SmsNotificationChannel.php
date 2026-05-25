<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class SmsNotificationChannel implements NotificationChannelInterface
{
    /**
     * Dispatch the notification as a stubbed SMS log entry.
     *
     * @param User $recipient
     * @param array $payload
     * @return void
     */
    public function dispatch(User $recipient, array $payload): void
    {
        // Log the dispatch (simulate Twilio API request)
        Log::info("SMS dispatch stub triggered", [
            'recipient_phone' => $recipient->phone ?? 'no-phone',
            'recipient_id' => $recipient->id,
            'title' => $payload['title'] ?? 'System Alert',
            'message' => $payload['message'] ?? '',
        ]);
    }
}
