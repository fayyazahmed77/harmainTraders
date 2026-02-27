<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Items;
use App\Models\SalesReturn;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\SalesReturnItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Sales;
use App\Models\SalesItem;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\MessageLine;

class SalesReturnController extends Controller
{
    //index
    public function index()
    {
        $returns = SalesReturn::with('customer', 'salesman')->latest()->get();
        return Inertia::render("daily/sales_return/index", [
            'returns' => $returns,
        ]);
    }

    //create
    public function create(Request $request)
    {
        // Only accounts that have at least one sale
        $accounts = Account::with('accountType')
            ->whereHas('sales')
            ->get(['id', 'title', 'aging_days', 'credit_limit', 'saleman_id']);

        $salemans = Saleman::get();
        $messageLines = MessageLine::get(['id', 'messageline']);

        // Auto-generate next return invoice number
        $lastReturn = SalesReturn::latest('id')->first();
        $nextId = $lastReturn ? $lastReturn->id + 1 : 1;
        $nextInvoiceNo = 'RET-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

        return Inertia::render("daily/sales_return/create", [
            'accounts'      => $accounts,
            'salemans'      => $salemans,
            'messageLines'  => $messageLines,
            'nextInvoiceNo' => $nextInvoiceNo,
        ]);
    }

    //store
    public function store(Request $request)
    {
        $request->validate([
            'date'            => 'required|date',
            'invoice'         => 'nullable|string',
            'original_invoice' => 'nullable|string',
            'customer_id'     => 'required|integer',
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
            'tax_total'       => 'required|numeric',
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
        ]);

        DB::beginTransaction();

        try {
            $return = SalesReturn::create([
                'date'            => $request->date,
                'invoice'         => $request->invoice ?? 'RET-' . time(),
                'original_invoice' => $request->original_invoice,
                'customer_id'     => $request->customer_id,
                'salesman_id'     => $request->salesman_id ?? 0,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => $request->tax_total,
                'net_total'       => $request->net_total,
                'paid_amount'     => $request->paid_amount,
                'remaining_amount' => $request->remaining_amount,
                'remarks'         => $request->remarks,
            ]);

            foreach ($request->items as $it) {
                SalesReturnItem::create([
                    'sales_return_id' => $return->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'],
                    'gst_amount'  => $it['gst_amount'],
                    'subtotal'    => $it['subtotal'],
                ]);

                // INCREASE Stock for Returns
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) + $it['total_pcs'];
                    $item->save();
                }
            }

            // ─────────────────────────────────────────────────────────────────────────────
            // Update Sales Status & Payment Status
            // ─────────────────────────────────────────────────────────────────────────────
            if ($request->original_invoice) {
                $sale = Sales::where('invoice', $request->original_invoice)->first();
                if ($sale) {
                    // 1. Calculate Total Sold Qty
                    $totalSoldQty = SalesItem::where('sale_id', $sale->id)->sum('total_pcs');

                    // 2. Calculate Total Returned Qty (Previous + Current)
                    // Find all returns for this invoice
                    $allReturnIds = SalesReturn::where('original_invoice', $sale->invoice)->pluck('id');
                    $totalReturnedQty = SalesReturnItem::whereIn('sales_return_id', $allReturnIds)->sum('total_pcs');

                    // Determine Status
                    $status = 'Partial Return';
                    if ($totalReturnedQty >= $totalSoldQty) {
                        $status = 'Returned';
                    }

                    // Update Sales Status
                    $sale->status = $status;

                    // Update Remaining Amount (Reduce debt)
                    // We reduce the remaining amount by the Net Total of the return
                    // If the customer returns items, they owe us less.
                    $sale->remaining_amount = $sale->remaining_amount - $request->net_total;

                    // Optional: Prevent negative remaining amount if you don't want credit balance on the invoice itself
                    // But allowing negative implies a credit which is often correct.
                    // For now, we allow it to go negative or zero.

                    $sale->save();

                    // Update Related Payment Status (if any)
                    $allocation = PaymentAllocation::where('bill_type', 'App\Models\Sales')
                        ->where('bill_id', $sale->id)
                        ->first();

                    if ($allocation && $allocation->payment) {
                        $payment = $allocation->payment;
                        $payment->cheque_status = $status;
                        $payment->save();
                    }
                }
            }

