<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialRequest extends Model
{
    protected $fillable = [
        'investor_id',
        'request_type',
        'amount',
        'status',
        'requested_at',
        'reviewed_at',
        'reviewed_by',
        'admin_note',
        'investor_note',
        'effective_date',
        'deferred_until',
        'paid_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'effective_date' => 'date',
        'deferred_until' => 'date',
        'paid_at' => 'datetime',
    ];

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class, 'request_id');
    }
}
