<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\Items;

class StockService
{
    /**
     * Get real-time transactional balance for all items (or a specific set of item IDs).
     * Single Source of Truth matching StockReportBuilder ledger logic:
     * Balance = Opening Stock (items.stock_1) + Purchases + Sales Returns - Sales - Purchase Returns
     *
     * @param array|null $itemIds
     * @return array<int, object>
     */
    public static function getBatchBalances(?array $itemIds = null): array
    {
        $purchases = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'))
            ->groupBy('item_id');

        $salesReturns = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'))
            ->groupBy('item_id');

        $sales = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'))
            ->groupBy('item_id');

        $purchaseReturns = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->select('item_id', DB::raw('SUM(total_pcs) as total'))
            ->groupBy('item_id');

        $query = DB::table('items')
            ->leftJoinSub($purchases, 'p', 'items.id', '=', 'p.item_id')
            ->leftJoinSub($salesReturns, 'sr', 'items.id', '=', 'sr.item_id')
            ->leftJoinSub($sales, 's', 'items.id', '=', 's.item_id')
            ->leftJoinSub($purchaseReturns, 'pr', 'items.id', '=', 'pr.item_id')
            ->select(
                'items.id',
                'items.title',
                'items.code',
                'items.packing_qty',
                'items.stock_1 as opening_stock',
                'items.stock_2 as opening_stock_pcs',
                DB::raw('COALESCE(p.total, 0) as purchase_pcs'),
                DB::raw('COALESCE(sr.total, 0) as sale_return_pcs'),
                DB::raw('COALESCE(s.total, 0) as sale_pcs'),
                DB::raw('COALESCE(pr.total, 0) as purchase_return_pcs'),
                DB::raw('COALESCE(p.total, 0) + COALESCE(sr.total, 0) as in_qty'),
                DB::raw('COALESCE(s.total, 0) + COALESCE(pr.total, 0) as out_qty'),
                DB::raw('((COALESCE(items.stock_1, 0) * CASE WHEN COALESCE(items.packing_qty, 0) > 0 THEN items.packing_qty ELSE 1 END + COALESCE(items.stock_2, 0)) + COALESCE(p.total, 0) + COALESCE(sr.total, 0)) - (COALESCE(s.total, 0) + COALESCE(pr.total, 0)) as balance_pcs')
            );

        if (!empty($itemIds)) {
            $query->whereIn('items.id', $itemIds);
        }

        return $query->get()->keyBy('id')->toArray();
    }

    /**
     * Get real-time balance for a single item.
     *
     * @param int $itemId
     * @return object|null
     */
    public static function getItemBalance(int $itemId): ?object
    {
        $batch = self::getBatchBalances([$itemId]);
        return $batch[$itemId] ?? null;
    }

    /**
     * Partition total pieces into carton (Full) and loose pieces (Pcs),
     * correctly handling negative values without modulo distortion.
     *
     * Example: -96 pcs with packing 72 => -1 Full, -24 Pcs.
     *
     * @param float $totalPcs
     * @param int $packingQty
     * @return array
     */
    public static function formatBreakdown(float $totalPcs, int $packingQty = 1): array
    {
        $packing = max(1, $packingQty);
        $isNegative = $totalPcs < 0;
        $absPcs = abs($totalPcs);

        $full = intdiv((int)$absPcs, $packing);
        $loose = (int)$absPcs % $packing;

        if ($isNegative) {
            $full = -$full;
            $loose = -$loose;
        }

        return [
            'total_pcs'   => $totalPcs,
            'full'        => $full,
            'loose'       => $loose,
            'is_negative' => $isNegative,
            'formatted'   => $packing > 1 ? "{$full}F / {$loose}P" : "{$full} Units",
        ];
    }

    /**
     * Attach real-time ledger balance and carton/piece breakdown to a collection of items.
     *
     * @param \Illuminate\Support\Collection|\Illuminate\Database\Eloquent\Collection $items
     * @return \Illuminate\Support\Collection|\Illuminate\Database\Eloquent\Collection
     */
    public static function attachRealtimeBalances($items)
    {
        $itemIds = $items->pluck('id')->filter()->unique()->toArray();
        $balances = self::getBatchBalances($itemIds);

        foreach ($items as $item) {
            $bal = $balances[$item->id] ?? null;
            $totalPcs = $bal ? (float)$bal->balance_pcs : 0.0;
            $packing = max(1, (int)($item->packing_qty ?: 1));
            $breakdown = self::formatBreakdown($totalPcs, $packing);

            // Preserve opening stock baseline
            $op1 = (int)($item->stock_1 ?? 0);
            $op2 = (int)($item->stock_2 ?? 0);
            $item->opening_stock_1 = $op1;
            $item->opening_stock_2 = $op2;
            $item->opening_total_pcs = ($op1 * $packing) + $op2;

            // Real-time Available Stock
            $item->available_stock = $totalPcs;
            $item->available_full = $breakdown['full'];
            $item->available_pcs = $breakdown['loose'];
            $item->stock_breakdown = $breakdown['formatted'];
            $item->is_negative_stock = $breakdown['is_negative'];

            // Transaction History Breakdown (Pieces)
            $purchasePcs = (float)($bal->purchase_pcs ?? 0);
            $salePcs = (float)($bal->sale_pcs ?? 0);
            $saleReturnPcs = (float)($bal->sale_return_pcs ?? 0);
            $purchaseReturnPcs = (float)($bal->purchase_return_pcs ?? 0);
            $item->purchase_pcs = $purchasePcs;
            $item->sale_pcs = $salePcs;
            $item->sale_return_pcs = $saleReturnPcs;
            $item->purchase_return_pcs = $purchaseReturnPcs;
            $item->net_movement_pcs = ($purchasePcs + $saleReturnPcs) - ($salePcs + $purchaseReturnPcs);

            // Backwards compatibility for existing views/components expecting stock_1 / stock_2 as current on-hand
            $item->stock_1 = $breakdown['full'];
            $item->stock_2 = $breakdown['loose'];
            $item->total_stock_pcs = $totalPcs;
        }

        return $items;
    }
}
