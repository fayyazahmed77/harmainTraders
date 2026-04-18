<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Illuminate\Support\Facades\DB;

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
        'guest_token',
    ];

    protected $appends = ['current_balance', 'guest_link'];

    protected $casts = [
        'purchase' => 'boolean',
        'cashbank' => 'boolean',
        'sale' => 'boolean',
        'status' => 'boolean',
        'opening_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
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

    public function salesReturns()
    {
        return $this->hasMany(SalesReturn::class, 'customer_id');
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'supplier_id');
    }

    public function purchaseReturns()
    {
        return $this->hasMany(PurchaseReturn::class, 'supplier_id');
    }

    public function partyPayments()
    {
        return $this->hasMany(Payment::class, 'account_id');
    }

    public function financialPayments()
    {
        return $this->hasMany(Payment::class, 'payment_account_id');
    }

    public function getCurrentBalanceAttribute()
    {
        $type = strtolower($this->accountType->name ?? '');
        
        if ($type === 'customers') {
            $totalSales = $this->sales()->sum('net_total');
            $totalReturns = $this->salesReturns()->sum('net_total');
            $totalReceipts = $this->partyPayments()->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled')->sum(DB::raw('amount + discount'));
            $totalPayments = $this->partyPayments()->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled')->sum(DB::raw('amount + discount'));
            
            return (float)$this->opening_balance + $totalSales + $totalPayments - $totalReturns - $totalReceipts;
        } elseif ($type === 'supplier') {
            $totalPurchases = $this->purchases()->sum('net_total');
            $totalReturns = $this->purchaseReturns()->sum('net_total');
            $totalPayments = $this->partyPayments()->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled')->sum(DB::raw('amount + discount'));
            $totalReceipts = $this->partyPayments()->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled')->sum(DB::raw('amount + discount'));
            
            return (float)$this->opening_balance + $totalPurchases + $totalReceipts - $totalReturns - $totalPayments;
        } elseif (in_array($type, ['bank', 'cash', 'cheque in hand'])) {
            $totalIn = $this->financialPayments()->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
                })->sum('amount');
            $totalOut = $this->financialPayments()->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'Distributed']);
                })->sum('amount');
            
            return (float)$this->opening_balance + $totalIn - $totalOut;
        }
        
        return (float)$this->opening_balance;
    }
    public function getGuestLinkAttribute()
    {
        if (!$this->guest_token) {
            return null;
        }
        return url("/g/{$this->guest_token}");
    }
}
