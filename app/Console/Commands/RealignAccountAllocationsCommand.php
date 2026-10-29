<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Account;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Services\PaymentAllocationEngine;
use App\Services\PaymentAccountingService;
use App\Services\ReportBuilder;
use Illuminate\Support\Facades\DB;

class RealignAccountAllocationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'erp:realign-account-allocations
        {--account= : Specific Account ID to re-align (e.g. 164)}
        {--apply : Actually apply and persist changes to the database}
        {--dry-run : Simulate and preview changes without modifying database (Default)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Re-align payment allocations in strict chronological FIFO (Opening Balance First, then oldest invoices)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $accountId = $this->option('account');
        $isApply = (bool)$this->option('apply');
        $dryRun = !$isApply;

        $this->newLine();
        if ($dryRun) {
            $this->info("==========================================================================");
            $this->warn("  MODE: DRY-RUN (SIMULATION ONLY - NO DATABASE MODIFICATIONS WILL BE SAVED)  ");
            $this->info("==========================================================================");
            $this->line("  Use <comment>--apply</comment> to execute and persist changes.");
        } else {
            $this->info("==========================================================================");
            $this->alert("  MODE: LIVE EXECUTION (CHANGES WILL BE PERMANENTLY WRITTEN TO DATABASE)  ");
            $this->info("==========================================================================");
        }
        $this->newLine();

        if (!$accountId) {
            $this->error("Please specify an account using --account=<ID>");
            return 1;
        }

        $account = Account::find($accountId);
        if (!$account) {
            $this->error("Account ID {$accountId} not found.");
            return 1;
        }

        $isSupplier = in_array((int)$account->type, [6]) || (bool)$account->purchase;
        if (!$isSupplier) {
            $this->error("Account {$account->title} is not a Supplier. Currently optimized for Supplier Payables.");
            return 1;
        }

        $this->info("Re-aligning Account: [ID: {$account->id}] {$account->title}");

        $rawOB = (float)$account->opening_balance;
        $obType = strtoupper($account->opening_balance_type ?? 'CR');
        $initialLedgerBal = PaymentAccountingService::getSupplierCurrentBalance($account);

        $engine = new PaymentAllocationEngine();
        $initialRemOB = $engine->getRemainingOpeningBalance($account);

        // Fetch payments
        $payments = Payment::where('account_id', $account->id)
            ->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // Fetch purchases
        $purchases = Purchase::where('supplier_id', $account->id)
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $paymentCash = [];
        foreach ($payments as $p) {
            if ($p->type === 'PAYMENT') {
                $paymentCash[$p->id] = (float)$p->amount;
            }
        }

        $newAllocations = [];
        $runningOB = ($obType === 'CR') ? $rawOB : 0.0;

        // 1. Settle Opening Balance with earliest payments
        foreach ($payments as $pay) {
            if ($pay->type !== 'PAYMENT') continue;
            if ($runningOB <= 0.005) break;
            $avail = $paymentCash[$pay->id] ?? 0.0;
            if ($avail <= 0.005) continue;

            $alloc = min($avail, $runningOB);
            $newAllocations[] = [
                'payment_id' => $pay->id,
                'bill_type'  => Account::class,
                'bill_id'    => $account->id,
                'amount'     => round($alloc, 2),
            ];
            $runningOB = round($runningOB - $alloc, 2);
            $paymentCash[$pay->id] = round($avail - $alloc, 2);
        }

        // 2. Settle purchases in chronological order
        $purStatus = [];
        foreach ($purchases as $pur) {
            $net = (float)$pur->net_total - (float)($pur->extra_discount ?? 0);
            $purStatus[$pur->id] = [
                'id' => $pur->id,
                'invoice' => $pur->invoice,
                'date' => $pur->date,
                'net_total' => $net,
                'paid_amount' => 0.0,
                'remaining_amount' => $net,
            ];

            foreach ($payments as $pay) {
                if ($pay->type !== 'PAYMENT') continue;
                if ($purStatus[$pur->id]['remaining_amount'] <= 0.005) break;
                $avail = $paymentCash[$pay->id] ?? 0.0;
                if ($avail <= 0.005) continue;

                $alloc = min($avail, $purStatus[$pur->id]['remaining_amount']);
                $newAllocations[] = [
                    'payment_id' => $pay->id,
                    'bill_type'  => Purchase::class,
                    'bill_id'    => $pur->id,
                    'amount'     => round($alloc, 2),
                ];
                $purStatus[$pur->id]['paid_amount'] = round($purStatus[$pur->id]['paid_amount'] + $alloc, 2);
                $purStatus[$pur->id]['remaining_amount'] = round($purStatus[$pur->id]['remaining_amount'] - $alloc, 2);
                $paymentCash[$pay->id] = round($avail - $alloc, 2);
            }
        }

        if (!$dryRun) {
            DB::transaction(function() use ($account, $payments, $purStatus, $newAllocations) {
                $payIds = $payments->pluck('id');
                PaymentAllocation::whereIn('payment_id', $payIds)->delete();
                PaymentAllocation::where('bill_type', Account::class)->where('bill_id', $account->id)->delete();

                foreach ($newAllocations as $alloc) {
                    PaymentAllocation::create($alloc);
                }

                foreach ($purStatus as $pid => $st) {
                    Purchase::where('id', $pid)->update([
                        'paid_amount' => $st['paid_amount'],
                        'remaining_amount' => $st['remaining_amount'],
                        'status' => $st['remaining_amount'] <= 0.005 ? 'Paid' : ($st['paid_amount'] > 0 ? 'Partial' : 'Pending'),
                    ]);
                }

                foreach ($payments as $p) {
                    $totAlloc = PaymentAllocation::where('payment_id', $p->id)->sum('amount');
                    $p->update(['allocated_amount' => $totAlloc]);
                }
            });
            $this->info("✓ Successfully persisted re-aligned allocations to the database!");
        }

        $this->newLine();
        $this->table(
            ['Metric', 'Before Re-alignment', 'After Chronological FIFO'],
            [
                ['Ledger Balance', number_format($initialLedgerBal, 2) . ' CR', number_format($initialLedgerBal, 2) . ' CR (Unchanged)'],
                ['Engine Remaining OB', number_format($initialRemOB, 2), number_format($runningOB, 2)],
                ['Allocations Count', PaymentAllocation::whereIn('payment_id', $payments->pluck('id'))->count(), count($newAllocations)],
            ]
        );

        $this->newLine();
        $this->info("Purchases Status After FIFO:");
        $purRows = [];
        $totalRem = 0;
        foreach ($purStatus as $p) {
            $purRows[] = [
                $p['invoice'],
                $p['date'],
                number_format($p['net_total'], 2),
                number_format($p['paid_amount'], 2),
                number_format($p['remaining_amount'], 2),
                $p['remaining_amount'] <= 0.005 ? 'Paid' : 'Open',
            ];
            $totalRem += $p['remaining_amount'];
        }
        $this->table(['Invoice', 'Date', 'Net Total', 'Paid', 'Remaining', 'Status'], $purRows);

        $this->info("Total Open Purchases Remaining: PKR " . number_format($totalRem, 2));

        return 0;
    }
}

