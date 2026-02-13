<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SalesItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'item_id',
        'qty_carton',
        'qty_pcs',
        'total_pcs',
        'trade_price',
        'retail_price',
        'discount',
        'gst_amount',
        'subtotal',
        'bonus_qty_carton',
        'bonus_qty_pcs',
    ];

    public function sale()
    {
        return $this->belongsTo(Sales::class, 'sale_id');
    }

    public function item()
    {
        return $this->belongsTo(Items::class, 'item_id');
    }
}
