<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfferList extends Model
{
    protected $table = "offer_lists";

    protected $fillable = [
        "offer_id",
        "item_id",
        "pack_ctn",
        "loos_ctn",
        "price_type",
        "mrp",
        "scheme",
        "status",
        "price",
        "created_by",
    ];

    public function priceOfferTo()
    {
        return $this->belongsTo(PriceOfferTo::class, "offer_id");
    }
    public function items()
    {
        return $this->belongsTo(Items::class, "item_id");
    }
}
