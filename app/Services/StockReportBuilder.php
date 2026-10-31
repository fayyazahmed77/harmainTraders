<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockReportBuilder
{
    public function calculate($reportId, $params)
    {
        $toDate = $params['toDate'] ?? date('Y-m-d');
        
        $partyIdParam = $params['partyId'] ?? $params['supplierId'] ?? 'ALL';

        $filters = [
            'fromDate' => $params['fromDate'] ?? request('fromDate', null),
            'toDate' => $toDate,
            'item_id' => ($params['itemId'] ?? 'ALL') === 'ALL' ? null : $params['itemId'],
            'company_id' => ($params['companyId'] ?? 'ALL') === 'ALL' ? null : $params['companyId'],
            'party_id' => $partyIdParam === 'ALL' ? null : $partyIdParam,
            'category_id' => ($params['categoryId'] ?? 'ALL') === 'ALL' ? null : $params['categoryId'],
            'item_type' => ($params['itemType'] ?? 'ALL') === 'ALL' ? null : $params['itemType'],
            'godown_id' => ($params['godownId'] ?? 'ALL') === 'ALL' ? null : $params['godownId'],
            'firm_id' => ($params['firmId'] ?? 'ALL') === 'ALL' ? null : $params['firmId'],
            'valuation' => $params['valuation'] ?? 'last_purchase',
            'remove_zero' => filter_var($params['remove_zero'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'show_zero' => filter_var($params['show_zero'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'reorder_level' => filter_var($params['reorder_level'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'remove_negative' => filter_var($params['remove_negative'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'display_negative' => filter_var($params['display_negative'] ?? false, FILTER_VALIDATE_BOOLEAN),
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
                    $typePriority = ($item['type'] ?? '') === 'opening' ? '1' : '0';
                    return ($item['date'] ?? '') . '_' . $typePriority;
                })->values()->toArray();
            case 'date_asc':
                return $collection->sortBy(function ($item) {
                    $typePriority = ($item['type'] ?? '') === 'opening' ? '0' : '1';
                    return ($item['date'] ?? '') . '_' . $typePriority;
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
                DB::raw('AVG(trade_price) as avg_rate'),
                DB::raw('(SELECT trade_price FROM purchase_items pi2 WHERE pi2.item_id = purchase_items.item_id AND pi2.trade_price > 0 ORDER BY id DESC LIMIT 1) as last_rate')
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
            'items.stock_1 as opening_stock',
            'items.stock_2 as opening_stock_pcs',
            DB::raw('COALESCE(p.total, 0) + COALESCE(sr.total, 0) as in_qty'),
            DB::raw('COALESCE(s.total, 0) + COALESCE(pr.total, 0) as out_qty'),
            DB::raw('((COALESCE(items.stock_1, 0) * CASE WHEN COALESCE(items.packing_qty, 0) > 0 THEN items.packing_qty ELSE 1 END + COALESCE(items.stock_2, 0)) + COALESCE(p.total, 0) + COALESCE(sr.total, 0)) - (COALESCE(s.total, 0) + COALESCE(pr.total, 0)) as balance_qty'),
            DB::raw('COALESCE(NULLIF(p.avg_rate, 0), items.trade_price) as avg_rate'),
            DB::raw('COALESCE(NULLIF(p.last_rate, 0), items.trade_price) as last_rate')
        )
        ->leftJoinSub($purchaseQty, 'p', 'items.id', '=', 'p.item_id')
        ->leftJoinSub($saleReturnQty, 'sr', 'items.id', '=', 'sr.item_id')
        ->leftJoinSub($saleQty, 's', 'items.id', '=', 's.item_id')
        ->leftJoinSub($purchaseReturnQty, 'pr', 'items.id', '=', 'pr.item_id')
        ->get();

        $data = $results->map(function($row) use ($filters) {
            $row = (array)$row;
            
            $lastPurchaseRate = floatval($row['last_rate'] ?? 0);
            $tradePrice = floatval($row['base_tp'] ?? $row['trade_price'] ?? 0);

            // Apply Valuation Logic
            if ($filters['valuation'] === 'average' && floatval($row['avg_rate'] ?? 0) > 0) {
                $rate = floatval($row['avg_rate']);
            } elseif ($filters['valuation'] === 'opening_stock') {
                $rate = $tradePrice;
            } else {
                // Valuation: last_purchase (or default)
                // If item does not have last purchase price, display trade price
                $rate = $lastPurchaseRate > 0 ? $lastPurchaseRate : $tradePrice;
            }

            // Fallback to trade price if rate is still 0 or empty
            if ($rate <= 0) {
                $rate = $tradePrice;
            }

            $row['rate'] = $rate;
            $row['trade_price'] = $tradePrice;
            $row['last_rate'] = $lastPurchaseRate;
            $row['opening_stock'] = floatval($row['opening_stock'] ?? 0);

            $packing = max(1, intval($row['packing_qty'] ?? 1));

            // Balance Qty = Base Opening (Full * Packing + Pcs) + In - Out
            $inQty = floatval($row['in_qty'] ?? 0);
            $outQty = floatval($row['out_qty'] ?? 0);
            $baseOpeningPcs = ($row['opening_stock'] * $packing) + floatval($row['opening_stock_pcs'] ?? 0);
            $row['balance_qty'] = $baseOpeningPcs + $inQty - $outQty;

            if ($filters['valuation'] === 'opening_stock') {
                $opFull = floatval($row['opening_stock'] ?? 0);
                $opPcs = floatval($row['opening_stock_pcs'] ?? 0);
                $row['amount'] = ($opFull * floatval($row['rate'])) + ($packing > 0 ? ($opPcs / $packing) * floatval($row['rate']) : 0);
            } else {
                $row['amount'] = round(($row['balance_qty'] / $packing) * floatval($row['rate']), 2);
            }
            
            return $row;
        });

        // Apply Calculation Filters
        if (!$filters['all']) {
            $isOpeningValuation = ($filters['valuation'] === 'opening_stock');
            if ($filters['remove_zero']) {
                $data = $data->filter(fn($r) => $isOpeningValuation 
                    ? (floatval($r['opening_stock']) != 0 || floatval($r['opening_stock_pcs']) != 0) 
                    : floatval($r['balance_qty']) != 0);
            }
            if ($filters['show_zero']) {
                $data = $data->filter(fn($r) => $isOpeningValuation 
                    ? (floatval($r['opening_stock']) == 0 && floatval($r['opening_stock_pcs']) == 0) 
                    : floatval($r['balance_qty']) == 0);
            }
            if ($filters['reorder_level']) {
                $data = $data->filter(fn($r) => floatval($r['balance_qty']) < (floatval($r['reorder_level'] ?? 0)));
            }
            if ($filters['remove_negative']) {
                $data = $data->filter(fn($r) => floatval($r['balance_qty']) >= 0);
            }
            if ($filters['display_negative']) {
                $data = $data->filter(fn($r) => floatval($r['balance_qty']) < 0);
            }
        }

        return $data->values()->toArray();
    }

    public function detail($toDate, $filters)
    {
        $fromDate = $filters['fromDate'] ?? request('fromDate', '2000-01-01');

        // 1. Items Query matching selected dimensions
        $itemsQuery = DB::table('items')
            ->select('id', 'title', 'packing_qty', 'trade_price', 'stock_1', 'stock_2', 'company', 'category', 'type');

        if ($filters['item_id']) $itemsQuery->where('items.id', $filters['item_id']);
        if ($filters['company_id']) $itemsQuery->where('items.company', $filters['company_id']);
        if ($filters['category_id']) $itemsQuery->where('items.category', $filters['category_id']);
        if ($filters['item_type']) $itemsQuery->where('items.type', $filters['item_type']);

        // 2. Prior Subqueries for transactions occurring before $fromDate
        $priorPurchases = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->whereDate('purchases.date', '<', $fromDate)
            ->groupBy('item_id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'));

        $priorSaleReturns = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->whereDate('sales_returns.date', '<', $fromDate)
            ->groupBy('item_id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'));

        $priorSales = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.date', '<', $fromDate)
            ->groupBy('item_id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'));

        $priorPurchaseReturns = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->whereDate('purchase_returns.date', '<', $fromDate)
            ->groupBy('item_id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'));

        if ($filters['firm_id']) {
            $priorPurchases->where('purchases.firm_id', $filters['firm_id']);
            $priorSales->where('sales.firm_id', $filters['firm_id']);
            $priorSaleReturns->where('sales_returns.firm_id', $filters['firm_id']);
            $priorPurchaseReturns->where('purchase_returns.firm_id', $filters['firm_id']);
        }

        if ($filters['party_id']) {
            $account = DB::table('accounts')->where('id', $filters['party_id'])->first();
            $accountType = $account->type ?? null;
            $hasSale = ($accountType == 3 || (!empty($account->sale)));
            $hasPurchase = ($accountType == 6 || (!empty($account->purchase)));

            if ($hasSale && $hasPurchase) {
                $priorSales->where('sales.customer_id', $filters['party_id']);
                $priorSaleReturns->where('sales_returns.customer_id', $filters['party_id']);
                $priorPurchases->where('purchases.supplier_id', $filters['party_id']);
                $priorPurchaseReturns->where('purchase_returns.supplier_id', $filters['party_id']);
            } elseif ($hasSale) {
                $priorSales->where('sales.customer_id', $filters['party_id']);
                $priorSaleReturns->where('sales_returns.customer_id', $filters['party_id']);
                $priorPurchases->whereRaw('1=0');
                $priorPurchaseReturns->whereRaw('1=0');
            } elseif ($hasPurchase) {
                $priorPurchases->where('purchases.supplier_id', $filters['party_id']);
                $priorPurchaseReturns->where('purchase_returns.supplier_id', $filters['party_id']);
                $priorSales->whereRaw('1=0');
                $priorSaleReturns->whereRaw('1=0');
            } else {
                $priorPurchases->where('purchases.supplier_id', $filters['party_id']);
                $priorSales->where('sales.customer_id', $filters['party_id']);
                $priorSaleReturns->where('sales_returns.customer_id', $filters['party_id']);
                $priorPurchaseReturns->where('purchase_returns.supplier_id', $filters['party_id']);
            }
        }

        $itemsMap = $itemsQuery
            ->leftJoinSub($priorPurchases, 'pp', 'items.id', '=', 'pp.item_id')
            ->leftJoinSub($priorSaleReturns, 'psr', 'items.id', '=', 'psr.item_id')
            ->leftJoinSub($priorSales, 'ps', 'items.id', '=', 'ps.item_id')
            ->leftJoinSub($priorPurchaseReturns, 'ppr', 'items.id', '=', 'ppr.item_id')
            ->addSelect(
                DB::raw('COALESCE(pp.total, 0) as prior_purchases'),
                DB::raw('COALESCE(psr.total, 0) as prior_sale_returns'),
                DB::raw('COALESCE(ps.total, 0) as prior_sales'),
                DB::raw('COALESCE(ppr.total, 0) as prior_purchase_returns')
            )
            ->get()
            ->keyBy('id');

        // 3. Transactions Query within period [fromDate, toDate]
        $purchases = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->select(
                'purchases.date',
                DB::raw("COALESCE(purchases.invoice, CONCAT('PUR-', purchases.id)) as voucher_no"),
                'accounts.title as account_name',
                'items.title as item_name',
                'items.id as item_id',
                'items.packing_qty as packing_qty',
                'purchase_items.trade_price as rate',
                'purchase_items.subtotal as subtotal',
                'purchase_items.total_pcs as in_qty',
                'purchase_items.qty_carton as in_full',
                'purchase_items.qty_pcs as in_pcs',
                DB::raw('0 as out_qty'),
                DB::raw('0 as out_full'),
                DB::raw('0 as out_pcs'),
                DB::raw("'purchase' as type"),
                'items.trade_price as cogs_rate'
            )
            ->whereBetween('purchases.date', [$fromDate, $toDate]);

        $sales = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->select(
                'sales.date',
                DB::raw("COALESCE(sales.invoice, CONCAT('SLS-', sales.id)) as voucher_no"),
                'accounts.title as account_name',
                'items.title as item_name',
                'items.id as item_id',
                'items.packing_qty as packing_qty',
                'sales_items.trade_price as rate',
                'sales_items.subtotal as subtotal',
                DB::raw('0 as in_qty'),
                DB::raw('0 as in_full'),
                DB::raw('0 as in_pcs'),
                'sales_items.total_pcs as out_qty',
                'sales_items.qty_carton as out_full',
                'sales_items.qty_pcs as out_pcs',
                DB::raw("'sale' as type"),
                'items.trade_price as cogs_rate'
            )
            ->whereBetween('sales.date', [$fromDate, $toDate]);

        $saleReturns = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->join('items', 'sales_return_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->select(
                'sales_returns.date',
                DB::raw("COALESCE(sales_returns.invoice, CONCAT('SR-', sales_returns.id)) as voucher_no"),
                'accounts.title as account_name',
                'items.title as item_name',
                'items.id as item_id',
                'items.packing_qty as packing_qty',
                'sales_return_items.trade_price as rate',
                'sales_return_items.subtotal as subtotal',
                'sales_return_items.total_pcs as in_qty',
                'sales_return_items.qty_carton as in_full',
                'sales_return_items.qty_pcs as in_pcs',
                DB::raw('0 as out_qty'),
                DB::raw('0 as out_full'),
                DB::raw('0 as out_pcs'),
                DB::raw("'sale_return' as type"),
                'items.trade_price as cogs_rate'
            )
            ->whereBetween('sales_returns.date', [$fromDate, $toDate]);

        $purchaseReturns = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->join('items', 'purchase_return_items.item_id', '=', 'items.id')
            ->leftJoin('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id')
            ->select(
                'purchase_returns.date',
                DB::raw("COALESCE(purchase_returns.invoice, CONCAT('PR-', purchase_returns.id)) as voucher_no"),
                'accounts.title as account_name',
                'items.title as item_name',
                'items.id as item_id',
                'items.packing_qty as packing_qty',
                'purchase_return_items.trade_price as rate',
                'purchase_return_items.subtotal as subtotal',
                DB::raw('0 as in_qty'),
                DB::raw('0 as in_full'),
                DB::raw('0 as in_pcs'),
                'purchase_return_items.total_pcs as out_qty',
                'purchase_return_items.qty_carton as out_full',
                'purchase_return_items.qty_pcs as out_pcs',
                DB::raw("'purchase_return' as type"),
                'items.trade_price as cogs_rate'
            )
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate]);

        if ($filters['item_id']) {
            $purchases->where('purchase_items.item_id', $filters['item_id']);
            $sales->where('sales_items.item_id', $filters['item_id']);
            $saleReturns->where('sales_return_items.item_id', $filters['item_id']);
            $purchaseReturns->where('purchase_return_items.item_id', $filters['item_id']);
        }

        if ($filters['company_id']) {
            $purchases->where('items.company', $filters['company_id']);
            $sales->where('items.company', $filters['company_id']);
            $saleReturns->where('items.company', $filters['company_id']);
            $purchaseReturns->where('items.company', $filters['company_id']);
        }

        if ($filters['party_id']) {
            $account = DB::table('accounts')->where('id', $filters['party_id'])->first();
            $accountType = $account->type ?? null;
            $hasSale = ($accountType == 3 || (!empty($account->sale)));
            $hasPurchase = ($accountType == 6 || (!empty($account->purchase)));

            if ($hasSale && $hasPurchase) {
                $sales->where('sales.customer_id', $filters['party_id']);
                $saleReturns->where('sales_returns.customer_id', $filters['party_id']);
                $purchases->where('purchases.supplier_id', $filters['party_id']);
                $purchaseReturns->where('purchase_returns.supplier_id', $filters['party_id']);
            } elseif ($hasSale) {
                $sales->where('sales.customer_id', $filters['party_id']);
                $saleReturns->where('sales_returns.customer_id', $filters['party_id']);
                $purchases->whereRaw('1=0');
                $purchaseReturns->whereRaw('1=0');
            } elseif ($hasPurchase) {
                $purchases->where('purchases.supplier_id', $filters['party_id']);
                $purchaseReturns->where('purchase_returns.supplier_id', $filters['party_id']);
                $sales->whereRaw('1=0');
                $saleReturns->whereRaw('1=0');
            } else {
                $purchases->where('purchases.supplier_id', $filters['party_id']);
                $sales->where('sales.customer_id', $filters['party_id']);
                $saleReturns->where('sales_returns.customer_id', $filters['party_id']);
                $purchaseReturns->where('purchase_returns.supplier_id', $filters['party_id']);
            }
        }

        if ($filters['category_id']) {
            $purchases->where('items.category', $filters['category_id']);
            $sales->where('items.category', $filters['category_id']);
            $saleReturns->where('items.category', $filters['category_id']);
            $purchaseReturns->where('items.category', $filters['category_id']);
        }

        if ($filters['item_type']) {
            $purchases->where('items.type', $filters['item_type']);
            $sales->where('items.type', $filters['item_type']);
            $saleReturns->where('items.type', $filters['item_type']);
            $purchaseReturns->where('items.type', $filters['item_type']);
        }

        if ($filters['firm_id']) {
            $purchases->where('purchases.firm_id', $filters['firm_id']);
            $sales->where('sales.firm_id', $filters['firm_id']);
            $saleReturns->where('sales_returns.firm_id', $filters['firm_id']);
            $purchaseReturns->where('purchase_returns.firm_id', $filters['firm_id']);
        }

        $transactions = $purchases->unionAll($sales)
            ->unionAll($saleReturns)
            ->unionAll($purchaseReturns)
            ->orderBy('date')
            ->get();

        $txByItem = $transactions->groupBy('item_id');

        $finalRows = [];

        foreach ($itemsMap as $itemId => $item) {
            $packing = max(1, (int)($item->packing_qty ?? 1));
            $baseOpeningPcs = $filters['party_id'] ? 0 : (((int)($item->stock_1 ?? 0) * $packing) + (int)($item->stock_2 ?? 0));
            $priorNet = (float)$item->prior_purchases + (float)$item->prior_sale_returns - (float)$item->prior_sales - (float)$item->prior_purchase_returns;
            $periodOpeningPcs = $baseOpeningPcs + $priorNet;

            $hasTransactions = isset($txByItem[$itemId]) && count($txByItem[$itemId]) > 0;

            // When no specific item is filtered, skip items that have 0 opening balance and no transactions
            if (!$filters['item_id'] && $periodOpeningPcs == 0 && !$hasTransactions) {
                continue;
            }

            // 1. Generate Opening Stock Row
            $bal = $periodOpeningPcs;
            $cogsRate = (float)($item->trade_price ?? 0);
            $cogsPerPc = $cogsRate / $packing;

            $balAbs = (int)abs($bal);
            $balF = (int)floor($balAbs / $packing);
            $balP = (int)($balAbs % $packing);
            $sign = $bal < 0 ? '-' : '';
            $balFmt = $bal == 0 ? '0' : ($balF > 0 && $balP > 0 ? "{$sign}{$balF} F, {$balP} P" : ($balF > 0 ? "{$sign}{$balF} F" : "{$sign}{$balP} P"));

            $inFmt = '-';
            $outFmt = '-';
            if ($periodOpeningPcs > 0) {
                $inF = (int)floor($periodOpeningPcs / $packing);
                $inP = (int)($periodOpeningPcs % $packing);
                $inFmt = ($inF > 0 && $inP > 0) ? "{$inF} F, {$inP} P" : (($inF > 0) ? "{$inF} F" : "{$inP} P");
            } elseif ($periodOpeningPcs < 0) {
                $absPcs = abs($periodOpeningPcs);
                $outF = (int)floor($absPcs / $packing);
                $outP = (int)($absPcs % $packing);
                $outFmt = ($outF > 0 && $outP > 0) ? "{$outF} F, {$outP} P" : (($outF > 0) ? "{$outF} F" : "{$outP} P");
            }

            $finalRows[] = [
                'date' => $fromDate,
                'voucher_no' => 'OPENING',
                'account_name' => 'OPENING BALANCE',
                'item_name' => $item->title,
                'item_id' => $item->id,
                'packing_qty' => $packing,
                'rate' => $cogsRate,
                'subtotal' => 0,
                'in_qty' => $periodOpeningPcs > 0 ? $periodOpeningPcs : 0,
                'in_full' => $periodOpeningPcs > 0 ? (int)floor($periodOpeningPcs / $packing) : 0,
                'in_pcs' => $periodOpeningPcs > 0 ? (int)($periodOpeningPcs % $packing) : 0,
                'in_fmt' => $inFmt,
                'out_qty' => $periodOpeningPcs < 0 ? abs($periodOpeningPcs) : 0,
                'out_full' => $periodOpeningPcs < 0 ? (int)floor(abs($periodOpeningPcs) / $packing) : 0,
                'out_pcs' => $periodOpeningPcs < 0 ? (int)(abs($periodOpeningPcs) % $packing) : 0,
                'out_fmt' => $outFmt,
                'balance' => $bal,
                'balance_fmt' => $balFmt,
                'type' => 'opening',
                'cogs_rate' => $cogsRate,
                'amount' => round(($bal / $packing) * $cogsRate, 2),
                'profit_loss' => 0
            ];

            // 2. Process Chronological Period Transactions
            if ($hasTransactions) {
                foreach ($txByItem[$itemId] as $tx) {
                    $inPcs = (float)($tx->in_qty ?? 0);
                    $outPcs = (float)($tx->out_qty ?? 0);
                    $bal += ($inPcs - $outPcs);

                    // Format IN
                    $inF = (int)($tx->in_full ?? 0);
                    $inP = (int)($tx->in_pcs ?? 0);
                    if ($inPcs > 0 && $inF == 0 && $inP == 0) {
                        $inF = (int)floor($inPcs / $packing);
                        $inP = (int)($inPcs % $packing);
                    }
                    $txInFmt = $inPcs > 0 ? ($inF > 0 && $inP > 0 ? "{$inF} F, {$inP} P" : ($inF > 0 ? "{$inF} F" : "{$inP} P")) : '-';

                    // Format OUT
                    $outF = (int)($tx->out_full ?? 0);
                    $outP = (int)($tx->out_pcs ?? 0);
                    if ($outPcs > 0 && $outF == 0 && $outP == 0) {
                        $outF = (int)floor($outPcs / $packing);
                        $outP = (int)($outPcs % $packing);
                    }
                    $txOutFmt = $outPcs > 0 ? ($outF > 0 && $outP > 0 ? "{$outF} F, {$outP} P" : ($outF > 0 ? "{$outF} F" : "{$outP} P")) : '-';

                    // Format Balance
                    $balAbs = (int)abs($bal);
                    $balF = (int)floor($balAbs / $packing);
                    $balP = (int)($balAbs % $packing);
                    $sign = $bal < 0 ? '-' : '';
                    $txBalFmt = $bal == 0 ? '0' : ($balF > 0 && $balP > 0 ? "{$sign}{$balF} F, {$balP} P" : ($balF > 0 ? "{$sign}{$balF} F" : "{$sign}{$balP} P"));

                    $txRate = (float)($tx->rate ?? 0);
                    $txCogs = (float)($tx->cogs_rate ?? $cogsRate);
                    $txCogsPerPc = $txCogs / $packing;
                    $txSubtotal = (float)($tx->subtotal ?? 0);

                    $profitLoss = 0;
                    if ($tx->type === 'sale') {
                        $cogsTotal = $outPcs * $txCogsPerPc;
                        $profitLoss = round($txSubtotal - $cogsTotal, 2);
                    } elseif ($tx->type === 'sale_return') {
                        $cogsTotal = $inPcs * $txCogsPerPc;
                        $profitLoss = round(-($txSubtotal - $cogsTotal), 2);
                    }

                    $finalRows[] = [
                        'date' => $tx->date,
                        'voucher_no' => $tx->voucher_no,
                        'account_name' => $tx->account_name,
                        'item_name' => $tx->item_name,
                        'item_id' => $tx->item_id,
                        'packing_qty' => $packing,
                        'rate' => $txRate,
                        'subtotal' => $txSubtotal,
                        'in_qty' => $inPcs,
                        'in_full' => $inF,
                        'in_pcs' => $inP,
                        'in_fmt' => $txInFmt,
                        'out_qty' => $outPcs,
                        'out_full' => $outF,
                        'out_pcs' => $outP,
                        'out_fmt' => $txOutFmt,
                        'balance' => $bal,
                        'balance_fmt' => $txBalFmt,
                        'type' => $tx->type,
                        'cogs_rate' => $txCogs,
                        'amount' => round(($bal / $packing) * $txCogs, 2),
                        'profit_loss' => $profitLoss
                    ];
                }
            }
        }

        return $finalRows;
    }

    public function priceList($filters)
    {
        $query = DB::table('items')
            ->select(
                'items.id',
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

        if (isset($filters['item_id']) && $filters['item_id'] !== 'ALL') {
            $query->where('items.id', $filters['item_id']);
        }

        if (isset($filters['company_id']) && $filters['company_id'] !== 'ALL') {
            $query->where('items.company', $filters['company_id']);
        }

        if (isset($filters['category_id']) && $filters['category_id'] !== 'ALL') {
            $query->where('items.category', $filters['category_id']);
        }

        if (isset($filters['item_type']) && $filters['item_type'] !== 'ALL') {
            $query->where('items.type', $filters['item_type']);
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
        
        $isOpeningStock = (($filters['valuation'] ?? '') === 'opening_stock');

        if ($isOpeningStock) {
            $available = array_filter($data, function($row) use ($filters) {
                if (!empty($filters['show_zero'])) {
                    return true;
                }
                return (floatval($row['opening_stock'] ?? 0) > 0) || (floatval($row['opening_stock_pcs'] ?? 0) > 0);
            });
        } else {
            $available = array_filter($data, function($row) {
                return $row['balance_qty'] > 0;
            });
        }

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

        return array_values(array_map(function($row) use ($lastPurchases, $isOpeningStock) {
            $lp = $lastPurchases->get($row['id']);
            $row['last_purchase_price'] = $lp ? $lp->last_purchase_price : 0;
            $row['last_supplier_name'] = $lp ? $lp->last_supplier_name : 'N/A';
            
            $packingQty = $row['packing_qty'] ?: 1;

            if ($isOpeningStock) {
                $opFull = floatval($row['opening_stock'] ?? 0);
                $opPcs = floatval($row['opening_stock_pcs'] ?? 0);
                $row['full_qty'] = $opFull;
                $row['pcs_qty'] = $opPcs;
                $row['balance_qty'] = ($opFull * $packingQty) + $opPcs;
                $row['amount'] = ($opFull * floatval($row['rate'])) + ($packingQty > 0 ? ($opPcs / $packingQty) * floatval($row['rate']) : 0);
            } else {
                $row['full_qty'] = floor($row['balance_qty'] / $packingQty);
                $row['pcs_qty'] = $row['balance_qty'] % $packingQty;
            }
            
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
