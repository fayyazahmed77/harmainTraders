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
            'province_id' => ($params['provinceId'] ?? 'ALL') === 'ALL' ? null : $params['provinceId'],
            'city_id' => ($params['cityId'] ?? 'ALL') === 'ALL' ? null : $params['cityId'],
        ];

        switch ($reportId) {
            case 'bill': $data = $this->billWise($fromDate, $toDate, $filters); break;
            case 'details_wise': $data = $this->invoiceDetails($fromDate, $toDate, $filters); break;
            case 'detail': $data = $this->details($fromDate, $toDate, $filters); break;
            case 'area_item_party': $data = $this->areaWiseItemPartySummary($fromDate, $toDate, $filters); break;
            case 'month': $data = $this->monthWiseMatrix($fromDate, $toDate, $filters); break;
            case 'item_summary': $data = $this->itemWiseSummary($fromDate, $toDate, $filters); break;
            default: $data = []; break;
        }

        // Apply sorting if a sortBy parameter is present
        if (!empty($params['sortBy']) && $params['sortBy'] !== 'default') {
            $data = $this->sortData($data, $params['sortBy']);
        }

        return $data;
    }

    /**
     * Sort sales return report data based on chosen filter.
     */
    private function sortData($data, $sortBy)
    {
        $collection = collect($data);

        switch ($sortBy) {
            case 'amount_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['amount'] ?? $item['net_amount'] ?? 0;
                })->values()->toArray();
            case 'amount_asc':
                return $collection->sortBy(function ($item) {
                    return $item['amount'] ?? $item['net_amount'] ?? 0;
                })->values()->toArray();
            case 'gross_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['gross'] ?? $item['gross_amount'] ?? 0;
                })->values()->toArray();
            case 'gross_asc':
                return $collection->sortBy(function ($item) {
                    return $item['gross'] ?? $item['gross_amount'] ?? 0;
                })->values()->toArray();
            case 'discount_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['discount'] ?? $item['disc_amt'] ?? 0;
                })->values()->toArray();
            case 'discount_asc':
                return $collection->sortBy(function ($item) {
                    return $item['discount'] ?? $item['disc_amt'] ?? 0;
                })->values()->toArray();
            case 'qty_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['qty_full'] ?? $item['qty_f'] ?? 0;
                })->values()->toArray();
            case 'qty_asc':
                return $collection->sortBy(function ($item) {
                    return $item['qty_full'] ?? $item['qty_f'] ?? 0;
                })->values()->toArray();
            case 'date_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['date'] ?? $item['month_name'] ?? '';
                })->values()->toArray();
            case 'date_asc':
                return $collection->sortBy(function ($item) {
                    return $item['date'] ?? $item['month_name'] ?? '';
                })->values()->toArray();
            case 'name_asc':
                return $collection->sortBy(function ($item) {
                    return $item['customer_name'] ?? $item['account_name'] ?? $item['account_title'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'name_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['customer_name'] ?? $item['account_name'] ?? $item['account_title'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'product_name_asc':
                return $collection->sortBy(function ($item) {
                    return $item['product_name'] ?? $item['item_name'] ?? $item['item_description'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'product_name_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['product_name'] ?? $item['item_name'] ?? $item['item_description'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            default:
                return $data;
        }
    }

    public function billWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesReturnQuery($fromDate, $toDate)
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id');

        if ($filters['customer_id']) $query->where('sales_returns.customer_id', $filters['customer_id']);
        $this->applyGeoFilters($query, $filters);

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
            DB::raw('(sales_returns.discount_total + sales_returns.extra_discount) as discount'),
            DB::raw('(sales_returns.net_total - sales_returns.extra_discount) as amount')
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
        $this->applyGeoFilters($query, $filters);
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

    public function invoiceDetails($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesReturnItemsQuery($fromDate, $toDate)
            ->join('items', 'sales_return_items.item_id', '=', 'items.id')
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->leftJoin('salemen', 'sales_returns.salesman_id', '=', 'salemen.id');

        if ($filters['customer_id']) $query->where('sales_returns.customer_id', $filters['customer_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'sales_returns.id as sale_id',
            'sales_returns.invoice as inv_no',
            'sales_returns.date as inv_date',
            'accounts.title as account_title',
            'salemen.name as salesman_name',
            'sales_returns.net_total as inv_amount',
            'items.title as item_name',
            'sales_return_items.trade_price',
            'sales_return_items.qty_carton as qty_full',
            'sales_return_items.qty_pcs',
            'sales_return_items.trade_price as rate',
            'sales_return_items.bonus_qty_carton as bonus_full',
            'sales_return_items.bonus_qty_pcs as bonus_pcs',
            'sales_return_items.discount as disc_1',
            DB::raw('0 as disc_2'),
            DB::raw('0 as tax'),
            'sales_return_items.subtotal as amount'
        )
        ->orderBy('sales_returns.date', 'desc')
        ->orderBy('sales_returns.invoice', 'desc')
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

        $this->applyGeoFilters($query, $filters);
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

    private function applyGeoFilters($query, $filters)
    {
        if (!empty($filters['sub_area_id'])) {
            $query->where('accounts.subarea_id', $filters['sub_area_id']);
        } elseif (!empty($filters['area_id'])) {
            $query->where('accounts.area_id', $filters['area_id']);
        } elseif (!empty($filters['city_id'])) {
            $query->where('accounts.city_id', $filters['city_id']);
        } elseif (!empty($filters['province_id'])) {
            $query->where('accounts.province_id', $filters['province_id']);
        }
        return $query;
    }
}
