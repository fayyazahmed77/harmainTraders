<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class AccessRequest extends Model
{
    use HasUuid, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'resource_type',
        'action_type',
        'justification',
        'status',
        'current_step',
        'sla_due_at',
        'sla_breached',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'sla_due_at' => 'datetime',
        'current_step' => 'integer',
        'sla_breached' => 'boolean',
    ];

    /**
     * Get the user who requested the access.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the workflow transition history for this request.
     */
    public function histories(): HasMany
    {
        return $this->hasMany(AccessRequestHistory::class);
    }

    /**
     * Scope a query to only include pending requests.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include approved requests.
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope a query to only include rejected requests.
     */
    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope a query to only include requests requiring more information.
     */
    public function scopeMoreInfoRequested(Builder $query): Builder
    {
        return $query->where('status', 'more_info_requested');
    }

    /**
     * Scope a query to filter by resource type.
     */
    public function scopeByResource(Builder $query, string $resource): Builder
    {
        return $query->where('resource_type', $resource);
    }
}
