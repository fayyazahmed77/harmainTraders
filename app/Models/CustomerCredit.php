<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerCredit extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'sales_return_id',
        'amount',
        'available_balance',
        'status',
    ];

    public function customer()
    {
        return $this->belongsTo(Account::class, 'customer_id');
    }

    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
