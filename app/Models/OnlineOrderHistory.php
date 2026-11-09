<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\OnlineOrder;

class OnlineOrderHistory extends Model
{
    public $timestamps = false;
    protected $table = 'online_order_histories';

    protected $fillable = [
        'online_order_id',
        'action',
        'previous_status',
        'new_status',
        'actor_type',
        'actor_id',
        'description',
        'reason',
        'old_values',
        'new_values',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(OnlineOrder::class, 'online_order_id');
    }
}

