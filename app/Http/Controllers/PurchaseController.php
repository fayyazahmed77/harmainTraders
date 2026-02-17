<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Items;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\Purchase;
use App\Models\PurchaseItem;
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
        $accounts = Account::with('accountType')
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

        return Inertia::render("daily/purchase/create", [
            'items' => $items,
            'accounts' => $accounts,
            'salemans' => $salemans,
            'nextInvoiceNo' => $nextInvoiceNo,
            'messageLines' => $messageLines,
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
            'tax_total'       => 'required|numeric',
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
        ]);

        DB::beginTransaction();

        try {

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
                'paid_amount'     => $request->paid_amount,
                'remaining_amount' => $request->remaining_amount,
                'status'          => 'Completed',
                'message_line_id' => $request->message_line_id,
            ]);

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

                // Increase Stock
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) + $it['total_pcs'];
                    $item->save();
                }
            }

            DB::commit();

            if ($request->has('print_format') && in_array($request->print_format, ['big', 'small'])) {
                return redirect()->route('purchase.index')
                    ->with('success', 'Purchase saved successfully!')
                    ->with('pdf_url', route('purchase.pdf', ['id' => $purchase->id, 'format' => $request->print_format]));
            }

            return redirect()->route('purchase.index')->with('success', 'Purchase saved successfully!');
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
        $accounts = Account::get();
        $salemans = Saleman::get();
        $messageLines = \App\Models\MessageLine::where('category', 'Purchase')
            ->where('status', 'active')
            ->get();

        return Inertia::render("daily/purchase/edit", [
            'purchase' => $purchase,
            'items' => $items,
            'accounts' => $accounts,
            'salemans' => $salemans,
            'messageLines' => $messageLines,
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
            'tax_total'       => 'required|numeric',
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
        ]);

        DB::beginTransaction();

        try {
            $purchase = Purchase::find($id);
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
                'paid_amount'     => $request->paid_amount,
                'remaining_amount' => $request->remaining_amount,
                'status'          => $request->status ?? $purchase->status,
                'message_line_id' => $request->message_line_id,
            ]);

            // Revert Stock for old items
            $oldItems = PurchaseItem::where('purchase_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $item = Items::find($oldItem->item_id);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) - $oldItem->total_pcs;
                    $item->save();
                }
            }

            // Delete old items
            PurchaseItem::where('purchase_id', $id)->delete();

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

                // Increase Stock
                $item = Items::find($it['item_id']);
                if ($item) {
                    $item->stock_1 = ($item->stock_1 ?? 0) + $it['total_pcs'];
                    $item->save();
                }
            }

            DB::commit();
            return redirect()->route('purchase.index')->with('success', 'Purchase updated successfully!');
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


        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.purchasehalf' : 'pdf.purchase';

        $pdf = Pdf::loadView($view, compact('purchase'));

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
            ->where('purchase_items.item_id', $itemId)
            ->orderBy('purchases.created_at', 'desc')
            ->select(
                'purchase_items.qty_carton as previous_qty_carton',
                'purchase_items.qty_pcs as previous_qty_pcs',
                'purchase_items.total_pcs as previous_total_pcs',
                'purchase_items.trade_price as previous_retail_price',
                'items.stock_1 as current_stock',
                'items.company',
                'items.retail',
                'items.trade_price',
                'purchases.created_at as last_purchase_date'
            )
            ->first();

        if ($lastPurchase) {
            // Calculate average price (between trade price and retail)
            $tradePrice = floatval($lastPurchase->trade_price ?? 0);
            $retailPrice = floatval($lastPurchase->retail ?? 0);
            $lastPurchase->average_price = ($tradePrice + $retailPrice) / 2;
        }

        return response()->json($lastPurchase);
    }
}
