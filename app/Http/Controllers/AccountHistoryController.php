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
        // For Bank / Cash, transactions are where they are the intermediate paying/receiving account
        $transactions = Payment::where('payment_account_id', $account->id)
            ->with(['account', 'cheque'])
            ->latest('date')
            ->latest('id')
            ->paginate(15);
            
        return response()->json([
            'data' => $transactions->items(),
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
