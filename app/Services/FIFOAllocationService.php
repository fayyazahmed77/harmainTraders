<?php

namespace App\Services;

use App\Models\Sales;
use App\Models\SalesReturn;
use App\Models\SalesReturnAllocation;
use App\Models\CustomerCredit;
use Illuminate\Support\Facades\DB;

class FIFOAllocationService
{
    /**
     * Allocate return value to outstanding sales invoices oldest first (FIFO).
     */
    public function allocate(SalesReturn $return, float $amountToAllocate): void
    {
        if ($amountToAllocate <= 0) {
            return;
        }

        DB::transaction(function () use ($return, $amountToAllocate) {
            $remainingReturn = $amountToAllocate;

            // 1. If this return is tied to a specific sale, FIRST allocate return amount to that source sale
            $sourceSale = null;
            if (!empty($return->sale_id)) {
                $sourceSale = Sales::find($return->sale_id);
            }
            if (!$sourceSale && !empty($return->original_invoice)) {
                $sourceSale = Sales::where('invoice', $return->original_invoice)->first();
            }

            if ($sourceSale && $sourceSale->remaining_amount > 0.005) {
                $allocatedToSource = min($sourceSale->remaining_amount, $remainingReturn);
                SalesReturnAllocation::create([
                    'sales_return_id' => $return->id,
                    'sale_id'         => $sourceSale->id,
                    'amount'          => $allocatedToSource,
                ]);

                $sourceSale->remaining_amount = max(0, $sourceSale->remaining_amount - $allocatedToSource);
                $sourceSale->status = $this->determineInvoiceStatus($sourceSale);
                $sourceSale->save();

                $remainingReturn -= $allocatedToSource;
            } elseif ($sourceSale) {
                // If source sale had 0 remaining (already paid), still ensure its status is updated to Returned/Partial Return
                $sourceSale->status = $this->determineInvoiceStatus($sourceSale);
                $sourceSale->save();
            }

            // 2. Allocate any surplus return value to older unpaid sales invoices (FIFO)
            if ($remainingReturn > 0.005) {
                $unpaidInvoicesQuery = Sales::where('customer_id', $return->customer_id)
                    ->where('remaining_amount', '>', 0.005)
                    ->whereNotIn('status', ['Canceled', 'Returned']);

                if ($sourceSale) {
                    $unpaidInvoicesQuery->where('id', '!=', $sourceSale->id);
                }

                $unpaidInvoices = $unpaidInvoicesQuery
                    ->orderBy('date', 'asc')
                    ->orderBy('id', 'asc')
                    ->lockForUpdate()
                    ->get();

                foreach ($unpaidInvoices as $invoice) {
                    if ($remainingReturn <= 0.005) {
                        break;
                    }

                    $allocatedAmount = min($invoice->remaining_amount, $remainingReturn);

                    // Record allocation
                    SalesReturnAllocation::create([
                        'sales_return_id' => $return->id,
                        'sale_id'         => $invoice->id,
                        'amount'          => $allocatedAmount,
                    ]);

                    // Update invoice
                    $invoice->remaining_amount = max(0, $invoice->remaining_amount - $allocatedAmount);
                    $invoice->status = $this->determineInvoiceStatus($invoice);
                    $invoice->save();

                    $remainingReturn -= $allocatedAmount;
                }
            }

            // 3. If there's surplus return value, create a Customer Credit Note
            if ($remainingReturn > 0.005) {
                CustomerCredit::create([
                    'customer_id'       => $return->customer_id,
                    'sales_return_id'   => $return->id,
                    'amount'            => $remainingReturn,
                    'available_balance' => $remainingReturn,
                    'status'            => 'Available',
                ]);
            }
        });
    }

    /**
     * Rollback existing return allocations and credits.
     * Throws an exception if credit note is already refunded.
     */
    public function rollback(SalesReturn $return): void
    {
        DB::transaction(function () use ($return) {
            // 1. Check if there is an associated credit note and if it has been refunded
            $credit = CustomerCredit::where('sales_return_id', $return->id)->first();
            if ($credit) {
                // If any part of the credit has been refunded (i.e. available_balance < amount)
                if (round($credit->available_balance, 2) < round($credit->amount, 2)) {
                    throw new \Exception("Cannot edit/delete Sales Return. Customer Credit Note has already been partially or fully refunded.");
                }
                $credit->delete();
            }

            // 2. Rollback allocations to invoices
            $allocations = SalesReturnAllocation::where('sales_return_id', $return->id)->get();
            foreach ($allocations as $alloc) {
                $invoice = Sales::find($alloc->sale_id);
                if ($invoice) {
                    $invoice->remaining_amount += $alloc->amount;
                    $invoice->status = $this->determineInvoiceStatus($invoice);
                    $invoice->save();
                }
                $alloc->delete();
            }
        });
    }

