<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ProfitDistributionService;
use App\Services\ProfitReportBuilder;
use App\Models\ProfitDistribution;
use App\Services\ActivityLogger;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfitDistributionController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/profit/distribute', [
            'distributions' => ProfitDistribution::with('distributedBy', 'lockedBy')->orderBy('id', 'desc')->get(),
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

        ActivityLogger::log('created', 'Profit Distribution', "Distributed profit for period {$period}");

        $type = $totalProfit >= 0 ? 'Profit' : 'Loss';
        return back()->with('success', "Business $type of PKR " . number_format(abs($totalProfit)) . " distributed successfully for " . $period);
    }

    public function lock(ProfitDistribution $distribution)
    {
        $distribution->update([
            'is_locked' => true,
            'locked_at' => now(),
            'locked_by' => Auth::id(),
        ]);

        ActivityLogger::log('updated', 'Financial Period', "Locked financial period: {$distribution->distribution_period}");

        return back()->with('success', "Financial period {$distribution->distribution_period} has been locked.");
    }

    public function unlock(ProfitDistribution $distribution)
    {
        $distribution->update([
            'is_locked' => false,
            'locked_at' => null,
            'locked_by' => null,
        ]);

        ActivityLogger::log('updated', 'Financial Period', "Unlocked financial period: {$distribution->distribution_period}");

        return back()->with('warning', "Financial period {$distribution->distribution_period} has been unlocked for modifications.");
    }
}
