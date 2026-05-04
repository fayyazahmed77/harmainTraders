<?php

namespace App\Services;

use App\Models\ProfitDistribution;
use Carbon\Carbon;

class FinancialGovernanceService
{
    /**
     * Check if a specific date falls within a locked financial period.
     */
    public function isPeriodLocked(string|Carbon $date): bool
    {
        $carbonDate = is_string($date) ? Carbon::parse($date) : $date;
        $period = $carbonDate->format('Y-m');

        return ProfitDistribution::where('distribution_period', $period)
            ->where('is_locked', true)
            ->exists();
    }

    /**
     * Ensure a date is not in a locked period, otherwise throw exception.
     */
    public function validateDateNotLocked(string|Carbon $date): void
    {
        if ($this->isPeriodLocked($date)) {
            $period = is_string($date) ? Carbon::parse($date)->format('F Y') : $date->format('F Y');
            throw new \Exception("The financial period for {$period} is locked and cannot be modified.");
        }
    }
}
