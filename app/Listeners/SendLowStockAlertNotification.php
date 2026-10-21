<?php

namespace App\Listeners;

use App\Events\LowStockAlert;
use App\Mail\LowStockAlertMail;
use App\Services\NotificationEngine;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendLowStockAlertNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * @var string
     */
    public string $queue = 'notifications';

    /**
     * Handle the event.
     *
     * @param LowStockAlert $event
     * @return void
     */
    public function handle(LowStockAlert $event): void
    {
        // 1. Guard against alerts if disabled via config/env
        if (!config('services.alerts.low_stock', env('ENABLE_LOW_STOCK_ALERTS', false))) {
            return;
        }

        $item = $event->item;
        if (!$item) {
            return;
        }

        // 2. Guard against 0 or negative reorder_level
        if (($item->reorder_level ?? 0) <= 0) {
            return;
        }

        // 3. 24-hour rate limit/cooldown per item to prevent queue flooding
        $cacheKey = "low_stock_alert_item_{$item->id}";
        if (!\Illuminate\Support\Facades\Cache::add($cacheKey, true, now()->addHours(24))) {
            return;
        }

        // 4. Prepare payload for Pusher/DB notification
        $payload = [
            'type' => 'App\Notifications\LowStockAlertNotification',
            'title' => 'Low Stock Warning',
            'message' => "Stock for '{$item->title}' is below minimum. Current: {$item->total_stock_pcs} pcs.",
            'category' => 'inventory',
            'priority' => 'critical',
            'action_url' => '/items/' . $item->id . '/show',
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
            // Send Pusher/DB Notification
            $notificationEngine->send($admin, $payload);

            // Send Email Alert
            if ($admin->email) {
                Mail::to($admin->email)->send(new LowStockAlertMail($item));
            }
        }
    }
}
