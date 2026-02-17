<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceOfferTo extends Model
{
    protected $table = "price_offer_to";

    protected $fillable = [
        "account_id",
        "date",
        "offertype",
        "created_by",
        "message_line_id",
    ];

    public function messageLine()
    {
        return $this->belongsTo(MessageLine::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function items()
    {
        return $this->hasMany(OfferList::class, 'offer_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
