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

        $returnQuery = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->join('items', 'sales_return_items.item_id', '=', 'items.id')
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->leftJoinSub($purchaseCosts, 'pc', 'items.id', '=', 'pc.item_id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate]);

        // Apply filters
        if (!empty($filters['customer_id'])) {
            $query->where('sales.customer_id', $filters['customer_id']);
            $returnQuery->where('sales_returns.customer_id', $filters['customer_id']);
        }
        if (!empty($filters['firm_id'])) {
            $query->where('sales.firm_id', $filters['firm_id']);
            $returnQuery->where('sales_returns.firm_id', $filters['firm_id']);
        }
        if (!empty($filters['item_id'])) {
            $query->where('sales_items.item_id', $filters['item_id']);
            $returnQuery->where('sales_return_items.item_id', $filters['item_id']);
        }
        if (!empty($filters['salesman_id'])) {
            $query->where('sales.salesman_id', $filters['salesman_id']);
            $returnQuery->where('sales_returns.salesman_id', $filters['salesman_id']);
        }

        $results = $query->select(
            'sales.invoice',
            'sales.date',
            'accounts.title as customer_name',
            'items.title as product_name',
            'sales_items.total_pcs as qty',
            'sales_items.trade_price as sale_rate',
            'sales_items.subtotal as revenue',
            DB::raw('COALESCE(pc.avg_cost, 0) as purchase_rate')
        )->get();

        $returnResults = $returnQuery->select(
            DB::raw('CONCAT(sales_returns.invoice, " (Return)") as invoice'),
            'sales_returns.date',
            'accounts.title as customer_name',
            'items.title as product_name',
            DB::raw('-sales_return_items.total_pcs as qty'),
            'sales_return_items.trade_price as sale_rate',
            DB::raw('-sales_return_items.subtotal as revenue'),
            DB::raw('COALESCE(pc.avg_cost, 0) as purchase_rate')
        )->get();

        $combined = $results->concat($returnResults)->sortByDesc(function($row) {
            return $row->date . ' ' . $row->invoice;
        });

        return $combined->map(function($row) {
            $row->cogs = $row->purchase_rate > 0 ? (float)($row->qty * $row->purchase_rate) : 0;
            $row->profit = $row->revenue - $row->cogs;
            $row->margin = (abs($row->revenue) > 0 && $row->purchase_rate > 0) ? round(($row->profit / abs($row->revenue)) * 100, 2) : 0;
            return (array)$row;
        })->values()->toArray();
    }

    public function partyWiseProfit($fromDate = null, $toDate = null, $filters = [])
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $salesQuery = $this->getSalesItemsQuery($fromDate, $toDate);
        $returnsQuery = $this->getReturnItemsQuery($fromDate, $toDate);

        if (!empty($filters['customer_id'])) {
            $salesQuery->where('sales.customer_id', $filters['customer_id']);
            $returnsQuery->where('sales_returns.customer_id', $filters['customer_id']);
        }
        if (!empty($filters['item_id'])) {
            $salesQuery->where('sales_items.item_id', $filters['item_id']);
            $returnsQuery->where('sales_return_items.item_id', $filters['item_id']);
        }
        if (!empty($filters['salesman_id'])) {
            $salesQuery->where('sales.salesman_id', $filters['salesman_id']);
            $returnsQuery->where('sales_returns.salesman_id', $filters['salesman_id']);
        }
        if (!empty($filters['firm_id'])) {
            $salesQuery->where('sales.firm_id', $filters['firm_id']);
            $returnsQuery->where('sales_returns.firm_id', $filters['firm_id']);
        }

        $salesData = $salesQuery->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->select(
                'accounts.id',
                'accounts.title as name',
                DB::raw('SUM(sales_items.subtotal) as revenue'),
                DB::raw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as cogs')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->get()
            ->keyBy('id');

        $returnsData = $returnsQuery->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->select(
                'accounts.id',
                'accounts.title as name',
                DB::raw('SUM(sales_return_items.subtotal) as return_revenue'),
                DB::raw('SUM(sales_return_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as return_cogs')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->get()
            ->keyBy('id');

        $allPartyIds = collect(array_keys($salesData->toArray()))->merge(array_keys($returnsData->toArray()))->unique();

        return $allPartyIds->map(function($partyId) use ($salesData, $returnsData) {
            $saleRow = $salesData->get($partyId);
            $returnRow = $returnsData->get($partyId);

            $revenue = ($saleRow ? (float)$saleRow->revenue : 0) - ($returnRow ? (float)$returnRow->return_revenue : 0);
            $cogs = ($saleRow ? (float)$saleRow->cogs : 0) - ($returnRow ? (float)$returnRow->return_cogs : 0);
            $profit = $revenue - $cogs;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0;

            return [
                'id' => $partyId,
                'name' => $saleRow ? $saleRow->name : ($returnRow ? $returnRow->name : 'N/A'),
                'revenue' => $revenue,
                'cogs' => $cogs,
                'profit' => $profit,
                'margin' => $margin
            ];
        })->sortByDesc('profit')->values()->toArray();
    }

    public function salesmanWiseProfit($fromDate = null, $toDate = null, $filters = [])
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $salesQuery = $this->getSalesItemsQuery($fromDate, $toDate);
        $returnsQuery = $this->getReturnItemsQuery($fromDate, $toDate);

        if (!empty($filters['salesman_id'])) {
            $salesQuery->where('sales.salesman_id', $filters['salesman_id']);
            $returnsQuery->where('sales_returns.salesman_id', $filters['salesman_id']);
        }
        if (!empty($filters['item_id'])) {
            $salesQuery->where('sales_items.item_id', $filters['item_id']);
            $returnsQuery->where('sales_return_items.item_id', $filters['item_id']);
        }
        if (!empty($filters['customer_id'])) {
            $salesQuery->where('sales.customer_id', $filters['customer_id']);
            $returnsQuery->where('sales_returns.customer_id', $filters['customer_id']);
        }
        if (!empty($filters['firm_id'])) {
            $salesQuery->where('sales.firm_id', $filters['firm_id']);
            $returnsQuery->where('sales_returns.firm_id', $filters['firm_id']);
        }

        $salesData = $salesQuery->leftJoin('salemen', 'sales.salesman_id', '=', 'salemen.id')
            ->select(
                'salemen.id',
                DB::raw('COALESCE(salemen.name, "Unassigned") as name'),
                DB::raw('SUM(sales_items.subtotal) as revenue'),
                DB::raw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as cogs')
            )
            ->groupBy('salemen.id', 'salemen.name')
            ->get()
            ->keyBy('id');

        $returnsData = $returnsQuery->leftJoin('salemen', 'sales_returns.salesman_id', '=', 'salemen.id')
            ->select(
                'salemen.id',
                DB::raw('COALESCE(salemen.name, "Unassigned") as name'),
                DB::raw('SUM(sales_return_items.subtotal) as return_revenue'),
                DB::raw('SUM(sales_return_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as return_cogs')
            )
            ->groupBy('salemen.id', 'salemen.name')
            ->get()
            ->keyBy('id');

        $allSalesmanIds = collect(array_keys($salesData->toArray()))->merge(array_keys($returnsData->toArray()))->unique();

        return $allSalesmanIds->map(function($smId) use ($salesData, $returnsData) {
            $saleRow = $salesData->get($smId);
            $returnRow = $returnsData->get($smId);

            $revenue = ($saleRow ? (float)$saleRow->revenue : 0) - ($returnRow ? (float)$returnRow->return_revenue : 0);
            $cogs = ($saleRow ? (float)$saleRow->cogs : 0) - ($returnRow ? (float)$returnRow->return_cogs : 0);
            $profit = $revenue - $cogs;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0;

            return [
                'id' => $smId,
                'name' => $saleRow ? $saleRow->name : ($returnRow ? $returnRow->name : 'Unassigned'),
                'revenue' => $revenue,
                'cogs' => $cogs,
                'profit' => $profit,
                'margin' => $margin
            ];
        })->sortByDesc('profit')->values()->toArray();
    }

    public function companyWiseProfit($fromDate = null, $toDate = null, $filters = [])
    {
        $salesQuery = $this->getSalesItemsQuery($fromDate, $toDate);
        $returnsQuery = $this->getReturnItemsQuery($fromDate, $toDate);

        if (!empty($filters['firm_id'])) {
            $salesQuery->where('sales.firm_id', $filters['firm_id']);
            $returnsQuery->where('sales_returns.firm_id', $filters['firm_id']);
        }
        if (!empty($filters['item_id'])) {
            $salesQuery->where('sales_items.item_id', $filters['item_id']);
            $returnsQuery->where('sales_return_items.item_id', $filters['item_id']);
        }
        if (!empty($filters['customer_id'])) {
            $salesQuery->where('sales.customer_id', $filters['customer_id']);
            $returnsQuery->where('sales_returns.customer_id', $filters['customer_id']);
        }
        if (!empty($filters['salesman_id'])) {
            $salesQuery->where('sales.salesman_id', $filters['salesman_id']);
            $returnsQuery->where('sales_returns.salesman_id', $filters['salesman_id']);
        }

        $salesData = $salesQuery
            ->leftJoin('accounts as companies', 'items.company', '=', 'companies.id')
            ->select(
                DB::raw('COALESCE(companies.title, items.company, "Unassigned") as name'),
                DB::raw('SUM(sales_items.subtotal) as revenue'),
                DB::raw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as cogs')
            )
            ->groupBy('name')
            ->get()
            ->keyBy('name');

        $returnsData = $returnsQuery
            ->leftJoin('accounts as companies', 'items.company', '=', 'companies.id')
            ->select(
                DB::raw('COALESCE(companies.title, items.company, "Unassigned") as name'),
                DB::raw('SUM(sales_return_items.subtotal) as return_revenue'),
                DB::raw('SUM(sales_return_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as return_cogs')
            )
            ->groupBy('name')
            ->get()
            ->keyBy('name');

        $allCompanies = collect(array_keys($salesData->toArray()))->merge(array_keys($returnsData->toArray()))->unique();

        return $allCompanies->map(function($name) use ($salesData, $returnsData) {
            $saleRow = $salesData->get($name);
            $returnRow = $returnsData->get($name);

            $revenue = ($saleRow ? (float)$saleRow->revenue : 0) - ($returnRow ? (float)$returnRow->return_revenue : 0);
            $cogs = ($saleRow ? (float)$saleRow->cogs : 0) - ($returnRow ? (float)$returnRow->return_cogs : 0);
            $profit = $revenue - $cogs;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0;

            return [
                'name' => $name,
                'revenue' => $revenue,
                'cogs' => $cogs,
                'profit' => $profit,
                'margin' => $margin
            ];
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
            ->get()
            ->keyBy('date');

        $returnsData = $this->getReturnItemsQuery($fromDate, $toDate)
            ->select(
                'sales_returns.date',
                DB::raw('SUM(sales_return_items.subtotal) as return_revenue'),
                DB::raw('SUM(sales_return_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as return_cogs')
            )
            ->groupBy('sales_returns.date')
            ->get()
            ->keyBy('date');

        $allDates = collect(array_keys($salesData->toArray()))->merge(array_keys($returnsData->toArray()))->unique()->sort();

        return $allDates->map(function($date) use ($salesData, $returnsData) {
            $saleRow = $salesData->get($date);
            $returnRow = $returnsData->get($date);

            $revenue = ($saleRow ? (float)$saleRow->revenue : 0) - ($returnRow ? (float)$returnRow->return_revenue : 0);
            $cogs = ($saleRow ? (float)$saleRow->cogs : 0) - ($returnRow ? (float)$returnRow->return_cogs : 0);
            $profit = $revenue - $cogs;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0;

            $dateObj = \Carbon\Carbon::parse($date);
            $date_display = strtoupper($dateObj->format('d M Y')) . ' ' . $dateObj->format('l');

            return [
                'date' => $date,
                'date_display' => $date_display,
                'revenue' => $revenue,
                'cogs' => $cogs,
                'profit' => $profit,
                'margin' => $margin
            ];
        })->values()->toArray();
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
            ->get()
            ->keyBy('month');

        $returnsData = $this->getReturnItemsQuery($fromDate, $toDate)
            ->select(
                DB::raw('DATE_FORMAT(sales_returns.date, "%Y-%m") as month'),
                DB::raw('SUM(sales_return_items.subtotal) as return_revenue'),
                DB::raw('SUM(sales_return_items.total_pcs * COALESCE(pc.avg_cost, items.trade_price)) as return_cogs')
            )
            ->groupBy('month')
            ->get()
            ->keyBy('month');

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

        $allMonths = collect(array_keys($salesData->toArray()))
            ->merge(array_keys($returnsData->toArray()))
            ->merge(array_keys($expensesData->toArray()))
            ->unique()
            ->sort()
            ->values();

        return $allMonths->map(function($month) use ($salesData, $returnsData, $expensesData) {
            $saleRow = $salesData->get($month);
            $returnRow = $returnsData->get($month);
            $expenseRow = $expensesData->get($month);

            $revenue = ($saleRow ? (float)$saleRow->revenue : 0) - ($returnRow ? (float)$returnRow->return_revenue : 0);
            $cogs = ($saleRow ? (float)$saleRow->cogs : 0) - ($returnRow ? (float)$returnRow->return_cogs : 0);
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
                $data = $this->transactionWiseProfit($fromDate, $toDate, $filters);
                break;
            case 'party':
                $data = $this->partyWiseProfit($fromDate, $toDate, $filters);
                break;
            case 'salesman':
                $data = $this->salesmanWiseProfit($fromDate, $toDate, $filters);
                break;
            case 'company':
                $data = $this->companyWiseProfit($fromDate, $toDate, $filters);
                break;
            case 'date':
                $data = $this->dateWiseProfit($fromDate, $toDate);
                break;
            case 'month':
                $data = $this->monthWiseProfit($fromDate, $toDate);
                break;
            default:
                $data = $this->transactionWiseProfit($fromDate, $toDate, $filters);
                break;
        }

        // Apply sorting if a sortBy parameter is present
        if (!empty($params['sortBy']) && $params['sortBy'] !== 'default') {
            $data = $this->sortData($data, $params['sortBy']);
        }

        return $data;
    }

    /**
     * Sort profit report data based on chosen filter.
     */
    private function sortData($data, $sortBy)
    {
        $collection = collect($data);

        switch ($sortBy) {
            case 'revenue_desc':
                return $collection->sortByDesc('revenue')->values()->toArray();
            case 'revenue_asc':
                return $collection->sortBy('revenue')->values()->toArray();
            case 'profit_desc':
                return $collection->sortByDesc('profit')->values()->toArray();
            case 'profit_asc':
                return $collection->sortBy('profit')->values()->toArray();
            case 'margin_desc':
                return $collection->sortByDesc('margin')->values()->toArray();
            case 'margin_asc':
                return $collection->sortBy('margin')->values()->toArray();
            case 'qty_desc':
                return $collection->sortByDesc('qty')->values()->toArray();
            case 'qty_asc':
                return $collection->sortBy('qty')->values()->toArray();
            case 'date_desc':
                return $collection->sortByDesc('date')->values()->toArray();
            case 'date_asc':
                return $collection->sortBy('date')->values()->toArray();
            case 'name_asc':
                return $collection->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'name_desc':
                return $collection->sortByDesc('name', SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'net_profit_desc':
                return $collection->sortByDesc('net_profit')->values()->toArray();
            case 'net_profit_asc':
                return $collection->sortBy('net_profit')->values()->toArray();
            default:
                return $data;
        }
    }
}
