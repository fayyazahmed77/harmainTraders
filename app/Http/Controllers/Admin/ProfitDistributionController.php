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
            'total_profit' => 'required|numeric|min:0',
        ]);

        app(ProfitDistributionService::class)->distributeProfit($request->period, $request->total_profit);

        return back()->with('success', 'Profit distributed successfully for ' . $request->period);
    }
}
