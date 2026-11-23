<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class OpeningBalanceAllocation extends Model
{
    use Auditable;

    protected $fillable = [
        'voucher_no',
        'account_id',
        'bill_type',
        'bill_id',
        'date',
        'amount',
        'remarks',
    ];

    protected $casts = [
        'account_id' => 'integer',
        'bill_id'    => 'integer',
        'amount'     => 'float',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function bill()
    {
        return $this->morphTo(null, 'bill_type', 'bill_id');
    }
}
