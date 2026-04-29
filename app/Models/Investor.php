<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Investor extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'cnic',
        'address',
        'joining_date',
        'status'
    ];

    protected $casts = [
        'joining_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function capitalAccount(): HasOne
    {
        return $this->hasOne(InvestorCapitalAccount::class);
    }

    public function profitShares(): HasMany
    {
        return $this->hasMany(InvestorProfitShare::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(InvestorTransaction::class);
    }

    public function financialRequests(): HasMany
    {
        return $this->hasMany(FinancialRequest::class);
    }

    public function capitalHistory(): HasMany
    {
        return $this->hasMany(CapitalHistory::class);
    }
}
