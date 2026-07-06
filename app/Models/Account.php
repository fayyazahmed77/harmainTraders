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
        'image',
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

    protected $appends = ['current_balance', 'guest_link', 'image_url'];

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
            $totalSales = (float)$this->sales()->sum('net_total') - (float)$this->sales()->sum('extra_discount');
            $totalReturns = $this->salesReturns()->sum('net_total');
            $totalReceipts = $this->partyPayments()->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));
            // Exclude is_return_refund payments from balance calculation (B1 Fix):
            // When a Sales Return creates a cash refund payment (type=PAYMENT, is_return_refund=1),
            // including it in +$totalPayments would cancel out the return's -$totalReturns credit,
            // leaving the customer balance unchanged when it should decrease by the return amount.
            // The return's effect on balance is already fully captured by -$totalReturns.
            $totalPayments = $this->partyPayments()->where('type', 'PAYMENT')
                ->where('is_return_refund', false)
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));
            
            return (float)$this->opening_balance + $totalSales + $totalPayments - $totalReturns - $totalReceipts;
        } elseif ($type === 'supplier') {
            $totalPurchases = $this->purchases()->sum('net_total');
            $totalReturns = $this->purchaseReturns()->sum('net_total');
            $totalPayments = $this->partyPayments()->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));
            $totalReceipts = $this->partyPayments()->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));
            
            return (float)$this->opening_balance + $totalPurchases + $totalReceipts - $totalReturns - $totalPayments;
        } elseif (in_array($type, ['bank', 'cash', 'cheque in hand'])) {
            $baseQuery = $this->financialPayments()
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                });

            $totalIn = (clone $baseQuery)->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Pending']);
                })->sum('amount');

            $totalOut = (clone $baseQuery)->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Pending']);
                })->sum('amount');
            
            return (float)$this->opening_balance + $totalIn - $totalOut;
        } elseif (in_array($type, ['expense', 'other'])) {
            $totalPayments = $this->partyPayments()->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));
            
            $totalReceipts = $this->partyPayments()->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));

            return (float)$this->opening_balance + $totalPayments - $totalReceipts;
        }
        
        return (float)$this->opening_balance;
    }

    public function assignedCompanies()
    {
        return $this->belongsToMany(Account::class, 'supplier_companies', 'supplier_id', 'company_id')->withTimestamps();
    }

    public function assignedSuppliers()
    {
        return $this->belongsToMany(Account::class, 'supplier_companies', 'company_id', 'supplier_id')->withTimestamps();
    }

    public function items()
    {
        return $this->hasMany(Items::class, 'company');
    }

    public function getGuestLinkAttribute()
    {
        if (!$this->guest_token) {
            return null;
        }
        return url("/g/{$this->guest_token}");
    }
    public function getImageUrlAttribute()
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }
}
