<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Items;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Firm;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Chequebook;
use App\Services\AdvanceAllocationService;
use App\Services\StockService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\Rule;


use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PurchaseController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view purchases', only: ['index', 'view', 'pdf', 'download', 'getLastPurchaseInfo']),
            new Middleware('permission:create purchases', only: ['create', 'store']),
            new Middleware('permission:edit purchases', only: ['edit', 'update']),
            new Middleware('permission:delete purchases', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Purchase::select(
            'id', 'invoice', 'code', 'date', 'created_at', 'status',
            'supplier_id', 'salesman_id', 'gross_total', 'courier_charges',
            'discount_total', 'extra_discount', 'tax_total', 'net_total',
            'paid_amount', 'remaining_amount', 'no_of_items'
        )->with([
            'supplier:id,title',
            'salesman:id,name',
        ]);

        // Filter by Date Range — use end-of-day to include all records on the end date
        if (!empty($request->start_date) && !empty($request->end_date)) {
            $query->whereBetween('date', [
                $request->start_date . ' 00:00:00',
                $request->end_date   . ' 23:59:59',
            ]);
        } elseif (!empty($request->start_date)) {
            $query->whereDate('date', '>=', $request->start_date);
        } elseif (!empty($request->end_date)) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        // Filter by Supplier
        if (!empty($request->supplier_id) && $request->supplier_id !== 'all') {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Filter by Status — guard against empty string coming from cleared filter
        if (!empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by Search — matches invoice number, supplier code, or supplier name
        if (!empty($request->search)) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('invoice', 'like', $term)
                  ->orWhere('code', 'like', $term)
                  ->orWhereHas('supplier', fn ($s) => $s->where('title', 'like', $term));
            });
        }

        // Filter by Amount — matches net_total, gross_total, or remaining_amount
        if ($request->filled('amount')) {
            $rawAmt = str_replace([',', ' '], '', trim((string) $request->amount));
            if (is_numeric($rawAmt)) {
                $amtFloat = (float) $rawAmt;
                $query->where(function ($q) use ($amtFloat, $rawAmt) {
                    $q->whereBetween('net_total', [$amtFloat - 0.99, $amtFloat + 0.99])
                      ->orWhereBetween('gross_total', [$amtFloat - 0.99, $amtFloat + 0.99])
                      ->orWhereBetween('remaining_amount', [$amtFloat - 0.99, $amtFloat + 0.99])
                      ->orWhere('net_total', 'like', "%{$rawAmt}%");
                });
            }
        }

        // Summary Calculations via SQL across full filtered dataset
        $summaryQuery = clone $query;
        $summaryQuery->getQuery()->columns = null;
        $agg = $summaryQuery->selectRaw('
            COUNT(*) as count,
            COALESCE(SUM(net_total - COALESCE(extra_discount, 0)), 0) as total_purchase,
            COALESCE(SUM(paid_amount), 0) as total_paid,
            COALESCE(SUM(remaining_amount), 0) as total_unpaid
        ')->first();

        // For Returns, apply matching filters to PurchaseReturn model
        $returnQuery = \App\Models\PurchaseReturn::query();
        if (!empty($request->start_date) && !empty($request->end_date)) {
            $returnQuery->whereBetween('date', [
                $request->start_date . ' 00:00:00',
                $request->end_date   . ' 23:59:59',
            ]);
        }
        if (!empty($request->supplier_id) && $request->supplier_id !== 'all') {
            $returnQuery->where('supplier_id', $request->supplier_id);
        }
        $totalReturns = (float)$returnQuery->sum('net_total');

        $summary = [
            'total_purchase' => (float)($agg->total_purchase ?? 0),
            'total_paid' => (float)($agg->total_paid ?? 0),
            'total_unpaid' => (float)($agg->total_unpaid ?? 0),
            'total_returns' => $totalReturns,
            'count' => (int)($agg->count ?? 0),
        ];

        // Optimized payload: When no filters or search are active, stream the latest 100 purchases.
        // When any filter is selected (supplier, dates, status, search, amount), load all matching results.
        $hasFilters = $request->filled('start_date') || $request->filled('end_date') || ($request->filled('supplier_id') && $request->supplier_id !== 'all') || ($request->filled('status') && $request->status !== 'all') || $request->filled('search') || $request->filled('amount');

        $purchasesQuery = $query->latest();
        if (!$hasFilters && !$request->boolean('all')) {
            $purchases = $purchasesQuery->take(100)->get();
        } else {
            $purchases = $purchasesQuery->get();
        }

        $purchases->each(function ($p) {
            if ($p->relationLoaded('supplier') && $p->supplier) {
                $p->supplier->setHidden(['current_balance', 'guest_link', 'image_url']);
            }
        });

        // Suppliers for Filter
        $suppliers = Account::eligibleForPurchase()
            ->select('id', 'title', 'code')
            ->orderBy('title')
            ->get();

        return Inertia::render("daily/purchase/index", [
            'purchases' => $purchases,
            'summary' => $summary,
            'filters' => $request->all(['start_date', 'end_date', 'supplier_id', 'status', 'search', 'amount', 'all']),
            'suppliers' => $suppliers,
            'isLimited' => !$hasFilters && !$request->boolean('all'),
        ]);
    }
    //create
    public function create()
    {
        // Historical average stats for items
        $purchaseStats = DB::table('purchase_items')
            ->select('item_id',
                DB::raw('COUNT(*) as cnt'),
                DB::raw('ROUND(AVG(trade_price), 2) as avg_rate')
            )
            ->groupBy('item_id')
            ->get()
            ->keyBy('item_id');

        $saleStats = DB::table('sales_items')
            ->select('item_id',
                DB::raw('COUNT(*) as cnt'),
                DB::raw('ROUND(AVG(trade_price), 2) as avg_rate')
            )
            ->groupBy('item_id')
            ->get()
            ->keyBy('item_id');

        // Load active items with lightweight column selection
        $items = Items::where('is_active', 1)
            ->select('id', 'date', 'code', 'title', 'short_name', 'company', 'trade_price', 'retail', 'retail_tp_diff', 'reorder_level', 'packing_qty', 'packing_size', 'pcs', 'type', 'category', 'gst_percent', 'gst_amount', 'discount', 'stock_1', 'stock_2', 'is_active')
            ->with(['lastPurchaseItem.purchase.supplier' => function($q) {
                $q->select('id', 'title');
            }])
            ->get()
            ->map(function ($item) use ($purchaseStats, $saleStats) {
                $lastP = $item->lastPurchaseItem;
                if ($lastP) {
                    $item->last_purchase_rate = (float) $lastP->trade_price;
                    $item->last_purchase_date = $lastP->purchase ? $lastP->purchase->date : null;
                    $item->last_supplier_name = $lastP->purchase && $lastP->purchase->supplier ? $lastP->purchase->supplier->title : null;
                    $item->last_purchase_qty_full = (float) $lastP->qty_carton;
                    $item->last_purchase_qty_pcs = (float) $lastP->qty_pcs;
                    $item->last_purchase_total = (float) $lastP->subtotal;
                }
                $item->unsetRelation('lastPurchaseItem');

                $pStat = $purchaseStats->get($item->id);
                $sStat = $saleStats->get($item->id);

                $item->has_purchases = $pStat ? ($pStat->cnt > 0) : false;
                $item->avg_purchase_rate = $pStat ? (float) $pStat->avg_rate : 0;

                $item->has_sales = $sStat ? ($sStat->cnt > 0) : false;
                $item->avg_sale_rate = $sStat ? (float) $sStat->avg_rate : 0;

                return $item;
            });

        // Attach true real-time ledger balances
        StockService::attachRealtimeBalances($items);

        // Accounts are loaded on-demand via /account/picker (server-side paginated search)
        $accounts = [];

        $salemans = Saleman::select('id', 'name', 'code')->get();

        // Calculate Next Invoice Number
        $lastPurchase = Purchase::where('invoice', 'LIKE', 'PUR-%')
            ->where('invoice', 'NOT LIKE', 'PUR-TMP-%')
            ->orderByDesc('id')
            ->first();
        $nextInvoiceNo = 'PUR-000001';

        if ($lastPurchase && preg_match('/PUR-(\d+)/', $lastPurchase->invoice, $matches)) {
            $number = intval($matches[1]);
            $nextInvoiceNo = 'PUR-' . str_pad($number + 1, 6, '0', STR_PAD_LEFT);
        }

        $messageLines = \App\Models\MessageLine::whereJsonContains('category', 'Purchase')
            ->where('status', 'active')
            ->get();

        $firms = Firm::select('id', 'name', 'defult')->get();

        $paymentAccounts = Account::eligibleForCashBank()
            ->select('id', 'title', 'type', 'code')
            ->with('accountType:id,name')
            ->get();

        \App\Services\PaymentAccountingService::attachBulkBalances($paymentAccounts);

        $customerCheques = Payment::where('type', 'RECEIPT')
            ->where('payment_method', 'Cheque')
            ->where('cheque_status', 'Pending')
            ->select('id', 'cheque_no', 'amount', 'cheque_date')
            ->get();

        $availableCheques = Chequebook::where('status', 'unused')
             ->select('id', 'bank_id', 'cheque_no')
             ->get();

        return Inertia::render("daily/purchase/create", [
            'items' => $items,
            'accounts' => $accounts,
            'salemans' => $salemans,
            'paymentAccounts' => $paymentAccounts,
            'customerCheques' => $customerCheques,
            'availableCheques' => $availableCheques,
            'nextInvoiceNo' => $nextInvoiceNo,
            'messageLines' => $messageLines,
            'firms' => $firms,
        ]);
    }
    //store
    public function store(Request $request)
    {
        $request->validate([
            'date'            => 'required|date',
            'invoice'         => 'nullable|string',
            'code'            => 'nullable|string',
            'supplier_id'     => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')->where(function ($q) {
                    $q->where('purchase', 1)->where(function ($sub) {
                        $sub->where('status', 1)->orWhere('status', true)->orWhereNull('status');
                    });
                }),
            ],
            'salesman_id'     => 'nullable|integer',
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
            'extra_discount'  => 'nullable|numeric',
            'tax_total'       => 'nullable|numeric',
            'courier_charges' => 'nullable|numeric',
            'net_total'       => 'required|numeric',
            'paid_amount'     => 'required|numeric',
            'remaining_amount' => 'required|numeric',

            // items array validation
            'items'                   => 'required|array',
            'items.*.item_id'         => 'required|integer',
            'items.*.qty_carton'      => 'required|numeric',
            'items.*.qty_pcs'         => 'required|numeric',
            'items.*.total_pcs'       => 'required|numeric',
            'items.*.trade_price'     => 'required|numeric',
            'items.*.discount'        => 'required|numeric',
            'items.*.bonus_full'      => 'nullable|numeric',
            'items.*.bonus_pcs'       => 'nullable|numeric',
            'items.*.gst_amount'      => 'required|numeric',
            'items.*.subtotal'        => 'required|numeric',
            'print_format'            => 'nullable|in:big,small',
            'message_line_id'         => 'nullable|integer',
            'firm_id'                 => 'nullable|integer',
            'update_prices'           => 'nullable|boolean',
            'idempotency_key'          => 'nullable|string|max:64',
        ]);

        $idempotencyService = app(\App\Services\IdempotencyService::class);

        try {
            return $idempotencyService->execute(
                idempotencyKey: $request->input('idempotency_key'),
                routeName: 'purchase.store',
                payload: $request->except(['_token']),
                userId: \Illuminate\Support\Facades\Auth::id(),
                callback: function () use ($request) {
            // --- Multi-Method Split Payments & Allocation Logic ---
            $isPayNow = (bool) $request->input('is_pay_now', false);
            $isMulti = (bool) $request->input('is_multi', false);
            $splitsData = [];
            $totalPaidAmount = 0;

            if ($isPayNow) {
                if ($isMulti) {
                    $rawSplits = $request->input('splits', []);
                    foreach ($rawSplits as $split) {
                        $amt = (float) ($split['amount'] ?? 0);
                        if ($amt > 0 && !empty($split['payment_account_id'])) {
                            $splitsData[] = $split;
                            $totalPaidAmount += $amt;
                        }
                    }
                } else {
                    $amount = (float) ($request->paid_amount ?? 0);
                    if ($amount > 0 && $request->payment_account_id) {
                        $totalPaidAmount = $amount;
                        $splitsData = [[
                            'payment_account_id' => $request->payment_account_id,
                            'amount' => $totalPaidAmount,
                            'payment_method' => $request->payment_method ?? 'Cash',
                            'cheque_no' => $request->cheque_no,
                            'cheque_date' => $request->cheque_date,
                            'clear_date' => $request->clear_date,
                        ]];
                    }
                }
            }

            // Calculate net bill payable
            $netPurchaseTotal = max(0, (float)$request->net_total - (float)($request->extra_discount ?? 0));

            // Create purchase with unique temporary invoice to obtain auto-increment ID atomically
            $purchase = Purchase::create([
                'date'            => $request->date,
                'invoice'         => uniqid('PUR-TMP-', true),
                'code'            => $request->code,
                'supplier_id'     => $request->supplier_id,
                'salesman_id'     => $request->salesman_id,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'extra_discount'  => $request->extra_discount ?? 0,
                'tax_total'       => 0,
                'courier_charges' => $request->courier_charges ?? 0,
                'net_total'       => $request->net_total,
                'paid_amount'     => 0,
                'remaining_amount' => $netPurchaseTotal,
                'status'          => 'Completed',
                'message_line_id' => $request->message_line_id,
                'firm_id'         => $request->firm_id,
            ]);

            // Auto-increment ID is now known — derive unique sequential invoice number
            $latestInvoice = Purchase::where('invoice', 'LIKE', 'PUR-%')
                ->where('invoice', 'NOT LIKE', 'PUR-TMP-%')
                ->where('id', '!=', $purchase->id)
                ->lockForUpdate()
                ->orderByDesc('id')
                ->value('invoice');

            $nextNum = $purchase->id;
            if ($latestInvoice && preg_match('/PUR-(\d+)/', $latestInvoice, $matches)) {
                $highestNum = (int)$matches[1];
                if ($highestNum >= $nextNum) {
                    $nextNum = $highestNum + 1;
                }
            }

            $candidateInvoice = 'PUR-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
            while (Purchase::where('invoice', $candidateInvoice)->where('id', '!=', $purchase->id)->exists()) {
                $nextNum++;
                $candidateInvoice = 'PUR-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
            }

            $purchase->invoice = $candidateInvoice;
            $purchase->save();

            // --- Step 1: Apply Existing Advance FIRST — ONLY when user checked "Apply to this bill" ---
            // Covers: Unallocated Cash Payments (cash-only, never discount) + SupplierCredit + Opening Balance DR (CPV-OB-xxxx)
            $useAdvanceOnCreate = $request->boolean('use_advance', false);
            if ($useAdvanceOnCreate) {
                AdvanceAllocationService::applyAdvanceToPurchase($purchase);
            }

            // --- Step 2: Process Instant Checkout Cash/Bank/Cheque Splits ---
            if (count($splitsData) > 0) {
                $prefix = 'CPV-';
                $baseVoucherNo = $this->generateNextPurchaseVoucherNo($prefix);
                $groupId = null;
                $createdPayments = [];

                foreach ($splitsData as $index => $split) {
                    if (($split['amount'] ?? 0) <= 0) continue;

                    $voucherNo = $baseVoucherNo;

                    $payment = Payment::create([
                        'date' => $request->date,
                        'voucher_no' => $voucherNo,
                        'account_id' => $request->supplier_id,
                        'payment_account_id' => $split['payment_account_id'],
                        'amount' => $split['amount'],
                        'net_amount' => $split['amount'],
                        'type' => 'PAYMENT',
                        'payment_method' => $split['payment_method'] ?? 'Cash',
                        'cheque_no' => $split['cheque_no'] ?? null,
                        'cheque_date' => $split['cheque_date'] ?? null,
                        'clear_date' => $split['clear_date'] ?? null,
                        'remarks' => 'Instance Checkout for -> Purchase ' . $purchase->invoice,
                        'cheque_id' => $split['cheque_id'] ?? null,
                        'cheque_status' => ($split['payment_method'] ?? 'Cash') === 'Cheque' ? 'Pending' : 'Clear',
                    ]);

                    // Update Chequebook status if it's a bank cheque
                    if (!empty($split['cheque_id'])) {
                        Chequebook::where('id', $split['cheque_id'])->update(['status' => 'issued']);
                    }

                    // If it's a customer cheque being reused
                    if (!empty($split['customer_cheque_id'])) {
                        Payment::where('id', $split['customer_cheque_id'])->update(['cheque_status' => 'Distributed']);
                    }

                    if ($index === 0) $groupId = $payment->id;
                    $payment->update(['group_id' => $groupId]);
                    $createdPayments[] = $payment;
                }

                // Distribution Logic: settle remaining balance on THIS bill first, then FIFO to older bills
                $remainingToAllocate = $totalPaidAmount;

                if ($remainingToAllocate > 0.005) {
                    // 1. Current Bill Allocation (strictly bounded by remaining_amount after advance)
                    $toThisBill = round(min($remainingToAllocate, (float) $purchase->remaining_amount), 2);
                    if ($toThisBill > 0.005) {
                        $tempThis = $toThisBill;
                        foreach ($createdPayments as $p) {
                            if ($tempThis <= 0.005) break;
                            $canTake = round(min($tempThis, (float) $p->amount), 2);
                            if ($canTake > 0.005) {
                                PaymentAllocation::create([
                                    'payment_id' => $p->id,
                                    'bill_id' => $purchase->id,
                                    'bill_type' => Purchase::class,
                                    'amount' => $canTake,
                                    'is_advance' => false,
                                ]);
                                $tempThis = round($tempThis - $canTake, 2);
                            }
                        }
                        $remainingToAllocate = round($remainingToAllocate - $toThisBill, 2);
                    }

                    // 2. Surplus -> Older Bills (FIFO)
                    if ($remainingToAllocate > 0.005 && $request->supplier_id) {
                        $olderBills = Purchase::where('supplier_id', $request->supplier_id)
                            ->where('id', '!=', $purchase->id)
                            ->where('remaining_amount', '>', 0)
                            ->orderBy('date', 'asc')
                            ->orderBy('id', 'asc')
                            ->get();

                        foreach ($olderBills as $oldBill) {
                            if ($remainingToAllocate <= 0.005) break;
                            $allocation = round(min($remainingToAllocate, (float) $oldBill->remaining_amount), 2);
                            $tempOld = $allocation;

                            foreach ($createdPayments as $p) {
                                if ($tempOld <= 0.005) break;
                                $alreadyAlloc = (float) PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                                $avail = round((float) $p->amount - $alreadyAlloc, 2);

                                if ($avail > 0.005) {
                                    $step = round(min($tempOld, $avail), 2);
                                    PaymentAllocation::create([
                                        'payment_id' => $p->id,
                                        'bill_id' => $oldBill->id,
                                        'bill_type' => Purchase::class,
                                        'amount' => $step,
                                        'is_advance' => false,
                                    ]);
                                    $tempOld = round($tempOld - $step, 2);
                                }
                            }

                            AdvanceAllocationService::recalculatePurchaseSettlement($oldBill);
                            $remainingToAllocate = round($remainingToAllocate - $allocation, 2);
                        }
                    }
                }
            }

            // Final authoritative recalculation from DB allocations
            AdvanceAllocationService::recalculatePurchaseSettlement($purchase);

            // Fetch supplier category percentage
            $supplier = Account::with('accountCategory')->find($request->supplier_id);
            $percentage = 0;
            if ($supplier && $supplier->accountCategory) {
                $percentage = floatval($supplier->accountCategory->percentage);
            }

            // Insert items and update stock
            foreach ($request->items as $it) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'],
                    'free_carton' => $it['bonus_full'] ?? 0,
                    'free_pcs'    => $it['bonus_pcs'] ?? 0,
                    'gst_amount'  => 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Increase Stock (total_pcs already includes purchased + bonus units)
                $item = Items::find($it['item_id']);
                if ($item) {
                    // Inward stock recorded in purchase_items, opening stock remains immutable.

                    // Auto-update trade price based on supplier category percentage if enabled
                    if ($request->update_prices && $percentage > 0) {
                        $newTradePrice = $it['trade_price'] + ($it['trade_price'] * $percentage / 100);
                        $item->trade_price = round($newTradePrice);
                    }

                    $item->save();
                }
            }

            $purchase->load(['supplier', 'items']);
            $successDialogData = [
                'supplierName' => $purchase->supplier->title ?? 'N/A',
                'totalItems'   => $purchase->items->count(),
                'totalFull'    => (int) $purchase->items->sum('qty_carton'),
                'totalPcs'     => (int) $purchase->items->sum('qty_pcs'),
                'gross'        => (float) $purchase->gross_total,
                'discount'     => (float) ($purchase->discount_total + ($purchase->extra_discount ?? 0)),
                'net'          => (float) max(0, $purchase->net_total - ($purchase->extra_discount ?? 0)),
                'purchaseId'   => $purchase->id,
                'invoiceNo'    => $purchase->invoice,
                'mode'         => 'create',
            ];

            $cacheData = [
                'redirect_route' => 'purchase.index',
                'id'             => $purchase->id,
                'flash'          => [
                    'success' => 'Purchase saved successfully!',
                    'id'      => $purchase->id,
                ],
                'success_dialog' => $successDialogData,
            ];

            if ($request->has('print_format') && in_array($request->print_format, ['big', 'small'])) {
                $pdfUrl = route('purchase.pdf', ['id' => $purchase->id, 'format' => $request->print_format]);
                $cacheData['pdf_url'] = $pdfUrl;
                $cacheData['flash']['pdf_url'] = $pdfUrl;
                $finalResponse = redirect()->route('purchase.index')
                    ->with('success', 'Purchase saved successfully!')
                    ->with('id', $purchase->id)
                    ->with('pdf_url', $pdfUrl)
                    ->with('success_dialog', $successDialogData);
            } else {
                $finalResponse = redirect()->route('purchase.index')
                    ->with('success', 'Purchase saved successfully!')
                    ->with('id', $purchase->id)
                    ->with('success_dialog', $successDialogData);
            }

            return [
                'model'    => $purchase,
                'response' => $finalResponse,
                'cache'    => $cacheData,
            ];
        }
    );
} catch (\Throwable $e) {
    \Illuminate\Support\Facades\Log::error('PurchaseController@store error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
    return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
}
    }
    //edit
    public function edit($id)
    {
        $purchase = Purchase::with('supplier', 'salesman', 'items')->findOrFail($id);

        // Load ONLY Instant Checkout splits belonging to this specific purchase (never independent advance vouchers!)
        $purchase->splits = AdvanceAllocationService::getCheckoutSplitsForBill(Purchase::class, $purchase->id, (string) $purchase->invoice);

        $nonAdv = AdvanceAllocationService::getNonAdvancePaidForBill(Purchase::class, $purchase->id, (string) $purchase->invoice);
        $advSummary = AdvanceAllocationService::getAppliedAdvanceSummaryForBill(Purchase::class, $purchase->id, (string) $purchase->invoice);

        $purchase->checkout_paid_amount = $nonAdv['checkout_paid'];
        $purchase->manual_payment_paid_amount = $nonAdv['manual_payment_paid'];
        $purchase->applied_advance_amount = $advSummary['total_applied_advance'];
        $purchase->has_advance_allocated = $advSummary['has_advance_allocated'];
        // Historical average stats for items
        $purchaseStats = DB::table('purchase_items')
            ->select('item_id',
                DB::raw('COUNT(*) as cnt'),
                DB::raw('ROUND(AVG(trade_price), 2) as avg_rate')
            )
            ->groupBy('item_id')
            ->get()
            ->keyBy('item_id');

        $saleStats = DB::table('sales_items')
            ->select('item_id',
                DB::raw('COUNT(*) as cnt'),
                DB::raw('ROUND(AVG(trade_price), 2) as avg_rate')
            )
            ->groupBy('item_id')
            ->get()
            ->keyBy('item_id');

        $existingItemIds = $purchase && $purchase->items ? $purchase->items->pluck('item_id')->filter()->unique()->toArray() : [];
        $items = Items::where(function ($q) use ($existingItemIds) {
                $q->where('is_active', 1);
                if (!empty($existingItemIds)) {
                    $q->orWhereIn('id', $existingItemIds);
                }
            })
            ->select('id', 'date', 'code', 'title', 'short_name', 'company', 'trade_price', 'retail', 'retail_tp_diff', 'reorder_level', 'packing_qty', 'packing_size', 'pcs', 'type', 'category', 'gst_percent', 'gst_amount', 'discount', 'stock_1', 'stock_2', 'is_active')
            ->with(['lastPurchaseItem.purchase.supplier' => function($q) {
                $q->select('id', 'title');
            }])
            ->get()
            ->map(function ($item) use ($purchaseStats, $saleStats) {
            $lastP = $item->lastPurchaseItem;
            if ($lastP) {
                $item->last_purchase_rate = (float) $lastP->trade_price;
                $item->last_purchase_date = $lastP->purchase ? $lastP->purchase->date : null;
                $item->last_supplier_name = $lastP->purchase && $lastP->purchase->supplier ? $lastP->purchase->supplier->title : null;
                $item->last_purchase_qty_full = (float) $lastP->qty_carton;
                $item->last_purchase_qty_pcs = (float) $lastP->qty_pcs;
                $item->last_purchase_total = (float) $lastP->subtotal;
            }

            $pStat = $purchaseStats->get($item->id);
            $sStat = $saleStats->get($item->id);

            $item->has_purchases = $pStat ? ($pStat->cnt > 0) : false;
            $item->avg_purchase_rate = $pStat ? (float) $pStat->avg_rate : 0;

            $item->has_sales = $sStat ? ($sStat->cnt > 0) : false;
            $item->avg_sale_rate = $sStat ? (float) $sStat->avg_rate : 0;

            return $item;
        });

        // Attach true real-time ledger balances
        StockService::attachRealtimeBalances($items);

        // Load ONLY the currently assigned supplier (others fetched on-demand via /account/picker)
        $accounts = AccountController::loadSingleForPicker($purchase->supplier_id ? (int) $purchase->supplier_id : null, 'purchase');
        $salemans = Saleman::select('id', 'name', 'code')->get();
        $messageLines = \App\Models\MessageLine::whereJsonContains('category', 'Purchase')
            ->where('status', 'active')
            ->get();

        $firms = Firm::select('id', 'name', 'defult')->get();

        // Fetch Payment Accounts (Cash/Bank/Cheque in hand)
        $paymentAccounts = Account::eligibleForCashBank()->with('accountType')->get();

        $customerCheques = Payment::where('type', 'RECEIPT')
            ->where('payment_method', 'Cheque')
            ->where('cheque_status', 'Pending')
            ->select('id', 'cheque_no', 'amount', 'cheque_date')
            ->get();

        $availableCheques = Chequebook::where('status', 'unused')
            ->select('id', 'bank_id', 'cheque_no')
            ->get();

        return Inertia::render("daily/purchase/edit", [
            'purchase' => $purchase,
            'items' => $items,
            'accounts' => $accounts,
            'salemans' => $salemans,
            'paymentAccounts' => $paymentAccounts,
            'customerCheques' => $customerCheques,
            'availableCheques' => $availableCheques,
            'messageLines' => $messageLines,
            'firms' => $firms,
        ]);
    }
    //update
    public function update(Request $request, $id)
    {
        $request->validate([
            'date'            => 'required|date',
            'invoice'         => 'nullable|string',
            'code'            => 'nullable|string',
            'supplier_id'     => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')->where(function ($q) {
                    $q->where('purchase', 1)->where(function ($sub) {
                        $sub->where('status', 1)->orWhere('status', true)->orWhereNull('status');
                    });
                }),
            ],
            'salesman_id'     => 'nullable|integer',
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
            'extra_discount'  => 'nullable|numeric',
            'tax_total'       => 'nullable|numeric',
            'courier_charges' => 'nullable|numeric',
            'net_total'       => 'required|numeric',
            'paid_amount'     => 'required|numeric',
            'remaining_amount' => 'required|numeric',

            // items array validation
            'items'                   => 'required|array',
            'items.*.item_id'         => 'required|integer',
            'items.*.qty_carton'      => 'required|numeric',
            'items.*.qty_pcs'         => 'required|numeric',
            'items.*.total_pcs'       => 'required|numeric',
            'items.*.trade_price'     => 'required|numeric',
            'items.*.discount'        => 'required|numeric',
            'items.*.bonus_full'      => 'nullable|numeric',
            'items.*.bonus_pcs'       => 'nullable|numeric',
            'items.*.gst_amount'      => 'required|numeric',
            'items.*.subtotal'        => 'required|numeric',
            'message_line_id'         => 'nullable|integer',
            'firm_id'                 => 'nullable|integer',
            'update_prices'           => 'nullable|boolean',
        ]);

        DB::beginTransaction();

        try {
            $purchase = Purchase::findOrFail($id);

            $extraDiscount = (float) ($request->extra_discount ?? 0);
            $netTotal = (float) $request->net_total;
            $netPurchaseTotal = max(0, $netTotal - $extraDiscount);
            $useAdvance = $request->boolean('use_advance', false);

            // Step A: Safely release ONLY previous advance allocations (is_advance=true PaymentAllocations,
            // SupplierCredit allocations, OpeningBalanceAllocations). Independent Payment vouchers & manual
            // /payment allocations are NEVER mutated or deleted.
            AdvanceAllocationService::releaseAdvanceFromPurchase($purchase);

            // Step B: Update purchase totals & metadata first
            $purchase->update([
                'date'            => $request->date,
                'invoice'         => $purchase->invoice, // Preserve existing unique invoice number
                'code'            => $request->code,
                'supplier_id'     => $request->supplier_id,
                'salesman_id'     => $request->salesman_id,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'extra_discount'  => $request->extra_discount ?? 0,
                'tax_total'       => 0,
                'courier_charges' => $request->courier_charges ?? 0,
                'net_total'       => $request->net_total,
                'status'          => $request->status ?? $purchase->status,
                'message_line_id' => $request->message_line_id,
                'firm_id'         => $request->firm_id ?? $purchase->firm_id,
            ]);

            // Step C: Sync Instant Checkout splits (strictly scoped to THIS purchase's checkout payments)
            $isPayNow = (bool) $request->input('is_pay_now', false);
            $isMulti = (bool) $request->input('is_multi', false);
            $splitsData = [];
            $totalNewPaid = 0;

            if ($isPayNow) {
                $existingCheckoutAllocations = PaymentAllocation::where('bill_id', $purchase->id)
                    ->where('bill_type', Purchase::class)
                    ->with('payment')
                    ->get()
                    ->filter(fn ($a) => AdvanceAllocationService::isCheckoutPaymentForBill($a->payment, (string) $purchase->invoice));

                $existingAllocatedPaymentIds = $existingCheckoutAllocations->pluck('payment_id')->toArray();

                if ($isMulti) {
                    $rawSplits = $request->input('splits', []);
                    foreach ($rawSplits as $split) {
                        $amt = (float) ($split['amount'] ?? 0);
                        $hasVoucher = !empty($split['voucher_no']);
                        $isExistingPayment = (!empty($split['payment_id']) && in_array((int) $split['payment_id'], $existingAllocatedPaymentIds))
                            || (!empty($split['id']) && in_array((int) $split['id'], $existingAllocatedPaymentIds));

                        // Only consider truly NEW splits added during this edit session
                        if ($amt > 0 && !$hasVoucher && !$isExistingPayment && !empty($split['payment_account_id'])) {
                            $splitsData[] = $split;
                            $totalNewPaid += $amt;
                        }
                    }
                } elseif ((float)$request->paid_amount > 0 && $request->payment_account_id) {
                    $totalNewPaid = (float)$request->paid_amount;
                    $splitsData = [[
                        'payment_account_id' => $request->payment_account_id,
                        'amount' => $totalNewPaid,
                        'payment_method' => $request->payment_method ?? 'Cash',
                        'cheque_no' => $request->cheque_no,
                        'cheque_date' => $request->cheque_date,
                        'clear_date' => $request->clear_date,
                    ]];
                }
            }

            // Step D: Trim excess allocations if bill net shrank below existing payments
            AdvanceAllocationService::trimExcessPaymentAllocations(Purchase::class, $purchase->id, $netPurchaseTotal);
            AdvanceAllocationService::recalculatePurchaseSettlement($purchase);

            // Step E: Apply Advance FIRST if checked (matching UI order)
            if ($useAdvance && $purchase->remaining_amount > 0.005) {
                AdvanceAllocationService::applyAdvanceToPurchase($purchase);
            }

            // Step F: Process NEW Instant Checkout Payments & Allocations
            if (count($splitsData) > 0 && $totalNewPaid > 0.005) {
                $prefix = 'CPV-';
                $baseVoucherNo = $this->generateNextPurchaseVoucherNo($prefix);
                $groupId = null;
                $createdPayments = [];

                foreach ($splitsData as $index => $split) {
                    if (($split['amount'] ?? 0) <= 0) continue;
                    $voucherNo = $baseVoucherNo;

                    $payment = Payment::create([
                        'date' => $request->date,
                        'voucher_no' => $voucherNo,
                        'account_id' => $purchase->supplier_id,
                        'payment_account_id' => $split['payment_account_id'],
                        'amount' => $split['amount'],
                        'net_amount' => $split['amount'],
                        'type' => 'PAYMENT',
                        'payment_method' => $split['payment_method'] ?? 'Cash',
                        'cheque_no' => $split['cheque_no'] ?? null,
                        'cheque_date' => $split['cheque_date'] ?? null,
                        'clear_date' => $split['clear_date'] ?? null,
                        'remarks' => 'Instance Checkout for -> Edition of Purchase ' . $purchase->invoice,
                        'cheque_id' => $split['cheque_id'] ?? null,
                        'cheque_status' => ($split['payment_method'] ?? 'Cash') === 'Cheque' ? 'Pending' : 'Clear',
                    ]);

                    // Update Chequebook status if it's a bank cheque
                    if (!empty($split['cheque_id'])) {
                        Chequebook::where('id', $split['cheque_id'])->update(['status' => 'issued']);
                    }

                    // If it's a customer cheque being reused
                    if (!empty($split['customer_cheque_id'])) {
                        Payment::where('id', $split['customer_cheque_id'])->update(['cheque_status' => 'Distributed']);
                    }

                    if ($index === 0) $groupId = $payment->id;
                    $payment->update(['group_id' => $groupId]);
                    $createdPayments[] = $payment;
                }

                // Distribute NEW payments (surplus allocation)
                $remainingToAllocate = $totalNewPaid;
                if ($remainingToAllocate > 0.005) {
                    // 1. Current Bill Allocation (strictly bounded by remaining_amount)
                    $toThisBill = round(min($remainingToAllocate, (float) $purchase->remaining_amount), 2);

                    if ($toThisBill > 0.005) {
                        $tempThis = $toThisBill;
                        foreach ($createdPayments as $p) {
                            if ($tempThis <= 0.005) break;
                            $canTake = round(min($tempThis, (float) $p->amount), 2);
                            if ($canTake > 0.005) {
                                PaymentAllocation::create([
                                    'payment_id' => $p->id,
                                    'bill_id' => $purchase->id,
                                    'bill_type' => Purchase::class,
                                    'amount' => $canTake,
                                    'is_advance' => false,
                                ]);
                                $tempThis = round($tempThis - $canTake, 2);
                            }
                        }
                        $remainingToAllocate = round($remainingToAllocate - $toThisBill, 2);
                    }

                    // 2. Surplus -> Older Bills (FIFO)
                    if ($remainingToAllocate > 0.005 && $purchase->supplier_id) {
                        $olderBills = Purchase::where('supplier_id', $purchase->supplier_id)
                            ->where('id', '!=', $purchase->id)
                            ->where('remaining_amount', '>', 0)
                            ->orderBy('date', 'asc')
                            ->orderBy('id', 'asc')
                            ->get();

                        foreach ($olderBills as $oldBill) {
                            if ($remainingToAllocate <= 0.005) break;
                            $allocation = round(min($remainingToAllocate, (float) $oldBill->remaining_amount), 2);
                            $tempOld = $allocation;

                            foreach ($createdPayments as $p) {
                                if ($tempOld <= 0.005) break;
                                $alreadyAlloc = (float) PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                                $avail = round((float) $p->amount - $alreadyAlloc, 2);
                                if ($avail > 0.005) {
                                    $step = round(min($tempOld, $avail), 2);
                                    PaymentAllocation::create([
                                        'payment_id' => $p->id,
                                        'bill_id' => $oldBill->id,
                                        'bill_type' => Purchase::class,
                                        'amount' => $step,
                                        'is_advance' => false,
                                    ]);
                                    $tempOld = round($tempOld - $step, 2);
                                }
                            }

                            AdvanceAllocationService::recalculatePurchaseSettlement($oldBill);
                            $remainingToAllocate = round($remainingToAllocate - $allocation, 2);
                        }
                    }
                }
            }

            // Final authoritative recalculation from DB allocations
            AdvanceAllocationService::recalculatePurchaseSettlement($purchase);

            // Calculate net stock delta (new items - old items)
            $stockDeltas = [];
            $oldItems = PurchaseItem::where('purchase_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $stockDeltas[$oldItem->item_id] = ($stockDeltas[$oldItem->item_id] ?? 0) - (int)$oldItem->total_pcs;
            }
            foreach ($request->items as $it) {
                $stockDeltas[$it['item_id']] = ($stockDeltas[$it['item_id']] ?? 0) + (int)$it['total_pcs'];
            }

            // Apply net delta to stock
            foreach ($stockDeltas as $itemId => $delta) {
                if ($delta !== 0) {
                    $item = Items::find($itemId);
                    if ($item) {
                        // Ledger adjusts automatically when purchase_items are updated
                    }
                }
            }

            // Delete old items and insert updated items
            PurchaseItem::where('purchase_id', $id)->delete();

            // Fetch supplier category percentage
            $supplier = Account::with('accountCategory')->find($request->supplier_id);
            $percentage = 0;
            if ($supplier && $supplier->accountCategory) {
                $percentage = floatval($supplier->accountCategory->percentage);
            }

            foreach ($request->items as $it) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'],
                    'free_carton' => $it['bonus_full'] ?? 0,
                    'free_pcs'    => $it['bonus_pcs'] ?? 0,
                    'gst_amount'  => 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Auto-update trade price based on supplier category percentage if enabled
                if ($request->update_prices && $percentage > 0) {
                    $item = Items::find($it['item_id']);
                    if ($item) {
                        $newTradePrice = $it['trade_price'] + ($it['trade_price'] * $percentage / 100);
                        $item->trade_price = round($newTradePrice);
                        $item->save();
                    }
                }
            }

            DB::commit();
            
            $purchase->load(['supplier', 'items']);
            $successDialogData = [
                'supplierName' => $purchase->supplier->title ?? 'N/A',
                'totalItems'   => $purchase->items->count(),
                'totalFull'    => (int) $purchase->items->sum('qty_carton'),
                'totalPcs'     => (int) $purchase->items->sum('qty_pcs'),
                'gross'        => (float) $purchase->gross_total,
                'discount'     => (float) ($purchase->discount_total + ($purchase->extra_discount ?? 0)),
                'net'          => (float) max(0, $purchase->net_total - ($purchase->extra_discount ?? 0)),
                'purchaseId'   => $purchase->id,
                'invoiceNo'    => $purchase->invoice,
                'mode'         => 'edit',
            ];

            return redirect()->route('purchase.index')
                ->with('success', 'Purchase updated successfully!')
                ->with('id', $purchase->id)
                ->with('success_dialog', $successDialogData);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
    //view
    public function view($id)
    {
        $purchase = Purchase::with('supplier', 'salesman', 'items.item', 'messageLine')->find($id);
        // dd($purchase->toArray());
        return Inertia::render("daily/purchase/view", [
            'purchase' => $purchase,
        ]);
    }
    public function pdf(Request $request, $id)
    {
        $purchase = Purchase::with('supplier', 'salesman', 'items.item')->findOrFail($id);

        $firm = Firm::find($purchase->firm_id);

        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.purchasehalf' : 'pdf.purchase';

        $pdf = Pdf::loadView($view, compact('purchase', 'firm'));

        if ($format === 'small') {
            // Receipt size for thermal printers
            $itemCount = count($purchase->items);
            $height = 320 + ($itemCount * 16);
            $height = max(280, $height);
            $pdf->setPaper([0, 0, 226.77, $height], 'portrait'); // ~80mm width
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->stream("Purchase-Invoice-$id.pdf");
    }
    public function download($id)
    {
        $purchase = Purchase::with('supplier', 'salesman', 'items.item')->findOrFail($id);

        $firm = \App\Models\Firm::find($purchase->firm_id) ?? \App\Models\Firm::where('defult', 1)->first() ?? \App\Models\Firm::first();

        $pdf = Pdf::loadView('pdf.purchase', compact('purchase', 'firm'))
            ->setPaper('A4', 'portrait');

        return $pdf->download("Purchase-Invoice-$id.pdf");
    }

    public function getLastPurchaseInfo(Request $request)
    {
        $itemId = $request->query('item_id');

        if (!$itemId) {
            return response()->json(['error' => 'Item ID is required'], 400);
        }

        // Get the most recent purchase for this item
        $lastPurchase = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->where('purchase_items.item_id', $itemId)
            ->orderBy('purchases.created_at', 'desc')
            ->select(
                'purchase_items.qty_carton as previous_qty_carton',
                'purchase_items.qty_pcs as previous_qty_pcs',
                'purchase_items.total_pcs as previous_total_pcs',
                'purchase_items.trade_price as previous_retail_price',
                'purchase_items.subtotal as previous_subtotal',
                'items.stock_1 as current_stock',
                'items.company',
                'items.retail',
                'items.trade_price',
                'purchases.created_at as last_purchase_date',
                'accounts.title as supplier_name'
            )
            ->first();

        // If no prior purchase history exists, fallback to base item data
        if (!$lastPurchase) {
            $item = DB::table('items')->find($itemId);
            if ($item) {
                $lastPurchase = (object) [
                    'previous_qty_carton'   => 0,
                    'previous_qty_pcs'      => 0,
                    'previous_total_pcs'    => 0,
                    'previous_retail_price' => $item->trade_price ?? $item->retail ?? 0,
                    'previous_subtotal'     => 0,
                    'current_stock'         => $item->stock_1 ?? 0,
                    'company'               => $item->company ?? '-',
                    'retail'                => $item->retail ?? 0,
                    'trade_price'           => $item->trade_price ?? 0,
                    'last_purchase_date'    => null,
                    'supplier_name'         => null
                ];
            }
        }

        if ($lastPurchase) {
            // Calculate real average purchase rate from purchase history
            $avgPurchRate = DB::table('purchase_items')->where('item_id', $itemId)->avg('trade_price');
            $lastPurchase->average_price = $avgPurchRate ? round((float) $avgPurchRate, 2) : 0;
            $lastPurchase->has_purchases = DB::table('purchase_items')->where('item_id', $itemId)->exists();
        }

        return response()->json($lastPurchase);
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::with('items')->findOrFail($id);

            // 1. Guard against deleting a purchase if purchase return(s) exist against it
            $hasReturns = \App\Models\PurchaseReturn::where('original_invoice', $purchase->invoice)->exists();
            if ($hasReturns) {
                return redirect()->back()->with('error', "Cannot delete purchase {$purchase->invoice} because purchase return(s) have already been processed for this bill.");
            }

            // 2. Release advance allocations (SupplierCredit, OpeningBalanceAllocation, is_advance PaymentAllocations)
            AdvanceAllocationService::releaseAdvanceFromPurchase($purchase);

            // Clean up any remaining direct PurchaseReturnAllocation rows
            \App\Models\PurchaseReturnAllocation::where('purchase_id', $purchase->id)->delete();

            // 3. Handle Payment Allocations and Auto-generated Instant Checkout Payments
            $allocations = PaymentAllocation::where('bill_id', $purchase->id)
                ->where(function ($q) {
                    $q->where('bill_type', 'App\Models\Purchase')
                      ->orWhere('bill_type', Purchase::class)
                      ->orWhere('bill_type', 'Purchase');
                })
                ->get();

            $processedPaymentIds = [];

            foreach ($allocations as $alloc) {
                $payment = Payment::find($alloc->payment_id);
                if ($payment) {
                    $isAutoCheckoutPayment = AdvanceAllocationService::isCheckoutPaymentForBill($payment, (string) $purchase->invoice);

                    if ($isAutoCheckoutPayment) {
                        $processedPaymentIds[] = $payment->id;

                        // Bank cheque restoration (company chequebook)
                        if (!empty($payment->cheque_id)) {
                            Chequebook::where('id', $payment->cheque_id)->update(['status' => 'unused']);
                        }

                        // Distributed customer third-party cheque restoration
                        if (!empty($payment->source_payment_id)) {
                            Payment::where('id', $payment->source_payment_id)->update(['cheque_status' => 'In Hand']);
                        } elseif ($payment->payment_method === 'Cheque' && !empty($payment->cheque_no)) {
                            Payment::where('type', 'RECEIPT')
                                ->where('cheque_no', $payment->cheque_no)
                                ->where('cheque_status', 'Distributed')
                                ->update(['cheque_status' => 'In Hand']);
                        }

                        // If surplus was applied to older bills (FIFO), revert older bills
                        $surplusAllocs = PaymentAllocation::where('payment_id', $payment->id)
                            ->where('id', '!=', $alloc->id)
                            ->get();

                        foreach ($surplusAllocs as $sAlloc) {
                            if ($sAlloc->bill_type === 'App\Models\Purchase' || $sAlloc->bill_type === Purchase::class) {
                                $olderBill = Purchase::find($sAlloc->bill_id);
                                if ($olderBill && $olderBill->id !== $purchase->id) {
                                    $olderBill->paid_amount = max(0, round((float)$olderBill->paid_amount - (float)$sAlloc->amount, 2));
                                    $netPayable = max(0, (float)$olderBill->net_total - (float)($olderBill->extra_discount ?? 0));
                                    $olderBill->remaining_amount = max(0, round($netPayable - $olderBill->paid_amount, 2));
                                    $olderBill->status = ($olderBill->remaining_amount <= 0.005) ? 'Paid' : (($olderBill->paid_amount > 0) ? 'Partial' : 'Completed');
                                    $olderBill->save();
                                }
                            }
                            $sAlloc->delete();
                        }

                        $alloc->delete();
                        $payment->delete();
                    } else {
                        // Advance payment or manual payment allocation — remove allocation to free advance back to supplier
                        $alloc->delete();
                    }
                } else {
                    $alloc->delete();
                }
            }

            // Clean up any remaining auto-generated payments with remarks referencing this purchase
            $autoPayments = Payment::where(function ($q) use ($purchase) {
                $q->where('remarks', 'like', '%Purchase ' . $purchase->invoice . '%')
                  ->orWhere('remarks', 'like', '%Instance Checkout for -> Purchase ' . $purchase->invoice . '%')
                  ->orWhere('remarks', 'like', 'Auto-generated from Purchase ' . $purchase->invoice . '%');
            })
            ->whereNotIn('id', $processedPaymentIds)
            ->get();

            foreach ($autoPayments as $autoPayment) {
                if (!empty($autoPayment->cheque_id)) {
                    Chequebook::where('id', $autoPayment->cheque_id)->update(['status' => 'unused']);
                }

                if (!empty($autoPayment->source_payment_id)) {
                    Payment::where('id', $autoPayment->source_payment_id)->update(['cheque_status' => 'In Hand']);
                } elseif ($autoPayment->payment_method === 'Cheque' && !empty($autoPayment->cheque_no)) {
                    Payment::where('type', 'RECEIPT')
                        ->where('cheque_no', $autoPayment->cheque_no)
                        ->where('cheque_status', 'Distributed')
                        ->update(['cheque_status' => 'In Hand']);
                }

                $surplusAllocs = PaymentAllocation::where('payment_id', $autoPayment->id)->get();
                foreach ($surplusAllocs as $sAlloc) {
                    if ($sAlloc->bill_type === 'App\Models\Purchase' || $sAlloc->bill_type === Purchase::class) {
                        $olderBill = Purchase::find($sAlloc->bill_id);
                        if ($olderBill && $olderBill->id !== $purchase->id) {
                            $olderBill->paid_amount = max(0, round((float)$olderBill->paid_amount - (float)$sAlloc->amount, 2));
                            $netPayable = max(0, (float)$olderBill->net_total - (float)($olderBill->extra_discount ?? 0));
                            $olderBill->remaining_amount = max(0, round($netPayable - $olderBill->paid_amount, 2));
                            $olderBill->status = ($olderBill->remaining_amount <= 0.005) ? 'Paid' : (($olderBill->paid_amount > 0) ? 'Partial' : 'Completed');
                            $olderBill->save();
                        }
                    }
                    $sAlloc->delete();
                }

                $autoPayment->delete();
            }

            // 3. Delete Purchase items & Purchase
            // Deleting purchase items automatically removes inward inventory
            PurchaseItem::where('purchase_id', $id)->delete();
            $purchase->delete();

            DB::commit();
            return redirect()->back()->with('success', "Purchase invoice {$purchase->invoice} and its checkout payment were deleted successfully, and stock/accounting balances have been restored.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error deleting purchase: ' . $e->getMessage());
        }
    }

    /**
     * Generate sequential CPV voucher number inside current DB transaction.
     * Uses lockForUpdate() so concurrent requests serialize and never produce duplicates.
     *
     * @param string $prefix e.g. 'CPV-' -> CPV-0001
     */
    private function generateNextPurchaseVoucherNo(string $prefix): string
    {
        $last = Payment::where('voucher_no', 'LIKE', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('voucher_no');

        $nextNum = 1;
        if ($last && preg_match('/' . preg_quote(rtrim($prefix, '-'), '/') . '-(\d+)/', $last, $matches)) {
            $nextNum = (int)$matches[1] + 1;
        }

        return $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }
}
