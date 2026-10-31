<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Items;
use App\Models\SupplierOrder;
use App\Models\SupplierOrderItem;
use App\Models\Firm;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SupplierOrderController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view supplier orders|view orders', only: ['list', 'show', 'print']),
            new Middleware('permission:create supplier orders|create orders', only: ['index', 'getItems', 'getAllItems', 'store']),
        ];
    }
    public function index()
    {
        $suppliers = Account::where('type', 6) // Supplier
            ->with(['assignedCompanies' => function($q) {
                $q->withCount('items');
            }])
            ->orderBy('title')
            ->get();

        // Fetch company IDs that have items in purchase_items
        $companyIds = DB::table('purchase_items')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->distinct()
            ->pluck('items.company');

        $companies = Account::where('type', 5) // Company
            ->whereIn('id', $companyIds)
            ->withCount('items')
            ->orderBy('title')
            ->get();

        return Inertia::render('admin/supplier-order/index', [
            'suppliers' => $suppliers,
            'companies' => $companies,
        ]);
    }

    public function getItems(Request $request)
    {
        $request->validate([
            'supplier_id' => 'nullable|exists:accounts,id',
            'selection_id' => 'nullable|exists:accounts,id',
            'selection_mode' => 'nullable|string|in:supplier,company',
            'mode' => 'nullable|string|in:reorder,sales',
            'sales_start_date' => 'nullable|date',
        ]);

        $selectionId = $request->get('selection_id') ?: $request->get('supplier_id');
        $selectionMode = $request->get('selection_mode', 'supplier');
        $mode = $request->get('mode', 'reorder');
        $salesStartDate = $request->get('sales_start_date') ? date('Y-m-d', strtotime($request->sales_start_date)) : now()->subDays(15)->format('Y-m-d');

        if ($selectionMode === 'company') {
            $companyIds = [$selectionId];
        } else {
            $supplier = Account::with('assignedCompanies')->findOrFail($selectionId);
            $companyIds = $supplier->assignedCompanies->pluck('id');
        }

        // Sales in selected period (Aggregated for joining)
        $sales15Agg = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->where('sales.date', '>=', $salesStartDate)
            ->select('item_id', DB::raw('SUM(total_pcs) as total_sales_15'))
            ->groupBy('item_id');

        $query = Items::with(['lastPurchaseItem.purchase.supplier'])
            ->whereIn('items.company', $companyIds)
            ->leftJoinSub($sales15Agg, 's15', 'items.id', '=', 's15.item_id')
            ->select('items.*')
            ->addSelect([
                'sales_15_days' => DB::raw('COALESCE(s15.total_sales_15, 0)')
            ]);

        $items = $query->get();

        // Attach live real-time available balances via StockService
        \App\Services\StockService::attachRealtimeBalances($items);

        if ($mode === 'reorder') {
            // Live Available Stock <= Reorder Level (calculated dynamically)
            $items = $items->filter(function ($item) {
                $packing = max(1, (int) ($item->packing_qty ?: 1));
                $reorderPcs = (float) ($item->reorder_level ?? 0) * $packing;
                $availablePcs = (float) ($item->total_stock_pcs ?? 0);
                return $availablePcs <= $reorderPcs;
            })->values();
        } else {
            // Sales Wise: Show all items with sales in the selected period, ordered by sales descending
            $items = $items->filter(function ($item) {
                return (float) ($item->sales_15_days ?? 0) > 0;
            })->sortByDesc('sales_15_days')->values();
        }

        // Pre-fetch average purchase rates for fast performance
        $itemIds = $items->pluck('id')->toArray();
        $avgPurchaseRates = DB::table('purchase_items')
            ->whereIn('item_id', $itemIds)
            ->select('item_id', DB::raw('AVG(trade_price) as avg_price'))
            ->groupBy('item_id')
            ->pluck('avg_price', 'item_id');

        // Map intelligence data with live available stock
        $itemsWithIntelligence = $items->map(function ($item) use ($avgPurchaseRates) {
            $lastPurchaseItem = $item->lastPurchaseItem;
            $avgPurchaseRate = $avgPurchaseRates[$item->id] ?? null;

            $packing = (int) ($item->packing_qty ?: 1);

            // Live available stock from StockService (handles negative deficits properly)
            $stock1 = (int) ($item->stock_1 ?? 0);
            $stock2 = (int) ($item->stock_2 ?? 0);

            $salesTotal = (int) $item->sales_15_days;
            $salesFull = floor($salesTotal / $packing);
            $salesPcs = $salesTotal % $packing;

            return [
                'id' => $item->id,
                'code' => $item->code,
                'title' => $item->title,
                'packing_qty' => $packing,
                'stock_1' => $stock1, // Live Available Full Cartons
                'stock_2' => $stock2, // Live Available Loose Pcs
                'total_stock_pcs' => (float) ($item->total_stock_pcs ?? 0),
                'reorder_level' => $item->reorder_level,
                
                // Intelligence Data
                'last_purchase_date' => $lastPurchaseItem?->purchase?->date,
                'last_qty_carton' => (int) ($lastPurchaseItem?->qty_carton ?? 0),
                'last_qty_pcs' => (int) ($lastPurchaseItem?->qty_pcs ?? 0),
                'last_purchase_rate' => (float) ($lastPurchaseItem?->trade_price ?? $item->trade_price),
                'av_purchase_rate' => (float) ($avgPurchaseRate ? round($avgPurchaseRate, 2) : $item->trade_price),
                'last_supplier' => $lastPurchaseItem?->purchase?->supplier?->title,
                'sales_15_days' => $salesTotal,
                'sales_15_full' => $salesFull,
                'sales_15_pcs' => $salesPcs,
            ];
        });

        return response()->json([
            'items' => $itemsWithIntelligence
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:accounts,id',
            'order_date' => 'required|string',
            'items' => 'required|array',
            'items.*.id' => 'required|exists:items,id',
        ]);

        $orderId = DB::transaction(function () use ($request) {
            $totalDiscount = 0;
            $totalAmount = 0;

            $order = SupplierOrder::create([
                'order_date' => date('Y-m-d', strtotime($request->order_date)),
                'supplier_id' => $request->supplier_id,
                'status' => 'Pending',
            ]);

            foreach ($request->items as $itemData) {
                $qtyFull = (int) ($itemData['input_full'] ?? 0);
                $qtyPcs = (int) ($itemData['input_pcs'] ?? 0);
                $qtyBFull = (int) ($itemData['input_b_full'] ?? 0);
                $qtyBPcs = (int) ($itemData['input_b_pcs'] ?? 0);
                
                $item = Items::find($itemData['id']);
                $packingQty = $item->packing_qty ?: 1;
                $totalUnits = ($qtyFull * $packingQty) + $qtyPcs;
                
                if ($totalUnits <= 0) continue;

                $rate = (float) ($itemData['last_purchase_rate'] ?? 0);
                $discountPercent = (float) ($itemData['disc_percent'] ?? 0);
                
                $netRate = $rate - ($rate * $discountPercent / 100);
                $pricePerPc = $netRate / $packingQty;
                
                $subtotal = $totalUnits * $pricePerPc;
                
                $discountAmountPerPc = ($rate * $discountPercent / 100) / $packingQty;
                $discountAmount = $discountAmountPerPc * $totalUnits;

                $totalDiscount += $discountAmount;
                $totalAmount += $subtotal;

                SupplierOrderItem::create([
                    'supplier_order_id' => $order->id,
                    'item_id' => $item->id,
                    'qty_full' => $qtyFull,
                    'qty_pcs' => $qtyPcs,
                    'qty_b_full' => $qtyBFull,
                    'qty_b_pcs' => $qtyBPcs,
                    'rate' => $rate,
                    'discount_percent' => $discountPercent,
                    'net_rate' => $netRate,
                    'subtotal' => $subtotal,
                ]);
            }

            $order->update([
                'total_discount' => $totalDiscount,
                'total_amount' => $totalAmount,
            ]);

            return $order->id;
        });

        return response()->json([
            'message' => 'Order created successfully!',
            'order_id' => $orderId
        ]);
    }

    public function getAllItems()
    {
        $items = Items::with(['lastPurchaseItem.purchase.supplier'])->get();

        // Attach live real-time available stock via StockService (ledger calculation)
        \App\Services\StockService::attachRealtimeBalances($items);

        // Pre-fetch average purchase rates in a single high-performance query
        $avgPurchaseRates = DB::table('purchase_items')
            ->select('item_id', DB::raw('AVG(trade_price) as avg_price'))
            ->groupBy('item_id')
            ->pluck('avg_price', 'item_id');

        $mapped = $items->map(function ($item) use ($avgPurchaseRates) {
            $lastPurchaseItem = $item->lastPurchaseItem;
            $avgPurchaseRate = $avgPurchaseRates[$item->id] ?? null;

            $packing = (int) ($item->packing_qty ?: 1);

            // Live available stock from StockService (handles negative deficits properly)
            $stock1 = (int) ($item->stock_1 ?? 0);
            $stock2 = (int) ($item->stock_2 ?? 0);

            return [
                'id' => $item->id,
                'code' => $item->code,
                'title' => $item->title,
                'company_id' => (int) $item->company,
                'packing_qty' => $packing,
                'stock_1' => $stock1, // Live Available Full Cartons
                'stock_2' => $stock2, // Live Available Loose Pcs
                'total_stock_pcs' => (float) ($item->total_stock_pcs ?? 0),
                'reorder_level' => $item->reorder_level,
                'last_purchase_rate' => (float) ($lastPurchaseItem?->trade_price ?? $item->trade_price),
                'av_purchase_rate' => (float) ($avgPurchaseRate ? round($avgPurchaseRate, 2) : $item->trade_price),
                'last_supplier' => $lastPurchaseItem?->purchase?->supplier?->title ?? null,
                'last_purchase_date' => $lastPurchaseItem?->purchase?->date ?? null,
                'last_qty_carton' => (int) ($lastPurchaseItem?->qty_carton ?? 0),
                'last_qty_pcs' => (int) ($lastPurchaseItem?->qty_pcs ?? 0),
            ];
        });

        return response()->json(['items' => $mapped]);
    }

    public function list()
    {
        $orders = SupplierOrder::with('supplier')->withCount('items')->latest()->get();
        return Inertia::render('admin/supplier-order/List', [
            'orders' => $orders
        ]);
    }

    public function show($id)
    {
        $order = SupplierOrder::with(['supplier', 'items.item'])->findOrFail($id);
        return Inertia::render('admin/supplier-order/Show', [
            'order' => $order
        ]);
    }

    public function print(Request $request, $id)
    {
        $order = SupplierOrder::with(['supplier', 'items.item'])->findOrFail($id);
        $firm = Firm::where('defult', 1)->first() ?? Firm::first();
        $format = $request->get('format', 'big');

        if ($format === 'small' || $format === 'thermal') {
            $view = 'admin.supplier-order.thermal';
            $pdf = Pdf::loadView($view, compact('order', 'firm'));

            $itemCount = count($order->items);
            $height = 320 + ($itemCount * 16);
            if (($order->total_discount ?? 0) > 0) {
                $height += 15;
            }
            $height = max(280, $height);
            $pdf->setPaper([0, 0, 226.77, $height], 'portrait');

            return $pdf->stream("Supplier-Order-$id.pdf");
        }

        return view('admin.supplier-order.print', compact('order', 'firm'));
    }
}
