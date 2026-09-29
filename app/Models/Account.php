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
        'opening_balance_type',
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
        'purchase'             => 'boolean',
        'cashbank'             => 'boolean',
        'sale'                 => 'boolean',
        'status'               => 'boolean',
        'opening_balance'      => 'decimal:2',
        'opening_balance_type' => 'string',
        'credit_limit'         => 'decimal:2',
    ];

    /**
     * Return the algebraically signed opening balance for use in ledger formulas.
     *
     * Convention used across ALL balance calculations:
     *   - Positive value  → increases the account's natural balance
     *   - Negative value  → decreases the account's natural balance
     *
     * DR-normal accounts (Customers, Cash, Bank, Expense, Drawings …):
     *   DR opening_balance_type → +OB   (money owed to us / asset)
     *   CR opening_balance_type → -OB   (advance received / liability)
     *
     * CR-normal accounts (Suppliers, Capital, Reserve, Amanat …):
     *   CR opening_balance_type → +OB   (money owed by us)
     *   DR opening_balance_type → -OB   (advance paid / debit balance)
     */
    public function getSignedOpeningBalance(): float
    {
        $raw  = (float) ($this->opening_balance ?? 0);
        $type = strtoupper($this->opening_balance_type ?? 'DR');

        // CR-normal accounts: Supplier, Capital, Reserve, Amanat Payable
        $isCrNormal = $this->purchase == 1
            || in_array($this->type, [9, 17, 18]) // Capital / Reserve / Amanat types
            || in_array(strtolower($this->accountType->name ?? ''), ['capital', 'amanat payable', 'reserve']);

        if ($isCrNormal) {
            // Positive stored value + CR type = normal supplier/capital balance (+)
            // Positive stored value + DR type = advance paid / debit balance (-)
            return $type === 'CR' ? $raw : -$raw;
        }

        // DR-normal accounts (customers, cash, bank, expense, drawings, other)
        // Positive stored value + DR type = normal receivable / asset (+)
        // Positive stored value + CR type = advance received / credit balance (-)
        return $type === 'DR' ? $raw : -$raw;
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('status', true)
              ->orWhere('status', 1)
              ->orWhereNull('status');
        });
    }

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
            return \App\Services\PaymentAccountingService::getCustomerCurrentBalance($this);
        } elseif ($type === 'supplier') {
            return \App\Services\PaymentAccountingService::getSupplierCurrentBalance($this);
        } elseif ($type === 'cheque in hand') {
            $baseQuery = $this->financialPayments()
                ->where(function($q) {
                    $q->whereIn('cheque_status', ['In Hand'])->orWhereNull('cheque_status');
                });

            $totalIn = (clone $baseQuery)->where('type', 'RECEIPT')->sum('amount');
            $totalOut = (clone $baseQuery)->where('type', 'PAYMENT')->sum('amount');

            return $this->getSignedOpeningBalance() + $totalIn - $totalOut;
        } elseif (in_array($type, ['bank', 'cash'])) {
            $baseQuery = $this->financialPayments()
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                });

            $totalIn = (clone $baseQuery)->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                })->sum('amount');

            $totalOut = (clone $baseQuery)->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                })->sum('amount');

            $partyQuery = $this->partyPayments()
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                });

            $partyIn = (clone $partyQuery)->where('type', 'PAYMENT')->sum('amount');

            $partyOut = (clone $partyQuery)->where('type', 'RECEIPT')->sum('amount');
            
            return $this->getSignedOpeningBalance() + $totalIn - $totalOut + $partyIn - $partyOut;
        } elseif (in_array($type, ['expense', 'other'])) {
            $totalPayments = $this->partyPayments()->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));
            
            $totalReceipts = $this->partyPayments()->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));

            return $this->getSignedOpeningBalance() + $totalPayments - $totalReceipts;
        } elseif (in_array($type, ['capital', 'amanat payable', 'reserve']) || in_array($this->type, [9, 17, 18])) {
            $totalReceipts = $this->partyPayments()->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));

            $totalPayments = $this->partyPayments()->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));

            return $this->getSignedOpeningBalance() + $totalReceipts - $totalPayments;
        } elseif ($type === 'drawings' || $this->type == 8) {
            $totalPayments = $this->partyPayments()->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));

            $totalReceipts = $this->partyPayments()->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })->sum(DB::raw('amount + discount'));

            return $this->getSignedOpeningBalance() + $totalPayments - $totalReceipts;
        }
        
        return $this->getSignedOpeningBalance();
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
