<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\SalesItem;
use App\Traits\Auditable;

class Sales extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'date',
        'invoice',
        'code',
        'customer_id', // Assuming customer_id instead of supplier_id
        'salesman_id',
        'firm_id',
        'message_line_id',
        'no_of_items',
        'gross_total',
        'discount_total',
        'tax_total',
        'courier_charges',
        'net_total',
        'paid_amount',
        'remaining_amount',
        'status',
    ];

    public function customer()
    {
        return $this->belongsTo(Account::class, 'customer_id');
    }

    public function salesman()
    {
        return $this->belongsTo(Saleman::class);
    }

    public function messageLine()
    {
        return $this->belongsTo(MessageLine::class, 'message_line_id');
    }

    public function items()
    {
        return $this->hasMany(SalesItem::class, 'sale_id');
    }
}
