<?php

namespace App\Listeners;

use App\Events\GuestOrderPlaced;
use App\Services\NotificationEngine;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendGuestOrderPlacedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * @var string
     */
    public string $queue = 'notifications';

    /**
     * Handle the event.
     *
     * @param GuestOrderPlaced $event
     * @return void
     */
    public function handle(GuestOrderPlaced $event): void
    {
        $sale = $event->sale;

        // Prepare payload
        $payload = [
            'type' => 'App\Notifications\GuestOrderPlacedNotification',
            'title' => 'New Guest Order',
            'message' => "A new guest order has been placed (Invoice: {$sale->invoice}) for Rs " . number_format($sale->net_total) . ".",
            'category' => 'sales',
            'priority' => 'high',
            'action_url' => '/sales', // Links to sales dashboard
        ];

        // Fetch administrators
        $existingRoles = \Spatie\Permission\Models\Role::pluck('name')->toArray();
        $adminRoles = array_intersect(['Admin', 'Super Admin'], $existingRoles);
        $admins = !empty($adminRoles) ? \App\Models\User::role($adminRoles)->get() : collect();

        if ($admins->isEmpty()) {
            $admins = \App\Models\User::all();
        }

        $notificationEngine = app(NotificationEngine::class);
        foreach ($admins as $admin) {
            $notificationEngine->send($admin, $payload);
        }
    }
}
