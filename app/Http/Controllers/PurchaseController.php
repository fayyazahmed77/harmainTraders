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

        $purchases = $query->latest()->get();

        // Summary Calculations
        // Note: Filters affect summary. 
        // For Returns, we must also apply similar filters (date, supplier) to PurchaseReturn model to match context.

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

        $totalPurchase = $purchases->sum(fn($p) => $p->net_total - ($p->extra_discount ?? 0));
        $totalPaid = $purchases->sum('paid_amount');
        $totalUnpaid = $purchases->sum('remaining_amount'); // or net_total - paid_amount
        $totalReturns = $returnQuery->sum('net_total');

        $summary = [
            'total_purchase' => $totalPurchase,
            'total_paid' => $totalPaid,
            'total_unpaid' => $totalUnpaid,
            'total_returns' => $totalReturns,
            'count' => $purchases->count(),
        ];

        // Suppliers for Filter
        $suppliers = Account::eligibleForPurchase()
            ->select('id', 'title')
            ->get();

        return Inertia::render("daily/purchase/index", [
            'purchases' => $purchases,
            'summary' => $summary,
            'filters' => $request->all(['start_date', 'end_date', 'supplier_id', 'status', 'search']),
            'suppliers' => $suppliers,
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

        $accounts = Account::eligibleForPurchase()
            ->select('id', 'code', 'title', 'type', 'category', 'city_id', 'area_id', 'saleman_id', 'opening_balance', 'opening_balance_type', 'purchase', 'sale')
            ->with(['accountType:id,name', 'accountCategory:id,name'])
            ->get();

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
        ]);

        DB::beginTransaction();

        try {
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

            // Calculate how much goes to THIS bill vs Surplus (Previous Balance)
            $netPurchaseTotal = max(0, (float)$request->net_total - (float)($request->extra_discount ?? 0));
            $actualPaidOnThisBill = min($totalPaidAmount, $netPurchaseTotal);
            $surplusAmount = max(0, $totalPaidAmount - $netPurchaseTotal);
            $remainingAmount = max(0, $netPurchaseTotal - $actualPaidOnThisBill);

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
                'paid_amount'     => $actualPaidOnThisBill,
                'remaining_amount' => $remainingAmount,
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

            // --- Auto-Allocate Existing Advances (Unallocated Payments) ---
            $unallocatedPayments = Payment::where('account_id', $purchase->supplier_id)
                ->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNull('cheque_status')
                      ->orWhere('cheque_status', '!=', 'Canceled');
                })
                ->get()
                ->filter(function($p) {
                    $allocated = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                    return $p->net_amount > $allocated;
                })
                ->sortBy('date');

            foreach ($unallocatedPayments as $p) {
                if ($purchase->remaining_amount <= 0) break;
                
                $allocated = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                $avail = $p->net_amount - $allocated;
                $allocationAmount = min($purchase->remaining_amount, $avail);
                
                if ($allocationAmount > 0) {
                    PaymentAllocation::create([
                        'payment_id' => $p->id,
                        'bill_id' => $purchase->id,
                        'bill_type' => 'App\Models\Purchase',
                        'amount' => $allocationAmount,
                    ]);
                    
                    $purchase->paid_amount += $allocationAmount;
                    $purchase->remaining_amount -= $allocationAmount;
                }
            }
            $purchase->save();

            // --- Process Payments & Allocations ---
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

                // Distribution Logic
                $remainingToAllocate = $totalPaidAmount;

                if ($remainingToAllocate > 0) {
                    // 1. Current Bill Allocation (Respecting existing advance allocations)
                    $toThisBill = min($remainingToAllocate, $purchase->remaining_amount + $actualPaidOnThisBill);
                    if ($toThisBill > 0) {
                        $tempThis = $toThisBill;
                        foreach ($createdPayments as $p) {
                            if ($tempThis <= 0) break;
                            $canTake = min($tempThis, $p->net_amount);
                            PaymentAllocation::create([
                                'payment_id' => $p->id,
                                'bill_id' => $purchase->id,
                                'bill_type' => 'App\Models\Purchase',
                                'amount' => $canTake,
                            ]);
                            $tempThis -= $canTake;
                        }
                        $remainingToAllocate -= $toThisBill;
                    }

                    // 2. Surplus -> Older Bills (FIFO)
                    if ($remainingToAllocate > 0 && $request->supplier_id) {
                        $olderBills = Purchase::where('supplier_id', $request->supplier_id)
                            ->where('id', '!=', $purchase->id)
                            ->where('remaining_amount', '>', 0)
                            ->orderBy('date', 'asc')
                            ->orderBy('id', 'asc')
                            ->get();

                        foreach ($olderBills as $oldBill) {
                            if ($remainingToAllocate <= 0) break;
                            $allocation = min($remainingToAllocate, $oldBill->remaining_amount);
                            $tempOld = $allocation;

                            foreach ($createdPayments as $p) {
                                if ($tempOld <= 0) break;
                                $alreadyAlloc = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                                $avail = $p->net_amount - $alreadyAlloc;

                                if ($avail > 0) {
                                    $step = min($tempOld, $avail);
                                    PaymentAllocation::create([
                                        'payment_id' => $p->id,
                                        'bill_id' => $oldBill->id,
                                        'bill_type' => 'App\Models\Purchase',
                                        'amount' => $step,
                                    ]);
                                    $tempOld -= $step;
                                }
                            }
                            
                            $oldBill->paid_amount += $allocation;
                            $oldBill->remaining_amount -= $allocation;
                            $oldBill->save();
                            $remainingToAllocate -= $allocation;
                        }
                    }
                }
            }

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
                'mode'         => 'create',
            ];

            if ($request->has('print_format') && in_array($request->print_format, ['big', 'small'])) {
                return redirect()->route('purchase.index')
                    ->with('success', 'Purchase saved successfully!')
                    ->with('id', $purchase->id)
                    ->with('pdf_url', route('purchase.pdf', ['id' => $purchase->id, 'format' => $request->print_format]))
                    ->with('success_dialog', $successDialogData);
            }

            return redirect()->route('purchase.index')
                ->with('success', 'Purchase saved successfully!')
                ->with('id', $purchase->id)
                ->with('success_dialog', $successDialogData);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
    //edit
    public function edit($id)
    {
        $purchase = Purchase::with('supplier', 'salesman', 'items')->find($id);
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

        $accounts = Account::eligibleForPurchase()
            ->with(['accountType', 'accountCategory'])
            ->get();
        $salemans = Saleman::get();
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

            // --- Multi-Method Split Payments & Allocation Logic ---
            $isPayNow = (bool) $request->input('is_pay_now', false);
            $isMulti = (bool) $request->input('is_multi', false);
            $splitsData = [];
            $totalNewPaid = 0;

            if ($isPayNow) {
                // Fetch IDs of payments already allocated to this purchase to strictly avoid duplicating them
                $existingAllocatedPaymentIds = PaymentAllocation::where('bill_id', $purchase->id)
                    ->where('bill_type', 'App\Models\Purchase')
                    ->pluck('payment_id')
                    ->toArray();

                if ($isMulti) {
                    $rawSplits = $request->input('splits', []);
                    foreach ($rawSplits as $split) {
                        $amt = (float) ($split['amount'] ?? 0);
                        $hasVoucher = !empty($split['voucher_no']);
                        $isExistingPayment = !empty($split['id']) && in_array($split['id'], $existingAllocatedPaymentIds);

                        // Only consider truly NEW splits added during this edit session
                        if ($amt > 0 && !$hasVoucher && !$isExistingPayment && !empty($split['payment_account_id'])) {
                            $splitsData[] = $split;
                            $totalNewPaid += $amt;
                        }
                    }
                } else if ((float)$request->paid_amount > 0 && $request->payment_account_id) {
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

            // Calculate updated totals
            $extraDiscount = (float) ($request->extra_discount ?? 0);
            $netTotal = (float) $request->net_total;
            $netPurchaseTotal = max(0, $netTotal - $extraDiscount);

            // Re-read existing paid amount from actual PaymentAllocations
            $existingPaidFromAlloc = (float) PaymentAllocation::where('bill_id', $purchase->id)
                ->where('bill_type', 'App\Models\Purchase')
                ->sum('amount');
            $existingPaid = max((float)$purchase->paid_amount, $existingPaidFromAlloc);

            // Increment paid amount with NEW payments made during this edit
            $newTotalPaid = $existingPaid + $totalNewPaid;
            
            $actualPaidOnThisBill = min($newTotalPaid, $netPurchaseTotal);
            $remainingAmount = max(0, $netPurchaseTotal - $actualPaidOnThisBill);

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
                'paid_amount'     => $actualPaidOnThisBill,
                'remaining_amount' => $remainingAmount,
                'status'          => $request->status ?? $purchase->status,
                'message_line_id' => $request->message_line_id,
                'firm_id'         => $request->firm_id ?? $purchase->firm_id,
            ]);

            // --- Auto-Allocate Existing Advances (Unallocated Payments) ---
            $unallocatedPayments = Payment::where('account_id', $purchase->supplier_id)
                ->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNull('cheque_status')
                      ->orWhere('cheque_status', '!=', 'Canceled');
                })
                ->get()
                ->filter(function($p) {
                    $allocated = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                    return $p->net_amount > $allocated;
                })
                ->sortBy('date');

            foreach ($unallocatedPayments as $p) {
                if ($purchase->remaining_amount <= 0) break;
                
                $allocated = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                $avail = $p->net_amount - $allocated;
                $allocationAmount = min($purchase->remaining_amount, $avail);
                
                if ($allocationAmount > 0) {
                    PaymentAllocation::create([
                        'payment_id' => $p->id,
                        'bill_id' => $purchase->id,
                        'bill_type' => 'App\Models\Purchase',
                        'amount' => $allocationAmount,
                    ]);
                    
                    $purchase->paid_amount += $allocationAmount;
                    $purchase->remaining_amount -= $allocationAmount;
                }
            }
            $purchase->save();

            // --- Process New Payments & Allocations ---
            if (count($splitsData) > 0 && $totalNewPaid > 0) {
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
                if ($remainingToAllocate > 0) {
                    // 1. Current Bill Allocation (Respecting existing advance allocations)
                    $canTakeToThis = max(0, $purchase->remaining_amount);
                    $toThisBill = min($remainingToAllocate, $canTakeToThis);
                    
                    if ($toThisBill > 0) {
                        $tempThis = $toThisBill;
                        foreach ($createdPayments as $p) {
                            if ($tempThis <= 0) break;
                            $canTake = min($tempThis, $p->net_amount);
                            PaymentAllocation::create([
                                'payment_id' => $p->id,
                                'bill_id' => $purchase->id,
                                'bill_type' => 'App\Models\Purchase',
                                'amount' => $canTake,
                            ]);
                            $tempThis -= $canTake;
                        }
                        $remainingToAllocate -= $toThisBill;
                    }

                    // 2. Surplus -> Older Bills (FIFO)
                    if ($remainingToAllocate > 0 && $purchase->supplier_id) {
                        $olderBills = Purchase::where('supplier_id', $purchase->supplier_id)
                            ->where('id', '!=', $purchase->id)
                            ->where('remaining_amount', '>', 0)
                            ->orderBy('date', 'asc')
                            ->orderBy('id', 'asc')
                            ->get();

                        foreach ($olderBills as $oldBill) {
                            if ($remainingToAllocate <= 0) break;
                            $allocation = min($remainingToAllocate, $oldBill->remaining_amount);
                            $tempOld = $allocation;

                            foreach ($createdPayments as $p) {
                                if ($tempOld <= 0) break;
                                $alreadyAlloc = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                                $avail = $p->net_amount - $alreadyAlloc;
                                if ($avail > 0) {
                                    $step = min($tempOld, $avail);
                                    PaymentAllocation::create([
                                        'payment_id' => $p->id,
                                        'bill_id' => $oldBill->id,
                                        'bill_type' => 'App\Models\Purchase',
                                        'amount' => $step,
                                    ]);
                                    $tempOld -= $step;
                                }
                            }
                            
                            $oldBill->paid_amount += $allocation;
                            $oldBill->remaining_amount -= $allocation;
                            $oldBill->update([
                                'paid_amount' => $oldBill->paid_amount,
                                'remaining_amount' => $oldBill->remaining_amount,
                            ]);
                            $remainingToAllocate -= $allocation;
                        }
                    }
                }
            }

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
            if (\App\Models\PurchaseReturn::where('original_invoice', $purchase->invoice)->exists()) {
                return redirect()->back()->with('error', "Cannot delete purchase {$purchase->invoice} because purchase return(s) have already been processed for this bill.");
            }

            // 2. Revert Stock (Decrease stock by total_pcs)
            foreach ($purchase->items as $pi) {
                $item = Items::find($pi->item_id);
                if ($item) {
                    // Inward stock automatically removed when purchase items are deleted
                }
            }

            // 3. Handle Payment Allocations and Auto-generated Payments
            $allocations = PaymentAllocation::where('bill_id', $purchase->id)
                ->where('bill_type', 'App\Models\Purchase')
                ->get();

            foreach ($allocations as $alloc) {
                $payment = Payment::find($alloc->payment_id);
                if ($payment && str_starts_with($payment->remarks ?? '', 'Auto-generated from Purchase ' . $purchase->invoice)) {
                    // Bank cheque restoration
                    if (!empty($payment->cheque_id)) {
                        Chequebook::where('id', $payment->cheque_id)->update(['status' => 'unused']);
                    }
                    // Customer cheque restoration
                    if (!empty($payment->customer_cheque_id)) {
                        Payment::where('id', $payment->customer_cheque_id)->update(['cheque_status' => 'Pending']);
                    }
                    PaymentAllocation::where('payment_id', $payment->id)->delete();
                    $payment->delete();
                } else {
                    // Advance payment or manual payment allocation — remove allocation to free advance back to supplier
                    $alloc->delete();
                }
            }

            // Clean up any remaining auto-generated payments with remarks referencing this purchase
            $autoPayments = Payment::where('remarks', 'like', 'Auto-generated from Purchase ' . $purchase->invoice . '%')->get();
            foreach ($autoPayments as $autoPayment) {
                if (!empty($autoPayment->cheque_id)) {
                    Chequebook::where('id', $autoPayment->cheque_id)->update(['status' => 'unused']);
                }
                // If surplus was applied to older bills, revert older bills paid/remaining balances
                $surplusAllocs = PaymentAllocation::where('payment_id', $autoPayment->id)
                    ->where('bill_id', '!=', $purchase->id)
                    ->where('bill_type', 'App\Models\Purchase')
                    ->get();
                foreach ($surplusAllocs as $sAlloc) {
                    $olderBill = Purchase::find($sAlloc->bill_id);
                    if ($olderBill) {
                        $olderBill->paid_amount = max(0, $olderBill->paid_amount - $sAlloc->amount);
                        $olderBill->remaining_amount += $sAlloc->amount;
                        $olderBill->save();
                    }
                    $sAlloc->delete();
                }
                PaymentAllocation::where('payment_id', $autoPayment->id)->delete();
                $autoPayment->delete();
            }

            // 4. Delete Purchase items & Purchase
            PurchaseItem::where('purchase_id', $id)->delete();
            $purchase->delete();

            DB::commit();
            return redirect()->back()->with('success', "Purchase invoice {$purchase->invoice} deleted and stock/accounting reverted successfully!");
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
