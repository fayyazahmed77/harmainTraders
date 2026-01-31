<?php

namespace App\Http\Controllers;

use App\Services\ReportBuilder;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PurchaseReportExport;

class ReportsController extends Controller
{
    protected $reportBuilder;

    public function __construct(ReportBuilder $reportBuilder)
    {
        $this->reportBuilder = $reportBuilder;
    }

    public function index()
    {
        return Inertia::render('reports/index');
    }

    public function accountLedger(Request $request)
    {
        if ($request->wantsJson()) {
            $validated = $request->validate([
                'account_id' => 'required|exists:accounts,id',
                'from' => 'nullable|date',
                'to' => 'nullable|date',
            ]);

            $data = $this->reportBuilder->accountLedger(
                $validated['account_id'],
                $validated['from'] ?? null,
                $validated['to'] ?? null,
                $request->input('per_page', 50)
            );

            return response()->json($data);
        }

        return Inertia::render('reports/accounts/ledger', [
            'accounts' => Account::select('id', 'title')->get()
        ]);
    }

    public function accountLedgerExportPdf(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        // Get fresh account data for the header title
        $account = Account::findOrFail($validated['account_id']);

        // Fetch ALL records for the PDF (no pagination limit effectively)
        // We pass a large number for perPage to get a full report
        $data = $this->reportBuilder->accountLedger(
            $validated['account_id'],
            $validated['from'] ?? null,
            $validated['to'] ?? null,
            10000
        );

        $pdfData = [
            'account' => $account,
            'data' => $data['data'], // Pagination object items
            'opening_balance' => $data['opening_balance'],
            'total_debit' => $data['total_debit'],
            'total_credit' => $data['total_credit'],
            'closing_balance' => $data['closing_balance'],
            'balance_type' => $data['balance_type'],
            'from_date' => $data['from_date'],
            'to_date' => $data['to_date']
        ];

        $pdf = PDF::loadView('pdf.account-ledger', $pdfData);

        return $pdf->download('ledger-' . $account->title . '-' . date('d-M-Y') . '.pdf');
    }

    public function accountLedgerPrint(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $account = Account::findOrFail($validated['account_id']);

        $data = $this->reportBuilder->accountLedger(
            $validated['account_id'],
            $validated['from'] ?? null,
            $validated['to'] ?? null,
            10000
        );

        $pdfData = [
            'account' => $account,
            'data' => $data['data'],
            'opening_balance' => $data['opening_balance'],
            'total_debit' => $data['total_debit'],
            'total_credit' => $data['total_credit'],
            'closing_balance' => $data['closing_balance'],
            'balance_type' => $data['balance_type'],
            'from_date' => $data['from_date'],
            'to_date' => $data['to_date'],
            'is_print_mode' => true
        ];

        return view('pdf.account-ledger', $pdfData);
    }

    public function stockStatus(Request $request)
    {
        if ($request->wantsJson()) {
            $data = $this->reportBuilder->stockStatus($request);
            return response()->json($data);
        }
        return Inertia::render('reports/stock/status');
    }

    public function stockLedger(Request $request)
    {
        if ($request->wantsJson()) {
            $validated = $request->validate([
                'item_id' => 'required|exists:items,id',
                'from' => 'nullable|date',
                'to' => 'nullable|date',
            ]);

            $data = $this->reportBuilder->stockLedger(
                $validated['item_id'],
                $validated['from'] ?? null,
                $validated['to'] ?? null
            );
            return response()->json($data);
        }

        return Inertia::render('reports/stock/ledger', [
            'items' => \App\Models\Items::select('id', 'title')->get()
        ]);
    }

    public function profit(Request $request)
    {
        if ($request->wantsJson()) {
            $data = $this->reportBuilder->profit($request);
            return response()->json($data);
        }
        return Inertia::render('reports/profit/index');
    }

