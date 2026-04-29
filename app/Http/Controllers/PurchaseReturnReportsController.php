<?php

namespace App\Http\Controllers;

use App\Services\PurchaseReturnReportBuilder;
use App\Models\Account;
use App\Models\Firm;
use App\Models\Items;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class PurchaseReturnReportsController extends Controller
{
    protected $returnBuilder;

    public function __construct(PurchaseReturnReportBuilder $returnBuilder)
    {
        $this->returnBuilder = $returnBuilder;
    }

    public function index()
    {
        return Inertia::render('reports/purchase-return/index', [
            'accounts' => Account::where('purchase', 1)->select('id', 'title', 'code')->get(),
            'items' => Items::select('id', 'title', 'code')->get(),
            'firms' => Firm::select('id', 'name')->get(),
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

        $totals = [
            'amount' => collect($data)->sum('amount') ?: collect($data)->sum('net_amount') ?: collect($data)->sum('total_amount'),
            'qty' => collect($data)->sum('qty') ?: collect($data)->sum('total_qty'),
        ];

        $viewPath = "pdf.purchase-return.types.{$reportId}";
        if (!view()->exists($viewPath)) {
            $viewPath = 'pdf.purchase-return.layout';
        }

        $pdf = PDF::loadView($viewPath, [
            'data' => $data,
            'params' => $params,
            'type' => $reportId,
            'totals' => $totals
        ]);

        $orientation = in_array($reportId, ['details']) ? 'landscape' : 'portrait';
        $pdf->setPaper('a4', $orientation);
        return $pdf->stream('purchase_return_report_' . date('Ymd_His') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        $params = $request->all();
        $params['fromDate'] = isset($params['fromDate']) ? Carbon::parse($params['fromDate']) : Carbon::now()->startOfMonth();
        $params['toDate'] = isset($params['toDate']) ? Carbon::parse($params['toDate']) : Carbon::now();

        $data = $this->returnBuilder->calculate($params['reportId'] ?? 'bill', $params);
        $reportId = $params['reportId'] ?? 'bill';

        return Excel::download(
            new \App\Exports\PurchaseReturnReportExport($data, $reportId),
            'purchase_return_report_' . date('Ymd_His') . '.xlsx'
        );
    }


    public function print(Request $request)
    {
        return $this->exportPdf($request);
    }
}
