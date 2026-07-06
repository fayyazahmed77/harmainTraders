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

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SalesReturnController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view returns', only: ['index', 'show']),
            new Middleware('permission:create returns', only: ['create', 'store']),
            new Middleware('permission:edit returns', only: ['edit', 'update']),
            new Middleware('permission:delete returns', only: ['destroy']),
        ];
    }
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

        // Suggest next return invoice number (final sequential ID is generated at save time)
        $nextInvoiceNo = $this->generateNextReturnInvoice();

        // Payment accounts for refunds
        $paymentAccounts = Account::whereHas('accountType', function($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque In Hand']);
        })->get(['id', 'title', 'code']);

        return Inertia::render("daily/sales_return/create", [
            'accounts'        => $accounts,
            'salemans'        => $salemans,
            'messageLines'    => $messageLines,
            'nextInvoiceNo'   => $nextInvoiceNo,
            'paymentAccounts' => $paymentAccounts,
        ]);
    }

    //store
    public function store(Request $request)
    {
        try {
            $request->validate([
                'date'            => 'required|date',
                'invoice'         => 'nullable|string',
                'original_invoice' => 'required|string|exists:sales,invoice',
                'customer_id'     => 'required|integer',
                'no_of_items'     => 'required|integer',
                'gross_total'     => 'required|numeric',
                'discount_total'  => 'required|numeric',
                'tax_total'       => 'required|numeric',
                'net_total'       => 'required|numeric',
                'paid_amount'     => 'required|numeric',
                'remaining_amount' => 'required|numeric',
                'payment_account_id' => 'nullable|integer|exists:accounts,id',
                'sale_id'         => 'nullable|integer|exists:sales,id',

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
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('SalesReturn validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            throw $e;
        }

        $sale = null;
        if ($request->filled('sale_id')) {
            $sale = Sales::find($request->sale_id);
        }
        if (!$sale) {
            $sale = Sales::where('invoice', $request->original_invoice)
                ->where('customer_id', $request->customer_id)
                ->first();
        }
        if (!$sale) {
            $sale = Sales::where('invoice', $request->original_invoice)->first();
        }

        if (!$sale) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original invoice does not exist.'
            ]);
        }
        if ($sale->customer_id != $request->customer_id) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The original invoice does not belong to the selected customer.'
            ]);
        }
        if ($sale->status === 'Canceled') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original invoice has been canceled and cannot be returned.'
            ]);
        }

        $liveReturned = SalesReturn::where('sale_id', $sale->id)->sum('net_total');
        $maxReturnable = max(0, $sale->net_total - $liveReturned);

        if (round($request->net_total, 2) > round($maxReturnable, 2) + 0.01) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'net_total' => 'Return amount (' . number_format($request->net_total, 2) . ') cannot exceed returnable balance (' . number_format($maxReturnable, 2) . '). Already returned: ' . number_format($liveReturned, 2) . '.'
            ]);
        }

        // Validate item quantities and ensure they don't return more than purchased
        foreach ($request->items as $it) {
            if ($it['qty_carton'] < 0 || $it['qty_pcs'] < 0 || $it['total_pcs'] < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantities cannot be negative.'
                ]);
            }
            
            // Fetch original sales item
            $saleItem = \App\Models\SalesItem::where('sale_id', $sale->id)
                ->where('item_id', $it['item_id'])
                ->first();
            if (!$saleItem) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Item was not purchased on the original invoice.'
                ]);
            }

            // Calculate already returned pieces for this item on this sale
            $alreadyReturnedPcs = \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                ->where('sales_returns.sale_id', $sale->id)
                ->where('sales_return_items.item_id', $it['item_id'])
                ->sum('sales_return_items.total_pcs');
            
            $item = Items::find($it['item_id']);
            $packing = $item->packing_qty ?: 1;
            $bonusUnits = (($it['bonus_qty_carton'] ?? 0) * $packing) + ($it['bonus_qty_pcs'] ?? 0);
            $totalToReturn = $it['total_pcs'] + $bonusUnits;

            $maxReturnableQty = $saleItem->total_pcs - $alreadyReturnedPcs;

            if ($totalToReturn > $maxReturnableQty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantity for item ' . $item->title . ' (' . $totalToReturn . ' Pcs) exceeds returnable limit (' . $maxReturnableQty . ' Pcs).'
                ]);
            }
        }

        DB::beginTransaction();

        try {
            // Generate sequential invoice number inside the transaction to prevent duplicates
            $finalInvoice = $request->invoice ?? $this->generateNextReturnInvoice();

            $return = SalesReturn::create([
                'date'            => $request->date,
                'invoice'         => $finalInvoice,
                'original_invoice' => $request->original_invoice,
                'sale_id'         => $sale->id,
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
                    'bonus_qty_carton' => $it['bonus_qty_carton'] ?? 0,
                    'bonus_qty_pcs'    => $it['bonus_qty_pcs'] ?? 0,
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'] ?? 0,
                    'gst_amount'  => $it['gst_amount'] ?? 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // INCREASE Stock for Returns
                $item = Items::find($it['item_id']);
                if ($item) {
                    $packing = $item->packing_qty ?: 1;
                    $bonusUnits = (($it['bonus_qty_carton'] ?? 0) * $packing) + ($it['bonus_qty_pcs'] ?? 0);
                    $totalToReturn = $it['total_pcs'] + $bonusUnits;
                    $item->updateStockFromPcs($item->total_stock_pcs + $totalToReturn);
                }
            }

            // Allocate return value using the FIFO Allocation engine
            $allocationService = new \App\Services\FIFOAllocationService();
            $allocationService->allocate($return, (float)$return->net_total);

            // Log activity
            \App\Services\ActivityLogger::log('created', 'Sales Return', "Created sales return {$finalInvoice} for customer ID {$request->customer_id}");

            DB::commit();
            return redirect()->back()->with('success', 'Sales Return saved successfully!')->with('id', $return->id);
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
                ->unique('invoice')
                ->values()
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
            /** @var \App\Models\Sales|null $sale */
            $sale = Sales::with('items.item')->find($invoiceId);
            if (!$sale) {
                return response()->json(['error' => 'Invoice not found'], 404);
            }

            $items = $sale->items->map(function ($saleItem) use ($sale) {
                $alreadyReturnedPcs = \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                    ->where('sales_returns.sale_id', $sale->id)
                    ->where('sales_return_items.item_id', $saleItem->item_id)
                    ->sum('sales_return_items.total_pcs');

                return [
                    'item_id'              => $saleItem->item_id,
                    'item'                 => $saleItem->item,
                    'qty_carton'           => $saleItem->qty_carton,
                    'qty_pcs'              => $saleItem->qty_pcs,
                    'total_pcs'            => $saleItem->total_pcs,
                    'already_returned_pcs' => (int) $alreadyReturnedPcs,
                    'returnable_pcs'       => max(0, $saleItem->total_pcs - (int) $alreadyReturnedPcs),
                    'trade_price'          => $saleItem->trade_price, // exact price from sale
                    'discount'             => $saleItem->discount,
                    'gst_amount'           => $saleItem->gst_amount,
                    'subtotal'             => $saleItem->subtotal,
                    'bonus_carton'         => $saleItem->bonus_qty_carton,
                    'bonus_pcs'            => $saleItem->bonus_qty_pcs,
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

            $purchasedItems = SalesItem::select('sales_items.*')
                ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
                ->whereIn('sales_items.sale_id', $sales)
                ->orderBy('sales.date', 'desc')
                ->orderBy('sales.id', 'desc')
                ->with(['item', 'sale:id,invoice,date'])
                ->get()
                ->map(function ($si) {
                    $alreadyReturnedPcs = \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                        ->where('sales_returns.sale_id', $si->sale_id)
                        ->where('sales_return_items.item_id', $si->item_id)
                        ->sum('sales_return_items.total_pcs');

                    return [
                        'id'               => $si->id,
                        'sale_id'          => $si->sale_id,
                        'item_id'          => $si->item_id,
                        'item'             => $si->item,
                        'invoice_no'       => $si->sale->invoice ?? 'N/A',
                        'date'             => $si->sale->date ?? 'N/A',
                        'qty_carton'       => $si->qty_carton,
                        'qty_pcs'          => $si->qty_pcs,
                        'total_pcs'        => $si->total_pcs,
                        'already_returned_pcs' => (int) $alreadyReturnedPcs,
                        'returnable_pcs'       => max(0, $si->total_pcs - (int) $alreadyReturnedPcs),
                        'last_trade_price' => $si->trade_price,
                        'gst_amount'       => $si->gst_amount,
                        'discount'         => $si->discount,
                        'bonus_carton'     => $si->bonus_qty_carton,
                        'bonus_pcs'        => $si->bonus_qty_pcs,
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

        // Payment accounts for refunds
        $paymentAccounts = Account::whereHas('accountType', function($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque In Hand']);
        })->get(['id', 'title', 'code']);

        return Inertia::render("daily/sales_return/edit", [
            'returnData'    => $return,
            'accounts'      => $accounts,
            'salemans'      => $salemans,
            'messageLines'  => $messageLines,
            'paymentAccounts' => $paymentAccounts,
        ]);
    }

    //update
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'date'            => 'required|date',
                'invoice'         => 'required|string',
                'original_invoice' => 'required|string|exists:sales,invoice',
                'customer_id'     => 'required|integer',
                'no_of_items'     => 'required|integer',
                'gross_total'     => 'required|numeric',
                'discount_total'  => 'required|numeric',
                'tax_total'       => 'required|numeric',
                'net_total'       => 'required|numeric',
                'items'           => 'required|array',
                'sale_id'         => 'nullable|integer|exists:sales,id',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('SalesReturn update validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            throw $e;
        }

        $newSale = null;
        if ($request->filled('sale_id')) {
            $newSale = Sales::find($request->sale_id);
        }
        if (!$newSale) {
            $newSale = Sales::where('invoice', $request->original_invoice)
                ->where('customer_id', $request->customer_id)
                ->first();
        }
        if (!$newSale) {
            $newSale = Sales::where('invoice', $request->original_invoice)->first();
        }

        if (!$newSale) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original invoice does not exist.'
            ]);
        }
        if ($newSale->customer_id != $request->customer_id) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The original invoice does not belong to the selected customer.'
            ]);
        }

        $return = SalesReturn::findOrFail($id);
        $oldOriginalInvoice = $return->original_invoice;
        $oldSaleId = $return->sale_id;

        if ($newSale->status === 'Canceled') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original invoice has been canceled and cannot be returned.'
            ]);
        }

        $liveReturned = SalesReturn::where('sale_id', $newSale->id)->where('id', '!=', $id)->sum('net_total');
        $maxReturnable = max(0, $newSale->net_total - $liveReturned);

        if (round($request->net_total, 2) > round($maxReturnable, 2) + 0.01) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'net_total' => 'Return amount (' . number_format($request->net_total, 2) . ') cannot exceed returnable balance (' . number_format($maxReturnable, 2) . ').'
            ]);
        }

        // Validate item quantities and ensure they don't return more than purchased
        foreach ($request->items as $it) {
            if ($it['qty_carton'] < 0 || $it['qty_pcs'] < 0 || $it['total_pcs'] < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantities cannot be negative.'
                ]);
            }
            
            // Fetch original sales item
            $saleItem = \App\Models\SalesItem::where('sale_id', $newSale->id)
                ->where('item_id', $it['item_id'])
                ->first();
            if (!$saleItem) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Item was not purchased on the original invoice.'
                ]);
            }

            // Calculate already returned pieces for this item on this sale (excluding current return)
            $alreadyReturnedPcs = \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                ->where('sales_returns.sale_id', $newSale->id)
                ->where('sales_return_items.sales_return_id', '!=', $id)
                ->where('sales_return_items.item_id', $it['item_id'])
                ->sum('sales_return_items.total_pcs');
            
            $item = Items::find($it['item_id']);
            $packing = $item->packing_qty ?: 1;
            $bonusUnits = (($it['bonus_qty_carton'] ?? 0) * $packing) + ($it['bonus_qty_pcs'] ?? 0);
            $totalToReturn = $it['total_pcs'] + $bonusUnits;

            $maxReturnableQty = $saleItem->total_pcs - $alreadyReturnedPcs;

            if ($totalToReturn > $maxReturnableQty) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantity for item ' . $item->title . ' (' . $totalToReturn . ' Pcs) exceeds returnable limit (' . $maxReturnableQty . ' Pcs).'
                ]);
            }
        }

        DB::beginTransaction();

        try {
            $allocationService = new \App\Services\FIFOAllocationService();
            // Rollback old allocations and credit notes
            $allocationService->rollback($return);

            // 1. Revert Stock for Old Items
            $oldItems = SalesReturnItem::where('sales_return_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $item = Items::find($oldItem->item_id);
                if ($item) {
                    $packing = $item->packing_qty ?: 1;
                    $bonusUnits = (($oldItem->bonus_qty_carton ?? 0) * $packing) + ($oldItem->bonus_qty_pcs ?? 0);
                    $totalToRevert = $oldItem->total_pcs + $bonusUnits;
                    $item->updateStockFromPcs(max(0, $item->total_stock_pcs - $totalToRevert));
                }
            }

            // 2. Update Return Record
            $return->update([
                'date'            => $request->date,
                'invoice'         => $request->invoice,
                'original_invoice' => $request->original_invoice,
                'sale_id'         => $newSale->id,
                'customer_id'     => $request->customer_id,
                'salesman_id'     => $request->salesman_id ?? 0,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => $request->tax_total,
                'net_total'       => $request->net_total,
                'remarks'         => $request->remarks,
            ]);

            // 3. Delete Old Items & Insert New Ones
            SalesReturnItem::where('sales_return_id', $id)->delete();

            foreach ($request->items as $it) {
                $return->items()->create([
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'bonus_qty_carton' => $it['bonus_qty_carton'] ?? 0,
                    'bonus_qty_pcs'    => $it['bonus_qty_pcs'] ?? 0,
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'] ?? 0,
                    'gst_amount'  => $it['gst_amount'] ?? 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Update Stock (Increase for Return)
                $item = Items::find($it['item_id']);
                if ($item) {
                    $packing = $item->packing_qty ?: 1;
                    $bonusUnits = (($it['bonus_qty_carton'] ?? 0) * $packing) + ($it['bonus_qty_pcs'] ?? 0);
                    $totalToAdd = $it['total_pcs'] + $bonusUnits;
                    $item->updateStockFromPcs($item->total_stock_pcs + $totalToAdd);
                }
            }

            // 4. Run FIFO allocation again
            $allocationService->allocate($return, (float)$return->net_total);

            // Log activity
            \App\Services\ActivityLogger::log('updated', 'Sales Return', "Updated sales return {$return->invoice}");

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
            $originalInvoice = $return->original_invoice;
            $saleId = $return->sale_id;

            $allocationService = new \App\Services\FIFOAllocationService();
            // Rollback return allocations and credit notes
            $allocationService->rollback($return);

            // 1. Revert Stock (Decrease because return added stock)
            $items = SalesReturnItem::where('sales_return_id', $id)->get();
            foreach ($items as $si) {
                $product = Items::find($si->item_id);
                if ($product) {
                    $packing = $product->packing_qty ?: 1;
                    $bonusUnits = (($si->bonus_qty_carton ?? 0) * $packing) + ($si->bonus_qty_pcs ?? 0);
                    $totalToRevert = $si->total_pcs + $bonusUnits;
                    $product->updateStockFromPcs(max(0, $product->total_stock_pcs - $totalToRevert));
                }
            }

            // 2. Delete Return Items & Return record
            SalesReturnItem::where('sales_return_id', $id)->delete();
            $return->delete();

            // Log activity
            \App\Services\ActivityLogger::log('deleted', 'Sales Return', "Deleted sales return {$return->invoice}");

            // 3. Recalculate Balance and Status for the Invoice
            $this->updateSaleStatusAndBalance($originalInvoice, $saleId);

            DB::commit();
            return redirect()->back()->with('success', 'Sales Return deleted and stock/balances reverted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function pdf(Request $request, $id)
    {
        $salesReturn = SalesReturn::with(['customer', 'salesman', 'items.item'])->findOrFail($id);
        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.sales_return_half' : 'pdf.sales_return';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, compact('salesReturn'));

        if ($format === 'small') {
            $pdf->setPaper([0, 0, 226.77, 600], 'portrait');
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->stream("Sales-Return-{$salesReturn->invoice}.pdf");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * B5 Fix: Generate a sequential return invoice number using MySQL advisory lock
     * to prevent race conditions when multiple users create returns simultaneously.
     */
    private function generateNextReturnInvoice(): string
    {
        $lastReturn = SalesReturn::orderByDesc('id')->lockForUpdate()->first();
        $nextId = $lastReturn ? ($lastReturn->id + 1) : 1;
        return 'RET-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);
    }

    /**
     * B4 Fix: Generate a sequential voucher number using SELECT MAX(id) inside
     * the current DB transaction. lockForUpdate() on Payment table ensures
     * no two concurrent requests can generate the same voucher number.
     *
     * @param string $prefix e.g. 'CPV' → CPV-0001
     */
    private function generateNextVoucherNo(string $prefix): string
    {
        // Lock the latest payment for this prefix within the current transaction
        $last = Payment::where('voucher_no', 'LIKE', $prefix . '-%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('voucher_no');

        $nextNum = 1;
        if ($last && preg_match('/' . preg_quote($prefix, '/') . '-(\d+)/', $last, $matches)) {
            $nextNum = (int)$matches[1] + 1;
        }

        return $prefix . '-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Recalculate Sale Remaining Amount and Status based on all allocations and returns
     */
    private function updateSaleStatusAndBalance($invoiceNo, ?int $saleId = null)
    {
        if (!$invoiceNo && !$saleId) return;

        $sale = $saleId ? Sales::find($saleId) : Sales::where('invoice', $invoiceNo)->first();
        if ($sale) {
            // Calculate Total Returns for this invoice from allocations
            $totalReturns = \App\Models\SalesReturnAllocation::where('sale_id', $sale->id)->sum('amount');

            // Calculate Total Payments for this invoice
            $totalPayments = \App\Models\PaymentAllocation::where('bill_id', $sale->id)
                ->where('bill_type', 'App\Models\Sales')
                ->sum('amount');

            // Recalculate remaining balance
            $sale->remaining_amount = max(0, $sale->net_total - ($totalPayments + $totalReturns));

            // Determine status based on returned quantity vs sold quantity
            $totalSoldQty = \App\Models\SalesItem::where('sale_id', $sale->id)->sum('total_pcs');
            $allReturnIds = SalesReturn::where('sale_id', $sale->id)->pluck('id');
            $totalReturnedQty = \App\Models\SalesReturnItem::whereIn('sales_return_id', $allReturnIds)->sum('total_pcs');

            if ($totalReturnedQty >= $totalSoldQty && $totalSoldQty > 0) {
                $sale->status = 'Returned';
            } elseif ($totalReturnedQty > 0) {
                if ($sale->remaining_amount <= 0) {
                    $sale->status = ($totalReturns >= $sale->net_total) ? 'Returned' : 'Paid';
                } else {
                    $sale->status = 'Partial Return';
                }
            } elseif ($sale->remaining_amount <= 0) {
                $sale->status = 'Paid';
            } elseif ($totalPayments > 0) {
                $sale->status = 'Partial';
            } else {
                $sale->status = 'Completed';
            }

            $sale->save();
        }
    }
}

