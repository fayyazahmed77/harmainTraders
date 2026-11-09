<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\OnlineOrder;
use App\Models\Items;

class OnlineOrderItem extends Model
{
    protected $table = 'online_order_items';

    protected $fillable = [
        'online_order_id',
        'offer_item_id',
        'product_id',
        'item_code_snapshot',
        'item_name_snapshot',
        'unit_snapshot',
        'packing_qty_snapshot',
        'qty_carton',
        'qty_pcs',
        'total_pcs',
        'price_carton',
        'price_piece',
        'line_subtotal',
    ];

    protected $casts = [
        'packing_qty_snapshot' => 'decimal:2',
        'qty_carton' => 'decimal:2',
        'qty_pcs' => 'decimal:2',
        'total_pcs' => 'decimal:2',
        'price_carton' => 'decimal:2',
        'price_piece' => 'decimal:2',
        'line_subtotal' => 'decimal:2',
    ];

    protected $appends = [
        'item_id',
        'item_name',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    public function getItemIdAttribute()
    {
        return $this->product_id;
    }

    public function setItemIdAttribute($val)
    {
        $this->attributes['product_id'] = $val;
    }

    public function getItemNameAttribute()
    {
        return $this->item_name_snapshot;
    }

    public function setItemNameAttribute($val)
    {
        $this->attributes['item_name_snapshot'] = $val;
    }

    public function getQuantityAttribute()
    {
        return (float) $this->total_pcs;
    }

    public function setQuantityAttribute($val)
    {
        $this->attributes['total_pcs'] = $val;
    }

    public function getUnitPriceAttribute()
    {
        return (float) $this->price_piece;
    }

    public function setUnitPriceAttribute($val)
    {
        $this->attributes['price_piece'] = $val;
    }

    public function getSubtotalAttribute()
    {
        return (float) $this->line_subtotal;
    }

    public function setSubtotalAttribute($val)
    {
        $this->attributes['line_subtotal'] = $val;
    }

    public function order()
    {
        return $this->belongsTo(OnlineOrder::class, 'online_order_id');
    }

    public function product()
    {
        return $this->belongsTo(Items::class, 'product_id');
    }

    public function item()
    {
        return $this->belongsTo(Items::class, 'product_id');
    }
}
