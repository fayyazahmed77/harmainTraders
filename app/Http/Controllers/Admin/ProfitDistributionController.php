<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ProfitDistributionService;
use App\Services\ProfitReportBuilder;
use App\Models\ProfitDistribution;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ProfitDistributionController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/profit/distribute', [
            'distributions' => ProfitDistribution::with('distributedBy')->orderBy('id', 'desc')->get(),
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'period' => 'required|date_format:Y-m',
        ]);

        $period = $request->period;

        // Check if already settled
        if (ProfitDistribution::where('distribution_period', $period)->exists()) {
            return response()->json([
                'message' => "Settlement already finalized for $period",
                'is_settled' => true
            ], 422);
        }
        
        // Get net profit from existing report builder
        $reportBuilder = app(ProfitReportBuilder::class);
        $monthData = $reportBuilder->monthWiseProfit(); // Returns array of month data
        
        $formattedPeriod = \Carbon\Carbon::parse($period . '-01')->format('M Y');
        $monthProfit = collect($monthData)->firstWhere('month', strtoupper($formattedPeriod));
        
        $netProfit = $monthProfit ? (float)$monthProfit['net_profit'] : 0.0;

        $service = app(ProfitDistributionService::class);
        return response()->json($service->calculateMonthlyDistribution($period, $netProfit));
    }

    public function distribute(Request $request)
    {
        $request->validate([
            'period' => 'required|date_format:Y-m',
            'total_profit' => 'required|numeric',
            'use_report_profit' => 'nullable|boolean',
        ]);

        $period = $request->period;

        if (ProfitDistribution::where('distribution_period', $period)->exists()) {
            return back()->withErrors(['period' => "Distribution for $period has already been processed."]);
        }

        $totalProfit = (float)$request->total_profit;

        if ($request->use_report_profit) {
            $reportBuilder = app(ProfitReportBuilder::class);
            $monthData = $reportBuilder->monthWiseProfit();
            $formattedPeriod = \Carbon\Carbon::parse($period . '-01')->format('M Y');
            $monthProfit = collect($monthData)->firstWhere('month', strtoupper($formattedPeriod));
            
            if ($monthProfit) {
                $totalProfit = (float)$monthProfit['net_profit'];
            }
        }

        app(ProfitDistributionService::class)->distributeProfit($period, $totalProfit);

        $type = $totalProfit >= 0 ? 'Profit' : 'Loss';
        return back()->with('success', "Business $type of PKR " . number_format(abs($totalProfit)) . " distributed successfully for " . $period);
    }
}
