<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PurchaseReportBuilder
{
    private function getPurchaseItemsQuery($fromDate, $toDate)
    {
        return DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate]);
    }

    private function getPurchaseQuery($fromDate, $toDate)
    {
        return DB::table('purchases')
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
        $query = $this->getPurchaseQuery($fromDate, $toDate)
            ->join('accounts', 'purchases.supplier_id', '=', 'accounts.id');

        if (!empty($filters['account_id'])) $query->where('purchases.supplier_id', $filters['account_id']);
        if (!empty($filters['firm_id'])) $query->where('purchases.firm_id', $filters['firm_id']);

        $results = $query->select(
            'purchases.invoice',
            'purchases.date',
            'accounts.title as account_name',
            'purchases.gross_total as gross',
            'purchases.discount_total as discount',
            'purchases.net_total as amount',
            'purchases.paid_amount',
            'purchases.status'
        )
        ->orderBy('date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function dateWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getPurchaseQuery($fromDate, $toDate);
        if (!empty($filters['firm_id'])) $query->where('firm_id', $filters['firm_id']);

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
        $query = $this->getPurchaseItemsQuery($fromDate, $toDate)
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->join('accounts', 'purchases.supplier_id', '=', 'accounts.id');

        if (!empty($filters['account_id'])) $query->where('purchases.supplier_id', $filters['account_id']);
        if (!empty($filters['item_id'])) $query->where('purchase_items.item_id', $filters['item_id']);

        $results = $query->select(
            'purchases.invoice',
            'purchases.date',
            'accounts.title as account_name',
            'items.title as product_name',
            'purchase_items.qty_carton as qty_full',
            'purchase_items.qty_pcs',
            'purchase_items.trade_price as tp',
            'purchase_items.trade_price as rate',
            'purchase_items.free_carton as b_full',
            'purchase_items.free_pcs as b_pcs',
            'purchase_items.discount as disc_1',
            DB::raw('0 as disc_2'),
            DB::raw('0 as tax_percent'),
            'purchase_items.gst_amount as tax_amt',
            'purchase_items.subtotal as amount'
        )
        ->orderBy('purchases.date', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function invoiceDetails($fromDate, $toDate, $filters = [])
    {
        $query = $this->getPurchaseItemsQuery($fromDate, $toDate)
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->join('accounts', 'purchases.supplier_id', '=', 'accounts.id');

        if (!empty($filters['account_id'])) $query->where('purchases.supplier_id', $filters['account_id']);

        $results = $query->select(
            'purchases.invoice',
            'purchases.date',
            'accounts.title as account_name',
            'items.title as product_name',
            'purchase_items.qty_carton as qty_full',
            'purchase_items.qty_pcs',
            'purchase_items.trade_price as tp',
            'purchase_items.trade_price as rate',
            'purchase_items.free_carton as b_full',
            'purchase_items.free_pcs as b_pcs',
            'purchase_items.discount as disc_1',
            DB::raw('0 as disc_2'),
            DB::raw('0 as tax_percent'),
            'purchase_items.gst_amount as tax_amt',
            'purchase_items.subtotal as amount'
        )
        ->orderBy('purchases.date', 'desc')
        ->orderBy('purchases.invoice', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function itemWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getPurchaseItemsQuery($fromDate, $toDate)
            ->join('items', 'purchase_items.item_id', '=', 'items.id');

        if (!empty($filters['item_id'])) $query->where('purchase_items.item_id', $filters['item_id']);

        $results = $query->select(
            'items.id',
            'items.title as name',
            'items.packing_qty as packing',
            DB::raw('SUM(purchase_items.qty_carton) as qty_full'),
            DB::raw('SUM(purchase_items.qty_pcs) as qty_pcs'),
            DB::raw('SUM(purchase_items.total_pcs * purchase_items.trade_price) as gross_amount'),
            DB::raw('SUM(purchase_items.discount) as discount_amount'),
            DB::raw('SUM(purchase_items.subtotal) as net_amount')
        )
        ->groupBy('items.id', 'items.title', 'items.packing_qty')
        ->orderBy('net_amount', 'desc')
        ->get();

        return $this->transformToArray($results);
    }

    public function monthWise($fromDate, $toDate, $filters = [])
    {
        $query = $this->getPurchaseQuery($fromDate, $toDate)
            ->join('accounts', 'purchases.supplier_id', '=', 'accounts.id');

        $results = $query->select(
            DB::raw("DATE_FORMAT(date, '%Y-%m') as month_key"),
            DB::raw("DATE_FORMAT(date, '%M %Y') as month_name"),
            'accounts.title as account_name',
            DB::raw('SUM(gross_total) as gross_amount'),
            DB::raw('SUM(discount_total) as discount_amount'),
            DB::raw('SUM(tax_total) as tax_amount'),
            DB::raw('SUM(net_total) as total_amount'),
            DB::raw('SUM(paid_amount) as paid_amount'),
            DB::raw('SUM(net_total - paid_amount) as balance')
        )
        ->groupBy('month_key', 'month_name', 'account_name')
        ->orderBy('month_key', 'asc')
        ->orderBy('account_name', 'asc')
        ->get();

        return $this->transformToArray($results);
    }

    public function paymentWise($fromDate, $toDate, $filters = [])
    {
        $query = DB::table('accounts')
            ->join('account_types', 'accounts.type', '=', 'account_types.id')
            ->where('account_types.name', 'Supplier')
            ->leftJoin('areas', 'accounts.area_id', '=', 'areas.id');

        if (!empty($filters['account_id'])) $query->where('accounts.id', $filters['account_id']);

        // Range Purchases
        $purchases = DB::table('purchases')
            ->select('supplier_id', DB::raw('SUM(net_total) as range_purchase'))
            ->whereBetween('date', [$fromDate, $toDate])
            ->groupBy('supplier_id');

        // Range Payments
        $payments = DB::table('payments')
            ->select('account_id', DB::raw('SUM(amount + discount) as range_payment'))
            ->where('type', 'PAYMENT')
            ->where('cheque_status', '!=', 'Canceled')
            ->whereBetween('date', [$fromDate, $toDate])
            ->groupBy('account_id');

        $query->leftJoinSub($purchases, 'p', 'accounts.id', '=', 'p.supplier_id')
              ->leftJoinSub($payments, 'pay', 'accounts.id', '=', 'pay.account_id');

        // Filter for activity or existing balance
        $query->where(function($q) {
            $q->whereNotNull('p.range_purchase')
              ->orWhereNotNull('pay.range_payment');
        });

        $results = $query->select(
            'areas.name as area_name',
            'accounts.title as account_name',
            'accounts.telephone1 as contact',
            'accounts.id',
            DB::raw('IFNULL(p.range_purchase, 0) as total_purchase'),
            DB::raw('IFNULL(pay.range_payment, 0) as total_payment')
        )
        ->orderBy('accounts.title', 'asc')
        ->get();

        // Map current balance accurately using the Account model's logic
        $transformed = $results->map(function($row) {
            $account = \App\Models\Account::find($row->id);
            $balance = $account ? (float)$account->current_balance : 0;
            return [
                'area_name' => $row->area_name,
                'account_name' => $row->account_name,
                'contact' => $row->contact,
                'total_purchase' => $row->total_purchase,
                'total_payment' => $row->total_payment,
                'balance' => $balance * -1 // Supplier Payable shown as negative in reference
            ];
        });

        return $transformed->toArray();
    }

    public function calculate($reportId, $params)
    {
        $fromDate = $params['fromDate']->format('Y-m-d');
        $toDate = $params['toDate']->format('Y-m-d');
        
        $filters = [
            'account_id' => ($params['accountId'] ?? 'ALL') === 'ALL' ? null : $params['accountId'],
            'item_id' => ($params['itemId'] ?? 'ALL') === 'ALL' ? null : $params['item_id'],
            'firm_id' => ($params['firmId'] ?? 'ALL') === 'ALL' ? null : $params['firmId'],
        ];

        switch ($reportId) {
            case 'bill': return $this->billWise($fromDate, $toDate, $filters);
            case 'date': return $this->dateWise($fromDate, $toDate, $filters);
            case 'details': return $this->details($fromDate, $toDate, $filters);
            case 'invoice_details': return $this->invoiceDetails($fromDate, $toDate, $filters);
            case 'item': return $this->itemWise($fromDate, $toDate, $filters);
            case 'month': return $this->monthWise($fromDate, $toDate, $filters);
            case 'payment': return $this->paymentWise($fromDate, $toDate, $filters);
            default: return $this->billWise($fromDate, $toDate, $filters);
        }
    }
}
