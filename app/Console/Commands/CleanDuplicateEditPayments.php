<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Account;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanDuplicateEditPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:clean-edit-duplicates {--dry-run : Preview duplicate vouchers without deleting them}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find and remove duplicate payments auto-generated from Sale and Purchase edition, repairing invoice and ledger balances';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $isDryRun = (bool) $this->option('dry-run');

        $this->info($isDryRun 
            ? '🔍 Running in DRY-RUN mode (No changes will be saved to the database)...'
            : '⚡ Running in LIVE mode (Duplicate vouchers will be deleted and balances repaired)...'
        );

        // Find candidate payments created by sale/purchase edit
        $candidates = Payment::with(['account', 'allocations'])
            ->where(function ($q) {
                $q->where('remarks', 'LIKE', 'Auto-generated from Edition of Sale %')
                  ->orWhere('remarks', 'LIKE', 'Auto-generated from Edition of Purchase %');
            })
            ->orderBy('id', 'asc')
            ->get();

        if ($candidates->isEmpty()) {
            $this->info('✅ No auto-generated edit payments found in the database.');
            return 0;
        }

        $duplicatesToDelete = [];
        $tableRows = [];

        foreach ($candidates as $payment) {
            $isDuplicate = false;
            $reason = '';
            $billDetails = [];

            foreach ($payment->allocations as $alloc) {
                $isSale = $alloc->bill_type === 'App\Models\Sales';
                $bill = $isSale ? Sales::find($alloc->bill_id) : Purchase::find($alloc->bill_id);

                if (!$bill) {
                    $isDuplicate = true;
                    $reason = 'Orphaned allocation (Bill ID ' . $alloc->bill_id . ' not found)';
                    continue;
                }

                $netPayable = max(0, (float)$bill->net_total - (float)($bill->extra_discount ?? 0));

                // Find other allocations on the same bill (excluding current payment)
                $otherAllocations = PaymentAllocation::where('bill_id', $bill->id)
                    ->where('bill_type', $alloc->bill_type)
                    ->where('payment_id', '!=', $payment->id)
                    ->get();

                $otherAllocatedSum = (float) $otherAllocations->sum('amount');
                $totalAllocatedSum = $otherAllocatedSum + (float)$alloc->amount;

                // Check if other allocations already cover or exceed the bill, or if this bill is over-allocated
                if ($totalAllocatedSum > ($netPayable + 0.01) || $otherAllocatedSum >= ($netPayable - 0.01)) {
                    $isDuplicate = true;
                    $reason = sprintf(
                        'Duplicate: Bill %s net is %s, other payments already cover %s (Over-allocated by %s)',
                        $bill->invoice,
                        number_format($netPayable, 2),
                        number_format($otherAllocatedSum, 2),
                        number_format($totalAllocatedSum - $netPayable, 2)
                    );
                }

                $billDetails[] = sprintf('%s (Net: %s, Paid: %s)', $bill->invoice, number_format($netPayable, 2), number_format($bill->paid_amount, 2));
            }

            if ($isDuplicate) {
                $duplicatesToDelete[] = $payment;
                $tableRows[] = [
                    'ID' => $payment->id,
                    'Voucher #' => $payment->voucher_no,
                    'Date' => $payment->date,
                    'Party' => $payment->account ? $payment->account->title : 'N/A',
                    'Amount' => number_format($payment->amount, 2),
                    'Type' => $payment->type,
                    'Bill' => implode(', ', $billDetails),
                    'Status' => $isDryRun ? 'Would Delete' : 'Deleting',
                ];
            }
        }

        if (empty($duplicatesToDelete)) {
            $this->info('✅ Found ' . $candidates->count() . ' edit payments, but none are duplicate over-allocations.');
            return 0;
        }

        $this->table(['ID', 'Voucher #', 'Date', 'Party', 'Amount', 'Type', 'Bill', 'Action'], $tableRows);
        $totalAmount = collect($duplicatesToDelete)->sum('amount');
        $this->warn('Total duplicate vouchers found: ' . count($duplicatesToDelete) . ' (Total Amount: Rs ' . number_format($totalAmount, 2) . ')');

        if ($isDryRun) {
            $this->line('');
            $this->info('💡 [DRY-RUN COMPLETE] Run `php artisan payments:clean-edit-duplicates` without --dry-run to permanently remove these vouchers.');
            return 0;
        }

        if (!$this->confirm('Are you sure you want to delete these duplicate vouchers and adjust bill/ledger balances?', true)) {
            $this->warn('Operation cancelled by user.');
            return 0;
        }

        DB::beginTransaction();
        try {
            $cleanedCount = 0;
            foreach ($duplicatesToDelete as $payment) {
                // Reverse allocations on bills
                foreach ($payment->allocations as $alloc) {
                    $isSale = $alloc->bill_type === 'App\Models\Sales';
                    $bill = $isSale ? Sales::find($alloc->bill_id) : Purchase::find($alloc->bill_id);

                    if ($bill) {
                        $netPayable = max(0, (float)$bill->net_total - (float)($bill->extra_discount ?? 0));
                        $bill->paid_amount = max(0, round((float)$bill->paid_amount - (float)$alloc->amount, 2));
                        $bill->remaining_amount = max(0, round($netPayable - (float)$bill->paid_amount, 2));

                        if ($isSale) {
                            if ($bill->remaining_amount <= 0.001 && $bill->paid_amount > 0) {
                                $bill->status = 'Paid';
                            } elseif ($bill->paid_amount > 0) {
                                $bill->status = 'Partial';
                            } else {
                                $bill->status = 'Unpaid';
                            }
                        } else {
                            if ($bill->remaining_amount <= 0.001) {
                                $bill->status = 'Completed';
                            } elseif ($bill->paid_amount > 0) {
                                $bill->status = 'Partial';
                            } else {
                                $bill->status = 'Unpaid';
                            }
                        }
                        $bill->save();
                    }
                    $alloc->delete();
                }

                $payment->delete();
                $cleanedCount++;
            }

            DB::commit();
            $this->info("🎉 Successfully removed {$cleanedCount} duplicate payment vouchers and repaired affected invoice & ledger balances.");
            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Failed to clean duplicate payments: ' . $e->getMessage());
            Log::error('CleanDuplicateEditPayments Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return 1;
        }
    }
}
