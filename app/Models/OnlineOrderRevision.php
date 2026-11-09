<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\OnlineOrder;
use App\Models\User;
use App\Models\OnlineOrderRevisionItem;

class OnlineOrderRevision extends Model
{
    protected $table = 'online_order_revisions';

    protected $fillable = [
        'online_order_id',
        'revision_number',
        'revision_status',
        'proposed_subtotal',
        'proposed_discount_type',
        'proposed_discount_rate',
        'proposed_discount_amount',
        'proposed_delivery_charges',
        'proposed_final_total',
        'change_reason',
        'created_by',
        'submitted_to_customer_at',
        'customer_accepted_at',
        'customer_rejected_at',
        'expires_at',
    ];

    protected $casts = [
        'proposed_subtotal' => 'decimal:2',
        'proposed_discount_rate' => 'decimal:2',
        'proposed_discount_amount' => 'decimal:2',
        'proposed_delivery_charges' => 'decimal:2',
        'proposed_final_total' => 'decimal:2',
        'submitted_to_customer_at' => 'datetime',
        'customer_accepted_at' => 'datetime',
        'customer_rejected_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $appends = [
        'status',
        'subtotal',
        'payable_amount',
        'notes',
        'delivery_charges',
        'discount_amount',
        'discount_type',
        'discount_rate',
    ];

    public function getStatusAttribute()
    {
        return match ($this->revision_status) {
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            'awaiting_customer_acceptance', 'draft' => 'Pending',
            default => 'Pending',
        };
    }

    public function getSubtotalAttribute()
    {
        return (float) $this->proposed_subtotal;
    }

    public function getPayableAmountAttribute()
    {
        return (float) $this->proposed_final_total;
    }

    public function getNotesAttribute()
    {
        return $this->change_reason;
    }

    public function getDeliveryChargesAttribute()
    {
        return (float) $this->proposed_delivery_charges;
    }

    public function getDiscountAmountAttribute()
    {
        return (float) $this->proposed_discount_amount;
    }

    public function getDiscountTypeAttribute()
    {
        return $this->proposed_discount_type;
    }

    public function getDiscountRateAttribute()
    {
        return (float) $this->proposed_discount_rate;
    }

    public function order()
    {
        return $this->belongsTo(OnlineOrder::class, 'online_order_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(OnlineOrderRevisionItem::class, 'revision_id');
    }
}
