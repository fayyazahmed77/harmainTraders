<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Purchase;
use App\Models\Sales;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ClearingChequeController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:manage cheques'),
        ];
    }
    //index
    public function index(Request $request)
    {
        $status = $request->input('status', 'Pending');
        $accountId = $request->input('account_id');

        // Stats
        $stats = [
            'sales' => [
                'total' => Sales::sum('net_total'),
                'paid' => Sales::sum('paid_amount'),
                'due' => Sales::sum('remaining_amount'),
            ],
            'purchases' => [
                'total' => Purchase::sum('net_total'),
                'paid' => Purchase::sum('paid_amount'),
                'due' => Purchase::sum('remaining_amount'),
            ],
            'payments' => [
                'receipts' => Payment::where('type', 'RECEIPT')->where('cheque_status', 'Clear')->sum('amount'),
                'payments' => Payment::where('type', 'PAYMENT')->where('cheque_status', 'Clear')->sum('amount'),
            ],
            'clearing' => [
                'available_funds' => Sales::sum('paid_amount') - Payment::where('type', 'PAYMENT')->where('cheque_status', 'Clear')->sum('amount'),
                'pending_receipts_amount' => Payment::where('type', 'RECEIPT')->where('payment_method', 'Cheque')->whereIn('cheque_status', ['Pending', 'In Hand'])->sum('amount'),
                'pending_payments_amount' => Payment::where('type', 'PAYMENT')->where('payment_method', 'Cheque')->whereIn('cheque_status', ['Pending', 'In Hand'])->sum('amount'),
            ]
        ];

        $query = Payment::with(['account', 'paymentAccount', 'cheque'])
            ->where('payment_method', 'Cheque');

        // Filter by Status
        if ($status === 'Pending') {
            $query->whereIn('cheque_status', ['Pending', 'In Hand','Distributed']);
            $query->orderBy('clear_date', 'asc');
        } elseif ($status === 'Clear') {
            $query->where('cheque_status', 'Clear');
            $query->orderBy('clear_date', 'desc');
        } elseif ($status === 'Return') {
            $query->where('cheque_status', 'Canceled');
            $query->orderBy('updated_at', 'desc');
        }

        // Filter by Bank Account
        if ($accountId) {
            $query->where('payment_account_id', $accountId);
        }

        $payments = $query->paginate(50)->withQueryString();

        // Additional Summaries for Pending Tab
        $tomorrowAmount = 0;
        $dayAfterTomorrowAmount = 0;
        $bankSummaries = [];

        if ($status === 'Pending') {
            $tomorrow = now()->addDay()->format('Y-m-d');
            $dayAfterTomorrow = now()->addDays(2)->format('Y-m-d');

            $tomorrowAmount = Payment::where('payment_method', 'Cheque')
                ->whereIn('cheque_status', ['Pending', 'In Hand'])
                ->whereDate('clear_date', $tomorrow)
                ->sum('amount');

            $dayAfterTomorrowAmount = Payment::where('payment_method', 'Cheque')
                ->whereIn('cheque_status', ['Pending', 'In Hand'])
                ->whereDate('clear_date', $dayAfterTomorrow)
                ->sum('amount');

            $bankSummaries = Payment::where('payments.payment_method', 'Cheque')
                ->whereIn('payments.cheque_status', ['Pending', 'In Hand'])
                ->join('accounts', 'payments.payment_account_id', '=', 'accounts.id')
                ->selectRaw('accounts.title as bank_name, count(*) as count, sum(payments.amount) as total_amount')
                ->groupBy('payments.payment_account_id', 'accounts.title')
                ->get();
        }
        $accounts = Account::select('id', 'title')->with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['bank']);
            })
            ->get();
        return Inertia::render('daily/clearingcheque/index', [
            'stats' => $stats,
            'payments' => $payments,
            'accounts' => $accounts,
            'filters' => [
                'status' => $status,
                'account_id' => $accountId,
            ],
            'summaries' => [
                'tomorrow_amount' => $tomorrowAmount,
                'day_after_tomorrow_amount' => $dayAfterTomorrowAmount,
                'bank_summaries' => $bankSummaries,
            ]
        ]);
    }

    public function clear($id)
    {
        $payment = Payment::findOrFail($id);
        $payment->cheque_status = 'Clear';
        $payment->clear_date = now();
        $payment->save();

        return redirect()->back();
    }

    public function cancel($id)
    {
        DB::beginTransaction();
        try {
            // Find target payment and load its relationships
            $payment = Payment::with(['allocations', 'childPayments.allocations', 'sourcePayment.allocations'])->findOrFail($id);

            if ($payment->cheque_status === 'Canceled') {
                DB::rollBack();
                return redirect()->back()->with('error', 'Cheque is already canceled.');
            }

            // Identify all payments in the group that must be canceled
            $paymentsToCancel = collect([$payment]);

            if ($payment->type === 'RECEIPT' && $payment->cheque_status === 'Distributed') {
                // If canceling the distributed customer cheque, also cancel the child supplier payment(s)
                foreach ($payment->childPayments as $child) {
                    $paymentsToCancel->push($child);
                }
            } elseif ($payment->type === 'PAYMENT' && $payment->source_payment_id) {
                // If canceling the supplier payment, also cancel the parent customer receipt
                if ($payment->sourcePayment) {
                    $paymentsToCancel->push($payment->sourcePayment);
                }
            }

            // Reverse allocations for all affected payments
            foreach ($paymentsToCancel as $p) {
                foreach ($p->allocations as $allocation) {
                    $bill = $allocation->bill_type === 'App\Models\Sales'
                        ? Sales::find($allocation->bill_id)
                        : Purchase::find($allocation->bill_id);

                    if ($bill) {
                        $bill->paid_amount = max(0, $bill->paid_amount - $allocation->amount);
                        
                        // Recalculate remaining amount safely
                        $sumOfReturns = $allocation->bill_type === 'App\Models\Sales'
                            ? (float) \App\Models\SalesReturn::where('original_invoice', $bill->invoice)->sum('net_total')
                            : (float) \App\Models\PurchaseReturn::where('original_invoice', $bill->invoice)->sum('net_total');
                        
                        $bill->remaining_amount = $bill->net_total - $bill->paid_amount - $sumOfReturns;

                        // Restore status based on remaining amount
                        if ($allocation->bill_type === 'App\Models\Sales') {
                            $bill->status = $bill->remaining_amount <= 0 ? 'Paid' : ($bill->paid_amount > 0 ? 'Partial' : 'Unpaid');
                        } else {
                            $bill->status = $bill->remaining_amount <= 0 ? 'Completed' : 'Completed';
                        }
                        $bill->save();
                    }
                }

                // Update cheque status to Canceled
                $p->cheque_status = 'Canceled';
                $p->save();

                // If it's a bank cheque issued by us, cancel it in the chequebook leaf
                if ($p->cheque_id) {
                    \App\Models\Chequebook::where('id', $p->cheque_id)->update(['status' => 'cancelled']);
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Cheque and linked transactions successfully canceled. Invoice balances restored.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to cancel cheque: ' . $e->getMessage());
        }
    }
}
