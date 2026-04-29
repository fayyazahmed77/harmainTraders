<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockReportBuilder
{
    public function calculate($reportId, $params)
    {
        $toDate = $params['toDate'] ?? date('Y-m-d');
        
        $filters = [
            'item_id' => ($params['itemId'] ?? 'ALL') === 'ALL' ? null : $params['itemId'],
            'company_id' => ($params['companyId'] ?? 'ALL') === 'ALL' ? null : $params['companyId'],
            'category_id' => ($params['categoryId'] ?? 'ALL') === 'ALL' ? null : $params['categoryId'],
            'item_type' => ($params['itemType'] ?? 'ALL') === 'ALL' ? null : $params['itemType'],
            'godown_id' => ($params['godownId'] ?? 'ALL') === 'ALL' ? null : $params['godownId'],
            'firm_id' => ($params['firmId'] ?? 'ALL') === 'ALL' ? null : $params['firmId'],
            'valuation' => $params['valuation'] ?? 'last_purchase',
        ];

        switch ($reportId) {
            case 'summary': return $this->summary($toDate, $filters);
            case 'detail': return $this->detail($toDate, $filters);
            case 'price_list': return $this->priceList($filters);
            case 'type_wise': return $this->typeWiseSummary($toDate, $filters);
            case 'less_than_zero': return $this->lessThanZero($toDate, $filters);
            case 'available_stock': return $this->availableStock($toDate, $filters);
            default: return [];
        }
    }

    private function getBaseStockQuery($toDate, $filters)
    {
        $query = DB::table('items')
            ->leftJoin('accounts as companies', 'items.company', '=', 'companies.id')
            ->leftJoin('item_categories', 'items.category', '=', 'item_categories.id');

        if (isset($filters['item_id']) && $filters['item_id'] !== 'ALL') $query->where('items.id', $filters['item_id']);
        if (isset($filters['company_id']) && $filters['company_id'] !== 'ALL') $query->where('items.company', $filters['company_id']);
        if (isset($filters['category_id']) && $filters['category_id'] !== 'ALL') $query->where('items.category', $filters['category_id']);
        if (isset($filters['item_type']) && $filters['item_type'] !== 'ALL') $query->where('items.type', $filters['item_type']);

        return $query;
    }

    public function summary($toDate, $filters)
    {
        $query = $this->getBaseStockQuery($toDate, $filters);

        // Subqueries for In/Out calculation with date filter
        $purchaseQty = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'))
            ->whereDate('purchases.date', '<=', $toDate)
            ->groupBy('item_id');

        $saleReturnQty = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'))
            ->whereDate('sales_returns.date', '<=', $toDate)
            ->groupBy('item_id');

        $saleQty = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'))
            ->whereDate('sales.date', '<=', $toDate)
            ->groupBy('item_id');

        $purchaseReturnQty = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'))
            ->whereDate('purchase_returns.date', '<=', $toDate)
            ->groupBy('item_id');

        $results = $query->select(
            'items.id',
            'items.title as item_name',
            'items.type as item_type',
            'companies.title as company_name',
            'item_categories.name as category_name',
            'items.packing_qty',
            'items.retail',
            DB::raw('COALESCE(p.total, 0) + COALESCE(sr.total, 0) as in_qty'),
            DB::raw('COALESCE(s.total, 0) + COALESCE(pr.total, 0) as out_qty'),
            DB::raw('items.trade_price as rate'),
            DB::raw('(COALESCE(p.total, 0) + COALESCE(sr.total, 0)) - (COALESCE(s.total, 0) + COALESCE(pr.total, 0)) as balance_qty')
        )
        ->leftJoinSub($purchaseQty, 'p', 'items.id', '=', 'p.item_id')
        ->leftJoinSub($saleReturnQty, 'sr', 'items.id', '=', 'sr.item_id')
        ->leftJoinSub($saleQty, 's', 'items.id', '=', 's.item_id')
        ->leftJoinSub($purchaseReturnQty, 'pr', 'items.id', '=', 'pr.item_id')
        ->get();

        return $results->map(function($row) {
            $row = (array)$row;
            $row['amount'] = $row['balance_qty'] * $row['rate'];
            return $row;
        })->toArray();
    }

    public function detail($toDate, $filters)
    {
        $fromDate = request('fromDate', '2000-01-01');
        
        $purchases = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->select(
                'purchases.date',
                DB::raw('CAST(purchases.id AS CHAR) as voucher_no'),
                'accounts.title as account_name',
                'purchase_items.trade_price as rate',
                'purchase_items.total_pcs as in_qty',
                DB::raw('0 as out_qty'),
                DB::raw("'purchase' as type"),
                'items.trade_price as cogs_rate'
            )
            ->whereDate('purchases.date', '<=', $toDate);

        $sales = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->select(
                'sales.date',
                DB::raw('CAST(sales.id AS CHAR) as voucher_no'),
                'accounts.title as account_name',
                'sales_items.trade_price as rate',
                DB::raw('0 as in_qty'),
                'sales_items.total_pcs as out_qty',
                DB::raw("'sale' as type"),
                'items.trade_price as cogs_rate'
            )
            ->whereDate('sales.date', '<=', $toDate);

        $saleReturns = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->join('items', 'sales_return_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->select(
                'sales_returns.date',
                DB::raw('CAST(sales_returns.id AS CHAR) as voucher_no'),
                'accounts.title as account_name',
                'sales_return_items.trade_price as rate',
                'sales_return_items.total_pcs as in_qty',
                DB::raw('0 as out_qty'),
                DB::raw("'sale_return' as type"),
                'items.trade_price as cogs_rate'
            )
            ->whereDate('sales_returns.date', '<=', $toDate);

        $purchaseReturns = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->join('items', 'purchase_return_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id')
            ->select(
                'purchase_returns.date',
                DB::raw('CAST(purchase_returns.id AS CHAR) as voucher_no'),
                'accounts.title as account_name',
                'purchase_return_items.trade_price as rate',
                DB::raw('0 as in_qty'),
                'purchase_return_items.total_pcs as out_qty',
                DB::raw("'purchase_return' as type"),
                'items.trade_price as cogs_rate'
            )
            ->whereDate('purchase_returns.date', '<=', $toDate);

        if ($filters['item_id']) {
            $purchases->where('purchase_items.item_id', $filters['item_id']);
            $sales->where('sales_items.item_id', $filters['item_id']);
            $saleReturns->where('sales_return_items.item_id', $filters['item_id']);
            $purchaseReturns->where('purchase_return_items.item_id', $filters['item_id']);
        }

        $union = $purchases->unionAll($sales)
            ->unionAll($saleReturns)
            ->unionAll($purchaseReturns)
            ->orderBy('date')
            ->get();

        $balance = 0;
        return $union->map(function($row) use (&$balance) {
            $balance += ($row->in_qty - $row->out_qty);
            $row->balance = $balance;
            $row->amount = $balance * $row->cogs_rate;
            
            // Calculate Profit/Loss for sales
            if ($row->type === 'sale') {
                $row->profit_loss = ($row->rate - $row->cogs_rate) * $row->out_qty;
            } else {
                $row->profit_loss = 0;
            }

            return (array)$row;
        })->toArray();
    }

    public function priceList($filters)
    {
        $query = DB::table('items')
            ->select(
                'items.code',
                'items.title as item_name',
                'items.trade_price as trade_price',
                'items.retail as retail',
                'items.pt2',
                'items.pt3',
                'items.pt4',
                'items.pt5',
                'items.pt6',
                'items.pt7'
            )
            ->where('items.is_active', true);

        if (isset($filters['company_id']) && $filters['company_id'] !== 'ALL') {
            $query->where('items.company', $filters['company_id']);
        }

        if (isset($filters['category_id']) && $filters['category_id'] !== 'ALL') {
            $query->where('items.category', $filters['category_id']);
        }

        return $query->orderBy('items.title')->get()->map(fn($row) => (array)$row)->toArray();
    }

    public function typeWiseSummary($toDate, $filters)
    {
        return $this->summary($toDate, $filters);
    }

    public function lessThanZero($toDate, $filters)
    {
        // Filter results where balance_qty < 0
        $data = $this->summary($toDate, $filters);
        return array_values(array_filter($data, function($row) {
            return $row['balance_qty'] < 0;
        }));
    }

    public function availableStock($toDate, $filters)
    {
        $data = $this->summary($toDate, $filters);
        
        $available = array_filter($data, function($row) {
            return $row['balance_qty'] > 0;
        });

        if (empty($available)) return [];

        $itemIds = array_column($available, 'id');

        $lastPurchases = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('accounts as suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->whereIn('purchase_items.item_id', $itemIds)
            ->where('purchase_items.id', function($query) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('purchase_items as pi')
                    ->whereColumn('pi.item_id', 'purchase_items.item_id');
            })
            ->select('purchase_items.item_id', 'purchase_items.trade_price as last_purchase_price', 'suppliers.title as last_supplier_name')
            ->get()
            ->keyBy('item_id');

        return array_values(array_map(function($row) use ($lastPurchases) {
            $lp = $lastPurchases->get($row['id']);
            $row['last_purchase_price'] = $lp ? $lp->last_purchase_price : 0;
            $row['last_supplier_name'] = $lp ? $lp->last_supplier_name : 'N/A';
            
            $packingQty = $row['packing_qty'] ?: 1;
            $row['full_qty'] = floor($row['balance_qty'] / $packingQty);
            $row['pcs_qty'] = $row['balance_qty'] % $packingQty;
            
            return $row;
        }, $available));
    }
}
