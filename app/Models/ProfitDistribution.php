<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProfitDistribution extends Model
{
    protected $fillable = [
        'distribution_period',
        'total_business_profit',
        'total_business_capital',
        'distributed_at',
        'distributed_by',
        'status',
        'notes',
        'is_locked',
        'locked_at',
        'locked_by'
    ];

    protected $casts = [
        'total_business_profit' => 'decimal:2',
        'total_business_capital' => 'decimal:2',
        'distributed_at' => 'datetime',
        'locked_at' => 'datetime',
        'is_locked' => 'boolean',
    ];

    public function distributedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'distributed_by');
    }

    public function lockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by');
    }

    public function profitShares(): HasMany
    {
        return $this->hasMany(InvestorProfitShare::class, 'distribution_id');
    }
}
