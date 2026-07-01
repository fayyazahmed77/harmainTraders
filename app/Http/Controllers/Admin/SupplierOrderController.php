<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Items;
use App\Models\SupplierOrder;
use App\Models\SupplierOrderItem;
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
            new Middleware('permission:view purchases', only: ['index', 'getItems', 'list', 'show', 'print']),
            new Middleware('permission:create purchases', only: ['store']),
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

        // Calculate real-time stock based on transactions (matching report logic)
        $purchased = DB::table('purchase_items')->select('item_id', DB::raw('SUM(total_pcs) as total_purchased'))->groupBy('item_id');
        $sold = DB::table('sales_items')->select('item_id', DB::raw('SUM(total_pcs) as total_sold'))->groupBy('item_id');
        $purchaseReturned = DB::table('purchase_return_items')->select('item_id', DB::raw('SUM(total_pcs) as total_purchase_returned'))->groupBy('item_id');
        $salesReturned = DB::table('sales_return_items')->select('item_id', DB::raw('SUM(total_pcs) as total_sales_returned'))->groupBy('item_id');
        
        // Sales in selected period (Aggregated for joining)
        $sales15Agg = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->where('sales.date', '>=', $salesStartDate)
            ->select('item_id', DB::raw('SUM(total_pcs) as total_sales_15'))
            ->groupBy('item_id');

        $query = Items::with(['lastPurchaseItem.purchase.supplier'])
            ->whereIn('items.company', $companyIds)
            ->leftJoinSub($purchased, 'p', 'items.id', '=', 'p.item_id')
            ->leftJoinSub($sold, 's', 'items.id', '=', 's.item_id')
            ->leftJoinSub($purchaseReturned, 'pr', 'items.id', '=', 'pr.item_id')
            ->leftJoinSub($salesReturned, 'sr', 'items.id', '=', 'sr.item_id')
            ->leftJoinSub($sales15Agg, 's15', 'items.id', '=', 's15.item_id')
            ->select('items.*')
            ->addSelect([
                'calculated_total_pcs' => DB::raw('(COALESCE(p.total_purchased, 0) - COALESCE(pr.total_purchase_returned, 0)) - (COALESCE(s.total_sold, 0) - COALESCE(sr.total_sales_returned, 0))'),
                'sales_15_days' => DB::raw('COALESCE(s15.total_sales_15, 0)')
            ]);

        if ($mode === 'reorder') {
            $query->whereRaw('FLOOR(((COALESCE(p.total_purchased, 0) - COALESCE(pr.total_purchase_returned, 0)) - (COALESCE(s.total_sold, 0) - COALESCE(sr.total_sales_returned, 0))) / COALESCE(items.packing_qty, 1)) <= items.reorder_level');
        } else {
            // Sales Wise: Show all items with sales in the last 15 days, regardless of stock level
            // This ensures you never miss a fast-moving item even if it's above reorder level.
            $query->whereRaw('COALESCE(s15.total_sales_15, 0) > 0')
                ->orderByDesc(DB::raw('COALESCE(s15.total_sales_15, 0)'));
        }

        $items = $query->get();
        
        // Map intelligence data
        $itemsWithIntelligence = $items->map(function ($item) {
            $lastPurchaseItem = $item->lastPurchaseItem;
            $avgPurchaseRate = DB::table('purchase_items')->where('item_id', $item->id)->avg('trade_price');

            $totalPcs = (int) $item->calculated_total_pcs;
            $packing = (int) ($item->packing_qty ?: 1);
            $stock1 = floor($totalPcs / $packing);
            $stock2 = $totalPcs % $packing;

            $salesTotal = (int) $item->sales_15_days;
            $salesFull = floor($salesTotal / $packing);
            $salesPcs = $salesTotal % $packing;

            return [
                'id' => $item->id,
                'code' => $item->code,
                'title' => $item->title,
                'packing_qty' => $packing,
                'stock_1' => $stock1, // Calculated Available Full
                'stock_2' => $stock2, // Calculated Available Pcs
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

    public function print($id)
    {
        $order = SupplierOrder::with(['supplier', 'items.item'])->findOrFail($id);
        return view('admin.supplier-order.print', compact('order'));
    }
}
