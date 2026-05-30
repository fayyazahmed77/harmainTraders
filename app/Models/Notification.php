<?php

namespace App\Models;

use Illuminate\Notifications\DatabaseNotification as LaravelDatabaseNotification;
use Illuminate\Database\Eloquent\Builder;

class Notification extends LaravelDatabaseNotification
{
    /**
     * Disable automated timestamps (notifications only have created_at).
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /**
     * Scope a query to filter notifications by category.
     */
    public function scopeCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Scope a query to filter notifications by priority level.
     */
    public function scopePriority(Builder $query, string $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope a query to only include active (unexpired) notifications.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    /**
     * Scope a query to filter notifications by their group key (e.g. for batch alerts).
     */
    public function scopeByGroup(Builder $query, string $groupKey): Builder
    {
        return $query->where('group_key', $groupKey);
    }
}