            // ─────────────────────────────────────────────────────────────────────────────
            // Handle Cash Refund (Payment Record)
            // ─────────────────────────────────────────────────────────────────────────────
            if ($request->paid_amount > 0) {
                // Create a Payment record (Type: PAYMENT, as we are paying the customer back)
                // We need a Voucher No
                $count = Payment::where('type', 'PAYMENT')->count() + 1;
                $voucherNo = 'CPV-' . str_pad($count, 4, '0', STR_PAD_LEFT);

                $payment = Payment::create([
                    'date' => $request->date,
                    'voucher_no' => $voucherNo,
                    'account_id' => $request->customer_id,
                    'payment_account_id' => null, // We don't have this from frontend yet, maybe default or leave null
                    'amount' => $request->paid_amount,
                    'net_amount' => $request->paid_amount,
                    'type' => 'PAYMENT', // We are paying the customer
                    'remarks' => 'Refund for Return Invoice: ' . ($request->invoice ?? 'N/A'),
                    'payment_method' => 'Cash', // Default to Cash for now
                ]);

                // Note: We are NOT allocating this payment to the Sale because the Sale's remaining amount 
                // was already reduced by the Return itself. This payment is just the cash flow side.
                // If we allocated it, we would be double-counting the reduction (once for return, once for payment).
            }

