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

    // Get supplier's purchase invoices
    public function getSupplierInvoices($supplierId)
    {
        try {
            $invoices = Purchase::where('supplier_id', $supplierId)
                ->select('id', 'invoice', 'date', 'net_total', 'remaining_amount', 'status')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($p) {
                    return [
                        'id'               => $p->id,
                        'invoice'          => $p->invoice,
                        'date'             => $p->date,
                        'net_total'        => $p->net_total,
                        'remaining_amount' => $p->remaining_amount,
                        'status'           => $p->status ?? 'Active',
                    ];
                });

            return response()->json($invoices);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Get items for a specific purchase invoice
    public function getInvoiceItems($invoiceId)
    {
        try {
            $purchase = Purchase::with('items.item')->find($invoiceId);
            if (!$purchase) {
                return response()->json(['error' => 'Invoice not found'], 404);
            }

            $items = $purchase->items->map(function ($pi) {
                return [
                    'item_id'     => $pi->item_id,
                    'item'        => $pi->item,
                    'qty_carton'  => $pi->qty_carton,
                    'qty_pcs'     => $pi->qty_pcs,
                    'total_pcs'   => $pi->total_pcs,
                    'trade_price' => $pi->trade_price,
                    'discount'    => $pi->discount,
                    'gst_amount'  => $pi->gst_amount,
                    'subtotal'    => $pi->subtotal,
                ];
            });

            return response()->json([
                'invoice'  => $purchase->invoice,
                'date'     => $purchase->date,
                'net_total' => $purchase->net_total,
                'items'    => $items,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Get supplier's purchased items (manual/bulk mode)
    public function getSupplierPurchasedItems($supplierId)
    {
        try {
            $purchases = Purchase::where('supplier_id', $supplierId)->pluck('id');

            $purchasedItems = \App\Models\PurchaseItem::whereIn('purchase_id', $purchases)
                ->with(['item', 'purchase:id,invoice,date'])
                ->get()
                ->map(function ($pi) {
                    return [
                        'id'               => $pi->id,
                        'item_id'          => $pi->item_id,
                        'item'             => $pi->item,
                        'invoice_no'       => $pi->purchase->invoice ?? 'N/A',
                        'date'             => $pi->purchase->date ?? 'N/A',
                        'qty_carton'       => $pi->qty_carton,
                        'qty_pcs'          => $pi->qty_pcs,
                        'total_pcs'        => $pi->total_pcs,
                        'last_trade_price' => $pi->trade_price,
                        'gst_amount'       => $pi->gst_amount,
                        'discount'         => $pi->discount,
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
        $return = PurchaseReturn::with(['supplier', 'salesman', 'items.item'])->findOrFail($id);
        return Inertia::render("daily/purchase_return/view", [
            'returnData' => $return,
        ]);
    }

    //edit
    public function edit($id)
    {
        $return = PurchaseReturn::with(['supplier', 'salesman', 'items.item'])->findOrFail($id);
        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Supplier']);
            })
            ->get();
        $salemans = Saleman::get();
        $items = Items::get();

        return Inertia::render("daily/purchase_return/edit", [
            'returnData' => $return,
            'accounts' => $accounts,
            'salemans' => $salemans,
            'items' => $items,
        ]);
    }

    //update
    public function update(Request $request, $id)
    {
        $request->validate([
            'date'            => 'required|date',
            'invoice'         => 'required|string',
            'supplier_id'     => 'required|integer',
            'no_of_items'     => 'required|integer',
            'gross_total'     => 'required|numeric',
            'discount_total'  => 'required|numeric',
            'net_total'       => 'required|numeric',
            'items'           => 'required|array',
        ]);

        DB::beginTransaction();

        try {
            $return = PurchaseReturn::findOrFail($id);
            $oldNetTotal = $return->net_total;
            $oldOriginalInvoice = $return->original_invoice;

            // 1. Revert Stock for Old Items (Purchase return decreased stock, so increase it back)
            $oldItems = PurchaseReturnItem::where('purchase_return_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $item = Items::find($oldItem->item_id);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) + $oldItem->total_pcs;
                    $item->save();
                }
            }

            // 2. Revert Original Invoice Balance & Status
            if ($oldOriginalInvoice) {
                $purchase = Purchase::where('invoice', $oldOriginalInvoice)->first();
                if ($purchase) {
                    $purchase->remaining_amount += $oldNetTotal;
                    $purchase->save();
                }
            }

            // 3. Update Return Record
            $return->update([
                'date'            => $request->date,
                'invoice'         => $request->invoice,
                'original_invoice' => $request->original_invoice,
                'supplier_id'     => $request->supplier_id,
                'salesman_id'     => $request->salesman_id ?: null,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'net_total'       => $request->net_total,
                'remarks'         => $request->remarks,
            ]);

            // 4. Delete Old Items & Insert New Ones
            PurchaseReturnItem::where('purchase_return_id', $id)->delete();

            foreach ($request->items as $it) {
                PurchaseReturnItem::create([
                    'purchase_return_id' => $return->id,
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'] ?? 0,
                    'gst_amount'  => 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Update Stock (Decrease for Purchase Return)
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) - $it['total_pcs'];
                    $item->save();
                }
            }

            // 5. Update New Original Invoice Balance & Status
            if ($request->original_invoice) {
                $purchase = Purchase::where('invoice', $request->original_invoice)->first();
                if ($purchase) {
                    $purchase->remaining_amount -= $request->net_total;

                    $currentReturnTotal = PurchaseReturn::where('original_invoice', $request->original_invoice)->sum('net_total');
                    if ($currentReturnTotal >= $purchase->net_total) {
                        $purchase->status = 'Returned';
                    } else {
                        $purchase->status = 'Partial Return';
                    }
                    $purchase->save();
                }
            }

            DB::commit();
            return redirect()->route('purchase_return.index')->with('success', 'Purchase Return updated successfully!');
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
            $return = PurchaseReturn::findOrFail($id);
            $netTotal = $return->net_total;
            $originalInvoice = $return->original_invoice;

            // 1. Revert Stock (Increase because purchase return decreased stock)
            $items = PurchaseReturnItem::where('purchase_return_id', $id)->get();
            foreach ($items as $si) {
                $product = Items::find($si->item_id);
                if ($product) {
                    $product->stock_1 = ($product->stock_1 ?? 0) + $si->total_pcs;
                    $product->save();
                }
            }

            // 2. Revert Original Invoice Balance & Status
            if ($originalInvoice) {
                $purchase = Purchase::where('invoice', $originalInvoice)->first();
                if ($purchase) {
                    $purchase->remaining_amount += $netTotal;

                    // Recalculate Status
                    $allReturns = PurchaseReturn::where('original_invoice', $originalInvoice)
                        ->where('id', '!=', $id)
                        ->sum('net_total');

                    if ($allReturns <= 0) {
                        $purchase->status = 'Active';
                    } elseif ($allReturns < $purchase->net_total) {
                        $purchase->status = 'Partial Return';
                    } else {
                        $purchase->status = 'Returned';
                    }

                    $purchase->save();
                }
            }

            // 3. Delete Return Items & Return
            PurchaseReturnItem::where('purchase_return_id', $id)->delete();
            $return->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Purchase Return deleted and stock/balances reverted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function pdf($id)
    {
        $purchaseReturn = PurchaseReturn::with(['supplier', 'salesman', 'items.item'])->findOrFail($id);
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.purchase_return', compact('purchaseReturn'));
        $pdf->setPaper('A4', 'portrait');
        return $pdf->stream("Purchase-Return-{$purchaseReturn->invoice}.pdf");
    }
}
