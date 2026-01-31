<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class PermissionCat extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'icon', // ✅ Add this line
    ];
}
