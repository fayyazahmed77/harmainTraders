<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Account;
use App\Services\AccountReconciliationService;

class ReconcileAccountBalancesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'erp:reconcile-balances 
        {--account= : Specific Account ID to reconcile (e.g. 310)}
        {--dry-run : Simulate and preview all changes without modifying database (Default)}
        {--apply : Actually apply the reconciliation updates to the database}
        {--cleanup-test-vouchers : Remove test vouchers (e.g. CRV-1124 and CRV-1125)}
        {--threshold=5.00 : Maximum rounding threshold for returned invoices}
        {--force : Bypass interactive confirmation when applying}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reconcile historical unallocated payments against Opening Balance & FIFO bills with zero data loss.';

    /**
     * Execute the console command.
     */
    public function handle(AccountReconciliationService $service)
    {
        $accountId = $this->option('account');
        $isApply = (bool)$this->option('apply');
        $dryRun = !$isApply; // Dry-run is the default unless --apply is explicitly passed
        $cleanupTest = (bool)$this->option('cleanup-test-vouchers');
        $threshold = (float)$this->option('threshold');
        $force = (bool)$this->option('force');

        $this->newLine();
        if ($dryRun) {
            $this->info("==========================================================================");
            $this->warn("  MODE: DRY-RUN (SIMULATION ONLY - NO DATABASE MODIFICATIONS WILL BE SAVED)  ");
            $this->info("==========================================================================");
            $this->line("  Use <comment>--apply</comment> to execute and persist changes.");
        } else {
            $this->info("==========================================================================");
            $this->error("  MODE: LIVE EXECUTION (CHANGES WILL BE PERMANENTLY WRITTEN TO DATABASE)  ");
            $this->info("==========================================================================");

            if (!$force && !$this->confirm("Are you sure you want to apply reconciliation updates to the database?", false)) {
                $this->warn("Reconciliation cancelled by user.");
                return 0;
            }
        }
        $this->newLine();

        $options = [
            'dry_run'               => $dryRun,
            'auto_close_rounding'   => true,
            'rounding_threshold'    => $threshold,
            'cleanup_test_vouchers' => $cleanupTest,
            'reconcile_ob'          => true,
            'reconcile_fifo_bills'  => true,
        ];

        if ($accountId) {
            $account = Account::find($accountId);
            if (!$account) {
                $this->error("Account ID {$accountId} not found.");
                return 1;
            }

            $this->info("Reconciling Single Account: [ID: {$account->id}] {$account->title} ({$account->type})");

            $report = $service->reconcileAccount($account, $options);

            $this->newLine();
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Account ID', $report['account_id']],
                    ['Account Title', $report['title']],
                    ['Party Type', $report['type']],
                    ['Initial Opening Balance', 'PKR ' . number_format($report['opening_balance'], 2)],
                    ['Remaining OB Before', 'PKR ' . number_format($report['initial_remaining_ob'], 2)],
                    ['Remaining OB After', 'PKR ' . number_format($report['final_remaining_ob'], 2)],
                    ['OB Absorbed by Historical Cash', 'PKR ' . number_format($report['ob_allocated'], 2)],
                    ['Unallocated Cash Before', 'PKR ' . number_format($report['unallocated_cash_before'], 2)],
                    ['Unallocated Cash After', 'PKR ' . number_format($report['unallocated_cash_after'], 2)],
                    ['Bills Settled in FIFO', count($report['bills_allocated']) . ' bill(s)'],
                    ['Rounding Discrepancies Closed', count($report['rounding_gaps_closed']) . ' bill(s)'],
                    ['Test Vouchers Removed', count($report['test_vouchers_removed']) . ' voucher(s)'],
                    ['Ledger Balance After', 'PKR ' . number_format($report['ledger_balance_after'], 2)],
                    ['Status', $report['is_fully_reconciled'] ? 'RECONCILED' : 'NO CHANGES NEEDED'],
                ]
            );

            if (!empty($report['test_vouchers_removed'])) {
                $this->newLine();
                $this->warn("Test Vouchers Handled:");
                foreach ($report['test_vouchers_removed'] as $tv) {
                    $this->line("  - Voucher: {$tv['voucher_no']} (ID: {$tv['id']}) | Amount: PKR " . number_format($tv['amount'], 2));
                }
            }

            if (!empty($report['bills_allocated'])) {
                $this->newLine();
                $this->info("Bills Allocated:");
                foreach ($report['bills_allocated'] as $ba) {
                    $this->line("  - Payment #{$ba['payment_id']} -> Invoice {$ba['invoice_no']} (ID: {$ba['bill_id']}) | Settled: PKR " . number_format($ba['amount'], 2));
                }
            }

            if (!empty($report['rounding_gaps_closed'])) {
                $this->newLine();
                $this->info("Rounding Gaps Closed:");
                foreach ($report['rounding_gaps_closed'] as $rg) {
                    $this->line("  - Invoice {$rg['invoice_no']} (ID: {$rg['bill_id']}) | Residual: PKR " . number_format($rg['residual'], 2));
                }
            }

            return 0;
        }

        // Global reconciliation for all parties
        $this->info("Scanning all customer and supplier accounts in database...");
        $results = $service->reconcileAll($options);

        $reconciled = $results['reconciled_accounts'];

        if (empty($reconciled)) {
            $this->info("All accounts are already in perfect reconciliation. No actions needed.");
            return 0;
        }

        $tableRows = [];
        foreach ($reconciled as $rec) {
            $tableRows[] = [
                $rec['account_id'],
                substr($rec['title'], 0, 24),
                $rec['type'],
                number_format($rec['initial_remaining_ob'], 0),
                number_format($rec['final_remaining_ob'], 0),
                number_format($rec['ob_allocated'], 0),
                count($rec['bills_allocated']),
                count($rec['rounding_gaps_closed']),
                number_format($rec['unallocated_cash_after'], 0),
            ];
        }

        $this->table(
            ['ID', 'Party Title', 'Type', 'OB Rem (Pre)', 'OB Rem (Post)', 'OB Absorbed', 'Bills', 'Rounding', 'Surplus Cash'],
            $tableRows
        );

        $this->newLine();
        $this->info("==========================================================================");
        $this->info(sprintf("  RECONCILIATION SUMMARY (%s)", $dryRun ? 'SIMULATION' : 'LIVE APPLIED'));
        $this->info("==========================================================================");
        $this->line("  Total Accounts Scanned:         " . $results['total_parties_scanned']);
        $this->line("  Total Accounts Reconciled:       " . count($reconciled));
        $this->line("  Total Opening Balance Absorbed:  PKR " . number_format($results['total_ob_allocated'], 2));
        $this->line("  Total Bills Cleared in FIFO:     " . $results['total_bills_settled']);
        $this->line("  Total Rounding Gaps Resolved:    " . $results['total_rounding_closed']);
        $this->newLine();

        if ($dryRun) {
            $this->comment("  To apply these reconciliation updates permanently, re-run with:");
            $this->info("    php artisan erp:reconcile-balances --apply");
        } else {
            $this->info("  All updates have been successfully and atomically committed to the database.");
        }

        return 0;
    }
}
