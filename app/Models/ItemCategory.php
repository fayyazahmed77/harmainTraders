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
        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }
        
        $path = ltrim($this->image, '/');
        if (str_starts_with($path, 'images/storage/')) {
            $path = substr($path, 7);
        }

        if (file_exists(public_path($path))) {
            return asset($path);
        }

        if (file_exists(public_path('storage/' . $path))) {
            return asset('storage/' . $path);
        }

        if (file_exists(public_path('images/' . $path))) {
            return asset('images/' . $path);
        }

        if (str_starts_with($path, 'storage/') || str_starts_with($path, 'images/')) {
            return asset($path);
        }
        
        return asset('storage/' . $path);
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
