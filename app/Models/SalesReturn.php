<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\SalesReturnItem;

class SalesReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'invoice',
        'original_invoice',
        'customer_id',
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
}
