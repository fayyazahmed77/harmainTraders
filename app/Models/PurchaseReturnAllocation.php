<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseReturnAllocation extends Model
{
    protected $fillable = [
        'purchase_return_id',
        'purchase_id',
        'amount',
    ];

    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }
}
