<?php

namespace App\Http\Controllers;

use App\Services\ReportBuilder;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PurchaseReportExport;

use App\Models\Firm;
use App\Models\Saleman;
use App\Models\Areas;
use App\Models\Subarea;
use App\Models\AccountType;
use App\Models\AccountCategory;
use App\Models\User;

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
                'account_id' => 'required', // Relaxed to allow 'ALL'
                'from' => 'nullable|date',
                'to' => 'nullable|date',
            ]);

            $accountId = $validated['account_id'];
            $reportId = strtolower($request->input('reportId') ?? $request->input('report_id') ?? 'ledger');

            if ($reportId === 'accounts_aging') {
                $data = $this->reportBuilder->accountAging($accountId, $validated['to'] ?? null);
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'due_bills') {
                $data = $this->reportBuilder->dueBills($accountId, $validated['to'] ?? null);
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'account_list') {
                $data = Account::with(['accountType', 'area', 'subarea'])->get();
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'outstanding_billwise') {
                $data = $this->reportBuilder->outstandingBillWise(
                    $accountId,
                    $validated['from'] ?? null,
                    $validated['to'] ?? null,
                    $request->all()
                );
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'day_book') {
                $data = $this->reportBuilder->dayBook($validated['from'] ?? null, $validated['to'] ?? null);
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'payment_detail') {
                $data = $this->reportBuilder->paymentDetail(
                    $accountId,
                    $validated['from'] ?? null,
                    $validated['to'] ?? null
                );
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'receiving_detail') {
                $data = $this->reportBuilder->receivingDetail(
                    $accountId,
                    $validated['from'] ?? null,
                    $validated['to'] ?? null
                );
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'receivable') {
                $data = $this->reportBuilder->receivables(
                    $validated['to'] ?? null,
                    $request->all()
                );
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'payable') {
                $data = $this->reportBuilder->payables(
                    $validated['to'] ?? null,
                    $request->all()
                );
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'roznamcha') {
                $data = $this->reportBuilder->roznamcha(
                    $validated['from'] ?? null,
                    $validated['to'] ?? null
                );
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'summary') {
                $data = $this->reportBuilder->summary(
                    $validated['to'] ?? null,
                    $request->all()
                );
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'trial_balance_2col') {
                $data = $this->reportBuilder->trialBalance(
                    $validated['to'] ?? null,
                    $request->all()
                );
                return response()->json(['data' => $data]);
            }

            if ($reportId === 'trial_balance_6col') {
                $data = $this->reportBuilder->trialBalance6Col(
                    $validated['from'] ?? null,
                    $validated['to'] ?? null,
                    $request->all()
                );
                return response()->json(['data' => $data]);
            }

            // If ALL is selected for a standard ledger, we return an empty structure to prevent crashes
            if ($accountId === 'ALL' && ($reportId === 'general_ledger' || $reportId === 'detail_ledger')) {
                 return response()->json([
                    'data' => ['data' => [], 'last_page' => 0],
                    'opening_balance' => 0,
                    'total_debit' => 0,
                    'total_credit' => 0,
                    'closing_balance' => 0,
                    'balance_type' => 'dr'
                 ]);
            }

            if ($reportId === 'detail_ledger') {
                $data = $this->reportBuilder->accountDetailLedger(
                    (int)$accountId,
                    $validated['from'] ?? null,
                    $validated['to'] ?? null,
                    $request->input('per_page', 50)
                );
            } else {
                $data = $this->reportBuilder->accountLedger(
                    (int)$accountId,
                    $validated['from'] ?? null,
                    $validated['to'] ?? null,
                    $request->input('per_page', 50)
                );
            }

            return response()->json($data);
        }

        return Inertia::render('reports/accounts/ledger', [
            'accounts' => Account::with(['accountType', 'area', 'subarea'])
                ->select('id', 'code', 'title', 'type', 'area_id', 'subarea_id')
                ->get(),
            'firms' => Firm::select('id', 'name', 'code')->get(),
            'salesmen' => Saleman::select('id', 'name', 'code')->get(),
            'areas' => Areas::select('id', 'name')->get(),
            'subareas' => Subarea::select('id', 'name', 'area_id')->get(),
            'account_types' => AccountType::select('id', 'name')->get(),
            'account_categories' => AccountCategory::select('id', 'name')->get(),
            'users' => User::select('id', 'name')->get(),
        ]);
    }

    public function dueBillsExportPdf(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'to' => 'nullable|date',
        ]);

        $accountId = $validated['account_id'];
        $account = $accountId !== 'ALL' ? Account::findOrFail($accountId) : null;
        
        $data = $this->reportBuilder->dueBills($accountId, $validated['to'] ?? null);

        $pdfData = [
            'account' => $account,
            'data' => $data,
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'is_print_mode' => false
        ];

        $pdf = PDF::loadView('pdf.due-bills', $pdfData);
        $title = $account ? $account->title : 'ALL';
        return $pdf->download('due-bills-' . $title . '-' . date('d-M-Y') . '.pdf');
    }

    public function dueBillsPrint(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'to' => 'nullable|date',
        ]);

        $accountId = $validated['account_id'];
        $account = $accountId !== 'ALL' ? Account::findOrFail($accountId) : null;
        
        $data = $this->reportBuilder->dueBills($accountId, $validated['to'] ?? null);

        $pdfData = [
            'account' => $account,
            'data' => $data,
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'is_print_mode' => true
        ];

        $pdf = PDF::loadView('pdf.due-bills', $pdfData);
        return $pdf->stream('due-bills.pdf');
    }

    public function accountLedgerExportPdf(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        // Get fresh account data for the header title
        $accountId = $validated['account_id'];
        $account = $accountId !== 'ALL' ? Account::findOrFail($accountId) : null;
        $reportId = strtolower($request->input('report_id') ?? 'ledger');

        if ($reportId === 'detail_ledger') {
            $data = $this->reportBuilder->accountDetailLedger(
                $accountId,
                $validated['from'] ?? null,
                $validated['to'] ?? null,
                10000
            );
        } else {
            $data = $this->reportBuilder->accountLedger(
                $accountId,
                $validated['from'] ?? null,
                $validated['to'] ?? null,
                10000
            );
        }

        // Pre-calculate running balance for the view
        $balance = $data['page_start_balance'];
        $enrichedData = [];
        foreach ($data['data'] as $row) {
            if ($data['balance_type'] === 'cr') {
                $balance = $balance + $row->credit - $row->debit;
            } else {
                $balance = $balance + $row->debit - $row->credit;
            }
            $row->balance = $balance;
            $enrichedData[] = $row;
        }

        $pdfData = [
            'account' => $account,
            'data' => $enrichedData, // Pagination object items
            'opening_balance' => $data['opening_balance'],
            'total_debit' => $data['total_debit'],
            'total_credit' => $data['total_credit'],
            'closing_balance' => $data['closing_balance'],
            'balance_type' => $data['balance_type'],
            'from_date' => $data['from_date'],
            'to_date' => $data['to_date'],
            'is_print_mode' => false
        ];

        if ($reportId === 'detail_ledger') {
            $pdf = PDF::loadView('pdf.detail-ledger', $pdfData);
        } else {
            $pdf = PDF::loadView('pdf.account-ledger', $pdfData);
        }

        $title = $account ? $account->title : 'ALL';
        return $pdf->download('ledger-' . $title . '-' . date('d-M-Y') . '.pdf');
    }

    public function accountLedgerPrint(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $accountId = $validated['account_id'];
        $account = $accountId !== 'ALL' ? Account::findOrFail($accountId) : null;
        $reportId = strtolower($request->input('report_id') ?? 'ledger');

        if ($reportId === 'detail_ledger') {
            $data = $this->reportBuilder->accountDetailLedger(
                $accountId,
                $validated['from'] ?? null,
                $validated['to'] ?? null,
                10000
            );
        } else {
            $data = $this->reportBuilder->accountLedger(
                $accountId,
                $validated['from'] ?? null,
                $validated['to'] ?? null,
                10000
            );
        }

        // Pre-calculate running balance for the view
        $balance = $data['page_start_balance'];
        $enrichedData = [];
        foreach ($data['data'] as $row) {
            if ($data['balance_type'] === 'cr') {
                $balance = $balance + $row->credit - $row->debit;
            } else {
                $balance = $balance + $row->debit - $row->credit;
            }
            $row->balance = $balance;
            $enrichedData[] = $row;
        }

        $pdfData = [
            'account' => $account,
            'data' => $enrichedData,
            'opening_balance' => $data['opening_balance'],
            'total_debit' => $data['total_debit'],
            'total_credit' => $data['total_credit'],
            'closing_balance' => $data['closing_balance'],
            'balance_type' => $data['balance_type'],
            'from_date' => $data['from_date'],
            'to_date' => $data['to_date'],
            'is_print_mode' => true
        ];

        if ($reportId === 'detail_ledger') {
            return view('pdf.detail-ledger', $pdfData);
        }

        return view('pdf.account-ledger', $pdfData);
    }

    public function accountAgingExportPdf(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'to' => 'nullable|date',
        ]);

        $data = $this->reportBuilder->accountAging(
            $validated['account_id'],
            $validated['to'] ?? null
        );

        $firm = Firm::where('defult', 1)->first() ?? Firm::first();
        $accountTitle = $validated['account_id'] === 'ALL' ? 'ALL' : (Account::find($validated['account_id'])->title ?? 'Unknown');

        $pdfData = [
            'data' => $data,
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'account_id' => $accountTitle,
            'firm' => $firm
        ];

        $pdf = PDF::loadView('pdf.accounts-aging', $pdfData)->setPaper('a4', 'landscape');

        return $pdf->download('accounts-aging-' . date('Y-m-d') . '.pdf');
    }

    public function accountAgingPrint(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'to' => 'nullable|date',
        ]);

        $data = $this->reportBuilder->accountAging(
            $validated['account_id'],
            $validated['to'] ?? null
        );

        $firm = Firm::where('defult', 1)->first() ?? Firm::first();
        $accountTitle = $validated['account_id'] === 'ALL' ? 'ALL' : (Account::find($validated['account_id'])->title ?? 'Unknown');

        $pdfData = [
            'data' => $data,
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'account_id' => $accountTitle,
            'is_print_mode' => true,
            'firm' => $firm
        ];

        return view('pdf.accounts-aging', $pdfData);
    }

    public function dayBookExportPdf(Request $request)
    {
        $validated = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $data = $this->reportBuilder->dayBook($validated['from'] ?? null, $validated['to'] ?? null);
        
        $pdfData = [
            'data' => $data,
            'from_date' => $validated['from'] ?? date('Y-m-d'),
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'is_print_mode' => false
        ];

        $pdf = PDF::loadView('pdf.day-book', $pdfData);
        return $pdf->download('day-book-' . date('d-M-Y') . '.pdf');
    }

    public function dayBookPrint(Request $request)
    {
        $validated = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $data = $this->reportBuilder->dayBook($validated['from'] ?? null, $validated['to'] ?? null);
        
        $pdfData = [
            'data' => $data,
            'from_date' => $validated['from'] ?? date('Y-m-d'),
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'is_print_mode' => true
        ];

        return view('pdf.day-book', $pdfData);
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

    public function outstandingBillWiseExportPdf(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $accountId = $validated['account_id'];
        $account = $accountId !== 'ALL' ? Account::findOrFail($accountId) : null;
        
        $data = $this->reportBuilder->outstandingBillWise(
            $accountId,
            $validated['from'] ?? null,
            $validated['to'] ?? null,
            $request->all()
        );

        $pdfData = [
            'account' => $account,
            'data' => $data,
            'from_date' => $validated['from'] ?? date('Y-m-d'),
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'is_print_mode' => false
        ];

        $pdf = PDF::loadView('pdf.outstanding-billwise', $pdfData)->setPaper('a4', 'landscape');
        $title = $account ? $account->title : 'ALL';
        return $pdf->download('outstanding-billwise-' . $title . '-' . date('d-M-Y') . '.pdf');
    }

    public function outstandingBillWisePrint(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $accountId = $validated['account_id'];
        $account = $accountId !== 'ALL' ? Account::findOrFail($accountId) : null;
        
        $data = $this->reportBuilder->outstandingBillWise(
            $accountId,
            $validated['from'] ?? null,
            $validated['to'] ?? null,
            $request->all()
        );

        $pdfData = [
            'account' => $account,
            'data' => $data,
            'from_date' => $validated['from'] ?? date('Y-m-d'),
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'is_print_mode' => true
        ];

        return view('pdf.outstanding-billwise', $pdfData);
    }

    public function paymentDetailExportPdf(Request $request)
    {
        return $this->exportPaymentReport($request, 'PAYMENT', false);
    }

    public function paymentDetailPrint(Request $request)
    {
        return $this->exportPaymentReport($request, 'PAYMENT', true);
    }

    public function receivingDetailExportPdf(Request $request)
    {
        return $this->exportPaymentReport($request, 'RECEIPT', false);
    }

    public function receivingDetailPrint(Request $request)
    {
        return $this->exportPaymentReport($request, 'RECEIPT', true);
    }

    private function exportPaymentReport(Request $request, $type, $isPrint)
    {
        $validated = $request->validate([
            'account_id' => 'required',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $accountId = $validated['account_id'];
        $account = $accountId !== 'ALL' ? Account::findOrFail($accountId) : null;
        
        $data = $type === 'PAYMENT' 
            ? $this->reportBuilder->paymentDetail($accountId, $validated['from'], $validated['to'])
            : $this->reportBuilder->receivingDetail($accountId, $validated['from'], $validated['to']);

        $pdfData = [
            'account' => $account,
            'data' => $data,
            'from_date' => $validated['from'] ?? date('Y-m-d'),
            'to_date' => $validated['to'] ?? date('Y-m-d'),
            'type' => $type,
            'is_print_mode' => $isPrint
        ];

        $view = $type === 'PAYMENT' ? 'pdf.payment-detail' : 'pdf.receiving-detail';

        if ($isPrint) {
            return view($view, $pdfData);
        }

        $pdf = PDF::loadView($view, $pdfData);
        $filename = ($type === 'PAYMENT' ? 'payment-detail-' : 'receiving-detail-') . date('d-M-Y') . '.pdf';
        return $pdf->download($filename);
    }

    public function receivableExportPdf(Request $request)
    {
        return $this->exportReceivablePayable($request, 'RECEIVABLE', false);
    }

    public function receivablePrint(Request $request)
    {
        return $this->exportReceivablePayable($request, 'RECEIVABLE', true);
    }

    public function payableExportPdf(Request $request)
    {
        return $this->exportReceivablePayable($request, 'PAYABLE', false);
    }

    public function payablePrint(Request $request)
    {
        return $this->exportReceivablePayable($request, 'PAYABLE', true);
    }

    private function exportReceivablePayable(Request $request, $type, $isPrint)
    {
        $validated = $request->validate([
            'to' => 'nullable|date',
        ]);

        $toDate = $validated['to'] ?? date('Y-m-d');
        
        $data = $type === 'RECEIVABLE' 
            ? $this->reportBuilder->receivables($toDate, $request->all())
            : $this->reportBuilder->payables($toDate, $request->all());

        $pdfData = [
            'data' => $data,
            'to_date' => $toDate,
            'type' => $type,
            'is_print_mode' => $isPrint
        ];

        $view = 'pdf.receivable'; // We can use one view for both as they are identical tables

        if ($isPrint) {
            return view($view, $pdfData);
        }

        $pdf = PDF::loadView($view, $pdfData);
        $filename = ($type === 'RECEIVABLE' ? 'receivable-' : 'payable-') . date('d-M-Y') . '.pdf';
        return $pdf->download($filename);
    }

    public function roznamchaExportPdf(Request $request)
    {
        return $this->exportRoznamcha($request, false);
    }

    public function roznamchaPrint(Request $request)
    {
        return $this->exportRoznamcha($request, true);
    }

    private function exportRoznamcha(Request $request, $isPrint)
    {
        $validated = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $fromDate = $validated['from'] ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $validated['to'] ?? date('Y-m-d');
        
        $data = $this->reportBuilder->roznamcha($fromDate, $toDate);

        $pdfData = [
            'data' => $data,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'is_print_mode' => $isPrint
        ];

        $view = 'pdf.roznamcha';

        if ($isPrint) {
            return view($view, $pdfData);
        }

        $pdf = PDF::loadView($view, $pdfData);
        return $pdf->download('roznamcha-' . date('d-M-Y') . '.pdf');
    }

    public function summaryExportPdf(Request $request)
    {
        return $this->exportSummary($request, false);
    }

    public function summaryPrint(Request $request)
    {
        return $this->exportSummary($request, true);
    }

    private function exportSummary(Request $request, $isPrint)
    {
        $validated = $request->validate([
            'to' => 'nullable|date',
        ]);

        $toDate = $validated['to'] ?? date('Y-m-d');
        
        $data = $this->reportBuilder->summary($toDate, $request->all());

        $pdfData = [
            'data' => $data,
            'to_date' => $toDate,
            'is_print_mode' => $isPrint,
            'report_title' => 'SUMMARY REPORT'
        ];

        $view = 'pdf.summary';

        if ($isPrint) {
            return view($view, $pdfData);
        }

        $pdf = PDF::loadView($view, $pdfData);
        return $pdf->download('summary-' . date('d-M-Y') . '.pdf');
    }

    public function trialBalance2ColExportPdf(Request $request)
    {
        return $this->exportTrialBalance2Col($request, false);
    }

    public function trialBalance2ColPrint(Request $request)
    {
        return $this->exportTrialBalance2Col($request, true);
    }

    private function exportTrialBalance2Col(Request $request, $isPrint)
    {
        $validated = $request->validate([
            'to' => 'nullable|date',
        ]);

        $toDate = $validated['to'] ?? date('Y-m-d');
        
        $data = $this->reportBuilder->trialBalance($toDate, $request->all());

        $pdfData = [
            'data' => $data,
            'to_date' => $toDate,
            'is_print_mode' => $isPrint,
            'report_title' => 'TRIAL BALANCE 2 COLUMN'
        ];

        $view = 'pdf.summary';

        if ($isPrint) {
            return view($view, $pdfData);
        }

        $pdf = PDF::loadView($view, $pdfData);
        return $pdf->download('trial-balance-2-' . date('d-M-Y') . '.pdf');
    }

    public function trialBalance6ColExportPdf(Request $request)
    {
        return $this->exportTrialBalance6Col($request, false);
    }

    public function trialBalance6ColPrint(Request $request)
    {
        return $this->exportTrialBalance6Col($request, true);
    }

    private function exportTrialBalance6Col(Request $request, $isPrint)
    {
        $validated = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $fromDate = $validated['from'] ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $validated['to'] ?? date('Y-m-d');
        
        $data = $this->reportBuilder->trialBalance6Col($fromDate, $toDate, $request->all());

        $pdfData = [
            'data' => $data,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'is_print_mode' => $isPrint,
            'report_title' => 'TRIAL BALANCE 6 COLUMN'
        ];

        $view = 'pdf.trial-balance-6col';

        // 6 Column requires A4 landscape orientation for space
        if ($isPrint) {
            return view($view, $pdfData);
        }

        $pdf = PDF::loadView($view, $pdfData)->setPaper('a4', 'landscape');
        return $pdf->download('trial-balance-6col-' . date('d-M-Y') . '.pdf');
    }
}
