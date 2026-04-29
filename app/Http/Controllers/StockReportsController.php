<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Items;
use App\Models\ItemCategory;
use App\Models\Areas;
use App\Services\StockReportBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class StockReportsController extends Controller
{
    protected $reportBuilder;

    public function __construct(StockReportBuilder $reportBuilder)
    {
        $this->reportBuilder = $reportBuilder;
    }

    public function index()
    {
        return Inertia::render('reports/stock/index', [
            'items' => Items::select('id', 'title')->orderBy('title')->get(),
            'companies' => Account::where('type', function($q) {
                $q->select('id')->from('account_types')->where('name', 'Suppliers');
            })->select('id', 'title')->orderBy('title')->get(),
            'categories' => ItemCategory::select('id', 'name as title')->orderBy('name')->get(),
            'firms' => DB::table('firms')->select('id', 'name as title')->get(),
        ]);
    }

    public function data(Request $request)
    {
        $data = $this->reportBuilder->calculate($request->reportId, $request->all());
        
        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    public function exportPdf(Request $request)
    {
        $data = $this->reportBuilder->calculate($request->reportId, $request->all());
        $title = collect(config('stock_reports', []))
            ->where('id', $request->reportId)
            ->first()['title'] ?? 'Stock Report';

        $view = "pdf.stock.types.{$request->reportId}";
        if (!view()->exists($view)) {
            $view = "pdf.stock.types.summary";
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
            'data' => $data,
            'title' => $title,
            'valuation' => $request->valuation ?? 'last_purchase',
            'fromDate' => $request->fromDate,
            'toDate' => $request->toDate,
            'params' => $request->all(),
        ]);

        return $pdf->stream("stock_report_{$request->reportId}.pdf");
    }

    public function exportExcel(Request $request)
    {
        $data = $this->reportBuilder->calculate($request->reportId, $request->all());
        
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\StockReportExport(
                $data, 
                $request->reportId, 
                $request->valuation ?? 'last_purchase',
                $request->fromDate,
                $request->toDate,
                $request->all()
            ), 
            "stock_report_{$request->reportId}.xlsx"
        );
    }
}
