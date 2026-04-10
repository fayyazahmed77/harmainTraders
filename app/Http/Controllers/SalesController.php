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
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class SalesController extends Controller
{
    //index
    public function index(Request $request)
    {
        $query = Sales::with('customer', 'salesman', 'messageLine');

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

        // Filter by Search (Invoice or Code)
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice', 'like', '%' . $request->search . '%')
                    ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        $sales = $query->orderBy('date', 'desc')->get();

        // Calculate Summary
        // For returns, we need a separate query that matches the same filters (Date, Customer) if possible.
        // Assuming SalesReturn has similar fields: date, customer_id.
        $returnQuery = \App\Models\SalesReturn::query();
        if ($request->has('start_date') && $request->has('end_date') && $request->start_date && $request->end_date) {
            $returnQuery->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        if ($request->has('customer_id') && $request->customer_id) {
            $returnQuery->where('customer_id', $request->customer_id);
        }
        $totalReturns = $returnQuery->sum('net_total');


        $summary = [
            'total_sales' => $sales->sum('net_total'),
            'total_sales_return' => $totalReturns,
            'partial_return' => $sales->where('status', 'Partial Return')->sum('net_total'),
            'total_paid' => $sales->sum('paid_amount'),
            'total_unpaid' => $sales->sum('remaining_amount'),
        ];

        // Get Customers for Filter
        $customers = Account::whereHas('accountType', function ($q) {
            $q->where('name', 'Customers');
        })->select('id', 'title')->get();

        return Inertia::render("daily/sales/index", [
            'sales' => $sales,
            'summary' => $summary,
            'filters' => $request->all(['start_date', 'end_date', 'customer_id', 'status', 'search']),
            'customers' => $customers,
        ]);
    }
    //create
    public function create()
    {
        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Customers']);
            })
            ->get();
        $salemans = Saleman::get();
        // Load all items (including out of stock)
        $items = Items::with('lastPurchaseItem.purchase.supplier')
            ->get()
            ->map(function ($item) {
                if ($item->lastPurchaseItem && $item->lastPurchaseItem->purchase) {
                    $item->last_purchase_date = $item->lastPurchaseItem->purchase->date;
                    $item->last_purchase_full = $item->lastPurchaseItem->qty_carton;
                    $item->last_purchase_pcs = $item->lastPurchaseItem->qty_pcs;
                    $item->last_purchase_rate = $item->lastPurchaseItem->trade_price;
                    $item->last_supplier = $item->lastPurchaseItem->purchase->supplier->title ?? null;
                }
                return $item;
            });

        // Calculate Next Invoice Number
        $lastSale = Sales::latest()->first();
        $nextInvoiceNo = 'SLS-000001';

        if ($lastSale && preg_match('/SLS-(\d+)/', $lastSale->invoice, $matches)) {
            $number = intval($matches[1]);
            $nextInvoiceNo = 'SLS-' . str_pad($number + 1, 6, '0', STR_PAD_LEFT);
        }

        // Fetch Payment Accounts (Cash/Bank/Cheque in hand)
        $paymentAccounts = Account::with('accountType')->whereHas('accountType', function ($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
        })->get();

        // Fetch Firms for invoice branding
        $firms = Firm::select('id', 'name', 'defult')->get();

        // Fetch Message Lines (Category: Sales, Status: active)
        $messageLines = MessageLine::where('category', 'Sales')
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
            'invoice'         => 'required|string', // Assuming auto-generated or passed
            'customer_id'     => 'required|integer', // Assuming passed
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
        ]);

        DB::beginTransaction();

        try {

            // Create sale
            // Note: Adjusting fields based on what's available in the request from create.tsx
            // create.tsx sends: date, invoice, code, party (string), salesman (string), items...
            // But Sales model expects customer_id, salesman_id.
            // For now, I will use defaults or try to parse.
            // Since the user said "make a good show me first", I will assume the frontend will be updated to send IDs later.
            // For now, I'll map what I can.

            $netTotal = $request->net_total;
            $extraDiscount = $request->extra_discount ?? 0;
            $paidAmount = $request->paid_amount ?? 0;
            $remainingAmount = ($netTotal - $extraDiscount) - $paidAmount;

            // --- Multi-Method Split Payments & Allocation Logic ---
            $isMulti = (bool) $request->input('is_multi', false);
            $splitsData = $isMulti ? $request->input('splits', []) : [];

            // Calculate total paid from all splits
            $totalPaidAmount = 0;
            if ($isMulti) {
                foreach ($splitsData as $split) {
                    $totalPaidAmount += (float) ($split['amount'] ?? 0);
                }
            } else {
                $totalPaidAmount = (float) ($request->paid_amount ?? 0);
                // Normalize single payment to split format for unified processing
                if ($request->is_pay_now && $totalPaidAmount > 0 && $request->payment_account_id) {
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

            // Calculate how much goes to THIS bill vs Surplus (Previous Balance)
            $actualPaidOnThisBill = min($totalPaidAmount, $request->net_total);
            $surplusAmount = max(0, $totalPaidAmount - $request->net_total);
            $remainingAmount = max(0, $request->net_total - $actualPaidOnThisBill);

            $sale = Sales::create([
                'date'            => $request->date,
                'invoice'         => $request->invoice ?? 'INV-' . time(),
                'code'            => $request->code,
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
                'paid_amount'     => $actualPaidOnThisBill,
                'remaining_amount' => $remainingAmount,
            ]);

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

            // --- Auto-Allocate Existing Advances (Unallocated Receipts) ---
            $unallocatedPayments = Payment::where('account_id', $sale->customer_id)
                ->where('type', 'RECEIPT')
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
                if ($sale->remaining_amount <= 0) break;
                
                $allocated = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                $avail = $p->net_amount - $allocated;
                $allocationAmount = min($sale->remaining_amount, $avail);
                
                if ($allocationAmount > 0) {
                    PaymentAllocation::create([
                        'payment_id' => $p->id,
                        'bill_id' => $sale->id,
                        'bill_type' => 'App\Models\Sales',
                        'amount' => $allocationAmount,
                    ]);
                    
                    $sale->paid_amount += $allocationAmount;
                    $sale->remaining_amount -= $allocationAmount;
                }
            }
            $sale->save();

            // --- Process Payments & Allocations ---
            if (count($splitsData) > 0) {
                $prefix = 'CRV-';
                $count = Payment::where('type', 'RECEIPT')->count() + 1;
                $baseVoucherNo = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);
                $groupId = null;
                $createdPayments = [];

                foreach ($splitsData as $index => $split) {
                    if (($split['amount'] ?? 0) <= 0) continue;

                    $voucherNo = (count($splitsData) > 1) ? $baseVoucherNo . '-' . chr(65 + $index) : $baseVoucherNo;
                    
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
                        'cheque_status' => ($split['payment_method'] ?? 'Cash') === 'Cheque' ? 'In Hand' : 'Pending',
                        'remarks' => 'Auto-generated from Sale ' . $sale->invoice,
                    ]);

                    if ($index === 0) $groupId = $payment->id;
                    $payment->update(['group_id' => $groupId]);
                    $createdPayments[] = $payment;
                }

                // Distribution Logic
                $remainingToAllocate = $totalPaidAmount;

                if ($remainingToAllocate > 0) {
                    // 1. Current Bill Allocation (Respecting existing advance allocations)
                    $toThisBill = min($remainingToAllocate, $sale->remaining_amount);
                    if ($toThisBill > 0) {
                        $tempThis = $toThisBill;
                        foreach ($createdPayments as $p) {
                            if ($tempThis <= 0) break;
                            $canTake = min($tempThis, $p->net_amount);
                            PaymentAllocation::create([
                                'payment_id' => $p->id,
                                'bill_id' => $sale->id,
                                'bill_type' => 'App\Models\Sales',
                                'amount' => $canTake,
                            ]);
                            $tempThis -= $canTake;
                        }
                        $remainingToAllocate -= $toThisBill;
                    }

                    // 2. Surplus -> Older Bills (FIFO)
                    if ($remainingToAllocate > 0 && $request->customer_id) {
                        $olderBills = Sales::where('customer_id', $request->customer_id)
                            ->where('id', '!=', $sale->id)
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
                                        'bill_type' => 'App\Models\Sales',
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

                // Decrease Stock (Billable + Bonus)
                $packing = $item->packing_qty ?: 1;
                $bonusUnits = (($it['bonus_qty_carton'] ?? 0) * $packing) + ($it['bonus_qty_pcs'] ?? 0);
                $totalToDeduct = $it['total_pcs'] + $bonusUnits;

                \Illuminate\Support\Facades\Log::info("Deducting " . $totalToDeduct . " pcs from item " . $item->id . ". Current total_stock_pcs: " . $item->total_stock_pcs);
                $item->updateStockFromPcs($item->total_stock_pcs - $totalToDeduct);
                \Illuminate\Support\Facades\Log::info("New stock for item " . $item->id . ": stock_1=" . $item->stock_1 . ", stock_2=" . $item->stock_2);
            }

            DB::commit();

            if ($request->has('print_format') && in_array($request->print_format, ['big', 'small'])) {
                return redirect()->back()
                    ->with('success', 'Sale saved successfully!')
                    ->with('id', $sale->id)
                    ->with('pdf_url', route('sale.pdf', ['sale' => $sale->id, 'format' => $request->print_format]));
            }

            return redirect()->back()->with('success', 'Sale saved successfully!')->with('id', $sale->id);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    //edit
    public function edit($id)
    {
        $sale = Sales::with('customer', 'salesman', 'items.item')->find($id);

        // Fetch associated payments (splits) linked to this sale via allocations
        $sale->splits = Payment::whereHas('allocations', function($q) use ($id) {
            $q->where('bill_id', $id)->where('bill_type', 'App\Models\Sales');
        })->get();

        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Customers']);
            })
            ->get();
        $salemans = Saleman::get();
        $items = Items::with('lastPurchaseItem.purchase.supplier')
            ->get()
            ->map(function ($item) {
                if ($item->lastPurchaseItem && $item->lastPurchaseItem->purchase) {
                    $item->last_purchase_date = $item->lastPurchaseItem->purchase->date;
                    $item->last_purchase_full = $item->lastPurchaseItem->qty_carton;
                    $item->last_purchase_pcs = $item->lastPurchaseItem->qty_pcs;
                    $item->last_purchase_rate = $item->lastPurchaseItem->trade_price;
                    $item->last_supplier = $item->lastPurchaseItem->purchase->supplier->title ?? null;
                }
                return $item;
            });

        // Fetch Payment Accounts (Cash/Bank/Cheque in hand)
        $paymentAccounts = Account::with('accountType')->whereHas('accountType', function ($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
        })->get();

        // Fetch Firms for invoice branding
        $firms = Firm::select('id', 'name', 'defult')->get();

        // Fetch Message Lines (Category: Sales, Status: active)
        $messageLines = MessageLine::where('category', 'Sales')
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
        $request->validate([
            'date'            => 'required|date',
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

            // --- Multi-Method Split Payments & Allocation Logic ---
            $isMulti = (bool) $request->input('is_multi', false);
            $splitsData = $isMulti ? $request->input('splits', []) : [];
            $totalNewPaid = 0;

            if ($isMulti) {
                foreach ($splitsData as $split) {
                    $totalNewPaid += (float) ($split['amount'] ?? 0);
                }
            } else if ($request->is_pay_now && (float)$request->paid_amount > 0) {
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

            // Calculate updated totals
            $netTotal = (float) $request->net_total;
            $extraDiscount = (float) ($request->extra_discount ?? 0);
            $existingPaid = (float) $sale->paid_amount;
            
            // Increment paid amount with NEW payments made during this edit
            $newTotalPaid = $existingPaid + $totalNewPaid;
            
            $actualPaidOnThisBill = min($newTotalPaid, $netTotal);
            $remainingAmount = max(0, $netTotal - $actualPaidOnThisBill);

            $sale->update([
                'date'            => $request->date,
                'invoice'         => $request->invoice,
                'code'            => $request->code,
                'customer_id'     => $request->customer_id ?? $sale->customer_id,
                'salesman_id'     => $request->salesman_id ?? $sale->salesman_id,
                'firm_id'         => $request->firm_id ?? $sale->firm_id,
                'message_line_id' => $request->message_line_id ?? $sale->message_line_id,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => $request->tax_total,
                'courier_charges' => $request->courier_charges ?? 0,
                'net_total'       => $request->net_total,
                'extra_discount'  => $request->extra_discount ?? 0,
                'total_receivable' => $request->total_receivable ?? $sale->total_receivable,
                'paid_amount'     => $actualPaidOnThisBill,
                'remaining_amount' => $remainingAmount,
            ]);

            // --- Auto-Allocate Existing Advances (Unallocated Receipts) ---
            $unallocatedPayments = Payment::where('account_id', $sale->customer_id)
                ->where('type', 'RECEIPT')
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
                if ($sale->remaining_amount <= 0) break;
                
                $allocated = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                $avail = $p->net_amount - $allocated;
                $allocationAmount = min($sale->remaining_amount, $avail);
                
                if ($allocationAmount > 0) {
                    PaymentAllocation::create([
                        'payment_id' => $p->id,
                        'bill_id' => $sale->id,
                        'bill_type' => 'App\Models\Sales',
                        'amount' => $allocationAmount,
                    ]);
                    
                    $sale->paid_amount += $allocationAmount;
                    $sale->remaining_amount -= $allocationAmount;
                }
            }
            $sale->save();

            // --- Process New Payments & Allocations (Similar to store) ---
            if (count($splitsData) > 0 && $totalNewPaid > 0) {
                $prefix = 'CRV-';
                $count = Payment::where('type', 'RECEIPT')->count() + 1;
                $baseVoucherNo = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);
                $groupId = null;
                $createdPayments = [];

                foreach ($splitsData as $index => $split) {
                    if (($split['amount'] ?? 0) <= 0) continue;
                    $voucherNo = (count($splitsData) > 1) ? $baseVoucherNo . '-' . chr(65 + $index) : $baseVoucherNo;
                    
                    $payment = Payment::create([
                        'date' => $request->date,
                        'voucher_no' => $voucherNo,
                        'account_id' => $sale->customer_id,
                        'payment_account_id' => $split['payment_account_id'],
                        'amount' => $split['amount'],
                        'net_amount' => $split['amount'],
                        'type' => 'RECEIPT',
                        'payment_method' => $split['payment_method'] ?? 'Cash',
                        'cheque_no' => $split['cheque_no'] ?? null,
                        'cheque_date' => $split['cheque_date'] ?? null,
                        'clear_date' => $split['clear_date'] ?? null,
                        'cheque_status' => ($split['payment_method'] ?? 'Cash') === 'Cheque' ? 'In Hand' : 'Pending',
                        'remarks' => 'Auto-generated from Edition of Sale ' . $sale->invoice,
                    ]);

                    if ($index === 0) $groupId = $payment->id;
                    $payment->update(['group_id' => $groupId]);
                    $createdPayments[] = $payment;
                }

                // Distribute NEW payments (surplus allocation)
                $remainingToAllocate = $totalNewPaid;
                if ($remainingToAllocate > 0) {
                    // 1. Current Bill Allocation (Respecting existing advance allocations)
                    $canTakeToThis = max(0, $sale->remaining_amount);
                    $toThisBill = min($remainingToAllocate, $canTakeToThis);
                    
                    if ($toThisBill > 0) {
                        $tempThis = $toThisBill;
                        foreach ($createdPayments as $p) {
                            if ($tempThis <= 0) break;
                            $canTake = min($tempThis, $p->net_amount);
                            PaymentAllocation::create([
                                'payment_id' => $p->id,
                                'bill_id' => $sale->id,
                                'bill_type' => 'App\Models\Sales',
                                'amount' => $canTake,
                            ]);
                            $tempThis -= $canTake;
                        }
                        $remainingToAllocate -= $toThisBill;
                    }

                    // 2. Surplus -> Older Bills (FIFO)
                    if ($remainingToAllocate > 0 && $sale->customer_id) {
                        $olderBills = Sales::where('customer_id', $sale->customer_id)
                            ->where('id', '!=', $sale->id)
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
                                        'bill_type' => 'App\Models\Sales',
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

            // Revert Stock for old items (Increase back including bonus)
            $oldItems = SalesItem::where('sale_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $product = Items::find($oldItem->item_id);
                if ($product) {
                    $packing = $product->packing_qty ?: 1;
                    $bonusUnits = (($oldItem->bonus_qty_carton ?? 0) * $packing) + ($oldItem->bonus_qty_pcs ?? 0);
                    $totalToRevert = $oldItem->total_pcs + $bonusUnits;
                    $product->updateStockFromPcs($product->total_stock_pcs + $totalToRevert);
                }
            }

            // Delete old items
            SalesItem::where('sale_id', $id)->delete();

            \Illuminate\Support\Facades\Log::info("SalesController@update: Processing new stock for sale " . $id);
            // Insert new items and update stock (Decrease)
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

                // Decrease Stock (Billable + Bonus)
                $item = Items::find($it['item_id']);
                if ($item) {
                    $packing = $item->packing_qty ?: 1;
                    $bonusUnits = (($it['bonus_qty_carton'] ?? 0) * $packing) + ($it['bonus_qty_pcs'] ?? 0);
                    $totalToDeduct = $it['total_pcs'] + $bonusUnits;
                    $item->updateStockFromPcs($item->total_stock_pcs - $totalToDeduct);
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Sale updated successfully!')->with('id', $id);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    //view
    public function view($id)
    {
        $sale = Sales::with('customer', 'salesman', 'items.item', 'messageLine')->find($id);


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

        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.saleshalf' : 'pdf.sale';

        $pdf = Pdf::loadView($view, compact('sale', 'firm'));

        if ($format === 'small') {
            // Receipt size for thermal printers
            $pdf->setPaper([0, 0, 226.77, 600], 'portrait'); // ~80mm width
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

        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.saleshalf' : 'pdf.sale';

        $pdf = Pdf::loadView($view, compact('sale'));

        if ($format === 'small') {
            $pdf->setPaper([0, 0, 226.77, 600], 'portrait');
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->download("Sale-Invoice-$id.pdf");
    }
    //destroy
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $sale = Sales::with('items')->findOrFail($id);

            // Revert Stock (Increase back including bonus)
            foreach ($sale->items as $item) {
                $product = Items::find($item->item_id);
                if ($product) {
                    $packing = $product->packing_qty ?: 1;
                    $bonusUnits = (($item->bonus_qty_carton ?? 0) * $packing) + ($item->bonus_qty_pcs ?? 0);
                    $totalToRevert = $item->total_pcs + $bonusUnits;

                    $product->updateStockFromPcs($product->total_stock_pcs + $totalToRevert);
                }
            }

            // Delete Sale (Cascades to items if configured, or manual delete)
            // Assuming manual delete for safety if cascade isn't set in DB
            SalesItem::where('sale_id', $id)->delete();
            $sale->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Sale deleted and stock reverted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error deleting sale: ' . $e->getMessage());
        }
    }
}
