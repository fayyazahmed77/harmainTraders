<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Purchase;
use App\Models\Sales;
use App\Models\Firm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PaymentController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view payments', only: [
                'index', 'show', 'pdf', 'getUnpaidBills', 'getNextCheque', 
                'getAvailableCheques', 'getBillItems', 'getAvailableCustomerCheques'
            ]),
            new Middleware('permission:create payments', only: ['create', 'store']),
            new Middleware('permission:edit payments', only: ['edit', 'update']),
        ];
    }

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

        $allPayments = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $grouped = collect();
        $groups = [];

        foreach ($allPayments as $p) {
            if ($p->group_id) {
                if (isset($groups[$p->group_id])) {
                    $rep = $groups[$p->group_id];
                    $rep->amount += $p->amount;
                    $rep->net_amount += $p->net_amount;
                    $rep->discount += $p->discount;
                    
                    // Comma separate voucher nos
                    $vNos = explode(', ', $rep->voucher_no);
                    if (!in_array($p->voucher_no, $vNos)) {
                        $vNos[] = $p->voucher_no;
                        sort($vNos);
                        $rep->voucher_no = implode(', ', $vNos);
                    }
                    $rep->payment_method = 'Multi';
                } else {
                    $rep = clone $p;
                    $groups[$p->group_id] = $rep;
                    $grouped->push($rep);
                }
            } else {
                $grouped->push($p);
            }
        }

        $currentPage = \Illuminate\Pagination\LengthAwarePaginator::resolveCurrentPage() ?: 1;
        $perPage = 10;
        $currentPageItems = $grouped->slice(($currentPage - 1) * $perPage, $perPage)->all();

        $payments = new \Illuminate\Pagination\LengthAwarePaginator(
            array_values($currentPageItems),
            $grouped->count(),
            $perPage,
            $currentPage,
            ['path' => \Illuminate\Pagination\LengthAwarePaginator::resolveCurrentPath()]
        );
        $payments->withQueryString();

        // Calculate Summary (Based on current filters)
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
                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
            })
            ->selectRaw('COALESCE(SUM(amount + COALESCE(discount, 0)), 0) as total')->value('total');

        $totalPayments = (clone $summaryQueryBase)->where('type', 'PAYMENT')
            ->where(function ($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
            })
            ->selectRaw('COALESCE(SUM(amount + COALESCE(discount, 0)), 0) as total')->value('total');

        $canceledReceipts = (clone $summaryQueryBase)->where('type', 'RECEIPT')->whereIn('cheque_status', ['Canceled', 'Cancelled'])->sum('amount');
        $canceledPayments = (clone $summaryQueryBase)->where('type', 'PAYMENT')->whereIn('cheque_status', ['Canceled', 'Cancelled'])->sum('amount');

        $summary = [
            'total_receipts' => $totalReceipts,
            'total_payments' => $totalPayments,
            'net_flow' => $totalReceipts - $totalPayments,
            'canceled_amount' => $canceledReceipts + $canceledPayments,
            'count' => $summaryQueryBase->count(),
            'active_count' => (clone $summaryQueryBase)->where(function ($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
            })->count(),
            'canceled_count' => (clone $summaryQueryBase)->whereIn('cheque_status', ['Canceled', 'Cancelled'])->count(),
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

        $salesTotals = Sales::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])->selectRaw('date, SUM(net_total) as total')->groupBy('date')->pluck('total', 'date');
        $purchasesTotals = Purchase::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])->selectRaw('date, SUM(net_total) as total')->groupBy('date')->pluck('total', 'date');
        $receiptsTotals = Payment::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])->where('type', 'RECEIPT')->selectRaw('date, SUM(amount) as total')->groupBy('date')->pluck('total', 'date');
        $paymentsTotals = Payment::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])->where('type', 'PAYMENT')->selectRaw('date, SUM(amount) as total')->groupBy('date')->pluck('total', 'date');

        for ($date = clone $startDate; $date->lte($endDate); $date->addDay()) {
            $currentDate = $date->toDateString();
            $analytics[] = [
                'date' => $date->format('M d'),
                'sales' => $salesTotals[$currentDate] ?? 0,
                'purchases' => $purchasesTotals[$currentDate] ?? 0,
                'receipts' => $receiptsTotals[$currentDate] ?? 0,
                'payments' => $paymentsTotals[$currentDate] ?? 0,
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
        $payment = Payment::with(['account', 'paymentAccount', 'allocations.bill', 'cheque', 'messageLine', 'firm'])->findOrFail($id);
        
        if ($payment->group_id) {
            $groupPayments = Payment::with(['account', 'paymentAccount', 'allocations.bill', 'cheque', 'messageLine', 'firm'])
                ->where('group_id', $payment->group_id)
                ->get();
            $isCombined = true;
        } else {
            $groupPayments = collect([$payment]);
            $isCombined = false;
        }

        return Inertia::render('daily/payment/view', [
            'payment' => $payment,
            'groupPayments' => $groupPayments,
            'isCombined' => $isCombined
        ]);
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

        $messageLines = \App\Models\MessageLine::where(function ($query) {
            $query->whereJsonContains('category', 'Payments')
                  ->orWhereJsonContains('category', 'Receipt');
        })->where('status', 'active')->get();

        $firms = Firm::select('id', 'name', 'defult')->get();

        return Inertia::render('daily/payment/edit', [
            'payment' => $payment,
            'accounts' => $accounts,
            'paymentAccounts' => $paymentAccounts,
            'messageLines' => $messageLines,
            'firms' => $firms,
        ]);
    }

    // Update payment
    public function update(Request $request, $id)
    {
        $request->validate([
            'date' => 'required|date',
            'account_id' => 'required|integer',
            'payment_account_id' => 'nullable|integer',
            'amount' => 'required|numeric',
            'discount' => 'nullable|numeric',
            'type' => 'required|string|in:RECEIPT,PAYMENT',
            'payment_method' => 'nullable|string',
            'cheque_no' => 'nullable|string',
            'cheque_date' => 'nullable|date',
            'clear_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'message_line_id' => 'nullable|integer',
            'firm_id' => 'nullable|integer',
            'allocations' => 'nullable|array',
            'original_cheque_id' => 'nullable|string',
        ]);

        $payment = Payment::with('allocations')->findOrFail($id);

        DB::beginTransaction();

        try {
            // 1. Reverse old allocations
            foreach ($payment->allocations as $allocation) {
                $bill = $allocation->bill_type === 'App\Models\Sales'
                    ? Sales::find($allocation->bill_id)
                    : Purchase::find($allocation->bill_id);

                if ($bill) {
                    $bill->paid_amount = max(0, $bill->paid_amount - $allocation->amount);
                    $sumOfReturns = $this->getTotalReturns($bill, $allocation->bill_type);
                    $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumOfReturns;

                    $isSale = ($allocation->bill_type === 'App\Models\Sales');
                    if ($bill->remaining_amount <= 0) {
                        $bill->status = $isSale ? 'Paid' : 'Completed';
                    } elseif ($bill->paid_amount > 0) {
                        $bill->status = $isSale ? 'Partial' : 'Completed';
                    } else {
                        $bill->status = $isSale ? 'Unpaid' : 'Completed';
                    }
                    $bill->save();
                }
            }

            // 2. Delete old allocations
            PaymentAllocation::where('payment_id', $payment->id)->delete();

            // 3. Reset old cheque status in Chequebook if it exists
            if ($payment->cheque_id) {
                $cheque = \App\Models\Chequebook::find($payment->cheque_id);
                if ($cheque) {
                    $cheque->update(['status' => 'unused']);
                }
            }

            // 4. Restore distributed cheque in hand status if type was PAYMENT and method was Cheque
            if ($payment->type === 'PAYMENT' && $payment->payment_method === 'Cheque') {
                $paymentAccount = Account::with('accountType')->find($payment->payment_account_id);
                if ($paymentAccount && $paymentAccount->accountType && $paymentAccount->accountType->name === 'Cheque in hand') {
                    $source = Payment::where('type', 'RECEIPT')
                        ->where('cheque_no', $payment->cheque_no)
                        ->where('cheque_status', 'Distributed')
                        ->first();
                    if ($source) {
                        $source->update(['cheque_status' => 'In Hand']);
                    }
                }
            }

            // 5. Check/issue new cheque if applicable
            $chequeId = null;
            if ($request->payment_method === 'Cheque' && $request->payment_account_id) {
                $chequeNoParts = explode('-', $request->cheque_no);
                if (count($chequeNoParts) >= 2) {
                    $cPrefix = $chequeNoParts[0];
                    $cNum = implode('-', array_slice($chequeNoParts, 1));
                    $cheque = \App\Models\Chequebook::where('bank_id', $request->payment_account_id)
                        ->where('prefix', $cPrefix)->where('cheque_no', $cNum)->where('status', 'unused')->first();
                } else {
                    $cheque = \App\Models\Chequebook::where('bank_id', $request->payment_account_id)
                        ->where('cheque_no', $request->cheque_no)->where('status', 'unused')->first();
                }
                if ($cheque) {
                    $chequeId = $cheque->id;
                    $cheque->update(['status' => 'issued']);
                }
            }

            // 6. Update payment
            $payment->update([
                'date' => $request->date,
                'account_id' => $request->account_id,
                'payment_account_id' => $request->payment_account_id,
                'amount' => max(0, $request->amount - ($request->discount ?? 0)),
                'discount' => $request->discount ?? 0,
                'net_amount' => $request->amount,
                'type' => $request->type,
                'cheque_no' => $request->cheque_no,
                'cheque_date' => $request->cheque_date,
                'clear_date' => $request->clear_date,
                'remarks' => $request->remarks,
                'payment_method' => $request->payment_method,
                'cheque_id' => $chequeId ?? $payment->cheque_id,
                'message_line_id' => $request->message_line_id,
                'firm_id' => $request->firm_id,
            ]);

            // 7. Handle Cheque in hand state
            if ($payment->paymentAccount && $payment->paymentAccount->accountType?->name === 'Cheque in hand') {
                if ($request->type === 'RECEIPT' && $payment->payment_method === 'Cheque') {
                    $payment->update(['cheque_status' => 'In Hand']);
                } elseif ($request->type === 'PAYMENT') {
                    if ($request->original_cheque_id) {
                        Payment::where('id', $request->original_cheque_id)->update(['cheque_status' => 'Distributed']);
                    }
                }
            }

            // 8. Add new allocations
            $allocationPayload = $request->allocations ?? [];
            foreach ($allocationPayload as $alloc) {
                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'bill_id' => $alloc['bill_id'],
                    'bill_type' => $alloc['bill_type'],
                    'amount' => $alloc['amount'],
                ]);

                $bill = ($alloc['bill_type'] === 'App\Models\Sales')
                    ? Sales::find($alloc['bill_id'])
                    : Purchase::find($alloc['bill_id']);

                if ($bill) {
                    $bill->paid_amount      += $alloc['amount'];
                    $bill->remaining_amount -= $alloc['amount'];

                    $isSale = ($alloc['bill_type'] === 'App\Models\Sales');
                    if ($bill->remaining_amount <= 0) {
                        $bill->status = $isSale ? 'Paid' : 'Completed';
                    } elseif ($bill->paid_amount > 0) {
                        $bill->status = $isSale ? 'Partial' : 'Completed';
                    } else {
                        $bill->status = $isSale ? 'Unpaid' : 'Completed';
                    }
                    $bill->save();
                }
            }

            DB::commit();
            return redirect()->route('payments.index')->with('success', 'Payment updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment Update Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Failed to update payment: ' . $e->getMessage()]);
        }
    }

    private function getTotalReturns($bill, string $billType): float
    {
        if ($billType === 'App\Models\Sales') {
            return (float) \App\Models\SalesReturn::where(function($q) use ($bill) {
                $q->where('sale_id', $bill->id)
                  ->orWhere(function($sub) use ($bill) {
                      $sub->whereNull('sale_id')
                          ->where('original_invoice', $bill->invoice)
                          ->where('customer_id', $bill->customer_id);
                  });
            })->sum('net_total');
        } else {
            return (float) \App\Models\PurchaseReturn::where('original_invoice', $bill->invoice)
                ->where('supplier_id', $bill->supplier_id)
                ->sum('net_total');
        }
    }

    public function destroy($id)
    {
        if (! \Illuminate\Support\Facades\Gate::allows('delete-payment')) {
            abort(403);
        }
        $payment = Payment::with('allocations')->findOrFail($id);

        if ($payment->cheque_status === 'Cancelled' || $payment->cheque_status === 'Canceled') {
            return back()->with('error', 'Payment is already canceled.');
        }

        DB::beginTransaction();
        try {
            foreach ($payment->allocations as $allocation) {
                $bill = $allocation->bill_type === 'App\Models\Sales'
                    ? Sales::find($allocation->bill_id)
                    : Purchase::find($allocation->bill_id);

                if ($bill) {
                    $bill->paid_amount = max(0, $bill->paid_amount - $allocation->amount);
                    $sumOfReturns = $this->getTotalReturns($bill, $allocation->bill_type);
                    $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumOfReturns;

                    // Re-evaluate status
                    if ($bill->remaining_amount <= 0 && $bill->paid_amount > 0) {
                        $bill->status = 'Paid';
                    } elseif ($bill->remaining_amount > 0 && $bill->paid_amount > 0) {
                        $bill->status = 'Partial';
                    } else {
                        $bill->status = 'Unpaid';
                    }
                    $bill->save();
                }
            }

            // If payment has a cheque_id, sets that Chequebook record back to 'unused'
            if ($payment->cheque_id) {
                $cheque = \App\Models\Chequebook::find($payment->cheque_id);
                if ($cheque) {
                    $cheque->update(['status' => 'unused']);
                }
            }

            // If payment was a distributed cheque-in-hand, restores the source receipt's cheque_status to 'In Hand'
            if ($payment->type === 'PAYMENT' && $payment->payment_method === 'Cheque') {
                $paymentAccount = Account::with('accountType')->find($payment->payment_account_id);
                if ($paymentAccount && $paymentAccount->accountType && $paymentAccount->accountType->name === 'Cheque in hand') {
                    $source = Payment::where('type', 'RECEIPT')
                        ->where('cheque_no', $payment->cheque_no)
                        ->where('cheque_status', 'Distributed')
                        ->first();
                    if ($source) {
                        $source->update(['cheque_status' => 'In Hand']);
                    }
                }
            }

            if ($payment->customer_credit_id) {
                $creditService = new \App\Services\CustomerCreditService();
                $creditService->cancelRefund($payment->id);
            } else {
                // Soft-cancels the payment (sets cheque_status = 'Cancelled') and deletes its allocations
                $payment->update(['cheque_status' => 'Cancelled']);
                PaymentAllocation::where('payment_id', $payment->id)->delete();
            }

            DB::commit();
            return back()->with('success', 'Payment deleted and allocations reversed.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment Delete Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Failed to delete payment: ' . $e->getMessage()]);
        }
    }

    // Generate PDF (Print View)
    public function pdf(Request $request, $id)
    {
        $payment = Payment::with(['account', 'paymentAccount', 'allocations.bill', 'cheque', 'messageLine', 'firm'])->findOrFail($id);
        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.payment-voucher_half' : 'pdf.payment-voucher';

        if ($payment->group_id) {
            $groupPayments = Payment::with(['account', 'paymentAccount', 'allocations.bill', 'cheque', 'messageLine', 'firm'])
                ->where('group_id', $payment->group_id)
                ->get();

            // For combined slip, we pass the collection
            $pdf = PDF::loadView($view, [
                'payment' => $payment,
                'groupPayments' => $groupPayments,
                'isCombined' => true
            ]);
        } else {
            $pdf = PDF::loadView($view, compact('payment'));
        }

        if ($format === 'small') {
            $pdf->setPaper([0, 0, 226.77, 600], 'portrait');
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->stream($payment->voucher_no . '.pdf');
    }

    public function unpaidInvoices(Request $request)
    {
        $sales = Sales::with(['customer'])
            ->where('remaining_amount', '>', 0)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'invoice_no' => $sale->invoice,
                    'date' => $sale->date,
                    'type' => 'Sale',
                    'party_name' => $sale->customer->title ?? 'N/A',
                    'account_id' => $sale->customer_id,
                    'gross_total' => (float) $sale->gross_total,
                    'discount_total' => (float) $sale->discount_total,
                    'net_total' => (float) $sale->net_total,
                    'paid_amount' => (float) $sale->paid_amount,
                    'remaining_amount' => (float) $sale->remaining_amount,
                    'status' => $sale->status,
                ];
            });

        $purchases = Purchase::with(['supplier'])
            ->where('remaining_amount', '>', 0)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'invoice_no' => $purchase->invoice,
                    'date' => $purchase->date,
                    'type' => 'Purchase',
                    'party_name' => $purchase->supplier->title ?? 'N/A',
                    'account_id' => $purchase->supplier_id,
                    'gross_total' => (float) $purchase->gross_total,
                    'discount_total' => (float) $purchase->discount_total,
                    'net_total' => (float) $purchase->net_total,
                    'paid_amount' => (float) $purchase->paid_amount,
                    'remaining_amount' => (float) $purchase->remaining_amount,
                    'status' => $purchase->status,
                ];
            });

        $invoices = collect($sales)->merge($purchases)->sortByDesc('date')->values()->all();

        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Customers', 'Supplier']);
            })
            ->select('id', 'title', 'type')
            ->get();

        // ───────────────────────────────────────────
        // SALES SUMMARY (Matching Index)
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
        // PURCHASE SUMMARY (Matching Index)
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
        // ANALYTICS (Matching Index)
        // ───────────────────────────────────────────
        $analytics = [];
        $startDate = $request->start_date ? \Carbon\Carbon::parse($request->start_date) : now()->subDays(6);
        $endDate = $request->end_date ? \Carbon\Carbon::parse($request->end_date) : now();

        $diff = $startDate->diffInDays($endDate);
        if ($diff > 30) $startDate = (clone $endDate)->subDays(30);

        $salesTotals = Sales::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])->selectRaw('date, SUM(net_total) as total')->groupBy('date')->pluck('total', 'date');
        $purchasesTotals = Purchase::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])->selectRaw('date, SUM(net_total) as total')->groupBy('date')->pluck('total', 'date');
        $receiptsTotals = Payment::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])->where('type', 'RECEIPT')->selectRaw('date, SUM(amount) as total')->groupBy('date')->pluck('total', 'date');
        $paymentsTotals = Payment::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])->where('type', 'PAYMENT')->selectRaw('date, SUM(amount) as total')->groupBy('date')->pluck('total', 'date');

        for ($date = clone $startDate; $date->lte($endDate); $date->addDay()) {
            $currentDate = $date->toDateString();
            $analytics[] = [
                'date' => $date->format('M d'),
                'sales' => $salesTotals[$currentDate] ?? 0,
                'purchases' => $purchasesTotals[$currentDate] ?? 0,
                'receipts' => $receiptsTotals[$currentDate] ?? 0,
                'payments' => $paymentsTotals[$currentDate] ?? 0,
            ];
        }

        return Inertia::render("daily/payment/unpaid-bills", [
            'invoices' => $invoices,
            'accounts' => $accounts,
            'sales_summary' => $salesSummary,
            'purchase_summary' => $purchaseSummary,
            'analytics' => $analytics,
            'filters' => $request->all(['start_date', 'end_date', 'account_id', 'type']),
        ]);
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
                $q->whereIn('name', ['Customers', 'Supplier', 'Expense', 'Other']);
            })
            ->get();
        $paymentAccounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
            })
            ->get();

        $messageLines = \App\Models\MessageLine::where(function ($query) {
            $query->whereJsonContains('category', 'Payments')
                  ->orWhereJsonContains('category', 'Receipt');
        })->where('status', 'active')->get();

        $firms = Firm::select('id', 'name', 'defult')->get();

        return Inertia::render("daily/payment/create", [
            'accounts' => $accounts,
            'paymentAccounts' => $paymentAccounts,
            'messageLines' => $messageLines,
            'firms' => $firms,
        ]);
    }

    public function getUnpaidBills(Request $request)
    {
        try {
            $accountId = $request->input('account_id');
            $paymentId = $request->input('payment_id');
            $account = Account::with('accountType')->find($accountId);

            if (!$account) {
                return response()->json([]);
            }

            $allocatedBills = [];
            $paymentObj = null;
            if ($paymentId) {
                $paymentObj = Payment::find($paymentId);
                if ($paymentObj) {
                    $allocatedBills = \App\Models\PaymentAllocation::where('payment_id', $paymentId)->get()->keyBy(function($item) {
                        return $item->bill_type . '_' . $item->bill_id;
                    });
                }
            }

            $bills = [];

            // Fetch Unpaid Sales (Remaining Amount > 0 OR allocated to this payment)
            $salesQuery = Sales::where('customer_id', $accountId);
            if ($paymentObj) {
                $allocatedSaleIds = \App\Models\PaymentAllocation::where('payment_id', $paymentId)
                    ->where('bill_type', 'App\Models\Sales')
                    ->pluck('bill_id');
                $salesQuery->where(function($q) use ($allocatedSaleIds) {
                    $q->where('remaining_amount', '>', 0)
                      ->orWhereIn('id', $allocatedSaleIds);
                });
            } else {
                $salesQuery->where('remaining_amount', '>', 0);
            }

            $sales = $salesQuery->select('id', 'date', 'invoice', 'net_total', 'remaining_amount', 'discount_total')
                ->get()
                ->map(function ($sale) use ($allocatedBills) {
                    $returnAmount = $this->getTotalReturns($sale, 'App\Models\Sales');
                    $allocatedAmount = 0;
                    $key = 'App\Models\Sales_' . $sale->id;
                    if (isset($allocatedBills[$key])) {
                        $allocatedAmount = $allocatedBills[$key]->amount;
                    }
                    return [
                        'id' => $sale->id,
                        'type' => 'App\Models\Sales',
                        'invoice_no' => $sale->invoice,
                        'date' => $sale->date,
                        'net_total' => $sale->net_total,
                        'discount_total' => $sale->discount_total,
                        'return_amount' => $returnAmount,
                        'remaining_amount' => $sale->remaining_amount + $allocatedAmount,
                        'bill_type_label' => 'Sale',
                        'allocated_amount' => $allocatedAmount
                    ];
                })
                ->toArray();

            // Fetch Unpaid Purchases (Remaining Amount > 0 OR allocated to this payment)
            $purchasesQuery = Purchase::where('supplier_id', $accountId);
            if ($paymentObj) {
                $allocatedPurchaseIds = \App\Models\PaymentAllocation::where('payment_id', $paymentId)
                    ->where('bill_type', 'App\Models\Purchase')
                    ->pluck('bill_id');
                $purchasesQuery->where(function($q) use ($allocatedPurchaseIds) {
                    $q->where('remaining_amount', '>', 0)
                      ->orWhereIn('id', $allocatedPurchaseIds);
                });
            } else {
                $purchasesQuery->where('remaining_amount', '>', 0);
            }

            $purchases = $purchasesQuery->select('id', 'date', 'invoice', 'net_total', 'remaining_amount', 'discount_total')
                ->get()
                ->map(function ($purchase) use ($allocatedBills) {
                    $returnAmount = $this->getTotalReturns($purchase, 'App\Models\Purchase');
                    $allocatedAmount = 0;
                    $key = 'App\Models\Purchase_' . $purchase->id;
                    if (isset($allocatedBills[$key])) {
                        $allocatedAmount = $allocatedBills[$key]->amount;
                    }
                    return [
                        'id' => $purchase->id,
                        'type' => 'App\Models\Purchase',
                        'invoice_no' => $purchase->invoice,
                        'date' => $purchase->date,
                        'net_total' => $purchase->net_total,
                        'discount_total' => $purchase->discount_total,
                        'return_amount' => $returnAmount,
                        'remaining_amount' => $purchase->remaining_amount + $allocatedAmount,
                        'bill_type_label' => 'Purchase',
                        'allocated_amount' => $allocatedAmount
                    ];
                })
                ->toArray();

            $bills = array_merge($sales, $purchases);

            // Use the centralized current_balance logic from Account model
            $netLedgerBalance = (float) $account->current_balance;
            if ($paymentObj) {
                $netLedgerBalance += ($paymentObj->amount + $paymentObj->discount);
            }

            $orientation = $account->purchase == 1 ? 'cr' : 'dr';

            // Calculate Unpaid Billed Balance (Sum of remaining amounts on invoices)
            $totalUnpaidBilled = collect($bills)->sum('remaining_amount');

            // Advance calculation:
            $advanceAmount = max(0, $totalUnpaidBilled - $netLedgerBalance);

            // Compute Financial Auditor Stats based on Account Type
            $type = strtolower($account->accountType->name ?? '');
            $totalSalesOrPurchases = 0;
            $totalReceivedOrPaid = 0;
            $totalBalance = 0;
            $advancePaid = 0;

            if ($type === 'customers') {
                $totalSalesVal = (float) $account->sales()->sum('net_total') - (float) $account->sales()->sum('extra_discount');
                $totalReturnsVal = (float) $account->salesReturns()->sum('net_total');
                $totalSalesOrPurchases = $totalSalesVal - $totalReturnsVal + (float) $account->opening_balance;

                $totalReceiptsVal = (float) $account->partyPayments()->where('type', 'RECEIPT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    })->sum(DB::raw('amount + discount'));
                $totalPaymentsVal = (float) $account->partyPayments()->where('type', 'PAYMENT')
                    ->where('is_return_refund', false)
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    })->sum(DB::raw('amount + discount'));
                $totalReceivedOrPaid = $totalReceiptsVal - $totalPaymentsVal;

                if ($paymentObj) {
                    $totalReceivedOrPaid -= ($paymentObj->amount + $paymentObj->discount);
                }

                if ($netLedgerBalance >= 0) {
                    $totalBalance = $netLedgerBalance;
                    $advancePaid = 0;
                } else {
                    $totalBalance = 0;
                    $advancePaid = abs($netLedgerBalance);
                }
            } elseif ($type === 'supplier') {
                $totalPurchasesVal = (float) $account->purchases()->sum('net_total');
                $totalReturnsVal = (float) $account->purchaseReturns()->sum('net_total');
                $totalSalesOrPurchases = $totalPurchasesVal - $totalReturnsVal + (float) $account->opening_balance;

                $totalPaymentsVal = (float) $account->partyPayments()->where('type', 'PAYMENT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    })->sum(DB::raw('amount + discount'));
                $totalReceiptsVal = (float) $account->partyPayments()->where('type', 'RECEIPT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    })->sum(DB::raw('amount + discount'));
                $totalReceivedOrPaid = $totalPaymentsVal - $totalReceiptsVal;

                if ($paymentObj) {
                    $totalReceivedOrPaid -= ($paymentObj->amount + $paymentObj->discount);
                }

                if ($netLedgerBalance >= 0) {
                    $totalBalance = $netLedgerBalance;
                    $advancePaid = 0;
                } else {
                    $totalBalance = 0;
                    $advancePaid = abs($netLedgerBalance);
                }
            }

            return response()->json([
                'bills' => $bills,
                'current_balance' => $netLedgerBalance,
                'advance_amount' => $advanceAmount,
                'orientation' => $orientation,
                'total_sales_purchases' => $totalSalesOrPurchases,
                'total_received_paid' => $totalReceivedOrPaid,
                'total_balance' => $totalBalance,
                'advance_paid' => $advancePaid
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
            ->map(function ($c) {
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
            $totalAmount = collect($splitsData)->sum('amount'); // Gross amount total
            $totalDiscount = $isMulti ? ($request->discount ?? 0) : collect($splitsData)->sum('discount');
            $netPaid = $totalAmount - $totalDiscount; // Net cash paid/received

            $account = Account::findOrFail($request->account_id);
            // ... (keep ledger balance checks if necessary, but use totalAmount)

            // Simplified sum logic for performance or use existing if reliable
            $totalAllocated = collect($request->allocations)->sum('amount');
            if ($totalAllocated > ($totalAmount + 0.01)) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Allocation total exceeds gross payment.']);
            }

            // Generate Base Voucher No - Robust logic
            $prefix = $request->type === 'RECEIPT' ? 'CRV-' : 'CPV-';
            $lastVoucher = Payment::where('type', $request->type)
                ->where('voucher_no', 'LIKE', $prefix . '%')
                ->orderBy('id', 'desc')
                ->first();
            
            $nextId = 1;
            if ($lastVoucher) {
                // Extract number from prefix-0001 or prefix-0001-A
                $parts = explode('-', $lastVoucher->voucher_no);
                if (isset($parts[1])) {
                    $nextId = (int)$parts[1] + 1;
                }
            }
            $baseVoucherNo = $prefix . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $groupId = null;
            $createdPayments = [];

            foreach ($splitsData as $index => $split) {
                // Determine discount for this specific payment record
                // If it's multi-payment, apply the global discount to the first split
                $currentSplitDiscount = $isMulti ? ($index === 0 ? ($request->discount ?? 0) : 0) : ($split['discount'] ?? 0);

                // Skip if amount and discount are both 0 and not the only split
                if ($isMulti && $split['amount'] <= 0 && $currentSplitDiscount <= 0) continue;

                $voucherNo = $baseVoucherNo;

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
                    'amount' => max(0, $split['amount'] - $currentSplitDiscount), // Net cash paid
                    'discount' => $currentSplitDiscount,
                    'net_amount' => $split['amount'], // Gross amount settled
                    'type' => $request->type,
                    'cheque_no' => !empty($split['cheque_no']) ? $split['cheque_no'] : null,
                    'cheque_date' => !empty($split['cheque_date']) ? $split['cheque_date'] : null,
                    'clear_date' => !empty($split['clear_date']) ? $split['clear_date'] : null,
                    'remarks' => !empty($request->remarks) ? $request->remarks : null,
                    'payment_method' => !empty($split['payment_method']) ? $split['payment_method'] : null,
                    'cheque_id' => $chequeId,
                    'cheque_status' => ($split['payment_method'] ?? null) === 'Cheque' ? 'Pending' : 'Pending',
                    'message_line_id' => !empty($request->message_line_id) ? $request->message_line_id : null,
                    'firm_id' => !empty($request->firm_id) ? $request->firm_id : null,
                ]);

                // Handle "Cheque in hand" Logic
                if ($payment->paymentAccount && $payment->paymentAccount->accountType?->name === 'Cheque in hand') {
                    if ($request->type === 'RECEIPT' && $payment->payment_method === 'Cheque') {
                        // Mark newly received cheque as In Hand
                        $payment->update(['cheque_status' => 'In Hand']);
                    } elseif ($request->type === 'PAYMENT') {
                        // Mark the original source cheque as Distributed
                        if (isset($split['original_cheque_id']) && $split['original_cheque_id']) {
                            Payment::where('id', $split['original_cheque_id'])->update(['cheque_status' => 'Distributed']);
                            // Also record which original cheque this payment is linked to
                        }
                    }
                }

                if (!$groupId) {
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
                            $bill->paid_amount      += $canAllocate;
                            $bill->remaining_amount -= $canAllocate;

                            $isSale = ($alloc['bill_type'] === 'App\Models\Sales');
                            if ($bill->remaining_amount <= 0) {
                                $bill->status = $isSale ? 'Paid' : 'Completed';
                            } elseif ($bill->paid_amount > 0) {
                                $bill->status = $isSale ? 'Partial' : 'Completed';
                            } else {
                                $bill->status = $isSale ? 'Unpaid' : 'Completed';
                            }

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

            $savedPaymentsDetails = collect($createdPayments)->map(function ($p) {
                return [
                    'id' => $p->id,
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

    public function getAvailableCredits($customerId)
    {
        try {
            $credits = \App\Models\CustomerCredit::where('customer_id', $customerId)
                ->where('available_balance', '>', 0)
                ->where('status', '!=', 'Canceled')
                ->get();
            return response()->json($credits);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function refundCredit(Request $request)
    {
        $request->validate([
            'customer_credit_id' => 'required|integer|exists:customer_credits,id',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'payment_method' => 'required|string',
            'payment_account_id' => 'nullable|integer|exists:accounts,id',
            'remarks' => 'nullable|string',
        ]);

        try {
            $service = new \App\Services\CustomerCreditService();
            $payment = $service->processCreditRefund(
                $request->customer_credit_id,
                (float)$request->amount,
                $request->date,
                $request->payment_method,
                $request->payment_account_id,
                $request->remarks ?? ''
            );

            // Log activity
            \App\Services\ActivityLogger::log('created', 'Payment Refund', "Refunded credit note ID {$request->customer_credit_id} with voucher {$payment->voucher_no}");

            return redirect()->back()->with('success', 'Customer credit refunded successfully via voucher: ' . $payment->voucher_no);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Refund failed: ' . $e->getMessage());
        }
    }
}
