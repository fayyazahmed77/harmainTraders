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
        return asset($this->image_path);
    }
}
