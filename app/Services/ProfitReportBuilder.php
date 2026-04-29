<?php

namespace App\Services;

use App\Models\Sales;
use App\Models\SalesItem;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ProfitReportBuilder
{
    /**
     * Get a base query for sales items with calculated revenue and COGS.
     */
    private function getSalesItemsQuery($fromDate, $toDate)
    {
        $purchaseCosts = DB::table('purchase_items')
            ->select('item_id', DB::raw('SUM(subtotal) / NULLIF(SUM(total_pcs), 0) as avg_cost'))
            ->groupBy('item_id');

        return DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->leftJoinSub($purchaseCosts, 'pc', 'items.id', '=', 'pc.item_id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);
    }

    /**
     * Get a base query for sales return items with calculated revenue and COGS.
     */
    private function getReturnItemsQuery($fromDate, $toDate)
    {
        $purchaseCosts = DB::table('purchase_items')
            ->select('item_id', DB::raw('SUM(subtotal) / NULLIF(SUM(total_pcs), 0) as avg_cost'))
            ->groupBy('item_id');

        return DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->join('items', 'sales_return_items.item_id', '=', 'items.id')
            ->leftJoinSub($purchaseCosts, 'pc', 'items.id', '=', 'pc.item_id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate]);
    }

    public function transactionWiseProfit($fromDate = null, $toDate = null, $filters = [])
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        // Calculate Weighted Average Purchase Price per item
        $purchaseCosts = DB::table('purchase_items')
            ->select('item_id', DB::raw('SUM(subtotal) / NULLIF(SUM(total_pcs), 0) as avg_cost'))
            ->groupBy('item_id');

        $query = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->leftJoinSub($purchaseCosts, 'pc', 'items.id', '=', 'pc.item_id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        // Apply filters
        if (!empty($filters['customer_id'])) $query->where('sales.customer_id', $filters['customer_id']);
        if (!empty($filters['firm_id'])) $query->where('sales.firm_id', $filters['firm_id']);
        if (!empty($filters['item_id'])) $query->where('sales_items.item_id', $filters['item_id']);
        if (!empty($filters['salesman_id'])) $query->where('sales.salesman_id', $filters['salesman_id']);

        $results = $query->select(
            'sales.invoice',
            'sales.date',
            'accounts.title as customer_name',
            'items.title as product_name',
            'sales_items.total_pcs as qty',
            'sales_items.trade_price as sale_rate',
            'sales_items.subtotal as revenue',
            DB::raw('COALESCE(pc.avg_cost, 0) as purchase_rate')
        )
        ->orderBy('sales.date', 'desc')
        ->orderBy('sales.invoice', 'desc')
        ->get();

        return $results->map(function($row) {
            $row->cogs = $row->purchase_rate > 0 ? (float)($row->qty * $row->purchase_rate) : 0;
            $row->profit = $row->purchase_rate > 0 ? ($row->revenue - $row->cogs) : 0;
            $row->margin = ($row->revenue > 0 && $row->purchase_rate > 0) ? round(($row->profit / $row->revenue) * 100, 2) : 0;
            return (array)$row;
        })->toArray();
    }

    public function partyWiseProfit($fromDate = null, $toDate = null, $filters = [])
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $salesQuery = $this->getSalesItemsQuery($fromDate, $toDate);
        if (!empty($filters['customer_id'])) $salesQuery->where('sales.customer_id', $filters['customer_id']);
        if (!empty($filters['item_id'])) $salesQuery->where('sales_items.item_id', $filters['item_id']);
        if (!empty($filters['salesman_id'])) $salesQuery->where('sales.salesman_id', $filters['salesman_id']);
        if (!empty($filters['firm_id'])) $salesQuery->where('sales.firm_id', $filters['firm_id']);

        $salesData = $salesQuery->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->select(
                'accounts.id',
                'accounts.title as name',
                DB::raw('SUM(sales_items.subtotal) as revenue'),
                DB::raw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as cogs')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->get();

        return $salesData->map(function($item) {
            $item->profit = $item->revenue - $item->cogs;
            $item->margin = $item->revenue > 0 ? round(($item->profit / $item->revenue) * 100, 2) : 0;
            return (array)$item;
        })->sortByDesc('profit')->values()->toArray();
    }

    public function salesmanWiseProfit($fromDate = null, $toDate = null, $filters = [])
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $salesQuery = $this->getSalesItemsQuery($fromDate, $toDate);
        if (!empty($filters['salesman_id'])) $salesQuery->where('sales.salesman_id', $filters['salesman_id']);
        if (!empty($filters['item_id'])) $salesQuery->where('sales_items.item_id', $filters['item_id']);
        if (!empty($filters['customer_id'])) $salesQuery->where('sales.customer_id', $filters['customer_id']);
        if (!empty($filters['firm_id'])) $salesQuery->where('sales.firm_id', $filters['firm_id']);

        $salesData = $salesQuery->leftJoin('salemen', 'sales.salesman_id', '=', 'salemen.id')
            ->select(
                'salemen.id',
                DB::raw('COALESCE(salemen.name, "Unassigned") as name'),
                DB::raw('SUM(sales_items.subtotal) as revenue'),
                DB::raw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as cogs')
            )
            ->groupBy('salemen.id', 'salemen.name')
            ->get();

        return $salesData->map(function($item) {
            $item->profit = $item->revenue - $item->cogs;
            $item->margin = $item->revenue > 0 ? round(($item->profit / $item->revenue) * 100, 2) : 0;
            return (array)$item;
        })->sortByDesc('profit')->values()->toArray();
    }

    public function companyWiseProfit($fromDate = null, $toDate = null, $filters = [])
    {
        $salesQuery = $this->getSalesItemsQuery($fromDate, $toDate);
        if (!empty($filters['firm_id'])) $salesQuery->where('sales.firm_id', $filters['firm_id']);
        if (!empty($filters['item_id'])) $salesQuery->where('sales_items.item_id', $filters['item_id']);
        if (!empty($filters['customer_id'])) $salesQuery->where('sales.customer_id', $filters['customer_id']);
        if (!empty($filters['salesman_id'])) $salesQuery->where('sales.salesman_id', $filters['salesman_id']);

        $salesData = $salesQuery
            ->leftJoin('accounts as companies', 'items.company', '=', 'companies.id')
            ->select(
                DB::raw('COALESCE(companies.title, items.company, "Unassigned") as name'),
                DB::raw('SUM(sales_items.subtotal) as revenue'),
                DB::raw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as cogs')
            )
            ->groupBy('name')
            ->get();

        return $salesData->map(function($item) {
            $item->profit = $item->revenue - $item->cogs;
            $item->margin = $item->revenue > 0 ? round(($item->profit / $item->revenue) * 100, 2) : 0;
            return (array)$item;
        })->sortByDesc('profit')->values()->toArray();
    }

    public function dateWiseProfit($fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $salesData = $this->getSalesItemsQuery($fromDate, $toDate)
            ->select(
                'sales.date',
                DB::raw('SUM(sales_items.subtotal) as revenue'),
                DB::raw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as cogs')
            )
            ->groupBy('sales.date')
            ->get();

        return $salesData->map(function($item) {
            $item->profit = $item->revenue - $item->cogs;
            $item->margin = $item->revenue > 0 ? round(($item->profit / $item->revenue) * 100, 2) : 0;
            
            // Format the date as '01 APR 2026 Wednesday'
            $dateObj = \Carbon\Carbon::parse($item->date);
            $item->date_display = strtoupper($dateObj->format('d M Y')) . ' ' . $dateObj->format('l');

            return (array)$item;
        })->sortBy('date')->values()->toArray();
    }

    public function monthWiseProfit($fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-1 year'));
        $toDate = $toDate ?? date('Y-m-d');

        $salesData = $this->getSalesItemsQuery($fromDate, $toDate)
            ->select(
                DB::raw('DATE_FORMAT(sales.date, "%Y-%m") as month'),
                DB::raw('SUM(sales_items.subtotal) as revenue'),
                DB::raw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as cogs')
            )
            ->groupBy('month')
            ->get();

        $expensesData = DB::table('payments')
            ->join('accounts', 'payments.account_id', '=', 'accounts.id')
            ->where('accounts.type', 4) // Expense
            ->where('payments.type', 'PAYMENT')
            ->whereBetween('payments.date', [$fromDate, $toDate])
            ->select(
                DB::raw('DATE_FORMAT(payments.date, "%Y-%m") as month'),
                DB::raw('SUM(payments.amount + payments.discount) as expense')
            )
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $salesData = clone $salesData;
        $salesKeyed = $salesData->keyBy('month');

        $allMonths = collect(array_keys($salesKeyed->toArray()))
            ->merge(array_keys($expensesData->toArray()))
            ->unique()
            ->sort()
            ->values();

        return $allMonths->map(function($month) use ($salesKeyed, $expensesData) {
            $saleRow = $salesKeyed->get($month);
            $expenseRow = $expensesData->get($month);

            $revenue = $saleRow ? (float)$saleRow->revenue : 0;
            $cogs = $saleRow ? (float)$saleRow->cogs : 0;
            $expense = $expenseRow ? (float)$expenseRow->expense : 0;

            $profit = $revenue - $cogs;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0;
            
            $net_profit = $profit - $expense;
            $net_margin = $revenue > 0 ? round(($net_profit / $revenue) * 100, 2) : 0;

            $dateObj = \Carbon\Carbon::createFromFormat('Y-m', $month);

            return [
                'month' => strtoupper($dateObj->format('M Y')), // e.g. JAN 2026
                'revenue' => $revenue,
                'cogs' => $cogs,
                'profit' => $profit,
                'margin' => $margin,
                'expense' => $expense,
                'net_profit' => $net_profit,
                'net_margin' => $net_margin,
            ];
        })->toArray();
    }

    /**
     * Unified calculation entry point.
     */
    public function calculate($reportId, $params)
    {
        $fromDate = $params['fromDate']->format('Y-m-d');
        $toDate = $params['toDate']->format('Y-m-d');
        
        $filters = [
            'customer_id' => ($params['accountId'] ?? 'ALL') === 'ALL' ? null : $params['accountId'],
            'item_id' => ($params['itemId'] ?? 'ALL') === 'ALL' ? null : $params['itemId'],
            'salesman_id' => ($params['salemanId'] ?? 'ALL') === 'ALL' ? null : $params['salemanId'],
            'firm_id' => ($params['firmId'] ?? 'ALL') === 'ALL' ? null : $params['firmId'],
        ];

        switch ($reportId) {
            case 'transaction':
                return $this->transactionWiseProfit($fromDate, $toDate, $filters);
            case 'party':
                return $this->partyWiseProfit($fromDate, $toDate, $filters);
            case 'salesman':
                return $this->salesmanWiseProfit($fromDate, $toDate, $filters);
            case 'company':
                return $this->companyWiseProfit($fromDate, $toDate, $filters);
            case 'date':
                return $this->dateWiseProfit($fromDate, $toDate);
            case 'month':
                return $this->monthWiseProfit($fromDate, $toDate);
            default:
                return $this->transactionWiseProfit($fromDate, $toDate, $filters);
        }
    }
}
