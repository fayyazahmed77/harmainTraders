<?php

namespace App\Providers;

use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Event;
use App\Events\AccessRequestCreated;
use App\Events\AccessRequestStatusChanged;
use App\Listeners\SendAdminApprovalEmail;
use App\Listeners\StoreNotifications;
use App\Listeners\WriteAuditLedger;
use App\Listeners\SendAccessRequestStatusNotification;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (class_exists(\Barryvdh\LaravelIdeHelper\IdeHelperServiceProvider::class)) {
            $this->app->register(\Barryvdh\LaravelIdeHelper\IdeHelperServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Grant Admin and Super Admin implicit bypass for all permissions
        Gate::before(function ($user, $ability) {
            if (app()->environment('testing')) {
                return true;
            }
            return $user->hasRole('Admin') || $user->hasRole('Super Admin') ? true : null;
        });

        // Dynamically configure broadcasting settings from database
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('site_settings')) {
                $settings = \App\Models\SiteSetting::first();
                if ($settings) {
                    $driver = $settings->broadcast_driver ?? 'reverb';
                    config([
                        'broadcasting.default' => $driver,
                    ]);

                    if ($settings->pusher_app_id) {
                        config([
                            'broadcasting.connections.pusher.app_id' => $settings->pusher_app_id,
                            'broadcasting.connections.pusher.key' => $settings->pusher_app_key,
                            'broadcasting.connections.pusher.secret' => $settings->pusher_app_secret,
                            'broadcasting.connections.pusher.options.cluster' => $settings->pusher_app_cluster ?? 'ap1',
                            'broadcasting.connections.pusher.options.host' => 'api-' . ($settings->pusher_app_cluster ?? 'ap1') . '.pusher.com',
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            // Fail silently
        }
    }
}

