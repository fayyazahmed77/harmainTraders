<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CapitalHistory extends Model
{
    public $timestamps = false; // Using custom created_at in migration
    protected $table = 'capital_history';

    protected $fillable = [
        'investor_id',
        'event_type',
        'amount',
        'capital_before',
        'capital_after',
        'ownership_before',
        'ownership_after',
        'total_capital_before',
        'total_capital_after',
        'effective_date',
        'effective_from_period',
        'approved_by',
        'reference_id',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'capital_before' => 'decimal:2',
        'capital_after' => 'decimal:2',
        'ownership_before' => 'decimal:2',
        'ownership_after' => 'decimal:2',
        'total_capital_before' => 'decimal:2',
        'total_capital_after' => 'decimal:2',
        'effective_date' => 'date',
    ];

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
