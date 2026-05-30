<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        \App\Events\AccessRequestCreated::class => [
            \App\Listeners\StoreNotifications::class,
            \App\Listeners\WriteAuditLedger::class,
            \App\Listeners\SendAdminApprovalEmail::class,
        ],
        \App\Events\AccessRequestStatusChanged::class => [
            \App\Listeners\SendAccessRequestStatusNotification::class,
            \App\Listeners\SendAccessRequestStatusEmail::class,
        ],
        \App\Events\GuestOrderPlaced::class => [
            \App\Listeners\SendGuestOrderPlacedNotification::class,
            \App\Listeners\SendGuestOrderPlacedEmail::class,
        ],
        \App\Events\LowStockAlert::class => [
            \App\Listeners\SendLowStockAlertNotification::class,
        ],
        \App\Events\PaymentConfirmed::class => [
            \App\Listeners\SendPaymentConfirmedNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
