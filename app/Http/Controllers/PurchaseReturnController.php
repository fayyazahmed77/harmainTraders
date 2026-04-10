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
        $returns = PurchaseReturn::with('supplier', 'salesman')
            ->withSum('items as total_cartons', 'qty_carton')
            ->withSum('items as total_pcs', 'total_pcs')
            ->latest()
            ->get();
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
                    'bonus_qty_carton' => $it['bonus_qty_carton'] ?? 0,
                    'bonus_qty_pcs'    => $it['bonus_qty_pcs'] ?? 0,
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'] ?? 0,
                    'gst_amount'  => 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // DECREASE Stock for Purchase Returns (We are giving items back)
                $item = Items::find($it['item_id']);
                if ($item) {
                    $packing = (float)($item->packing_full ?? 1);
                    $totalReturnPcs = (float)($it['total_pcs']) + ((float)($it['bonus_qty_carton'] ?? 0) * $packing) + (float)($it['bonus_qty_pcs'] ?? 0);
                    $item->stock_1 = ($item->stock_1 ?? 0) - $totalReturnPcs;
                    $item->save();
                }
            }

            // ─────────────────────────────────────────────────────────────────────────────
            // Update Purchase Status & Financials
            // ─────────────────────────────────────────────────────────────────────────────
            $this->updatePurchaseStatusAndBalance($request->original_invoice);

            if ($request->paid_amount > 0) {
                $count = Payment::where('type', 'RECEIPT')->count() + 1;
                $voucherNo = 'CRV-' . str_pad($count, 4, '0', STR_PAD_LEFT);

                Payment::create([
                    'date' => $request->date,
                    'voucher_no' => $voucherNo,
                    'account_id' => $request->supplier_id,
                    'payment_account_id' => null,
                    'amount' => $request->paid_amount,
                    'net_amount' => $request->paid_amount,
                    'type' => 'RECEIPT',
                    'remarks' => 'Refund for Purchase Return Invoice: ' . ($request->invoice ?? 'N/A'),
                    'payment_method' => 'Cash',
                    'cheque_status' => 'Refund',
                ]);
            }

            DB::commit();
            return redirect()->route('purchase_return.index')->with('success', 'Purchase Return saved successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    /**
     * Update Purchase Status and Balance after Return
     */
    private function updatePurchaseStatusAndBalance($invoiceNo)
    {
        if (!$invoiceNo) return;
        
        $purchase = Purchase::where('invoice', $invoiceNo)->first();
        if ($purchase) {
            // Calculate Total Returns for this invoice
            $totalReturns = PurchaseReturn::where('original_invoice', $invoiceNo)->sum('net_total');
            
            // Calculate Total Payments for this invoice
            $totalPayments = PaymentAllocation::where('bill_id', $purchase->id)
                ->where('bill_type', 'App\Models\Purchase')
                ->sum('amount');

            // Remaining = Net - (Payments + Returns)
            $purchase->remaining_amount = $purchase->net_total - ($totalPayments + $totalReturns);
            
            // Status Logic
            if ($totalReturns >= $purchase->net_total) {
                $purchase->status = 'Returned';
            } elseif ($totalReturns > 0) {
                $purchase->status = 'Partial Return';
            } else {
                $purchase->status = 'Active';
            }
            
            $purchase->save();
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
                    $packing = (float)($item->packing_full ?? 1);
                    $totalRevertPcs = (float)($oldItem->total_pcs) + ((float)($oldItem->bonus_qty_carton ?? 0) * $packing) + (float)($oldItem->bonus_qty_pcs ?? 0);
                    $item->stock_1 = ($item->stock_1 ?? 0) + $totalRevertPcs;
                    $item->save();
                }
            }

            // 2. Revert Original Invoice Balance & Status
            $this->updatePurchaseStatusAndBalance($oldOriginalInvoice);

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
                'tax_total'       => 0,
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
                    'bonus_qty_carton' => $it['bonus_qty_carton'] ?? 0,
                    'bonus_qty_pcs'    => $it['bonus_qty_pcs'] ?? 0,
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'] ?? 0,
                    'gst_amount'  => 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Update Stock (Decrease for Purchase Return)
                $item = Items::find($it['item_id']);
                if ($item) {
                    $packing = (float)($item->packing_full ?? 1);
                    $totalReturnPcs = (float)($it['total_pcs']) + ((float)($it['bonus_qty_carton'] ?? 0) * $packing) + (float)($it['bonus_qty_pcs'] ?? 0);
                    $item->stock_1 = ($item->stock_1 ?? 0) - $totalReturnPcs;
                    $item->save();
                }
            }

            // 5. Update New Original Invoice Balance & Status
            $this->updatePurchaseStatusAndBalance($request->original_invoice);

            // 6. Sync Refund Payment
            $refundPayment = Payment::where('remarks', 'like', "%Refund for Purchase Return Invoice: {$return->invoice}%")
                ->where('account_id', $return->supplier_id)
                ->first();

            if ($request->paid_amount > 0) {
                if ($refundPayment) {
                    $refundPayment->update([
                        'amount' => $request->paid_amount,
                        'net_amount' => $request->paid_amount,
                        'date' => $request->date,
                        'cheque_status' => 'Refund',
                    ]);
                } else {
                    $count = Payment::where('type', 'RECEIPT')->count() + 1;
                    $voucherNo = 'CRV-' . str_pad($count, 4, '0', STR_PAD_LEFT);
                    Payment::create([
                        'date' => $request->date,
                        'voucher_no' => $voucherNo,
                        'account_id' => $request->supplier_id,
                        'payment_account_id' => null,
                        'amount' => $request->paid_amount,
                        'net_amount' => $request->paid_amount,
                        'type' => 'RECEIPT',
                        'remarks' => 'Refund for Purchase Return Invoice: ' . ($return->invoice ?? 'N/A'),
                        'payment_method' => 'Cash',
                        'cheque_status' => 'Refund',
                    ]);
                }
            } elseif ($refundPayment) {
                // If paid_amount is now 0, cancel the old refund
                $refundPayment->update(['cheque_status' => 'Canceled']);
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

            // 2. Revert Stock for Items
            $returnItems = PurchaseReturnItem::where('purchase_return_id', $id)->get();
            foreach ($returnItems as $ri) {
                $item = Items::find($ri->item_id);
                if ($item) {
                    $packing = (float)($item->packing_full ?? 1);
                    $totalRevertPcs = (float)($ri->total_pcs) + ((float)($ri->bonus_qty_carton ?? 0) * $packing) + (float)($ri->bonus_qty_pcs ?? 0);
                    $item->stock_1 = ($item->stock_1 ?? 0) + $totalRevertPcs;
                    $item->save();
                }
            }

            // 3. Revert Original Invoice Balance & Status
            $this->updatePurchaseStatusAndBalance($originalInvoice);

            // 4. Sync Refund Payment (Cancel it)
            $refundPayment = Payment::where('remarks', 'like', "%Refund for Purchase Return Invoice: {$return->invoice}%")
                ->where('account_id', $return->supplier_id)
                ->first();

            if ($refundPayment) {
                $refundPayment->update(['cheque_status' => 'Canceled']);
            }

            // 5. Delete Return Items & Return
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
