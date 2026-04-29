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

        $results = $query->select(
            'purchase_returns.invoice',
            'purchase_returns.date',
            'accounts.title as account_name',
            'purchase_returns.gross_total as gross',
            'purchase_returns.discount_total as discount',
            'purchase_returns.net_total as amount'
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
            DB::raw('SUM(net_total) as total_amount')
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
        ];

        switch ($reportId) {
            case 'bill': return $this->billWise($fromDate, $toDate, $filters);
            case 'date': return $this->dateWise($fromDate, $toDate, $filters);
            case 'details': return $this->details($fromDate, $toDate, $filters);
            case 'invoice_details': return $this->details($fromDate, $toDate, $filters); // Returns usually simple, reuse details
            case 'item': return $this->itemWise($fromDate, $toDate, $filters);
            case 'month': return $this->monthWise($fromDate, $toDate, $filters);
            case 'payment': return $this->paymentWise($fromDate, $toDate, $filters);
            default: return $this->billWise($fromDate, $toDate, $filters);
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
