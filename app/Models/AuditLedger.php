<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLedger extends Model
{
    use HasUuid;

    /**
     * Disable standard Eloquent update timestamps since audit logs are immutable.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'audit_ledgers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'action',
        'auditable_type',
        'auditable_id',
        'old_state',
        'new_state',
        'ip_address',
        'user_agent',
        'checksum',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'old_state' => 'array',
        'new_state' => 'array',
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
     * Get the user (actor) who triggered this audit log entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the polymorphic entity audited.
     */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }
}
