<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    // Table name (optional, if follows convention)
    protected $table = 'provinces';

    // ✅ Mass assignable fields
    protected $fillable = [
        'country_id',
        'name',
        'code',
        'latitude',
        'longitude',
        'is_active',
        'created_by',
    ];
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
