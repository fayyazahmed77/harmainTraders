<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\Sales;
use App\Models\SalesReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class JournalVoucherController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view jv', only: ['index', 'show', 'pdf']),
            new Middleware('permission:create jv', only: ['create', 'store']),
            new Middleware('permission:manage jv', only: ['edit', 'update']),
            new Middleware('permission:delete jv', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Payment::with(['account'])
            ->where('payment_method', 'Journal')
            ->where('type', 'RECEIPT');

        // Search by Voucher No or Remarks
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('voucher_no', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        // Date Range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        } elseif ($request->filled('start_date')) {
            $query->where('date', '>=', $request->start_date);
        } elseif ($request->filled('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Min & Max Amount
        if ($request->filled('min_amount')) {
            $query->where('amount', '>=', (float) $request->min_amount);
        }
        if ($request->filled('max_amount')) {
            $query->where('amount', '<=', (float) $request->max_amount);
        }

        // Universal Party Account (matches either Credit or Debit side)
        if ($request->filled('account_id') && $request->account_id !== 'all') {
            $accountId = $request->account_id;
            $query->whereIn('group_id', function ($sub) use ($accountId) {
                $sub->select('group_id')
                    ->from('payments')
                    ->where('payment_method', 'Journal')
                    ->where('account_id', $accountId);
            });
        }

        // Specific Credit Account
        if ($request->filled('credit_account_id') && $request->credit_account_id !== 'all') {
            $query->where('account_id', $request->credit_account_id);
        }

        // Specific Debit Account
        if ($request->filled('debit_account_id') && $request->debit_account_id !== 'all') {
            $debitAccId = $request->debit_account_id;
            $query->whereIn('group_id', function ($sub) use ($debitAccId) {
                $sub->select('group_id')
                    ->from('payments')
                    ->where('type', 'PAYMENT')
                    ->where('payment_method', 'Journal')
                    ->where('account_id', $debitAccId);
            });
        }

        // Total amount for filtered results
        $filteredTotalAmount = (float) (clone $query)->sum('amount');

        // Pagination (Default 50 rows)
        $perPage = in_array((int) $request->input('per_page'), [15, 25, 50, 100]) ? (int) $request->input('per_page') : 50;
        $jvs = $query->orderBy('date', 'desc')
                     ->orderBy('id', 'desc')
                     ->paginate($perPage)
                     ->withQueryString();

        // Get the matching 'PAYMENT' records for these vouchers using group_id
        $groupIds = $jvs->pluck('group_id');
        $creditSides = Payment::with('account')
            ->whereIn('group_id', $groupIds)
            ->where('type', 'PAYMENT')
            ->where('payment_method', 'Journal')
            ->get()
            ->keyBy('group_id');

        $mappedJvs = collect($jvs->items())->map(function ($receipt) use ($creditSides) {
            $payment = $creditSides->get($receipt->group_id);
            // Clean up voucher no for display (remove suffix)
            $cleanVoucherNo = str_replace(['-A', '-B'], '', $receipt->voucher_no);
            return [
                'id'                => $receipt->id, // primary ID for deletion/reference
                'date'              => $receipt->date,
                'voucher_no'        => $cleanVoucherNo,
                'credit_account'    => $receipt->account ? $receipt->account->title : 'N/A', // RECEIPT side
                'credit_account_id' => $receipt->account_id,
                'debit_account'     => $payment && $payment->account ? $payment->account->title : 'N/A', // PAYMENT side
                'debit_account_id'  => $payment ? $payment->account_id : null,
                'amount'            => (float) $receipt->amount,
                'remarks'           => $receipt->remarks,
            ];
        });

        $accounts = Account::active()
            ->select('id', 'title', 'code')
            ->orderBy('title', 'asc')
            ->get();

        return Inertia::render('journal-voucher/Index', [
            'jvs' => [
                'data'         => $mappedJvs,
                'current_page' => $jvs->currentPage(),
                'last_page'    => $jvs->lastPage(),
                'per_page'     => $jvs->perPage(),
                'total'        => $jvs->total(),
                'links'        => $jvs->linkCollection()->toArray(),
            ],
            'total_amount' => $filteredTotalAmount,
            'accounts'     => $accounts,
            'filters'      => $request->all([
                'search',
                'start_date',
                'end_date',
                'account_id',
                'debit_account_id',
                'credit_account_id',
                'min_amount',
                'max_amount',
                'per_page',
            ]),
        ]);
    }

    public function create()
    {
        // Allow only Customer and Supplier accounts
        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Customers', 'Supplier']);
            })
            ->get();
        \App\Services\PaymentAccountingService::attachBulkBalances($accounts);

        return Inertia::render('journal-voucher/Create', [
            'accounts' => $accounts,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'credit_account_id' => 'required|exists:accounts,id',
            'debit_account_id' => 'required|exists:accounts,id|different:credit_account_id',
            'amount' => 'required|numeric|min:0.01',
            'remarks' => 'nullable|string',
            'source_allocations' => 'nullable|array',
            'destination_allocations' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            // Generate Base Voucher No - Safer approach
            $lastPayment = Payment::where('voucher_no', 'LIKE', 'JV-%')
                ->orderByRaw('CAST(SUBSTRING(voucher_no, 4) AS UNSIGNED) DESC')
                ->first();
            
            $nextNum = 1;
            if ($lastPayment) {
                $lastNum = (int) str_replace('JV-', '', $lastPayment->voucher_no);
                $nextNum = $lastNum + 1;
            }
            
            $voucherNo = 'JV-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
            
            // Final safety check to avoid race conditions
            while (Payment::where('voucher_no', $voucherNo)->exists()) {
                $nextNum++;
                $voucherNo = 'JV-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
            }

            // Entry 1: Credit Account
            $receipt = Payment::create([
                'date' => $request->date,
                'voucher_no' => $voucherNo . '-A',
                'account_id' => $request->credit_account_id,
                'payment_account_id' => null, 
                'amount' => $request->amount,
                'discount' => 0,
                'net_amount' => $request->amount,
                'type' => 'RECEIPT',
                'payment_method' => 'Journal',
                'remarks' => $request->remarks,
                'cheque_status' => 'Clear',
            ]);

            $groupId = $receipt->id;
            $receipt->update(['group_id' => $groupId]);

            // Process Source Allocations (manual) OR Auto-FIFO for Customer RECEIPT side
            $sourceAllocations = $request->source_allocations ?? [];
            $hasManualSource = !empty(array_filter($sourceAllocations, fn($a) => !empty($a['bill_id']) && !empty($a['amount']) && $a['amount'] > 0));

            if ($hasManualSource) {
                // User manually selected bills — honour their selection
                foreach ($sourceAllocations as $alloc) {
                    if (isset($alloc['bill_id']) && isset($alloc['amount']) && $alloc['amount'] > 0) {
                        PaymentAllocation::create([
                            'payment_id' => $receipt->id,
                            'bill_id'    => $alloc['bill_id'],
                            'bill_type'  => $alloc['type'],
                            'amount'     => $alloc['amount'],
                        ]);
                        $this->updateBillAfterAllocation($alloc['bill_id'], $alloc['type'], $alloc['amount']);
                    }
                }
            } else {
                // Auto-FIFO: if credit account is a Customer, settle their Sales invoices
                $creditAccount = Account::with('accountType')->find($request->credit_account_id);
                if ($creditAccount && strtolower($creditAccount->accountType->name ?? '') === 'customers') {
                    $this->fifoAllocateBills($receipt->id, $creditAccount->id, 'sales', (float) $request->amount);
                }
            }

            // Entry 2: Debit Account
            $payment = Payment::create([
                'date' => $request->date,
                'voucher_no' => $voucherNo . '-B',
                'account_id' => $request->debit_account_id,
                'payment_account_id' => null, 
                'amount' => $request->amount,
                'discount' => 0,
                'net_amount' => $request->amount,
                'type' => 'PAYMENT',
                'payment_method' => 'Journal',
                'remarks' => $request->remarks,
                'group_id' => $groupId,
                'cheque_status' => 'Clear',
            ]);

            // Process Destination Allocations (manual) OR Auto-FIFO for Supplier PAYMENT side
            $destAllocations = $request->destination_allocations ?? [];
            $hasManualDest = !empty(array_filter($destAllocations, fn($a) => !empty($a['bill_id']) && !empty($a['amount']) && $a['amount'] > 0));

            if ($hasManualDest) {
                // User manually selected bills — honour their selection
                foreach ($destAllocations as $alloc) {
                    if (isset($alloc['bill_id']) && isset($alloc['amount']) && $alloc['amount'] > 0) {
                        PaymentAllocation::create([
                            'payment_id' => $payment->id,
                            'bill_id'    => $alloc['bill_id'],
                            'bill_type'  => $alloc['type'],
                            'amount'     => $alloc['amount'],
                        ]);
                        $this->updateBillAfterAllocation($alloc['bill_id'], $alloc['type'], $alloc['amount']);
                    }
                }
            } else {
                // Auto-FIFO: if debit account is a Supplier, settle their Purchase bills
                $debitAccount = Account::with('accountType')->find($request->debit_account_id);
                if ($debitAccount && strtolower($debitAccount->accountType->name ?? '') === 'supplier') {
                    $this->fifoAllocateBills($payment->id, $debitAccount->id, 'purchases', (float) $request->amount);
                }
            }

            DB::commit();

            return redirect()->route('journal-vouchers.index')->with('success', 'Journal Voucher created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('JV Store Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to save: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        $jvReceipt = Payment::findOrFail($id);

        if ($jvReceipt->payment_method !== 'Journal') {
            abort(403, 'Not a Journal Voucher');
        }

        DB::beginTransaction();
        try {
            $jvRecords = Payment::where('group_id', $jvReceipt->group_id)->get();
            
            foreach ($jvRecords as $record) {
                $allocations = \App\Models\PaymentAllocation::where('payment_id', $record->id)->get();
                foreach ($allocations as $alloc) {
                    $bill = $alloc->bill_type === 'App\Models\Sales' 
                        ? \App\Models\Sales::find($alloc->bill_id) 
                        : \App\Models\Purchase::find($alloc->bill_id);
                        
                    if ($bill) {
                        $bill->paid_amount = max(0, $bill->paid_amount - $alloc->amount);
                        $sumOfReturns = $alloc->bill_type === 'App\Models\Sales' 
                            ? (float) \App\Models\SalesReturn::where('original_invoice', $bill->invoice)->sum('net_total')
                            : (float) \App\Models\PurchaseReturn::where('original_invoice', $bill->invoice)->sum('net_total');
                        $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumOfReturns;
                        
                        if ($alloc->bill_type === 'App\Models\Sales') {
                            if ($bill->remaining_amount <= 0 && $bill->paid_amount > 0) {
                                $bill->status = 'Paid';
                            } elseif ($bill->remaining_amount > 0 && $bill->paid_amount > 0) {
                                $bill->status = 'Partial';
                            } else {
                                $bill->status = 'Unpaid';
                            }
                        } else {
                            // Purchase status ENUM: 'Completed','Partial Return','Returned',''
                            $bill->status = $bill->remaining_amount <= 0 ? 'Completed' : '';
                        }
                        $bill->save();
                    }
                }
                \App\Models\PaymentAllocation::where('payment_id', $record->id)->delete();
                $record->delete();
            }

            DB::commit();
            return back()->with('success', 'Journal Voucher deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('JV Delete Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to delete Journal Voucher: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $receipt = Payment::with(['account.accountType', 'allocations.bill', 'firm'])->findOrFail($id);
        if ($receipt->payment_method !== 'Journal' || $receipt->type !== 'RECEIPT') {
            abort(403, 'Not a primary Credit side Journal Voucher');
        }

        $payment = Payment::with(['account.accountType', 'allocations.bill'])
            ->where('group_id', $receipt->group_id)
            ->where('type', 'PAYMENT')
            ->where('payment_method', 'Journal')
            ->firstOrFail();

        $cleanVoucherNo = str_replace(['-A', '-B'], '', $receipt->voucher_no);
        $amountInWords = self::convertNumberToWords((float) $receipt->amount);

        return Inertia::render('journal-voucher/Show', [
            'receipt' => $receipt,
            'payment' => $payment,
            'voucher_no' => $cleanVoucherNo,
            'amount_in_words' => $amountInWords,
        ]);
    }

    public function edit($id)
    {
        $receipt = Payment::with(['allocations'])->findOrFail($id);
        if ($receipt->payment_method !== 'Journal' || $receipt->type !== 'RECEIPT') {
            abort(403, 'Not a primary Credit side Journal Voucher');
        }

        $payment = Payment::with(['allocations'])
            ->where('group_id', $receipt->group_id)
            ->where('type', 'PAYMENT')
            ->where('payment_method', 'Journal')
            ->firstOrFail();

        $accounts = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Customers', 'Supplier']);
            })
            ->get();
        \App\Services\PaymentAccountingService::attachBulkBalances($accounts);

        return Inertia::render('journal-voucher/Edit', [
            'receipt' => $receipt,
            'payment' => $payment,
            'accounts' => $accounts,
        ]);
    }

    public function update(Request $request, $id)
    {
        $receipt = Payment::findOrFail($id);
        if ($receipt->payment_method !== 'Journal' || $receipt->type !== 'RECEIPT') {
            abort(403, 'Not a primary Credit side Journal Voucher');
        }

        $payment = Payment::where('group_id', $receipt->group_id)
            ->where('type', 'PAYMENT')
            ->where('payment_method', 'Journal')
            ->firstOrFail();

        $request->validate([
            'date' => 'required|date',
            'credit_account_id' => 'required|exists:accounts,id',
            'debit_account_id' => 'required|exists:accounts,id|different:credit_account_id',
            'amount' => 'required|numeric|min:0.01',
            'remarks' => 'nullable|string',
            'source_allocations' => 'nullable|array',
            'destination_allocations' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            // 1. Revert existing allocations for BOTH receipt and payment
            $receiptAllocations = \App\Models\PaymentAllocation::where('payment_id', $receipt->id)->get();
            foreach ($receiptAllocations as $alloc) {
                $bill = $alloc->bill_type === 'App\Models\Sales' 
                    ? \App\Models\Sales::find($alloc->bill_id) 
                    : \App\Models\Purchase::find($alloc->bill_id);
                if ($bill) {
                    $bill->paid_amount = max(0, $bill->paid_amount - $alloc->amount);
                    $sumOfReturns = $alloc->bill_type === 'App\Models\Sales' 
                        ? (float) \App\Models\SalesReturn::where('original_invoice', $bill->invoice)->sum('net_total')
                        : (float) \App\Models\PurchaseReturn::where('original_invoice', $bill->invoice)->sum('net_total');
                    $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumOfReturns;
                    if ($alloc->bill_type === 'App\Models\Sales') {
                        $bill->status = $bill->remaining_amount <= 0 ? 'Paid' : ($bill->paid_amount > 0 ? 'Partial' : 'Unpaid');
                    } else {
                        $bill->status = $bill->remaining_amount <= 0 ? 'Completed' : '';
                    }
                    $bill->save();
                }
            }
            \App\Models\PaymentAllocation::where('payment_id', $receipt->id)->delete();

            $paymentAllocations = \App\Models\PaymentAllocation::where('payment_id', $payment->id)->get();
            foreach ($paymentAllocations as $alloc) {
                $bill = $alloc->bill_type === 'App\Models\Sales' 
                    ? \App\Models\Sales::find($alloc->bill_id) 
                    : \App\Models\Purchase::find($alloc->bill_id);
                if ($bill) {
                    $bill->paid_amount = max(0, $bill->paid_amount - $alloc->amount);
                    $sumOfReturns = $alloc->bill_type === 'App\Models\Sales' 
                        ? (float) \App\Models\SalesReturn::where('original_invoice', $bill->invoice)->sum('net_total')
                        : (float) \App\Models\PurchaseReturn::where('original_invoice', $bill->invoice)->sum('net_total');
                    $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumOfReturns;
                    if ($alloc->bill_type === 'App\Models\Sales') {
                        $bill->status = $bill->remaining_amount <= 0 ? 'Paid' : ($bill->paid_amount > 0 ? 'Partial' : 'Unpaid');
                    } else {
                        $bill->status = $bill->remaining_amount <= 0 ? 'Completed' : '';
                    }
                    $bill->save();
                }
            }
            \App\Models\PaymentAllocation::where('payment_id', $payment->id)->delete();

            // 2. Update both Payments
            $receipt->update([
                'date' => $request->date,
                'account_id' => $request->credit_account_id,
                'amount' => $request->amount,
                'net_amount' => $request->amount,
                'remarks' => $request->remarks,
                'cheque_status' => 'Clear',
            ]);

            $payment->update([
                'date' => $request->date,
                'account_id' => $request->debit_account_id,
                'amount' => $request->amount,
                'net_amount' => $request->amount,
                'remarks' => $request->remarks,
                'cheque_status' => 'Clear',
            ]);

            // 3. Process new allocations (manual) OR Auto-FIFO
            $sourceAllocations = $request->source_allocations ?? [];
            $hasManualSource = !empty(array_filter($sourceAllocations, fn($a) => !empty($a['bill_id']) && !empty($a['amount']) && $a['amount'] > 0));

            if ($hasManualSource) {
                foreach ($sourceAllocations as $alloc) {
                    if (isset($alloc['bill_id']) && isset($alloc['amount']) && $alloc['amount'] > 0) {
                        PaymentAllocation::create([
                            'payment_id' => $receipt->id,
                            'bill_id'    => $alloc['bill_id'],
                            'bill_type'  => $alloc['type'],
                            'amount'     => $alloc['amount'],
                        ]);
                        $this->updateBillAfterAllocation($alloc['bill_id'], $alloc['type'], $alloc['amount']);
                    }
                }
            } else {
                $creditAccount = Account::with('accountType')->find($request->credit_account_id);
                if ($creditAccount && strtolower($creditAccount->accountType->name ?? '') === 'customers') {
                    $this->fifoAllocateBills($receipt->id, $creditAccount->id, 'sales', (float) $request->amount);
                }
            }

            $destAllocations = $request->destination_allocations ?? [];
            $hasManualDest = !empty(array_filter($destAllocations, fn($a) => !empty($a['bill_id']) && !empty($a['amount']) && $a['amount'] > 0));

            if ($hasManualDest) {
                foreach ($destAllocations as $alloc) {
                    if (isset($alloc['bill_id']) && isset($alloc['amount']) && $alloc['amount'] > 0) {
                        PaymentAllocation::create([
                            'payment_id' => $payment->id,
                            'bill_id'    => $alloc['bill_id'],
                            'bill_type'  => $alloc['type'],
                            'amount'     => $alloc['amount'],
                        ]);
                        $this->updateBillAfterAllocation($alloc['bill_id'], $alloc['type'], $alloc['amount']);
                    }
                }
            } else {
                $debitAccount = Account::with('accountType')->find($request->debit_account_id);
                if ($debitAccount && strtolower($debitAccount->accountType->name ?? '') === 'supplier') {
                    $this->fifoAllocateBills($payment->id, $debitAccount->id, 'purchases', (float) $request->amount);
                }
            }

            DB::commit();
            return redirect()->route('journal-vouchers.index')->with('success', 'Journal Voucher updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('JV Update Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to update: ' . $e->getMessage()]);
        }
    }

    /**
     * Auto-FIFO: Allocate a payment/receipt against the oldest unpaid bills (oldest date first).
     *
     * @param int    $paymentId  The Payment record this allocation belongs to
     * @param int    $accountId  The customer or supplier account id
     * @param string $billType   'sales' or 'purchases'
     * @param float  $amount     Total amount to distribute
     */
    private function fifoAllocateBills(int $paymentId, int $accountId, string $billType, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        if ($billType === 'sales') {
            $bills = Sales::where('customer_id', $accountId)
                ->where('remaining_amount', '>', 0)
                ->orderBy('date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            $remaining = $amount;
            foreach ($bills as $bill) {
                if ($remaining <= 0) {
                    break;
                }
                $allocate = min((float) $bill->remaining_amount, $remaining);

                PaymentAllocation::create([
                    'payment_id' => $paymentId,
                    'bill_id'   => $bill->id,
                    'bill_type' => 'App\\Models\\Sales',
                    'amount'    => $allocate,
                ]);

                $this->updateBillAfterAllocation($bill->id, 'App\\Models\\Sales', $allocate);
                $remaining -= $allocate;
            }
        } elseif ($billType === 'purchases') {
            $bills = Purchase::where('supplier_id', $accountId)
                ->where('remaining_amount', '>', 0)
                ->orderBy('date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            $remaining = $amount;
            foreach ($bills as $bill) {
                if ($remaining <= 0) {
                    break;
                }
                $allocate = min((float) $bill->remaining_amount, $remaining);

                PaymentAllocation::create([
                    'payment_id' => $paymentId,
                    'bill_id'   => $bill->id,
                    'bill_type' => 'App\\Models\\Purchase',
                    'amount'    => $allocate,
                ]);

                $this->updateBillAfterAllocation($bill->id, 'App\\Models\\Purchase', $allocate);
                $remaining -= $allocate;
            }
        }
    }

    /**
     * Re-calculate and persist paid_amount, remaining_amount, and status on a bill
     * after an allocation of $allocatedAmount has been added.
     */
    private function updateBillAfterAllocation(int $billId, string $billType, float $allocatedAmount): void
    {
        if ($billType === 'App\\Models\\Sales') {
            $bill = Sales::find($billId);
            if (!$bill) {
                return;
            }
            $sumReturns = (float) SalesReturn::where('original_invoice', $bill->invoice)->sum('net_total');
            $bill->paid_amount     += $allocatedAmount;
            $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumReturns;
            if ($bill->remaining_amount <= 0 && $bill->paid_amount > 0) {
                $bill->status = 'Paid';
            } elseif ($bill->paid_amount > 0) {
                $bill->status = 'Partial';
            } else {
                $bill->status = 'Unpaid';
            }
            $bill->save();
        } else {
            $bill = Purchase::find($billId);
            if (!$bill) {
                return;
            }
            $sumReturns = (float) PurchaseReturn::where('original_invoice', $bill->invoice)->sum('net_total');
            $bill->paid_amount     += $allocatedAmount;
            $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumReturns;
            $bill->status = $bill->remaining_amount <= 0 ? 'Completed' : $bill->status;
            $bill->save();
        }
    }

    public function pdf($id)
    {
        $receipt = Payment::with(['account.accountType', 'allocations.bill', 'firm'])->findOrFail($id);
        if ($receipt->payment_method !== 'Journal' || $receipt->type !== 'RECEIPT') {
            abort(403, 'Not a primary Credit side Journal Voucher');
        }

        $payment = Payment::with(['account.accountType', 'allocations.bill'])
            ->where('group_id', $receipt->group_id)
            ->where('type', 'PAYMENT')
            ->where('payment_method', 'Journal')
            ->firstOrFail();

        $cleanVoucherNo = str_replace(['-A', '-B'], '', $receipt->voucher_no);
        $amountInWords = self::convertNumberToWords((float) $receipt->amount);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.journal-voucher', [
            'receipt' => $receipt,
            'payment' => $payment,
            'voucher_no' => $cleanVoucherNo,
            'amount_in_words' => $amountInWords,
        ]);

        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream($cleanVoucherNo . '.pdf');
    }

    /**
     * Converts numeric currency amounts into formal English words.
     */
    public static function convertNumberToWords(float $amount): string
    {
        if (class_exists(\NumberFormatter::class)) {
            try {
                $formatter = new \NumberFormatter('en', \NumberFormatter::SPELLOUT);
                return ucfirst($formatter->format($amount)) . ' Rupees Only';
            } catch (\Exception $e) {
                // Fallback below
            }
        }
        return 'PKR ' . number_format($amount, 2);
    }
}
