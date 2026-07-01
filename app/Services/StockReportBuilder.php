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
            'remove_zero' => filter_var($params['remove_zero'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'show_zero' => filter_var($params['show_zero'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'reorder_level' => filter_var($params['reorder_level'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'remove_negative' => filter_var($params['remove_negative'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'all' => filter_var($params['all'] ?? true, FILTER_VALIDATE_BOOLEAN),
        ];

        switch ($reportId) {
            case 'summary': $data = $this->summary($toDate, $filters); break;
            case 'detail': $data = $this->detail($toDate, $filters); break;
            case 'price_list': $data = $this->priceList($filters); break;
            case 'type_wise': $data = $this->typeWiseSummary($toDate, $filters); break;
            case 'less_than_zero': $data = $this->lessThanZero($toDate, $filters); break;
            case 'available_stock': $data = $this->availableStock($toDate, $filters); break;
            case 're_order_level': $data = $this->reOrderLevel($toDate, $filters); break;
            default: $data = []; break;
        }

        // Apply sorting if a sortBy parameter is present
        if (!empty($params['sortBy']) && $params['sortBy'] !== 'default') {
            $data = $this->sortData($data, $params['sortBy']);
        }

        return $data;
    }

    /**
     * Sort stock report data based on chosen filter.
     */
    private function sortData($data, $sortBy)
    {
        $collection = collect($data);

        switch ($sortBy) {
            case 'amount_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['amount'] ?? $item['trade_price'] ?? 0;
                })->values()->toArray();
            case 'amount_asc':
                return $collection->sortBy(function ($item) {
                    return $item['amount'] ?? $item['trade_price'] ?? 0;
                })->values()->toArray();
            case 'qty_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['balance_qty'] ?? $item['balance'] ?? $item['in_qty'] ?? 0;
                })->values()->toArray();
            case 'qty_asc':
                return $collection->sortBy(function ($item) {
                    return $item['balance_qty'] ?? $item['balance'] ?? $item['in_qty'] ?? 0;
                })->values()->toArray();
            case 'shortfall_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['shortfall'] ?? 0;
                })->values()->toArray();
            case 'shortfall_asc':
                return $collection->sortBy(function ($item) {
                    return $item['shortfall'] ?? 0;
                })->values()->toArray();
            case 'item_name_asc':
                return $collection->sortBy(function ($item) {
                    return $item['item_name'] ?? $item['account_name'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'item_name_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['item_name'] ?? $item['account_name'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'company_name_asc':
                return $collection->sortBy(function ($item) {
                    return $item['company_name'] ?? $item['last_supplier_name'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'company_name_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['company_name'] ?? $item['last_supplier_name'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'category_name_asc':
                return $collection->sortBy(function ($item) {
                    return $item['category_name'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'category_name_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['category_name'] ?? '';
                }, SORT_NATURAL | SORT_FLAG_CASE)->values()->toArray();
            case 'date_desc':
                return $collection->sortByDesc(function ($item) {
                    return $item['date'] ?? '';
                })->values()->toArray();
            case 'date_asc':
                return $collection->sortBy(function ($item) {
                    return $item['date'] ?? '';
                })->values()->toArray();
            default:
                return $data;
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
            ->select(
                'item_id', 
                DB::raw('SUM(total_pcs) as total'),
                DB::raw('SUM(subtotal) / SUM(total_pcs) as avg_rate'),
                DB::raw('(SELECT trade_price FROM purchase_items pi2 WHERE pi2.item_id = purchase_items.item_id ORDER BY id DESC LIMIT 1) as last_rate')
            )
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
            'items.reorder_level',
            'companies.title as company_name',
            'item_categories.name as category_name',
            'items.packing_qty',
            'items.retail',
            'items.trade_price as base_tp',
            DB::raw('COALESCE(p.total, 0) + COALESCE(sr.total, 0) as in_qty'),
            DB::raw('COALESCE(s.total, 0) + COALESCE(pr.total, 0) as out_qty'),
            DB::raw('(COALESCE(p.total, 0) + COALESCE(sr.total, 0)) - (COALESCE(s.total, 0) + COALESCE(pr.total, 0)) as balance_qty'),
            DB::raw('COALESCE(p.avg_rate * items.packing_qty, items.trade_price) as avg_rate'),
            DB::raw('COALESCE(p.last_rate, items.trade_price) as last_rate')
        )
        ->leftJoinSub($purchaseQty, 'p', 'items.id', '=', 'p.item_id')
        ->leftJoinSub($saleReturnQty, 'sr', 'items.id', '=', 'sr.item_id')
        ->leftJoinSub($saleQty, 's', 'items.id', '=', 's.item_id')
        ->leftJoinSub($purchaseReturnQty, 'pr', 'items.id', '=', 'pr.item_id')
        ->get();

        $data = $results->map(function($row) use ($filters) {
            $row = (array)$row;
            
            // Apply Valuation Logic
            $row['rate'] = ($filters['valuation'] === 'average') ? $row['avg_rate'] : $row['last_rate'];
            if (!$row['rate'] || $row['rate'] == 0) $row['rate'] = $row['base_tp'];

            $row['amount'] = ($row['balance_qty'] / ($row['packing_qty'] ?: 1)) * $row['rate'];
            
            return $row;
        });

        // Apply Calculation Filters
        if (!$filters['all']) {
            if ($filters['remove_zero']) {
                $data = $data->filter(fn($r) => floatval($r['balance_qty']) != 0);
            }
            if ($filters['show_zero']) {
                $data = $data->filter(fn($r) => floatval($r['balance_qty']) == 0);
            }
            if ($filters['reorder_level']) {
                $data = $data->filter(fn($r) => floatval($r['balance_qty']) < (floatval($r['reorder_level'] ?? 0)));
            }
            if ($filters['remove_negative']) {
                $data = $data->filter(fn($r) => floatval($r['balance_qty']) >= 0);
            }
        }

        return $data->values()->toArray();
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

    public function reOrderLevel($toDate, $filters)
    {
        // Force reorder_level filter to true for this specific report
        $filters['reorder_level'] = true;
        $filters['all'] = false; // Ensure filter is applied

        $data = $this->summary($toDate, $filters);

        return array_values(array_map(function($row) {
            $row['shortfall'] = max(0, floatval($row['reorder_level'] ?? 0) - floatval($row['balance_qty']));
            return $row;
        }, $data));
    }
}
