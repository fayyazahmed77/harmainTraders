<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessRequestHistory extends Model
{
    use HasUuid;

    /**
     * Disable standard Eloquent update timestamps since history logs are immutable.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'access_request_id',
        'actor_id',
        'previous_status',
        'new_status',
        'step_number',
        'action_notes',
        'ip_address',
        'user_agent',
        'signature',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'step_number' => 'integer',
        'created_at' => 'datetime',
    ];

    /**
     * Boot the model to auto-populate the immutable created_at timestamp.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = $model->freshTimestamp();
        });
    }

    /**
     * Get the parent access request for this transition history record.
     */
    public function accessRequest(): BelongsTo
    {
        return $this->belongsTo(AccessRequest::class);
    }

    /**
     * Get the admin or system user (actor) who transitioned the request state.
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
