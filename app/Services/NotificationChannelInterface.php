<?php

namespace App\Services;

use App\Models\User;

interface NotificationChannelInterface
{
    /**
     * Dispatch the notification to the recipient.
     *
     * @param User $recipient
     * @param array $payload
     * @return void
     */
    public function dispatch(User $recipient, array $payload): void;
}
