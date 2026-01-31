<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'bill_id',
        'bill_type',
        'amount',
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function bill()
    {
        return $this->morphTo(__FUNCTION__, 'bill_type', 'bill_id');
    }
}
