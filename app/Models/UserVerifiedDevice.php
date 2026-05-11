<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserVerifiedDevice extends Model
{
    protected $fillable = [
        'user_id',
        'device_token',
        'ip_address',
        'user_agent',
        'last_verified_at',
        'expires_at',
    ];

    protected $casts = [
        'last_verified_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
