<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountType extends Model
{
    protected $fillable = [
        'name',
        'description',
        'created_by',
    ];

    
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
