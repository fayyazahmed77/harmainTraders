<?php

namespace App\Http\Controllers;

use App\Services\SalesReportBuilder;
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
use App\Exports\SalesReportExport;

class SalesReportsController extends Controller
{
    protected $salesBuilder;

    public function __construct(SalesReportBuilder $salesBuilder)
    {
        $this->salesBuilder = $salesBuilder;
    }

    public function index()
    {
        return Inertia::render('reports/sales/index', [
            'customers' => Account::where('sale', 1)->select('id', 'title', 'code')->get(),
            'items' => Items::select('id', 'title', 'code')->get(),
            'firms' => Firm::select('id', 'name')->get(),
            'salesmen' => Saleman::select('id', 'name')->get(),
            'areas' => Areas::select('id', 'name')->get(),
            'categories' => ItemCategory::select('id', 'name as title')->orderBy('name')->get(),
        ]);
    }

    public function getData(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->salesBuilder->calculate($params['reportId'] ?? 'bill', $params);

        return response()->json(['data' => $data]);
    }

    public function exportPdf(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->salesBuilder->calculate($params['reportId'] ?? 'bill', $params);
        $reportId = $params['reportId'] ?? 'bill';

        $viewPath = "pdf.sales.types.{$reportId}";
        if (!view()->exists($viewPath)) {
            $viewPath = 'pdf.sales.types.default';
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
        return $pdf->stream('sales_report_' . date('Ymd_His') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->salesBuilder->calculate($params['reportId'] ?? 'bill', $params);
        $reportId = $params['reportId'] ?? 'bill';

        return Excel::download(
            new SalesReportExport($data, $reportId, $params, $this->getReportTitle($reportId)), 
            'sales_report_' . $reportId . '_' . date('Ymd_His') . '.xlsx'
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
            'area_party' => 'Area Wise Party Summary',
            'bill' => 'Bill Wise',
            'details_wise' => 'Details Wise',
            'detail' => 'Detail',
            'invoice_details' => 'Invoice Details',
            'item_party' => 'Item Party Wise Summary',
            'item_summary' => 'Item Wise Summary',
            'month' => 'Month Wise',
            'month_amount' => 'Month Wise Amount Summary',
            'month_qty' => 'Month Wise Qty Summary',
            'party_summary' => 'Party Wise Summary',
            'recovery' => 'Sales and Recovery Summary',
            'company' => 'Sales Summary Company Wise',
            'salesman' => 'Salesman Wise Summary',
        ];
        return $titles[$id] ?? strtoupper(str_replace('_', ' ', $id));
    }
}
