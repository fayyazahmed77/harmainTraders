<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Chequebook extends Model
{
    use HasFactory;

    protected $fillable = [
        'bank_id',
        'cheque_no',
        'entry_date',
        'prefix',
        'voucher_code',
        'remarks',
        'status',
        'created_by',
    ];

    // 🔗 Relationship with Bank
    public function bank()
    {
        return $this->belongsTo(Account::class);
    }

    // 👤 Relationship with User (creator)
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ✅ Status Label Accessor
    public function getStatusLabelAttribute()
    {
        return ucfirst($this->status);
    }

    // 💸 Relationship with Payment (One-to-One via cheque_id)
    public function payment()
    {
        return $this->hasOne(Payment::class, 'cheque_id');
    }
}
