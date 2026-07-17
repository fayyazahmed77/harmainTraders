<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\Chequebook;
use Illuminate\Http\Request;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AccountHistoryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view accounts'),
        ];
    }
    public function getSales(Request $request, Account $account)
    {
        $sales = Sales::where('customer_id', $account->id)
            ->with(['salesman', 'messageLine'])
            ->latest('date')
            ->latest('id')
            ->paginate(10);

        // Attach return total per sale
        $saleIds = collect($sales->items())->pluck('id');
        $returnTotals = \App\Models\SalesReturn::whereIn('sale_id', $saleIds)
            ->selectRaw('sale_id, SUM(net_total) as total_returned')
            ->groupBy('sale_id')
            ->pluck('total_returned', 'sale_id');

        $items = collect($sales->items())->map(function ($sale) use ($returnTotals) {
            $data = $sale->toArray();
            $data['return_total'] = (float) ($returnTotals[$sale->id] ?? 0);
            return $data;
        });

        return response()->json([
            'data' => $items,
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

        // For Bank / Cash, transactions are where they are the intermediate paying/receiving account OR ledger party
        $transactions = Payment::where(function($q) use ($account) {
                $q->where('payment_account_id', $account->id)
                  ->orWhere('account_id', $account->id);
            })
            ->with(['account', 'paymentAccount', 'cheque'])
            ->latest('date')
            ->latest('id')
            ->paginate($perPage);

        $itemsDesc = $transactions->items();
        $itemsAsc = array_reverse($itemsDesc);
        $oldestItem = $itemsAsc[0] ?? null;

        if ($oldestItem) {
            $olderSum = Payment::where(function($q) use ($account) {
                    $q->where('payment_account_id', $account->id)
                      ->orWhere('account_id', $account->id);
                })
                ->where(function($q) use ($oldestItem) {
                    $q->where('date', '<', $oldestItem->date)
                      ->orWhere(function($sub) use ($oldestItem) {
                          $sub->where('date', '=', $oldestItem->date)
                              ->where('id', '<', $oldestItem->id);
                      });
                })
                ->selectRaw("SUM(
                    CASE 
                        WHEN payment_account_id = ? THEN 
                            CASE 
                                WHEN cheque_status IN ('Canceled', 'Returned', 'Refund') THEN 0
                                WHEN payment_method IN ('Cheque', 'Online') AND (cheque_status IS NULL OR cheque_status NOT IN ('Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal')) THEN 0
                                ELSE CASE WHEN type = 'RECEIPT' THEN amount ELSE -amount END
                            END
                        ELSE 0
                    END +
                    CASE 
                        WHEN account_id = ? THEN 
                            CASE 
                                WHEN cheque_status IN ('Canceled', 'Returned', 'Refund') THEN 0
                                ELSE CASE WHEN type = 'PAYMENT' THEN amount ELSE -amount END
                            END
                        ELSE 0
                    END
                ) as net_sum", [$account->id, $account->id])
                ->value('net_sum') ?? 0;

            $runningBalance = (float)$account->opening_balance + (float)$olderSum;
        } else {
            $runningBalance = (float)$account->opening_balance;
        }

        // Loop forward to compute the running balance and format each item
        $items = [];
        foreach ($itemsAsc as $item) {
            $netFlow = 0.0;

            // Financial payment flow
            if ($item->payment_account_id == $account->id) {
                $status = $item->cheque_status;
                $isNotCanceled = !in_array($status, ['Canceled', 'Returned', 'Refund']);
                $isBypassedMethod = !in_array($item->payment_method, ['Cheque', 'Online']);
                $isClearedStatus = in_array($status, ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                if ($isNotCanceled && ($isBypassedMethod || $isClearedStatus)) {
                    $netFlow += $item->type === 'RECEIPT' ? (float)$item->amount : -(float)$item->amount;
                }
            }

            // Party payment flow
            if ($item->account_id == $account->id) {
                $status = $item->cheque_status;
                $isNotCanceled = !in_array($status, ['Canceled', 'Returned', 'Refund']);
                if ($isNotCanceled) {
                    $netFlow += $item->type === 'PAYMENT' ? (float)$item->amount : -(float)$item->amount;
                }
            }

            $runningBalance += $netFlow;

            $data = $item->toArray();
            $data['running_balance'] = (float)$runningBalance;

            // Swap display properties for UI columns compatibility
            if ($item->account_id == $account->id) {
                $data['account'] = $item->paymentAccount;
                $data['type'] = $item->type === 'RECEIPT' ? 'PAYMENT' : 'RECEIPT';
                if ($data['cheque_status'] === 'Pending' || empty($data['cheque_status']) || $data['cheque_status'] === 'Clear') {
                    $data['cheque_status'] = $item->type === 'RECEIPT' ? 'Withdrawal' : 'Deposit';
                }
            } else {
                $data['account'] = $item->account;
                if ($data['cheque_status'] === 'Pending') {
                    $data['cheque_status'] = 'Clear';
                }
            }

            $items[] = $data;
        }

        // Reverse back to descending order (newest first) for UI
        $items = array_reverse($items);

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