    public function audit(Request $request)
    {
        if ($request->wantsJson()) {
            $data = $this->reportBuilder->audit($request);
            return response()->json($data);
        }

        return Inertia::render('reports/audit/index', [
            'users' => \App\Models\User::select('id', 'name')->get(),
            'modules' => ['Sales', 'Purchase', 'Items', 'Payment', 'Account'],
            'actions' => ['created', 'updated', 'deleted']
        ]);
    }

    public function purchase(Request $request)
    {
        if ($request->wantsJson()) {
            $data = $this->reportBuilder->purchaseReport($request);
            return response()->json($data);
        }

        return Inertia::render('reports/purchase/index', [
            'suppliers' => Account::where('purchase', 1)->select('id', 'title')->get()
        ]);
    }

    public function purchaseExportPdf(Request $request)
    {
        $data = $this->reportBuilder->purchaseReport($request);

        $pdf = PDF::loadView('pdf.purchase-report', $data);

        return $pdf->download('purchase-report-' . date('Y-m-d') . '.pdf');
    }

    public function purchaseExportExcel(Request $request)
    {
        $data = $this->reportBuilder->purchaseReport($request);

        return Excel::download(
            new PurchaseReportExport($data),
            'purchase-report-' . date('Y-m-d') . '.xlsx'
        );
    }

    public function purchaseReturn(Request $request)
    {
        if ($request->wantsJson()) {
            $data = $this->reportBuilder->purchaseReturnReport($request);
            return response()->json($data);
        }

        return Inertia::render('reports/purchase-return/index', [
            'suppliers' => Account::where('purchase', 1)->select('id', 'title')->get()
        ]);
    }

    public function purchaseReturnExportPdf(Request $request)
    {
        $data = $this->reportBuilder->purchaseReturnReport($request);

        $pdf = PDF::loadView('pdf.purchase-return-report', $data);

        return $pdf->download('purchase-return-report-' . date('Y-m-d') . '.pdf');
    }

    public function purchaseReturnExportExcel(Request $request)
    {
        $data = $this->reportBuilder->purchaseReturnReport($request);

        return Excel::download(
            new \App\Exports\PurchaseReturnReportExport($data),
            'purchase-return-report-' . date('Y-m-d') . '.xlsx'
        );
    }

    public function sales(Request $request)
    {
        if ($request->wantsJson()) {
            $data = $this->reportBuilder->salesReport($request);
            return response()->json($data);
        }

        return Inertia::render('reports/sales/index', [
            'customers' => Account::where('sale', 1)->select('id', 'title')->get()
        ]);
    }

    public function salesExportPdf(Request $request)
    {
        $data = $this->reportBuilder->salesReport($request);

        $pdf = PDF::loadView('pdf.sales-report', $data);

        return $pdf->download('sales-report-' . date('Y-m-d') . '.pdf');
    }

    public function salesExportExcel(Request $request)
    {
        $data = $this->reportBuilder->salesReport($request);

        return Excel::download(
            new \App\Exports\SalesReportExport($data),
            'sales-report-' . date('Y-m-d') . '.xlsx'
        );
    }

    public function salesReturn(Request $request)
    {
        if ($request->wantsJson()) {
            $data = $this->reportBuilder->salesReturnReport($request);
            return response()->json($data);
        }

        return Inertia::render('reports/sales-return/index', [
            'customers' => Account::where('sale', 1)->select('id', 'title')->get()
        ]);
    }

    public function salesReturnExportPdf(Request $request)
    {
        $data = $this->reportBuilder->salesReturnReport($request);

        $pdf = PDF::loadView('pdf.sales-return-report', $data);

        return $pdf->download('sales-return-report-' . date('Y-m-d') . '.pdf');
    }

    public function salesReturnExportExcel(Request $request)
    {
        $data = $this->reportBuilder->salesReturnReport($request);

        return Excel::download(
            new \App\Exports\SalesReturnReportExport($data),
            'sales-return-report-' . date('Y-m-d') . '.xlsx'
        );
    }
}
