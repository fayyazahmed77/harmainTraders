<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierCredit extends Model
{
    protected $fillable = [
        'supplier_id',
        'purchase_return_id',
        'amount',
        'available_balance',
        'status',
    ];

    public function supplier()
    {
        return $this->belongsTo(Account::class, 'supplier_id');
    }

    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'supplier_credit_id');
    }
}
