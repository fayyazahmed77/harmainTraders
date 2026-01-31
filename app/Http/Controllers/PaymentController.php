<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Purchase;
use App\Models\Sales;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class PaymentController extends Controller
{
    // List payments and stats
    public function index(Request $request)
    {
        $query = Payment::with(['account', 'paymentAccount']);

        // Filter by Date Range
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        // Filter by Account
        if ($request->has('account_id') && $request->account_id && $request->account_id !== 'all') {
            $query->where('account_id', $request->account_id);
        }

        // Filter by Type
        if ($request->has('type') && $request->type && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by Payment Method
        if ($request->has('payment_method') && $request->payment_method && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        $payments = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Calculate Summary (Based on current filters)
        // We clone the query to avoid modifying the main pagination query
        $summaryQuery = clone $query;
        // Remove pagination/ordering for summary stats if needed, or re-apply filters to a fresh query
        // Re-applying is safer to avoid pagination interference
        $summaryQueryBase = Payment::query();
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $summaryQueryBase->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        if ($request->has('account_id') && $request->account_id && $request->account_id !== 'all') {
            $summaryQueryBase->where('account_id', $request->account_id);
        }
        if ($request->has('type') && $request->type && $request->type !== 'all') {
            $summaryQueryBase->where('type', $request->type);
        }
        if ($request->has('payment_method') && $request->payment_method && $request->payment_method !== 'all') {
            $summaryQueryBase->where('payment_method', $request->payment_method);
        }

        $totalReceipts = (clone $summaryQueryBase)->where('type', 'RECEIPT')
            ->where(function ($q) {
                $q->where('cheque_status', '!=', 'Canceled')->orWhereNull('cheque_status');
            })
            ->sum('amount');
        $totalPayments = (clone $summaryQueryBase)->where('type', 'PAYMENT')
            ->where(function ($q) {
                $q->where('cheque_status', '!=', 'Canceled')->orWhereNull('cheque_status');
            })
            ->sum('amount');

        $canceledReceipts = (clone $summaryQueryBase)->where('type', 'RECEIPT')->where('cheque_status', 'Canceled')->sum('amount');
        $canceledPayments = (clone $summaryQueryBase)->where('type', 'PAYMENT')->where('cheque_status', 'Canceled')->sum('amount');

        $summary = [
            'total_receipts' => $totalReceipts,
            'total_payments' => $totalPayments,
            'net_flow' => $totalReceipts - $totalPayments,
            'canceled_amount' => $canceledReceipts + $canceledPayments,
            'count' => $summaryQueryBase->count(),
            'active_count' => (clone $summaryQueryBase)->where(function ($q) {
                $q->where('cheque_status', '!=', 'Canceled')->orWhereNull('cheque_status');
            })->count(),
            'canceled_count' => (clone $summaryQueryBase)->where('cheque_status', 'Canceled')->count(),
        ];

        // ───────────────────────────────────────────
        // SALES SUMMARY
        // ───────────────────────────────────────────
        $salesQuery = Sales::query();
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $salesQuery->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        $salesData = clone $salesQuery;
        
        $salesReturnQuery = \App\Models\SalesReturn::query();
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $salesReturnQuery->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        $salesSummary = [
            'total_sales' => $salesData->sum('net_total'),
            'total_paid' => $salesData->sum('paid_amount'),
            'total_unpaid' => $salesData->sum('remaining_amount'),
            'total_returns' => $salesReturnQuery->sum('net_total'),
        ];

        // ───────────────────────────────────────────
        // PURCHASE SUMMARY
        // ───────────────────────────────────────────
        $purchaseQuery = Purchase::query();
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $purchaseQuery->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        $purchaseData = clone $purchaseQuery;

        $purchaseReturnQuery = \App\Models\PurchaseReturn::query();
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $purchaseReturnQuery->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        $purchaseSummary = [
            'total_purchase' => $purchaseData->sum('net_total'),
            'total_paid' => $purchaseData->sum('paid_amount'),
            'total_unpaid' => $purchaseData->sum('remaining_amount'),
            'total_returns' => $purchaseReturnQuery->sum('net_total'),
        ];

        // ───────────────────────────────────────────
        // ANALYTICS (Rolling 7 Days or Filtered Range)
        // ───────────────────────────────────────────
        $analytics = [];
        $startDate = $request->start_date ? \Carbon\Carbon::parse($request->start_date) : now()->subDays(6);
        $endDate = $request->end_date ? \Carbon\Carbon::parse($request->end_date) : now();

        // Limit range for analytics performance
        $diff = $startDate->diffInDays($endDate);
        if ($diff > 30) $startDate = (clone $endDate)->subDays(30);

        for ($date = clone $startDate; $date->lte($endDate); $date->addDay()) {
            $currentDate = $date->toDateString();
            $analytics[] = [
                'date' => $date->format('M d'),
                'sales' => Sales::where('date', $currentDate)->sum('net_total'),
                'purchases' => Purchase::where('date', $currentDate)->sum('net_total'),
                'receipts' => Payment::where('date', $currentDate)->where('type', 'RECEIPT')->sum('amount'),
                'payments' => Payment::where('date', $currentDate)->where('type', 'PAYMENT')->sum('amount'),
            ];
        }

        // Accounts for filters
        $accounts = Account::select('id', 'title', 'type')->get();

        return Inertia::render('daily/payment/index', [
            'payments' => $payments,
            'summary' => $summary,
            'sales_summary' => $salesSummary,
            'purchase_summary' => $purchaseSummary,
            'analytics' => $analytics,
            'filters' => $request->all(['start_date', 'end_date', 'account_id', 'type', 'payment_method']),
            'accounts' => $accounts,
        ]);
    }

    // Show payment details
    public function show($id)
    {
        $payment = Payment::with(['account', 'paymentAccount', 'allocations', 'cheque'])->findOrFail($id);
        return Inertia::render('daily/payment/view', ['payment' => $payment]);
    }

    // Edit payment
    public function edit($id)
    {
        $payment = Payment::with(['allocations'])->findOrFail($id);

        $accounts = Account::select('id', 'title', 'type')->get();
        $paymentAccounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Cash', 'Bank']);
            })
            ->get();

        return Inertia::render('daily/payment/edit', [
            'payment' => $payment,
            'accounts' => $accounts,
            'paymentAccounts' => $paymentAccounts,
        ]);
    }

    // Update payment
    public function update(Request $request, $id)
    {
        // For now, simple update of basic fields. 
        // Complex allocation updates might require resetting allocations which is risky.
        // Let's allow updating basic info and remarks.

        $payment = Payment::findOrFail($id);

        $request->validate([
            'date' => 'required|date',
            'remarks' => 'nullable|string',
            'cheque_no' => 'nullable|string',
            'cheque_date' => 'nullable|date',
            'clear_date' => 'nullable|date',
        ]);

        $payment->update($request->only([
            'date',
            'remarks',
            'cheque_no',
            'cheque_date',
            'clear_date'
        ]));

        return redirect()->route('payments.index')->with('success', 'Payment updated successfully.');
    }

    // Generate PDF (Print View)
    public function pdf($id)
    {
        $payment = Payment::with(['account', 'paymentAccount', 'allocations', 'cheque'])->findOrFail($id);

        $pdf = PDF::loadView('pdf.payment-voucher', compact('payment'));

        return $pdf->download($payment->voucher_no . '.pdf');
    }

    // Create page
    public function create()
    {
        // Fetch accounts for selection
        // Assuming 'Customer' and 'Supplier' types or similar logic exists in Account model
        // For now fetching all, but ideally filter by type
        $accounts = Account::with('accountType')
            ->select('id', 'title', 'type')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Customers', 'Supplier']);
            })
            ->get();
        $paymentAccounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Cash', 'Bank']);
            })
            ->get();
        // dd($paymentAccounts->toArray());



        return Inertia::render("daily/payment/create", [
            'accounts' => $accounts,
            'paymentAccounts' => $paymentAccounts,
        ]);
    }

    // Get unpaid bills for a specific account
    public function getUnpaidBills(Request $request)
    {
        try {
            $accountId = $request->input('account_id');
            $account = Account::find($accountId);

            if (!$account) {
                return response()->json([]);
            }

            $bills = [];

            // Logic: If Customer -> Fetch Sales. If Supplier -> Fetch Purchases.
            // Assuming 'Customer' type or similar. Adjust 'type' check as per actual Account model.
            // If no strict type, maybe check both or rely on user intent?
            // For now, let's assume:
            // Sales are for Customers (receivable)
            // Purchases are for Suppliers (payable)

            // We can fetch both and let frontend decide, or fetch based on account type if known.
            // Let's try to fetch based on account type if possible.

            // Fetch Unpaid Sales (Remaining Amount > 0)
            $sales = Sales::where('customer_id', $accountId)
                ->where('remaining_amount', '>', 0)
                ->select('id', 'date', 'invoice', 'net_total', 'remaining_amount')
                ->get()
                ->map(function ($sale) {
                    return [
                        'id' => $sale->id,
                        'type' => 'App\Models\Sales',
                        'invoice_no' => $sale->invoice,
                        'date' => $sale->date,
                        'net_total' => $sale->net_total,
                        'remaining_amount' => $sale->remaining_amount,
                        'bill_type_label' => 'Sale'
                    ];
                })
                ->toArray();

            // Fetch Unpaid Purchases (Remaining Amount > 0)
            $purchases = Purchase::where('supplier_id', $accountId)
                ->where('remaining_amount', '>', 0)
                ->select('id', 'date', 'invoice', 'net_total', 'remaining_amount')
                ->get()
                ->map(function ($purchase) {
                    return [
                        'id' => $purchase->id,
                        'type' => 'App\Models\Purchase',
                        'invoice_no' => $purchase->invoice,
                        'date' => $purchase->date,
                        'net_total' => $purchase->net_total,
                        'remaining_amount' => $purchase->remaining_amount,
                        'bill_type_label' => 'Purchase'
                    ];
                })
                ->toArray();

            $bills = array_merge($sales, $purchases);

            // Fetch Full Ledger Balance
            $totalSales = \App\Models\Sales::where('customer_id', $accountId)->sum('net_total');
            $totalSalesReturns = \App\Models\SalesReturn::where('customer_id', $accountId)->sum('net_total');
            $totalPurchases = \App\Models\Purchase::where('supplier_id', $accountId)->sum('net_total');
            $totalPurchaseReturns = \App\Models\PurchaseReturn::where('supplier_id', $accountId)->sum('net_total');
            $totalReceipts = \App\Models\Payment::where('account_id', $accountId)->where('type', 'RECEIPT')->sum('amount');
            $totalPayments = \App\Models\Payment::where('account_id', $accountId)->where('type', 'PAYMENT')->sum('amount');

            // Debit = Sales + Payments (OUT) + PurchaseReturns
            // Credit = Purchases + Receipts (IN) + SalesReturns
            $totalDebit = $totalSales + $totalPayments + $totalPurchaseReturns;
            $totalCredit = $totalPurchases + $totalReceipts + $totalSalesReturns;

            // Respect Orientation (dr/cr) like ReportBuilder
            $orientation = $account->purchase == 1 ? 'cr' : 'dr';

            if ($orientation === 'cr') {
                $netLedgerBalance = ($account->opening_balance) + ($totalCredit - $totalDebit);
            } else {
                $netLedgerBalance = ($account->opening_balance) + ($totalDebit - $totalCredit);
            }

            // Calculate Unpaid Billed Balance (Sum of remaining amounts on invoices)
            $totalUnpaidBilled = collect($bills)->sum('remaining_amount');

            // Advance calculation:
            // If Billed Unpaid > Adjusted Ledger Balance, the difference is unallocated payments (Advance)
            // Example Supplier: Billed 17032, Ledger Balance 16968.25 => Adv 63.75
            // Example Customer: Billed 1100, Ledger Balance 480 => Adv 620
            $advanceAmount = max(0, $totalUnpaidBilled - $netLedgerBalance);

            return response()->json([
                'bills' => $bills,
                'current_balance' => $netLedgerBalance,
                'advance_amount' => $advanceAmount,
                'orientation' => $orientation
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Get next unused cheque for a bank account
    public function getNextCheque(Request $request)
    {
        $accountId = $request->input('account_id');

        // Find the first unused cheque for this bank account
        $cheque = \App\Models\Chequebook::where('bank_id', $accountId)
            ->where('status', 'unused')
            ->orderBy('id', 'asc')
            ->first();

        if ($cheque) {
            return response()->json([
                'prefix' => $cheque->prefix,
                'cheque_no' => $cheque->cheque_no
            ]);
        }

        return response()->json(null);
    }

    // Store payment
    public function store(Request $request)
    {

        $request->validate([
            'date' => 'required|date',
            'account_id' => 'required|exists:accounts,id',
            'payment_account_id' => 'nullable|exists:accounts,id', // Cash/Bank
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:RECEIPT,PAYMENT', // IN or OUT
            'allocations' => 'array',
            'allocations.*.bill_id' => 'required',
            'allocations.*.bill_type' => 'required',
            'allocations.*.amount' => 'required|numeric|min:0',
            'cheque_no' => 'nullable|string',
            'cheque_date' => 'nullable|date',
            'clear_date' => 'nullable|date',
            'payment_method' => 'nullable|string|in:Online Transfer,Card,Cheque',
        ]);

        DB::beginTransaction();

        try {
            // Fetch Current State to calculate available advance
            $account = Account::findOrFail($request->account_id);
            $totalSales = \App\Models\Sales::where('customer_id', $account->id)->sum('net_total');
            $totalSalesReturns = \App\Models\SalesReturn::where('customer_id', $account->id)->sum('net_total');
            $totalPurchases = \App\Models\Purchase::where('supplier_id', $account->id)->sum('net_total');
            $totalPurchaseReturns = \App\Models\PurchaseReturn::where('supplier_id', $account->id)->sum('net_total');
            $totalReceipts = \App\Models\Payment::where('account_id', $account->id)->where('type', 'RECEIPT')->sum('amount');
            $totalPayments = \App\Models\Payment::where('account_id', $account->id)->where('type', 'PAYMENT')->sum('amount');

            $totalDebit = $totalSales + $totalPayments + $totalPurchaseReturns;
            $totalCredit = $totalPurchases + $totalReceipts + $totalSalesReturns;
            $netLedgerBalance = ($account->opening_balance) + ($totalDebit - $totalCredit);

            $billedUnpaid = \App\Models\Sales::where('customer_id', $account->id)->sum('remaining_amount')
                + \App\Models\Purchase::where('supplier_id', $account->id)->sum('remaining_amount');

            $availableAdvance = max(0, $billedUnpaid - $netLedgerBalance);

            // Safety Check: Sum of allocations must not exceed (net amount + available advance)
            $totalAllocated = collect($request->allocations)->sum('amount');
            $netPaid = $request->amount - ($request->discount ?? 0);

            if ($totalAllocated > ($netPaid + $availableAdvance + 0.01)) { // 0.01 for float precision
                throw new \Exception("Total allocated amount ({$totalAllocated}) exceeds available funds (New Payment: {$netPaid} + Available Advance: {$availableAdvance}).");
            }

            // Handle Cheque Logic
            $chequeId = null;
            if ($request->payment_method === 'Cheque' && $request->payment_account_id) {
                // Parse cheque_no which comes as "PREFIX-NUMBER" from frontend
                $chequeNoParts = explode('-', $request->cheque_no);

                if (count($chequeNoParts) >= 2) {
                    // If cheque_no contains prefix (e.g., "ABC-123")
                    $prefix = $chequeNoParts[0];
                    $chequeNumber = implode('-', array_slice($chequeNoParts, 1)); // Handle cases like "ABC-123-456"

                    $cheque = \App\Models\Chequebook::where('bank_id', $request->payment_account_id)
                        ->where('prefix', $prefix)
                        ->where('cheque_no', $chequeNumber)
                        ->where('status', 'unused')
                        ->first();
                } else {
                    // If no prefix, search by cheque_no only
                    $cheque = \App\Models\Chequebook::where('bank_id', $request->payment_account_id)
                        ->where('cheque_no', $request->cheque_no)
                        ->where('status', 'unused')
                        ->first();
                }

                if ($cheque) {
                    $chequeId = $cheque->id;
                    $cheque->update(['status' => 'issued']);
                } else {
                }
            }

            // Generate Voucher No (Simple logic for now)
            $prefix = $request->type === 'RECEIPT' ? 'CRV-' : 'CPV-';
            $count = Payment::where('type', $request->type)->count() + 1;
            $voucherNo = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);

            $payment = Payment::create([
                'date' => $request->date,
                'voucher_no' => $voucherNo,
                'account_id' => $request->account_id,
                'payment_account_id' => $request->payment_account_id,
                'amount' => $request->amount,
                'discount' => $request->discount ?? 0,
                'net_amount' => $request->net_amount ?? $request->amount,
                'type' => $request->type,
                'cheque_no' => $request->cheque_no,
                'cheque_date' => $request->cheque_date,
                'clear_date' => $request->clear_date,
                'remarks' => $request->remarks,
                'payment_method' => $request->payment_method,
                'cheque_id' => $chequeId,
            ]);

            // Process Allocations
            foreach ($request->allocations as $allocation) {
                if ($allocation['amount'] > 0) {
                    // Create Allocation Record
                    PaymentAllocation::create([
                        'payment_id' => $payment->id,
                        'bill_id' => $allocation['bill_id'],
                        'bill_type' => $allocation['bill_type'],
                        'amount' => $allocation['amount'],
                    ]);

                    // Update Bill (Sale or Purchase)
                    if ($allocation['bill_type'] === 'App\Models\Sales') {
                        $bill = Sales::find($allocation['bill_id']);
                    } else {
                        $bill = Purchase::find($allocation['bill_id']);
                    }

                    if ($bill) {
                        // Guard Clause: Prevent over-allocation
                        if ($allocation['amount'] > $bill->remaining_amount) {
                            throw new \Exception("Allocation amount ({$allocation['amount']}) exceeds remaining balance ({$bill->remaining_amount}) for " . ($allocation['bill_type'] === 'App\Models\Sales' ? 'Sale' : 'Purchase') . " ID: {$allocation['bill_id']}");
                        }

                        $bill->paid_amount += $allocation['amount'];
                        $bill->remaining_amount -= $allocation['amount'];
                        $bill->save();
                    }
                }
            }

            DB::commit();

            return redirect()->route('payment.create')->with('success', 'Payment saved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to save payment: ' . $e->getMessage()]);
        }
    }
}
