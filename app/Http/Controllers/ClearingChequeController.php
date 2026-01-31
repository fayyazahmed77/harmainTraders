<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Purchase;
use App\Models\Sales;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ClearingChequeController extends Controller
{
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
                'pending_receipts_amount' => Payment::where('type', 'RECEIPT')->where('payment_method', 'Cheque')->where('cheque_status', 'Pending')->sum('amount'),
                'pending_payments_amount' => Payment::where('type', 'PAYMENT')->where('payment_method', 'Cheque')->where('cheque_status', 'Pending')->sum('amount'),
            ]
        ];

        $query = Payment::with(['account', 'paymentAccount', 'cheque'])
            ->where('payment_method', 'Cheque');

        // Filter by Status
        if ($status === 'Pending') {
            $query->where('cheque_status', 'Pending');
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
                ->where('cheque_status', 'Pending')
                ->whereDate('clear_date', $tomorrow)
                ->sum('amount');

            $dayAfterTomorrowAmount = Payment::where('payment_method', 'Cheque')
                ->where('cheque_status', 'Pending')
                ->whereDate('clear_date', $dayAfterTomorrow)
                ->sum('amount');

            $bankSummaries = Payment::where('payments.payment_method', 'Cheque')
                ->where('payments.cheque_status', 'Pending')
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
            $payment = Payment::with('allocations')->findOrFail($id);

            // Reverse allocations impact on bills
            foreach ($payment->allocations as $allocation) {
                if ($allocation->bill_type === 'App\Models\Sales') {
                    $bill = Sales::find($allocation->bill_id);
                } else {
                    $bill = Purchase::find($allocation->bill_id);
                }

                if ($bill) {
                    $bill->paid_amount -= $allocation->amount;
                    $bill->remaining_amount += $allocation->amount;
                    $bill->save();
                }
            }

            $payment->cheque_status = 'Canceled';
            $payment->save();

            // If it's a bank cheque issued by us, mark it as cancelled in chequebook
            if ($payment->cheque_id) {
                \App\Models\Chequebook::where('id', $payment->cheque_id)->update(['status' => 'cancelled']);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Cheque canceled and bill balances restored.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to cancel cheque: ' . $e->getMessage());
        }
    }
}
