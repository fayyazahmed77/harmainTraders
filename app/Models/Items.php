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
        'scheme',
        'scheme2',
    ];

    protected $casts = [
        'is_import' => 'boolean',
        'is_fridge' => 'boolean',
        'is_active' => 'boolean',
        'is_recipe' => 'boolean',
        'trade_price' => 'decimal:2',
        'retail' => 'decimal:2',
        'packing_qty' => 'integer',
        'stock_1' => 'integer',
        'stock_2' => 'integer',
    ];

    protected $appends = [
        'price_per_pcs',
        'total_stock_pcs',
        'stock_breakdown',
    ];

    /**
     * Get the calculated price per piece.
     * Trade Price / Packing Qty (Rounded up)
     */
    public function getPricePerPcsAttribute()
    {
        $packingQty = $this->packing_qty ?: 1;
        $tradePrice = (float) $this->trade_price;
        return ceil($tradePrice / $packingQty);
    }

    /**
     * Get the total stock in pieces.
     */
    public function getTotalStockPcsAttribute()
    {
        $packingQty = $this->packing_qty ?: 1;
        return (($this->stock_1 ?? 0) * $packingQty) + ($this->stock_2 ?? 0);
    }

    /**
     * Helper to get stock breakdown string.
     */
    public function getStockBreakdownAttribute()
    {
        $packingQty = $this->packing_qty ?: 1;
        if ($packingQty <= 1) {
            return ($this->stock_1 ?? 0) . ' Units';
        }
        return ($this->stock_1 ?? 0) . ' Full, ' . ($this->stock_2 ?? 0) . ' Pcs';
    }

    /**
     * Correctly partition total pieces into stock_1 (Full) and stock_2 (PCS)
     */
    public function updateStockFromPcs(int $totalPcs)
    {
        $packing = $this->packing_qty ?: 1;
        if ($packing > 1) {
            $this->stock_1 = floor($totalPcs / $packing);
            $this->stock_2 = $totalPcs - ($this->stock_1 * $packing);
        } else {
            $this->stock_1 = $totalPcs;
            $this->stock_2 = 0;
        }
        return $this->save();
    }

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'category');
    }

    public function salesItems()
    {
        return $this->hasMany(SalesItem::class, 'item_id');
    }

    public function companyAccount()
    {
        return $this->belongsTo(Account::class, 'company');
    }

    public function lastPurchaseItem()
    {
        return $this->hasOne(PurchaseItem::class, 'item_id')->latestOfMany();
    }
}
