<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Firm extends Model
{
    use HasFactory;

    protected $appends = ['logo_url'];

    protected $fillable = [
        'name',
        'code',
        'date',
        'business',
        'address1',
        'address2',
        'address3',
        'phone',
        'fax',
        'owner',
        'email',
        'website',
        'saletax',
        'ntn',
        'printinvoice',
        'defult',
        'status',
        'created_by',
        'logo',
    ];
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getLogoUrlAttribute()
    {
        return $this->logo ? asset('storage/' . $this->logo) : null;
    }
}
