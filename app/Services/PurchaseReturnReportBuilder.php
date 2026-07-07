<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PurchaseReturnReportBuilder
{
    private function getReturnItemsQuery($fromDate, $toDate)
    {
        return DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate]);
    }

    private function getReturnQuery($fromDate, $toDate)
    {
        return DB::table('purchase_returns')
            ->whereBetween('date', [$fromDate, $toDate]);
    }

    private function transformToArray($collection)
    {
        return $collection->map(function($row) {
            return (array)$row;
        })->toArray();
    }

    public function billWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getReturnQuery($fromDate, $toDate)
            ->join('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id');

        if (!empty($filters['account_id'])) $query->where('purchase_returns.supplier_id', $filters['account_id']);
        if (!empty($filters['salesman_id'])) $query->where('purchase_returns.salesman_id', $filters['salesman_id']);
        if (!empty($filters['area_id'])) $query->where('accounts.area_id', $filters['area_id']);
        if (!empty($filters['sub_area_id'])) $query->where('accounts.sub_area_id', $filters['sub_area_id']);
        
        if (!empty($filters['company_id']) || !empty($filters['category_id'])) {
            $query->whereExists(function ($q) use ($filters) {
                $q->select(DB::raw(1))
                    ->from('purchase_return_items')
                    ->join('items', 'purchase_return_items.item_id', '=', 'items.id')
                    ->whereRaw('purchase_return_items.purchase_return_id = purchase_returns.id');
                if (!empty($filters['company_id'])) $q->where('items.company', $filters['company_id']);
                if (!empty($filters['category_id'])) $q->where('items.category_id', $filters['category_id']);
            });
        }

        $results = $query->select(
            'purchase_returns.invoice',
            'purchase_returns.date',
            'accounts.title as account_name',
            'purchase_returns.gross_total as gross',
            DB::raw('(purchase_returns.discount_total + purchase_returns.extra_discount) as discount'),
            DB::raw('(purchase_returns.net_total - purchase_returns.extra_discount) as amount')
        )
        ->orderBy('date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function dateWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getReturnQuery($fromDate, $toDate);

        $results = $query->select(
            'date',
            DB::raw('COUNT(*) as total_bills'),
            DB::raw('SUM(net_total - extra_discount) as total_amount')
        )
        ->groupBy('date')
        ->orderBy('date', 'asc')
        ->get();

        return $results->map(function($row) {
            $dateObj = Carbon::parse($row->date);
            $row->date_display = strtoupper($dateObj->format('d M Y')) . ' ' . $dateObj->format('l');
            return (array)$row;
        })->toArray();
    }

    public function details($fromDate, $toDate, $filters = [])
    {
        $query = $this->getReturnItemsQuery($fromDate, $toDate)
            ->join('items', 'purchase_return_items.item_id', '=', 'items.id')
            ->join('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id');

        if (!empty($filters['account_id'])) $query->where('purchase_returns.supplier_id', $filters['account_id']);
        if (!empty($filters['item_id'])) $query->where('purchase_return_items.item_id', $filters['item_id']);
        if (!empty($filters['salesman_id'])) $query->where('purchase_returns.salesman_id', $filters['salesman_id']);
        if (!empty($filters['area_id'])) $query->where('accounts.area_id', $filters['area_id']);
        if (!empty($filters['sub_area_id'])) $query->where('accounts.sub_area_id', $filters['sub_area_id']);
        if (!empty($filters['company_id'])) $query->where('items.company', $filters['company_id']);
        if (!empty($filters['category_id'])) $query->where('items.category_id', $filters['category_id']);

        $results = $query->select(
            'purchase_returns.invoice',
            'purchase_returns.date',
            'accounts.title as account_name',
            'items.title as product_name',
            'purchase_return_items.qty_carton as qty_full',
            'purchase_return_items.qty_pcs',
            'purchase_return_items.trade_price as tp',
            'purchase_return_items.trade_price as rate',
            'purchase_return_items.discount as disc_1',
            'purchase_return_items.subtotal as amount'
        )
        ->orderBy('purchase_returns.date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function itemWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getReturnItemsQuery($fromDate, $toDate)
            ->join('items', 'purchase_return_items.item_id', '=', 'items.id');

        if (!empty($filters['item_id'])) $query->where('purchase_return_items.item_id', $filters['item_id']);
        if (!empty($filters['company_id'])) $query->where('items.company', $filters['company_id']);
        if (!empty($filters['category_id'])) $query->where('items.category_id', $filters['category_id']);

        $results = $query->select(
            'items.id',
            'items.title as name',
            'items.packing_qty as packing',
            DB::raw('SUM(purchase_return_items.qty_carton) as qty_full'),
            DB::raw('SUM(purchase_return_items.qty_pcs) as qty_pcs'),
            DB::raw('SUM(purchase_return_items.total_pcs * purchase_return_items.trade_price) as gross_amount'),
            DB::raw('SUM(purchase_return_items.discount) as discount_amount'),
            DB::raw('SUM(purchase_return_items.subtotal) as net_amount')
        )
        ->groupBy('items.id', 'items.title', 'items.packing_qty')
        ->orderBy('net_amount', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function calculate($reportId, $params)
    {
        $fromDate = $params['fromDate']->format('Y-m-d');
        $toDate = $params['toDate']->format('Y-m-d');
        
        $filters = [
            'account_id' => ($params['accountId'] ?? 'ALL') === 'ALL' ? null : $params['accountId'],
            'item_id' => ($params['itemId'] ?? 'ALL') === 'ALL' ? null : $params['itemId'],
            'firm_id' => ($params['firmId'] ?? 'ALL') === 'ALL' ? null : $params['firmId'],
            'area_id' => ($params['areaId'] ?? 'ALL') === 'ALL' ? null : $params['areaId'],
            'sub_area_id' => ($params['subAreaId'] ?? 'ALL') === 'ALL' ? null : $params['subAreaId'],
            'category_id' => ($params['categoryId'] ?? 'ALL') === 'ALL' ? null : $params['categoryId'],
            'salesman_id' => ($params['salesmanId'] ?? 'ALL') === 'ALL' ? null : $params['salesmanId'],
            'company_id' => ($params['companyId'] ?? 'ALL') === 'ALL' ? null : $params['companyId'],
        ];

        switch ($reportId) {
            case 'bill': $data = $this->billWise($fromDate, $toDate, $filters); break;
            case 'date': $data = $this->dateWise($fromDate, $toDate, $filters); break;
            case 'details': $data = $this->details($fromDate, $toDate, $filters); break;
            case 'invoice_details': $data = $this->details($fromDate, $toDate, $filters); break; 
            case 'item': $data = $this->itemWise($fromDate, $toDate, $filters); break;
            case 'month': $data = $this->monthWise($fromDate, $toDate, $filters); break;
            case 'payment': $data = $this->paymentWise($fromDate, $toDate, $filters); break;
            default: $data = $this->billWise($fromDate, $toDate, $filters); break;
        }

        // Apply sorting if a sortBy parameter is present
        if (!empty($params['sortBy']) && $params['sortBy'] !== 'default') {
            $data = $this->sortData($data, $params['sortBy']);
        }

        return $data;
    }

    /**
     * Sort purchase return report data based on chosen filter.
     */
    private function sortData($data, $sortBy)
    {
        $collection = collect($data);

        switch ($sortBy) {
            case 'amount_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['amount'] ?? $item['total_amount'] ?? $item['net_amount'] ?? 0;
                })->values()->toArray();
            case 'amount_asc':
                return $collection->sortBy(function ($item) {
                    return $item['amount'] ?? $item['total_amount'] ?? $item['net_amount'] ?? 0;
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
                    return $item['discount'] ?? $item['discount_amount'] ?? 0;
                })->values()->toArray();
            case 'discount_asc':
                return $collection->sortBy(function ($item) {
                    return $item['discount'] ?? $item['discount_amount'] ?? 0;
                })->values()->toArray();
            case 'paid_desc':
                return $collection->sortByDesc('paid_amount')->values()->toArray();
            case 'paid_asc':
                return $collection->sortBy('paid_amount')->values()->toArray();
            case 'qty_desc':
                return $collection->sortByDesc('qty_full')->values()->toArray();
            case 'qty_asc':
                return $collection->sortBy('qty_full')->values()->toArray();
            case 'bills_desc':
                return $collection->sortByDesc('total_bills')->values()->toArray();
            case 'bills_asc':
                return $collection->sortBy('total_bills')->values()->toArray();
            case 'date_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['date'] ?? $item['month'] ?? '';
                })->values()->toArray();
            case 'date_asc':
                return $collection->sortBy(function ($item) {
                    return $item['date'] ?? $item['month'] ?? '';
                })->values()->toArray();
            case 'name_asc':
                return $collection->sortBy(function ($item) {
                    return $item['account_name'] ?? $item['name'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'name_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['account_name'] ?? $item['name'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'product_name_asc':
                return $collection->sortBy('product_name', SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'product_name_desc':
                return $collection->sortByDesc('product_name', SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'balance_desc':
                return $collection->sortByDesc('balance')->values()->toArray();
            case 'balance_asc':
                return $collection->sortBy('balance')->values()->toArray();
            default:
                return $data;
        }
    }

    public function monthWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getReturnQuery($fromDate, $toDate)
            ->join('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id');

        if (!empty($filters['account_id'])) $query->where('purchase_returns.supplier_id', $filters['account_id']);

        $results = $query->select(
            DB::raw("DATE_FORMAT(date, '%Y-%m') as month"),
            DB::raw("DATE_FORMAT(date, '%M %Y') as month_name"),
            'accounts.title as account_name',
            DB::raw('SUM(gross_total) as gross_amount'),
            DB::raw('SUM(discount_total) as discount_amount'),
            DB::raw('SUM(net_total) as total_amount')
        )
        ->groupBy('month', 'month_name', 'account_name')
        ->orderBy('month', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function paymentWise($fromDate, $toDate, $filters = [])
    {
        // For returns, "payment" usually means "credit received" or "adjusted"
        // We'll show the paid (refunded) vs remaining (credited) amounts
        $query = $this->getReturnQuery($fromDate, $toDate)
            ->join('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id');

        if (!empty($filters['account_id'])) $query->where('purchase_returns.supplier_id', $filters['account_id']);

        $results = $query->select(
            'purchase_returns.invoice',
            'purchase_returns.date',
            'accounts.title as account_name',
            'purchase_returns.net_total as total_amount',
            'purchase_returns.paid_amount',
            'purchase_returns.remaining_amount as balance'
        )
        ->orderBy('date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }
}
