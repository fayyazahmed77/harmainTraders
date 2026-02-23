<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemCategory extends Model
{
    protected $table = "item_categories";

    protected $fillable = [
        "name",
        "image",
        "description",
        "status",
        "created_by",
        "updated_by",
    ];

    public function items()
    {
        return $this->hasMany(Items::class, 'category');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
