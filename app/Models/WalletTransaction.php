<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    protected $fillable = [
        'salesman_id',
        'sale_id',
        'type',
        'amount',
        'description',
        'status',
    ];

    public function salesman()
    {
        return $this->belongsTo(Saleman::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sales::class);
    }
}
