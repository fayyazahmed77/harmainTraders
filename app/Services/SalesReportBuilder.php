<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesReportBuilder
{
    private function getSalesItemsQuery($fromDate, $toDate)
    {
        return DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);
    }

    private function getSalesQuery($fromDate, $toDate)
    {
        return DB::table('sales')
            ->whereBetween('sales.date', [$fromDate, $toDate]);
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

        // Routing to specific methods
        switch ($reportId) {
            case 'bill': $data = $this->billWise($fromDate, $toDate, $filters); break;
            case 'details_wise': $data = $this->dateWise($fromDate, $toDate, $filters); break;
            case 'detail': $data = $this->details($fromDate, $toDate, $filters); break;
            case 'area_party': $data = $this->areaWisePartySummary($fromDate, $toDate, $filters); break;
            case 'area_item_party': $data = $this->areaWiseItemPartySummary($fromDate, $toDate, $filters); break;
            case 'invoice_details': $data = $this->invoiceDetails($fromDate, $toDate, $filters); break;
            case 'month': $data = $this->monthWiseMatrix($fromDate, $toDate, $filters); break;
            case 'month_amount': $data = $this->monthWiseAmountSummary($fromDate, $toDate, $filters); break;
            case 'month_qty': $data = $this->monthWiseQtySummary($fromDate, $toDate, $filters); break;
            case 'company': $data = $this->companyWiseSummary($fromDate, $toDate, $filters); break;
            case 'item_party': $data = $this->itemPartyWiseSummary($fromDate, $toDate, $filters); break;
            case 'item_summary': $data = $this->itemWiseSummary($fromDate, $toDate, $filters); break;
            case 'party_summary': $data = $this->partyWiseSummary($fromDate, $toDate, $filters); break;
            case 'recovery': $data = $this->salesRecoverySummary($fromDate, $toDate, $filters); break;
            case 'salesman': $data = $this->salesmanWiseSummary($fromDate, $toDate, $filters); break;
            default: $data = []; break;
        }

        // Apply sorting if a sortBy parameter is present
        if (!empty($params['sortBy']) && $params['sortBy'] !== 'default') {
            $data = $this->sortData($data, $params['sortBy']);
        }

        return $data;
    }

    /**
     * Sort sales report data based on chosen filter.
     */
    private function sortData($data, $sortBy)
    {
        $collection = collect($data);

        switch ($sortBy) {
            case 'amount_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['amount'] ?? $item['net_amount'] ?? $item['inv_amount'] ?? $item['sales'] ?? 0;
                })->values()->toArray();
            case 'amount_asc':
                return $collection->sortBy(function ($item) {
                    return $item['amount'] ?? $item['net_amount'] ?? $item['inv_amount'] ?? $item['sales'] ?? 0;
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
                    return $item['discount'] ?? $item['discount_amount'] ?? $item['disc_amt'] ?? $item['disc_1'] ?? 0;
                })->values()->toArray();
            case 'discount_asc':
                return $collection->sortBy(function ($item) {
                    return $item['discount'] ?? $item['discount_amount'] ?? $item['disc_amt'] ?? $item['disc_1'] ?? 0;
                })->values()->toArray();
            case 'paid_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['paid_amount'] ?? $item['received'] ?? $item['recovery'] ?? 0;
                })->values()->toArray();
            case 'paid_asc':
                return $collection->sortBy(function ($item) {
                    return $item['paid_amount'] ?? $item['received'] ?? $item['recovery'] ?? 0;
                })->values()->toArray();
            case 'qty_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['qty_full'] ?? $item['qty_f'] ?? $item['qty'] ?? 0;
                })->values()->toArray();
            case 'qty_asc':
                return $collection->sortBy(function ($item) {
                    return $item['qty_full'] ?? $item['qty_f'] ?? $item['qty'] ?? 0;
                })->values()->toArray();
            case 'date_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['date'] ?? $item['inv_date'] ?? $item['month_name'] ?? '';
                })->values()->toArray();
            case 'date_asc':
                return $collection->sortBy(function ($item) {
                    return $item['date'] ?? $item['inv_date'] ?? $item['month_name'] ?? '';
                })->values()->toArray();
            case 'name_asc':
                return $collection->sortBy(function ($item) {
                    return $item['customer_name'] ?? $item['account_name'] ?? $item['party_name'] ?? $item['salesman_name'] ?? $item['company_name'] ?? $item['account_title'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'name_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['customer_name'] ?? $item['account_name'] ?? $item['party_name'] ?? $item['salesman_name'] ?? $item['company_name'] ?? $item['account_title'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'product_name_asc':
                return $collection->sortBy(function ($item) {
                    return $item['product_name'] ?? $item['item_name'] ?? $item['item_description'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'product_name_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['product_name'] ?? $item['item_name'] ?? $item['item_description'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'percentage_desc':
                return $collection->sortByDesc('percentage')->values()->toArray();
            case 'percentage_asc':
                return $collection->sortBy('percentage')->values()->toArray();
            case 'balance_desc':
                return $collection->sortByDesc('balance')->values()->toArray();
            case 'balance_asc':
                return $collection->sortBy('balance')->values()->toArray();
            default:
                return $data;
        }
    }

    public function billWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesQuery($fromDate, $toDate)
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->join('salemen', 'sales.salesman_id', '=', 'salemen.id');

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['salesman_id']) $query->where('sales.salesman_id', $filters['salesman_id']);
        $this->applyGeoFilters($query, $filters);
        
        if ($filters['company_id'] || $filters['category_id']) {
            $query->whereExists(function ($q) use ($filters) {
                $q->select(DB::raw(1))
                    ->from('sales_items')
                    ->join('items', 'sales_items.item_id', '=', 'items.id')
                    ->whereRaw('sales_items.sale_id = sales.id');
                if ($filters['company_id']) $q->where('items.company', $filters['company_id']);
                if ($filters['category_id']) $q->where('items.category', $filters['category_id']);
            });
        }

        $results = $query->select(
            'sales.id',
            'sales.invoice',
            'sales.date',
            'accounts.title as customer_name',
            'salemen.name as salesman_name',
            'sales.gross_total as gross',
            'sales.discount_total as discount',
            'sales.net_total as amount',
            'sales.paid_amount',
            'sales.status'
        )
        ->distinct()
        ->orderBy('sales.date', 'desc')
        ->orderBy('sales.id', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function dateWise($fromDate, $toDate, $filters = [])
    {
        $itemsSummary = DB::table('sales_items')
            ->select('sale_id',
                DB::raw('SUM(qty_carton) as qty_full'),
                DB::raw('SUM(qty_pcs) as qty_pcs'),
                DB::raw('SUM(discount) as items_discount'),
                DB::raw('SUM(subtotal) as items_amount')
            )
            ->groupBy('sale_id');

        if ($filters['item_id']) {
            $itemsSummary->where('item_id', $filters['item_id']);
        }
        if ($filters['category_id']) {
            $itemsSummary->join('items', 'sales_items.item_id', '=', 'items.id')
                         ->where('items.category', $filters['category_id']);
        }
        if ($filters['company_id']) {
            if (!$filters['category_id']) {
                $itemsSummary->join('items', 'sales_items.item_id', '=', 'items.id');
            }
            $itemsSummary->where('items.company', $filters['company_id']);
        }

        $salesQuery = DB::table('sales')
            ->joinSub($itemsSummary, 'items_sum', 'sales.id', '=', 'items_sum.sale_id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        if ($filters['customer_id']) $salesQuery->where('sales.customer_id', $filters['customer_id']);
        if ($filters['salesman_id']) $salesQuery->where('sales.salesman_id', $filters['salesman_id']);
        $this->applyGeoFilters($salesQuery, $filters);
        if ($filters['firm_id']) $salesQuery->where('sales.firm_id', $filters['firm_id']);

        $salesResults = $salesQuery->select(
            'sales.date',
            DB::raw('COUNT(DISTINCT sales.id) as bill_count'),
            DB::raw('SUM(items_sum.qty_full) as qty_full'),
            DB::raw('SUM(items_sum.qty_pcs) as qty_pcs'),
            DB::raw('SUM(items_sum.items_amount) as gross'),
            DB::raw('SUM(items_sum.items_discount) as discount'),
            DB::raw('SUM(items_sum.items_amount - items_sum.items_discount) as amount')
        )
        ->groupBy('sales.date')
        ->get()
        ->keyBy('date');

        // Query sales returns for same date range and matching filters
        $returnsQuery = DB::table('sales_returns')
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate]);

        if ($filters['customer_id']) $returnsQuery->where('sales_returns.customer_id', $filters['customer_id']);
        if ($filters['salesman_id']) $returnsQuery->where('sales_returns.salesman_id', $filters['salesman_id']);
        $this->applyGeoFilters($returnsQuery, $filters);
        
        if ($filters['firm_id']) {
            $returnsQuery->join('sales', 'sales_returns.sale_id', '=', 'sales.id')
                         ->where('sales.firm_id', $filters['firm_id']);
        }

        if ($filters['item_id'] || $filters['category_id'] || $filters['company_id']) {
            $returnsQuery->join('sales_return_items', 'sales_returns.id', '=', 'sales_return_items.sales_return_id');
            if ($filters['item_id']) {
                $returnsQuery->where('sales_return_items.item_id', $filters['item_id']);
            }
            if ($filters['category_id'] || $filters['company_id']) {
                $returnsQuery->join('items', 'sales_return_items.item_id', '=', 'items.id');
                if ($filters['category_id']) $returnsQuery->where('items.category', $filters['category_id']);
                if ($filters['company_id']) $returnsQuery->where('items.company', $filters['company_id']);
            }
            $returnsGroup = $returnsQuery->select(
                'sales_returns.date',
                DB::raw('SUM(sales_return_items.subtotal) as total_return')
            );
        } else {
            $returnsGroup = $returnsQuery->select(
                'sales_returns.date',
                DB::raw('SUM(sales_returns.net_total - sales_returns.extra_discount) as total_return')
            );
        }

        $returnsResults = $returnsGroup->groupBy('sales_returns.date')
            ->get()
            ->keyBy('date');

        // Merge Sales and Returns by Date
        $allDates = array_unique(array_merge($salesResults->keys()->toArray(), $returnsResults->keys()->toArray()));
        rsort($allDates);

        $merged = [];
        foreach ($allDates as $date) {
            $sale = $salesResults->get($date);
            $return = $returnsResults->get($date);

            $sales_return_val = $return ? (float)$return->total_return : 0.0;
            $amount_val = $sale ? (float)$sale->amount : 0.0;

            $merged[] = [
                'date' => $date,
                'bill_count' => $sale ? (int)$sale->bill_count : 0,
                'qty_full' => $sale ? (float)$sale->qty_full : 0.0,
                'qty_pcs' => $sale ? (float)$sale->qty_pcs : 0.0,
                'gross' => $sale ? (float)$sale->gross : 0.0,
                'discount' => $sale ? (float)$sale->discount : 0.0,
                'sales_return' => $sales_return_val,
                'amount' => $amount_val - $sales_return_val
            ];
        }

        return $merged;
    }

    public function details($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesItemsQuery($fromDate, $toDate)
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id');

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['item_id']) $query->where('sales_items.item_id', $filters['item_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);
        $this->applyGeoFilters($query, $filters);
        if ($filters['company_id']) $query->where('items.company', $filters['company_id']);

        $results = $query->select(
            'sales.invoice',
            'sales.date',
            'accounts.title as customer_name',
            'items.title as product_name',
            'sales_items.qty_carton as qty_full',
            'sales_items.qty_pcs',
            'sales_items.trade_price as tp',
            'sales_items.discount as discount',
            'sales_items.subtotal as amount'
        )
        ->orderBy('sales.date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function invoiceDetails($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesItemsQuery($fromDate, $toDate)
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->leftJoin('salemen', 'sales.salesman_id', '=', 'salemen.id');

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'sales.id as sale_id',
            'sales.invoice as inv_no',
            'sales.date as inv_date',
            'accounts.title as account_title',
            'salemen.name as salesman_name',
            'sales.net_total as inv_amount',
            'items.title as item_name',
            'sales_items.trade_price',
            'sales_items.qty_carton as qty_full',
            'sales_items.qty_pcs',
            'sales_items.trade_price as rate',
            'sales_items.bonus_qty_carton as bonus_full',
            'sales_items.bonus_qty_pcs as bonus_pcs',
            'sales_items.discount as disc_1',
            DB::raw('0 as disc_2'),
            DB::raw('0 as tax'),
            'sales_items.subtotal as amount'
        )
        ->orderBy('sales.date', 'desc')
        ->orderBy('sales.invoice', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function monthWiseMatrix($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'accounts.title as account_name',
            'items.title as item_name',
            DB::raw("DATE_FORMAT(sales.date, '%M') as month_name"),
            DB::raw('SUM(sales_items.qty_carton) as qty_f'),
            DB::raw('SUM(sales_items.qty_pcs) as qty_p'),
            DB::raw('SUM(sales_items.subtotal) as amount')
        )
        ->groupBy('accounts.id', 'accounts.title', 'items.id', 'items.title', 'month_name')
        ->orderBy('accounts.title')
        ->orderBy('items.title')
        ->get();

        return $this->transformToArray($results);
    }

    public function monthWiseAmountSummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);

        $results = $query->select(
            'accounts.title as account_name',
            DB::raw("DATE_FORMAT(sales.date, '%M') as month_name"),
            DB::raw('SUM(sales_items.subtotal) as amount')
        )
        ->groupBy('accounts.id', 'accounts.title', 'month_name')
        ->orderBy('accounts.title')
        ->get();

        return $this->transformToArray($results);
    }

    public function monthWiseQtySummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);

        $results = $query->select(
            'accounts.title as account_name',
            DB::raw("DATE_FORMAT(sales.date, '%M') as month_name"),
            DB::raw('SUM(sales_items.qty_carton) as qty_f'),
            DB::raw('SUM(sales_items.qty_pcs) as qty_p')
        )
        ->groupBy('accounts.id', 'accounts.title', 'month_name')
        ->orderBy('accounts.title')
        ->get();

        return $this->transformToArray($results);
    }


    public function areaWisePartySummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('sales')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->leftJoin('subareas', 'accounts.subarea_id', '=', 'subareas.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        $this->applyGeoFilters($query, $filters);
        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['salesman_id']) $query->where('sales.salesman_id', $filters['salesman_id']);

        $results = $query->select(
            'subareas.name as subarea_name',
            'accounts.title as account_title',
            DB::raw('SUM(sales.net_total) as amount')
        )
        ->groupBy('subareas.id', 'subareas.name', 'accounts.id', 'accounts.title')
        ->orderBy('subareas.name')
        ->orderBy('accounts.title')
        ->get();

        return $this->transformToArray($results);
    }

    public function areaWiseItemPartySummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->leftJoin('subareas', 'accounts.subarea_id', '=', 'subareas.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        $this->applyGeoFilters($query, $filters);
        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['item_id']) $query->where('sales_items.item_id', $filters['item_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'subareas.name as subarea_name',
            'accounts.title as account_title',
            'items.title as product_name',
            'items.packing_qty as pack_size',
            'sales_items.qty_carton as qty_full',
            'sales_items.qty_pcs',
            'sales_items.trade_price as rate',
            'sales_items.subtotal as amount'
        )
        ->orderBy('subareas.name')
        ->orderBy('accounts.title')
        ->orderBy('items.title')
        ->get();

        return $this->transformToArray($results);
    }

    public function companyWiseSummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->leftJoin('accounts as companies', 'items.company', '=', 'companies.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        if ($filters['firm_id']) $query->where('sales.firm_id', $filters['firm_id']);
        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'companies.title as company_name',
            DB::raw('SUM(sales_items.subtotal) as amount')
        )
        ->groupBy('companies.id', 'companies.title')
        ->orderBy('companies.title')
        ->get();

        $totalAmount = $results->sum('amount');

        return $results->map(function($row) use ($totalAmount) {
            $row->percentage = $totalAmount > 0 ? ($row->amount / $totalAmount) * 100 : 0;
            return (array)$row;
        })->toArray();
    }

    public function itemWiseSummary($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesItemsQuery($fromDate, $toDate)
            ->join('items', 'sales_items.item_id', '=', 'items.id');

        if ($filters['item_id']) $query->where('sales_items.item_id', $filters['item_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'items.title as item_description',
            'items.packing_qty as packing',
            DB::raw('SUM(sales_items.qty_carton) as qty_full'),
            DB::raw('SUM(sales_items.qty_pcs) as qty_pcs'),
            DB::raw('SUM(sales_items.subtotal + sales_items.discount) as gross_amount'),
            DB::raw('SUM(sales_items.discount) as disc_amt'),
            DB::raw('SUM(sales_items.subtotal) as net_amount')
        )
        ->groupBy('items.id', 'items.title', 'items.packing_qty')
        ->orderBy('items.title')
        ->get();

        if ($filters['item_id'] && $results->count() > 0) {
            $history = $this->details($fromDate, $toDate, $filters);
            $results[0]->history = $history;
        }

        return $this->transformToArray($results);
    }

    public function itemPartyWiseSummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['item_id']) $query->where('sales_items.item_id', $filters['item_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'accounts.title as account_title',
            'items.title as product_name',
            'items.packing_qty as pack_size',
            DB::raw('SUM(sales_items.qty_carton) as qty_full'),
            DB::raw('SUM(sales_items.qty_pcs) as qty_pcs'),
            DB::raw('AVG(sales_items.trade_price) as rate'),
            DB::raw('SUM(sales_items.subtotal) as amount')
        )
        ->groupBy('accounts.id', 'accounts.title', 'items.id', 'items.title', 'items.packing_qty')
        ->orderBy('accounts.title')
        ->orderBy('items.title')
        ->get();

        return $this->transformToArray($results);
    }

    public function partyWiseSummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['salesman_id']) $query->where('sales.salesman_id', $filters['salesman_id']);

        $results = $query->select(
            'accounts.title as party_name',
            DB::raw('SUM(sales_items.qty_carton) as qty_full'),
            DB::raw('SUM(sales_items.qty_pcs) as qty_pcs'),
            DB::raw('SUM(sales_items.subtotal + sales_items.discount) as gross_amount'),
            DB::raw('SUM(sales_items.discount) as disc_amt'),
            DB::raw('SUM(sales_items.subtotal) as net_amount')
        )
        ->groupBy('accounts.id', 'accounts.title')
        ->orderBy('accounts.title')
        ->get();

        return $this->transformToArray($results);
    }

    public function salesRecoverySummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('accounts')
            ->join('account_types', 'accounts.type', '=', 'account_types.id')
            ->leftJoin('areas', 'accounts.area_id', '=', 'areas.id')
            ->leftJoin('subareas', 'accounts.subarea_id', '=', 'subareas.id')
            ->whereRaw("LOWER(account_types.name) = 'customers'");

        if ($filters['area_id']) $query->where('accounts.area_id', $filters['area_id']);
        if ($filters['customer_id']) $query->where('accounts.id', $filters['customer_id']);
        if ($filters['salesman_id']) $query->where('accounts.saleman_id', $filters['salesman_id']);

        $results = $query->select(
            'subareas.name as area_name',
            'accounts.title as account_name',
            'accounts.mobile as contact',
            DB::raw("(SELECT COALESCE(SUM(net_total), 0) FROM sales WHERE customer_id = accounts.id AND date BETWEEN '$fromDate' AND '$toDate') as sales"),
            DB::raw("(SELECT COALESCE(SUM(net_total), 0) FROM sales_returns WHERE customer_id = accounts.id AND date BETWEEN '$fromDate' AND '$toDate') as returns"),
            DB::raw("(SELECT COALESCE(SUM(discount), 0) FROM payments WHERE account_id = accounts.id AND type = 'RECEIPT' AND date BETWEEN '$fromDate' AND '$toDate' AND (cheque_status IS NULL OR cheque_status != 'Canceled')) as discount"),
            DB::raw("(SELECT COALESCE(SUM(amount), 0) FROM payments WHERE account_id = accounts.id AND type = 'RECEIPT' AND date BETWEEN '$fromDate' AND '$toDate' AND (cheque_status IS NULL OR cheque_status != 'Canceled')) as received"),
            DB::raw("
                CAST(accounts.opening_balance AS DECIMAL(15,2)) + 
                COALESCE((SELECT SUM(net_total) FROM sales WHERE customer_id = accounts.id), 0) + 
                COALESCE((SELECT SUM(amount + discount) FROM payments WHERE account_id = accounts.id AND type = 'PAYMENT' AND (cheque_status IS NULL OR cheque_status != 'Canceled')), 0) - 
                COALESCE((SELECT SUM(net_total) FROM sales_returns WHERE customer_id = accounts.id), 0) - 
                COALESCE((SELECT SUM(amount + discount) FROM payments WHERE account_id = accounts.id AND type = 'RECEIPT' AND (cheque_status IS NULL OR cheque_status != 'Canceled')), 0)
            as balance")
        )
        ->orderBy('subareas.name')
        ->orderBy('accounts.title')
        ->get();

        // Option B: Filter out customers with zero activity in the date range
        $filtered = $results->filter(function($row) {
            return (float)$row->sales != 0 
                || (float)$row->returns != 0 
                || (float)$row->discount != 0 
                || (float)$row->received != 0;
        });

        return $this->transformToArray($filtered->values());
    }

    public function salesmanWiseSummary($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('salemen')
            ->leftJoin('sales', function($join) use ($fromDate, $toDate) {
                $join->on('salemen.id', '=', 'sales.salesman_id')
                    ->whereBetween('sales.date', [$fromDate, $toDate]);
            });

        if ($filters['salesman_id']) $query->where('salemen.id', $filters['salesman_id']);

        $results = $query->select(
            'salemen.name as salesman_name',
            DB::raw('COALESCE(SUM(sales.gross_total), 0) as gross'),
            DB::raw('COALESCE(SUM(sales.discount_total), 0) as discount'),
            DB::raw('COALESCE(SUM(sales.net_total), 0) as amount'),
            DB::raw('COALESCE(SUM(sales.paid_amount), 0) as recovery')
        )
        ->groupBy('salemen.id', 'salemen.name')
        ->orderBy('salemen.name')
        ->get();

        $totalAmount = $results->sum('amount');

        return $results->map(function($row) use ($totalAmount) {
            $row->percentage = $totalAmount > 0 ? ($row->amount / $totalAmount) * 100 : 0;
            return (array)$row;
        })->toArray();
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
