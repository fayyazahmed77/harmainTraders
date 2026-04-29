<?php

namespace App\Http\Controllers;

use App\Services\ProfitReportBuilder;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\Firm;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Carbon\Carbon;
use App\Exports\ProfitReportExport;
use Maatwebsite\Excel\Facades\Excel;

class ProfitReportsController extends Controller
{
    protected $profitBuilder;

    public function __construct(ProfitReportBuilder $profitBuilder)
    {
        $this->profitBuilder = $profitBuilder;
    }

    public function index()
    {
        return Inertia::render('reports/profit/index', [
            'accounts' => Account::where('sale', 1)->select('id', 'title', 'code')->get(),
            'items' => \App\Models\Items::select('id', 'title', 'code')->get(),
            'salesmen' => Saleman::select('id', 'name')->get(),
            'firms' => Firm::select('id', 'name')->get(),
            'areas' => \App\Models\Areas::select('id', 'name')->get(),
            'subareas' => \App\Models\Subarea::select('id', 'name', 'area_id')->get(),
            'account_types' => \App\Models\AccountType::select('id', 'name')->get(),
            'account_categories' => \App\Models\AccountCategory::select('id', 'name')->get(),
            'item_categories' => \App\Models\ItemCategory::select('id', 'name')->get(),
            'users' => \App\Models\User::select('id', 'name')->get(),
        ]);
    }

    public function getData(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->profitBuilder->calculate($params['reportId'] ?? 'transaction', $params);

        return response()->json(['data' => $data]);
    }

    public function exportPdf(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->profitBuilder->calculate($params['reportId'] ?? 'transaction', $params);

        $totals = [
            'revenue' => collect($data)->sum('revenue'),
            'cogs' => collect($data)->sum('cogs'),
            'profit' => collect($data)->sum('profit'),
        ];
        $totals['margin'] = $totals['revenue'] > 0 ? ($totals['profit'] / $totals['revenue']) * 100 : 0;

        $reportId = $params['reportId'] ?? 'transaction';
        $viewPath = "pdf.profit.types.{$reportId}";
        
        // Fallback to layout if specific view doesn't exist (safety)
        if (!view()->exists($viewPath)) {
            $viewPath = 'pdf.profit.profit-report';
        }

        $pdf = PDF::loadView($viewPath, [
            'data' => $data,
            'params' => $params,
            'type' => $reportId,
            'totals' => $totals
        ]);

        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('profit_report_' . date('Ymd_His') . '.pdf');
    }

    public function print(Request $request)
    {
        return $this->exportPdf($request);
    }

    public function exportExcel(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->profitBuilder->calculate($params['reportId'] ?? 'transaction', $params);
        $type = $params['reportId'] ?? 'transaction';

        return Excel::download(new ProfitReportExport($data, $type), 'profit_report_' . date('Ymd_His') . '.xlsx');
    }
}
