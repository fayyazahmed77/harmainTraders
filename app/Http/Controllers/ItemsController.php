<?php

namespace App\Http\Controllers;

use App\Models\Items;
use App\Models\ItemCategory;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemsController extends Controller
{
    public function index(Request $request)
    {
        $query = Items::with('category')->orderBy('id', 'desc');

        // Filter by Category
        if ($request->has('category_id') && $request->category_id && $request->category_id !== 'all') {
            $query->where('category', $request->category_id);
        }

        // Filter by Status
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('is_active', 1);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', 0);
            }
        }

        // Filter by Search (Code, Title, Company)
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', '%' . $request->search . '%')
                    ->orWhere('title', 'like', '%' . $request->search . '%')
                    ->orWhere('company', 'like', '%' . $request->search . '%');
            });
        }

        $items = $query->get([
            'id',
            'code',
            'title',
            'company',
            'category',
            'type',
            'trade_price',
            'retail',
            'stock_1',
            'stock_2',
            'reorder_level',
            'is_import',
            'is_active',
            'created_at',
        ]);

        // Calculate Summary (Based on filtered data or broader scope - usually summary shows "current state" but can be filtered)
        // Let's make summary reflect the filtered dataset to be consistent with Sales
        $summary = [
            'total_items' => $items->count(),
            'active_items' => $items->where('is_active', 1)->count(),
            'stock_value' => $items->sum(function ($item) {
                return ($item->stock_1 ?? 0) * ($item->trade_price ?? 0);
            }),
            'out_of_stock' => $items->where('stock_1', '<=', 0)->count(),
            'low_stock' => $items->filter(function ($item) {
                return ($item->stock_1 ?? 0) <= ($item->reorder_level ?? 0);
            })->count(),
        ];

        $categories = ItemCategory::all();

        return Inertia::render("setup/items/index", [
            'items' => $items,
            'categories' => $categories,
            'filters' => $request->all(['category_id', 'status', 'search']),
            'summary' => $summary,
        ]);
    }
    public function create()
    {
        $categories = ItemCategory::all();
        $compaines = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Company']);
            })
            ->get();
       
        return Inertia::render("setup/items/create", [
            'categories' => $categories,
            'compaines' => $compaines
        ]);
    }
    public function store(Request $request)
    {
        // dd($request->all());
        $validated = $request->validate([
            'date' => 'nullable|date',
            'code' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'short_name' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',

            // Pricing
            'trade_price' => 'nullable|numeric',
            'retail' => 'nullable|numeric',
            'retail_tp_diff' => 'nullable|numeric',

            // Inventory & Packing
            'reorder_level' => 'nullable|numeric',
            'packing_qty' => 'nullable|numeric',
            'packing_size' => 'nullable|string|max:255',
            'pcs' => 'nullable|numeric',

            // Selects
            'formation' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'shelf' => 'nullable|string|max:255',

            // GST
            'gst_percent' => 'nullable|numeric',
            'gst_amount' => 'nullable|numeric',

            // Advanced Tax
            'adv_tax_filer' => 'nullable|numeric',
            'adv_tax_non_filer' => 'nullable|numeric',
            'adv_tax_manufacturer' => 'nullable|numeric',

            // Right Section
            'discount' => 'nullable|numeric',
            'packing_full' => 'nullable|numeric',
            'packing_pcs' => 'nullable|numeric',
            'limit_pcs' => 'nullable|numeric',
            'order_qty' => 'nullable|numeric',
            'weight' => 'nullable|numeric',

            // Stock
            'stock_1' => 'nullable|numeric',
            'stock_2' => 'nullable|numeric',

            // Checkboxes
            'is_import' => 'boolean',
            'is_fridge' => 'boolean',
            'is_active' => 'boolean',
            'is_recipe' => 'boolean',

            // P.T.
            'pt2' => 'nullable|numeric',
            'pt3' => 'nullable|numeric',
            'pt4' => 'nullable|numeric',
            'pt5' => 'nullable|numeric',
            'pt6' => 'nullable|numeric',
            'pt7' => 'nullable|numeric',
        ]);

        // ✅ Create item
        $item = Items::create($validated);

        return redirect()->route('items.index')->with('success', 'Item created successfully');
    }

    public function edit($id)
    {
        $item = Items::findOrFail($id);
        $categories = ItemCategory::all();

        // Pagination logic (same as show)
        $prevId = Items::where('id', '>', $id)->orderBy('id', 'asc')->value('id');
        $nextId = Items::where('id', '<', $id)->orderBy('id', 'desc')->value('id');
        $totalCount = Items::count();
        $currentIndex = Items::where('id', '>', $id)->count() + 1;

        return Inertia::render("setup/items/edit", [
            'item' => $item,
            'categories' => $categories,
            'pagination' => [
                'prev_id' => $prevId,
                'next_id' => $nextId,
                'current' => $currentIndex,
                'total' => $totalCount,
            ]
        ]);
    }
    //update
    public function update(Request $request, $id)
    {
        $item = Items::findOrFail($id);
        $validated = $request->validate([
            'date' => 'nullable|date',
            'code' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'short_name' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',

            // Pricing
            'trade_price' => 'nullable|numeric',
            'retail' => 'nullable|numeric',
            'retail_tp_diff' => 'nullable|numeric',

            // Inventory & Packing
            'reorder_level' => 'nullable|numeric',
            'packing_qty' => 'nullable|numeric',
            'packing_size' => 'nullable|string|max:255',
            'pcs' => 'nullable|numeric',

            // Selects
            'formation' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'category' => 'nullable|exists:item_categories,id',
            'shelf' => 'nullable|string|max:255',

            // GST
            'gst_percent' => 'nullable|numeric',
            'gst_amount' => 'nullable|numeric',

            // Advanced Tax
            'adv_tax_filer' => 'nullable|numeric',
            'adv_tax_non_filer' => 'nullable|numeric',
            'adv_tax_manufacturer' => 'nullable|numeric',

            // Right Section
            'discount' => 'nullable|numeric',
            'packing_full' => 'nullable|numeric',
            'packing_pcs' => 'nullable|numeric',
            'limit_pcs' => 'nullable|numeric',
            'order_qty' => 'nullable|numeric',
            'weight' => 'nullable|numeric',

            // Stock
            'stock_1' => 'nullable|numeric',
            'stock_2' => 'nullable|numeric',

            // Checkboxes
            'is_import' => 'boolean',
            'is_fridge' => 'boolean',
            'is_active' => 'boolean',
            'is_recipe' => 'boolean',

            // P.T.
            'pt2' => 'nullable|numeric',
            'pt3' => 'nullable|numeric',
            'pt4' => 'nullable|numeric',
            'pt5' => 'nullable|numeric',
            'pt6' => 'nullable|numeric',
            'pt7' => 'nullable|numeric',
        ]);
        $item->update($validated);

        return redirect()->route('items.index')->with('success', 'Item updated successfully');
    }
    //show
    //show
    public function show($id)
    {
        $item = Items::with('category')->findOrFail($id);

        // 1. Purchase Analysis
        // We need to aggregate all PurchaseItems for this item
        $purchaseStats = \App\Models\PurchaseItem::where('item_id', $id)
            ->selectRaw('
                COUNT(*) as count,
                SUM(total_pcs) as total_qty_pcs,
                SUM(subtotal) as total_value,
                AVG(trade_price) as avg_price
            ')
            ->first();

        // 2. Sales Analysis
        $saleStats = \App\Models\SalesItem::where('item_id', $id)
            ->selectRaw('
                COUNT(*) as count,
                SUM(total_pcs) as total_qty_pcs,
                SUM(subtotal) as total_value,
                SUM(subtotal) / NULLIF(SUM(total_pcs), 0) as real_avg_price
            ')
            ->first();

        // 3. Profit Calculation
        // Weighted Average Cost (WAC) per PC
        $totalPurchasedValue = $purchaseStats->total_value ?? 0;
        $totalPurchasedQty = $purchaseStats->total_qty_pcs ?? 0;

        // Fallback to current trade_price if no history
        $avgCostPerPc = $totalPurchasedQty > 0
            ? $totalPurchasedValue / $totalPurchasedQty
            : ($item->trade_price ?? 0);

        // Cost of Goods Sold (COGS) = Sold Qty * Avg Cost
        $totalSoldQty = $saleStats->total_qty_pcs ?? 0;
        $cogs = $totalSoldQty * $avgCostPerPc;

        // Gross Profit = Total Sales Revenue - COGS
        $totalSalesRevenue = $saleStats->total_value ?? 0;
        $grossProfit = $totalSalesRevenue - $cogs;

        // Profit Margin %
        $margin = $totalSalesRevenue > 0 ? ($grossProfit / $totalSalesRevenue) * 100 : 0;

        // 4. Recent Transactions (for timeline)
        $recentPurchases = \App\Models\Purchase::whereHas('items', function ($q) use ($id) {
            $q->where('item_id', $id);
        })->with(['supplier'])->latest()->take(5)->get();

        $recentSales = \App\Models\Sales::whereHas('items', function ($q) use ($id) {
            $q->where('item_id', $id);
        })->with(['customer'])->latest()->take(5)->get();

        // Prepare stats object
        $stats = [
            'purchase' => [
                'count' => $purchaseStats->count ?? 0,
                'total_qty_pcs' => $purchaseStats->total_qty_pcs ?? 0,
                'total_value' => $purchaseStats->total_value ?? 0,
                'avg_cost' => $avgCostPerPc,
            ],
            'sale' => [
                'count' => $saleStats->count ?? 0,
                'total_qty_pcs' => $saleStats->total_qty_pcs ?? 0,
                'total_value' => $saleStats->total_value ?? 0,
                'avg_price' => $saleStats->real_avg_price ?? 0,
            ],
            'profit' => [
                'cogs' => $cogs,
                'gross_profit' => $grossProfit,
                'margin' => $margin,
                'profit_per_pc' => ($totalSoldQty > 0) ? ($grossProfit / $totalSoldQty) : 0
            ]
        ];

        // 5. Pagination (for Next/Prev navigation)
        $prevId = Items::where('id', '>', $id)->orderBy('id', 'asc')->value('id');
        $nextId = Items::where('id', '<', $id)->orderBy('id', 'desc')->value('id');
        $totalCount = Items::count();
        $currentIndex = Items::where('id', '>', $id)->count() + 1;

        return Inertia::render("setup/items/show", [
            'item' => $item,
            'stats' => $stats,
            'recentPurchases' => $recentPurchases,
            'recentSales' => $recentSales,
            'pagination' => [
                'prev_id' => $prevId,
                'next_id' => $nextId,
                'current' => $currentIndex,
                'total' => $totalCount,
            ]
        ]);
    }
}
