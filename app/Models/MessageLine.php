<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'messageline',
        'category',
        'status',
        'is_default',
        'created_by',
    ];

    protected $casts = [
        'category' => 'array',
        'is_default' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
