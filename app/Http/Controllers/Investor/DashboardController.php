<?php

namespace App\Http\Controllers\Investor;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\InvestorTransaction;
use App\Models\InvestorProfitShare;
use App\Models\SiteSetting;
use App\Models\Firm;
use App\Services\InvestorCapitalService;
use App\Services\ProfitDistributionService;
use App\Services\ForecastEngine;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $investor = Investor::where('user_id', $user->id)->with('capitalAccount')->firstOrFail();
        
        $capitalService = app(InvestorCapitalService::class);
        $distributionService = app(ProfitDistributionService::class);
        $forecastEngine = app(ForecastEngine::class);

        return Inertia::render('investor/dashboard/index', [
            'investor' => [
                'id' => $investor->id,
                'name' => $investor->full_name,
                'status' => $investor->status,
                'joining_date' => $investor->joining_date->format('Y-m-d'),
            ],
            'stats' => [
                'current_capital' => (float)$investor->capitalAccount->current_capital,
                'initial_capital' => (float)$investor->capitalAccount->initial_capital,
                'ownership_percentage' => (float)$investor->capitalAccount->ownership_percentage,
                'available_balance' => $capitalService->getAvailableBalance($investor->id),
                'daily_estimate' => $distributionService->getDailyEstimate($investor->id),
                'yearly_projection' => $distributionService->getYearlyProjection($investor->id),
                'last_month_profit' => $investor->profitShares()->orderBy('id', 'desc')->first()?->profit_amount ?? 0,
            ],
            'charts' => [
                'profit_history' => $forecastEngine->getHistoricalAndProjectedChartData($investor->id),
            ],
            'business_stats' => $forecastEngine->getBusinessROIStats(),
            'requests' => [
                'pending' => $investor->financialRequests()->where('status', 'pending')->get(),
            ]
        ]);
    }

    public function profitHistory(Request $request)
    {
        $investor = Investor::where('user_id', $request->user()->id)->firstOrFail();
        $shares = $investor->profitShares()
            ->with('distribution')
            ->orderBy('id', 'desc')
            ->paginate(10);

        return Inertia::render('investor/profit/history', [
            'shares' => $shares
        ]);
    }

    public function transactions(Request $request)
    {
        $investor = Investor::where('user_id', $request->user()->id)->firstOrFail();
        $transactions = $investor->transactions()
            ->orderBy('id', 'desc')
            ->paginate(20);

        return Inertia::render('investor/transactions/index', [
            'transactions' => $transactions
        ]);
    }

    public function exportPdf(Request $request)
    {
        $investor = Investor::where('user_id', $request->user()->id)->with(['capitalAccount', 'transactions'])->firstOrFail();
        $firm = Firm::where('defult', 1)->first() ?? Firm::first();

        $pdf = PDF::loadView('pdf.investor-ledger', [
            'investor' => $investor,
            'transactions' => $investor->transactions,
            'firm' => $firm,
            'is_print_mode' => false
        ]);

        return $pdf->download('my-investor-ledger.pdf');
    }

    public function downloadMonthlyReport(Request $request, string $period)
    {
        $investor = Investor::where('user_id', $request->user()->id)->with(['capitalAccount'])->firstOrFail();
        
        $startDate = Carbon::parse($period . '-01')->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Profit for the month
        $profitShare = InvestorProfitShare::where('investor_id', $investor->id)
            ->whereHas('distribution', function($q) use ($period) {
                $q->where('distribution_period', $period);
            })->first();

        $profitAmount = $profitShare ? (float)$profitShare->profit_amount : 0.0;

        // Transactions in this period
        $transactions = InvestorTransaction::where('investor_id', $investor->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        // Calculate opening balance (based on first transaction of the month or last of previous)
        $firstTx = $transactions->first();
        if ($firstTx) {
            $openingBalance = (float)$firstTx->balance_before;
        } else {
            $lastPrevTx = InvestorTransaction::where('investor_id', $investor->id)
                ->where('created_at', '<', $startDate)
                ->orderBy('created_at', 'desc')
                ->first();
            $openingBalance = $lastPrevTx ? (float)$lastPrevTx->balance_after : 0.0;
        }

        // Closing balance
        $lastTx = $transactions->last();
        $closingBalance = $lastTx ? (float)$lastTx->balance_after : $openingBalance;

        $settings = SiteSetting::first();

        $pdf = PDF::loadView('pdf.monthly-performance-report', [
            'investor' => $investor,
            'period' => $period,
            'period_formatted' => $startDate->format('F Y'),
            'period_start' => $startDate->format('d M Y'),
            'period_end' => $endDate->format('d M Y'),
            'logo' => $settings->logo_path ?? null,
            'stats' => [
                'opening_capital' => (float)$investor->capitalAccount->current_capital, // Simplified for now
                'profit_earned' => $profitAmount,
                'roi' => $investor->capitalAccount->current_capital > 0 ? round(($profitAmount / $investor->capitalAccount->current_capital) * 100, 2) : 0,
                'closing_balance' => $closingBalance,
            ],
            'transactions' => $transactions,
        ]);

        return $pdf->download("performance-report-{$period}.pdf");
    }
}
