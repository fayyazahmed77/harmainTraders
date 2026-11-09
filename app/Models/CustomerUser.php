<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Account;
use App\Models\User;
use App\Models\OnlineOrder;
use App\Models\Notification;

class CustomerUser extends Authenticatable
{
    use Notifiable;

    protected $table = 'customer_users';

    protected $fillable = [
        'account_id',
        'name',
        'username',
        'mobile',
        'email',
        'password',
        'approval_status',
        'rejection_reason',
        'email_verified_at',
        'mobile_verified_at',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'business_name',
        'address',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'email_verified_at' => 'datetime',
        'mobile_verified_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function orders()
    {
        return $this->hasMany(OnlineOrder::class, 'customer_user_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function rejector()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function notifications()
    {
        return $this->morphMany(Notification::class, 'notifiable')->latest();
    }

    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->approval_status === 'pending';
    }

    public function isRejected(): bool
    {
        return $this->approval_status === 'rejected';
    }
}

