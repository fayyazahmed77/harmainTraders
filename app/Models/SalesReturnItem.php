<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\SalesReturn;
use App\Models\Items;

class SalesReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_return_id',
        'item_id',
        'qty_carton',
        'qty_pcs',
        'total_pcs',
        'trade_price',
        'discount',
        'gst_amount',
        'subtotal',
    ];

    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class, 'sales_return_id');
    }

    public function item()
    {
        return $this->belongsTo(Items::class, 'item_id');
    }
}
