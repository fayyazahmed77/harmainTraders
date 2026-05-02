<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class JournalVoucherController extends Controller
{
    public function index(Request $request)
    {
        // Fetch all JVs, group by voucher_no. We can fetch where payment_method = 'Journal'
        // Since each JV has two records (RECEIPT and PAYMENT), we can just fetch the RECEIPTs and then load the related PAYMENT via voucher_no, or fetch all and group them.
        $query = Payment::with(['account'])->where('payment_method', 'Journal');
        
        if ($request->has('start_date') && $request->start_date && $request->has('end_date') && $request->end_date) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        // To list them uniquely, let's fetch the 'RECEIPT' side of the JV as the primary record to display in the table,
        // and append the 'PAYMENT' side information using group_id.
        $jvs = $query->where('type', 'RECEIPT')
                     ->orderBy('date', 'desc')
                     ->orderBy('id', 'desc')
                     ->paginate(15)
                     ->withQueryString();

        // Get the matching 'PAYMENT' records for these vouchers using group_id
        $groupIds = $jvs->pluck('group_id');
        $creditSides = Payment::with('account')
            ->whereIn('group_id', $groupIds)
            ->where('type', 'PAYMENT')
            ->where('payment_method', 'Journal')
            ->get()
            ->keyBy('group_id');

        $mappedJvs = collect($jvs->items())->map(function($receipt) use ($creditSides) {
            $payment = $creditSides->get($receipt->group_id);
            // Clean up voucher no for display (remove suffix)
            $cleanVoucherNo = str_replace(['-A', '-B'], '', $receipt->voucher_no);
            return [
                'id' => $receipt->id, // primary ID for deletion/reference
                'date' => $receipt->date,
                'voucher_no' => $cleanVoucherNo,
                'credit_account' => $receipt->account ? $receipt->account->title : 'N/A', // RECEIPT side
                'debit_account' => $payment && $payment->account ? $payment->account->title : 'N/A', // PAYMENT side
                'amount' => $receipt->amount,
                'remarks' => $receipt->remarks,
            ];
        });

        return Inertia::render('journal-voucher/Index', [
            'jvs' => [
                'data' => $mappedJvs,
                'current_page' => $jvs->currentPage(),
                'last_page' => $jvs->lastPage(),
                'total' => $jvs->total(),
            ],
            'filters' => $request->all(['start_date', 'end_date'])
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
            ]);

            $groupId = $receipt->id;
            $receipt->update(['group_id' => $groupId]);

            // Process Source Allocations
            if ($request->has('source_allocations') && is_array($request->source_allocations)) {
                foreach ($request->source_allocations as $alloc) {
                    if (isset($alloc['bill_id']) && isset($alloc['amount']) && $alloc['amount'] > 0) {
                        \App\Models\PaymentAllocation::create([
                            'payment_id' => $receipt->id,
                            'bill_id' => $alloc['bill_id'],
                            'bill_type' => $alloc['type'],
                            'amount' => $alloc['amount']
                        ]);
                        
                        $bill = $alloc['type'] === 'App\Models\Sales' 
                            ? \App\Models\Sales::find($alloc['bill_id']) 
                            : \App\Models\Purchase::find($alloc['bill_id']);
                            
                        if ($bill) {
                            $bill->paid_amount += $alloc['amount'];
                            $sumOfReturns = $alloc['type'] === 'App\Models\Sales' 
                                ? (float) \App\Models\SalesReturn::where('original_invoice', $bill->invoice)->sum('net_total')
                                : (float) \App\Models\PurchaseReturn::where('original_invoice', $bill->invoice)->sum('net_total');
                            $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumOfReturns;
                            if ($alloc['type'] === 'App\Models\Sales') {
                                $bill->status = $bill->remaining_amount <= 0 ? 'Paid' : 'Partial';
                            } else {
                                $bill->status = $bill->remaining_amount <= 0 ? 'Completed' : $bill->status;
                            }
                            $bill->save();
                        }
                    }
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
            ]);

            // Process Destination Allocations
            if ($request->has('destination_allocations') && is_array($request->destination_allocations)) {
                foreach ($request->destination_allocations as $alloc) {
                    if (isset($alloc['bill_id']) && isset($alloc['amount']) && $alloc['amount'] > 0) {
                        \App\Models\PaymentAllocation::create([
                            'payment_id' => $payment->id,
                            'bill_id' => $alloc['bill_id'],
                            'bill_type' => $alloc['type'],
                            'amount' => $alloc['amount']
                        ]);
                        
                        $bill = $alloc['type'] === 'App\Models\Sales' 
                            ? \App\Models\Sales::find($alloc['bill_id']) 
                            : \App\Models\Purchase::find($alloc['bill_id']);
                            
                        if ($bill) {
                            $bill->paid_amount += $alloc['amount'];
                            $sumOfReturns = $alloc['type'] === 'App\Models\Sales' 
                                ? (float) \App\Models\SalesReturn::where('original_invoice', $bill->invoice)->sum('net_total')
                                : (float) \App\Models\PurchaseReturn::where('original_invoice', $bill->invoice)->sum('net_total');
                            $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumOfReturns;
                            if ($alloc['type'] === 'App\Models\Sales') {
                                $bill->status = $bill->remaining_amount <= 0 ? 'Paid' : 'Partial';
                            } else {
                                $bill->status = $bill->remaining_amount <= 0 ? 'Completed' : $bill->status;
                            }
                            $bill->save();
                        }
                    }
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
}
