<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\Auditable;

class Purchase extends Model
{
    use HasFactory, Auditable;

    protected $table = 'purchases';

    protected $fillable = [
        'date',
        'invoice',
        'code',
        'supplier_id',
        'salesman_id',
        'no_of_items',
        'status',
        'gross_total',
        'discount_total',
        'tax_total',
        'courier_charges',
        'net_total',
        'paid_amount',
        'remaining_amount',
    ];

    public function supplier()
    {
        return $this->belongsTo(Account::class);
    }

    public function salesman()
    {
        return $this->belongsTo(Saleman::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class, 'purchase_id');
    }
}
