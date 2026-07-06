<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturnAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_return_id',
        'sale_id',
        'amount',
    ];

    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sales::class);
    }
}
