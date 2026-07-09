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

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PurchaseReturnController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view purchase returns', only: ['index', 'show', 'pdf', 'getSupplierInvoices', 'getInvoiceItems', 'getSupplierPurchasedItems']),
            new Middleware('permission:create purchase returns', only: ['create', 'store']),
            new Middleware('permission:edit purchase returns', only: ['edit', 'update']),
            new Middleware('permission:delete purchase returns', only: ['destroy']),
        ];
    }
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
            'extra_discount'  => 'nullable|numeric|min:0',
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

        $purchase = \App\Models\Purchase::where('invoice', $request->original_invoice)->first();
        if (!$purchase) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original purchase invoice does not exist.'
            ]);
        }

        // Validate item quantities and ensure they don't return more than purchased
        foreach ($request->items as $it) {
            if ($it['qty_carton'] < 0 || $it['qty_pcs'] < 0 || $it['total_pcs'] < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantities cannot be negative.'
                ]);
            }
            
            // Fetch original purchase item
            $purchaseItem = \App\Models\PurchaseItem::where('purchase_id', $purchase->id)
                ->where('item_id', $it['item_id'])
                ->first();
            if (!$purchaseItem) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Item was not purchased on the original purchase invoice.'
                ]);
            }

            // Calculate already returned pieces for this item on this purchase
            $alreadyReturnedPcs = \App\Models\PurchaseReturnItem::join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
                ->where('purchase_returns.original_invoice', $purchase->invoice)
                ->where('purchase_return_items.item_id', $it['item_id'])
                ->sum('purchase_return_items.total_pcs');
            
            $item = Items::find($it['item_id']);
            $packing = $item->packing_qty ?: 1;
            $bonusUnits = (($it['bonus_qty_carton'] ?? 0) * $packing) + ($it['bonus_qty_pcs'] ?? 0);
            $totalToReturn = $it['total_pcs'] + $bonusUnits;

            $maxReturnableQty = $purchaseItem->total_pcs - $alreadyReturnedPcs;

            if ($totalToReturn > $maxReturnableQty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantity for item ' . $item->title . ' (' . $totalToReturn . ' Pcs) exceeds returnable limit (' . $maxReturnableQty . ' Pcs).'
                ]);
            }
        }

        DB::beginTransaction();

        try {
            $supplier = Account::findOrFail($request->supplier_id);
            $previousBalance = (float)$supplier->current_balance;

            $extraDiscount = (float)($request->extra_discount ?? 0);
            if ($extraDiscount > $request->net_total) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'extra_discount' => 'Extra discount cannot exceed return total.'
                ]);
            }

            $return = PurchaseReturn::create([
                'date'            => $request->date,
                'invoice'         => $request->invoice ?? 'PRET-' . time(),
                'original_invoice' => $request->original_invoice,
                'supplier_id'     => $request->supplier_id,
                'previous_balance' => $previousBalance,
                'salesman_id'     => $request->salesman_id ?: null,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => 0,
                'net_total'       => $request->net_total,
                'extra_discount'  => $extraDiscount,
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
                    $packing = (float)($item->packing_qty ?? 1);
                    $totalReturnPcs = (float)($it['total_pcs']) + ((float)($it['bonus_qty_carton'] ?? 0) * $packing) + (float)($it['bonus_qty_pcs'] ?? 0);
                    $item->updateStockFromPcs($item->total_stock_pcs - $totalReturnPcs);
                }
            }

            $allocationService = new \App\Services\FIFOAllocationService();
            $allocationService->allocatePurchaseReturn($return, (float)($return->net_total - $return->extra_discount) - (float)$return->paid_amount);

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

            // Log activity
            \App\Services\ActivityLogger::log('created', 'Purchase Return', "Created purchase return {$return->invoice} for supplier ID {$request->supplier_id}");

            DB::commit();
            return redirect()->back()->with('success', 'Purchase Return saved successfully!')->with('id', $return->id);
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
            // Calculate Total Returns for this invoice from allocations
            $totalReturns = \App\Models\PurchaseReturnAllocation::where('purchase_id', $purchase->id)->sum('amount');
            
            // Calculate Total Payments for this invoice
            $totalPayments = PaymentAllocation::where('bill_id', $purchase->id)
                ->where('bill_type', 'App\Models\Purchase')
                ->sum('amount');

            // Remaining = Net - (Payments + Returns)
            $purchase->remaining_amount = max(0, $purchase->net_total - ($totalPayments + $totalReturns));
            
            // Status Logic
            if ($purchase->remaining_amount <= 0.005) {
                $purchase->status = ($totalReturns >= $purchase->net_total) ? 'Returned' : 'Paid';
            } elseif ($totalReturns > 0) {
                $purchase->status = 'Partial Return';
            } elseif ($totalPayments > 0) {
                $purchase->status = 'Partial';
            } else {
                $purchase->status = 'Completed';
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
                ->unique('invoice')
                ->values()
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
            /** @var \App\Models\Purchase|null $purchase */
            $purchase = Purchase::with('items.item')->find($invoiceId);
            if (!$purchase) {
                return response()->json(['error' => 'Invoice not found'], 404);
            }

            $items = $purchase->items->map(function ($pi) use ($purchase) {
                $alreadyReturnedPcs = \App\Models\PurchaseReturnItem::join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
                    ->where('purchase_returns.original_invoice', $purchase->invoice)
                    ->where('purchase_return_items.item_id', $pi->item_id)
                    ->sum('purchase_return_items.total_pcs');

                return [
                    'item_id'              => $pi->item_id,
                    'item'                 => $pi->item,
                    'qty_carton'           => $pi->qty_carton,
                    'qty_pcs'              => $pi->qty_pcs,
                    'total_pcs'            => $pi->total_pcs,
                    'already_returned_pcs' => (int) $alreadyReturnedPcs,
                    'returnable_pcs'       => max(0, $pi->total_pcs - (int) $alreadyReturnedPcs),
                    'trade_price'          => $pi->trade_price,
                    'discount'             => $pi->discount,
                    'gst_amount'           => $pi->gst_amount,
                    'subtotal'             => $pi->subtotal,
                    'bonus_carton'         => $pi->bonus_qty_carton,
                    'bonus_pcs'            => $pi->bonus_qty_pcs,
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

            $purchasedItems = \App\Models\PurchaseItem::select('purchase_items.*')
                ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
                ->whereIn('purchase_items.purchase_id', $purchases)
                ->orderBy('purchases.date', 'desc')
                ->orderBy('purchases.id', 'desc')
                ->with(['item', 'purchase:id,invoice,date'])
                ->get()
                ->map(function ($pi) {
                    $alreadyReturnedPcs = \App\Models\PurchaseReturnItem::join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
                        ->where('purchase_returns.original_invoice', $pi->purchase->invoice)
                        ->where('purchase_return_items.item_id', $pi->item_id)
                        ->sum('purchase_return_items.total_pcs');

                    return [
                        'id'               => $pi->id,
                        'purchase_id'      => $pi->purchase_id,
                        'item_id'          => $pi->item_id,
                        'item'             => $pi->item,
                        'invoice_no'       => $pi->purchase->invoice ?? 'N/A',
                        'date'             => $pi->purchase->date ?? 'N/A',
                        'qty_carton'       => $pi->qty_carton,
                        'qty_pcs'          => $pi->qty_pcs,
                        'total_pcs'        => $pi->total_pcs,
                        'already_returned_pcs' => (int) $alreadyReturnedPcs,
                        'returnable_pcs'       => max(0, $pi->total_pcs - (int) $alreadyReturnedPcs),
                        'last_trade_price' => $pi->trade_price,
                        'gst_amount'       => $pi->gst_amount,
                        'discount'         => $pi->discount,
                        'bonus_carton'     => $pi->bonus_qty_carton,
                        'bonus_pcs'        => $pi->bonus_qty_pcs,
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
            'extra_discount'  => 'nullable|numeric|min:0',
        ]);

        $purchase = \App\Models\Purchase::where('invoice', $request->original_invoice)->first();
        if (!$purchase) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original purchase invoice does not exist.'
            ]);
        }

        // Validate item quantities and ensure they don't return more than purchased
        foreach ($request->items as $it) {
            if ($it['qty_carton'] < 0 || $it['qty_pcs'] < 0 || $it['total_pcs'] < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantities cannot be negative.'
                ]);
            }
            
            // Fetch original purchase item
            $purchaseItem = \App\Models\PurchaseItem::where('purchase_id', $purchase->id)
                ->where('item_id', $it['item_id'])
                ->first();
            if (!$purchaseItem) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Item was not purchased on the original purchase invoice.'
                ]);
            }

            // Calculate already returned pieces (excluding this return instance)
            $alreadyReturnedPcs = \App\Models\PurchaseReturnItem::join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
                ->where('purchase_returns.original_invoice', $purchase->invoice)
                ->where('purchase_returns.id', '!=', $id) // Exclude current return
                ->where('purchase_return_items.item_id', $it['item_id'])
                ->sum('purchase_return_items.total_pcs');
            
            $item = Items::find($it['item_id']);
            $packing = $item->packing_qty ?: 1;
            $bonusUnits = (($it['bonus_qty_carton'] ?? 0) * $packing) + ($it['bonus_qty_pcs'] ?? 0);
            $totalToReturn = $it['total_pcs'] + $bonusUnits;

            $maxReturnableQty = $purchaseItem->total_pcs - $alreadyReturnedPcs;

            if ($totalToReturn > $maxReturnableQty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantity for item ' . $item->title . ' (' . $totalToReturn . ' Pcs) exceeds returnable limit (' . $maxReturnableQty . ' Pcs).'
                ]);
            }
        }

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
                    $packing = (float)($item->packing_qty ?? 1);
                    $totalRevertPcs = (float)($oldItem->total_pcs) + ((float)($oldItem->bonus_qty_carton ?? 0) * $packing) + (float)($oldItem->bonus_qty_pcs ?? 0);
                    $item->updateStockFromPcs($item->total_stock_pcs + $totalRevertPcs);
                }
            }

            $allocationService = new \App\Services\FIFOAllocationService();
            $allocationService->rollbackPurchaseReturn($return);

            $supplier = Account::findOrFail($request->supplier_id);
            $previousBalance = (float)$supplier->current_balance + (float)($return->net_total - $return->extra_discount);

            $extraDiscount = (float)($request->extra_discount ?? 0);
            if ($extraDiscount > $request->net_total) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'extra_discount' => 'Extra discount cannot exceed return total.'
                ]);
            }

            // 3. Update Return Record
            $return->update([
                'date'            => $request->date,
                'invoice'         => $request->invoice,
                'original_invoice' => $request->original_invoice,
                'supplier_id'     => $request->supplier_id,
                'previous_balance' => $previousBalance,
                'salesman_id'     => $request->salesman_id ?: null,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => 0,
                'net_total'       => $request->net_total,
                'extra_discount'  => $extraDiscount,
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
                    $packing = (float)($item->packing_qty ?? 1);
                    $totalReturnPcs = (float)($it['total_pcs']) + ((float)($it['bonus_qty_carton'] ?? 0) * $packing) + (float)($it['bonus_qty_pcs'] ?? 0);
                    $item->updateStockFromPcs($item->total_stock_pcs - $totalReturnPcs);
                }
            }

            $allocationService->allocatePurchaseReturn($return, (float)($return->net_total - $return->extra_discount) - (float)$request->paid_amount);

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

            \App\Services\ActivityLogger::log('updated', 'Purchase Return', "Updated purchase return {$return->invoice}");
            DB::commit();
            return redirect()->back()->with('success', 'Purchase Return updated successfully!')->with('id', $return->id);
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
                    $packing = (float)($item->packing_qty ?? 1);
                    $totalRevertPcs = (float)($ri->total_pcs) + ((float)($ri->bonus_qty_carton ?? 0) * $packing) + (float)($ri->bonus_qty_pcs ?? 0);
                    $item->updateStockFromPcs($item->total_stock_pcs + $totalRevertPcs);
                }
            }

            $allocationService = new \App\Services\FIFOAllocationService();
            $allocationService->rollbackPurchaseReturn($return);

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

            \App\Services\ActivityLogger::log('deleted', 'Purchase Return', "Deleted purchase return {$return->invoice}");
            DB::commit();
            return redirect()->back()->with('success', 'Purchase Return deleted and stock/balances reverted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function pdf(Request $request, $id)
    {
        $purchaseReturn = PurchaseReturn::with(['supplier', 'salesman', 'items.item'])->findOrFail($id);
        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.purchase_return_half' : 'pdf.purchase_return';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, compact('purchaseReturn'));

        if ($format === 'small') {
            $itemCount = count($purchaseReturn->items);
            $height = 320 + ($itemCount * 16);
            $height = max(280, $height);
            $pdf->setPaper([0, 0, 226.77, $height], 'portrait');
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->stream("Purchase-Return-{$purchaseReturn->invoice}.pdf");
    }
}
