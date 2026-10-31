<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\StockService;
use App\Models\Items;

class ReconcileStockCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'erp:reconcile-stock 
                            {--item_id= : Audit or reconcile a specific item ID}
                            {--dry-run : Inspect discrepancies without modifying any database records}
                            {--limit=50 : Maximum number of discrepant items to display}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit and reconcile ERP inventory stock balances against the transaction ledger';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("===============================================================================");
        $this->info("                 ERP INVENTORY AUDIT & RECONCILIATION ENGINE                  ");
        $this->info("===============================================================================");

        $itemId = $this->option('item_id');
        $isDryRun = (bool) $this->option('dry-run');
        $limit = (int) $this->option('limit');

        $itemIds = $itemId ? [(int)$itemId] : null;

        $this->comment("Fetching real-time ledger balances across item transactions...");
        $balances = StockService::getBatchBalances($itemIds);

        $itemsQuery = Items::query();
        if ($itemId) {
            $itemsQuery->where('id', $itemId);
        }
        $items = $itemsQuery->get()->keyBy('id');

        $discrepancies = [];
        $totalItems = count($balances);
        $negativeItems = 0;

        foreach ($balances as $id => $bal) {
            $item = $items->get($id);
            if (!$item) continue;

            $ledgerBalance = (float) $bal->balance_pcs;
            $cachedPcs = (float) $item->total_stock_pcs;

            if ($ledgerBalance < 0) {
                $negativeItems++;
            }

            if (round($ledgerBalance, 2) !== round($cachedPcs, 2)) {
                $diff = $ledgerBalance - $cachedPcs;
                $discrepancies[] = [
                    'id'             => $id,
                    'code'           => $item->code ?? 'N/A',
                    'title'          => substr($item->title, 0, 32),
                    'opening'        => (float) $bal->opening_stock,
                    'in'             => (float) $bal->in_qty,
                    'out'            => (float) $bal->out_qty,
                    'ledger_balance' => $ledgerBalance,
                    'cached_stock'   => $cachedPcs,
                    'diff'           => $diff > 0 ? "+{$diff}" : "{$diff}",
                ];
            }
        }

        $this->info("Audited Items: {$totalItems}");
        $this->warn("Items with Negative Ledger Balance: {$negativeItems}");
        $this->error("Items with Desynchronized Stock Cache: " . count($discrepancies));

        if (count($discrepancies) > 0) {
            $displayRows = array_slice($discrepancies, 0, $limit);
            $this->table(
                ['ID', 'Code', 'Title', 'Opening', 'In (P/SR)', 'Out (S/PR)', 'Ledger Bal', 'Cached Stk', 'Diff'],
                $displayRows
            );

            if (count($discrepancies) > $limit) {
                $remaining = count($discrepancies) - $limit;
                $this->comment("... and {$remaining} more items with discrepancies.");
            }
        } else {
            $this->info("All items are 100% synchronized with the transaction ledger!");
        }

        if ($isDryRun) {
            $this->info("\n[DRY RUN MODE]: No database modifications were performed.");
            return 0;
        }

        $this->info("\nReconciliation scan completed.");
        return 0;
    }
}

