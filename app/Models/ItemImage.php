<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemImage extends Model
{
    protected $fillable = [
        'item_id',
        'image_path',
        'is_primary',
        'sort_order',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function item()
    {
        return $this->belongsTo(Items::class, 'item_id');
    }

    /**
     * Get the full URL for the image.
     */
    public function getUrlAttribute()
    {
        if (!$this->image_path) return null;

        // If it's already an absolute URL, return it
        if (filter_var($this->image_path, FILTER_VALIDATE_URL)) return $this->image_path;

        // Fix: If it has redundant /images/ prefix from old data
        $path = ltrim($this->image_path, '/');
        if (str_starts_with($path, 'images/storage/')) {
            $path = str_replace('images/storage/', 'storage/', $path);
        } elseif (str_starts_with($path, 'images/')) {
            $path = str_replace('images/', '', $path);
        }

        return asset($path);
    }
}
