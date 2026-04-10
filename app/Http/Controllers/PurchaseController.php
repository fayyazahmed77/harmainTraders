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
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;


class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with('supplier', 'salesman', 'messageLine');

        // Filter by Date Range
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        // Filter by Supplier
        if ($request->has('supplier_id') && $request->supplier_id && $request->supplier_id !== 'all') {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Filter by Status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by Search (Invoice or Supplier Name?)
        if ($request->has('search') && $request->search) {
            $query->where('invoice', 'like', '%' . $request->search . '%');
        }

        $purchases = $query->latest()->get();

        // Summary Calculations
        // Note: Filters affect summary. 
        // For Returns, we must also apply similar filters (date, supplier) to PurchaseReturn model to match context.

        $returnQuery = \App\Models\PurchaseReturn::query();
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $returnQuery->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        if ($request->has('supplier_id') && $request->supplier_id && $request->supplier_id !== 'all') {
            $returnQuery->where('supplier_id', $request->supplier_id);
        }

        $totalPurchase = $purchases->sum('net_total');
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
        // We can reuse Account with Type 'Supplier'.
        $suppliers = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->where('name', 'Supplier');
            })
            ->select('id', 'title') // Assuming 'title' is name
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
        $items = Items::get();
        $accounts = Account::with(['accountType', 'accountCategory'])
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Supplier']);
            })
            ->get();
        $salemans = Saleman::get();

        // Calculate Next Invoice Number
        $lastPurchase = Purchase::latest()->first();
        $nextInvoiceNo = 'PUR-000002';

        if ($lastPurchase && preg_match('/PUR-(\d+)/', $lastPurchase->invoice, $matches)) {
            $number = intval($matches[1]);
            $nextInvoiceNo = 'PUR-' . str_pad($number + 1, 6, '0', STR_PAD_LEFT);
        }

        $messageLines = \App\Models\MessageLine::where('category', 'Purchase')
            ->where('status', 'active')
            ->get();

        $firms = Firm::select('id', 'name', 'defult')->get();

        $paymentAccounts = Account::with('accountType')->whereHas('accountType', function ($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
        })->get();

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
            'invoice'         => 'required|string',
            'code'            => 'nullable|string',
            'supplier_id'     => 'required|integer',
            'salesman_id'     => 'nullable|integer',
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
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

            // Create purchase
            $purchase = Purchase::create([
                'date'            => $request->date,
                'invoice'         => $request->invoice,
                'code'            => $request->code,
                'supplier_id'     => $request->supplier_id,
                'salesman_id'     => $request->salesman_id,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => 0,
                'courier_charges' => $request->courier_charges ?? 0,
                'net_total'       => $request->net_total,
                'paid_amount'     => $actualPaidOnThisBill,
                'remaining_amount' => $remainingAmount,
                'status'          => 'Completed',
                'message_line_id' => $request->message_line_id,
                'firm_id'         => $request->firm_id,
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

            // --- Process Payments & Allocations ---
            if (count($splitsData) > 0) {
                $prefix = 'CPV-';
                $count = Payment::where('type', 'PAYMENT')->count() + 1;
                $baseVoucherNo = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);
                $groupId = null;
                $createdPayments = [];

                foreach ($splitsData as $index => $split) {
                    if (($split['amount'] ?? 0) <= 0) continue;

                    $voucherNo = (count($splitsData) > 1) ? $baseVoucherNo . '-' . chr(65 + $index) : $baseVoucherNo;
                    
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
                        'remarks' => 'Auto-generated from Purchase ' . $purchase->invoice,
                        'cheque_id' => $split['cheque_id'] ?? null,
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
                    $toThisBill = min($remainingToAllocate, $purchase->remaining_amount);
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
                    'gst_amount'  => 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Increase Stock & Update Trade Price
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->updateStockFromPcs($item->total_stock_pcs + $it['total_pcs']);

                    // Auto-update trade price based on supplier category percentage if enabled
                    if ($request->update_prices && $percentage > 0) {
                        $newTradePrice = $it['trade_price'] + ($it['trade_price'] * $percentage / 100);
                        $item->trade_price = round($newTradePrice);
                    }

                    $item->save();
                }
            }

            DB::commit();

            if ($request->has('print_format') && in_array($request->print_format, ['big', 'small'])) {
                return redirect()->back()
                    ->with('success', 'Purchase saved successfully!')
                    ->with('id', $purchase->id)
                    ->with('pdf_url', route('purchase.pdf', ['id' => $purchase->id, 'format' => $request->print_format]));
            }

            return redirect()->back()->with('success', 'Purchase saved successfully!')->with('id', $purchase->id);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
    //edit
    public function edit($id)
    {
        $purchase = Purchase::with('supplier', 'salesman', 'items')->find($id);
        $items = Items::get();
        $accounts = Account::with(['accountType', 'accountCategory'])
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Supplier']);
            })
            ->get();
        $salemans = Saleman::get();
        $messageLines = \App\Models\MessageLine::where('category', 'Purchase')
            ->where('status', 'active')
            ->get();

        $firms = Firm::select('id', 'name', 'defult')->get();

        // Fetch Payment Accounts (Cash/Bank/Cheque in hand)
        $paymentAccounts = Account::with('accountType')->whereHas('accountType', function ($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque in hand']);
        })->get();

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
            'invoice'         => 'required|string',
            'code'            => 'nullable|string',
            'supplier_id'     => 'required|integer',
            'salesman_id'     => 'nullable|integer',
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
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
            $existingPaid = (float) $purchase->paid_amount;
            
            // Increment paid amount with NEW payments made during this edit
            $newTotalPaid = $existingPaid + $totalNewPaid;
            
            $actualPaidOnThisBill = min($newTotalPaid, $netTotal);
            $remainingAmount = max(0, $netTotal - $actualPaidOnThisBill);

            $purchase->update([
                'date'            => $request->date,
                'invoice'         => $request->invoice,
                'code'            => $request->code,
                'supplier_id'     => $request->supplier_id,
                'salesman_id'     => $request->salesman_id,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
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
                $count = Payment::where('type', 'PAYMENT')->count() + 1;
                $baseVoucherNo = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);
                $groupId = null;
                $createdPayments = [];

                foreach ($splitsData as $index => $split) {
                    if (($split['amount'] ?? 0) <= 0) continue;
                    $voucherNo = (count($splitsData) > 1) ? $baseVoucherNo . '-' . chr(65 + $index) : $baseVoucherNo;
                    
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
                        'remarks' => 'Auto-generated from Edition of Purchase ' . $purchase->invoice,
                        'cheque_id' => $split['cheque_id'] ?? null,
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

            // Revert Stock for old items
            $oldItems = PurchaseItem::where('purchase_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $item = Items::find($oldItem->item_id);
                if ($item) {
                    $item->updateStockFromPcs($item->total_stock_pcs - $oldItem->total_pcs);
                    $item->save();
                }
            }

            // Delete old items
            PurchaseItem::where('purchase_id', $id)->delete();

            // Fetch supplier category percentage
            $supplier = Account::with('accountCategory')->find($request->supplier_id);
            $percentage = 0;
            if ($supplier && $supplier->accountCategory) {
                $percentage = floatval($supplier->accountCategory->percentage);
            }

            // Insert new items and update stock
            foreach ($request->items as $it) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'],
                    'gst_amount'  => 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Increase Stock & Update Trade Price
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->updateStockFromPcs($item->total_stock_pcs + $it['total_pcs']);

                    // Auto-update trade price based on supplier category percentage if enabled
                    if ($request->update_prices && $percentage > 0) {
                        $newTradePrice = $it['trade_price'] + ($it['trade_price'] * $percentage / 100);
                        $item->trade_price = round($newTradePrice);
                    }

                    $item->save();
                }
            }

            DB::commit();
            
            // Stay on the same page so the frontend can show the 'SuccessDialog' just like Create.
            return redirect()->back()
                ->with('success', 'Purchase updated successfully!')
                ->with('id', $purchase->id);
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
            $pdf->setPaper([0, 0, 226.77, 600], 'portrait'); // ~80mm width
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->stream("Purchase-Invoice-$id.pdf");
    }
    public function download($id)
    {
        $purchase = Purchase::with('supplier', 'salesman', 'items.item')->findOrFail($id);

        $pdf = Pdf::loadView('pdf.purchase', compact('purchase'))
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
            // Calculate average price (between trade price and retail)
            $tradePrice = floatval($lastPurchase->trade_price ?? 0);
            $retailPrice = floatval($lastPurchase->retail ?? 0);
            $lastPurchase->average_price = ($tradePrice + $retailPrice) / 2;
        }

        return response()->json($lastPurchase);
    }
}
