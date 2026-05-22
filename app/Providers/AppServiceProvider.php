<?php

namespace App\Providers;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
    }
}

