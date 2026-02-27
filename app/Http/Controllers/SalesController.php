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
        if ($request->has('status') && $request->status) {
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
        // Only load items that are in stock
        $items = Items::where('stock_1', '>', 0)->get();

        // Calculate Next Invoice Number
        $lastSale = Sales::latest()->first();
        $nextInvoiceNo = 'SLS-000001';

        if ($lastSale && preg_match('/SLS-(\d+)/', $lastSale->invoice, $matches)) {
            $number = intval($matches[1]);
            $nextInvoiceNo = 'SLS-' . str_pad($number + 1, 6, '0', STR_PAD_LEFT);
        }

        // Fetch Payment Accounts (Cash/Bank)
        $paymentAccounts = Account::whereHas('accountType', function ($q) {
            $q->whereIn('name', ['Cash', 'Bank']);
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
            $paidAmount = $request->paid_amount ?? 0;
            $remainingAmount = $netTotal - $paidAmount;

            $actualPaidOnThisBill = $paidAmount;
            $surplusAmount = 0;

            if ($paidAmount > $netTotal) {
                $actualPaidOnThisBill = $netTotal;
                $remainingAmount = 0;
                $surplusAmount = $paidAmount - $netTotal;
            }

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
                'paid_amount'     => $actualPaidOnThisBill,
                'remaining_amount' => $remainingAmount,
            ]);

            // --- Wallet & Commission Logic ---
            if ($sale->salesman_id) {
                $salesman = Saleman::find($sale->salesman_id);
                if ($salesman && $salesman->commission_percentage > 0) {
                    $commissionAmount = round(($sale->net_total * $salesman->commission_percentage) / 100);

                    if ($commissionAmount > 0) {
                        // Create Credit Transaction
                        \App\Models\WalletTransaction::create([
                            'salesman_id' => $salesman->id,
                            'sale_id'     => $sale->id,
                            'type'        => 'credit',
                            'amount'      => $commissionAmount,
                            'description' => 'Commission for Sale Invoice: ' . $sale->invoice,
                            'status'      => 'unpaid',
                        ]);

                        // Update Salesman Wallet Balance
                        $salesman->wallet_balance += $commissionAmount;
                        $salesman->save();
                    }
                }
            }
            // ---------------------------------

            // If is_pay_now is true, create a Payment record
            if ($request->is_pay_now && $paidAmount > 0 && $request->payment_account_id) {
                // Generate Voucher No
                $prefix = 'CRV-';
                $count = Payment::where('type', 'RECEIPT')->count() + 1;
                $voucherNo = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);

                $payment = Payment::create([
                    'date' => $request->date,
                    'voucher_no' => $voucherNo,
                    'account_id' => $request->customer_id,
                    'payment_account_id' => $request->payment_account_id,
                    'amount' => $paidAmount,
                    'net_amount' => $paidAmount,
                    'type' => 'RECEIPT',
                    'payment_method' => $request->payment_method ?? 'Cash',
                    'remarks' => 'Auto-generated from Sale ' . $sale->invoice,
                ]);

                // Allocation for current bill
                if ($actualPaidOnThisBill > 0) {
                    PaymentAllocation::create([
                        'payment_id' => $payment->id,
                        'bill_id' => $sale->id,
                        'bill_type' => 'App\Models\Sales',
                        'amount' => $actualPaidOnThisBill,
                    ]);
                }

                // If there is surplus, allocate to older bills
                if ($surplusAmount > 0 && $request->customer_id) {
                    $olderBills = Sales::where('customer_id', $request->customer_id)
                        ->where('id', '!=', $sale->id)
                        ->where('remaining_amount', '>', 0)
                        ->orderBy('date', 'asc')
                        ->orderBy('id', 'asc')
                        ->get();

                    foreach ($olderBills as $oldBill) {
                        if ($surplusAmount <= 0) break;

                        $allocation = min($surplusAmount, $oldBill->remaining_amount);

                        // Create Allocation Record
                        PaymentAllocation::create([
                            'payment_id' => $payment->id,
                            'bill_id' => $oldBill->id,
                            'bill_type' => 'App\Models\Sales',
                            'amount' => $allocation,
                        ]);

                        $oldBill->paid_amount += $allocation;
                        $oldBill->remaining_amount -= $allocation;
                        $oldBill->save();

                        $surplusAmount -= $allocation;
                    }
                }
            } else {
                // Standard Auto-allocation logic without creating a Payment record (if needed, but usually we should create a payment)
                // If there is surplus, allocate to older bills
                if ($surplusAmount > 0 && $request->customer_id) {
                    $olderBills = Sales::where('customer_id', $request->customer_id)
                        ->where('id', '!=', $sale->id)
                        ->where('remaining_amount', '>', 0)
                        ->orderBy('date', 'asc')
                        ->orderBy('id', 'asc')
                        ->get();

                    foreach ($olderBills as $oldBill) {
                        if ($surplusAmount <= 0) break;

                        $allocation = min($surplusAmount, $oldBill->remaining_amount);
                        $oldBill->paid_amount += $allocation;
                        $oldBill->remaining_amount -= $allocation;
                        $oldBill->save();

                        $surplusAmount -= $allocation;
                    }
                }
            }

            // Insert items and update stock
            foreach ($request->items as $it) {
                $item = Items::find($it['item_id']);

                if (!$item) {
                    throw new \Exception("Item not found: ID " . $it['item_id']);
                }

                if (($item->stock_1 ?? 0) < $it['total_pcs']) {
                    // Check if negative stock is allowed for this request
                    if (!$request->boolean('allow_negative_stock')) {
                        throw new \Exception("Insufficient stock for item: " . $item->title . ". Available: " . ($item->stock_1 ?? 0));
                    }
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

                // Decrease Stock
                $item->stock_1 = ($item->stock_1 ?? 0) - $it['total_pcs'];
                $item->save();
            }

            DB::commit();

            if ($request->has('print_format') && in_array($request->print_format, ['big', 'small'])) {
                // Redirect to index with PDF URL in session
                return redirect()->route('sale.index')
                    ->with('success', 'Sale saved successfully!')
                    ->with('pdf_url', route('sale.pdf', ['sale' => $sale->id, 'format' => $request->print_format]));
            }

            return redirect()->route('sale.index')->with('success', 'Sale saved successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    //edit
    public function edit($id)
    {
        $sale = Sales::with('customer', 'salesman', 'items')->find($id);

        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Customers']);
            })
            ->get();
        $salemans = Saleman::get();
        $items = Items::get();

        // Fetch Payment Accounts (Cash/Bank)
        $paymentAccounts = Account::whereHas('accountType', function ($q) {
            $q->whereIn('name', ['Cash', 'Bank']);
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
            'message_line_id'          => 'nullable|integer|exists:message_lines,id',
        ]);

        DB::beginTransaction();

        try {
            $sale = Sales::find($id);
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
                'paid_amount'     => $request->paid_amount ?? $sale->paid_amount,
                'remaining_amount' => $request->remaining_amount ?? $sale->remaining_amount,
            ]);

            // Revert Stock for old items (Increase back)
            $oldItems = SalesItem::where('sale_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $item = Items::find($oldItem->item_id);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) + $oldItem->total_pcs;
                    $item->save();
                }
            }

            // Delete old items
            SalesItem::where('sale_id', $id)->delete();

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
                ]);

                // Decrease Stock
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) - $it['total_pcs'];
                    $item->save();
                }
            }

            DB::commit();
            return redirect()->route('sale.index')->with('success', 'Sale updated successfully!');
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

            // Revert Stock (Increase back)
            foreach ($sale->items as $item) {
                $product = Items::find($item->item_id);
                if ($product) {
                    $product->stock_1 = ($product->stock_1 ?? 0) + $item->total_pcs;
                    $product->save();
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
