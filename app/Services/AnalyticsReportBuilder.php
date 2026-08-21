<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsReportBuilder
{
    /**
     * Build dynamic analytics data based on report type and filter parameters.
     */
    public function calculate(string $reportType, array $params): array
    {
        $fromDate = $params['fromDate'] ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $toDate = $params['toDate'] ?? Carbon::now()->format('Y-m-d');

        // Calculate preceding comparison window of equal duration
        $start = Carbon::parse($fromDate);
        $end = Carbon::parse($toDate);
        $diffDays = $start->diffInDays($end) + 1;

        $prevToDate = $start->copy()->subDay()->format('Y-m-d');
        $prevFromDate = $start->copy()->subDays($diffDays)->format('Y-m-d');

        $filters = [
            'firm_id' => ($params['firmId'] ?? 'ALL') === 'ALL' ? null : $params['firmId'],
            'company_id' => ($params['companyId'] ?? 'ALL') === 'ALL' ? null : $params['companyId'],
            'category_id' => ($params['categoryId'] ?? 'ALL') === 'ALL' ? null : $params['categoryId'],
            'item_id' => ($params['itemId'] ?? 'ALL') === 'ALL' ? null : $params['itemId'],
            'customer_id' => ($params['customerId'] ?? 'ALL') === 'ALL' ? null : $params['customerId'],
            'supplier_id' => ($params['supplierId'] ?? 'ALL') === 'ALL' ? null : $params['supplierId'],
            'salesman_id' => ($params['salesmanId'] ?? 'ALL') === 'ALL' ? null : $params['salesmanId'],
        ];

        return match ($reportType) {
            'purchase' => $this->getPurchaseAnalytics($fromDate, $toDate, $prevFromDate, $prevToDate, $filters),
            'stock' => $this->getStockAnalytics($fromDate, $toDate, $filters),
            default => $this->getSalesAnalytics($fromDate, $toDate, $prevFromDate, $prevToDate, $filters),
        };
    }

    /**
     * 1. SALES ANALYTICS
     */
    private function getSalesAnalytics($fromDate, $toDate, $prevFromDate, $prevToDate, $filters): array
    {
        // Current Period Base Query
        $salesQuery = DB::table('sales')->whereBetween('sales.date', [$fromDate, $toDate]);
        $itemsQuery = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        // Previous Period Base Query
        $prevSalesQuery = DB::table('sales')->whereBetween('sales.date', [$prevFromDate, $prevToDate]);
        $prevItemsQuery = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$prevFromDate, $prevToDate]);

        // Apply filters
        $this->applySalesFilters($salesQuery, $itemsQuery, $filters);
        $this->applySalesFilters($prevSalesQuery, $prevItemsQuery, $filters);

        // Current KPIs
        $currentRevenue = (float) $salesQuery->sum('sales.net_total');
        $currentOrders = (int) $salesQuery->count('sales.id');
        $currentQty = (float) $itemsQuery->sum('sales_items.qty_carton');
        $avgOrderValue = $currentOrders > 0 ? $currentRevenue / $currentOrders : 0;

        // Previous KPIs
        $prevRevenue = (float) $prevSalesQuery->sum('sales.net_total');
        $prevOrders = (int) $prevSalesQuery->count('sales.id');
        $prevQty = (float) $prevItemsQuery->sum('sales_items.qty_carton');

        // Growth Calculations
        $revenueGrowth = $prevRevenue > 0 ? (($currentRevenue - $prevRevenue) / $prevRevenue) * 100 : ($currentRevenue > 0 ? 100 : 0);
        $ordersGrowth = $prevOrders > 0 ? (($currentOrders - $prevOrders) / $prevOrders) * 100 : ($currentOrders > 0 ? 100 : 0);
        $qtyGrowth = $prevQty > 0 ? (($currentQty - $prevQty) / $prevQty) * 100 : ($currentQty > 0 ? 100 : 0);

        // Top Customer
        $topCustomerRow = DB::table('sales')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select('accounts.title', DB::raw('SUM(sales.net_total) as total'))
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->first();

        // Top Product
        $topProductRow = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select('items.title', DB::raw('SUM(sales_items.qty_carton) as total_qty'), DB::raw('SUM(sales_items.subtotal) as total_val'))
            ->groupBy('items.id', 'items.title')
            ->orderByDesc('total_val')
            ->first();

        $kpis = [
            'total_sales' => $currentRevenue,
            'total_sales_prev' => $prevRevenue,
            'revenue_growth' => round($revenueGrowth, 1),
            'total_orders' => $currentOrders,
            'total_orders_prev' => $prevOrders,
            'orders_growth' => round($ordersGrowth, 1),
            'total_qty' => $currentQty,
            'qty_growth' => round($qtyGrowth, 1),
            'avg_order_value' => round($avgOrderValue, 2),
            'top_customer' => $topCustomerRow->title ?? 'N/A',
            'top_customer_value' => (float)($topCustomerRow->total ?? 0),
            'top_product' => $topProductRow->title ?? 'N/A',
            'top_product_value' => (float)($topProductRow->total_val ?? 0),
        ];

        // Sales Daily Trend
        $trendRaw = DB::table('sales')
            ->whereBetween('date', [$fromDate, $toDate])
            ->select(
                'date',
                DB::raw('SUM(net_total) as revenue'),
                DB::raw('COUNT(id) as orders')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $trend = $trendRaw->map(fn($row) => [
            'date' => Carbon::parse($row->date)->format('d MMM'),
            'full_date' => $row->date,
            'revenue' => (float) $row->revenue,
            'orders' => (int) $row->orders,
        ]);

        // Top 10 Products Horizontal Bar Chart Data
        $topProducts = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'items.id',
                'items.code',
                'items.title',
                DB::raw('SUM(sales_items.qty_carton) as qty'),
                DB::raw('SUM(sales_items.subtotal) as amount')
            )
            ->groupBy('items.id', 'items.code', 'items.title')
            ->orderByDesc('amount')
            ->limit(10)
            ->get()
            ->map(fn($row) => [
                'name' => $row->title,
                'code' => $row->code,
                'qty' => (float)$row->qty,
                'amount' => (float)$row->amount,
            ]);

        // Top 10 Customers Chart Data
        $topCustomers = DB::table('sales')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'accounts.id',
                'accounts.title',
                DB::raw('COUNT(sales.id) as orders'),
                DB::raw('SUM(sales.net_total) as amount')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('amount')
            ->limit(10)
            ->get()
            ->map(fn($row) => [
                'name' => $row->title,
                'orders' => (int)$row->orders,
                'amount' => (float)$row->amount,
            ]);

        // Category Sales Contribution (Donut Chart)
        $categoryBreakdown = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->leftJoin('item_categories', 'items.category', '=', 'item_categories.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                DB::raw('COALESCE(item_categories.name, "Uncategorized") as category_name'),
                DB::raw('SUM(sales_items.subtotal) as amount')
            )
            ->groupBy('category_name')
            ->orderByDesc('amount')
            ->get()
            ->map(fn($row) => [
                'name' => $row->category_name,
                'value' => (float)$row->amount,
            ]);

        // Table Data Summary (Items / Sales)
        $tableData = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->leftJoin('item_categories', 'items.category', '=', 'item_categories.id')
            ->leftJoin('accounts as company_acc', 'items.company', '=', 'company_acc.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'items.id',
                'items.code',
                'items.title as item_name',
                'company_acc.title as company_name',
                'item_categories.name as category_name',
                DB::raw('SUM(sales_items.qty_carton) as total_qty'),
                DB::raw('SUM(sales_items.bonus_qty_carton) as total_bonus'),
                DB::raw('SUM(sales_items.subtotal) as gross_amount'),
                DB::raw('SUM(sales_items.discount) as discount_amount'),
                DB::raw('SUM(sales_items.subtotal) as net_amount')
            )
            ->groupBy('items.id', 'items.code', 'items.title', 'company_acc.title', 'item_categories.name')
            ->orderByDesc('net_amount')
            ->get()
            ->map(function ($row) use ($currentRevenue) {
                $net = (float)$row->net_amount;
                return [
                    'id' => $row->id,
                    'code' => $row->code,
                    'item_name' => $row->item_name,
                    'company_name' => $row->company_name ?? '---',
                    'category_name' => $row->category_name ?? '---',
                    'qty' => (float)$row->total_qty,
                    'bonus_qty' => (float)$row->total_bonus,
                    'gross_amount' => (float)$row->gross_amount,
                    'discount_amount' => (float)$row->discount_amount,
                    'net_amount' => $net,
                    'contribution_pct' => $currentRevenue > 0 ? round(($net / $currentRevenue) * 100, 2) : 0,
                ];
            });

        return [
            'reportType' => 'sales',
            'kpis' => $kpis,
            'trend' => $trend,
            'topProducts' => $topProducts,
            'topCustomers' => $topCustomers,
            'categoryBreakdown' => $categoryBreakdown,
            'tableData' => $tableData,
        ];
    }

    /**
     * 2. PURCHASE ANALYTICS
     */
    private function getPurchaseAnalytics($fromDate, $toDate, $prevFromDate, $prevToDate, $filters): array
    {
        // Current Query
        $purchaseQuery = DB::table('purchases')->whereBetween('purchases.date', [$fromDate, $toDate]);
        $itemsQuery = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate]);

        // Previous Query
        $prevPurchaseQuery = DB::table('purchases')->whereBetween('purchases.date', [$prevFromDate, $prevToDate]);
        $prevItemsQuery = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->whereBetween('purchases.date', [$prevFromDate, $prevToDate]);

        // Apply filters
        $this->applyPurchaseFilters($purchaseQuery, $itemsQuery, $filters);
        $this->applyPurchaseFilters($prevPurchaseQuery, $prevItemsQuery, $filters);

        $currentCost = (float) $purchaseQuery->sum('purchases.net_total');
        $currentOrders = (int) $purchaseQuery->count('purchases.id');
        $currentQty = (float) $itemsQuery->sum('purchase_items.qty_carton');
        $avgOrderValue = $currentOrders > 0 ? $currentCost / $currentOrders : 0;

        $prevCost = (float) $prevPurchaseQuery->sum('purchases.net_total');
        $prevOrders = (int) $prevPurchaseQuery->count('purchases.id');
        $prevQty = (float) $prevItemsQuery->sum('purchase_items.qty_carton');

        $costGrowth = $prevCost > 0 ? (($currentCost - $prevCost) / $prevCost) * 100 : ($currentCost > 0 ? 100 : 0);
        $ordersGrowth = $prevOrders > 0 ? (($currentOrders - $prevOrders) / $prevOrders) * 100 : ($currentOrders > 0 ? 100 : 0);

        // Top Supplier
        $topSupplierRow = DB::table('purchases')
            ->join('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select('accounts.title', DB::raw('SUM(purchases.net_total) as total'))
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->first();

        // Top Purchased Product
        $topProductRow = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select('items.title', DB::raw('SUM(purchase_items.qty_carton) as total_qty'), DB::raw('SUM(purchase_items.subtotal) as total_val'))
            ->groupBy('items.id', 'items.title')
            ->orderByDesc('total_val')
            ->first();

        $kpis = [
            'total_purchases' => $currentCost,
            'total_purchases_prev' => $prevCost,
            'cost_growth' => round($costGrowth, 1),
            'total_orders' => $currentOrders,
            'total_orders_prev' => $prevOrders,
            'orders_growth' => round($ordersGrowth, 1),
            'total_qty' => $currentQty,
            'avg_order_value' => round($avgOrderValue, 2),
            'top_supplier' => $topSupplierRow->title ?? 'N/A',
            'top_supplier_value' => (float)($topSupplierRow->total ?? 0),
            'top_product' => $topProductRow->title ?? 'N/A',
            'top_product_value' => (float)($topProductRow->total_val ?? 0),
        ];

        // Purchase Trend
        $trend = DB::table('purchases')
            ->whereBetween('date', [$fromDate, $toDate])
            ->select(
                'date',
                DB::raw('SUM(net_total) as cost'),
                DB::raw('COUNT(id) as orders')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(fn($row) => [
                'date' => Carbon::parse($row->date)->format('d MMM'),
                'full_date' => $row->date,
                'cost' => (float) $row->cost,
                'orders' => (int) $row->orders,
            ]);

        // Top Suppliers Chart Data
        $topSuppliers = DB::table('purchases')
            ->join('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select(
                'accounts.id',
                'accounts.title',
                DB::raw('COUNT(purchases.id) as orders'),
                DB::raw('SUM(purchases.net_total) as amount')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('amount')
            ->limit(10)
            ->get()
            ->map(fn($row) => [
                'name' => $row->title,
                'orders' => (int)$row->orders,
                'amount' => (float)$row->amount,
            ]);

        // Top Purchased Products
        $topProducts = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select(
                'items.id',
                'items.code',
                'items.title',
                DB::raw('SUM(purchase_items.qty_carton) as qty'),
                DB::raw('SUM(purchase_items.subtotal) as amount')
            )
            ->groupBy('items.id', 'items.code', 'items.title')
            ->orderByDesc('amount')
            ->limit(10)
            ->get()
            ->map(fn($row) => [
                'name' => $row->title,
                'code' => $row->code,
                'qty' => (float)$row->qty,
                'amount' => (float)$row->amount,
            ]);

        // Category Purchase Distribution
        $categoryBreakdown = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->leftJoin('item_categories', 'items.category', '=', 'item_categories.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select(
                DB::raw('COALESCE(item_categories.name, "Uncategorized") as category_name'),
                DB::raw('SUM(purchase_items.subtotal) as amount')
            )
            ->groupBy('category_name')
            ->orderByDesc('amount')
            ->get()
            ->map(fn($row) => [
                'name' => $row->category_name,
                'value' => (float)$row->amount,
            ]);

        // Table Data Summary
        $tableData = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->leftJoin('accounts as supplier_acc', 'purchases.supplier_id', '=', 'supplier_acc.id')
            ->leftJoin('item_categories', 'items.category', '=', 'item_categories.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select(
                'items.id',
                'items.code',
                'items.title as item_name',
                'supplier_acc.title as supplier_name',
                'item_categories.name as category_name',
                DB::raw('SUM(purchase_items.qty_carton) as total_qty'),
                DB::raw('SUM(purchase_items.free_carton) as total_bonus'),
                DB::raw('SUM(purchase_items.subtotal) as gross_amount'),
                DB::raw('SUM(purchase_items.discount) as discount_amount'),
                DB::raw('SUM(purchase_items.subtotal) as net_amount')
            )
            ->groupBy('items.id', 'items.code', 'items.title', 'supplier_acc.title', 'item_categories.name')
            ->orderByDesc('net_amount')
            ->get()
            ->map(function ($row) use ($currentCost) {
                $net = (float)$row->net_amount;
                return [
                    'id' => $row->id,
                    'code' => $row->code,
                    'item_name' => $row->item_name,
                    'supplier_name' => $row->supplier_name ?? '---',
                    'category_name' => $row->category_name ?? '---',
                    'qty' => (float)$row->total_qty,
                    'bonus_qty' => (float)$row->total_bonus,
                    'gross_amount' => (float)$row->gross_amount,
                    'discount_amount' => (float)$row->discount_amount,
                    'net_amount' => $net,
                    'contribution_pct' => $currentCost > 0 ? round(($net / $currentCost) * 100, 2) : 0,
                ];
            });

        return [
            'reportType' => 'purchase',
            'kpis' => $kpis,
            'trend' => $trend,
            'topSuppliers' => $topSuppliers,
            'topProducts' => $topProducts,
            'categoryBreakdown' => $categoryBreakdown,
            'tableData' => $tableData,
        ];
    }

    /**
     * 3. STOCK ANALYTICS
     */
    private function getStockAnalytics($fromDate, $toDate, $filters): array
    {
        $itemsQuery = DB::table('items')
            ->leftJoin('item_categories', 'items.category', '=', 'item_categories.id')
            ->leftJoin('accounts as company_acc', 'items.company', '=', 'company_acc.id');

        if (!empty($filters['company_id'])) {
            $itemsQuery->where('items.company', $filters['company_id']);
        }
        if (!empty($filters['category_id'])) {
            $itemsQuery->where('items.category', $filters['category_id']);
        }
        if (!empty($filters['item_id'])) {
            $itemsQuery->where('items.id', $filters['item_id']);
        }

        $items = $itemsQuery->select(
            'items.id',
            'items.code',
            'items.title as item_name',
            'items.stock_1',
            'items.stock_2',
            'items.packing_qty',
            'items.trade_price',
            'items.retail',
            'items.reorder_level',
            'items.is_active',
            'item_categories.name as category_name',
            'company_acc.title as company_name'
        )->get();

        $totalItemsCount = $items->count();
        $totalStockPcs = 0;
        $totalValuation = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;

        $processedItems = $items->map(function ($item) use (&$totalStockPcs, &$totalValuation, &$lowStockCount, &$outOfStockCount) {
            $packing = max((int)$item->packing_qty, 1);
            $stock1 = (int)($item->stock_1 ?? 0);
            $stock2 = (int)($item->stock_2 ?? 0);
            $totalPcs = ($stock1 * $packing) + $stock2;

            $tp = (float)($item->trade_price ?? 0);
            $valuation = ($stock1 * $tp) + ($stock2 * ($packing > 0 ? $tp / $packing : 0));

            $reorder = (int)($item->reorder_level ?? 0);

            if ($totalPcs <= 0) {
                $outOfStockCount++;
                $status = 'Out of Stock';
            } elseif ($totalPcs <= $reorder) {
                $lowStockCount++;
                $status = 'Low Stock';
            } else {
                $status = 'Optimal';
            }

            $totalStockPcs += $totalPcs;
            $totalValuation += $valuation;

            return [
                'id' => $item->id,
                'code' => $item->code,
                'item_name' => $item->item_name,
                'category_name' => $item->category_name ?? '---',
                'company_name' => $item->company_name ?? '---',
                'stock_1' => $stock1,
                'stock_2' => $stock2,
                'packing_qty' => $packing,
                'total_pcs' => $totalPcs,
                'trade_price' => $tp,
                'valuation' => round($valuation, 2),
                'reorder_level' => $reorder,
                'status' => $status,
            ];
        });

        // Stock Movement IN (Purchases) vs OUT (Sales) in selected range
        $stockInQty = (float) DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->sum('purchase_items.qty_carton');

        $stockOutQty = (float) DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->sum('sales_items.qty_carton');

        $kpis = [
            'total_items' => $totalItemsCount,
            'total_stock_pcs' => $totalStockPcs,
            'total_valuation' => round($totalValuation, 2),
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
            'stock_in_qty' => $stockInQty,
            'stock_out_qty' => $stockOutQty,
        ];

        // Stock Movement Comparison Chart Data
        $stockMovement = [
            ['name' => 'Stock Movement', 'Stock IN (Purchase)' => $stockInQty, 'Stock OUT (Sales)' => $stockOutQty]
        ];

        // Highest Stock Valuation Products (Top 10)
        $topStockValuation = $processedItems->sortByDesc('valuation')->take(10)->values()->toArray();

        // Company Valuation Breakdown (Donut Chart)
        $companyValuation = $processedItems->groupBy('company_name')->map(function ($group, $company) {
            return [
                'name' => $company,
                'value' => round($group->sum('valuation'), 2),
            ];
        })->values()->sortByDesc('value')->take(8)->values()->toArray();

        return [
            'reportType' => 'stock',
            'kpis' => $kpis,
            'stockMovement' => $stockMovement,
            'topStockValuation' => $topStockValuation,
            'companyValuation' => $companyValuation,
            'tableData' => $processedItems->values()->toArray(),
        ];
    }

    private function applySalesFilters($salesQuery, $itemsQuery, array $filters): void
    {
        if (!empty($filters['firm_id'])) {
            $salesQuery->where('sales.firm_id', $filters['firm_id']);
            $itemsQuery->where('sales.firm_id', $filters['firm_id']);
        }
        if (!empty($filters['customer_id'])) {
            $salesQuery->where('sales.customer_id', $filters['customer_id']);
            $itemsQuery->where('sales.customer_id', $filters['customer_id']);
        }
        if (!empty($filters['salesman_id'])) {
            $salesQuery->where('sales.salesman_id', $filters['salesman_id']);
            $itemsQuery->where('sales.salesman_id', $filters['salesman_id']);
        }
        if (!empty($filters['category_id'])) {
            $itemsQuery->where('items.category', $filters['category_id']);
        }
        if (!empty($filters['company_id'])) {
            $itemsQuery->where('items.company', $filters['company_id']);
        }
        if (!empty($filters['item_id'])) {
            $itemsQuery->where('items.id', $filters['item_id']);
        }
    }

    private function applyPurchaseFilters($purchaseQuery, $itemsQuery, array $filters): void
    {
        if (!empty($filters['firm_id'])) {
            $purchaseQuery->where('purchases.firm_id', $filters['firm_id']);
            $itemsQuery->where('purchases.firm_id', $filters['firm_id']);
        }
        if (!empty($filters['supplier_id'])) {
            $purchaseQuery->where('purchases.supplier_id', $filters['supplier_id']);
            $itemsQuery->where('purchases.supplier_id', $filters['supplier_id']);
        }
        if (!empty($filters['category_id'])) {
            $itemsQuery->where('items.category', $filters['category_id']);
        }
        if (!empty($filters['company_id'])) {
            $itemsQuery->where('items.company', $filters['company_id']);
        }
        if (!empty($filters['item_id'])) {
            $itemsQuery->where('items.id', $filters['item_id']);
        }
    }
}
