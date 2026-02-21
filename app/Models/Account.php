<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Account extends Model
{
    use Auditable;
    protected $fillable = [
        'code',
        'title',
        'type',
        'purchase',
        'cashbank',
        'sale',
        'opening_balance',
        'address1',
        'address2',
        'telephone1',
        'telephone2',
        'fax',
        'mobile',
        'gst',
        'ntn',
        'remarks',
        'regards',
        'opening_date',
        'fbr_date',
        'country_id',
        'province_id',
        'city_id',
        'area_id',
        'subarea_id',
        'saleman_id',
        'booker_id',
        'credit_limit',
        'aging_days',
        'note_head',
        'item_category',
        'category',
        'ats_percentage',
        'ats_type',
        'cnic',
        'status',
        'account_category_id',
    ];

    public function accountCategory()
    {
        return $this->belongsTo(AccountCategory::class, 'category');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function accountType()
    {
        return $this->belongsTo(AccountType::class, 'type', 'id');
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function area()
    {
        return $this->belongsTo(Areas::class, 'area_id');
    }

    public function subarea()
    {
        return $this->belongsTo(Subarea::class);
    }

    public function saleman()
    {
        return $this->belongsTo(Saleman::class);
    }

    public function booker()
    {
        return $this->belongsTo(Booker::class);
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function province()
    {
        return $this->belongsTo(Province::class);
    }

    public function sales()
    {
        return $this->hasMany(Sales::class, 'customer_id');
    }
}
