<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Items;
use App\Models\Sales;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\SalesItem;
use App\Models\Purchase;
use App\Models\Firm;
use App\Models\MessageLine;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\SalesReturnAllocation;
use App\Models\CustomerCredit;
use App\Services\AdvanceAllocationService;
use App\Services\StockService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\Rule;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SalesController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view sales', only: ['index', 'view', 'pdf', 'download']),
            new Middleware('permission:create sales', only: ['create', 'store']),
            new Middleware('permission:edit sales', only: ['edit', 'update', 'confirm', 'cancel']),
            new Middleware('permission:delete sales', only: ['destroy']),
        ];
    }

    //index
    public function index(Request $request)
    {
        $query = Sales::select(
            'id', 'invoice', 'code', 'date', 'created_at', 'status', 'is_online',
            'customer_id', 'salesman_id', 'gross_total', 'courier_charges',
            'discount_total', 'extra_discount', 'tax_total', 'net_total',
            'paid_amount', 'remaining_amount', 'no_of_items'
        )->with([
            'customer:id,title',
            'salesman:id,name',
        ]);

        // Filter by Date Range
        if ($request->has('start_date') && $request->has('end_date') && $request->start_date && $request->end_date) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        // Filter by Customer
        if ($request->has('customer_id') && $request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        // Filter by Status
        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by Online status
        if ($request->has('is_online') && $request->is_online === 'true') {
            $query->where('is_online', true);
        }

        // Filter by Search (Invoice or Code)
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice', 'like', '%' . $request->search . '%')
                    ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by Amount (Net Total: exact numeric or partial match)
        if ($request->filled('amount')) {
            $rawAmount = preg_replace('/[^0-9.\-]/', '', (string) $request->amount);
            if ($rawAmount !== '') {
                $query->where(function ($q) use ($rawAmount) {
                    if (is_numeric($rawAmount)) {
                        $q->where('net_total', '=', (float) $rawAmount)
                            ->orWhereRaw('CAST(net_total AS CHAR) LIKE ?', ['%' . $rawAmount . '%']);
                    } else {
                        $q->whereRaw('CAST(net_total AS CHAR) LIKE ?', ['%' . $rawAmount . '%']);
                    }
                });
            }
        }

        // Summary Calculations via SQL across full filtered dataset
        $summaryQuery = clone $query;
        $summaryQuery->getQuery()->columns = null;
        $aggregates = $summaryQuery->selectRaw('
            COALESCE(SUM(net_total), 0) as total_sales,
            COALESCE(SUM(CASE WHEN status = "Partial Return" THEN net_total ELSE 0 END), 0) as partial_return,
            COALESCE(SUM(paid_amount), 0) as total_paid,
            COALESCE(SUM(remaining_amount), 0) as total_unpaid
        ')->first();

        // Calculate Returns matching filters
        $returnQuery = \App\Models\SalesReturn::query();
        if ($request->has('start_date') && $request->has('end_date') && $request->start_date && $request->end_date) {
            $returnQuery->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        if ($request->has('customer_id') && $request->customer_id) {
            $returnQuery->where('customer_id', $request->customer_id);
        }
        $totalReturns = (float)$returnQuery->sum('net_total');

        $summary = [
            'total_sales' => (float)($aggregates->total_sales ?? 0),
            'total_sales_return' => $totalReturns,
            'partial_return' => (float)($aggregates->partial_return ?? 0),
            'total_paid' => (float)($aggregates->total_paid ?? 0),
            'total_unpaid' => (float)($aggregates->total_unpaid ?? 0),
        ];

        // Optimized payload: When no filters or search are active, stream the latest 100 invoices.
        // When any filter is selected (date range, customer, status, amount, search), load all matching results.
        $hasFilters = $request->filled('start_date') || $request->filled('end_date') || ($request->filled('customer_id') && $request->customer_id !== 'all') || ($request->filled('status') && $request->status !== 'all') || $request->filled('amount') || $request->filled('search') || $request->filled('is_online');
        
        $salesQuery = $query->orderBy('date', 'desc')->orderBy('id', 'desc');
        if (!$hasFilters && !$request->boolean('all')) {
            $sales = $salesQuery->take(100)->get();
        } else {
            $sales = $salesQuery->get();
        }

        // Get Customers for Filter (lightweight projection)
        $customers = Account::eligibleForSale()->select('id', 'title')->orderBy('title')->get();

        return Inertia::render("daily/sales/index", [
            'sales' => $sales,
            'summary' => $summary,
            'filters' => $request->all(['start_date', 'end_date', 'customer_id', 'status', 'amount', 'search', 'is_online', 'all']),
            'customers' => $customers,
            'isLimited' => !$hasFilters && !$request->boolean('all'),
        ]);
    }
    //create
    public function create()
    {
        // Accounts are loaded on-demand via /account/picker (server-side paginated search)
        $accounts = [];

        $salemans = Saleman::select('id', 'name', 'code', 'commission_percentage')->get();

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
            ->select('id', 'date', 'code', 'title', 'short_name', 'company', 'trade_price', 'retail', 'retail_tp_diff', 'reorder_level', 'packing_qty', 'packing_size', 'pcs', 'type', 'category', 'gst_percent', 'gst_amount', 'discount', 'stock_1', 'stock_2', 'is_active', 'pt2', 'pt3', 'pt4', 'pt5', 'pt6', 'pt7')
            ->with(['lastPurchaseItem.purchase.supplier' => function($q) {
                $q->select('id', 'title');
            }])
            ->get()
            ->map(function ($item) use ($purchaseStats, $saleStats) {
                if ($item->lastPurchaseItem && $item->lastPurchaseItem->purchase) {
                    $lastP = $item->lastPurchaseItem;
                    $lastNetRate = ((float) ($lastP->subtotal ?? 0) > 0)
                        ? max(0.0, round((float) $lastP->trade_price * (1 - ((float) ($lastP->discount ?? 0) / (float) $lastP->subtotal)), 2))
                        : (float) $lastP->trade_price;
                    $item->last_purchase_date = $lastP->purchase->date;
                    $item->last_purchase_full = $lastP->qty_carton;
                    $item->last_purchase_pcs = $lastP->qty_pcs;
                    $item->last_purchase_rate = $lastNetRate;
                    $item->last_supplier = $lastP->purchase->supplier->title ?? null;
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

        $lastSale = Sales::select('id', 'invoice')->orderByDesc('id')->first();
        $nextInvoiceNo = 'SLS-000001';

        if ($lastSale && preg_match('/SLS-(\d+)/', $lastSale->invoice, $matches)) {
            $number = intval($matches[1]);
            $nextInvoiceNo = 'SLS-' . str_pad($number + 1, 6, '0', STR_PAD_LEFT);
        }

        // Fetch Payment Accounts
        $paymentAccounts = Account::active()
            ->select('id', 'title', 'type', 'code')
            ->with('accountType:id,name')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
            })->get();

        \App\Services\PaymentAccountingService::attachBulkBalances($paymentAccounts);

        $firms = Firm::select('id', 'name', 'defult')->get();

        $messageLines = MessageLine::whereJsonContains('category', 'Sales')
            ->where('status', 'active')
            ->get();

        return Inertia::render("daily/sales/create", [
            'items' => $items,
            'accounts' => $accounts,
            'salemans' => $salemans,
            'paymentAccounts' => $paymentAccounts,
            'nextInvoiceNo' => $nextInvoiceNo,
            'firms' => $firms,
            'messageLines' => $messageLines,
        ]);
    }

    //store
    public function store(Request $request)
    {
        $request->validate([
            'date'            => 'required|date',
            // 'invoice' is generated server-side — not validated from client input
            'code'            => 'nullable|string',
            'customer_id'     => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')->where(function ($q) {
                    $q->where('sale', 1)->where(function ($sub) {
                        $sub->where('status', 1)->orWhere('status', true)->orWhereNull('status');
                    });
                }),
            ],
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
            'tax_total'       => 'required|numeric',
            'net_total'       => 'required|numeric',
            'courier_charges' => 'nullable|numeric',
            'extra_discount'  => 'nullable|numeric',
            'total_receivable' => 'nullable|numeric',
            'paid_amount'     => 'required|numeric',
            'remaining_amount' => 'required|numeric',

            // items array validation
            'items'                   => 'required|array',
            'items.*.item_id'         => 'required|integer',
            'items.*.qty_carton'      => 'required|numeric',
            'items.*.qty_pcs'         => 'required|numeric',
            'items.*.total_pcs'       => 'required|numeric',
            'items.*.trade_price'     => 'required|numeric',
            'items.*.retail_price'    => 'nullable|numeric',
            'items.*.discount'        => 'required|numeric',
            'items.*.gst_amount'      => 'required|numeric',
            'items.*.subtotal'        => 'required|numeric',
            'items.*.bonus_qty_carton' => 'nullable|numeric',
            'items.*.bonus_qty_pcs'    => 'nullable|numeric',
            'message_line_id'          => 'nullable|integer|exists:message_lines,id',
            'print_format'             => 'nullable|in:big,small',
            'allow_negative_stock'     => 'nullable|boolean', // Added flag
            'idempotency_key'          => 'nullable|string|max:64',
        ]);

        $idempotencyService = app(\App\Services\IdempotencyService::class);

        try {
            return $idempotencyService->execute(
                idempotencyKey: $request->input('idempotency_key'),
                routeName: 'sales.store',
                payload: $request->except(['_token']),
                userId: \Illuminate\Support\Facades\Auth::id(),
                callback: function () use ($request) {
                    $afterCommitEvents = [];

                    // B9 Fix: Server-side financial verification — never trust frontend totals.
            $calcGross = collect($request->items)->sum(fn($i) => (float)($i['subtotal'] ?? 0));
            $calcNet   = $calcGross
                - (float)($request->discount_total ?? 0)
                + (float)($request->tax_total ?? 0)
                + (float)($request->courier_charges ?? 0);

            if (abs((float)$request->gross_total - $calcGross) > 1) {
                DB::rollBack();
                \Illuminate\Support\Facades\Log::warning('B9 gross_total mismatch', [
                    'client_gross' => $request->gross_total, 'server_gross' => $calcGross,
                    'customer_id'  => $request->customer_id, 'ip' => request()->ip(),
                ]);
                return redirect()->back()->withErrors(['gross_total' => 'Invoice total mismatch. Please refresh and recalculate.'])->withInput();
            }
            if (abs((float)$request->net_total - $calcNet) > 2) {
                DB::rollBack();
                \Illuminate\Support\Facades\Log::warning('B9 net_total mismatch', [
                    'client_net' => $request->net_total, 'server_net' => $calcNet,
                    'customer_id' => $request->customer_id, 'ip' => request()->ip(),
                ]);
                return redirect()->back()->withErrors(['net_total' => 'Net total mismatch. Please refresh and recalculate.'])->withInput();
            }

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

            $netPayable = max(0, (float)$request->net_total - (float)($request->extra_discount ?? 0));

            // --- INVOICE NUMBER: ID-based generation (guaranteed unique, zero race conditions) ---
            // Insert with a unique placeholder to get the auto-increment ID, then
            // immediately derive the final invoice number from it. No locks needed.

            $sale = Sales::create([
                'date'            => $request->date,
                'invoice'         => uniqid('SLS-TMP-', true), // unique temp; replaced below
                'code'            => $request->code,
                'type'            => $request->type ?? 'CREDIT',
                'customer_id'     => $request->customer_id ?? 0,
                'salesman_id'     => $request->salesman_id ?? 0,
                'firm_id'         => $request->firm_id ?? null,
                'message_line_id' => $request->message_line_id ?? null,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => $request->tax_total,
                'courier_charges' => $request->courier_charges ?? 0,
                'net_total'       => $request->net_total,
                'extra_discount'  => $request->extra_discount ?? 0,
                'total_receivable' => $request->total_receivable ?? ($request->net_total + ($request->previous_balance ?? 0)),
                'paid_amount'     => 0,
                'remaining_amount' => $netPayable,
            ]);

            // Auto-increment ID is now known — set final unique invoice number.
            $sale->invoice = 'SLS-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT);
            $sale->save();

            // --- Wallet & Commission Logic ---
            if ($sale->salesman_id) {
                $salesman = Saleman::find($sale->salesman_id);
                if ($salesman && $salesman->commission_percentage > 0) {
                    $commissionAmount = round(($sale->net_total * $salesman->commission_percentage) / 100);

                    if ($commissionAmount > 0) {
                        \App\Models\WalletTransaction::create([
                            'salesman_id' => $salesman->id,
                            'sale_id'     => $sale->id,
                            'type'        => 'credit',
                            'amount'      => $commissionAmount,
                            'description' => 'Commission for Sale Invoice: ' . $sale->invoice,
                            'status'      => 'unpaid',
                        ]);

                        $salesman->wallet_balance += $commissionAmount;
                        $salesman->save();
                    }
                }
            }

            // --- Step 1: Apply Existing Advance FIRST (matching UI calculation) ---
            // Covers: Unallocated Cash Receipts (cash-only, never discount) + CustomerCredit + Opening Balance CR (CRV-OB-xxxx)
            $useAdvanceOnCreate = $request->boolean('use_advance', false);
            if ($useAdvanceOnCreate) {
                AdvanceAllocationService::applyAdvanceToSale($sale);
            }

            // --- Step 2: Process Instant Checkout Cash/Bank/Cheque Splits ---
            if (count($splitsData) > 0) {
                $prefix = 'CRV-';
                // B4 Fix: Use lockForUpdate() inside the current DB transaction to prevent
                // two concurrent requests from generating the same CRV voucher number.
                $baseVoucherNo = $this->generateNextSaleVoucherNo($prefix);
                $groupId = null;
                $createdPayments = [];

                foreach ($splitsData as $index => $split) {
                    if (($split['amount'] ?? 0) <= 0) continue;

                    $voucherNo = $baseVoucherNo;

                    $payment = Payment::create([
                        'date' => $request->date,
                        'voucher_no' => $voucherNo,
                        'account_id' => $request->customer_id,
                        'payment_account_id' => $split['payment_account_id'],
                        'amount' => $split['amount'],
                        'net_amount' => $split['amount'],
                        'type' => 'RECEIPT',
                        'payment_method' => $split['payment_method'] ?? 'Cash',
                        'cheque_no' => $split['cheque_no'] ?? null,
                        'cheque_date' => $split['cheque_date'] ?? null,
                        'clear_date' => $split['clear_date'] ?? null,
                        'cheque_status' => ($split['payment_method'] ?? 'Cash') === 'Cheque' ? 'In Hand' : 'Clear',
                        'remarks' => 'Instance Checkout for -> Sale ' . $sale->invoice,
                    ]);

                    if ($index === 0) $groupId = $payment->id;
                    $payment->update(['group_id' => $groupId]);
                    $createdPayments[] = $payment;

                    $afterCommitEvents[] = new \App\Events\PaymentConfirmed($payment);
                }

                // Distribution Logic: settle remaining balance on THIS bill first, then FIFO to older bills
                $remainingToAllocate = $totalPaidAmount;

                if ($remainingToAllocate > 0) {
                    // 1. Current Bill Allocation (strictly bounded by remaining_amount after advance)
                    $toThisBill = min($remainingToAllocate, (float) $sale->remaining_amount);
                    if ($toThisBill > 0.005) {
                        $tempThis = $toThisBill;
                        foreach ($createdPayments as $p) {
                            if ($tempThis <= 0.005) break;
                            $canTake = round(min($tempThis, (float) $p->amount), 2);
                            if ($canTake > 0.005) {
                                PaymentAllocation::create([
                                    'payment_id' => $p->id,
                                    'bill_id' => $sale->id,
                                    'bill_type' => Sales::class,
                                    'amount' => $canTake,
                                    'is_advance' => false,
                                ]);
                                $tempThis = round($tempThis - $canTake, 2);
                            }
                        }
                        $remainingToAllocate = round($remainingToAllocate - $toThisBill, 2);
                    }

                    // 2. Surplus -> Older Bills (FIFO)
                    if ($remainingToAllocate > 0.005 && $request->customer_id) {
                        $olderBills = Sales::where('customer_id', $request->customer_id)
                            ->where('id', '!=', $sale->id)
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
                                        'bill_type' => Sales::class,
                                        'amount' => $step,
                                        'is_advance' => false,
                                    ]);
                                    $tempOld = round($tempOld - $step, 2);
                                }
                            }

                            AdvanceAllocationService::recalculateSaleSettlement($oldBill);
                            $remainingToAllocate = round($remainingToAllocate - $allocation, 2);
                        }
                    }
                }
            }

            // Final authoritative recalculation from DB allocations
            AdvanceAllocationService::recalculateSaleSettlement($sale);

            \Illuminate\Support\Facades\Log::info("SalesController@store: Processing stock for sale " . $sale->id);
            // Insert items and update stock
            foreach ($request->items as $it) {
                \Illuminate\Support\Facades\Log::info("Processing item ID: " . $it['item_id'] . " Total PCS from payload: " . $it['total_pcs']);
                $item = Items::find($it['item_id']);

                if (!$item) {
                    throw new \Exception("Item not found: ID " . $it['item_id']);
                }



                SalesItem::create([
                    'sale_id'     => $sale->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'retail_price' => $it['retail_price'] ?? 0,
                    'discount'    => $it['discount'],
                    'gst_amount'  => $it['gst_amount'],
                    'subtotal'    => $it['subtotal'],
                    'bonus_qty_carton' => $it['bonus_qty_carton'] ?? 0,
                    'bonus_qty_pcs'    => $it['bonus_qty_pcs'] ?? 0,
                ]);

                // Inventory deduction is recorded transactionally in sales_items.
                // Opening stock (items.stock_1/stock_2) remains immutable baseline.
                if (env('ENABLE_LOW_STOCK_ALERTS', false) && ($item->reorder_level ?? 0) > 0) {
                    $itemBal = \App\Services\StockService::getItemBalance($item->id);
                    if ($itemBal && (float)$itemBal->balance_pcs < $item->reorder_level) {
                        $afterCommitEvents[] = new \App\Events\LowStockAlert($item);
                    }
                }
            }

            $sale->load(['customer', 'items']);
            $successDialogData = [
                'customerName'  => $sale->customer->title ?? 'Walking Customer',
                'totalAmount'   => (float) max(0, $sale->net_total - ($sale->extra_discount ?? 0)),
                'countItems'    => $sale->items->count(),
                'countFull'     => (int) $sale->items->sum('qty_carton'),
                'countPcs'      => (int) $sale->items->sum('qty_pcs'),
                'totalDiscount' => (float) ($sale->discount_total + ($sale->extra_discount ?? 0)),
                'saleId'        => $sale->id,
                'invoiceNo'     => $sale->invoice,
                'type'          => 'create',
            ];

            $cacheData = [
                'redirect_route' => 'sale.index',
                'id'             => $sale->id,
                'flash'          => [
                    'success' => 'Sale saved successfully!',
                    'id'      => $sale->id,
                ],
                'success_dialog' => $successDialogData,
            ];

            if ($request->has('print_format') && in_array($request->print_format, ['big', 'small'])) {
                $pdfUrl = route('sale.pdf', ['sale' => $sale->id, 'format' => $request->print_format]);
                $cacheData['pdf_url'] = $pdfUrl;
                $cacheData['flash']['pdf_url'] = $pdfUrl;
                $finalResponse = redirect()->route('sale.index')
                    ->with('success', 'Sale saved successfully!')
                    ->with('id', $sale->id)
                    ->with('pdf_url', $pdfUrl)
                    ->with('success_dialog', $successDialogData);
            } else {
                $finalResponse = redirect()->route('sale.index')
                    ->with('success', 'Sale saved successfully!')
                    ->with('id', $sale->id)
                    ->with('success_dialog', $successDialogData);
            }

            return [
                'model'        => $sale,
                'response'     => $finalResponse,
                'cache'        => $cacheData,
                'after_commit' => function () use ($afterCommitEvents) {
                    foreach ($afterCommitEvents as $evt) {
                        event($evt);
                    }
                },
            ];
        }
    );
} catch (\Throwable $e) {
    \Illuminate\Support\Facades\Log::error('SalesController@store error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
    return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
}
    }

    //edit
    public function edit($id)
    {
        $sale = Sales::with('customer', 'salesman', 'items.item')->findOrFail($id);

        if ($sale->is_online) {
            return redirect()->route('sales.index')->with('error', 'Online wholesale orders cannot be edited from manual sales.');
        }

        // Load ONLY Instant Checkout splits belonging to this specific sale (never independent advance vouchers!)
        $sale->splits = AdvanceAllocationService::getCheckoutSplitsForBill(Sales::class, $sale->id, (string) $sale->invoice);

        $nonAdv = AdvanceAllocationService::getNonAdvancePaidForBill(Sales::class, $sale->id, (string) $sale->invoice);
        $advSummary = AdvanceAllocationService::getAppliedAdvanceSummaryForBill(Sales::class, $sale->id, (string) $sale->invoice);

        $sale->checkout_paid_amount = $nonAdv['checkout_paid'];
        $sale->manual_payment_paid_amount = $nonAdv['manual_payment_paid'];
        $sale->applied_advance_amount = $advSummary['total_applied_advance'];
        $sale->has_advance_allocated = $advSummary['has_advance_allocated'];

        // Load ONLY the currently assigned customer (others fetched on-demand via /account/picker)
        $accounts = AccountController::loadSingleForPicker($sale->customer_id ? (int) $sale->customer_id : null, 'sale');
        $salemans = Saleman::select('id', 'name', 'code', 'commission_percentage')->get();
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

        $existingItemIds = $sale && $sale->items ? $sale->items->pluck('item_id')->filter()->unique()->toArray() : [];
        $items = Items::where(function ($q) use ($existingItemIds) {
                $q->where('is_active', 1);
                if (!empty($existingItemIds)) {
                    $q->orWhereIn('id', $existingItemIds);
                }
            })
            ->select('id', 'date', 'code', 'title', 'short_name', 'company', 'trade_price', 'retail', 'retail_tp_diff', 'reorder_level', 'packing_qty', 'packing_size', 'pcs', 'type', 'category', 'gst_percent', 'gst_amount', 'discount', 'stock_1', 'stock_2', 'is_active', 'pt2', 'pt3', 'pt4', 'pt5', 'pt6', 'pt7')
            ->with('lastPurchaseItem.purchase.supplier')
            ->get()
            ->map(function ($item) use ($purchaseStats, $saleStats) {
                if ($item->lastPurchaseItem && $item->lastPurchaseItem->purchase) {
                    $lastP = $item->lastPurchaseItem;
                    $lastNetRate = ((float) ($lastP->subtotal ?? 0) > 0)
                        ? max(0.0, round((float) $lastP->trade_price * (1 - ((float) ($lastP->discount ?? 0) / (float) $lastP->subtotal)), 2))
                        : (float) $lastP->trade_price;
                    $item->last_purchase_date = $lastP->purchase->date;
                    $item->last_purchase_full = $lastP->qty_carton;
                    $item->last_purchase_pcs = $lastP->qty_pcs;
                    $item->last_purchase_rate = $lastNetRate;
                    $item->last_supplier = $lastP->purchase->supplier->title ?? null;
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

        // Fetch Payment Accounts (Cash/Bank/Cheque in hand)
        $paymentAccounts = Account::active()->with('accountType')->whereHas('accountType', function ($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
        })->get();

        // Fetch Firms for invoice branding
        $firms = Firm::select('id', 'name', 'defult')->get();

        // Fetch Message Lines (Category: Sales, Status: active)
        $messageLines = MessageLine::whereJsonContains('category', 'Sales')
            ->where('status', 'active')
            ->get();

        return Inertia::render("daily/sales/edit", [
            'sale' => $sale,
            'accounts' => $accounts,
            'items' => $items,
            'salemans' => $salemans,
            'paymentAccounts' => $paymentAccounts,
            'firms' => $firms,
            'messageLines' => $messageLines,
        ]);
    }

    //update
    public function update(Request $request, $id)
    {
        $existingSale = Sales::findOrFail($id);
        if ($existingSale->is_online) {
            return redirect()->route('sales.index')->with('error', 'Online wholesale orders cannot be edited from manual sales.');
        }

        $request->validate([
            'date'            => 'required|date',
            'customer_id'     => [
                'nullable',
                'integer',
                Rule::exists('accounts', 'id')->where(function ($q) {
                    $q->where('sale', 1)->where(function ($sub) {
                        $sub->where('status', 1)->orWhere('status', true)->orWhereNull('status');
                    });
                }),
            ],
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
            'tax_total'       => 'required|numeric',
            'net_total'       => 'required|numeric',
            'courier_charges' => 'nullable|numeric',
            'extra_discount'  => 'nullable|numeric',
            'total_receivable' => 'nullable|numeric',
            'paid_amount'     => 'nullable|numeric',

            // items array validation
            'items'                   => 'required|array',
            'items.*.item_id'         => 'required|integer',
            'items.*.qty_carton'      => 'required|numeric',
            'items.*.qty_pcs'         => 'required|numeric',
            'items.*.total_pcs'       => 'required|numeric',
            'items.*.trade_price'     => 'required|numeric',
            'items.*.retail_price'    => 'nullable|numeric',
            'items.*.discount'        => 'required|numeric',
            'items.*.gst_amount'      => 'required|numeric',
            'items.*.subtotal'        => 'required|numeric',
            'items.*.bonus_qty_carton' => 'nullable|numeric',
            'items.*.bonus_qty_pcs'    => 'nullable|numeric',
            'message_line_id'          => 'nullable|integer|exists:message_lines,id',
            'allow_negative_stock'     => 'nullable|boolean',
        ]);

        DB::beginTransaction();

        try {
            $sale = Sales::findOrFail($id);

            // Calculate updated totals
            $netTotal = (float) $request->net_total;
            $extraDiscount = (float) ($request->extra_discount ?? 0);
            $netPayable = max(0, $netTotal - $extraDiscount);
            $useAdvance = $request->boolean('use_advance', false);

            // Step A: Safely release ONLY previous advance allocations (is_advance=true PaymentAllocations,
            // CustomerCredit allocations, OpeningBalanceAllocations). Independent Payment vouchers & manual
            // /payment allocations are NEVER mutated or deleted.
            AdvanceAllocationService::releaseAdvanceFromSale($sale);

            // Step B: Update sale totals & metadata first so remaining calculations use the new bill total
            $sale->update([
                'date'             => $request->date,
                'invoice'          => $request->invoice ?: $sale->invoice,
                'code'             => $request->code,
                'type'             => $request->type ?? $sale->type,
                'customer_id'      => $request->customer_id ?? $sale->customer_id,
                'salesman_id'      => $request->salesman_id ?? $sale->salesman_id,
                'firm_id'          => $request->firm_id ?? $sale->firm_id,
                'message_line_id'  => $request->message_line_id ?? $sale->message_line_id,
                'no_of_items'      => $request->no_of_items,
                'gross_total'      => $request->gross_total,
                'discount_total'   => $request->discount_total,
                'tax_total'        => $request->tax_total,
                'courier_charges'  => $request->courier_charges ?? 0,
                'net_total'        => $request->net_total,
                'extra_discount'   => $request->extra_discount ?? 0,
                'total_receivable' => $request->total_receivable ?? $sale->total_receivable,
            ]);

            // Step C: Multi-Method Split Payments Sync — STRICTLY scoped to Instant Checkout payments for THIS sale!
            $isPayNow = (bool) $request->input('is_pay_now', false);
            $isMulti = (bool) $request->input('is_multi', false);

            if ($isPayNow) {
                if ($isMulti) {
                    $rawSplits = $request->input('splits', []);
                } elseif ((float)$request->paid_amount > 0 && $request->payment_account_id) {
                    $rawSplits = [[
                        'payment_account_id' => $request->payment_account_id,
                        'amount'             => (float) $request->paid_amount,
                        'payment_method'     => $request->payment_method ?? 'Cash',
                        'cheque_no'          => $request->cheque_no,
                        'cheque_date'        => $request->cheque_date,
                        'clear_date'         => $request->clear_date,
                    ]];
                } else {
                    $rawSplits = [];
                }

                // Only fetch allocations belonging to THIS sale's Instant Checkout payments!
                $existingCheckoutAllocations = PaymentAllocation::where('bill_id', $sale->id)
                    ->where('bill_type', Sales::class)
                    ->with('payment')
                    ->get()
                    ->filter(fn ($a) => AdvanceAllocationService::isCheckoutPaymentForBill($a->payment, (string) $sale->invoice));

                $matchedAllocIds = [];
                $newSplitsToCreate = [];

                foreach ($rawSplits as $split) {
                    $amt = (float) ($split['amount'] ?? 0);
                    $accId = $split['payment_account_id'] ?? null;
                    if ($amt <= 0 || empty($accId)) {
                        continue;
                    }

                    $allocId = !empty($split['allocation_id']) ? (int) $split['allocation_id'] : null;
                    $paymentId = !empty($split['payment_id']) ? (int) $split['payment_id'] : null;
                    $voucherNo = !empty($split['voucher_no']) ? $split['voucher_no'] : null;

                    $matchedAlloc = null;
                    if ($allocId) {
                        $matchedAlloc = $existingCheckoutAllocations->firstWhere('id', $allocId);
                    }
                    if (!$matchedAlloc && $paymentId) {
                        $matchedAlloc = $existingCheckoutAllocations->firstWhere('payment_id', $paymentId);
                    }
                    if (!$matchedAlloc && $voucherNo) {
                        $matchedAlloc = $existingCheckoutAllocations->first(function ($a) use ($voucherNo) {
                            return $a->payment && $a->payment->voucher_no === $voucherNo;
                        });
                    }

                    if ($matchedAlloc) {
                        // Existing checkout allocation: update in place (guaranteed checkout payment for THIS sale)
                        $matchedAllocIds[] = $matchedAlloc->id;
                        $matchedAlloc->update(['amount' => $amt]);

                        $parentPayment = $matchedAlloc->payment;
                        if ($parentPayment && AdvanceAllocationService::isCheckoutPaymentForBill($parentPayment, (string) $sale->invoice)) {
                            $parentPayment->payment_account_id = $accId;
                            $parentPayment->account_id = $request->customer_id ?? $sale->customer_id;
                            $parentPayment->payment_method = $split['payment_method'] ?? $parentPayment->payment_method ?? 'Cash';
                            $parentPayment->cheque_no = $split['cheque_no'] ?? null;
                            $parentPayment->cheque_date = $split['cheque_date'] ?? null;
                            $parentPayment->clear_date = $split['clear_date'] ?? null;
                            if (($split['payment_method'] ?? '') === 'Cheque') {
                                $parentPayment->cheque_status = $parentPayment->cheque_status ?: 'In Hand';
                            }

                            $otherAllocsSum = (float) PaymentAllocation::where('payment_id', $parentPayment->id)
                                ->where('id', '!=', $matchedAlloc->id)
                                ->sum('amount');
                            $parentPayment->amount = $otherAllocsSum + $amt;
                            $parentPayment->net_amount = $otherAllocsSum + $amt;
                            $parentPayment->save();
                        }
                    } else {
                        // Brand new split added during this edit
                        $newSplitsToCreate[] = $split;
                    }
                }

                // Delete ONLY checkout allocations that the user removed from the dialog
                foreach ($existingCheckoutAllocations as $oldAlloc) {
                    if (!in_array($oldAlloc->id, $matchedAllocIds)) {
                        $parentPayment = $oldAlloc->payment;
                        $oldAlloc->delete();

                        if ($parentPayment && AdvanceAllocationService::isCheckoutPaymentForBill($parentPayment, (string) $sale->invoice)) {
                            $remainingAllocsCount = PaymentAllocation::where('payment_id', $parentPayment->id)->count();
                            if ($remainingAllocsCount === 0) {
                                $parentPayment->delete();
                            } else {
                                $remSum = (float) PaymentAllocation::where('payment_id', $parentPayment->id)->sum('amount');
                                $parentPayment->amount = $remSum;
                                $parentPayment->net_amount = $remSum;
                                $parentPayment->save();
                            }
                        }
                    }
                }

                // Create payments and allocations for brand new splits
                if (count($newSplitsToCreate) > 0) {
                    $prefix = 'CRV-';
                    $baseVoucherNo = $this->generateNextSaleVoucherNo($prefix);
                    $groupId = null;

                    foreach ($newSplitsToCreate as $index => $nSplit) {
                        $nAmt = (float) ($nSplit['amount'] ?? 0);
                        if ($nAmt <= 0) continue;

                        $newPayment = Payment::create([
                            'date'               => $request->date,
                            'voucher_no'         => $baseVoucherNo,
                            'account_id'         => $request->customer_id ?? $sale->customer_id,
                            'payment_account_id' => $nSplit['payment_account_id'],
                            'amount'             => $nAmt,
                            'net_amount'         => $nAmt,
                            'type'               => 'RECEIPT',
                            'payment_method'     => $nSplit['payment_method'] ?? 'Cash',
                            'cheque_no'          => $nSplit['cheque_no'] ?? null,
                            'cheque_date'        => $nSplit['cheque_date'] ?? null,
                            'clear_date'         => $nSplit['clear_date'] ?? null,
                            'cheque_status'      => ($nSplit['payment_method'] ?? 'Cash') === 'Cheque' ? 'In Hand' : 'Clear',
                            'remarks'            => 'Instance Checkout for -> Edition of Sale ' . $sale->invoice,
                        ]);

                        if ($index === 0) $groupId = $newPayment->id;
                        $newPayment->update(['group_id' => $groupId]);

                        PaymentAllocation::create([
                            'payment_id' => $newPayment->id,
                            'bill_id'    => $sale->id,
                            'bill_type'  => Sales::class,
                            'amount'     => $nAmt,
                            'is_advance' => false,
                        ]);

                        event(new \App\Events\PaymentConfirmed($newPayment));
                    }
                }
            }

            // Step D: If bill total was reduced below existing allocations, trim excess so no advance is trapped
            AdvanceAllocationService::trimExcessPaymentAllocations(Sales::class, $sale->id, $netPayable);
            AdvanceAllocationService::recalculateSaleSettlement($sale);

            // Step E: Re-apply Advance cleanly if checked (respecting remaining_amount & true net credit)
            if ($useAdvance && $sale->remaining_amount > 0.005) {
                AdvanceAllocationService::applyAdvanceToSale($sale);
            }

            AdvanceAllocationService::recalculateSaleSettlement($sale);

            // Delete old items (transactional replacement updates ledger automatically)
            SalesItem::where('sale_id', $id)->delete();

            \Illuminate\Support\Facades\Log::info("SalesController@update: Processing new items for sale " . $id);
            // Insert new items
            foreach ($request->items as $it) {
                SalesItem::create([
                    'sale_id'     => $sale->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'retail_price' => $it['retail_price'] ?? 0,
                    'discount'    => $it['discount'],
                    'gst_amount'  => $it['gst_amount'],
                    'subtotal'    => $it['subtotal'],
                    'bonus_qty_carton' => $it['bonus_qty_carton'] ?? 0,
                    'bonus_qty_pcs'    => $it['bonus_qty_pcs'] ?? 0,
                ]);

                // Inventory tracked transactionally in sales_items.
                $item = Items::find($it['item_id']);
                if ($item && env('ENABLE_LOW_STOCK_ALERTS', false) && ($item->reorder_level ?? 0) > 0) {
                    $itemBal = \App\Services\StockService::getItemBalance($item->id);
                    if ($itemBal && (float)$itemBal->balance_pcs < $item->reorder_level) {
                        event(new \App\Events\LowStockAlert($item));
                    }
                }
            }

            DB::commit();

            $sale = Sales::with(['customer', 'items'])->find($id);
            $successDialogData = [
                'customerName'  => $sale->customer->title ?? 'Walking Customer',
                'totalAmount'   => (float) max(0, $sale->net_total - ($sale->extra_discount ?? 0)),
                'countItems'    => $sale->items->count(),
                'countFull'     => (int) $sale->items->sum('qty_carton'),
                'countPcs'      => (int) $sale->items->sum('qty_pcs'),
                'totalDiscount' => (float) ($sale->discount_total + ($sale->extra_discount ?? 0)),
                'saleId'        => $sale->id,
                'invoiceNo'     => $sale->invoice,
                'type'          => 'edit',
            ];

            return redirect()->route('sale.index')
                ->with('success', 'Sale updated successfully!')
                ->with('id', $id)
                ->with('success_dialog', $successDialogData);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    //view
    public function view($id)
    {
        $sale = Sales::with('customer', 'salesman', 'items.item', 'messageLine', 'firm')->find($id);


        // Get all returns for this sale
        $returns = \App\Models\SalesReturn::with(['items.item'])
            ->where('original_invoice', $sale->invoice)
            ->get();

        $sale->returns = $returns;

        // dd($sale->toArray());
        return Inertia::render("daily/sales/view", [
            'sale' => $sale,
        ]);
    }

    public function pdf(Request $request, $id)
    {
        $sale = Sales::with('customer', 'salesman', 'items.item', 'messageLine')->findOrFail($id);

        // Get the assigned firm
        $firm = Firm::find($sale->firm_id);

        // Get all returns for this sale
        $returns = \App\Models\SalesReturn::with(['items.item'])
            ->where('original_invoice', $sale->invoice)
            ->get();

        $sale->returns = $returns;
        $pdfPaymentSummary = $this->getSalePdfPaymentSummary($sale);

        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.saleshalf' : 'pdf.sale';

        $pdf = Pdf::loadView($view, compact('sale', 'firm', 'pdfPaymentSummary'));

        if ($format === 'small') {
            // Receipt size for thermal printers.
            // 28pt per item handles long product names that wrap to 2+ lines.
            // 400pt base covers header, customer info, table header, totals & footer.
            $itemCount = count($sale->items);
            $hasBonus   = $sale->items->sum('bonus_qty_carton') > 0 || $sale->items->sum('bonus_qty_pcs') > 0;
            $ptPerItem  = $hasBonus ? 30 : 28; // bonus column = slightly taller rows
            $height = 400 + ($itemCount * $ptPerItem);
            if ($sale->extra_discount > 0) {
                $height += 20;
            }
            if ($pdfPaymentSummary['applied_advance'] > 0.005 && $pdfPaymentSummary['cash_received'] > 0.005) {
                $height += 18;
            }
            $height = max(400, $height);
            $pdf->setPaper([0, 0, 226.77, $height], 'portrait'); // ~80mm width
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->stream("Sale-Invoice-$id.pdf");
    }

    public function download(Request $request, $id)
    {
        $sale = Sales::with('customer', 'salesman', 'items.item', 'messageLine')->findOrFail($id);

        // Get all returns for this sale
        $returns = \App\Models\SalesReturn::with(['items.item'])
            ->where('original_invoice', $sale->invoice)
            ->get();

        $sale->returns = $returns;
        $pdfPaymentSummary = $this->getSalePdfPaymentSummary($sale);

        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.saleshalf' : 'pdf.sale';

        $firm = \App\Models\Firm::find($sale->firm_id) ?? \App\Models\Firm::where('defult', 1)->first() ?? \App\Models\Firm::first();

        $pdf = Pdf::loadView($view, compact('sale', 'firm', 'pdfPaymentSummary'));

        if ($format === 'small') {
            $itemCount  = count($sale->items);
            $hasBonus   = $sale->items->sum('bonus_qty_carton') > 0 || $sale->items->sum('bonus_qty_pcs') > 0;
            $ptPerItem  = $hasBonus ? 30 : 28;
            $height = 400 + ($itemCount * $ptPerItem);
            if ($sale->extra_discount > 0) {
                $height += 20;
            }
            if ($pdfPaymentSummary['applied_advance'] > 0.005 && $pdfPaymentSummary['cash_received'] > 0.005) {
                $height += 18;
            }
            $height = max(400, $height);
            $pdf->setPaper([0, 0, 226.77, $height], 'portrait');
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->download("Sale-Invoice-$id.pdf");
    }

    /**
     * Split a sale's paid_amount into applied advance vs actual cash/bank received
     * so PDF invoices display accurate labels without altering totals or accounting.
     */
    private function getSalePdfPaymentSummary(Sales $sale): array
    {
        $advSummary = AdvanceAllocationService::getAppliedAdvanceSummaryForBill(
            Sales::class,
            (int) $sale->id,
            (string) $sale->invoice
        );
        $totalPaid = round((float) ($sale->paid_amount ?? 0), 2);
        $appliedAdvance = min($totalPaid, round((float) ($advSummary['total_applied_advance'] ?? 0), 2));
        $cashReceived = max(0.0, round($totalPaid - $appliedAdvance, 2));

        $remainingAdvance = 0.0;
        if ($sale->customer) {
            $advBreakdown = AdvanceAllocationService::getAvailableAdvanceBreakdown($sale->customer, 'sale');
            $remainingAdvance = round((float) ($advBreakdown['applicable_advance'] ?? 0), 2);
        }

        return [
            'applied_advance'   => $appliedAdvance,
            'cash_received'     => $cashReceived,
            'remaining_advance' => $remainingAdvance,
        ];
    }
    //destroy
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $sale = Sales::with('items')->findOrFail($id);

            // 1. Guard against deleting a sale if sales return(s) exist against it
            $hasReturns = \App\Models\SalesReturn::where('sale_id', $sale->id)
                ->orWhere('original_invoice', $sale->invoice)
                ->exists();

            if ($hasReturns) {
                return redirect()->back()->with('error', "Cannot delete sale {$sale->invoice} because sales return(s) have already been processed for this bill.");
            }

            // 2. Release advance allocations (CustomerCredit, OpeningBalanceAllocation, is_advance PaymentAllocations)
            AdvanceAllocationService::releaseAdvanceFromSale($sale);

            // Also clean up any remaining direct SalesReturnAllocation rows
            $returnAllocs = SalesReturnAllocation::where('sale_id', $sale->id)->get();
            foreach ($returnAllocs as $rAlloc) {
                $rAlloc->delete();
            }

            // 3. Roll back Salesman commission from wallet
            $walletTxs = \App\Models\WalletTransaction::where('sale_id', $sale->id)->get();
            foreach ($walletTxs as $wTx) {
                if ($wTx->type === 'credit') {
                    $salesman = Saleman::find($wTx->salesman_id);
                    if ($salesman) {
                        $salesman->wallet_balance = max(0, (float)$salesman->wallet_balance - (float)$wTx->amount);
                        $salesman->save();
                    }
                }
                $wTx->delete();
            }

            // 4. Handle Payment Allocations and Auto-generated Instant Checkout Payments
            $allocations = PaymentAllocation::where('bill_id', $sale->id)
                ->where(function ($q) {
                    $q->where('bill_type', 'App\Models\Sales')
                      ->orWhere('bill_type', Sales::class)
                      ->orWhere('bill_type', 'Sales');
                })
                ->get();

            $processedPaymentIds = [];

            foreach ($allocations as $alloc) {
                $payment = Payment::find($alloc->payment_id);
                if ($payment) {
                    $isAutoCheckoutPayment = AdvanceAllocationService::isCheckoutPaymentForBill($payment, (string) $sale->invoice);

                    if ($isAutoCheckoutPayment) {
                        $processedPaymentIds[] = $payment->id;

                        // Revert any cheque status if chequebook was used
                        if (!empty($payment->cheque_id)) {
                            \App\Models\Chequebook::where('id', $payment->cheque_id)->update(['status' => 'unused']);
                        }

                        // If this payment had surplus distributed to older bills (FIFO), revert older bills
                        $surplusAllocs = PaymentAllocation::where('payment_id', $payment->id)
                            ->where('id', '!=', $alloc->id)
                            ->get();

                        foreach ($surplusAllocs as $sAlloc) {
                            if ($sAlloc->bill_type === 'App\Models\Sales' || $sAlloc->bill_type === Sales::class) {
                                $olderBill = Sales::find($sAlloc->bill_id);
                                if ($olderBill && $olderBill->id !== $sale->id) {
                                    $olderBill->paid_amount = max(0, round((float)$olderBill->paid_amount - (float)$sAlloc->amount, 2));
                                    $netPayable = max(0, (float)$olderBill->net_total - (float)($olderBill->extra_discount ?? 0));
                                    $olderBill->remaining_amount = max(0, round($netPayable - $olderBill->paid_amount, 2));
                                    $olderBill->save();
                                }
                            }
                            $sAlloc->delete();
                        }

                        $alloc->delete();
                        $payment->delete();
                    } else {
                        // Pre-existing advance or manual payment allocation — remove allocation so advance returns to customer
                        $alloc->delete();
                    }
                } else {
                    $alloc->delete();
                }
            }

            // Clean up any remaining instant checkout payments with remarks referencing this sale
            $autoPayments = Payment::where(function ($q) use ($sale) {
                $q->where('remarks', 'like', '%Sale ' . $sale->invoice . '%')
                  ->orWhere('remarks', 'like', '%Instance Checkout for -> Sale ' . $sale->invoice . '%');
            })
            ->whereNotIn('id', $processedPaymentIds)
            ->get();

            foreach ($autoPayments as $autoPayment) {
                if (!empty($autoPayment->cheque_id)) {
                    \App\Models\Chequebook::where('id', $autoPayment->cheque_id)->update(['status' => 'unused']);
                }

                $surplusAllocs = PaymentAllocation::where('payment_id', $autoPayment->id)->get();
                foreach ($surplusAllocs as $sAlloc) {
                    if ($sAlloc->bill_type === 'App\Models\Sales' || $sAlloc->bill_type === Sales::class) {
                        $olderBill = Sales::find($sAlloc->bill_id);
                        if ($olderBill && $olderBill->id !== $sale->id) {
                            $olderBill->paid_amount = max(0, round((float)$olderBill->paid_amount - (float)$sAlloc->amount, 2));
                            $netPayable = max(0, (float)$olderBill->net_total - (float)($olderBill->extra_discount ?? 0));
                            $olderBill->remaining_amount = max(0, round($netPayable - $olderBill->paid_amount, 2));
                            $olderBill->save();
                        }
                    }
                    $sAlloc->delete();
                }

                $autoPayment->delete();
            }

            // 5. Unlink Online Order if applicable
            $onlineOrder = \App\Models\OnlineOrder::where('sale_id', $sale->id)->first();
            if ($onlineOrder) {
                $onlineOrder->sale_id = null;
                $onlineOrder->status = 'under_review';
                $onlineOrder->save();
            }

            // 6. Delete Sale items & Sale
            // Deleting sale items automatically restores available ledger stock.
            // Opening stock (items.stock_1/stock_2) remains immutable.
            SalesItem::where('sale_id', $id)->delete();
            $sale->delete();

            DB::commit();
            return redirect()->back()->with('success', "Sale invoice {$sale->invoice} and its checkout payment were deleted successfully, and stock/ledger balances have been restored.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error deleting sale: ' . $e->getMessage());
        }
    }

    /**
     * Confirm a pending guest order
     */
    public function confirm(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $sale = Sales::with('items')->findOrFail($id);
            
            if ($sale->status !== 'Pending Order') {
                return redirect()->back()->with('error', 'Only pending orders can be confirmed.');
            }

            $courierCharges = (float) $request->input('courier_charges', 0);

            // Stock is tracked transactionally via sales_items.
            // Check low stock alert if enabled
            if (env('ENABLE_LOW_STOCK_ALERTS', false)) {
                foreach ($sale->items as $item) {
                    $product = Items::find($item->item_id);
                    if ($product && ($product->reorder_level ?? 0) > 0) {
                        $itemBal = \App\Services\StockService::getItemBalance($product->id);
                        if ($itemBal && (float)$itemBal->balance_pcs < $product->reorder_level) {
                            event(new \App\Events\LowStockAlert($product));
                        }
                    }
                }
            }

            $sale->status = 'Completed';
            $sale->courier_charges = $courierCharges;
            $sale->net_total += $courierCharges;
            $sale->remaining_amount += $courierCharges;
            $sale->save();

            DB::commit();
            return redirect()->back()->with('success', "Order #{$sale->invoice} confirmed successfully. Courier charges of {$courierCharges} added to bill.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error confirming order: ' . $e->getMessage());
        }
    }

    /**
     * Cancel a pending guest order
     */
    public function cancel($id)
    {
        $sale = Sales::findOrFail($id);
        
        if ($sale->status !== 'Pending Order') {
            return redirect()->back()->with('error', 'Only pending orders can be canceled.');
        }

        $sale->status = 'Canceled';
        $sale->save();

        return redirect()->back()->with('success', "Order #{$sale->invoice} has been canceled.");
    }

    /**
     * B4 Fix: Generate a sequential CRV voucher number inside the current DB transaction.
     * Uses lockForUpdate() so concurrent requests serialize and never produce duplicates.
     *
     * @param string $prefix e.g. 'CRV-' → CRV-0001
     */
    private function generateNextSaleVoucherNo(string $prefix): string
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