<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Items extends Model
{
    use Auditable;
    protected $fillable = [
        'date',
        'code',
        'title',
        'short_name',
        'company',
        'trade_price',
        'retail',
        'retail_tp_diff',
        'reorder_level',
        'packing_qty',
        'packing_size',
        'pcs',
        'formation',
        'type',
        'category',
        'shelf',
        'gst_percent',
        'gst_amount',
        'adv_tax_filer',
        'adv_tax_non_filer',
        'adv_tax_manufacturer',
        'discount',
        'packing_full',
        'packing_pcs',
        'limit_pcs',
        'order_qty',
        'weight',
        'stock_1',
        'stock_2',
        'is_import',
        'is_fridge',
        'is_active',
        'is_recipe',
        'pt2',
        'pt3',
        'pt4',
        'pt5',
        'pt6',
        'pt7',
    ];

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'category');
    }

    public function salesItems()
    {
        return $this->hasMany(SalesItem::class, 'item_id');
    }
}
