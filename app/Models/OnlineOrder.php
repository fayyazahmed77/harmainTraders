<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CustomerUser;
use App\Models\Account;
use App\Models\PriceOfferTo;
use App\Models\Sales;
use App\Models\User;
use App\Models\OnlineOrderItem;
use App\Models\OnlineOrderHistory;
use App\Models\OnlineOrderRevision;

class OnlineOrder extends Model
{
    protected $table = 'online_orders';

    protected $fillable = [
        'order_no',
        'customer_user_id',
        'account_id',
        'offer_id',
        'status',
        'original_subtotal',
        'current_subtotal',
        'discount_type',
        'discount_rate',
        'discount_amount',
        'delivery_charges',
        'final_total',
        'currency',
        'sale_id',
        'cancellation_reason',
        'internal_notes',
        'customer_notes',
        'confirmed_by',
        'confirmed_at',
        'canceled_by',
        'canceled_at',
        'submitted_at',
        'idempotency_key',
        'revision_number',
        'customer_accepted_at',
    ];

    protected $casts = [
        'original_subtotal' => 'decimal:2',
        'current_subtotal' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'delivery_charges' => 'decimal:2',
        'final_total' => 'decimal:2',
        'confirmed_at' => 'datetime',
        'canceled_at' => 'datetime',
        'submitted_at' => 'datetime',
        'customer_accepted_at' => 'datetime',
    ];

    protected $appends = [
        'payable_amount',
        'subtotal',
        'customer_remarks',
    ];

    public function getPayableAmountAttribute()
    {
        return (float) $this->final_total;
    }

    public function setPayableAmountAttribute($value)
    {
        $this->attributes['final_total'] = $value;
    }

    public function getSubtotalAttribute()
    {
        return (float) $this->current_subtotal;
    }

    public function setSubtotalAttribute($value)
    {
        $this->attributes['current_subtotal'] = $value;
    }

    public function getCustomerRemarksAttribute()
    {
        return $this->customer_notes;
    }

    public function setCustomerRemarksAttribute($value)
    {
        $this->attributes['customer_notes'] = $value;
    }

    public function customerUser()
    {
        return $this->belongsTo(CustomerUser::class, 'customer_user_id');
    }

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function offer()
    {
        return $this->belongsTo(PriceOfferTo::class, 'offer_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sales::class, 'sale_id');
    }

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function confirmedByUser()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function canceledBy()
    {
        return $this->belongsTo(User::class, 'canceled_by');
    }

    public function canceledByUser()
    {
        return $this->belongsTo(User::class, 'canceled_by');
    }

    public function items()
    {
        return $this->hasMany(OnlineOrderItem::class, 'online_order_id');
    }

    public function histories()
    {
        return $this->hasMany(OnlineOrderHistory::class, 'online_order_id')->orderBy('created_at', 'desc');
    }

    public function revisions()
    {
        return $this->hasMany(OnlineOrderRevision::class, 'online_order_id')->orderBy('revision_number', 'desc');
    }

    public function activeRevision()
    {
        return $this->hasOne(OnlineOrderRevision::class, 'online_order_id')
            ->whereIn('revision_status', ['awaiting_customer_acceptance', 'draft'])
            ->latest('revision_number');
    }
}
