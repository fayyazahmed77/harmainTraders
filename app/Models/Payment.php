<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Payment extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'date',
        'voucher_no',
        'account_id',
        'payment_account_id',
        'amount',
        'discount',
        'net_amount',
        'type',
        'cheque_no',
        'cheque_date',
        'clear_date',
        'remarks',
        'payment_method',
        'cheque_id',
        'cheque_status',
        'message_line_id',
    ];

    public function messageLine()
    {
        return $this->belongsTo(MessageLine::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function paymentAccount()
    {
        return $this->belongsTo(Account::class, 'payment_account_id');
    }

    public function cheque()
    {
        return $this->belongsTo(Chequebook::class, 'cheque_id');
    }

    public function allocations()
    {
        return $this->hasMany(PaymentAllocation::class);
    }
}
