<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\Chequebook;
use Illuminate\Http\Request;

class AccountHistoryController extends Controller
{
    public function getSales(Request $request, Account $account)
    {
        $sales = Sales::where('customer_id', $account->id)
            ->with(['salesman', 'messageLine'])
            ->latest('date')
            ->latest('id')
            ->paginate(10);
            
        return response()->json([
            'data' => $sales->items(),
            'current_page' => $sales->currentPage(),
            'last_page' => $sales->lastPage(),
            'total' => $sales->total(),
        ]);
    }

    public function getPurchases(Request $request, Account $account)
    {
        $purchases = Purchase::where('supplier_id', $account->id)
            ->with(['supplier', 'messageLine'])
            ->latest('date')
            ->latest('id')
            ->paginate(10);

        return response()->json([
            'data' => $purchases->items(),
            'current_page' => $purchases->currentPage(),
            'last_page' => $purchases->lastPage(),
            'total' => $purchases->total(),
        ]);
    }

    public function getPayments(Request $request, Account $account)
    {
        // This is for clients/suppliers payments ledgers
        $payments = Payment::where('account_id', $account->id)
            ->with(['paymentAccount', 'cheque'])
            ->latest('date')
            ->latest('id')
            ->paginate(10);

        // Fetch unpaid bills
        if ($account->accountType && $account->accountType->name === 'Customers') {
            $unpaidBills = Sales::where('customer_id', $account->id)
                ->where('remaining_amount', '>', 0)
                ->orderBy('date', 'asc')
                ->get(['id', 'date', 'invoice', 'net_total', 'paid_amount', 'remaining_amount']);
        } elseif ($account->accountType && $account->accountType->name === 'Supplier') {
             $unpaidBills = Purchase::where('supplier_id', $account->id)
                ->where('remaining_amount', '>', 0)
                ->orderBy('date', 'asc')
                ->get(['id', 'date', 'invoice', 'net_total', 'paid_amount', 'remaining_amount']);
        } else {
            $unpaidBills = [];
        }

        return response()->json([
            'data' => $payments->items(),
            'unpaid_bills' => $unpaidBills,
            'current_page' => $payments->currentPage(),
            'last_page' => $payments->lastPage(),
            'total' => $payments->total(),
        ]);
    }

    public function getBankStatement(Request $request, Account $account)
    {
        $perPage = 20;
        $page = (int) $request->get('page', 1);

        // For Bank / Cash, transactions are where they are the intermediate paying/receiving account
        $transactions = Payment::where('payment_account_id', $account->id)
            ->with(['account', 'cheque'])
            ->latest('date')
            ->latest('id')
            ->paginate($perPage);

        // Calculate the balance at the start of this page (descending order)
        // We start from current total and subtract/add transactions that appeared in previous pages
        $runningBalance = $account->current_balance;

        if ($page > 1) {
            // Impact of transactions on pages BEFORE this one
            $offset = ($page - 1) * $perPage;
            
            // Replicate current_balance logic exclude cancel
            $previousTransactions = Payment::where('payment_account_id', $account->id)
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
                })
                ->latest('date')
                ->latest('id')
                ->limit($offset)
                ->get(['type', 'amount']);

            foreach ($previousTransactions as $t) {
                if ($t->type === 'RECEIPT') $runningBalance -= $t->amount;
                else $runningBalance += $t->amount;
            }
        }

        // Attach running balance to each item
        $items = collect($transactions->items())->map(function ($item) use (&$runningBalance) {
            $data = $item->toArray();
            $data['running_balance'] = (float)$runningBalance;
            
            // Re-attach relationship data that toArray might have handled differently or if we need specific keys
            $data['account'] = $item->account;

            // For next row (older), we reverse the current transaction ONLY if it is cleared (or is a direct Cash method)
            $isBypassedMethod = !in_array($item->payment_method, ['Cheque', 'Online']);
            $isCleared = $isBypassedMethod || empty($item->cheque_status) || in_array($item->cheque_status, ['Clear', 'Cleared', 'In Hand', 'Distributed']);
            if ($isCleared) {
                if ($item->type === 'RECEIPT') $runningBalance -= (float)$item->amount;
                else $runningBalance += (float)$item->amount;
            }
            return $data;
        });

        return response()->json([
            'data' => $items,
            'current_page' => $transactions->currentPage(),
            'last_page' => $transactions->lastPage(),
            'total' => $transactions->total(),
        ]);
    }

    public function getCheques(Request $request, Account $account)
    {
        $cheques = Chequebook::where('bank_id', $account->id)
            ->where('status', '!=', 'unused')
            ->with('payment.account')
            ->latest('entry_date')
            ->latest('id')
            ->paginate(10);

        $mappedData = collect($cheques->items())->map(function ($cheque) {
            $payment = $cheque->payment;
            return [
                'id' => $cheque->id,
                'cheque_no' => $cheque->cheque_no,
                'type' => $payment ? $payment->type : '-',
                'party_name' => $payment && $payment->account ? $payment->account->title : '-',
                'issue_date' => $payment ? $payment->date : $cheque->entry_date,
                'cheque_date' => $payment ? $payment->cheque_date : null,
                'status' => $cheque->status,
                'amount' => $payment ? $payment->amount : 0,
            ];
        });

        return response()->json([
            'data' => $mappedData,
            'current_page' => $cheques->currentPage(),
            'last_page' => $cheques->lastPage(),
            'total' => $cheques->total(),
        ]);
    }
}
