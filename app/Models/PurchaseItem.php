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
        'free_pcs',
        'free_carton',

        'subtotal',
    ];

    protected $casts = [
        'id' => 'integer',
        'purchase_id' => 'integer',
        'item_id' => 'integer',
        'qty_carton' => 'float',
        'qty_pcs' => 'float',
        'total_pcs' => 'float',
        'trade_price' => 'float',
        'discount' => 'float',
        'free_pcs' => 'float',
        'free_carton' => 'float',
        'subtotal' => 'float',
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
