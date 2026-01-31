<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class PurchaseReturn extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'date',
        'invoice',
        'original_invoice',
        'supplier_id',
        'salesman_id',
        'no_of_items',
        'gross_total',
        'discount_total',
        'tax_total',
        'net_total',
        'paid_amount',
        'remaining_amount',
        'remarks',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseReturnItem::class, 'purchase_return_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Account::class, 'supplier_id');
    }

    public function salesman()
    {
        return $this->belongsTo(Saleman::class, 'salesman_id');
    }
}
