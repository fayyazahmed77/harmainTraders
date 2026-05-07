<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesReturnReportBuilder
{
    private function getSalesReturnItemsQuery($fromDate, $toDate)
    {
        return DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate]);
    }

    private function getSalesReturnQuery($fromDate, $toDate)
    {
        return DB::table('sales_returns')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate]);
    }

    private function transformToArray($collection)
    {
        return $collection->map(function($row) {
            return (array)$row;
        })->toArray();
    }

    public function calculate($reportId, $params)
    {
        $fromDate = $params['fromDate']->format('Y-m-d');
        $toDate = $params['toDate']->format('Y-m-d');
        
        $filters = [
            'customer_id' => ($params['customerId'] ?? 'ALL') === 'ALL' ? null : $params['customerId'],
            'item_id' => ($params['itemId'] ?? 'ALL') === 'ALL' ? null : $params['itemId'],
            'salesman_id' => ($params['salesmanId'] ?? 'ALL') === 'ALL' ? null : $params['salesmanId'],
            'area_id' => ($params['areaId'] ?? 'ALL') === 'ALL' ? null : $params['areaId'],
            'firm_id' => ($params['firmId'] ?? 'ALL') === 'ALL' ? null : $params['firmId'],
            'category_id' => ($params['categoryId'] ?? 'ALL') === 'ALL' ? null : $params['categoryId'],
            'sub_area_id' => ($params['subAreaId'] ?? 'ALL') === 'ALL' ? null : $params['subAreaId'],
            'company_id' => ($params['companyId'] ?? 'ALL') === 'ALL' ? null : $params['companyId'],
        ];

        switch ($reportId) {
            case 'bill': return $this->billWise($fromDate, $toDate, $filters);
            case 'details_wise':
            case 'detail': return $this->details($fromDate, $toDate, $filters);
            case 'area_item_party': return $this->areaWiseItemPartySummary($fromDate, $toDate, $filters);
            case 'month': return $this->monthWiseMatrix($fromDate, $toDate, $filters);
            case 'item_summary': return $this->itemWiseSummary($fromDate, $toDate, $filters);
            default: return [];
        }
    }

    public function billWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesReturnQuery($fromDate, $toDate)
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id');

        if ($filters['customer_id']) $query->where('sales_returns.customer_id', $filters['customer_id']);
        if ($filters['area_id']) $query->where('accounts.area_id', $filters['area_id']);
        if ($filters['sub_area_id']) $query->where('accounts.subarea_id', $filters['sub_area_id']);

        if ($filters['company_id'] || $filters['category_id']) {
            $query->whereExists(function ($q) use ($filters) {
                $q->select(DB::raw(1))
                    ->from('sales_return_items')
                    ->join('items', 'sales_return_items.item_id', '=', 'items.id')
                    ->whereRaw('sales_return_items.sales_return_id = sales_returns.id');
                if ($filters['company_id']) $q->where('items.company', $filters['company_id']);
                if ($filters['category_id']) $q->where('items.category', $filters['category_id']);
            });
        }

        $results = $query->select(
            'sales_returns.id as voucher_no',
            'sales_returns.date',
            'accounts.title as customer_name',
            'sales_returns.gross_total as gross',
            'sales_returns.discount_total as discount',
            'sales_returns.net_total as amount'
        )
        ->orderBy('sales_returns.date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function details($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesReturnItemsQuery($fromDate, $toDate)
            ->join('items', 'sales_return_items.item_id', '=', 'items.id')
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id');

        if ($filters['customer_id']) $query->where('sales_returns.customer_id', $filters['customer_id']);
        if ($filters['item_id']) $query->where('sales_return_items.item_id', $filters['item_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);
        if ($filters['area_id']) $query->where('accounts.area_id', $filters['area_id']);
        if ($filters['sub_area_id']) $query->where('accounts.subarea_id', $filters['sub_area_id']);
        if ($filters['company_id']) $query->where('items.company', $filters['company_id']);

        $results = $query->select(
            'sales_returns.id as voucher_no',
            'sales_returns.date',
            'accounts.title as customer_name',
            'items.title as product_name',
            'sales_return_items.qty_carton as qty_full',
            'sales_return_items.qty_pcs',
            'sales_return_items.trade_price as tp',
            'sales_return_items.subtotal as amount'
        )
        ->orderBy('sales_returns.date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function areaWiseItemPartySummary($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesReturnItemsQuery($fromDate, $toDate)
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->join('items', 'sales_return_items.item_id', '=', 'items.id')
            ->leftJoin('subareas', 'accounts.subarea_id', '=', 'subareas.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate]);

        if ($filters['area_id']) $query->where('accounts.area_id', $filters['area_id']);
        if ($filters['customer_id']) $query->where('sales_returns.customer_id', $filters['customer_id']);
        if ($filters['item_id']) $query->where('sales_return_items.item_id', $filters['item_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'subareas.name as subarea_name',
            'accounts.title as account_title',
            'items.title as product_name',
            'items.packing_qty as pack_size',
            'sales_return_items.qty_carton as qty_full',
            'sales_return_items.qty_pcs',
            'sales_return_items.trade_price as rate',
            'sales_return_items.subtotal as amount'
        )
        ->orderBy('subareas.name')
        ->orderBy('accounts.title')
        ->orderBy('items.title')
        ->get();

        return $this->transformToArray($results);
    }

    public function itemWiseSummary($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesReturnItemsQuery($fromDate, $toDate)
            ->join('items', 'sales_return_items.item_id', '=', 'items.id');

        if ($filters['item_id']) $query->where('sales_return_items.item_id', $filters['item_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'items.title as item_description',
            'items.packing_qty as packing',
            DB::raw('SUM(sales_return_items.qty_carton) as qty_full'),
            DB::raw('SUM(sales_return_items.qty_pcs) as qty_pcs'),
            DB::raw('SUM(sales_return_items.subtotal + sales_return_items.discount) as gross_amount'),
            DB::raw('SUM(sales_return_items.discount) as disc_amt'),
            DB::raw('SUM(sales_return_items.subtotal) as net_amount')
        )
        ->groupBy('items.id', 'items.title', 'items.packing_qty')
        ->orderBy('items.title')
        ->get();

        return $this->transformToArray($results);
    }

    public function monthWiseMatrix($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesReturnItemsQuery($fromDate, $toDate)
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->join('items', 'sales_return_items.item_id', '=', 'items.id');

        if ($filters['customer_id']) $query->where('sales_returns.customer_id', $filters['customer_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'accounts.title as account_name',
            'items.title as item_name',
            DB::raw("DATE_FORMAT(sales_returns.date, '%M') as month_name"),
            DB::raw('SUM(sales_return_items.qty_carton) as qty_f'),
            DB::raw('SUM(sales_return_items.qty_pcs) as qty_p'),
            DB::raw('SUM(sales_return_items.subtotal) as amount')
        )
        ->groupBy('accounts.id', 'accounts.title', 'items.id', 'items.title', 'month_name')
        ->orderBy('accounts.title')
        ->orderBy('items.title')
        ->get();

        return $this->transformToArray($results);
    }
}
