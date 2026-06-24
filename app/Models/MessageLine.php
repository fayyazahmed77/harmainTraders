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
        'created_by',
    ];

    protected $casts = [
        'category' => 'array',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
