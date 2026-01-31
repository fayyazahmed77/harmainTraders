<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bank extends Model
{
    protected $fillable = [
        'name',
        'account_no',
        'account_name',
        'code',
        'branch',
        'address',
        'phone',
        'email',
        'website',
        'logo',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
