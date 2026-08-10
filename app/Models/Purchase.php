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
        'firm_id',
        'no_of_items',
        'status',
        'gross_total',
        'discount_total',
        'extra_discount',
        'tax_total',
        'courier_charges',
        'net_total',
        'paid_amount',
        'remaining_amount',
        'message_line_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'supplier_id' => 'integer',
        'salesman_id' => 'integer',
        'firm_id' => 'integer',
        'message_line_id' => 'integer',
        'no_of_items' => 'integer',
        'gross_total' => 'float',
        'discount_total' => 'float',
        'extra_discount' => 'float',
        'tax_total' => 'float',
        'courier_charges' => 'float',
        'net_total' => 'float',
        'paid_amount' => 'float',
        'remaining_amount' => 'float',
    ];

    public function messageLine()
    {
        return $this->belongsTo(MessageLine::class);
    }

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
