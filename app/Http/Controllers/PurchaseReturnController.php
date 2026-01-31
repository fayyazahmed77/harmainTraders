<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Items;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseReturnController extends Controller
{
    //index
    public function index()
    {
        $returns = PurchaseReturn::with('supplier', 'salesman')->latest()->get();
        return Inertia::render("daily/purchase_return/index", [
            'returns' => $returns,
        ]);
    }

    //create
    public function create(Request $request)
    {
        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Supplier']);
            })
            ->get();
        $salemans = Saleman::get();
        $items = Items::get();

        $purchase = null;
        if ($request->has('purchase_id')) {
            $purchase = Purchase::with(['items.item', 'supplier', 'salesman'])->find($request->purchase_id);
        }

        return Inertia::render("daily/purchase_return/create", [
            'items' => $items,
            'accounts' => $accounts,
            'salemans' => $salemans,
            'purchase' => $purchase,
        ]);
    }

    //store
    public function store(Request $request)
    {
        $request->validate([
            'date'            => 'required|date',
            'invoice'         => 'nullable|string',
            'original_invoice' => 'nullable|string',
            'supplier_id'     => 'required|integer',
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
            'net_total'       => 'required|numeric',
            'paid_amount'     => 'required|numeric', // Refund Amount
            'remaining_amount' => 'required|numeric',

            // items array validation
            'items'                   => 'required|array',
            'items.*.item_id'         => 'required|integer',
            'items.*.qty_carton'      => 'required|numeric',
            'items.*.qty_pcs'         => 'required|numeric',
            'items.*.total_pcs'       => 'required|numeric',
            'items.*.trade_price'     => 'required|numeric',
            'items.*.discount'        => 'required|numeric',
            'items.*.subtotal'        => 'required|numeric',
        ]);

        DB::beginTransaction();

        try {
            $return = PurchaseReturn::create([
                'date'            => $request->date,
                'invoice'         => $request->invoice ?? 'PRET-' . time(),
                'original_invoice' => $request->original_invoice,
                'supplier_id'     => $request->supplier_id,
                'salesman_id'     => $request->salesman_id ?: null,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => 0,
                'net_total'       => $request->net_total,
                'paid_amount'     => $request->paid_amount,
                'remaining_amount' => $request->remaining_amount,
                'remarks'         => $request->remarks,
            ]);

            foreach ($request->items as $it) {
                PurchaseReturnItem::create([
                    'purchase_return_id' => $return->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'],
                    'gst_amount'  => 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // DECREASE Stock for Purchase Returns (We are giving items back)
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) - $it['total_pcs'];
                    $item->save();
                }
            }

            // ─────────────────────────────────────────────────────────────────────────────
            // Update Purchase Status & Financials
            // ─────────────────────────────────────────────────────────────────────────────
            if ($request->original_invoice) {
                $purchase = Purchase::where('invoice', $request->original_invoice)->first();
                if ($purchase) {
                    // Update Remaining Amount (Reduce debt to supplier)
                    // If we return items, we owe the supplier less.
                    $purchase->remaining_amount = $purchase->remaining_amount - $request->net_total;

                    // Update Status based on Returns
                    $currentReturnTotal = \App\Models\PurchaseReturn::where('original_invoice', $request->original_invoice)->sum('net_total');
                    // Note: $currentReturnTotal includes the current return because it was created at line 83

                    if ($currentReturnTotal >= $purchase->net_total) {
                        $purchase->status = 'Returned';
                    } else {
                        // Only change to Partial Return if not already Returned
                        if ($purchase->status !== 'Returned') {
                            $purchase->status = 'Partial Return';
                        }
                    }

                    $purchase->save();
                }
            }

            // ─────────────────────────────────────────────────────────────────────────────
            // Handle Cash Refund (Payment Record - Receipt)
            // ─────────────────────────────────────────────────────────────────────────────
            if ($request->paid_amount > 0) {
                // Create a Payment record (Type: RECEIPT, as we are receiving money back from supplier)
                $count = Payment::where('type', 'RECEIPT')->count() + 1;
                $voucherNo = 'CRV-' . str_pad($count, 4, '0', STR_PAD_LEFT);

                Payment::create([
                    'date' => $request->date,
                    'voucher_no' => $voucherNo,
                    'account_id' => $request->supplier_id,
                    'payment_account_id' => null,
                    'amount' => $request->paid_amount,
                    'net_amount' => $request->paid_amount,
                    'type' => 'RECEIPT', // We are receiving money
                    'remarks' => 'Refund for Purchase Return Invoice: ' . ($request->invoice ?? 'N/A'),
                    'payment_method' => 'Cash',
                ]);
            }

            DB::commit();
            return redirect()->route('purchase_return.index')->with('success', 'Purchase Return saved successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    // Get supplier's purchased items
    public function getSupplierPurchasedItems($supplierId)
    {
        try {
            // Get all purchases for this supplier
            $purchases = \App\Models\Purchase::where('supplier_id', $supplierId)->pluck('id');

            // Get all items from those purchases with aggregated quantities
            $purchasedItems = \App\Models\PurchaseItem::whereIn('purchase_id', $purchases)
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
