<?php

namespace App\Http\Controllers;

use App\Services\PurchaseReportBuilder;
use App\Models\Account;
use App\Models\Firm;
use App\Models\Areas;
use App\Models\Subarea;
use App\Models\ItemCategory;
use App\Models\Saleman;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PurchaseReportExport;

class PurchaseReportsController extends Controller
{
    protected $purchaseBuilder;

    public function __construct(PurchaseReportBuilder $purchaseBuilder)
    {
        $this->purchaseBuilder = $purchaseBuilder;
    }

    public function index()
    {
        return Inertia::render('reports/purchase/index', [
            'accounts' => Account::where('purchase', 1)->select('id', 'title', 'code')->get(),
            'items' => \App\Models\Items::select('id', 'title', 'code')->get(),
            'firms' => Firm::select('id', 'name')->get(),
            'areas' => Areas::select('id', 'name')->get(),
            'sub_areas' => Subarea::select('id', 'name')->get(),
            'categories' => ItemCategory::select('id', 'name as title')->orderBy('name')->get(),
            'salesmen' => Saleman::select('id', 'name')->get(),
            'users' => User::select('id', 'name')->get(),
        ]);
    }

    public function getData(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->purchaseBuilder->calculate($params['reportId'] ?? 'transaction', $params);

        return response()->json(['data' => $data]);
    }

    public function exportPdf(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->purchaseBuilder->calculate($params['reportId'] ?? 'transaction', $params);
        $reportId = $params['reportId'] ?? 'transaction';

        $totals = [
            'amount' => collect($data)->sum('amount') ?: collect($data)->sum('total_amount'),
            'qty' => collect($data)->sum('qty') ?: collect($data)->sum('total_qty'),
        ];

        $viewPath = "pdf.purchase.types.{$reportId}";
        if (!view()->exists($viewPath)) {
            $viewPath = 'pdf.purchase.layout'; // Safety
        }

        $pdf = PDF::loadView($viewPath, [
            'data' => $data,
            'params' => $params,
            'type' => $reportId,
            'totals' => $totals
        ]);

        $orientation = in_array($reportId, ['details', 'bill', 'payment']) ? 'landscape' : 'portrait';
        $pdf->setPaper('a4', $orientation);
        return $pdf->stream('purchase_report_' . date('Ymd_His') . '.pdf');
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

        $data = $this->purchaseBuilder->calculate($params['reportId'] ?? 'transaction', $params);
        $reportId = $params['reportId'] ?? 'transaction';

        return Excel::download(
            new PurchaseReportExport($data, $reportId), 
            'purchase_report_' . $reportId . '_' . date('Ymd_His') . '.xlsx'
        );
    }
}
