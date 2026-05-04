<?php

namespace App\Services;

use App\Models\Investor;
use App\Models\InvestorProfitShare;
use App\Models\InvestorCapitalAccount;
use App\Models\ProfitDistribution;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ForecastEngine
{
    /**
     * Calculates growth rate based on last N months of individual profit.
     */
    public function getAverageProfitGrowthRate(int $investorId, int $months = 6): float
    {
        $history = InvestorProfitShare::where('investor_id', $investorId)
            ->orderBy('id', 'desc')
            ->take($months + 1)
            ->get();

        if ($history->count() < 2) {
            return 0.0;
        }

        $rates = [];
        // Loop from oldest to newest in the chunk
        $history = $history->reverse()->values();
        for ($i = 1; $i < $history->count(); $i++) {
            $previous = (float)$history[$i-1]->profit_amount;
            $current = (float)$history[$i]->profit_amount;
            
            if ($previous > 0) {
                $rates[] = ($current - $previous) / $previous;
            }
        }

        return count($rates) > 0 ? array_sum($rates) / count($rates) : 0.0;
    }

    public function getProjectedData(int $investorId): array
    {
        $investor = Investor::find($investorId);
        $lastShare = $investor->profitShares()->orderBy('id', 'desc')->first();
        $currentProfit = $lastShare ? (float)$lastShare->profit_amount : 0.0;
        $growthRate = $this->getAverageProfitGrowthRate($investorId);

        $nextMonth = $currentProfit * (1 + $growthRate);
        
        // Compound for Quarter (3 months)
        $q1 = $nextMonth;
        $q2 = $q1 * (1 + $growthRate);
        $q3 = $q2 * (1 + $growthRate);
        $nextQuarter = $q1 + $q2 + $q3;

        // Compound for 6 months
        $q4 = $q3 * (1 + $growthRate);
        $q5 = $q4 * (1 + $growthRate);
        $q6 = $q5 * (1 + $growthRate);
        $next6Months = $q1 + $q2 + $q3 + $q4 + $q5 + $q6;

        // Yearly (Simple projection from next month trend)
        $nextYear = $nextMonth * 12 * (1 + $growthRate);

        return [
            'expected' => [
                'next_month' => round($nextMonth, 2),
                'next_quarter' => round($nextQuarter, 2),
                'next_6_months' => round($next6Months, 2),
                'next_year' => round($nextYear, 2),
                'growth_rate' => round($growthRate * 100, 2),
            ],
            'conservative' => [
                'next_month' => round($nextMonth * 0.85, 2),
                'next_quarter' => round($nextQuarter * 0.85, 2),
                'next_6_months' => round($next6Months * 0.85, 2),
                'next_year' => round($nextYear * 0.85, 2),
            ],
            'optimistic' => [
                'next_month' => round($nextMonth * 1.15, 2),
                'next_quarter' => round($nextQuarter * 1.15, 2),
                'next_6_months' => round($next6Months * 1.15, 2),
                'next_year' => round($nextYear * 1.15, 2),
            ]
        ];
    }

    public function getHistoricalAndProjectedChartData(int $investorId): array
    {
        $history = InvestorProfitShare::where('investor_id', $investorId)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function($share) {
                return [
                    'period' => $share->distribution->distribution_period,
                    'amount' => (float)$share->profit_amount,
                    'type' => 'historical'
                ];
            });

        if ($history->isEmpty()) {
            return [];
        }

        $lastAmount = $history->last()['amount'];
        $growthRate = $this->getAverageProfitGrowthRate($investorId);
        $lastPeriod = Carbon::parse($history->last()['period'] . '-01');

        $projections = [];
        $currentAmount = $lastAmount;
        for ($i = 1; $i <= 6; $i++) {
            $currentAmount = $currentAmount * (1 + $growthRate);
            $projections[] = [
                'period' => $lastPeriod->copy()->addMonths($i)->format('Y-m'),
                'amount' => round($currentAmount, 2),
                'type' => 'projected',
                'min' => round($currentAmount * 0.85, 2),
                'max' => round($currentAmount * 1.15, 2),
            ];
        }

        return $history->concat($projections)->toArray();
    }

    public function getBusinessROIStats(): array
    {
        $distributions = ProfitDistribution::orderBy('id', 'desc')->take(6)->get();
        
        if ($distributions->isEmpty()) {
            return [
                'avg_monthly_profit' => 0,
                'total_business_capital' => InvestorCapitalAccount::sum('current_capital'),
                'avg_roi_percent' => 0
            ];
        }

        $avgProfit = $distributions->avg('total_business_profit');
        $currentCapital = InvestorCapitalAccount::sum('current_capital');
        
        $roiPercent = $currentCapital > 0 ? ($avgProfit / $currentCapital) * 100 : 0;

        return [
            'avg_monthly_profit' => (float)$avgProfit,
            'total_business_capital' => (float)$currentCapital,
            'avg_roi_percent' => round($roiPercent, 2)
        ];
    }
}
