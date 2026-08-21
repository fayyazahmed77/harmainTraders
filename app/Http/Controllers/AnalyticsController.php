<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsReportBuilder;
use App\Models\Account;
use App\Models\ItemCategory;
use App\Models\Items;
use App\Models\Saleman;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    protected $analyticsBuilder;

    public function __construct(AnalyticsReportBuilder $analyticsBuilder)
    {
        $this->analyticsBuilder = $analyticsBuilder;
    }

    public function index(Request $request)
    {
        $reportType = $request->input('reportType', 'sales');
        $fromDate = $request->input('fromDate', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $toDate = $request->input('toDate', Carbon::now()->format('Y-m-d'));

        $params = array_merge($request->all(), [
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'reportType' => $reportType,
        ]);

        $analyticsData = $this->analyticsBuilder->calculate($reportType, $params);

        // Fetch Dropdown Filter Options
        $companies = Account::whereHas('accountType', function ($q) {
            $q->where('name', 'Company');
        })
        ->orWhere('type', 5)
        ->select('id', 'title')
        ->orderBy('title')
        ->get();

        $customers = Account::where('sale', 1)
            ->select('id', 'title')
            ->orderBy('title')
            ->get();

        $suppliers = Account::where('purchase', 1)
            ->orWhere('type', 6)
            ->select('id', 'title')
            ->orderBy('title')
            ->get();

        $categories = ItemCategory::select('id', 'name as title')->orderBy('name')->get();
        $firms = DB::table('firms')->select('id', 'name as title')->get();
        $items = Items::select('id', 'code', 'title')->orderBy('title')->get();
        $salesmen = Saleman::select('id', 'name as title')->orderBy('name')->get();

        return Inertia::render('reports/analytics/index', [
            'initialAnalytics' => $analyticsData,
            'filters' => [
                'reportType' => $reportType,
                'fromDate' => $fromDate,
                'toDate' => $toDate,
                'companyId' => $request->input('companyId', 'ALL'),
                'categoryId' => $request->input('categoryId', 'ALL'),
                'firmId' => $request->input('firmId', 'ALL'),
                'customerId' => $request->input('customerId', 'ALL'),
                'supplierId' => $request->input('supplierId', 'ALL'),
                'itemId' => $request->input('itemId', 'ALL'),
                'salesmanId' => $request->input('salesmanId', 'ALL'),
            ],
            'companies' => $companies,
            'customers' => $customers,
            'suppliers' => $suppliers,
            'categories' => $categories,
            'firms' => $firms,
            'items' => $items,
            'salesmen' => $salesmen,
        ]);
    }

    public function data(Request $request)
    {
        $reportType = $request->input('reportType', 'sales');
        $data = $this->analyticsBuilder->calculate($reportType, $request->all());

        return response()->json($data);
    }
}
