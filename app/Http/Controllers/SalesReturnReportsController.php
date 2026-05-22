<?php

namespace App\Http\Controllers;

use App\Services\SalesReturnReportBuilder;
use App\Models\Account;
use App\Models\Firm;
use App\Models\Saleman;
use App\Models\Areas;
use App\Models\Items;
use App\Models\ItemCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesReturnReportExport;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SalesReturnReportsController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view reports'),
        ];
    }

    protected $returnBuilder;

    public function __construct(SalesReturnReportBuilder $returnBuilder)
    {
        $this->returnBuilder = $returnBuilder;
    }

    public function index()
    {
        return Inertia::render('reports/sales-return/index', [
            'customers' => Account::where('sale', 1)->select('id', 'title', 'code')->get(),
            'items' => Items::select('id', 'title', 'code')->get(),
            'firms' => Firm::select('id', 'name')->get(),
            'salesmen' => Saleman::select('id', 'name')->get(),
            'areas' => Areas::select('id', 'name')->get(),
            'sub_areas' => \App\Models\Subarea::select('id', 'name')->get(),
            'categories' => ItemCategory::select('id', 'name as title')->orderBy('name')->get(),
            'users' => \App\Models\User::select('id', 'name')->get(),
            'companies' => Account::where('type', 5)->select('id', 'title')->orderBy('title')->get(),
        ]);
    }

    public function getData(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->returnBuilder->calculate($params['reportId'] ?? 'bill', $params);

        return response()->json(['data' => $data]);
    }

    public function exportPdf(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->returnBuilder->calculate($params['reportId'] ?? 'bill', $params);
        $reportId = $params['reportId'] ?? 'bill';

        $viewPath = "pdf.sales-return.types.{$reportId}";
        if (!view()->exists($viewPath)) {
            $viewPath = 'pdf.sales-return.types.default';
        }

        $pdf = PDF::loadView($viewPath, [
            'data' => $data,
            'params' => $params,
            'type' => $reportId,
            'title' => $this->getReportTitle($reportId),
            'logo_base64' => $this->getLogoBase64()
        ]);

        $orientation = 'portrait';
        $pdf->setPaper('a4', $orientation);
        return $pdf->stream('sales_return_report_' . date('Ymd_His') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->returnBuilder->calculate($params['reportId'] ?? 'bill', $params);
        $reportId = $params['reportId'] ?? 'bill';

        return Excel::download(
            new SalesReturnReportExport($data, $reportId, $params, $this->getReportTitle($reportId)), 
            'sales_return_report_' . $reportId . '_' . date('Ymd_His') . '.xlsx'
        );
    }

    private function getLogoBase64()
    {
        $logo_path = public_path('storage/img/favicon.png');
        if (!file_exists($logo_path)) {
            $logo_path = storage_path('app/public/img/favicon.png');
        }

        if (file_exists($logo_path)) {
            $logo_data = file_get_contents($logo_path);
            $logo_type = pathinfo($logo_path, PATHINFO_EXTENSION);
            return 'data:image/' . $logo_type . ';base64,' . base64_encode($logo_data);
        }
        return null;
    }

    private function getReportTitle($id)
    {
        $titles = [
            'area_item_party' => 'Area Wise Item Party Summary',
            'bill' => 'Bill Wise',
            'details_wise' => 'Details Wise',
            'detail' => 'Detail',
            'item_summary' => 'Item Wise Summary',
            'month' => 'Month Wise',
        ];
        return $titles[$id] ?? strtoupper(str_replace('_', ' ', $id));
    }
}
