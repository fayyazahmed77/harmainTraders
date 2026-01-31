<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Saleman extends Model
{
    use HasFactory;

    protected $table = 'salemen';

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
