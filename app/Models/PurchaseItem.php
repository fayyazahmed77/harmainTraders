<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'item_id',

        'qty_carton',
        'qty_pcs',
        'total_pcs',

        'trade_price',
        'discount',
        'gst_amount',

        'subtotal',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function item()
    {
        return $this->belongsTo(Items::class);
    }
}
