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
use App\Models\Payment;
use App\Models\PaymentAllocation;

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
        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Customers']);
            })
            ->get();
        $salemans = Saleman::get();
        $items = Items::get();

        $sale = null;
        if ($request->has('sale_id')) {
            $sale = Sales::with(['items.item', 'customer', 'salesman'])->find($request->sale_id);
        }

        return Inertia::render("daily/sales_return/create", [
            'items' => $items,
            'accounts' => $accounts,
            'salemans' => $salemans,
            'sale' => $sale,
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
                    $totalSoldQty = \App\Models\SalesItem::where('sale_id', $sale->id)->sum('total_pcs');

                    // 2. Calculate Total Returned Qty (Previous + Current)
                    // Find all returns for this invoice
                    $allReturns = SalesReturn::where('original_invoice', $sale->invoice)->get();
                    $totalReturnedQty = 0;
                    foreach ($allReturns as $ret) {
                        $totalReturnedQty += $ret->items()->sum('total_pcs');
                    }

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

    // Get customer's purchased items
    public function getCustomerPurchasedItems($customerId)
    {
        try {
            // Get all sales for this customer
            $sales = \App\Models\Sales::where('customer_id', $customerId)->pluck('id');

            // Get all items from those sales with aggregated quantities
            $purchasedItems = \App\Models\SalesItem::whereIn('sale_id', $sales)
                ->with('item')
                ->get()
                ->groupBy('item_id')
                ->map(function ($items) {
                    $firstItem = $items->first();
                    return [
                        'item_id' => $firstItem->item_id,
                        'item' => $firstItem->item,
                        'total_qty_carton' => $items->sum('qty_carton'),
                        'total_qty_pcs' => $items->sum('qty_pcs'),
                        'total_pcs' => $items->sum('total_pcs'),
                        'avg_trade_price' => $items->avg('trade_price'),
                        'last_trade_price' => $items->last()->trade_price,
                    ];
                })
                ->values();

            return response()->json($purchasedItems);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
