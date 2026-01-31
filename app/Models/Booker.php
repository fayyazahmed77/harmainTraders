<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booker extends Model
{
    protected $table = 'bookers';

    protected $fillable = [
        'name',
        'shortname',
        'code',
        'date',
        'status',
        'defult',
        'created_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'defult' => 'boolean',
        'date' => 'date',
    ];

    // Relation with creator
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
