<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class PurchaseReturnItem extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'purchase_return_id',
        'item_id',
        'qty_carton',
        'qty_pcs',
        'total_pcs',
        'trade_price',
        'discount',
        'gst_amount',
        'subtotal',
    ];

    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class, 'purchase_return_id');
    }

    public function item()
    {
        return $this->belongsTo(Items::class, 'item_id');
    }
}
