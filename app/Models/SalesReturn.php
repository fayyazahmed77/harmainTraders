<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\SalesReturnItem;
use App\Traits\Auditable;

class SalesReturn extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'date',
        'invoice',
        'original_invoice',
        'sale_id',
        'customer_id',
        'previous_balance',
        'salesman_id',
        'no_of_items',
        'gross_total',
        'discount_total',
        'tax_total',
        'net_total',
        'extra_discount',
        'paid_amount',
        'remaining_amount',
        'remarks',
        'firm_id',
    ];

    protected $casts = [
        'previous_balance' => 'decimal:2',
        'extra_discount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class, 'sales_return_id');
    }

    public function customer()
    {
        return $this->belongsTo(Account::class, 'customer_id');
    }

    public function salesman()
    {
        return $this->belongsTo(Saleman::class, 'salesman_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sales::class, 'sale_id');
    }

    public function firm()
    {
        return $this->belongsTo(Firm::class, 'firm_id');
    }
}
