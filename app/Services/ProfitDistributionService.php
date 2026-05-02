<?php

namespace App\Services;

use App\Models\Investor;
use App\Models\InvestorCapitalAccount;
use App\Models\ProfitDistribution;
use App\Models\InvestorProfitShare;
use App\Models\InvestorTransaction;
use App\Models\CapitalHistory;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProfitDistributionService
{
    /**
     * Preview profit distribution for a given period.
     */
    public function calculateMonthlyDistribution(string $period, float $totalProfit): array
    {
        $investors = Investor::where('status', 'active')->get();
        $previews = [];
        $totalWeightedCapital = 0;

        foreach ($investors as $investor) {
            $weightedCapital = $this->getWeightedCapital($investor, $period);
            $previews[$investor->id] = [
                'investor' => $investor,
                'weighted_capital' => $weightedCapital,
            ];
            $totalWeightedCapital += $weightedCapital;
        }

        $result = [];
        foreach ($previews as $id => $data) {
            $ownership = $totalWeightedCapital > 0 ? ($data['weighted_capital'] / $totalWeightedCapital) * 100 : 0;
            $profitShare = ($totalProfit * $ownership) / 100;

            $result[] = [
                'investor_id' => $id,
                'name' => $data['investor']->full_name,
                'weighted_capital' => round($data['weighted_capital'], 2),
                'ownership_percentage' => round($ownership, 2),
                'profit_share' => round($profitShare, 2),
            ];
        }

        return [
            'period' => $period,
            'total_profit' => $totalProfit,
            'total_capital' => $totalWeightedCapital,
            'investors' => $result
        ];
    }

    public function distributeProfit(string $period, float $totalProfit): void
    {
        DB::transaction(function () use ($period, $totalProfit) {
            $preview = $this->calculateMonthlyDistribution($period, $totalProfit);
            $type = $totalProfit >= 0 ? 'profit' : 'loss';

            $distribution = ProfitDistribution::create([
                'distribution_period' => $period,
                'total_business_profit' => $totalProfit,
                'total_business_capital' => $preview['total_capital'],
                'distributed_at' => now(),
                'distributed_by' => auth()->id(),
                'status' => 'distributed',
                'notes' => $totalProfit < 0 ? 'Business loss distribution' : 'Business profit distribution',
            ]);

            foreach ($preview['investors'] as $item) {
                $investor = Investor::find($item['investor_id']);
                
                // 1. Create Profit/Loss Share record
                $share = InvestorProfitShare::create([
                    'distribution_id' => $distribution->id,
                    'investor_id' => $investor->id,
                    'capital_snapshot' => $item['weighted_capital'],
                    'ownership_snapshot' => $item['ownership_percentage'],
                    'profit_amount' => $item['profit_share'], // Can be negative
                    'status' => 'credited',
                    'credited_at' => now(),
                    'calculation_meta' => json_encode([
                        'formula' => "(InvestorWeightedCapital / TotalWeightedCapital) * TotalProfit",
                        'investor_weighted' => $item['weighted_capital'],
                        'total_weighted' => $preview['total_capital'],
                        'total_profit' => $totalProfit
                    ])
                ]);

                // 2. Add to Investor Balance Ledger
                $balanceBefore = app(InvestorCapitalService::class)->getAvailableBalance($investor->id);
                $isCredit = $item['profit_share'] >= 0;
                
                InvestorTransaction::create([
                    'investor_id' => $investor->id,
                    'type' => $isCredit ? 'profit_credit' : 'loss_debit',
                    'amount' => abs($item['profit_share']),
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceBefore + $item['profit_share'], // Works for negative share
                    'reference_id' => $share->id,
                    'reference_type' => 'InvestorProfitShare',
                    'narration' => ($isCredit ? "Profit credit" : "Loss debit") . " for period " . $period,
                    'created_by' => auth()->id(),
                ]);
            }
        });
    }

    /**
     * Calculates weighted capital for an investor in a period.
     * Pro-rata for reinvestments, snapshot for others.
     */
    public function getWeightedCapital(Investor $investor, string $period): float
    {
        $startDate = Carbon::parse($period . '-01')->startOfMonth();
        $endDate = Carbon::parse($period . '-01')->endOfMonth();
        $totalDays = $startDate->daysInMonth;

        // Initial capital at start of month
        $initialCapital = CapitalHistory::where('investor_id', $investor->id)
            ->where('effective_date', '<', $startDate)
            ->orderBy('effective_date', 'desc')
            ->first()?->capital_after ?? $investor->capitalAccount->initial_capital;

        // Reinvestments in this month (weighted)
        $changes = CapitalHistory::where('investor_id', $investor->id)
            ->whereBetween('effective_date', [$startDate, $endDate])
            ->where('event_type', 'reinvestment')
            ->orderBy('effective_date', 'asc')
            ->get();

        if ($changes->isEmpty()) {
            return $initialCapital;
        }

        $weightedSum = 0;
        $currentCapital = $initialCapital;
        $lastDate = $startDate;

        foreach ($changes as $change) {
            $days = $lastDate->diffInDays($change->effective_date);
            $weightedSum += $currentCapital * $days;
            $currentCapital = $change->capital_after;
            $lastDate = $change->effective_date;
        }

        $days = $lastDate->diffInDays($endDate) + 1;
        $weightedSum += $currentCapital * $days;

        return $weightedSum / $totalDays;
    }

    public function getDailyEstimate(int $investorId): float
    {
        $investor = Investor::find($investorId);
        $lastShare = $investor->profitShares()->orderBy('id', 'desc')->first();
        
        if (!$lastShare) return 0.0;

        $daysInMonth = Carbon::now()->daysInMonth;
        return (float)$lastShare->profit_amount / $daysInMonth;
    }

    public function getYearlyProjection(int $investorId): float
    {
        $investor = Investor::find($investorId);
        $lastShare = $investor->profitShares()->orderBy('id', 'desc')->first();
        
        if (!$lastShare) return 0.0;

        return (float)$lastShare->profit_amount * 12;
    }
}
