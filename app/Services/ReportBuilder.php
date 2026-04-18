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
    public function accountLedger($accountId, $fromDate = null, $toDate = null, $perPage = 50)
    {
        if ($accountId === 'ALL') {
             return [
                'opening_balance' => 0,
                'page_start_balance' => 0,
                'total_debit' => 0,
                'total_credit' => 0,
                'closing_balance' => 0,
                'balance_type' => 'dr',
                'data' => new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage),
                'from_date' => $fromDate,
                'to_date' => $toDate
            ];
        }

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
            ->selectRaw("'Sale' as type, id, date, CONCAT('Sale #', id) as description, net_total as debit, 0 as credit, created_at, NULL as cheque_no, NULL as cheque_date");

        $purchases = Purchase::where('supplier_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("'Purchase' as type, id, date, CONCAT('Purchase #', id) as description, 0 as debit, net_total as credit, created_at, NULL as cheque_no, NULL as cheque_date");

        // Determine which column to query in payments table
        $isAsset = in_array($account->type, [1, 2, 14]);

        $paymentColumn = $isAsset ? 'payment_account_id' : 'account_id';

        $payments = Payment::where($paymentColumn, $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->where('cheque_status', '!=', 'Canceled');

        if ($isAsset) {
            $payments->where(function($q) {
                $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                  ->orWhereNull('cheque_status')
                  ->orWhere('cheque_status', '')
                  ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
            });
            $payments->selectRaw("'Payment' as type, id, date, remarks as description, 
                CASE WHEN type = 'RECEIPT' THEN amount ELSE 0 END as debit,
                CASE WHEN type = 'RECEIPT' THEN 0 ELSE amount END as credit, created_at, cheque_no, cheque_date");
        } else {
            $payments->selectRaw("'Payment' as type, id, date, remarks as description, 
                CASE WHEN type = 'RECEIPT' THEN 0 ELSE (amount + discount) END as debit,
                CASE WHEN type = 'RECEIPT' THEN (amount + discount) ELSE 0 END as credit, created_at, cheque_no, cheque_date");
        }

        $salesReturns = SalesReturn::where('customer_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("'Sales Return' as type, id, date, CONCAT('Return #', id) as description, 0 as debit, net_total as credit, created_at, NULL as cheque_no, NULL as cheque_date");

        $purchaseReturns = PurchaseReturn::where('supplier_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("'Purchase Return' as type, id, date, CONCAT('Return #', id) as description, net_total as debit, 0 as credit, created_at, NULL as cheque_no, NULL as cheque_date");

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

    public function accountDetailLedger($accountId, $fromDate = null, $toDate = null, $perPage = 50)
    {
        // Get the base paginated ledger and totals
        $base = $this->accountLedger($accountId, $fromDate, $toDate, $perPage);
        
        $transactions = $base['data']->getCollection();
        
        $saleIds = [];
        $purchaseIds = [];
        $saleRetIds = [];
        $purchaseRetIds = [];
        $paymentIds = [];
        
        foreach($transactions as $txn) {
            if ($txn->type === 'Sale') $saleIds[] = $txn->id;
            elseif ($txn->type === 'Purchase') $purchaseIds[] = $txn->id;
            elseif ($txn->type === 'Sales Return') $saleRetIds[] = $txn->id;
            elseif ($txn->type === 'Purchase Return') $purchaseRetIds[] = $txn->id;
            elseif ($txn->type === 'Payment') $paymentIds[] = $txn->id;
        }
        
        // Eager load details
        $salesItems = count($saleIds) > 0 ? \App\Models\SalesItem::with('item')->whereIn('sale_id', $saleIds)->get()->groupBy('sale_id') : collect();
        $purchaseItems = count($purchaseIds) > 0 ? \App\Models\PurchaseItem::with('item')->whereIn('purchase_id', $purchaseIds)->get()->groupBy('purchase_id') : collect();
        $salesReturnItems = count($saleRetIds) > 0 ? \App\Models\SalesReturnItem::with('item')->whereIn('sales_return_id', $saleRetIds)->get()->groupBy('sales_return_id') : collect();
        $purchaseReturnItems = count($purchaseRetIds) > 0 ? \App\Models\PurchaseReturnItem::with('item')->whereIn('purchase_return_id', $purchaseRetIds)->get()->groupBy('purchase_return_id') : collect();
        $payments = count($paymentIds) > 0 ? \App\Models\Payment::whereIn('id', $paymentIds)->get()->keyBy('id') : collect();
        
        $enrichedData = [];
        
        foreach($transactions as $txn) {
            $details = collect();
            $voucherNo = $txn->id;
            $remarks = $txn->description;
            
            if ($txn->type === 'Sale') {
                $voucherNo = str_pad($txn->id, 6, '0', STR_PAD_LEFT);
                $details = $salesItems->get($txn->id) ?? collect();
            } elseif ($txn->type === 'Purchase') {
                $voucherNo = str_pad($txn->id, 6, '0', STR_PAD_LEFT);
                $details = $purchaseItems->get($txn->id) ?? collect();
            } elseif ($txn->type === 'Sales Return') {
                $voucherNo = 'SR-' . str_pad($txn->id, 6, '0', STR_PAD_LEFT);
                $details = $salesReturnItems->get($txn->id) ?? collect();
            } elseif ($txn->type === 'Purchase Return') {
                $voucherNo = 'PR-' . str_pad($txn->id, 6, '0', STR_PAD_LEFT);
                $details = $purchaseReturnItems->get($txn->id) ?? collect();
            } elseif ($txn->type === 'Payment') {
                $payment = $payments->get($txn->id);
                if ($payment) {
                    $prefix = $payment->type === 'RECEIPT' ? 'BR-' : 'BP-';
                    $voucherNo = $prefix . $txn->id;
                    $remarks = $payment->remarks ?: 'CASH IN HAND';
                }
            }
            
            // Map details to a standardized structure
            $mappedDetails = $details->map(function ($item) {
                 return [
                      'description' => $item->item->title ?? '',
                      'qty' => $item->total_pcs ?? 0,
                      'tp' => $item->trade_price ?? 0,
                      'disc' => $item->discount ?? 0,
                      'rate' => ($item->total_pcs ?? 0) > 0 ? round(($item->subtotal ?? 0) / $item->total_pcs, 2) : 0,
                 ];
            });
            
            $txn->voucher_no = $voucherNo;
            $txn->remarks = $remarks;
            $txn->details = $mappedDetails;
            
            $enrichedData[] = $txn;
        }
        
        $base['data']->setCollection(collect($enrichedData));
        return $base;
    }

    private function calculateBalanceChange($accountId, $fromDate, $toDate, $beforeId = null)
    {
        // Calculate sum of all transactions between fromDate and toDate
        // This is a simplified version that ignores the ID tie-breaking for now

        $sales = Sales::where('customer_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $purchases = Purchase::where('supplier_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');

        $account = Account::find($accountId);
        $isAsset = in_array($account->type, [1, 2, 14]);
        $paymentColumn = $isAsset ? 'payment_account_id' : 'account_id';

        $paymentsReceived = Payment::where($paymentColumn, $accountId)->whereBetween('date', [$fromDate, $toDate])->where('type', 'RECEIPT')->sum('amount');
        $paymentsPaid = Payment::where($paymentColumn, $accountId)->whereBetween('date', [$fromDate, $toDate])->where('type', 'PAYMENT')->sum('amount');

        $salesReturns = SalesReturn::where('customer_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $purchaseReturns = PurchaseReturn::where('supplier_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');

        $debit = $sales + $paymentsPaid + $purchaseReturns;
        $credit = $purchases + $paymentsReceived + $salesReturns;

        return $debit - $credit;
    }

    private function calculateOpeningBalance($accountId, $date, $orientation = 'dr')
    {
        $account = Account::find($accountId);
        $manualOpening = $account->opening_balance ?? 0;
        
        // Sum all transactions before $date
        $sales = Sales::where('customer_id', $accountId)->where('date', '<', $date)->sum('net_total');
        $purchases = Purchase::where('supplier_id', $accountId)->where('date', '<', $date)->sum('net_total');

        $isAsset = in_array($account->type, [1, 2, 14]);
        $paymentColumn = $isAsset ? 'payment_account_id' : 'account_id';

        $pQuery = Payment::where($paymentColumn, $accountId)->where('date', '<', $date)->where('cheque_status', '!=', 'Canceled');
        $salesReturns = SalesReturn::where('customer_id', $accountId)->where('date', '<', $date)->sum('net_total');
        $purchaseReturns = PurchaseReturn::where('supplier_id', $accountId)->where('date', '<', $date)->sum('net_total');

        if ($isAsset) {
            $pQuery->where(function($q) {
                $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                  ->orWhereNull('cheque_status')
                  ->orWhere('cheque_status', '')
                  ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
            });
            $debit = $pQuery->clone()->where('type', 'RECEIPT')->sum('amount');
            $credit = $pQuery->clone()->where('type', 'PAYMENT')->sum('amount');
        } else {
            $debit = $sales + $pQuery->clone()->where('type', 'PAYMENT')->sum(DB::raw('amount + discount')) + $purchaseReturns;
            $credit = $purchases + $pQuery->clone()->where('type', 'RECEIPT')->sum(DB::raw('amount + discount')) + $salesReturns;
        }

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
    }    public function accountAging($accountId = 'ALL', $toDate = null)
    {
        $toDate = $toDate ?? date('Y-m-d');
        
        $query = Account::select('accounts.id', 'accounts.title as party_name', 'accounts.type as type_id', 'accounts.sale', 'accounts.purchase')
            ->leftJoin('account_types', 'accounts.type', '=', 'account_types.id')
            ->addSelect('account_types.name as account_type')
            ->where(function($q) {
                $q->where('accounts.sale', 1)->orWhere('accounts.purchase', 1);
            });

        if ($accountId !== 'ALL') {
            $query->where('accounts.id', $accountId);
        }

        $accounts = $query->get();

        $data = $accounts->map(function ($account) use ($toDate) {
            // Determine the orientation (Customer=dr, Supplier=cr)
            // Priority: if sale=1, treat as Customer (dr)
            $orientation = $account->sale == 1 ? 'dr' : 'cr';
            
            $netBalance = $this->calculateOpeningBalance($account->id, date('Y-m-d', strtotime($toDate . ' +1 day')), $orientation);

            // Initial bucket values
            $buckets = [
                'days_01_30' => 0,
                'days_31_60' => 0,
                'days_61_90' => 0,
                'days_91_120' => 0,
                'days_121_150' => 0,
                'days_151_180_plus' => 0,
            ];

            // If trial balance is negative (credit for customer, debit for supplier), aging is 0
            if ($netBalance <= 0) {
                 return array_merge([
                    'party_name' => $account->party_name, 
                    'account_type' => $account->account_type ?? 'Uncategorized',
                    'total' => $netBalance, 
                    'trial_balance' => $netBalance
                 ], $buckets);
            }

            // Fetch transactions for aging
            $transactions = DB::table(function ($q) use ($account, $toDate) {
                $q->from('sales')->where('customer_id', $account->id)->where('date', '<=', $toDate)
                    ->select('date', 'net_total as debit', DB::raw('0 as credit'))
                    ->unionAll(
                        DB::table('purchases')->where('supplier_id', $account->id)->where('date', '<=', $toDate)
                        ->select('date', DB::raw('0 as debit'), 'net_total as credit')
                    )
                    ->unionAll(
                        DB::table('payments')->where('account_id', $account->id)->where('date', '<=', $toDate)
                        ->select('date', DB::raw('CASE WHEN type = "RECEIPT" THEN 0 ELSE amount END as debit'), DB::raw('CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END as credit'))
                    )
                    ->unionAll(
                        DB::table('sales_returns')->where('customer_id', $account->id)->where('date', '<=', $toDate)
                        ->select('date', DB::raw('0 as debit'), 'net_total as credit')
                    )
                    ->unionAll(
                        DB::table('purchase_returns')->where('supplier_id', $account->id)->where('date', '<=', $toDate)
                        ->select('date', 'net_total as debit', DB::raw('0 as credit'))
                    );
            }, 'temp')
            ->orderBy('date', 'desc')
            ->get();

            $remainingBalance = abs($netBalance);

            foreach ($transactions as $tx) {
                if ($remainingBalance <= 0) break;

                // For aging, we only care about the transactions that ADD to the balance type
                // Customer (dr): only Sales/Returns that increase balance
                $amt = ($orientation === 'dr') ? ($tx->debit - $tx->credit) : ($tx->credit - $tx->debit);
                
                if ($amt <= 0) continue;

                $days = (strtotime($toDate) - strtotime($tx->date)) / (60 * 60 * 24);
                $applicable = min($remainingBalance, $amt);

                if ($days <= 30) $buckets['days_01_30'] += $applicable;
                elseif ($days <= 60) $buckets['days_31_60'] += $applicable;
                elseif ($days <= 90) $buckets['days_61_90'] += $applicable;
                elseif ($days <= 120) $buckets['days_91_120'] += $applicable;
                elseif ($days <= 150) $buckets['days_121_150'] += $applicable;
                else $buckets['days_151_180_plus'] += $applicable;

                $remainingBalance -= $applicable;
            }

            // If there's still balance left but no transactions found (or very old opening balance), put it in the oldest bucket
            if ($remainingBalance > 0) {
                $buckets['days_151_180_plus'] += $remainingBalance;
            }

            return array_merge([
                'party_name' => $account->party_name,
                'account_type' => $account->account_type ?? 'Uncategorized',
                'total' => $netBalance,
                'trial_balance' => $netBalance
            ], $buckets);
        });

        return $data->values();
    }

    public function dueBills($accountId = 'ALL', $toDate = null)
    {
        $toDate = $toDate ?? date('Y-m-d');
        
        $query = Sales::with(['customer' => function($q) {
                $q->select('id', 'title', 'aging_days', 'credit_limit');
            }])
            ->where('remaining_amount', '>', 0);
            
        if ($accountId !== 'ALL' && !empty($accountId)) {
            $query->where('customer_id', $accountId);
        }
        
        if (!empty($toDate)) {
             $query->whereDate('date', '<=', $toDate);
        }
        
        $sales = $query->orderBy('date', 'asc')->get();
        
        $bills = $sales->map(function($sale) use ($toDate) {
            $agingDays = (int)($sale->customer->aging_days ?? 0);
            $dueDate = \Carbon\Carbon::parse($sale->date)->addDays($agingDays);
            $asOn = \Carbon\Carbon::parse($toDate);

            $daysCalc = $dueDate->diffInDays($asOn, false);
            $days = (int) $daysCalc;
            
            return [
                'date' => $sale->date,
                'voucher_no' => str_pad($sale->invoice ?? $sale->id, 6, "0", STR_PAD_LEFT),
                'party_name' => $sale->customer->title ?? 'Unknown',
                'customer_id' => $sale->customer_id,
                'due_date' => $dueDate->format('Y-m-d'),
                'days' => $days,
                'bill_amt' => (float)$sale->net_total,
                'paid' => (float)$sale->paid_amount,
                'remaining' => (float)$sale->remaining_amount,
                'credit_days' => $agingDays,
                'credit_limit' => (float)($sale->customer->credit_limit ?? 0)
            ];
        });

        $grouped = $bills->groupBy('customer_id');
        
        $finalData = [];
        
        foreach ($grouped as $customerId => $customerBills) {
            $sortedBills = $customerBills->sortBy('date')->values();
            
            $cumulativeBalance = 0;
            $partyUnDueAmount = 0;
            $partyDueAmount = 0;
            
            foreach ($sortedBills as $index => $bill) {
                $rem = $bill['remaining'];
                $cumulativeBalance += $rem;
                
                $bill['balance'] = $cumulativeBalance;
                
                if ($bill['days'] > 0) {
                    $partyDueAmount += $rem;
                } else {
                    $partyUnDueAmount += $rem;
                }
                
                $finalData[] = $bill;
            }
            
            if (count($finalData) > 0) {
                $lastIndex = count($finalData) - 1;
                $finalData[$lastIndex]['is_last_for_customer'] = true;
                $finalData[$lastIndex]['party_summary'] = [
                    'party_un_due_amount' => $partyUnDueAmount,
                    'party_due_amount' => $partyDueAmount,
                    'credit_days' => $finalData[$lastIndex]['credit_days'],
                    'credit_limit' => $finalData[$lastIndex]['credit_limit'],
                ];
            }
        }
        
        usort($finalData, function($a, $b) {
            $cmp = strcmp($a['party_name'], $b['party_name']);
            if ($cmp === 0) {
                return strtotime($a['date']) - strtotime($b['date']);
            }
            return $cmp;
        });

        return collect($finalData);
    }

    public function dayBook($fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d');
        $toDate = $toDate ?? date('Y-m-d');

        // 1. Stock Summary
        $openingStock = $this->calculateStockOpeningAll($fromDate);
        
        // Sum of inward (Purchase + Sales Return)
        $inward = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->sum('total_pcs') +
            DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->sum('total_pcs');

        // Sum of outward (Sales + Purchase Return)
        $outward = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->sum('total_pcs') +
            DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate])
            ->sum('total_pcs');

        $closingStockQty = $openingStock + $inward - $outward;
        
        // Items and their current value
        $items = $this->stockStatus(new Request());
        $totalStockValue = $items->sum(function($item) {
            return $item['current_stock'] * $item['price_loose'];
        });

        // 2. Cash Summary (AccountType 1)
        $cashAccounts = Account::where('type', 1)->pluck('id');
        $cashSummary = $this->getAccountGroupSummary($cashAccounts, $fromDate, $toDate, 'dr');

        // 3. Cheque Summary (AccountType 14)
        $chequeAccounts = Account::where('type', 14)->pluck('id');
        $chequeSummary = $this->getAccountGroupSummary($chequeAccounts, $fromDate, $toDate, 'dr');

        // 4. Bank Summary (AccountType 2)
        $bankAccounts = Account::where('type', 2)->get();
        $bankDetails = [];
        foreach ($bankAccounts as $bank) {
            $summary = $this->getAccountGroupSummary([$bank->id], $fromDate, $toDate, 'dr');
            $bankDetails[] = [
                'name' => $bank->title,
                'opening' => $summary['opening'],
                'receipts' => $summary['receiving'],
                'payments' => $summary['payment'],
                'closing' => $summary['closing']
            ];
        }
        $bankSummaryOverall = $this->getAccountGroupSummary($bankAccounts->pluck('id'), $fromDate, $toDate, 'dr');

        // 5. Receivables/Payables (Type 3 and 6)
        $customerAccounts = Account::where('type', 3)->pluck('id');
        $supplierAccounts = Account::where('type', 6)->pluck('id');
        
        $receivableSummary = $this->getAccountGroupSummary($customerAccounts, $fromDate, $toDate, 'dr');
        $payableSummary = $this->getAccountGroupSummary($supplierAccounts, $fromDate, $toDate, 'cr');

        // 6. Purchases/Sales
        $salesSum = DB::table('sales')->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $salesReturnSum = DB::table('sales_returns')->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $purchasesSum = DB::table('purchases')->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $purchaseReturnSum = DB::table('purchase_returns')->whereBetween('date', [$fromDate, $toDate])->sum('net_total');

        // 7. Profit Calculation
        $profitData = $this->profit(new Request(['from' => $fromDate, 'to' => $toDate]));
        $profit = $profitData['summary']['profit'] ?? 0;

        // Capital (Type 9)
        $capitalAccounts = Account::where('type', 9)->pluck('id');
        $capitalSummary = $this->getAccountGroupSummary($capitalAccounts, $fromDate, $toDate, 'cr');

        // Total DR / Total CR (Optimized Trial Balance calculation)
        $trialBalance = $this->calculateTrialBalanceTotals($toDate);
        $totalDR = $trialBalance['dr'];
        $totalCR = $trialBalance['cr'];


        return [
            'stock' => [
                'opening' => (float)$openingStock,
                'in' => (float)$inward,
                'out' => (float)$outward,
                'closing' => (float)$closingStockQty,
                'closing_amt' => (float)$totalStockValue
            ],
            'cash' => [
                'opening' => (float)$cashSummary['opening'],
                'receiving' => (float)$cashSummary['receiving'],
                'payment' => (float)$cashSummary['payment'],
                'closing' => (float)$cashSummary['closing']
            ],
            'cheque' => [
                'opening' => (float)$chequeSummary['opening'],
                'receiving' => (float)$chequeSummary['receiving'],
                'payment' => (float)$chequeSummary['payment'],
                'closing' => (float)$chequeSummary['closing']
            ],
            'bank' => [
                'details' => $bankDetails,
                'summary' => [
                    'opening' => (float)$bankSummaryOverall['opening'],
                    'receiving' => (float)$bankSummaryOverall['receiving'],
                    'payment' => (float)$bankSummaryOverall['payment'],
                    'closing' => (float)$bankSummaryOverall['closing']
                ]
            ],
            'financial' => [
                'day_receivable' => (float)($salesSum - $salesReturnSum),
                'total_receivable' => (float)$receivableSummary['closing'],
                'total_dr' => (float)$totalDR,
                'day_payable' => (float)($purchasesSum - $purchaseReturnSum),
                'total_payable' => (float)$payableSummary['closing'],
                'capital' => (float)$capitalSummary['closing'],
                'total_cr' => (float)$totalCR,
                'profit' => (float)$profit,
                'roi' => $totalStockValue > 0 ? (float)round(($profit / $totalStockValue) * 100, 2) : 0
            ],

            'trade' => [
                'purchase' => (float)$purchasesSum,
                'purchase_return' => (float)$purchaseReturnSum,
                'net_purchase' => (float)($purchasesSum - $purchaseReturnSum),
                'sale' => (float)$salesSum,
                'sales_return' => (float)$salesReturnSum,
                'net_sale' => (float)($salesSum - $salesReturnSum)
            ],
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    private function calculateStockOpeningAll($date)
    {
        $purchased = DB::table('purchase_items')->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')->where('date', '<', $date)->sum('total_pcs');
        $sold = DB::table('sales_items')->join('sales', 'sales_items.sale_id', '=', 'sales.id')->where('date', '<', $date)->sum('total_pcs');
        $pRet = DB::table('purchase_return_items')->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')->where('date', '<', $date)->sum('total_pcs');
        $sRet = DB::table('sales_return_items')->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')->where('date', '<', $date)->sum('total_pcs');
        return ($purchased - $pRet) - ($sold - $sRet);
    }

    private function getAccountGroupSummary($accountIds, $fromDate, $toDate, $orientation = 'dr')
    {
        if (empty($accountIds) || (is_countable($accountIds) && count($accountIds) === 0)) {
            return [
                'opening' => 0,
                'receiving' => 0,
                'payment' => 0,
                'closing' => 0
            ];
        }

        $opening = 0;

        foreach ($accountIds as $id) {
            $opening += $this->calculateOpeningBalance($id, $fromDate, $orientation);
        }

        // For Banks (Type 2), Cash (Type 1), and Cheques (Type 14), we must query 'payment_account_id'
        $firstAccount = Account::find($accountIds[0]);
        $isAsset = in_array($firstAccount->type, [1, 2, 14]);
        $column = $isAsset ? 'payment_account_id' : 'account_id';

        $payments = DB::table('payments')
            ->whereIn($column, $accountIds)
            ->whereBetween('date', [$fromDate, $toDate])
            ->selectRaw("SUM(CASE WHEN type = 'RECEIPT' THEN amount ELSE 0 END) as receiving,
                         SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE 0 END) as payment")
            ->first();


        $receiving = (float)($payments->receiving ?? 0);
        $payment = (float)($payments->payment ?? 0);

        // Determine adjustment based on account type
        // For Banks (Type 2) and Cash (Type 1), Receiving increases balance (Debit)
        // Check first account type in group (assuming groups are homogeneous)
        $firstAccount = Account::find($accountIds[0]);
        $isAsset = in_array($firstAccount->type, [1, 2, 14]);

        if ($orientation === 'cr') {
            $closing = $opening + ($receiving - $payment);
        } else {
            // If it's a Bank/Cash asset, receiving increases. If it's a Customer receivable, receiving decreases.
            if ($isAsset) {
                $closing = $opening + ($receiving - $payment);
            } else {
                $closing = $opening + ($payment - $receiving);
            }
        }


        return [
            'opening' => $opening,
            'receiving' => $receiving,
            'payment' => $payment,
            'closing' => $closing
        ];
    }

    private function calculateTrialBalanceTotals($toDate)
    {
        $toDate = $toDate ?? date('Y-m-d');
        
        $accounts = Account::select('id', 'opening_balance', 'purchase')->get();
        
        $sales = Sales::where('date', '<=', $toDate)->groupBy('customer_id')->selectRaw('customer_id, SUM(net_total) as total')->pluck('total', 'customer_id');
        $purchases = Purchase::where('date', '<=', $toDate)->groupBy('supplier_id')->selectRaw('supplier_id, SUM(net_total) as total')->pluck('total', 'supplier_id');
        $payments = Payment::where('date', '<=', $toDate)->groupBy('account_id')
            ->selectRaw('account_id, 
                SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts, 
                SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
            ->get()->keyBy('account_id');
            
        $salesReturns = SalesReturn::where('date', '<=', $toDate)->groupBy('customer_id')->selectRaw('customer_id, SUM(net_total) as total')->pluck('total', 'customer_id');
        $purchaseReturns = PurchaseReturn::where('date', '<=', $toDate)->groupBy('supplier_id')->selectRaw('supplier_id, SUM(net_total) as total')->pluck('total', 'supplier_id');
        
        $totalDR = 0;
        $totalCR = 0;
        
        foreach ($accounts as $acc) {
            $id = $acc->id;
            
            // Correct debit/credit logic and column mapping based on account type
            if (in_array($acc->type, [1, 2, 14])) {
                // Bank/Cash logic - Use payment_account_id
                $payStats = DB::table('payments')->where('payment_account_id', $id)
                    ->where('date', '<=', $toDate)
                    ->selectRaw('SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts, 
                                 SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
                    ->first();
                $debit = $payStats->receipts ?? 0;
                $credit = $payStats->payments ?? 0;
            } else {
                // Customer/Supplier logic - Use account_id (already in $payments variable from above)
                $debit = ($sales->get($id) ?? 0) + ($payments->get($id)->payments ?? 0) + ($purchaseReturns->get($id) ?? 0);
                $credit = ($purchases->get($id) ?? 0) + ($payments->get($id)->receipts ?? 0) + ($salesReturns->get($id) ?? 0);
            }

            
            if ($acc->purchase == 1) {
                $bal = $acc->opening_balance + ($credit - $debit);
                if ($bal >= 0) $totalCR += $bal; else $totalDR += abs($bal);
            } else {
                $bal = $acc->opening_balance + ($debit - $credit);
                if ($bal >= 0) $totalDR += $bal; else $totalCR += abs($bal);
            }

        }
        
        return ['dr' => $totalDR, 'cr' => $totalCR];
    }

    public function outstandingBillWise($accountId = 'ALL', $fromDate = null, $toDate = null, $params = [])
    {
        $toDate = $toDate ?? date('Y-m-d');
        
        $applyFilters = function($query, $partyRel, $params) {
            $query->whereHas($partyRel, function($q) use ($params) {
                if (isset($params['areaId']) && $params['areaId'] !== 'ALL') {
                    $q->where('area_id', $params['areaId']);
                }
                if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
                    $q->where('saleman_id', $params['salemanId']);
                }
                if (isset($params['subareaId']) && $params['subareaId'] !== 'ALL') {
                    $q->where('subarea_id', $params['subareaId']);
                }
                if (isset($params['type']) && $params['type'] !== 'ALL' && !in_array($params['type'], ['Receivable', 'Payable'])) {
                    $q->where('type', $params['type']);
                }
                if (isset($params['noteHead']) && $params['noteHead'] !== 'ALL') {
                    $q->where('note_head', $params['noteHead']);
                }
                if (isset($params['category']) && $params['category'] !== 'ALL') {
                    $q->where('category', $params['category']);
                }
            });

            if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
                $query->where('firm_id', $params['firmId']);
            }
        };

        $unifiedResults = collect();
        $targetParty = $accountId !== 'ALL' ? Account::find($accountId) : null;

        // 1. Fetch Sales (Receivables)
        $includeSales = ($accountId === 'ALL') || ($targetParty && $targetParty->sale == 1);
        if ($includeSales) {
            $salesQuery = Sales::with(['customer' => function($q) {
                $q->select('id', 'title', 'aging_days', 'credit_limit');
            }])->where('remaining_amount', '>', 0);
            
            if ($accountId !== 'ALL') $salesQuery->where('customer_id', $accountId);
            if (!empty($fromDate)) $salesQuery->whereDate('date', '>=', $fromDate);
            if (!empty($toDate)) $salesQuery->whereDate('date', '<=', $toDate);
            
            $applyFilters($salesQuery, 'customer', $params);
            
            $sales = $salesQuery->get()->map(function($bill) use ($toDate) {
                return $this->formatBillDataIntoUnified($bill, 'customer', $toDate, 'receivable');
            });
            $unifiedResults = $unifiedResults->merge($sales);
        }

        // 2. Fetch Purchases (Payables)
        $includePurchases = ($accountId === 'ALL') || ($targetParty && $targetParty->purchase == 1);
        if ($includePurchases) {
            $purchaseQuery = Purchase::with(['supplier' => function($q) {
                $q->select('id', 'title', 'aging_days', 'credit_limit');
            }])->where('remaining_amount', '>', 0);
            
            if ($accountId !== 'ALL') $purchaseQuery->where('supplier_id', $accountId);
            if (!empty($fromDate)) $purchaseQuery->whereDate('date', '>=', $fromDate);
            if (!empty($toDate)) $purchaseQuery->whereDate('date', '<=', $toDate);
            
            $applyFilters($purchaseQuery, 'supplier', $params);
            
            $purchases = $purchaseQuery->get()->map(function($bill) use ($toDate) {
                return $this->formatBillDataIntoUnified($bill, 'supplier', $toDate, 'payable');
            });
            $unifiedResults = $unifiedResults->merge($purchases);
        }

        // 3. Group and Process
        $grouped = $unifiedResults->groupBy('party_id');
        $finalData = [];

        foreach ($grouped as $partyId => $partyBills) {
            $sortedBills = $partyBills->sortBy('date')->values();
            $cumulativeBalance = 0;
            $partyUnDueAmount = 0;
            $partyDueAmount = 0;
            
            foreach ($sortedBills as $index => $bill) {
                $rem = $bill['remaining'];
                $cumulativeBalance += $rem;
                $bill['balance'] = $cumulativeBalance;
                
                if ($bill['days'] > 0) $partyDueAmount += $rem;
                else $partyUnDueAmount += $rem;
                
                $finalData[] = $bill;
            }
            
            if (count($finalData) > 0) {
                $lastIndex = count($finalData) - 1;
                $finalData[$lastIndex]['is_last_for_party'] = true;
                $finalData[$lastIndex]['party_summary'] = [
                    'party_un_due_amount' => $partyUnDueAmount,
                    'party_due_amount' => $partyDueAmount,
                    'credit_days' => $finalData[$lastIndex]['credit_days'],
                    'credit_limit' => $finalData[$lastIndex]['credit_limit'],
                    'party_type' => $finalData[$lastIndex]['bill_type']
                ];
            }
        }

        // Global Sort: Party Name -> Date
        usort($finalData, function($a, $b) {
            $nameCmp = strcmp($a['party_name'], $b['party_name']);
            if ($nameCmp !== 0) return $nameCmp;
            return strtotime($a['date']) - strtotime($b['date']);
        });

        return collect($finalData);
    }

    private function formatBillDataIntoUnified($bill, $partyRel, $toDate, $type)
    {
        $party = $bill->{$partyRel};
        $agingDays = (int)($party->aging_days ?? 0);
        $dueDate = \Carbon\Carbon::parse($bill->date)->addDays($agingDays);
        $asOn = \Carbon\Carbon::parse($toDate);
        $days = (int) $dueDate->diffInDays($asOn, false);
        
        return [
            'date' => $bill->date,
            'voucher_no' => str_pad($bill->invoice ?? $bill->id, 6, "0", STR_PAD_LEFT),
            'bill_type' => $type,
            'party_name' => $party->title ?? 'Unknown',
            'party_id' => $bill->{$partyRel . '_id'},
            'due_date' => $dueDate->format('Y-m-d'),
            'days' => $days,
            'bill_amt' => (float)$bill->net_total,
            'paid' => (float)$bill->paid_amount,
            'remaining' => (float)$bill->remaining_amount,
            'credit_days' => $agingDays,
            'credit_limit' => (float)($party->credit_limit ?? 0)
        ];
    }

    /**
     * Generate detailed payment report for a specific period.
     */
    public function paymentDetail($accountId = null, $fromDate = null, $toDate = null)
    {
        return $this->processPaymentReport('PAYMENT', $accountId, $fromDate, $toDate);
    }

    /**
     * Generate detailed receiving report for a specific period.
     */
    public function receivingDetail($accountId = null, $fromDate = null, $toDate = null)
    {
        return $this->processPaymentReport('RECEIPT', $accountId, $fromDate, $toDate);
    }

    /**
     * Internal helper to process payment/receipt reports.
     */
    private function processPaymentReport($type, $accountId = null, $fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $query = Payment::with(['account', 'paymentAccount'])
            ->where('type', $type)
            ->whereBetween('date', [$fromDate, $toDate]);

        if ($accountId && $accountId !== 'ALL') {
            $query->where('account_id', $accountId);
        }

        $payments = $query->orderBy('date')->orderBy('created_at')->get();

        // Efficiently compute balances for all parties involved up to $toDate
        $partyIds = $payments->pluck('account_id')->unique()->filter()->toArray();
        $partyBalances = [];
        
        if (!empty($partyIds)) {
            $sales = Sales::whereIn('customer_id', $partyIds)->where('date', '<=', $toDate)
                ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
                
            $purchases = Purchase::whereIn('supplier_id', $partyIds)->where('date', '<=', $toDate)
                ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

            $paymentsRec = Payment::whereIn('account_id', $partyIds)->where('date', '<=', $toDate)->where('type', 'RECEIPT')
                ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');
                
            $paymentsPaid = Payment::whereIn('account_id', $partyIds)->where('date', '<=', $toDate)->where('type', 'PAYMENT')
                ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');

            $salesReturns = SalesReturn::whereIn('customer_id', $partyIds)->where('date', '<=', $toDate)
                ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
                
            $purchaseReturns = PurchaseReturn::whereIn('supplier_id', $partyIds)->where('date', '<=', $toDate)
                ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

            foreach($partyIds as $pid) {
                $dr = (float)($sales[$pid] ?? 0) + (float)($paymentsPaid[$pid] ?? 0) + (float)($purchaseReturns[$pid] ?? 0);
                $cr = (float)($purchases[$pid] ?? 0) + (float)($paymentsRec[$pid] ?? 0) + (float)($salesReturns[$pid] ?? 0);
                $partyBalances[$pid] = ['dr' => $dr, 'cr' => $cr];
            }
        }

        return $payments->map(function ($p) use ($type, $partyBalances) {
            $prefix = $type === 'PAYMENT' ? 'BP-' : 'CR-';
            $accId = $p->account_id;
            
            $net = 0;
            if ($accId && isset($partyBalances[$accId])) {
                $opening = (float)($p->account->opening_balance ?? 0);
                // Calculate Net Balance: Opening + Net Debit - Net Credit
                $balData = $partyBalances[$accId];
                $net = $opening + $balData['dr'] - $balData['cr'];
            }

            return [
                'id' => $p->id,
                'voucher_no' => $p->voucher_no ?: $prefix . str_pad($p->id, 5, '0', STR_PAD_LEFT),
                'date' => $p->date,
                'party_name' => $p->account->title ?? 'Unknown',
                'bank_name' => $p->paymentAccount->title ?? 'N/A',
                'amount' => (float)$p->amount,
                'balance' => $net,
                'remarks' => $p->remarks ?? ''
            ];
        });
    }

    /**
     * Generate a summary of all Receivables (Accounts with Net Debit Balance)
     */
    public function receivables($toDate = null, $filters = [])
    {
        return $this->aggregateAccountBalances($toDate, 'debit', $filters);
    }

    /**
     * Generate a summary of all Payables (Accounts with Net Credit Balance)
     */
    public function payables($toDate = null, $filters = [])
    {
        return $this->aggregateAccountBalances($toDate, 'credit', $filters);
    }

    /**
     * Generate a complete Summary (Trial Balance) for all selected accounts
     */
    public function summary($toDate = null, $filters = [])
    {
        return $this->aggregateAccountBalances($toDate, 'all', $filters);
    }

    /**
     * Generate the complete Trial Balance 2 Column (includes Financial Assets).
     */
    public function trialBalance($toDate = null, $filters = [])
    {
        return $this->aggregateAccountBalances($toDate, 'all', $filters, false);
    }

    /**
     * Generate 6 Column Trial Balance
     */
    public function trialBalance6Col($fromDate = null, $toDate = null, $filters = [])
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $accountQuery = Account::with('accountType');
        
        if (!empty($filters['area_id'])) $accountQuery->where('area_id', $filters['area_id']);
        if (!empty($filters['saleman_id'])) $accountQuery->where('saleman_id', $filters['saleman_id']);
        if (!empty($filters['category_id'])) $accountQuery->where('category', $filters['category_id']);

        $accounts = $accountQuery->get();
        $accountIds = $accounts->pluck('id')->toArray();

        // --- OPENING BALANCES (Before FROM DATE) ---
        $openSales = Sales::whereIn('customer_id', $accountIds)->where('date', '<', $fromDate)
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $openPurchases = Purchase::whereIn('supplier_id', $accountIds)->where('date', '<', $fromDate)
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');
        
        $openPaymentsRec = Payment::whereIn('account_id', $accountIds)->where('date', '<', $fromDate)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled')
            ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');
        $openPaymentsPaid = Payment::whereIn('account_id', $accountIds)->where('date', '<', $fromDate)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled')
            ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');

        $openSalesReturns = SalesReturn::whereIn('customer_id', $accountIds)->where('date', '<', $fromDate)
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $openPurchaseReturns = PurchaseReturn::whereIn('supplier_id', $accountIds)->where('date', '<', $fromDate)
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

        $openAssetPayments = DB::table('payments')
            ->whereIn('payment_account_id', $accountIds)->where('date', '<', $fromDate)
            ->where('cheque_status', '!=', 'Canceled')
            ->where(function($q) {
                $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                  ->orWhereNull('cheque_status')
                  ->orWhere('cheque_status', '')
                  ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
            })
            ->groupBy('payment_account_id')
            ->selectRaw('payment_account_id, SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts, SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
            ->get()->keyBy('payment_account_id');

        // --- PERIOD TRANSACTIONS (Between FROM DATE and TO DATE) ---
        $rangeSales = Sales::whereIn('customer_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $rangePurchases = Purchase::whereIn('supplier_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');
        
        $rangePaymentsRec = Payment::whereIn('account_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled')
            ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');
        $rangePaymentsPaid = Payment::whereIn('account_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled')
            ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');

        $rangeSalesReturns = SalesReturn::whereIn('customer_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $rangePurchaseReturns = PurchaseReturn::whereIn('supplier_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

        $rangeAssetPayments = DB::table('payments')
            ->whereIn('payment_account_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])
            ->where('cheque_status', '!=', 'Canceled')
            ->where(function($q) {
                $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                  ->orWhereNull('cheque_status')
                  ->orWhere('cheque_status', '')
                  ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
            })
            ->groupBy('payment_account_id')
            ->selectRaw('payment_account_id, SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts, SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
            ->get()->keyBy('payment_account_id');

        $results = [];

        foreach ($accounts as $acc) {
            $id = $acc->id;

            // 1. Calculate Opening Balance
            if (in_array($acc->type, [1, 2, 14])) {
                $payStatsOpen = $openAssetPayments->get($id);
                $openDrRaw = $payStatsOpen->receipts ?? 0;
                $openCrRaw = $payStatsOpen->payments ?? 0;
                
                $openBal = $acc->opening_balance + ($openDrRaw - $openCrRaw);
                $openDr = $openBal >= 0 ? $openBal : 0;
                $openCr = $openBal < 0 ? abs($openBal) : 0;
            } else {
                $openDrRaw = (float)($openSales[$id] ?? 0) + (float)($openPaymentsPaid[$id] ?? 0) + (float)($openPurchaseReturns[$id] ?? 0);
                $openCrRaw = (float)($openPurchases[$id] ?? 0) + (float)($openPaymentsRec[$id] ?? 0) + (float)($openSalesReturns[$id] ?? 0);
                
                if ($acc->purchase == 1) { // Payable oriented
                    $openBal = $acc->opening_balance + ($openCrRaw - $openDrRaw);
                    $openDr = $openBal < 0 ? abs($openBal) : 0;
                    $openCr = $openBal >= 0 ? $openBal : 0;
                } else { // Receivable oriented
                    $openBal = $acc->opening_balance + ($openDrRaw - $openCrRaw);
                    $openDr = $openBal >= 0 ? $openBal : 0;
                    $openCr = $openBal < 0 ? abs($openBal) : 0;
                }
            }

            // 2. Calculate Period Transactions
            if (in_array($acc->type, [1, 2, 14])) {
                $payStatsRange = $rangeAssetPayments->get($id);
                $periodDr = (float)($payStatsRange->receipts ?? 0);
                $periodCr = (float)($payStatsRange->payments ?? 0);
            } else {
                $periodDr = (float)($rangeSales[$id] ?? 0) + (float)($rangePaymentsPaid[$id] ?? 0) + (float)($rangePurchaseReturns[$id] ?? 0);
                $periodCr = (float)($rangePurchases[$id] ?? 0) + (float)($rangePaymentsRec[$id] ?? 0) + (float)($rangeSalesReturns[$id] ?? 0);
            }

            // 3. Calculate Closing Balance
            if (in_array($acc->type, [1, 2, 14]) || $acc->purchase != 1) { // Debit oriented
                $closeBal = $openDr - $openCr + $periodDr - $periodCr;
                $closeDr = $closeBal >= 0 ? $closeBal : 0;
                $closeCr = $closeBal < 0 ? abs($closeBal) : 0;
            } else { // Credit oriented (Suppliers)
                $closeBal = $openCr - $openDr + $periodCr - $periodDr;
                $closeDr = $closeBal < 0 ? abs($closeBal) : 0;
                $closeCr = $closeBal >= 0 ? $closeBal : 0;
            }

            // Show row if it has any activity or balance
            if (round($openDr, 2) > 0 || round($openCr, 2) > 0 || 
                round($periodDr, 2) > 0 || round($periodCr, 2) > 0 || 
                round($closeDr, 2) > 0 || round($closeCr, 2) > 0) {
                
                $results[] = [
                    'id' => $id,
                    'code' => $acc->code,
                    'title' => $acc->title,
                    'type_name' => str_replace('s', '', strtoupper($acc->accountType->name ?? 'Account')),
                    'opening_dr' => round($openDr, 2),
                    'opening_cr' => round($openCr, 2),
                    'period_dr' => round($periodDr, 2),
                    'period_cr' => round($periodCr, 2),
                    'closing_dr' => round($closeDr, 2),
                    'closing_cr' => round($closeCr, 2),
                ];
            }
        }

        return collect($results)->sortBy('title')->values();
    }

    /**
     * Core logic to aggregate net balances for all relevant accounts.
     */
    private function aggregateAccountBalances($toDate, $filterType = 'debit', $filters = [], $excludeAssets = true)
    {
        $toDate = $toDate ?? date('Y-m-d');

        // 1. Fetch relevant accounts
        $accountQuery = Account::with('accountType');
            
        if ($excludeAssets) {
            $accountQuery->whereNotIn('type', [1, 2, 14]); // Exclude Cash/Bank/Cheque
        }

        if (!empty($filters['area_id'])) $accountQuery->where('area_id', $filters['area_id']);
        if (!empty($filters['saleman_id'])) $accountQuery->where('saleman_id', $filters['saleman_id']);
        if (!empty($filters['category_id'])) $accountQuery->where('category', $filters['category_id']);

        $accounts = $accountQuery->get();
        $accountIds = $accounts->pluck('id')->toArray();

        // 2. Aggregate Transactions in bulk to avoid N+1 issues
        $sales = Sales::whereIn('customer_id', $accountIds)->where('date', '<=', $toDate)
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
            
        $purchases = Purchase::whereIn('supplier_id', $accountIds)->where('date', '<=', $toDate)
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

        $paymentsRec = Payment::whereIn('account_id', $accountIds)->where('date', '<=', $toDate)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled')
            ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');
            
        $paymentsPaid = Payment::whereIn('account_id', $accountIds)->where('date', '<=', $toDate)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled')
            ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');

        $salesReturns = SalesReturn::whereIn('customer_id', $accountIds)->where('date', '<=', $toDate)
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
            
        $purchaseReturns = PurchaseReturn::whereIn('supplier_id', $accountIds)->where('date', '<=', $toDate)
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

        $assetPayments = collect([]);
        if (!$excludeAssets) {
            $assetPayments = DB::table('payments')
                ->whereIn('payment_account_id', $accountIds)
                ->where('date', '<=', $toDate)
                ->where('cheque_status', '!=', 'Canceled')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
                })
                ->groupBy('payment_account_id')
                ->selectRaw('payment_account_id, SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts, SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
                ->get()->keyBy('payment_account_id');
        }

        $results = [];
        foreach ($accounts as $acc) {
            $id = $acc->id;
            
            if (!$excludeAssets && in_array($acc->type, [1, 2, 14])) {
                $payStats = $assetPayments->get($id);
                // Receiving money to cash means Dr.
                $dr = $payStats->receipts ?? 0;
                $cr = $payStats->payments ?? 0;
                
                $bal = $acc->opening_balance + ($dr - $cr);
                if ($bal >= 0) {
                    $debit = $bal; $credit = 0;
                } else {
                    $debit = 0; $credit = abs($bal);
                }
            } else {
                $dr = (float)($sales[$id] ?? 0) + (float)($paymentsPaid[$id] ?? 0) + (float)($purchaseReturns[$id] ?? 0);
                $cr = (float)($purchases[$id] ?? 0) + (float)($paymentsRec[$id] ?? 0) + (float)($salesReturns[$id] ?? 0);
                
                if ($acc->purchase == 1) { // Payable oriented
                    $bal = $acc->opening_balance + ($cr - $dr);
                    if ($bal >= 0) { $debit = 0; $credit = $bal; } 
                    else { $debit = abs($bal); $credit = 0; }
                } else { // Receivable oriented
                    $bal = $acc->opening_balance + ($dr - $cr);
                    if ($bal >= 0) { $debit = $bal; $credit = 0; } 
                    else { $debit = 0; $credit = abs($bal); }
                }
            }

            if ($filterType === 'debit' && round($debit, 2) > 0) {
                $results[] = [
                    'id' => $id,
                    'title' => $acc->title,
                    'type_name' => str_replace('s', '', strtoupper($acc->accountType->name ?? 'Account')),
                    'debit' => round($debit, 2),
                    'credit' => 0
                ];
            } elseif ($filterType === 'credit' && round($credit, 2) > 0) {
                $results[] = [
                    'id' => $id,
                    'title' => $acc->title,
                    'type_name' => str_replace('s', '', strtoupper($acc->accountType->name ?? 'Account')),
                    'debit' => 0,
                    'credit' => round($credit, 2)
                ];
            } elseif ($filterType === 'all' && (round($debit, 2) > 0 || round($credit, 2) > 0)) {
                $results[] = [
                    'id' => $id,
                    'title' => $acc->title,
                    'type_name' => str_replace('s', '', strtoupper($acc->accountType->name ?? 'Account')),
                    'debit' => round($debit, 2),
                    'credit' => round($credit, 2)
                ];
            }
        }

        return collect($results)->sortBy('title')->values();
    }

    /**
     * Generate Roznamcha (Cash flow Period Summary)
     */
    public function roznamcha($fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        // Fetch Cash Opening Balance
        $cashAccounts = Account::where('type', 1)->pluck('id')->toArray();
        $openingCash = 0;
        foreach ($cashAccounts as $id) {
            $openingCash += $this->calculateOpeningBalance($id, $fromDate, 'dr');
        }

        // Aggregate payments for the period
        $payments = DB::table('payments')
            ->join('accounts as acc', 'payments.account_id', '=', 'acc.id')
            ->join('accounts as bank', 'payments.payment_account_id', '=', 'bank.id')
            ->whereBetween('payments.date', [$fromDate, $toDate])
            ->select('payments.type as p_type', 'payments.amount', 'acc.type as acc_type', 'bank.type as bank_type')
            ->get();

        // INFLOWS
        $cashSale = 0; 
        $cashReceivedCreditSale = 0;
        $chequeReceivedCreditSale = 0;
        $drawing = 0; // Image places Drawing on the left
        $loanReceived = 0;

        // OUTFLOWS
        $cashPurchase = 0; 
        $totalExpense = 0;
        $cashPaidCreditPurchase = 0;
        $chequePaidCreditPurchase = 0;
        $deposits = 0;
        $loanPaid = 0;

        foreach ($payments as $p) {
            if ($p->p_type === 'RECEIPT') {
                if ($p->bank_type == 1) { // Received into Cash
                    if ($p->acc_type == 3) $cashReceivedCreditSale += $p->amount;
                    elseif ($p->acc_type == 11) $loanReceived += $p->amount;
                    elseif ($p->acc_type == 8) $drawing += $p->amount; 
                } elseif ($p->bank_type == 14 || $p->bank_type == 2) { // Received Cheque/Bank
                    if ($p->acc_type == 3) $chequeReceivedCreditSale += $p->amount;
                }
            } else { // PAYMENT
                if ($p->bank_type == 1) { // Paid from Cash
                    if ($p->acc_type == 6) $cashPaidCreditPurchase += $p->amount;
                    elseif ($p->acc_type == 4) $totalExpense += $p->amount;
                    elseif ($p->acc_type == 2 || $p->acc_type == 14) $deposits += $p->amount;
                    elseif ($p->acc_type == 11) $loanPaid += $p->amount;
                } elseif ($p->bank_type == 2 || $p->bank_type == 14) { // Paid via Cheque/Bank
                    if ($p->acc_type == 6) $chequePaidCreditPurchase += $p->amount;
                }
            }
        }

        // As per the image: Total Cash Received does NOT include Cheque Received.
        $totalCashReceived = $openingCash + $cashSale + $cashReceivedCreditSale + $drawing + $loanReceived;
        
        // Total Payment does NOT include Cheque Paid in its SUM.
        $totalPayment = $cashPurchase + $totalExpense + $cashPaidCreditPurchase + $deposits + $loanPaid;
        
        $cashInHand = $totalCashReceived - $totalPayment;

        return [
            'inflows' => [
                'cash_opening' => $openingCash,
                'cash_sale' => $cashSale,
                'cash_received_credit_sale' => $cashReceivedCreditSale,
                'cheque_received_credit_sale' => $chequeReceivedCreditSale,
                'drawing' => $drawing,
                'loan_received' => $loanReceived,
                'total_cash_received' => $totalCashReceived
            ],
            'outflows' => [
                'cash_purchase' => $cashPurchase,
                'total_expense' => $totalExpense,
                'cash_paid_credit_purchase' => $cashPaidCreditPurchase,
                'cheque_paid_credit_purchase' => $chequePaidCreditPurchase,
                'deposits' => $deposits,
                'loan_paid' => $loanPaid,
                'total_payment' => $totalPayment
            ],
            'cash_in_hand' => $cashInHand,
            'from_date' => $fromDate,
            'to_date' => $toDate
        ];
    }
}

