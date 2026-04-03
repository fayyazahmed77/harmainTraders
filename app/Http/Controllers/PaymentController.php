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
        $query = Payment::with(['account', 'paymentAccount', 'messageLine']);

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
        $payment = Payment::with(['account', 'paymentAccount', 'allocations', 'cheque', 'messageLine'])->findOrFail($id);
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

        $messageLines = \App\Models\MessageLine::whereIn('category', ['Payments', 'Receipt'])
            ->where('status', 'active')
            ->get();

        return Inertia::render('daily/payment/edit', [
            'payment' => $payment,
            'accounts' => $accounts,
            'paymentAccounts' => $paymentAccounts,
            'messageLines' => $messageLines,
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
            'message_line_id' => 'nullable|integer',
        ]);

        $payment->update($request->only([
            'date',
            'remarks',
            'cheque_no',
            'cheque_date',
            'clear_date',
            'message_line_id'
        ]));

        return redirect()->route('payments.index')->with('success', 'Payment updated successfully.');
    }

    // Generate PDF (Print View)
    public function pdf($id)
    {
        $payment = Payment::with(['account', 'paymentAccount', 'allocations.bill', 'cheque', 'messageLine'])->findOrFail($id);

        if ($payment->group_id) {
            $groupPayments = Payment::with(['account', 'paymentAccount', 'allocations.bill', 'cheque', 'messageLine'])
                ->where('group_id', $payment->group_id)
                ->get();
            
            // For combined slip, we pass the collection
            $pdf = PDF::loadView('pdf.payment-voucher', [
                'payment' => $payment,
                'groupPayments' => $groupPayments,
                'isCombined' => true
            ]);
        } else {
            $pdf = PDF::loadView('pdf.payment-voucher', compact('payment'));
        }

        return $pdf->stream($payment->voucher_no . '.pdf');
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
                $q->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
            })
            ->get();
        // dd($paymentAccounts->toArray());



        $messageLines = \App\Models\MessageLine::whereIn('category', ['Payments', 'Receipt'])
            ->where('status', 'active')
            ->get();

        return Inertia::render("daily/payment/create", [
            'accounts' => $accounts,
            'paymentAccounts' => $paymentAccounts,
            'messageLines' => $messageLines,
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

    // Get all unused cheques for a bank account
    public function getAvailableCheques(Request $request)
    {
        $accountId = $request->input('account_id');

        $cheques = \App\Models\Chequebook::where('bank_id', $accountId)
            ->where('status', 'unused')
            ->orderBy('id', 'asc')
            ->get();

        $formatted = $cheques->map(function ($cheque) {
            return $cheque->prefix ? $cheque->prefix . '-' . $cheque->cheque_no : $cheque->cheque_no;
        });

        return response()->json($formatted);
    }

    // Get items for a specific bill
    public function getBillItems(Request $request)
    {
        $billId = $request->input('bill_id');
        $billType = $request->input('bill_type');

        if ($billType === 'App\Models\Sales') {
            $items = \App\Models\SalesItem::where('sale_id', $billId)
                ->with('item')
                ->get()
                ->map(function ($si) {
                    return [
                        'title' => $si->item->title ?? 'N/A',
                        'qty' => $si->total_pcs,
                        'rate' => $si->trade_price,
                        'subtotal' => $si->total_pcs * $si->trade_price
                    ];
                });
        } else {
            $items = \App\Models\PurchaseItem::where('purchase_id', $billId)
                ->with('item')
                ->get()
                ->map(function ($pi) {
                    return [
                        'title' => $pi->item->title ?? 'N/A',
                        'qty' => $pi->total_pcs,
                        'rate' => $pi->trade_price,
                        'subtotal' => $pi->total_pcs * $pi->trade_price
                    ];
                });
        }

        return response()->json($items);
    }

    // Get available customer cheques (In Hand) for Party to Party payments
    public function getAvailableCustomerCheques(Request $request)
    {
        $cheques = Payment::where('type', 'RECEIPT')
            ->where('payment_method', 'Cheque')
            ->whereHas('paymentAccount.accountType', function ($q) {
                $q->where('name', 'Cheque in hand');
            })
            ->where(function ($q) {
                $q->where('cheque_status', 'In Hand')
                    ->orWhereNull('cheque_status');
            })
            ->select('id', 'cheque_no', 'cheque_date', 'amount', 'clear_date', 'account_id')
            ->with(['account:id,title'])
            ->get()
            ->map(function($c) {
                return [
                    'id' => $c->id,
                    'cheque_no' => $c->cheque_no,
                    'cheque_date' => $c->cheque_date,
                    'amount' => $c->amount,
                    'clear_date' => $c->clear_date,
                    'customer_name' => $c->account->title ?? 'N/A'
                ];
            });

        return response()->json($cheques);
    }

    public function store(Request $request)
    {
        $isMulti = (bool) $request->input('is_multi', false);
        $splitsData = $isMulti ? $request->input('splits', []) : [[
            'payment_account_id' => $request->payment_account_id,
            'amount' => $request->amount,
            'discount' => $request->discount ?? 0,
            'payment_method' => $request->payment_method,
            'cheque_no' => $request->cheque_no,
            'cheque_date' => $request->cheque_date,
            'clear_date' => $request->clear_date,
            'original_cheque_id' => $request->original_cheque_id,
        ]];

        DB::beginTransaction();

        try {
            // Safety checks (Total aggregate)
            $totalAmount = collect($splitsData)->sum('amount');
            $totalDiscount = collect($splitsData)->sum('discount');
            $netPaid = $totalAmount - $totalDiscount;
            
            $account = Account::findOrFail($request->account_id);
            // ... (keep ledger balance checks if necessary, but use totalAmount)
            
            // Simplified sum logic for performance or use existing if reliable
            $totalAllocated = collect($request->allocations)->sum('amount');

            // Generate Base Voucher No
            $prefix = $request->type === 'RECEIPT' ? 'CRV-' : 'CPV-';
            $count = Payment::where('type', $request->type)->count() + 1;
            $baseVoucherNo = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);

            $groupId = null;
            $createdPayments = [];

            foreach ($splitsData as $index => $split) {
                // Skip if amount is 0 and not the only split
                if ($isMulti && $split['amount'] <= 0) continue;

                $voucherNo = $isMulti ? $baseVoucherNo . '-' . chr(65 + $index) : $baseVoucherNo;
                
                // Handle Cheque for this split
                $chequeId = null;
                if (($split['payment_method'] ?? null) === 'Cheque' && ($split['payment_account_id'] ?? null)) {
                    $chequeNoParts = explode('-', $split['cheque_no']);
                    $cheque = null;
                    if (count($chequeNoParts) >= 2) {
                        $cPrefix = $chequeNoParts[0];
                        $cNum = implode('-', array_slice($chequeNoParts, 1));
                        $cheque = \App\Models\Chequebook::where('bank_id', $split['payment_account_id'])
                            ->where('prefix', $cPrefix)->where('cheque_no', $cNum)->where('status', 'unused')->first();
                    } else {
                        $cheque = \App\Models\Chequebook::where('bank_id', $split['payment_account_id'])
                            ->where('cheque_no', $split['cheque_no'])->where('status', 'unused')->first();
                    }
                    if ($cheque) {
                        $chequeId = $cheque->id;
                        $cheque->update(['status' => 'issued']);
                    }
                }

                $payment = Payment::create([
                    'date' => $request->date,
                    'voucher_no' => $voucherNo,
                    'account_id' => $request->account_id,
                    'payment_account_id' => !empty($split['payment_account_id']) ? $split['payment_account_id'] : null,
                    'amount' => $split['amount'],
                    'discount' => $split['discount'] ?? 0,
                    'net_amount' => ($split['amount'] - ($split['discount'] ?? 0)),
                    'type' => $request->type,
                    'cheque_no' => !empty($split['cheque_no']) ? $split['cheque_no'] : null,
                    'cheque_date' => !empty($split['cheque_date']) ? $split['cheque_date'] : null,
                    'clear_date' => !empty($split['clear_date']) ? $split['clear_date'] : null,
                    'remarks' => !empty($request->remarks) ? $request->remarks : null,
                    'payment_method' => !empty($split['payment_method']) ? $split['payment_method'] : null,
                    'cheque_id' => $chequeId,
                    'message_line_id' => !empty($request->message_line_id) ? $request->message_line_id : null,
                ]);

                // Handle "Cheque in hand" Logic
                if ($payment->paymentAccount && $payment->paymentAccount->accountType->name === 'Cheque in hand') {
                    if ($request->type === 'RECEIPT' && $payment->payment_method === 'Cheque') {
                        // Mark newly received cheque as In Hand
                        $payment->update(['cheque_status' => 'In Hand']);
                    } elseif ($request->type === 'PAYMENT') {
                        // Mark the original source cheque as Distributed
                        if (isset($split['original_cheque_id']) && $split['original_cheque_id']) {
                            Payment::where('id', $split['original_cheque_id'])->update(['cheque_status' => 'Distributed']);
                            // Also record which original cheque this payment is linked to
                            $payment->update(['cheque_status' => 'Distributed']); // This payment itself represents a distributed cheque
                        }
                    }
                }

                if ($index === 0) {
                    $groupId = $payment->id;
                }
                $payment->update(['group_id' => $groupId]);
                $createdPayments[] = $payment;
            }

            // Distribute allocations across created payments
            $allocationQueue = $request->allocations;
            $paymentQueue = $createdPayments;

            foreach ($paymentQueue as $payment) {
                $pRemaining = $payment->net_amount;

                while ($pRemaining > 0 && count($allocationQueue) > 0) {
                    $allocIdx = array_key_first($allocationQueue);
                    $alloc = $allocationQueue[$allocIdx];
                    
                    $canAllocate = min($pRemaining, $alloc['amount']);
                    
                    if ($canAllocate > 0) {
                        PaymentAllocation::create([
                            'payment_id' => $payment->id,
                            'bill_id' => $alloc['bill_id'],
                            'bill_type' => $alloc['bill_type'],
                            'amount' => $canAllocate,
                        ]);

                        // Update the bill itself only once or carefully
                        $bill = ($alloc['bill_type'] === 'App\Models\Sales') 
                            ? Sales::find($alloc['bill_id']) 
                            : Purchase::find($alloc['bill_id']);

                        if ($bill) {
                            $bill->paid_amount += $canAllocate;
                            $bill->remaining_amount -= $canAllocate;
                            $bill->save();
                        }

                        $pRemaining -= $canAllocate;
                        $allocationQueue[$allocIdx]['amount'] -= $canAllocate;
                    }

                    // Remove from queue if fully satisfied
                    if ($allocationQueue[$allocIdx]['amount'] <= 0.001) {
                        array_shift($allocationQueue);
                    }
                }
            }

            $savedPaymentsDetails = collect($createdPayments)->map(function($p) {
                return [
                    'voucher_no' => $p->voucher_no,
                    'account' => $p->paymentAccount->title ?? 'Cash',
                    'amount' => $p->amount
                ];
            });

            DB::commit();

            return redirect()->route('payment.create')
                ->with('success', 'Payment saved successfully.')
                ->with('print_id', $groupId)
                ->with('saved_payments', $savedPaymentsDetails);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Payment Store Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Failed to save payment: ' . $e->getMessage()]);
        }
    }
}
