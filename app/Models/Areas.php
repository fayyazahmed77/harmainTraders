<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Areas extends Model
{
   use HasFactory;

    protected $fillable = [
        'country_id',
        'province_id',
        'city_id',
        'name',
        'status',
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
public function city()
{
    return $this->belongsTo(City::class, 'city_id');
}
}
