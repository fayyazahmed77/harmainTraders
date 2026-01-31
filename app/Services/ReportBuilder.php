<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\SalesReturn;
use App\Models\PurchaseReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ReportBuilder
{
    /**
     * Generate Account Ledger with running balance.
     */
    public function accountLedger(int $accountId, $fromDate = null, $toDate = null, $perPage = 50)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        // 0. Fetch Account and determine type
        $account = Account::findOrFail($accountId);
        // orientation: 'dr' for Customers (Receivables), 'cr' for Suppliers (Payables)
        // If it's both, we default to 'dr' or base it on the primary flag. 
        // Here we'll use 'cr' if it's marked as purchase=1.
        $orientation = $account->purchase == 1 ? 'cr' : 'dr';

        // 1. Calculate Opening Balance before $fromDate
        $openingBalance = $this->calculateOpeningBalance($accountId, $fromDate, $orientation);

        // 2. Fetch Transactions within range
        $sales = Sales::where('customer_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("'Sale' as type, id, date, CONCAT('Sale #', id) as description, net_total as debit, 0 as credit, created_at");

        $purchases = Purchase::where('supplier_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("'Purchase' as type, id, date, CONCAT('Purchase #', id) as description, 0 as debit, net_total as credit, created_at");

        $payments = Payment::where('account_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("'Payment' as type, id, date, remarks as description, 
                CASE WHEN type = 'RECEIPT' THEN 0 ELSE amount END as debit,
                CASE WHEN type = 'RECEIPT' THEN amount ELSE 0 END as credit, created_at");

        $salesReturns = SalesReturn::where('customer_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("'Sales Return' as type, id, date, CONCAT('Return #', id) as description, 0 as debit, net_total as credit, created_at");

        $purchaseReturns = PurchaseReturn::where('supplier_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("'Purchase Return' as type, id, date, CONCAT('Return #', id) as description, net_total as debit, 0 as credit, created_at");

        $query = $sales->unionAll($purchases)
            ->unionAll($payments)
            ->unionAll($salesReturns)
            ->unionAll($purchaseReturns)
            ->orderBy('date')
            ->orderBy('created_at');

        $transactions = $query->paginate($perPage);

        // 4. Calculate Balance at the start of the current page
        $pageStartBalance = $openingBalance;
        if ($transactions->currentPage() > 1) {
            $offset = ($transactions->currentPage() - 1) * $perPage;

            $previousRowsQuery = DB::table(DB::raw("({$query->toSql()}) as transactions"))
                ->mergeBindings($query->getQuery())
                ->limit($offset);

            $prevTotals = $previousRowsQuery->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')->first();
            $totalPrevDebit = $prevTotals->total_debit ?? 0;
            $totalPrevCredit = $prevTotals->total_credit ?? 0;

            if ($orientation === 'cr') {
                $pageStartBalance += ($totalPrevCredit - $totalPrevDebit);
            } else {
                $pageStartBalance += ($totalPrevDebit - $totalPrevCredit);
            }
        }

        // 5. Calculate Totals for the entire period
        $totalQuery = DB::table(DB::raw("({$query->toSql()}) as transactions"))
            ->mergeBindings($query->getQuery());

        $totals = $totalQuery->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')->first();

        $totalDebit = (float)($totals->total_debit ?? 0);
        $totalCredit = (float)($totals->total_credit ?? 0);

        if ($orientation === 'cr') {
            $closingBalance = $openingBalance + $totalCredit - $totalDebit;
        } else {
            $closingBalance = $openingBalance + $totalDebit - $totalCredit;
        }

        return [
            'opening_balance' => (float)$openingBalance,
            'page_start_balance' => (float)$pageStartBalance,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'closing_balance' => (float)$closingBalance,
            'balance_type' => $orientation,
            'data' => $transactions,
            'from_date' => $fromDate,
            'to_date' => $toDate
        ];
    }

    private function calculateBalanceChange($accountId, $fromDate, $toDate, $beforeId = null)
    {
        // Calculate sum of all transactions between fromDate and toDate
        // This is a simplified version that ignores the ID tie-breaking for now

        $sales = Sales::where('customer_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $purchases = Purchase::where('supplier_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');

        $paymentsReceived = Payment::where('account_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->where('type', 'RECEIPT')->sum('amount');
        $paymentsPaid = Payment::where('account_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->where('type', 'PAYMENT')->sum('amount');

        $salesReturns = SalesReturn::where('customer_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $purchaseReturns = PurchaseReturn::where('supplier_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');

        $debit = $sales + $paymentsPaid + $purchaseReturns;
        $credit = $purchases + $paymentsReceived + $salesReturns;

        return $debit - $credit;
    }

    private function calculateOpeningBalance($accountId, $date, $orientation = 'dr')
    {
        // Sum all transactions before $date
        $sales = Sales::where('customer_id', $accountId)->where('date', '<', $date)->sum('net_total');
        $purchases = Purchase::where('supplier_id', $accountId)->where('date', '<', $date)->sum('net_total');

        $paymentsReceived = Payment::where('account_id', $accountId)->where('date', '<', $date)->where('type', 'RECEIPT')->sum('amount');
        $paymentsPaid = Payment::where('account_id', $accountId)->where('date', '<', $date)->where('type', 'PAYMENT')->sum('amount');

        $salesReturns = SalesReturn::where('customer_id', $accountId)->where('date', '<', $date)->sum('net_total');
        $purchaseReturns = PurchaseReturn::where('supplier_id', $accountId)->where('date', '<', $date)->sum('net_total');

        $debit = $sales + $paymentsPaid + $purchaseReturns;
        $credit = $purchases + $paymentsReceived + $salesReturns;

        // Add manual opening balance from Account model
        $account = Account::find($accountId);
        $manualOpening = $account->opening_balance ?? 0;

        if ($orientation === 'cr') {
            return $manualOpening + ($credit - $debit);
        } else {
            return $manualOpening + ($debit - $credit);
        }
    }

    // Placeholder for other methods
    public function stockStatus(Request $request)
    {
        // 1. Get all items
        // 2. For each item, calculate stock
        // Optimized approach: Group by item_id in DB

        $purchased = DB::table('purchase_items')
            ->select('item_id', DB::raw('SUM(total_pcs) as total_purchased'))
            ->groupBy('item_id');

        $sold = DB::table('sales_items')
            ->select('item_id', DB::raw('SUM(total_pcs) as total_sold'))
            ->groupBy('item_id');

        $purchaseReturned = DB::table('purchase_return_items')
            ->select('item_id', DB::raw('SUM(total_pcs) as total_purchase_returned'))
            ->groupBy('item_id');

        $salesReturned = DB::table('sales_return_items')
            ->select('item_id', DB::raw('SUM(total_pcs) as total_sales_returned'))
            ->groupBy('item_id');

        $items = DB::table('items')
            ->leftJoinSub($purchased, 'p', 'items.id', '=', 'p.item_id')
            ->leftJoinSub($sold, 's', 'items.id', '=', 's.item_id')
            ->leftJoinSub($purchaseReturned, 'pr', 'items.id', '=', 'pr.item_id')
            ->leftJoinSub($salesReturned, 'sr', 'items.id', '=', 'sr.item_id')
            ->leftJoin('item_categories', 'item_categories.id', '=', 'items.category') // ⬅ Join to get category name
            ->select(
                'items.id',
                'items.title as name',
                'items.code',
                'item_categories.name as category',
                'items.reorder_level',
                'items.packing_qty',
                'items.trade_price', // Added trade_price
                DB::raw('COALESCE(p.total_purchased, 0) as purchased'),
                DB::raw('COALESCE(s.total_sold, 0) as sold'),
                DB::raw('COALESCE(pr.total_purchase_returned, 0) as purchase_returned'),
                DB::raw('COALESCE(sr.total_sales_returned, 0) as sales_returned')
            )
            ->get();


        // Calculate Net Stock in PHP
        $data = $items->map(function ($item) {
            $netStock = ($item->purchased - $item->purchase_returned) - ($item->sold - $item->sales_returned);

            $packingQty = $item->packing_qty > 0 ? $item->packing_qty : 1;
            $cartons = floor($netStock / $packingQty);
            $loose = $netStock % $packingQty;

            // Assuming trade_price is per piece/unit
            $pricePerPiece = $item->trade_price;
            $pricePerCarton = $pricePerPiece * $packingQty;

            return [
                'id' => $item->id,
                'name' => $item->name,
                'code' => $item->code,
                'category' => $item->category,
                'current_stock' => $netStock,
                'reorder_level' => $item->reorder_level,
                'unit' => 'pcs',
                'packing_qty' => $packingQty,
                'stock_cartons' => $cartons,
                'stock_loose' => $loose,
                'price_carton' => $pricePerCarton,
                'price_loose' => $pricePerPiece,
            ];
        });

        return $data;
    }

    public function stockLedger($itemId, $fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        // Opening Stock Calculation
        $opening = $this->calculateStockOpening($itemId, $fromDate);

        // Transactions
        $purchases = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->where('purchase_items.item_id', $itemId)
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->selectRaw("'Purchase' as type, purchases.date, purchases.id as ref_id, purchase_items.total_pcs as qty_in, 0 as qty_out, purchase_items.subtotal as amount, purchases.created_at");

        $sales = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->where('sales_items.item_id', $itemId)
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->selectRaw("'Sale' as type, sales.date, sales.id as ref_id, 0 as qty_in, sales_items.total_pcs as qty_out, sales_items.subtotal as amount, sales.created_at");

        $purchaseReturns = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->where('purchase_return_items.item_id', $itemId)
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate])
            ->selectRaw("'Purchase Return' as type, purchase_returns.date, purchase_returns.id as ref_id, 0 as qty_in, purchase_return_items.total_pcs as qty_out, purchase_return_items.subtotal as amount, purchase_returns.created_at");

        $salesReturns = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->where('sales_return_items.item_id', $itemId)
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->selectRaw("'Sales Return' as type, sales_returns.date, sales_returns.id as ref_id, sales_return_items.total_pcs as qty_in, 0 as qty_out, sales_return_items.subtotal as amount, sales_returns.created_at");

        $query = $purchases->unionAll($sales)
            ->unionAll($purchaseReturns)
            ->unionAll($salesReturns)
            ->orderBy('date')
            ->orderBy('created_at');

        $transactions = $query->get();

        // Calculate Summaries
        $totalPurchaseQty = $transactions->where('type', 'Purchase')->sum('qty_in');
        $totalPurchaseValue = $transactions->where('type', 'Purchase')->sum('amount');

        $totalSaleQty = $transactions->where('type', 'Sale')->sum('qty_out');
        $totalSaleValue = $transactions->where('type', 'Sale')->sum('amount');

        // Calculate Average Cost (Weighted Average)
        $avgCost = $totalPurchaseQty > 0 ? $totalPurchaseValue / $totalPurchaseQty : 0;

        // If no purchases in period, try to get from item master or last purchase (simplified: use item trade_price)
        if ($avgCost == 0) {
            $item = DB::table('items')->where('id', $itemId)->first();
            $avgCost = $item ? $item->trade_price : 0;
        }

        // Calculate Profit
        // Profit = Sales Revenue - COGS
        // COGS = Sales Qty * Avg Cost
        $cogs = $totalSaleQty * $avgCost;
        $profit = $totalSaleValue - $cogs;

        return [
            'opening_stock' => $opening,
            'transactions' => $transactions,
            'summary' => [
                'total_purchase_qty' => $totalPurchaseQty,
                'total_purchase_value' => $totalPurchaseValue,
                'total_sale_qty' => $totalSaleQty,
                'total_sale_value' => $totalSaleValue,
                'avg_cost' => $avgCost,
                'profit' => $profit
            ],
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    private function calculateStockOpening($itemId, $date)
    {
        $purchased = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->where('item_id', $itemId)->where('date', '<', $date)->sum('total_pcs');

        $sold = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->where('item_id', $itemId)->where('date', '<', $date)->sum('total_pcs');

        $pRet = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->where('item_id', $itemId)->where('date', '<', $date)->sum('total_pcs');

        $sRet = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->where('item_id', $itemId)->where('date', '<', $date)->sum('total_pcs');

        return ($purchased - $pRet) - ($sold - $sRet);
    }

    public function profit(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');

        // 1. Fetch Sales Items with Item Cost (Trade Price from Items table)
        // Note: This assumes items.trade_price is the Cost Price.
        // Ideally, we should store cost_price in sales_items at time of sale for accuracy.

        $salesData = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'sales.date',
                'items.title as item_name',
                'sales_items.total_pcs',
                'sales_items.subtotal as revenue', // Selling Price * Qty - Discount
                DB::raw('(sales_items.total_pcs * items.trade_price) as cogs') // Cost * Qty
            )
            ->get();

        // 2. Calculate Totals
        $totalRevenue = $salesData->sum('revenue');
        $totalCOGS = $salesData->sum('cogs');
        $netProfit = $totalRevenue - $totalCOGS;

        // 3. Prepare Trend Data (Group by Date)
        $trend = $salesData->groupBy('date')->map(function ($group, $date) {
            $rev = $group->sum('revenue');
            $cost = $group->sum('cogs');
            return [
                'date' => $date,
                'revenue' => $rev,
                'cogs' => $cost,
                'profit' => $rev - $cost
            ];
        })->values()->sortBy('date');

        // 4. Top Profitable Items
        $topItems = $salesData->groupBy('item_name')->map(function ($group, $name) {
            $rev = $group->sum('revenue');
            $cost = $group->sum('cogs');
            return [
                'name' => $name,
                'profit' => $rev - $cost,
                'revenue' => $rev
            ];
        })->sortByDesc('profit')->take(10)->values();

        return [
            'summary' => [
                'revenue' => $totalRevenue,
                'cogs' => $totalCOGS,
                'profit' => $netProfit,
                'margin' => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0
            ],
            'trend' => $trend,
            'top_items' => $topItems,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function audit(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $userId = $request->input('user_id');
        $module = $request->input('module');
        $action = $request->input('action');

        $query = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
            ->whereBetween('audit_logs.created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->select(
                'audit_logs.*',
                'users.name as user_name'
            );

        if ($userId) {
            $query->where('audit_logs.user_id', $userId);
        }

        if ($module) {
            $query->where('audit_logs.module', $module);
        }

        if ($action) {
            $query->where('audit_logs.action', $action);
        }

        $logs = $query->orderBy('audit_logs.created_at', 'desc')->get();

        // Activity by module
        $activityByModule = DB::table('audit_logs')
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->select('module', DB::raw('COUNT(*) as count'))
            ->groupBy('module')
            ->get();

        // Activity by action
        $activityByAction = DB::table('audit_logs')
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->select('action', DB::raw('COUNT(*) as count'))
            ->groupBy('action')
            ->get();

        // Daily activity trend
        $dailyActivity = DB::table('audit_logs')
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'logs' => $logs,
            'activity_by_module' => $activityByModule,
            'activity_by_action' => $activityByAction,
            'daily_activity' => $dailyActivity,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function purchaseReport(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $supplierId = $request->input('supplier_id');

        $query = DB::table('purchases')
            ->leftJoin('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select(
                'purchases.*',
                'accounts.title as supplier_name'
            );

        if ($supplierId) {
            $query->where('purchases.supplier_id', $supplierId);
        }

        $purchases = $query->orderBy('purchases.date', 'desc')->get();

        // Summary calculations
        $totalPurchases = $purchases->sum('net_total');
        $totalItems = $purchases->sum('no_of_items');
        $supplierCount = $purchases->unique('supplier_id')->count();
        $averagePurchase = $purchases->count() > 0 ? $totalPurchases / $purchases->count() : 0;

        // Daily trend
        $dailyTrend = DB::table('purchases')
            ->whereBetween('date', [$fromDate, $toDate])
            ->when($supplierId, function ($q) use ($supplierId) {
                return $q->where('supplier_id', $supplierId);
            })
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('SUM(net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top suppliers
        $topSuppliers = DB::table('purchases')
            ->join('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select(
                'accounts.title as name',
                DB::raw('SUM(purchases.net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_purchases' => $totalPurchases,
                'total_items' => $totalItems,
                'supplier_count' => $supplierCount,
                'average_purchase' => $averagePurchase,
                'purchase_count' => $purchases->count()
            ],
            'daily_trend' => $dailyTrend,
            'top_suppliers' => $topSuppliers,
            'purchases' => $purchases,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function purchaseReturnReport(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $supplierId = $request->input('supplier_id');

        $query = DB::table('purchase_returns')
            ->leftJoin('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate])
            ->select(
                'purchase_returns.*',
                'accounts.title as supplier_name'
            );

        if ($supplierId) {
            $query->where('purchase_returns.supplier_id', $supplierId);
        }

        $returns = $query->orderBy('purchase_returns.date', 'desc')->get();

        // Summary calculations
        $totalReturns = $returns->sum('net_total');
        $totalItems = $returns->sum('no_of_items');
        $supplierCount = $returns->unique('supplier_id')->count();
        $averageReturn = $returns->count() > 0 ? $totalReturns / $returns->count() : 0;

        // Daily trend
        $dailyTrend = DB::table('purchase_returns')
            ->whereBetween('date', [$fromDate, $toDate])
            ->when($supplierId, function ($q) use ($supplierId) {
                return $q->where('supplier_id', $supplierId);
            })
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('SUM(net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top suppliers by returns
        $topSuppliers = DB::table('purchase_returns')
            ->join('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate])
            ->select(
                'accounts.title as name',
                DB::raw('SUM(purchase_returns.net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_returns' => $totalReturns,
                'total_items' => $totalItems,
                'supplier_count' => $supplierCount,
                'average_return' => $averageReturn,
                'return_count' => $returns->count()
            ],
            'daily_trend' => $dailyTrend,
            'top_suppliers' => $topSuppliers,
            'returns' => $returns,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function salesReport(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $customerId = $request->input('customer_id');

        $query = DB::table('sales')
            ->leftJoin('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'sales.*',
                'accounts.title as customer_name'
            );

        if ($customerId) {
            $query->where('sales.customer_id', $customerId);
        }

        $sales = $query->orderBy('sales.date', 'desc')->get();

        // Summary calculations
        $totalSales = $sales->sum('net_total');
        $totalItems = $sales->sum('no_of_items');
        $customerCount = $sales->unique('customer_id')->count();
        $averageSale = $sales->count() > 0 ? $totalSales / $sales->count() : 0;

        // Daily trend
        $dailyTrend = DB::table('sales')
            ->whereBetween('date', [$fromDate, $toDate])
            ->when($customerId, function ($q) use ($customerId) {
                return $q->where('customer_id', $customerId);
            })
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('SUM(net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top customers
        $topCustomers = DB::table('sales')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'accounts.title as name',
                DB::raw('SUM(sales.net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_sales' => $totalSales,
                'total_items' => $totalItems,
                'customer_count' => $customerCount,
                'average_sale' => $averageSale,
                'sale_count' => $sales->count()
            ],
            'daily_trend' => $dailyTrend,
            'top_customers' => $topCustomers,
            'sales' => $sales,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function salesReturnReport(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $customerId = $request->input('customer_id');

        $query = DB::table('sales_returns')
            ->leftJoin('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->select(
                'sales_returns.*',
                'accounts.title as customer_name'
            );

        if ($customerId) {
            $query->where('sales_returns.customer_id', $customerId);
        }

        $returns = $query->orderBy('sales_returns.date', 'desc')->get();

        // Summary calculations
        $totalReturns = $returns->sum('net_total');
        $totalItems = $returns->sum('no_of_items');
        $customerCount = $returns->unique('customer_id')->count();
        $averageReturn = $returns->count() > 0 ? $totalReturns / $returns->count() : 0;

        // Daily trend
        $dailyTrend = DB::table('sales_returns')
            ->whereBetween('date', [$fromDate, $toDate])
            ->when($customerId, function ($q) use ($customerId) {
                return $q->where('customer_id', $customerId);
            })
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('SUM(net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top customers by returns
        $topCustomers = DB::table('sales_returns')
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->select(
                'accounts.title as name',
                DB::raw('SUM(sales_returns.net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_returns' => $totalReturns,
                'total_items' => $totalItems,
                'customer_count' => $customerCount,
                'average_return' => $averageReturn,
                'return_count' => $returns->count()
            ],
            'daily_trend' => $dailyTrend,
            'top_customers' => $topCustomers,
            'returns' => $returns,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }
}
