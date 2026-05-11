<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierOrder extends Model
{
    protected $fillable = [
        'order_date',
        'supplier_id',
        'total_discount',
        'total_amount',
        'status',
    ];

    public function supplier()
    {
        return $this->belongsTo(Account::class, 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(SupplierOrderItem::class);
    }
}