            DB::commit();
            return redirect()->route('sales_return.index')->with('success', 'Sales Return saved successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    // Get customer's sales invoices
    public function getCustomerInvoices($customerId)
    {
        try {
            $invoices = Sales::where('customer_id', $customerId)
                ->select('id', 'invoice', 'date', 'net_total', 'remaining_amount', 'status')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($sale) {
                    return [
                        'id'               => $sale->id,
                        'invoice'          => $sale->invoice,
                        'date'             => $sale->date,
                        'net_total'        => $sale->net_total,
                        'remaining_amount' => $sale->remaining_amount,
                        'status'           => $sale->status ?? 'Active',
                    ];
                });

            return response()->json($invoices);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Get items for a specific invoice
    public function getInvoiceItems($invoiceId)
    {
        try {
            $sale = Sales::with('items.item')->find($invoiceId);
            if (!$sale) {
                return response()->json(['error' => 'Invoice not found'], 404);
            }

            $items = $sale->items->map(function ($saleItem) {
                return [
                    'item_id'     => $saleItem->item_id,
                    'item'        => $saleItem->item,
                    'qty_carton'  => $saleItem->qty_carton,
                    'qty_pcs'     => $saleItem->qty_pcs,
                    'total_pcs'   => $saleItem->total_pcs,
                    'trade_price' => $saleItem->trade_price, // exact price from sale
                    'discount'    => $saleItem->discount,
                    'gst_amount'  => $saleItem->gst_amount,
                    'subtotal'    => $saleItem->subtotal,
                ];
            });

            return response()->json([
                'invoice'  => $sale->invoice,
                'date'     => $sale->date,
                'net_total' => $sale->net_total,
                'items'    => $items,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Get customer's purchased items (for manual mode)
    public function getCustomerPurchasedItems($customerId)
    {
        try {
            $sales = Sales::where('customer_id', $customerId)->pluck('id');

            $purchasedItems = SalesItem::whereIn('sale_id', $sales)
                ->with(['item', 'sale:id,invoice,date'])
                ->get()
                ->map(function ($si) {
                    return [
                        'id'               => $si->id,
                        'item_id'          => $si->item_id,
                        'item'             => $si->item,
                        'invoice_no'       => $si->sale->invoice ?? 'N/A',
                        'date'             => $si->sale->date ?? 'N/A',
                        'qty_carton'       => $si->qty_carton,
                        'qty_pcs'          => $si->qty_pcs,
                        'total_pcs'        => $si->total_pcs,
                        'last_trade_price' => $si->trade_price,
                        'gst_amount'       => $si->gst_amount,
                        'discount'         => $si->discount,
                    ];
                });

            return response()->json($purchasedItems);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    //show
    public function show($id)
    {
        $return = SalesReturn::with(['customer', 'salesman', 'items.item'])->findOrFail($id);
        return Inertia::render("daily/sales_return/view", [
            'returnData' => $return,
        ]);
    }

    //edit
    public function edit($id)
    {
        $return = SalesReturn::with(['customer', 'salesman', 'items.item'])->findOrFail($id);

        $accounts = Account::with('accountType')
            ->whereHas('sales')
            ->get(['id', 'title', 'aging_days', 'credit_limit', 'saleman_id']);

        $salemans = Saleman::get();
        $messageLines = MessageLine::get(['id', 'messageline']);

        return Inertia::render("daily/sales_return/edit", [
            'returnData'    => $return,
            'accounts'      => $accounts,
            'salemans'      => $salemans,
            'messageLines'  => $messageLines,
        ]);
    }

    //update
    public function update(Request $request, $id)
    {
        $request->validate([
            'date'            => 'required|date',
            'invoice'         => 'required|string',
            'customer_id'     => 'required|integer',
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
            'tax_total'       => 'required|numeric',
            'net_total'       => 'required|numeric',
            'items'           => 'required|array',
        ]);

        DB::beginTransaction();

        try {
            $return = SalesReturn::findOrFail($id);
            $oldNetTotal = $return->net_total;
            $oldOriginalInvoice = $return->original_invoice;

            // 1. Revert Stock for Old Items
            $oldItems = SalesReturnItem::where('sales_return_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $item = Items::find($oldItem->item_id);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) - $oldItem->total_pcs;
                    $item->save();
                }
            }

            // 2. Revert Original Invoice Balance
            if ($oldOriginalInvoice) {
                $oldSale = Sales::where('invoice', $oldOriginalInvoice)->first();
                if ($oldSale) {
                    $oldSale->remaining_amount += $oldNetTotal;
                    $oldSale->save();
                }
            }

            // 3. Update Return Record
            $return->update([
                'date'            => $request->date,
                'invoice'         => $request->invoice,
                'original_invoice' => $request->original_invoice,
                'customer_id'     => $request->customer_id,
                'salesman_id'     => $request->salesman_id ?? 0,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => $request->tax_total,
                'net_total'       => $request->net_total,
                'remarks'         => $request->remarks,
            ]);

            // 4. Delete Old Items & Insert New Ones
            SalesReturnItem::where('sales_return_id', $id)->delete();

            foreach ($request->items as $it) {
                SalesReturnItem::create([
                    'sales_return_id' => $return->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'] ?? 0,
                    'gst_amount'  => $it['gst_amount'] ?? 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Update Stock (Increase for Return)
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) + $it['total_pcs'];
                    $item->save();
                }
            }

            // 5. Update New Original Invoice Balance
            if ($request->original_invoice) {
                $newSale = Sales::where('invoice', $request->original_invoice)->first();
                if ($newSale) {
                    $newSale->remaining_amount -= $request->net_total;

                    // Update Status
                    $totalSoldQty = SalesItem::where('sale_id', $newSale->id)->sum('total_pcs');
                    $allReturnIds = SalesReturn::where('original_invoice', $newSale->invoice)->pluck('id');
                    $totalReturnedQty = SalesReturnItem::whereIn('sales_return_id', $allReturnIds)->sum('total_pcs');
                    $newSale->status = ($totalReturnedQty >= $totalSoldQty) ? 'Returned' : 'Partial Return';

                    $newSale->save();
                }
            }

            DB::commit();
            return redirect()->route('sales_return.index')->with('success', 'Sales Return updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    //destroy
    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $return = SalesReturn::findOrFail($id);
            $netTotal = $return->net_total;
            $originalInvoice = $return->original_invoice;

            // 1. Revert Stock (Decrease because return added stock)
            $items = SalesReturnItem::where('sales_return_id', $id)->get();
            foreach ($items as $si) {
                $product = Items::find($si->item_id);
                if ($product) {
                    $product->stock_1 = ($product->stock_1 ?? 0) - $si->total_pcs;
                    $product->save();
                }
            }

            // 2. Revert Original Invoice Balance & Status
            if ($originalInvoice) {
                $sale = Sales::where('invoice', $originalInvoice)->first();
                if ($sale) {
                    $sale->remaining_amount += $netTotal;

                    // Recalculate Status
                    $totalSoldQty = SalesItem::where('sale_id', $sale->id)->sum('total_pcs');
                    $allReturnIds = SalesReturn::where('original_invoice', $sale->invoice)
                        ->where('id', '!=', $id)
                        ->pluck('id');
                    $totalReturnedQty = SalesReturnItem::whereIn('sales_return_id', $allReturnIds)->sum('total_pcs');

                    if ($totalReturnedQty <= 0) {
                        $sale->status = 'Active';
                    } elseif ($totalReturnedQty < $totalSoldQty) {
                        $sale->status = 'Partial Return';
                    } else {
                        $sale->status = 'Returned';
                    }

                    $sale->save();
                }
            }

            // 3. Delete Return Items & Return
            SalesReturnItem::where('sales_return_id', $id)->delete();
            $return->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Sales Return deleted and stock/balances reverted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function pdf($id)
    {
        $salesReturn = SalesReturn::with(['customer', 'salesman', 'items.item'])->findOrFail($id);
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.sales_return', compact('salesReturn'));
        $pdf->setPaper('A4', 'portrait');
        return $pdf->stream("Sales-Return-{$salesReturn->invoice}.pdf");
    }
}
