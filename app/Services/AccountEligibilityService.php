<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Database\Eloquent\Builder;

class AccountEligibilityService
{
    /**
     * Scope query to accounts eligible for Sales transactions.
     * Must have sale permission enabled and account must be active.
     */
    public static function forSale(Builder $query): Builder
    {
        return $query->where('sale', true)->active();
    }

    /**
     * Scope query to accounts eligible for Purchase transactions.
     * Must have purchase permission enabled and account must be active.
     */
    public static function forPurchase(Builder $query): Builder
    {
        return $query->where('purchase', true)->active();
    }

    /**
     * Scope query to accounts eligible as Cash/Bank settlement accounts.
     * Must have cashbank permission enabled, be active, and have an asset cash/bank account type.
     */
    public static function forCashBank(Builder $query): Builder
    {
        return $query->where('cashbank', true)
            ->where(function ($q) {
                $q->whereIn('type', [1, 2, 14])
                  ->orWhereHas('accountType', function ($typeQuery) {
                      $typeQuery->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
                  });
            })
            ->active();
    }

    /**
     * Check if a specific account instance is eligible for Sale.
     */
    public static function isEligibleForSale(?Account $account): bool
    {
        if (!$account) {
            return false;
        }
        $isActive = ($account->status === true || $account->status === 1 || $account->status === null);
        return (bool) $account->sale && $isActive;
    }

    /**
     * Check if a specific account instance is eligible for Purchase.
     */
    public static function isEligibleForPurchase(?Account $account): bool
    {
        if (!$account) {
            return false;
        }
        $isActive = ($account->status === true || $account->status === 1 || $account->status === null);
        return (bool) $account->purchase && $isActive;
    }

    /**
     * Check if a specific account instance is eligible for Cash/Bank payment source.
     */
    public static function isEligibleForCashBank(?Account $account): bool
    {
        if (!$account || !(bool) $account->cashbank) {
            return false;
        }
        $isActive = ($account->status === true || $account->status === 1 || $account->status === null);
        if (!$isActive) {
            return false;
        }
        $typeName = strtolower($account->accountType?->name ?? '');
        return in_array((int) $account->type, [1, 2, 14]) || in_array($typeName, ['cash', 'bank', 'cheque in hand']);
    }
}