    /**
     * Determine status of Sales Invoice based on payments and returns.
     */
    private function determineInvoiceStatus(Sales $sale): string
    {
        // Calculate Total Returns for this invoice from allocations
        $totalReturns = SalesReturnAllocation::where('sale_id', $sale->id)->sum('amount');

        // Calculate Total Payments (Allocated) for this invoice
        $totalPayments = \App\Models\PaymentAllocation::where('bill_id', $sale->id)
            ->where('bill_type', 'App\Models\Sales')
            ->sum('amount');

        // Check if returned items equals total items sold
        $totalSoldQty = (float) \App\Models\SalesItem::where('sale_id', $sale->id)->sum('total_pcs');
        $allReturnIds = SalesReturn::where('sale_id', $sale->id)
            ->orWhere('original_invoice', $sale->invoice)
            ->pluck('id');
        $totalReturnedQty = (float) \App\Models\SalesReturnItem::whereIn('sales_return_id', $allReturnIds)->sum('total_pcs');

        if ($totalReturnedQty >= $totalSoldQty && $totalSoldQty > 0) {
            return 'Returned';
        }

        if ($totalReturnedQty > 0) {
            return 'Partial Return';
        }

        if ($sale->remaining_amount <= 0.005) {
            return ($totalReturns >= $sale->net_total || ($totalSoldQty > 0 && $totalReturnedQty >= $totalSoldQty)) ? 'Returned' : 'Paid';
        }

        if ($totalPayments > 0 || $totalReturns > 0) {
            return 'Partial';
        }

        return 'Completed';
    }

    /**
     * Allocate purchase return value to outstanding purchases invoices oldest first (FIFO).
     */
    public function allocatePurchaseReturn(\App\Models\PurchaseReturn $return, float $amountToAllocate): void
    {
        if ($amountToAllocate <= 0) {
            return;
        }

        DB::transaction(function () use ($return, $amountToAllocate) {
            $remainingReturn = $amountToAllocate;

            // 1. If this return is tied to a specific purchase, FIRST allocate return amount to that source purchase
            $sourcePurchase = null;
            if (!empty($return->purchase_id)) {
                $sourcePurchase = \App\Models\Purchase::find($return->purchase_id);
            }
            if (!$sourcePurchase && !empty($return->original_invoice)) {
                $sourcePurchase = \App\Models\Purchase::where('invoice', $return->original_invoice)->first();
            }

            if ($sourcePurchase && $sourcePurchase->remaining_amount > 0.005) {
                $allocatedToSource = min($sourcePurchase->remaining_amount, $remainingReturn);
                \App\Models\PurchaseReturnAllocation::create([
                    'purchase_return_id' => $return->id,
                    'purchase_id'        => $sourcePurchase->id,
                    'amount'             => $allocatedToSource,
                ]);

                $sourcePurchase->remaining_amount = max(0, $sourcePurchase->remaining_amount - $allocatedToSource);
                $sourcePurchase->status = $this->determinePurchaseInvoiceStatus($sourcePurchase);
                $sourcePurchase->save();

                $remainingReturn -= $allocatedToSource;
            } elseif ($sourcePurchase) {
                $sourcePurchase->status = $this->determinePurchaseInvoiceStatus($sourcePurchase);
                $sourcePurchase->save();
            }

            // 2. Allocate any surplus return value to older unpaid purchases (FIFO)
            if ($remainingReturn > 0.005) {
                $unpaidInvoicesQuery = \App\Models\Purchase::where('supplier_id', $return->supplier_id)
                    ->where('remaining_amount', '>', 0.005)
                    ->whereNotIn('status', ['Canceled', 'Returned']);

                if ($sourcePurchase) {
                    $unpaidInvoicesQuery->where('id', '!=', $sourcePurchase->id);
                }

                $unpaidInvoices = $unpaidInvoicesQuery
                    ->orderBy('date', 'asc')
                    ->orderBy('id', 'asc')
                    ->lockForUpdate()
                    ->get();

                foreach ($unpaidInvoices as $invoice) {
                    if ($remainingReturn <= 0.005) {
                        break;
                    }

                    $allocatedAmount = min($invoice->remaining_amount, $remainingReturn);

                    \App\Models\PurchaseReturnAllocation::create([
                        'purchase_return_id' => $return->id,
                        'purchase_id'        => $invoice->id,
                        'amount'             => $allocatedAmount,
                    ]);

                    $invoice->remaining_amount = max(0, $invoice->remaining_amount - $allocatedAmount);
                    $invoice->status = $this->determinePurchaseInvoiceStatus($invoice);
                    $invoice->save();

                    $remainingReturn -= $allocatedAmount;
                }
            }

            // 3. If there's surplus return value, create a Supplier Credit Note
            if ($remainingReturn > 0.005) {
                \App\Models\SupplierCredit::create([
                    'supplier_id'        => $return->supplier_id,
                    'purchase_return_id' => $return->id,
                    'amount'             => $remainingReturn,
                    'available_balance'  => $remainingReturn,
                    'status'             => 'Available',
                ]);
            }
        });
    }

