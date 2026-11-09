<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CustomerUser;
use App\Models\OnlineOrder;

class NotificationDelivery extends Model
{
    protected $table = 'notification_deliveries';

    protected $fillable = [
        'customer_user_id',
        'online_order_id',
        'event_key',
        'channel',
        'recipient',
        'message_reference',
        'delivery_status',
        'provider_reference',
        'attempt_count',
        'last_attempt_at',
        'delivered_at',
        'failure_reason',
    ];

    protected $casts = [
        'attempt_count' => 'integer',
        'last_attempt_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function customerUser()
    {
        return $this->belongsTo(CustomerUser::class, 'customer_user_id');
    }

    public function order()
    {
        return $this->belongsTo(OnlineOrder::class, 'online_order_id');
    }
}

