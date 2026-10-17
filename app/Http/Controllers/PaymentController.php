<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Purchase;
use App\Models\Sales;
use App\Models\Firm;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use App\Services\PaymentAllocationEngine;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PaymentController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view payments', only: [
                'index', 'show', 'pdf', 'getUnpaidBills', 'getNextCheque', 
                'getAvailableCheques', 'getBillItems', 'getAvailableCustomerCheques',
                'getAvailableCredits'
            ]),
            new Middleware('permission:create payments', only: ['create', 'store', 'refundCredit']),
            new Middleware('permission:edit payments', only: ['edit', 'update']),
            new Middleware('permission:delete payments', only: ['destroy']),
        ];
    }

    // List payments and stats
    public function index(Request $request)
    {
        $query = Payment::with(['account:id,code,title,type', 'paymentAccount:id,code,title,type', 'messageLine:id,name']);

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

        // Filter by Amount
        if ($request->filled('amount')) {
            $query->where('amount', $request->amount);
        }

        $allPayments = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        // Merge grouped (multi-voucher) payments
        $grouped = collect();
        $groups = [];

        foreach ($allPayments as $p) {
            if ($p->group_id) {
                if (isset($groups[$p->group_id])) {
                    $rep = $groups[$p->group_id];
                    $rep->amount += $p->amount;
                    $rep->net_amount += $p->net_amount;
                    $rep->discount += $p->discount;
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

        $perPage = 25;
        $currentPage = \Illuminate\Pagination\LengthAwarePaginator::resolveCurrentPage() ?: 1;
        $currentPageItems = $grouped->slice(($currentPage - 1) * $perPage, $perPage)->values();

        $payments = new \Illuminate\Pagination\LengthAwarePaginator(
            $currentPageItems,
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
        if ($request->filled('amount')) {
            $summaryQueryBase->where('amount', $request->amount);
        }

        $summaryRow = (clone $summaryQueryBase)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'RECEIPT' AND (cheque_status NOT IN ('Canceled', 'Cancelled') OR cheque_status IS NULL) THEN (amount + COALESCE(discount, 0)) ELSE 0 END), 0) as total_receipts,
                COALESCE(SUM(CASE WHEN type = 'PAYMENT' AND (cheque_status NOT IN ('Canceled', 'Cancelled') OR cheque_status IS NULL) THEN (amount + COALESCE(discount, 0)) ELSE 0 END), 0) as total_payments,
                COALESCE(SUM(CASE WHEN type = 'RECEIPT' AND cheque_status IN ('Canceled', 'Cancelled') THEN amount ELSE 0 END), 0) as canceled_receipts,
                COALESCE(SUM(CASE WHEN type = 'PAYMENT' AND cheque_status IN ('Canceled', 'Cancelled') THEN amount ELSE 0 END), 0) as canceled_payments,
                COUNT(*) as count,
                COUNT(CASE WHEN (cheque_status NOT IN ('Canceled', 'Cancelled') OR cheque_status IS NULL) THEN 1 END) as active_count,
                COUNT(CASE WHEN cheque_status IN ('Canceled', 'Cancelled') THEN 1 END) as canceled_count
            ")
            ->first();

        $totalReceipts = (float)($summaryRow->total_receipts ?? 0);
        $totalPayments = (float)($summaryRow->total_payments ?? 0);
        $canceledReceipts = (float)($summaryRow->canceled_receipts ?? 0);
        $canceledPayments = (float)($summaryRow->canceled_payments ?? 0);

        $summary = [
            'total_receipts' => $totalReceipts,
            'total_payments' => $totalPayments,
            'net_flow' => $totalReceipts - $totalPayments,
            'canceled_amount' => $canceledReceipts + $canceledPayments,
            'count' => (int)($summaryRow->count ?? 0),
            'active_count' => (int)($summaryRow->active_count ?? 0),
            'canceled_count' => (int)($summaryRow->canceled_count ?? 0),
        ];

        // ───────────────────────────────────────────
        // SALES SUMMARY (Lazy closure for partial reloads)
        // ───────────────────────────────────────────
        $salesSummary = function () use ($request) {
            $salesQuery = Sales::query();
            if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
                $salesQuery->whereBetween('date', [$request->start_date, $request->end_date]);
            }
            $salesAgg = (clone $salesQuery)->selectRaw('COALESCE(SUM(net_total), 0) as total_sales, COALESCE(SUM(paid_amount), 0) as total_paid, COALESCE(SUM(remaining_amount), 0) as total_unpaid')->first();

            $salesReturnQuery = \App\Models\SalesReturn::query();
            if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
                $salesReturnQuery->whereBetween('date', [$request->start_date, $request->end_date]);
            }

            return [
                'total_sales' => (float)($salesAgg->total_sales ?? 0),
                'total_paid' => (float)($salesAgg->total_paid ?? 0),
                'total_unpaid' => (float)($salesAgg->total_unpaid ?? 0),
                'total_returns' => (float)($salesReturnQuery->sum('net_total') ?? 0),
            ];
        };

        // ───────────────────────────────────────────
        // PURCHASE SUMMARY (Lazy closure for partial reloads)
        // ───────────────────────────────────────────
        $purchaseSummary = function () use ($request) {
            $purchaseQuery = Purchase::query();
            if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
                $purchaseQuery->whereBetween('date', [$request->start_date, $request->end_date]);
            }
            $purchaseAgg = (clone $purchaseQuery)->selectRaw('COALESCE(SUM(net_total), 0) as total_purchase, COALESCE(SUM(paid_amount), 0) as total_paid, COALESCE(SUM(remaining_amount), 0) as total_unpaid')->first();

            $purchaseReturnQuery = \App\Models\PurchaseReturn::query();
            if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
                $purchaseReturnQuery->whereBetween('date', [$request->start_date, $request->end_date]);
            }

            return [
                'total_purchase' => (float)($purchaseAgg->total_purchase ?? 0),
                'total_paid' => (float)($purchaseAgg->total_paid ?? 0),
                'total_unpaid' => (float)($purchaseAgg->total_unpaid ?? 0),
                'total_returns' => (float)($purchaseReturnQuery->sum('net_total') ?? 0),
            ];
        };

        // ───────────────────────────────────────────
        // ANALYTICS (Lazy closure for partial reloads)
        // ───────────────────────────────────────────
        $analytics = function () use ($request) {
            $analyticsData = [];
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
                $analyticsData[] = [
                    'date' => $date->format('M d'),
                    'sales' => $salesTotals[$currentDate] ?? 0,
                    'purchases' => $purchasesTotals[$currentDate] ?? 0,
                    'receipts' => $receiptsTotals[$currentDate] ?? 0,
                    'payments' => $paymentsTotals[$currentDate] ?? 0,
                ];
            }
            return $analyticsData;
        };

        return Inertia::render('daily/payment/index', [
            'payments' => $payments,
            'summary' => $summary,
            'sales_summary' => $salesSummary,
            'purchase_summary' => $purchaseSummary,
            'analytics' => $analytics,
            'filters' => $request->only(['start_date', 'end_date', 'account_id', 'type', 'payment_method', 'amount']),
            'accounts' => fn () => Account::select('id', 'title', 'type')->orderBy('title')->get(),
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
        $payment = Payment::with(['allocations', 'account', 'paymentAccount'])->findOrFail($id);

        $splits = [];
        if ($payment->group_id) {
            $groupPayments = Payment::where('group_id', $payment->group_id)->orderBy('id')->get();
        } else {
            $groupPayments = collect([$payment]);
        }

        if ($groupPayments->isNotEmpty()) {
            if ($groupPayments->count() > 1) {
                $payment->is_multi = true;
            }
            $splits = $groupPayments->map(function($p) {
                return [
                    'id' => $p->id,
                    'payment_account_id' => $p->payment_account_id ? (string)$p->payment_account_id : "",
                    'amount' => (float)$p->amount,
                    'cheque_no' => $p->cheque_no ?? "",
                    'cheque_date' => $p->cheque_date ?? "",
                    'clear_date' => $p->clear_date ?? "",
                    'payment_method' => $p->payment_method ?? "Cash",
                    'original_cheque_id' => $p->source_payment_id ? (string)$p->source_payment_id : ""
                ];
            })->toArray();
        }
        $payment->splits = $splits;

        $accounts = Account::active()->with('accountType')->select('id', 'title', 'type', 'purchase', 'sale', 'cashbank', 'opening_balance', 'opening_balance_type')->get();
        \App\Services\PaymentAccountingService::attachBulkBalances($accounts);
        $paymentAccounts = Account::eligibleForCashBank()->with('accountType')->get();

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
            'amount' => 'required|numeric|gt:0',
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
            'is_multi' => 'nullable|boolean',
            'splits' => 'nullable|array',
        ]);

        $payment = Payment::with('allocations')->findOrFail($id);
        $account = Account::findOrFail($request->account_id);

        $isMulti = (bool) $request->input('is_multi', false);
        $splitsData = $isMulti ? $request->input('splits', []) : [];

        if (empty($splitsData)) {
            $splitsData = [[
                'id' => $payment->id,
                'payment_account_id' => $request->payment_account_id,
                'amount' => $request->amount,
                'discount' => $request->discount ?? 0,
                'payment_method' => $request->payment_method ?? 'Cash',
                'cheque_no' => $request->cheque_no,
                'cheque_date' => $request->cheque_date,
                'clear_date' => $request->clear_date,
                'original_cheque_id' => $request->original_cheque_id,
            ]];
        }

        DB::beginTransaction();

        try {
            $groupId = $payment->group_id ?: $payment->id;
            $existingGroupPayments = $payment->group_id
                ? Payment::where('group_id', $payment->group_id)->orderBy('id')->get()
                : collect([$payment]);

            if ($existingGroupPayments->isEmpty()) {
                $existingGroupPayments = collect([$payment]);
            }

            $existingGroupPaymentIds = $existingGroupPayments->pluck('id')->toArray();
            if (!in_array($payment->id, $existingGroupPaymentIds)) {
                $existingGroupPaymentIds[] = $payment->id;
            }

            // 1. Reverse old allocations for all payments in this group (including opening balance)
            $allocationEngine = new PaymentAllocationEngine();
            $allocationEngine->reverseAllocations($existingGroupPayments);

            // 3. Reset old cheque status in Chequebook and restore distributed cheques
            foreach ($existingGroupPayments as $oldP) {
                if ($oldP->cheque_id) {
                    $cheque = \App\Models\Chequebook::find($oldP->cheque_id);
                    if ($cheque) {
                        $cheque->update(['status' => 'unused']);
                    }
                }
                if ($oldP->source_payment_id) {
                    Payment::where('id', $oldP->source_payment_id)->update(['cheque_status' => 'In Hand']);
                }
            }

            // 4. Validate and issue cheques for splits
            $chequeIds = [];
            foreach ($splitsData as $index => $split) {
                $splitChequeId = null;
                $splitMethod = $split['payment_method'] ?? null;
                $splitAccId = $split['payment_account_id'] ?? null;

                if ($request->type === 'PAYMENT' && $splitMethod === 'Cheque' && $splitAccId) {
                    $bankAccount = Account::with('accountType')->find($splitAccId);
                    $isBankAcc = $bankAccount && $bankAccount->accountType && strtolower($bankAccount->accountType->name) === 'bank';

                    if ($isBankAcc) {
                        $chequeNoInput = trim($split['cheque_no'] ?? '');
                        if (empty($chequeNoInput)) {
                            DB::rollBack();
                            return back()->withErrors(['cheque_no' => 'Cheque Number is required for Bank Cheque payments.']);
                        }

                        // Check if used in ANY OTHER active payment voucher (outside this group)
                        $alreadyUsedInPayment = Payment::where('payment_account_id', $splitAccId)
                            ->where('type', 'PAYMENT')
                            ->where('cheque_no', $chequeNoInput)
                            ->whereNotIn('id', $existingGroupPaymentIds)
                            ->where(function ($q) {
                                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
                            })
                            ->exists();

                        if ($alreadyUsedInPayment) {
                            DB::rollBack();
                            return back()->withErrors([
                                'cheque_no' => "Cheque #{$chequeNoInput} is already assigned to another active payment voucher/invoice."
                            ])->with('error', "Cheque #{$chequeNoInput} is already assigned to another active payment voucher.");
                        }

                        // Locate leaf in Chequebook
                        $chequeNoParts = explode('-', $chequeNoInput);
                        $cPrefix = '';
                        $cNum = $chequeNoInput;
                        if (count($chequeNoParts) >= 2) {
                            $cPrefix = $chequeNoParts[0];
                            $cNum = implode('-', array_slice($chequeNoParts, 1));
                        }

                        $cheque = \App\Models\Chequebook::where('bank_id', $splitAccId)
                            ->where(function ($q) use ($chequeNoInput, $cNum, $cPrefix) {
                                $q->where('cheque_no', $chequeNoInput)
                                  ->orWhere(function ($sub) use ($cNum, $cPrefix) {
                                      $sub->where('cheque_no', $cNum);
                                      if (!empty($cPrefix)) {
                                          $sub->where('prefix', $cPrefix);
                                      }
                                  });
                            })
                            ->lockForUpdate()
                            ->first();

                        if (!$cheque) {
                            DB::rollBack();
                            return back()->withErrors([
                                'cheque_no' => "Cheque #{$chequeNoInput} does not exist in the Cheque Book for this Bank Account. Duplicate or unregistered cheque numbers are blocked."
                            ])->with('error', "Cheque #{$chequeNoInput} does not exist in the Cheque Book for this Bank Account.");
                        }

                        $oldChequeIdsInGroup = $existingGroupPayments->pluck('cheque_id')->filter()->toArray();
                        if ($cheque->status !== 'unused' && !in_array($cheque->id, $oldChequeIdsInGroup)) {
                            DB::rollBack();
                            return back()->withErrors([
                                'cheque_no' => "Cheque #{$chequeNoInput} is currently marked as '{$cheque->status}'. Re-using an issued or cancelled cheque is strictly blocked."
                            ])->with('error', "Cheque #{$chequeNoInput} has already been {$cheque->status}.");
                        }

                        $splitChequeId = $cheque->id;
                        $cheque->update(['status' => 'issued']);
                    }
                }
                $chequeIds[$index] = $splitChequeId;
            }

            // 5. Update primary payment ($payment) and group payments
            $activePayments = [];

            // Primary split (index 0)
            $firstSplit = $splitsData[0];
            $firstSplitDiscount = (float)($request->discount ?? 0);
            $firstSplitAmount = max(0, (float)($firstSplit['amount'] ?? 0));
            $firstSplitMethod = !empty($firstSplit['payment_method']) ? $firstSplit['payment_method'] : 'Cash';
            $firstSplitAccId = !empty($firstSplit['payment_account_id']) ? $firstSplit['payment_account_id'] : null;

            $firstChequeStatus = ($account->accountType?->name === 'Bank')
                ? 'Clear'
                : ($firstSplitMethod === 'Cheque'
                    ? ($request->type === 'RECEIPT' ? 'In Hand' : 'Pending')
                    : 'Clear');

            $payment->update([
                'date' => $request->date,
                'account_id' => $request->account_id,
                'payment_account_id' => $firstSplitAccId,
                'amount' => $firstSplitAmount,
                'discount' => $firstSplitDiscount,
                'net_amount' => max(0, $firstSplitAmount + $firstSplitDiscount),
                'type' => $request->type,
                'cheque_no' => !empty($firstSplit['cheque_no']) ? $firstSplit['cheque_no'] : null,
                'cheque_date' => !empty($firstSplit['cheque_date']) ? $firstSplit['cheque_date'] : null,
                'clear_date' => !empty($firstSplit['clear_date']) ? $firstSplit['clear_date'] : null,
                'remarks' => $request->remarks,
                'payment_method' => $firstSplitMethod,
                'cheque_id' => $chequeIds[0] ?? null,
                'source_payment_id' => ($request->type === 'PAYMENT' && !empty($firstSplit['original_cheque_id'])) ? $firstSplit['original_cheque_id'] : null,
                'cheque_status' => $firstChequeStatus,
                'message_line_id' => $request->message_line_id,
                'firm_id' => $request->firm_id,
                'group_id' => $groupId,
            ]);

            // Handle Cheque in hand state for primary split
            if ($payment->paymentAccount && $payment->paymentAccount->accountType?->name === 'Cheque in hand') {
                if ($request->type === 'RECEIPT' && $payment->payment_method === 'Cheque') {
                    $payment->update(['cheque_status' => 'In Hand']);
                } elseif ($request->type === 'PAYMENT' && !empty($firstSplit['original_cheque_id'])) {
                    Payment::where('id', $firstSplit['original_cheque_id'])->update(['cheque_status' => 'Distributed']);
                }
            }
            $activePayments[] = $payment;

            // Handle additional splits (index 1..)
            $otherExistingPayments = $existingGroupPayments->where('id', '!=', $payment->id)->values();
            for ($i = 1; $i < count($splitsData); $i++) {
                $split = $splitsData[$i];
                $splitAmt = max(0, (float)($split['amount'] ?? 0));
                $splitMethod = !empty($split['payment_method']) ? $split['payment_method'] : 'Cash';
                $splitAccId = !empty($split['payment_account_id']) ? $split['payment_account_id'] : null;

                $splitChequeStatus = ($account->accountType?->name === 'Bank')
                    ? 'Clear'
                    : ($splitMethod === 'Cheque'
                        ? ($request->type === 'RECEIPT' ? 'In Hand' : 'Pending')
                        : 'Clear');

                $splitData = [
                    'date' => $request->date,
                    'voucher_no' => $payment->voucher_no,
                    'account_id' => $request->account_id,
                    'payment_account_id' => $splitAccId,
                    'amount' => $splitAmt,
                    'discount' => 0,
                    'net_amount' => $splitAmt,
                    'type' => $request->type,
                    'cheque_no' => !empty($split['cheque_no']) ? $split['cheque_no'] : null,
                    'cheque_date' => !empty($split['cheque_date']) ? $split['cheque_date'] : null,
                    'clear_date' => !empty($split['clear_date']) ? $split['clear_date'] : null,
                    'remarks' => $request->remarks,
                    'payment_method' => $splitMethod,
                    'cheque_id' => $chequeIds[$i] ?? null,
                    'source_payment_id' => ($request->type === 'PAYMENT' && !empty($split['original_cheque_id'])) ? $split['original_cheque_id'] : null,
                    'cheque_status' => $splitChequeStatus,
                    'message_line_id' => $request->message_line_id,
                    'firm_id' => $request->firm_id,
                    'group_id' => $groupId,
                ];

                if (isset($otherExistingPayments[$i - 1])) {
                    $gp = $otherExistingPayments[$i - 1];
                    $gp->update($splitData);
                    $targetP = $gp;
                } else {
                    $targetP = Payment::create($splitData);
                }

                if (!empty($splitAccId)) {
                    $acc = Account::with('accountType')->find($splitAccId);
                    if ($acc && $acc->accountType?->name === 'Cheque in hand') {
                        if ($request->type === 'RECEIPT' && $splitMethod === 'Cheque') {
                            $targetP->update(['cheque_status' => 'In Hand']);
                        } elseif ($request->type === 'PAYMENT' && !empty($split['original_cheque_id'])) {
                            Payment::where('id', $split['original_cheque_id'])->update(['cheque_status' => 'Distributed']);
                        }
                    }
                }
                $activePayments[] = $targetP;
            }

            // Delete surplus old group payments if split count was reduced
            if ($otherExistingPayments->count() > (count($splitsData) - 1)) {
                for ($i = count($splitsData) - 1; $i < $otherExistingPayments->count(); $i++) {
                    $otherExistingPayments[$i]->delete();
                }
            }

            // 6. Allocate new allocations across $activePayments using PaymentAllocationEngine (Opening Balance First + FIFO / Mode B)
            $allocationEngine = new PaymentAllocationEngine();
            if ($payment->type === 'RECEIPT') {
                $allocationEngine->allocateCustomerReceipt($activePayments, null, $request->allocations ?? []);
            } elseif ($payment->type === 'PAYMENT') {
                $allocationEngine->allocateSupplierPayment($activePayments, null, $request->allocations ?? []);
            }

            DB::commit();
            $totalActiveAmount = collect($activePayments)->sum('amount');
            return redirect()->route('payments.index')
                ->with('success', 'Payment updated successfully.')
                ->with('print_id', $payment->group_id ?? $payment->id)
                ->with('party_name', $account->title ?? 'General Party')
                ->with('amount', $totalActiveAmount)
                ->with('discount', $payment->discount)
                ->with('invoices_count', count($payment->allocations ?? []))
                ->with('method', count($activePayments) > 1 ? 'Multi' : ($payment->payment_method ?? ''))
                ->with('payment_type', $payment->type);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment Update Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Failed to update payment: ' . $e->getMessage()]);
        }
    }

    private function getTotalReturns($bill, string $billType): float
    {
        if ($billType === 'App\Models\Sales') {
            $allocatedReturns = (float) \App\Models\SalesReturnAllocation::where('sale_id', $bill->id)->sum('amount');
            $directReturns = (float) \App\Models\SalesReturn::where(function($q) use ($bill) {
                $q->where('sale_id', $bill->id)
                  ->orWhere(function($sub) use ($bill) {
                      $sub->whereNull('sale_id')
                          ->where('original_invoice', $bill->invoice)
                          ->where('customer_id', $bill->customer_id);
                  });
            })->whereNotIn('id', function($sub) {
                $sub->select('sales_return_id')->from('sales_return_allocations');
            })->sum(DB::raw('net_total - extra_discount'));

            return $allocatedReturns + $directReturns;
        } else {
            $allocatedReturns = (float) \App\Models\PurchaseReturnAllocation::where('purchase_id', $bill->id)->sum('amount');
            $directReturns = (float) \App\Models\PurchaseReturn::where('original_invoice', $bill->invoice)
                ->where('supplier_id', $bill->supplier_id)
                ->whereNotIn('id', function($sub) {
                    $sub->select('purchase_return_id')->from('purchase_return_allocations');
                })->sum(DB::raw('net_total - extra_discount'));

            return $allocatedReturns + $directReturns;
        }
    }

    public function destroy($id)
    {
        if (
            !auth()->user()?->can('delete payments') &&
            !\Illuminate\Support\Facades\Gate::allows('delete payments') &&
            !\Illuminate\Support\Facades\Gate::allows('delete-payment')
        ) {
            abort(403, 'Unauthorized to delete payment vouchers.');
        }

        $payment = Payment::with(['allocations', 'account'])->findOrFail($id);

        DB::beginTransaction();
        try {
            // Reverse and delete all allocations (Sales, Purchases, and Opening Balance)
            $allocationEngine = new PaymentAllocationEngine();
            $allocationEngine->reverseAllocations($payment);

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
            }

            // Clear any self-referencing foreign keys pointing to this payment
            Payment::where('source_payment_id', $payment->id)->update(['source_payment_id' => null]);

            \Illuminate\Support\Facades\Log::info('Financial Audit - Payment Voucher Deleted', [
                'action' => 'PAYMENT_PERMANENT_DELETE',
                'payment_id' => $payment->id,
                'voucher_no' => $payment->voucher_no,
                'account_id' => $payment->account_id,
                'party_title' => $payment->account?->title,
                'amount' => $payment->amount,
                'discount' => $payment->discount,
                'user_id' => request()->user()?->id,
                'user_name' => request()->user()?->name ?? 'System',
                'ip_address' => request()->ip(),
                'reversed_amount' => $payment->amount,
                'reversed_discount' => $payment->discount,
                'timestamp' => now()->toIso8601String(),
            ]);

            $voucherNo = $payment->voucher_no;
            $payment->delete();

            DB::commit();
            return back()->with('success', "Payment voucher {$voucherNo} deleted and all ledger balances restored.");
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
            $rowCount = 1;
            if ($payment->group_id) {
                $rowCount = Payment::where('group_id', $payment->group_id)->count();
            }
            
            $height = 330 + ($rowCount * 18);
            if ($payment->remarks) {
                $height += 35;
            }
            $msgLine = $payment->messageLine ?? $payment->message_line ?? null;
            if ($msgLine) {
                $height += 35;
            }
            
            $pdf->setPaper([0, 0, 226.77, $height], 'portrait');
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
        $accounts = Account::active()
            ->with('accountType')
            ->select('id', 'title', 'type', 'purchase', 'sale', 'cashbank', 'opening_balance', 'opening_balance_type')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', [
                    'Customers', 'Supplier', 'Expense', 'Other', 'Bank',
                    'AMANAT PAYABLE', 'RESERVE', 'Drawings', 'Capital'
                ]);
            })
            ->get();
        \App\Services\PaymentAccountingService::attachBulkBalances($accounts);
        $paymentAccounts = Account::eligibleForCashBank()
            ->with('accountType')
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

            // Calculate Remaining Opening Balance
            $allocationEngine = new PaymentAllocationEngine();
            $remainingOB = $allocationEngine->getRemainingOpeningBalance($account);

            $obKey = 'App\Models\Account_' . $account->id;
            $obAllocatedAmount = 0.0;
            if (isset($allocatedBills[$obKey])) {
                $obAllocatedAmount = (float)$allocatedBills[$obKey]->amount;
            }

            $obRemainingAmount = round($remainingOB + $obAllocatedAmount, 2);
            $obBill = null;
            if ($obRemainingAmount > 0.005) {
                $obBill = [
                    'id' => $account->id,
                    'type' => 'App\Models\Account',
                    'unique_key' => 'App\Models\Account_' . $account->id,
                    'invoice_no' => 'OPENING-BAL',
                    'date' => $account->created_at ? $account->created_at->format('Y-m-d') : ($account->date ?? date('Y-m-d')),
                    'net_total' => (float)$account->opening_balance,
                    'discount_total' => 0,
                    'return_amount' => 0,
                    'remaining_amount' => $obRemainingAmount,
                    'bill_type_label' => 'Opening Balance',
                    'allocated_amount' => $obAllocatedAmount,
                    'is_opening_balance' => true,
                ];
            }

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
                        'unique_key' => 'App\Models\Sales_' . $sale->id,
                        'invoice_no' => $sale->invoice,
                        'date' => $sale->date,
                        'net_total' => $sale->net_total,
                        'discount_total' => $sale->discount_total,
                        'return_amount' => $returnAmount,
                        'remaining_amount' => $sale->remaining_amount + $allocatedAmount,
                        'bill_type_label' => 'Sale',
                        'allocated_amount' => $allocatedAmount,
                        'is_opening_balance' => false,
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
                        'unique_key' => 'App\Models\Purchase_' . $purchase->id,
                        'invoice_no' => $purchase->invoice,
                        'date' => $purchase->date,
                        'net_total' => $purchase->net_total,
                        'discount_total' => $purchase->discount_total,
                        'return_amount' => $returnAmount,
                        'remaining_amount' => $purchase->remaining_amount + $allocatedAmount,
                        'bill_type_label' => 'Purchase',
                        'allocated_amount' => $allocatedAmount,
                        'is_opening_balance' => false,
                    ];
                })
                ->toArray();

            $bills = array_merge($sales, $purchases);
            usort($bills, function($a, $b) {
                $dateCmp = strcmp($a['date'], $b['date']);
                if ($dateCmp !== 0) return $dateCmp;
                return $a['id'] <=> $b['id'];
            });

            if ($obBill) {
                array_unshift($bills, $obBill);
            }

            // Use the centralized current_balance logic from Account model
            $netLedgerBalance = (float) $account->current_balance;
            if ($paymentObj) {
                $netLedgerBalance += ($paymentObj->amount + $paymentObj->discount);
            }

            $type = strtolower($account->accountType->name ?? '');
            $isCreditNormal = in_array($type, ['supplier', 'capital', 'amanat payable', 'reserve'])
                || in_array((int)$account->type, [6, 9, 17, 18]);
            $orientation = $isCreditNormal ? 'cr' : 'dr';

            // Calculate Unpaid Billed Balance (Sum of remaining amounts on invoices)
            $totalUnpaidBilled = collect($bills)->sum('remaining_amount');

            // Advance calculation using centralized service:
            $advanceAmount = \App\Services\PaymentAccountingService::getAccountAdvanceBalance($account);

            // Compute Financial Auditor Stats based on Account Type
            $totalSalesOrPurchases = 0;
            $totalReceivedOrPaid = 0;
            $totalBalance = 0;
            $advancePaid = 0;

            $totalDiscountVal = 0;
            if ($type === 'customers') {
                $totalSalesVal = (float) $account->sales()->sum('net_total') - (float) $account->sales()->sum('extra_discount');
                $totalReturnsVal = (float) $account->salesReturns()->sum('net_total') - (float) $account->salesReturns()->sum('extra_discount');
                $totalSalesOrPurchases = $totalSalesVal - $totalReturnsVal + $account->getSignedOpeningBalance();

                $totalDiscountVal = (float) $account->partyPayments()->where('type', 'RECEIPT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    })->sum('discount');

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
                $totalPurchasesVal = (float) $account->purchases()->sum('net_total') - (float) $account->purchases()->sum('extra_discount');
                $totalReturnsVal = (float) $account->purchaseReturns()->sum('net_total') - (float) $account->purchaseReturns()->sum('extra_discount');
                $totalSalesOrPurchases = $totalPurchasesVal - $totalReturnsVal + $account->getSignedOpeningBalance();

                $totalDiscountVal = (float) $account->partyPayments()->where('type', 'PAYMENT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    })->sum('discount');

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
            } elseif (in_array($type, ['capital', 'amanat payable', 'reserve'])) {
                $receiptsQuery = $account->partyPayments()->where('type', 'RECEIPT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    });
                $paymentsQuery = $account->partyPayments()->where('type', 'PAYMENT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    });
                $totalReceipts = (float)(clone $receiptsQuery)->sum(DB::raw('amount + discount'));
                $totalPayments = (float)(clone $paymentsQuery)->sum(DB::raw('amount + discount'));

                $totalReceivedOrPaid = $totalReceipts - $totalPayments;
                if ($paymentObj && $paymentObj->account_id == $account->id) {
                    if ($paymentObj->type === 'RECEIPT') {
                        $totalReceivedOrPaid -= ($paymentObj->amount + $paymentObj->discount);
                    } else {
                        $totalReceivedOrPaid += ($paymentObj->amount + $paymentObj->discount);
                    }
                }
                $totalSalesOrPurchases = $account->getSignedOpeningBalance();
                $totalBalance = $netLedgerBalance;
            } elseif ($type === 'drawings') {
                $paymentsQuery = $account->partyPayments()->where('type', 'PAYMENT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    });
                $receiptsQuery = $account->partyPayments()->where('type', 'RECEIPT')
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                    });
                $totalPayments = (float)(clone $paymentsQuery)->sum(DB::raw('amount + discount'));
                $totalReceipts = (float)(clone $receiptsQuery)->sum(DB::raw('amount + discount'));

                $totalReceivedOrPaid = $totalPayments - $totalReceipts;
                if ($paymentObj && $paymentObj->account_id == $account->id) {
                    if ($paymentObj->type === 'PAYMENT') {
                        $totalReceivedOrPaid -= ($paymentObj->amount + $paymentObj->discount);
                    } else {
                        $totalReceivedOrPaid += ($paymentObj->amount + $paymentObj->discount);
                    }
                }
                $totalSalesOrPurchases = $account->getSignedOpeningBalance();
                $totalBalance = $netLedgerBalance;
            } elseif (in_array($type, ['bank', 'cash', 'cheque in hand'])) {
                $baseQuery = $account->financialPayments()
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                    });

                $totalIn = (clone $baseQuery)->where('type', 'RECEIPT')
                    ->where(function($q) {
                        $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                          ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                    })->sum('amount');

                $totalOut = (clone $baseQuery)->where('type', 'PAYMENT')
                    ->where(function($q) {
                        $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                          ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                    })->sum('amount');

                $partyQuery = $account->partyPayments()
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                    });

                $partyIn = (clone $partyQuery)->where('type', 'PAYMENT')
                    ->where(function($q) {
                        $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                          ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                    })->sum('amount');

                $partyOut = (clone $partyQuery)->where('type', 'RECEIPT')
                    ->where(function($q) {
                        $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                          ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                    })->sum('amount');

                $totalSalesOrPurchases = (float)$totalIn + (float)$partyIn;
                $totalReceivedOrPaid = (float)$totalOut + (float)$partyOut;

                if ($paymentObj) {
                    if ($paymentObj->payment_account_id == $account->id) {
                        if ($paymentObj->type === 'RECEIPT') {
                            $totalSalesOrPurchases -= $paymentObj->amount;
                        } else {
                            $totalReceivedOrPaid -= $paymentObj->amount;
                        }
                    }
                    if ($paymentObj->account_id == $account->id) {
                        if ($paymentObj->type === 'PAYMENT') {
                            $totalSalesOrPurchases -= $paymentObj->amount;
                        } else {
                            $totalReceivedOrPaid -= $paymentObj->amount;
                        }
                    }
                }

                $totalBalance = $netLedgerBalance;
            }

            return response()->json([
                'bills' => $bills,
                'current_balance' => $netLedgerBalance,
                'advance_amount' => $advanceAmount,
                'orientation' => $orientation,
                'total_sales_purchases' => $totalSalesOrPurchases,
                'total_received_paid' => $totalReceivedOrPaid,
                'total_discount' => $totalDiscountVal,
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

    // Get all unused cheques for a bank account (plus current cheque if editing)
    public function getAvailableCheques(Request $request)
    {
        $accountId = $request->input('account_id');
        $currentChequeNo = $request->input('current_cheque_no');
        $currentChequeId = $request->input('current_cheque_id');

        $bank = Account::find($accountId);
        $bankTitle = $bank ? $bank->title : 'Bank';

        $query = \App\Models\Chequebook::with('bank')
            ->where('bank_id', $accountId)
            ->where(function ($q) use ($currentChequeId, $currentChequeNo) {
                $q->where('status', 'unused');
                if ($currentChequeId) {
                    $q->orWhere('id', $currentChequeId);
                }
                if ($currentChequeNo) {
                    $q->orWhere('cheque_no', $currentChequeNo);
                }
            });

        $cheques = $query->orderBy('cheque_no', 'asc')->get();

        $formatted = $cheques->map(function ($cheque) use ($bankTitle) {
            $prefix = $cheque->prefix ? trim($cheque->prefix) : '';
            $fullNo = $prefix ? $prefix . '-' . $cheque->cheque_no : $cheque->cheque_no;
            $label = $prefix 
                ? "{$bankTitle} | {$prefix}-{$cheque->cheque_no}" 
                : "{$bankTitle} | {$cheque->cheque_no}";

            return [
                'id' => $cheque->id,
                'cheque_no' => $cheque->cheque_no,
                'prefix' => $cheque->prefix,
                'bank_name' => $bankTitle,
                'value' => $fullNo,
                'label' => $label,
                'status' => $cheque->status,
            ];
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

    public function store(StorePaymentRequest $request)
    {
        $userId = $request->user()?->id ?? 'guest';
        $lock = Cache::lock('payment_store_' . $request->account_id . '_' . $userId, 5);

        if (!$lock->get()) {
            return back()->withErrors(['error' => 'A payment submission is already being processed. Please wait a moment.']);
        }

        try {
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

            // Safety checks (Total aggregate)
            $totalAmount = collect($splitsData)->sum('amount'); // Cash/Bank disbursement total
            if ($totalAmount <= 0) {
                DB::rollBack();
                optional($lock)->release();
                return back()->withErrors(['error' => 'Payment amount must be greater than 0.']);
            }
                $totalDiscount = $isMulti ? ($request->discount ?? 0) : collect($splitsData)->sum('discount');
                $totalGrossSettlement = $totalAmount + $totalDiscount; // Total settlement value (Cash + Discount)

                $account = Account::findOrFail($request->account_id);

                // Prevent duplicate rapid voucher submissions (identical account, type, amount within 3 seconds)
                $recentDuplicate = Payment::where('account_id', $request->account_id)
                    ->where('type', $request->type)
                    ->where('amount', max(0, (float)($splitsData[0]['amount'] ?? 0)))
                    ->where('created_at', '>=', now()->subSeconds(3))
                    ->first();

                if ($recentDuplicate) {
                    DB::rollBack();
                    $lock->release();
                    return back()->withErrors(['error' => 'Duplicate payment submission detected. Transaction blocked.']);
                }

            // Simplified sum logic for performance or use existing if reliable
            $totalAllocated = collect($request->allocations)->sum('amount');
            if ($totalAllocated > ($totalGrossSettlement + 0.01)) {
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
                // Validate source cheque if depositing / distributing an in-hand cheque
                if (!empty($split['original_cheque_id'])) {
                    $sourceCheque = Payment::find($split['original_cheque_id']);
                    if (!$sourceCheque) {
                        DB::rollBack();
                        return back()->withErrors(['error' => 'Selected source cheque not found.']);
                    }
                    if (in_array($sourceCheque->cheque_status, ['Distributed', 'Deposit', 'Cleared', 'Clear', 'Canceled'])) {
                        DB::rollBack();
                        return back()->withErrors(['error' => 'Cheque (' . ($sourceCheque->cheque_no ?? $sourceCheque->voucher_no) . ') has already been processed (' . $sourceCheque->cheque_status . '). Duplicate deposit prevented.']);
                    }
                }
                // Determine discount for this specific payment record
                // If it's multi-payment, apply the global discount to the first split
                $currentSplitDiscount = $isMulti ? ($index === 0 ? ($request->discount ?? 0) : 0) : ($split['discount'] ?? 0);

                // Skip if amount and discount are both 0 and not the only split
                if ($isMulti && $split['amount'] <= 0 && $currentSplitDiscount <= 0) continue;

                $voucherNo = $baseVoucherNo;

                // Handle Cheque for this split
                $chequeId = null;
                if ($request->type === 'PAYMENT' && ($split['payment_method'] ?? null) === 'Cheque' && ($split['payment_account_id'] ?? null)) {
                    $bankAccount = Account::with('accountType')->find($split['payment_account_id']);
                    $isBankAcc = $bankAccount && $bankAccount->accountType && strtolower($bankAccount->accountType->name) === 'bank';

                    if ($isBankAcc) {
                        $chequeNoInput = trim($split['cheque_no'] ?? '');
                        if (empty($chequeNoInput)) {
                            DB::rollBack();
                            return back()->withErrors(['cheque_no' => 'Cheque Number is required for Bank Cheque payments.']);
                        }

                        // 1. Check if already used in another active PAYMENT voucher
                        $alreadyUsedInPayment = Payment::where('payment_account_id', $split['payment_account_id'])
                            ->where('type', 'PAYMENT')
                            ->where('cheque_no', $chequeNoInput)
                            ->where(function ($q) {
                                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
                            })
                            ->exists();

                        if ($alreadyUsedInPayment) {
                            DB::rollBack();
                            return back()->withErrors([
                                'cheque_no' => "Cheque #{$chequeNoInput} is already assigned to another active payment voucher/invoice."
                            ])->with('error', "Cheque #{$chequeNoInput} is already assigned to another active payment voucher.");
                        }

                        // 2. Locate leaf in Chequebook
                        $chequeNoParts = explode('-', $chequeNoInput);
                        $cPrefix = '';
                        $cNum = $chequeNoInput;
                        if (count($chequeNoParts) >= 2) {
                            $cPrefix = $chequeNoParts[0];
                            $cNum = implode('-', array_slice($chequeNoParts, 1));
                        }

                        $cheque = \App\Models\Chequebook::where('bank_id', $split['payment_account_id'])
                            ->where(function ($q) use ($chequeNoInput, $cNum, $cPrefix) {
                                $q->where('cheque_no', $chequeNoInput)
                                  ->orWhere(function ($sub) use ($cNum, $cPrefix) {
                                      $sub->where('cheque_no', $cNum);
                                      if (!empty($cPrefix)) {
                                          $sub->where('prefix', $cPrefix);
                                      }
                                  });
                            })
                            ->lockForUpdate()
                            ->first();

                        if (!$cheque) {
                            DB::rollBack();
                            return back()->withErrors([
                                'cheque_no' => "Cheque #{$chequeNoInput} does not exist in the Cheque Book for this Bank Account. Duplicate or unregistered cheque numbers are blocked."
                            ])->with('error', "Cheque #{$chequeNoInput} does not exist in the Cheque Book for this Bank Account.");
                        }

                        if ($cheque->status !== 'unused') {
                            DB::rollBack();
                            return back()->withErrors([
                                'cheque_no' => "Cheque #{$chequeNoInput} is currently marked as '{$cheque->status}'. Re-using an issued or cancelled cheque is strictly blocked."
                            ])->with('error', "Cheque #{$chequeNoInput} has already been {$cheque->status}.");
                        }

                        $chequeId = $cheque->id;
                        $cheque->update(['status' => 'issued']);
                    }
                }

                $payment = Payment::create([
                    'date' => $request->date,
                    'voucher_no' => $voucherNo,
                    'account_id' => $request->account_id,
                    'payment_account_id' => !empty($split['payment_account_id']) ? $split['payment_account_id'] : null,
                    'amount' => max(0, (float)$split['amount']), // Cash/Bank amount received/paid
                    'discount' => $currentSplitDiscount,
                    'net_amount' => max(0, (float)$split['amount'] + $currentSplitDiscount), // Total settlement value (Cash + Discount)
                    'type' => $request->type,
                    'cheque_no' => !empty($split['cheque_no']) ? $split['cheque_no'] : null,
                    'cheque_date' => !empty($split['cheque_date']) ? $split['cheque_date'] : null,
                    'clear_date' => !empty($split['clear_date']) ? $split['clear_date'] : null,
                    'remarks' => !empty($request->remarks) ? $request->remarks : null,
                    'payment_method' => !empty($split['payment_method']) ? $split['payment_method'] : null,
                    'cheque_id' => $chequeId,
                    'cheque_status' => ($account->accountType?->name === 'Bank')
                        ? 'Clear'
                        : (($split['payment_method'] ?? null) === 'Cheque'
                            ? ($request->type === 'RECEIPT' ? 'In Hand' : 'Pending')
                            : 'Clear'),
                    'message_line_id' => !empty($request->message_line_id) ? $request->message_line_id : null,
                    'firm_id' => !empty($request->firm_id) ? $request->firm_id : null,
                    'source_payment_id' => ($request->type === 'PAYMENT' && !empty($split['original_cheque_id'])) ? $split['original_cheque_id'] : null,
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

            // Distribute allocations across created payments using PaymentAllocationEngine (Opening Balance First + FIFO / Mode B)
            $allocationEngine = new PaymentAllocationEngine();
            if ($request->type === 'RECEIPT') {
                $allocationEngine->allocateCustomerReceipt($createdPayments, null, $request->allocations ?? []);
            } elseif ($request->type === 'PAYMENT') {
                $allocationEngine->allocateSupplierPayment($createdPayments, null, $request->allocations ?? []);
            }

            $savedPaymentsDetails = collect($createdPayments)->map(function ($p) {
                return [
                    'id' => $p->id,
                    'voucher_no' => $p->voucher_no,
                    'account' => $p->paymentAccount->title ?? 'Cash',
                    'amount' => $p->amount
                ];
            });

            \Illuminate\Support\Facades\Log::info('Financial Audit - Payment Created', [
                'action' => 'PAYMENT_STORE',
                'user_id' => $request->user()?->id,
                'user_name' => $request->user()?->name ?? 'System',
                'ip_address' => $request->ip(),
                'account_id' => $request->account_id,
                'type' => $request->type,
                'total_amount' => $totalAmount,
                'total_discount' => $totalDiscount,
                'gross_settlement' => $totalGrossSettlement,
                'vouchers' => collect($createdPayments)->pluck('voucher_no')->toArray(),
                'timestamp' => now()->toIso8601String(),
            ]);

            DB::commit();
            optional($lock)->release();

            return redirect()->route('payments.index')
                ->with('success', 'Payment saved successfully.')
                ->with('print_id', $groupId)
                ->with('saved_payments', $savedPaymentsDetails)
                ->with('party_name', $account->title ?? 'General Party')
                ->with('amount', $totalAmount)
                ->with('discount', $totalDiscount)
                ->with('invoices_count', count($request->allocations ?? []))
                ->with('method', $isMulti ? 'Multi' : ($request->payment_method ?? 'Cash'))
                ->with('payment_type', $request->type);
        } catch (\Exception $e) {
            DB::rollBack();
            optional($lock)->release();
            \Illuminate\Support\Facades\Log::error('Payment Store Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Failed to save payment: ' . $e->getMessage()]);
        } finally {
            optional($lock)->release();
        }
    }
    
    public function getAvailableCredits(int|string $customerId)
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
