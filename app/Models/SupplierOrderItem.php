<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierOrderItem extends Model
{
    protected $fillable = [
        'supplier_order_id',
        'item_id',
        'qty_full',
        'qty_pcs',
        'qty_b_full',
        'qty_b_pcs',
        'rate',
        'discount_percent',
        'net_rate',
        'subtotal',
    ];

    public function order()
    {
        return $this->belongsTo(SupplierOrder::class, 'supplier_order_id');
    }

    public function item()
    {
        return $this->belongsTo(Items::class, 'item_id');
    }
}
