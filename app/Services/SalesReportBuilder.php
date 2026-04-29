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
        ];

        // Routing to specific methods (Placeholder implementations for now)
        switch ($reportId) {
            case 'bill': return $this->billWise($fromDate, $toDate, $filters);
            case 'details_wise':
            case 'detail': return $this->details($fromDate, $toDate, $filters);
            case 'area_party': return $this->areaWisePartySummary($fromDate, $toDate, $filters);
            case 'area_item_party': return $this->areaWiseItemPartySummary($fromDate, $toDate, $filters);
            case 'invoice_details': return $this->invoiceDetails($fromDate, $toDate, $filters);
            case 'month': return $this->monthWiseMatrix($fromDate, $toDate, $filters);
            case 'month_amount': return $this->monthWiseAmountSummary($fromDate, $toDate, $filters);
            case 'month_qty': return $this->monthWiseQtySummary($fromDate, $toDate, $filters);
            case 'company': return $this->companyWiseSummary($fromDate, $toDate, $filters);
            case 'item_party': return $this->itemPartyWiseSummary($fromDate, $toDate, $filters);
            case 'item_summary': return $this->itemWiseSummary($fromDate, $toDate, $filters);
            case 'party_summary': return $this->partyWiseSummary($fromDate, $toDate, $filters);
            case 'recovery': return $this->salesRecoverySummary($fromDate, $toDate, $filters);
            case 'salesman': return $this->salesmanWiseSummary($fromDate, $toDate, $filters);
            default: return []; // Empty for now as requested
        }
    }

    public function billWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesQuery($fromDate, $toDate)
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->join('salemen', 'sales.salesman_id', '=', 'salemen.id');

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['salesman_id']) $query->where('sales.salesman_id', $filters['salesman_id']);

        $results = $query->select(
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
        ->orderBy('sales.date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function details($fromDate, $toDate, $filters = [])
    {
        $query = $this->getSalesItemsQuery($fromDate, $toDate)
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id');

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['item_id']) $query->where('sales_items.item_id', $filters['item_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'sales.invoice',
            'sales.date',
            'accounts.title as customer_name',
            'items.title as product_name',
            'sales_items.qty_carton as qty_full',
            'sales_items.qty_pcs',
            'sales_items.trade_price as tp',
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
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id');

        if ($filters['customer_id']) $query->where('sales.customer_id', $filters['customer_id']);
        if ($filters['category_id']) $query->where('items.category', $filters['category_id']);

        $results = $query->select(
            'sales.id as sale_id',
            'sales.invoice as inv_no',
            'sales.date as inv_date',
            'accounts.title as account_title',
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

        if ($filters['area_id']) $query->where('accounts.area_id', $filters['area_id']);
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

        if ($filters['area_id']) $query->where('accounts.area_id', $filters['area_id']);
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
            ->leftJoin('areas', 'accounts.area_id', '=', 'areas.id')
            ->leftJoin('subareas', 'accounts.subarea_id', '=', 'subareas.id')
            ->where('accounts.sale', 1);

        if ($filters['area_id']) $query->where('accounts.area_id', $filters['area_id']);
        if ($filters['customer_id']) $query->where('accounts.id', $filters['customer_id']);
        if ($filters['salesman_id']) $query->where('accounts.saleman_id', $filters['salesman_id']);

        $results = $query->select(
            'subareas.name as area_name',
            'accounts.title as account_name',
            'accounts.mobile as contact',
            DB::raw("(SELECT COALESCE(SUM(net_total), 0) FROM sales WHERE customer_id = accounts.id AND date BETWEEN '$fromDate' AND '$toDate') as sales"),
            DB::raw("(SELECT COALESCE(SUM(amount + discount), 0) FROM payments WHERE account_id = accounts.id AND type = 'RECEIPT' AND date BETWEEN '$fromDate' AND '$toDate' AND (cheque_status IS NULL OR cheque_status != 'Canceled')) as received"),
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

        return $this->transformToArray($results);
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
}
