<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestorProfitShare extends Model
{
    protected $fillable = [
        'distribution_id',
        'investor_id',
        'capital_snapshot',
        'ownership_snapshot',
        'profit_amount',
        'status',
        'credited_at'
    ];

    protected $casts = [
        'capital_snapshot' => 'decimal:2',
        'ownership_snapshot' => 'decimal:2',
        'profit_amount' => 'decimal:2',
        'credited_at' => 'datetime',
    ];

    public function distribution(): BelongsTo
    {
        return $this->belongsTo(ProfitDistribution::class, 'distribution_id');
    }

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }
}
