<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestorCapitalAccount extends Model
{
    protected $fillable = [
        'investor_id',
        'current_capital',
        'initial_capital',
        'ownership_percentage',
        'last_recalculated_at'
    ];

    protected $casts = [
        'current_capital' => 'decimal:2',
        'initial_capital' => 'decimal:2',
        'ownership_percentage' => 'decimal:2',
        'last_recalculated_at' => 'datetime',
    ];

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }
}
