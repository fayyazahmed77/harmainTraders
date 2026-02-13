<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    use HasFactory;

    protected $fillable = [
        'country_id',
        'province_id',
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
    public function province()
    {
        return $this->belongsTo(Province::class, 'province_id');
    }
    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }
}
