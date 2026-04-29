<?php

namespace App\Http\Controllers\Investor;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\InvestorTransaction;
use App\Models\Firm;
use App\Services\InvestorCapitalService;
use App\Services\ProfitDistributionService;
use App\Services\ForecastEngine;
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
}