    /**
     * Rollback existing purchase return allocations and credits.
     */
    public function rollbackPurchaseReturn(\App\Models\PurchaseReturn $return): void
    {
        DB::transaction(function () use ($return) {
            // 1. Check if there is an associated credit note and if it has been refunded
            $credit = \App\Models\SupplierCredit::where('purchase_return_id', $return->id)->first();
            if ($credit) {
                if (round($credit->available_balance, 2) < round($credit->amount, 2)) {
                    throw new \Exception("Cannot edit/delete Purchase Return. Supplier Credit Note has already been partially or fully refunded.");
                }
                $credit->delete();
            }

            // 2. Rollback allocations to invoices
            $allocations = \App\Models\PurchaseReturnAllocation::where('purchase_return_id', $return->id)->get();
            foreach ($allocations as $alloc) {
                $invoice = \App\Models\Purchase::find($alloc->purchase_id);
                if ($invoice) {
                    $invoice->remaining_amount += $alloc->amount;
                    $invoice->status = $this->determinePurchaseInvoiceStatus($invoice);
                    $invoice->save();
                }
                $alloc->delete();
            }
        });
    }

    /**
     * Determine status of Purchase Invoice based on payments and returns.
     */
    public function determinePurchaseInvoiceStatus(\App\Models\Purchase $purchase): string
    {
        // Calculate Total Returns for this invoice from allocations
        $totalReturns = \App\Models\PurchaseReturnAllocation::where('purchase_id', $purchase->id)->sum('amount');

        // Calculate Total Payments (Allocated) for this invoice
        $totalPayments = \App\Models\PaymentAllocation::where('bill_id', $purchase->id)
            ->where('bill_type', 'App\Models\Purchase')
            ->sum('amount');

        // Check if returned items equals total items purchased
        $totalSoldQty = (float) \App\Models\PurchaseItem::where('purchase_id', $purchase->id)->sum('total_pcs');
        $allReturnIds = \App\Models\PurchaseReturn::where('original_invoice', $purchase->invoice)
            ->orWhere('id', function($q) use ($purchase) {
                $q->select('purchase_return_id')->from('purchase_return_allocations')->where('purchase_id', $purchase->id);
            })
            ->pluck('id');
        $totalReturnedQty = (float) \App\Models\PurchaseReturnItem::whereIn('purchase_return_id', $allReturnIds)->sum('total_pcs');

        if ($totalReturnedQty >= $totalSoldQty && $totalSoldQty > 0) {
            return 'Returned';
        }

        if ($totalReturnedQty > 0) {
            return 'Partial Return';
        }

        if ($purchase->remaining_amount <= 0.005) {
            return ($totalReturns >= $purchase->net_total || ($totalSoldQty > 0 && $totalReturnedQty >= $totalSoldQty)) ? 'Returned' : 'Paid';
        }

        if ($totalPayments > 0 || $totalReturns > 0) {
            return 'Partial';
        }

        return 'Completed';
    }
}
