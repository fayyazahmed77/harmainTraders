<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemCategory extends Model
{
    protected $table = "item_categories";

    protected $fillable = [
        "name",
        "code",
        "image",
        "description",
        "status",
        "created_by",
        "updated_by",
    ];

    protected $appends = [
        'image_url',
    ];

    public function getImageUrlAttribute()
    {
        if (!$this->image) return null;
        
        // If it's already an absolute URL, return it
        if (filter_var($this->image, FILTER_VALIDATE_URL)) return $this->image;
        
        // Fix: If it has redundant /images/ prefix from old data
        $path = ltrim($this->image, '/');
        if (str_starts_with($path, 'images/storage/')) {
            $path = str_replace('images/storage/', 'storage/', $path);
        } elseif (str_starts_with($path, 'images/')) {
            $path = str_replace('images/', '', $path);
        }
        
        return asset($path);
    }

    public function items()
    {
        return $this->hasMany(Items::class, 'category');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
