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

    protected $appends = [
        'url',
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
        if (filter_var($this->image_path, FILTER_VALIDATE_URL)) {
            return $this->image_path;
        }

        $path = ltrim($this->image_path, '/');

        // Fix: If it has redundant images/storage/ prefix
        if (str_starts_with($path, 'images/storage/')) {
            $path = substr($path, 7);
        }

        // Direct check: Does the file exist in public path? (e.g. storage/items/..., images/items/...)
        if (file_exists(public_path($path))) {
            return asset($path);
        }

        // Check if stored as 'items/...' but located in 'storage/items/...'
        if (file_exists(public_path('storage/' . $path))) {
            return asset('storage/' . $path);
        }

        // Check if stored as 'items/...' but located in 'images/items/...'
        if (file_exists(public_path('images/' . $path))) {
            return asset('images/' . $path);
        }

        // If path already starts with storage/ or images/, trust it with asset()
        if (str_starts_with($path, 'storage/') || str_starts_with($path, 'images/')) {
            return asset($path);
        }

        // Fallback default: public storage
        return asset('storage/' . $path);
    }
}
