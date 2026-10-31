<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\SalesReturn;
use App\Models\PurchaseReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ReportBuilder
{
    /**
     * Generate Account Ledger with running balance.
     */
    public function accountLedger($accountId, $fromDate = null, $toDate = null, $perPage = 50, $params = [])
    {
        if ($accountId === 'ALL') {
             return [
                'opening_balance' => 0,
                'page_start_balance' => 0,
                'total_debit' => 0,
                'total_credit' => 0,
                'closing_balance' => 0,
                'balance_type' => 'dr',
                'data' => new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage),
                'from_date' => $fromDate,
                'to_date' => $toDate
            ];
        }

        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        // 0. Fetch Account and determine type
        $account = Account::findOrFail($accountId);
        // orientation: 'dr' for Customers (Receivables), 'cr' for Suppliers (Payables)
        $type = strtolower($account->accountType->name ?? '');
        $isCreditNormal = in_array($type, ['supplier', 'capital', 'amanat payable', 'reserve'])
            || in_array((int)$account->type, [6, 9, 17, 18])
            || (bool)($account->purchase ?? false);
        $orientation = $isCreditNormal ? 'cr' : 'dr';

        // 1. Calculate Opening Balance before $fromDate
        $openingBalance = $this->calculateOpeningBalance($accountId, $fromDate, $orientation, $params);

        // 2. Fetch Transactions within range
        $sales = Sales::where('customer_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate]);

        if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
            $sales->where('firm_id', $params['firmId']);
        }
        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $sales->where('salesman_id', $params['salemanId']);
        }
        if (isset($params['remarks']) && trim($params['remarks']) !== '') {
            $sales->where(function($q) use ($params) {
                $q->where('invoice', 'like', "%{$params['remarks']}%")
                  ->orWhere('id', 'like', "%{$params['remarks']}%");
            });
        }
        $sales->selectRaw("'Sale' as type, sales.id, sales.date, sales.invoice as voucher_no, CONCAT('Sale #', COALESCE(sales.invoice, sales.id)) as description, NULL as payment_method, (sales.net_total - sales.extra_discount) as debit, 0 as credit, sales.created_at, NULL as cheque_no, NULL as cheque_date");

        $purchases = Purchase::where('supplier_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate]);

        if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
            $purchases->where('firm_id', $params['firmId']);
        }
        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $purchases->where('salesman_id', $params['salemanId']);
        }
        if (isset($params['remarks']) && trim($params['remarks']) !== '') {
            $purchases->where(function($q) use ($params) {
                $q->where('invoice', 'like', "%{$params['remarks']}%")
                  ->orWhere('id', 'like', "%{$params['remarks']}%");
            });
        }
        $purchases->selectRaw("'Purchase' as type, purchases.id, purchases.date, purchases.invoice as voucher_no, CONCAT('Purchase #', COALESCE(purchases.invoice, purchases.id)) as description, NULL as payment_method, 0 as debit, (purchases.net_total - COALESCE(purchases.extra_discount, 0)) as credit, purchases.created_at, NULL as cheque_no, NULL as cheque_date");

        // Determine which column to query in payments table
        $isParty = in_array((int)$account->type, [3, 6])
            || in_array($type, ['supplier', 'customer', 'customers'])
            || (bool)($account->purchase ?? false)
            || (bool)($account->sale ?? false);

        $isAsset = !$isParty && (
            in_array((int)$account->type, [1, 2, 14])
            || in_array($type, ['cash', 'bank', 'cheque in hand'])
        );

        if ($isAsset) {
            $payments = Payment::where(function($q) use ($accountId) {
                    $q->where('payment_account_id', $accountId)
                      ->orWhere('account_id', $accountId);
                })
                ->whereBetween('payments.date', [$fromDate, $toDate])
                ->where(function($q) {
                    $q->whereNotIn('payments.cheque_status', ['Canceled', 'Cancelled', 'Returned'])
                      ->orWhereNull('payments.cheque_status');
                })
                ->where(function($q) {
                    $q->whereNotIn('payments.payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('payments.cheque_status')
                      ->orWhere('payments.cheque_status', '')
                      ->orWhereIn('payments.cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal', 'Pending']);
                });

            if (isset($params['contraId']) && $params['contraId'] !== 'ALL') {
                $payments->where(function($q) use ($params) {
                    $q->where('account_id', $params['contraId'])
                      ->orWhere('payment_account_id', $params['contraId']);
                });
            }
            if (isset($params['remarks']) && trim($params['remarks']) !== '') {
                $payments->where(function($q) use ($params) {
                    $q->where('payments.remarks', 'like', "%{$params['remarks']}%")
                      ->orWhere('payments.cheque_no', 'like', "%{$params['remarks']}%")
                      ->orWhere('payments.voucher_no', 'like', "%{$params['remarks']}%")
                      ->orWhere('payments.id', 'like', "%{$params['remarks']}%");
                });
            }

            $payments->leftJoin('accounts as party_acc', function($join) use ($accountId) {
                $join->on('party_acc.id', '=', DB::raw("CASE WHEN payments.payment_account_id = {$accountId} THEN payments.account_id ELSE payments.payment_account_id END"));
            });

            $payments->selectRaw("'Payment' as type, payments.id, payments.date, payments.voucher_no as voucher_no,
                CASE 
                    WHEN payments.remarks IS NOT NULL AND TRIM(payments.remarks) != '' 
                    THEN CONCAT(COALESCE(party_acc.title, ''), ' (', payments.remarks, ')')
                    ELSE COALESCE(party_acc.title, 'Payment')
                END as description,
                payments.payment_method,
                CASE 
                    WHEN payments.payment_account_id = {$accountId} THEN 
                        CASE WHEN payments.type = 'RECEIPT' THEN payments.amount ELSE 0 END
                    ELSE 
                        CASE WHEN payments.type = 'PAYMENT' THEN payments.amount ELSE 0 END
                END as debit,
                CASE 
                    WHEN payments.payment_account_id = {$accountId} THEN 
                        CASE WHEN payments.type = 'RECEIPT' THEN 0 ELSE payments.amount END
                    ELSE 
                        CASE WHEN payments.type = 'PAYMENT' THEN 0 ELSE payments.amount END
                END as credit,
                payments.created_at, payments.cheque_no, payments.cheque_date");
        } else {
            $paymentColumn = 'account_id';
            $payments = Payment::where($paymentColumn, $accountId)
                ->whereBetween('payments.date', [$fromDate, $toDate])
                ->where(function($q) {
                    $q->whereNotIn('payments.cheque_status', ['Canceled', 'Cancelled', 'Returned'])
                      ->orWhereNull('payments.cheque_status');
                })
                ->leftJoin('accounts as party_acc', 'party_acc.id', '=', 'payments.payment_account_id');

            if (isset($params['contraId']) && $params['contraId'] !== 'ALL') {
                $payments->where('payments.payment_account_id', $params['contraId']);
            }
            if (isset($params['remarks']) && trim($params['remarks']) !== '') {
                $payments->where(function($q) use ($params) {
                    $q->where('payments.remarks', 'like', "%{$params['remarks']}%")
                      ->orWhere('payments.cheque_no', 'like', "%{$params['remarks']}%")
                      ->orWhere('payments.voucher_no', 'like', "%{$params['remarks']}%")
                      ->orWhere('payments.id', 'like', "%{$params['remarks']}%");
                });
            }

            $payments->selectRaw("'Payment' as type, payments.id, payments.date, payments.voucher_no as voucher_no,
                CASE 
                    WHEN payments.remarks IS NOT NULL AND TRIM(payments.remarks) != '' 
                    THEN CONCAT(COALESCE(party_acc.title, ''), ' (', payments.remarks, ')')
                    ELSE COALESCE(party_acc.title, 'Payment')
                END as description,
                payments.payment_method,
                CASE WHEN payments.type = 'RECEIPT' THEN 0 ELSE (payments.amount + payments.discount) END as debit,
                CASE WHEN payments.type = 'RECEIPT' THEN (payments.amount + payments.discount) ELSE 0 END as credit,
                payments.created_at, payments.cheque_no, payments.cheque_date");
        }

        $salesReturns = SalesReturn::where('customer_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate]);

        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $salesReturns->where('salesman_id', $params['salemanId']);
        }
        if (isset($params['remarks']) && trim($params['remarks']) !== '') {
            $salesReturns->where(function($q) use ($params) {
                $q->where('remarks', 'like', "%{$params['remarks']}%")
                  ->orWhere('invoice', 'like', "%{$params['remarks']}%")
                  ->orWhere('id', 'like', "%{$params['remarks']}%");
            });
        }
        $salesReturns->selectRaw("'Sales Return' as type, id, date, CONCAT('SR-', LPAD(id, 6, '0')) as voucher_no, CONCAT('Return #', id) as description, NULL as payment_method, 0 as debit, (net_total - extra_discount) as credit, created_at, NULL as cheque_no, NULL as cheque_date");

        $purchaseReturns = PurchaseReturn::where('supplier_id', $accountId)
            ->whereBetween('date', [$fromDate, $toDate]);

        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $purchaseReturns->where('salesman_id', $params['salemanId']);
        }
        if (isset($params['remarks']) && trim($params['remarks']) !== '') {
            $purchaseReturns->where(function($q) use ($params) {
                $q->where('remarks', 'like', "%{$params['remarks']}%")
                  ->orWhere('invoice', 'like', "%{$params['remarks']}%")
                  ->orWhere('id', 'like', "%{$params['remarks']}%");
            });
        }
        $purchaseReturns->selectRaw("'Purchase Return' as type, id, date, CONCAT('PR-', LPAD(id, 6, '0')) as voucher_no, CONCAT('Return #', id) as description, NULL as payment_method, (net_total - extra_discount) as debit, 0 as credit, created_at, NULL as cheque_no, NULL as cheque_date");

        $query = $sales->unionAll($purchases)
            ->unionAll($payments)
            ->unionAll($salesReturns)
            ->unionAll($purchaseReturns);

        if (isset($params['sortBy'])) {
            if ($params['sortBy'] === 'ID') {
                $query->orderBy('id', 'asc');
            } elseif ($params['sortBy'] === 'REMARKS') {
                $query->orderBy('description', 'asc');
            }
        }
        $query->orderBy('date', 'asc')->orderBy('created_at', 'asc');

        // Clone unpaginated query BEFORE paginate() mutates it!
        $unpaginatedQuery = clone $query;

        $page = (int)($params['page'] ?? request()->input('page', 1));

        // 4. Calculate Totals for the entire period from unpaginated query
        $totalQuery = DB::table(DB::raw("({$unpaginatedQuery->toSql()}) as transactions"))
            ->mergeBindings($unpaginatedQuery->getQuery());

        $totals = $totalQuery->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')->first();

        $totalDebit = (float)($totals->total_debit ?? 0);
        $totalCredit = (float)($totals->total_credit ?? 0);

        if ($orientation === 'cr') {
            $closingBalance = $openingBalance + $totalCredit - $totalDebit;
        } else {
            $closingBalance = $openingBalance + $totalDebit - $totalCredit;
        }

        // When reporting through today (or no restrictive historical cutoff) with standard account-wide query,
        // synchronize closing balance and opening balance with Account's true real-time current_balance.
        $hasCustomFilters = (isset($params['salemanId']) && $params['salemanId'] !== 'ALL')
            || (isset($params['firmId']) && $params['firmId'] !== 'ALL')
            || (isset($params['contraId']) && $params['contraId'] !== 'ALL')
            || (isset($params['remarks']) && trim($params['remarks']) !== '');

        if (!$hasCustomFilters && $toDate >= date('Y-m-d')) {
            $expectedClosing = $orientation === 'cr'
                ? ($openingBalance + $totalCredit - $totalDebit)
                : ($openingBalance + $totalDebit - $totalCredit);

            if (abs($expectedClosing - (float)$account->current_balance) < 0.05) {
                $closingBalance = (float)$account->current_balance;
            } else {
                $closingBalance = (float)$account->current_balance;
                if ($orientation === 'cr') {
                    $recalculatedOpening = $closingBalance - ($totalCredit - $totalDebit);
                } else {
                    $recalculatedOpening = $closingBalance - ($totalDebit - $totalCredit);
                }
                if (($recalculatedOpening >= 0 && $openingBalance >= 0) || abs($recalculatedOpening - $openingBalance) < 1.0) {
                    $openingBalance = $recalculatedOpening;
                }
            }
        }

        // 5. Calculate Balance at the start of the current page using aligned openingBalance
        $pageStartBalance = $openingBalance;
        if ($page > 1) {
            $offset = ($page - 1) * $perPage;

            $previousRowsSubquery = DB::table(DB::raw("({$unpaginatedQuery->toSql()}) as transactions"))
                ->mergeBindings($unpaginatedQuery->getQuery())
                ->orderBy('date', 'asc')
                ->orderBy('created_at', 'asc')
                ->limit($offset);

            $prevTotals = DB::table(DB::raw("({$previousRowsSubquery->toSql()}) as prev_transactions"))
                ->mergeBindings($previousRowsSubquery)
                ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
                ->first();

            $totalPrevDebit = $prevTotals->total_debit ?? 0;
            $totalPrevCredit = $prevTotals->total_credit ?? 0;

            if ($orientation === 'cr') {
                $pageStartBalance += ($totalPrevCredit - $totalPrevDebit);
            } else {
                $pageStartBalance += ($totalPrevDebit - $totalPrevCredit);
            }
        }

        $transactions = $query->paginate($perPage, ['*'], 'page', $page);

        $runningBalance = $pageStartBalance;
        foreach ($transactions->items() as $item) {
            if ($orientation === 'cr') {
                $runningBalance += ((float)$item->credit - (float)$item->debit);
            } else {
                $runningBalance += ((float)$item->debit - (float)$item->credit);
            }
            $item->balance = (float)$runningBalance;
        }

        return [
            'opening_balance'      => (float)$openingBalance,
            'opening_balance_type' => $orientation === 'cr' ? ($openingBalance >= 0 ? 'CR' : 'DR') : ($openingBalance >= 0 ? 'DR' : 'CR'),
            'page_start_balance'   => (float)$pageStartBalance,
            'total_debit'          => $totalDebit,
            'total_credit'         => $totalCredit,
            'closing_balance'      => (float)$closingBalance,
            'current_balance'      => (float)$account->current_balance,
            'balance_type'         => $orientation,
            'data'                 => $transactions,
            'from_date'            => $fromDate,
            'to_date'              => $toDate,
        ];
    }    public function accountDetailLedger($accountId, $fromDate = null, $toDate = null, $perPage = 50, $params = [])
    {
        // Get the base paginated ledger and totals
        $base = $this->accountLedger($accountId, $fromDate, $toDate, $perPage, $params);
        
        $transactions = $base['data']->getCollection();
        
        $saleIds = [];
        $purchaseIds = [];
        $saleRetIds = [];
        $purchaseRetIds = [];
        $paymentIds = [];
        
        foreach($transactions as $txn) {
            if ($txn->type === 'Sale') $saleIds[] = $txn->id;
            elseif ($txn->type === 'Purchase') $purchaseIds[] = $txn->id;
            elseif ($txn->type === 'Sales Return') $saleRetIds[] = $txn->id;
            elseif ($txn->type === 'Purchase Return') $purchaseRetIds[] = $txn->id;
            elseif ($txn->type === 'Payment') $paymentIds[] = $txn->id;
        }
        
        // Eager load details
        $salesItems = count($saleIds) > 0 ? \App\Models\SalesItem::with('item')->whereIn('sale_id', $saleIds)->get()->groupBy('sale_id') : collect();
        $purchaseItems = count($purchaseIds) > 0 ? \App\Models\PurchaseItem::with('item')->whereIn('purchase_id', $purchaseIds)->get()->groupBy('purchase_id') : collect();
        $salesReturnItems = count($saleRetIds) > 0 ? \App\Models\SalesReturnItem::with('item')->whereIn('sales_return_id', $saleRetIds)->get()->groupBy('sales_return_id') : collect();
        $purchaseReturnItems = count($purchaseRetIds) > 0 ? \App\Models\PurchaseReturnItem::with('item')->whereIn('purchase_return_id', $purchaseRetIds)->get()->groupBy('purchase_return_id') : collect();
        $payments = count($paymentIds) > 0 ? \App\Models\Payment::whereIn('id', $paymentIds)->get()->keyBy('id') : collect();
        
        $enrichedData = [];
        
        foreach($transactions as $txn) {
            $details = collect();
            $voucherNo = $txn->voucher_no ?? $txn->id;
            $remarks = $txn->description;
            
            if ($txn->type === 'Sale') {
                $voucherNo = $txn->voucher_no ?: str_pad($txn->id, 6, '0', STR_PAD_LEFT);
                $details = $salesItems->get($txn->id) ?? collect();
            } elseif ($txn->type === 'Purchase') {
                $voucherNo = $txn->voucher_no ?: str_pad($txn->id, 6, '0', STR_PAD_LEFT);
                $details = $purchaseItems->get($txn->id) ?? collect();
            } elseif ($txn->type === 'Sales Return') {
                $voucherNo = $txn->voucher_no ?: ('SR-' . str_pad($txn->id, 6, '0', STR_PAD_LEFT));
                $details = $salesReturnItems->get($txn->id) ?? collect();
            } elseif ($txn->type === 'Purchase Return') {
                $voucherNo = $txn->voucher_no ?: ('PR-' . str_pad($txn->id, 6, '0', STR_PAD_LEFT));
                $details = $purchaseReturnItems->get($txn->id) ?? collect();
            } elseif ($txn->type === 'Payment') {
                $payment = $payments->get($txn->id);
                if ($payment) {
                    $voucherNo = $payment->voucher_no ?: $txn->voucher_no ?: (($payment->type === 'RECEIPT' ? 'CRV-' : 'CPV-') . $txn->id);
                }
            }
            
            // Map details to a standardized structure
            $mappedDetails = $details->map(function ($item) {
                 return [
                      'description' => $item->item->title ?? '',
                      'qty' => $item->total_pcs ?? 0,
                      'tp' => $item->trade_price ?? 0,
                      'disc' => $item->discount ?? 0,
                      'rate' => ($item->total_pcs ?? 0) > 0 ? round(($item->subtotal ?? 0) / $item->total_pcs, 2) : 0,
                 ];
            });
            
            $txn->voucher_no = $voucherNo;
            $txn->remarks = $remarks;
            $txn->details = $mappedDetails;
            
            $enrichedData[] = $txn;
        }
        
        $base['data']->setCollection(collect($enrichedData));
        return $base;
    }
//   Bank Ledger Report
    public function bankLedger($accountId, $fromDate = null, $toDate = null, $perPage = 50, $params = [])
    {
        if ($accountId === 'ALL' || empty($accountId)) {
            $defaultBank = Account::where('type', 2)
                ->orWhereHas('accountType', fn($q) => $q->where('name', 'Bank'))
                ->orderBy('id', 'asc')
                ->first();
            if ($defaultBank) {
                $accountId = $defaultBank->id;
            } else {
                return [
                    'opening_balance' => 0,
                    'start_bank_balance' => 0,
                    'total_debit' => 0,
                    'total_credit' => 0,
                    'total_cleared_deposits' => 0,
                    'total_cleared_withdrawals' => 0,
                    'total_uncleared_float' => 0,
                    'closing_balance' => 0,
                    'closing_bank_balance' => 0,
                    'balance_type' => 'dr',
                    'data' => new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage),
                    'from_date' => $fromDate,
                    'to_date' => $toDate,
                    'account' => null,
                ];
            }
        }

        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');
        $account = Account::with('accountType')->findOrFail($accountId);

        $signedOB = (float)$account->getSignedOpeningBalance();

        // 1. Calculate Cleared Prior Net before $fromDate
        $priorQuery = Payment::where(function($q) use ($accountId) {
                $q->where('payment_account_id', $accountId)
                  ->orWhere('account_id', $accountId);
            })
            ->whereDate('date', '<', $fromDate)
            ->whereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned', 'Refund']);

        $priorItems = $priorQuery->get();
        $priorClearedNet = 0.0;
        foreach ($priorItems as $p) {
            $status = $p->cheque_status;
            $isBypassed = !in_array($p->payment_method, ['Cheque', 'Online']);
            $isCleared = in_array($status, ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']) || empty($status);

            if ($p->payment_account_id == $accountId) {
                if ($isBypassed || $isCleared) {
                    $priorClearedNet += ($p->type === 'RECEIPT') ? (float)$p->amount : -(float)$p->amount;
                }
            }
            if ($p->account_id == $accountId) {
                if ($isBypassed || $isCleared) {
                    $priorClearedNet += ($p->type === 'PAYMENT') ? (float)$p->amount : -(float)$p->amount;
                }
            }
        }

        $startBankBalance = $signedOB + $priorClearedNet;

        // 2. Fetch All Transactions in date range
        $txQuery = Payment::where(function($q) use ($accountId) {
                $q->where('payment_account_id', $accountId)
                  ->orWhere('account_id', $accountId);
            })
            ->whereBetween('date', [$fromDate, $toDate])
            ->whereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned', 'Refund'])
            ->with(['account', 'paymentAccount']);

        if (isset($params['remarks']) && trim($params['remarks']) !== '') {
            $term = trim($params['remarks']);
            $txQuery->where(function($q) use ($term) {
                $q->where('remarks', 'like', "%{$term}%")
                  ->orWhere('cheque_no', 'like', "%{$term}%")
                  ->orWhere('voucher_no', 'like', "%{$term}%")
                  ->orWhere('id', 'like', "%{$term}%");
            });
        }

        if (isset($params['status']) && in_array(strtolower($params['status']), ['cleared', 'pending'])) {
            $statusFilter = strtolower($params['status']);
            if ($statusFilter === 'cleared') {
                $txQuery->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'Deposit', 'Withdrawal']);
                });
            } elseif ($statusFilter === 'pending') {
                $txQuery->whereIn('payment_method', ['Cheque', 'Online'])
                        ->where(function($q) {
                            $q->whereNull('cheque_status')
                              ->orWhereNotIn('cheque_status', ['Clear', 'Cleared', 'Deposit', 'Withdrawal', 'Canceled', 'Cancelled', 'Returned', 'Refund']);
                        });
            }
        }

        $allTx = $txQuery->orderBy('date', 'asc')->orderBy('id', 'asc')->get();

        // 3. Process each transaction and calculate running balance
        $runningBalance = $startBankBalance;
        $totalClearedDeposits = 0.0;
        $totalClearedWithdrawals = 0.0;
        $totalUnclearedFloat = 0.0;
        $clearedCount = 0;
        $pendingCount = 0;

        $processedRows = [];

        foreach ($allTx as $tx) {
            $status = $tx->cheque_status;
            $method = $tx->payment_method ?? 'Cash';
            $isBypassed = !in_array($method, ['Cheque', 'Online']);
            $isCleared = in_array($status, ['Clear', 'Cleared', 'Deposit', 'Withdrawal']) || (empty($status) && $isBypassed);

            $deposit = 0.0;
            $withdrawal = 0.0;

            if ($tx->payment_account_id == $accountId) {
                if ($tx->type === 'RECEIPT') {
                    $deposit = (float)$tx->amount;
                } else {
                    $withdrawal = (float)$tx->amount;
                }
                $contraParty = $tx->account->title ?? ($tx->remarks ?: 'General Party');
            } else {
                if ($tx->type === 'PAYMENT') {
                    $deposit = (float)$tx->amount;
                } else {
                    $withdrawal = (float)$tx->amount;
                }
                $contraParty = $tx->paymentAccount->title ?? ($tx->remarks ?: 'General Account');
            }

            if ($isCleared) {
                $clearedCount++;
                $totalClearedDeposits += $deposit;
                $totalClearedWithdrawals += $withdrawal;
                $runningBalance += ($deposit - $withdrawal);
            } else {
                $pendingCount++;
                $totalUnclearedFloat += $withdrawal;
            }

            $processedRows[] = [
                'id' => $tx->id,
                'date' => $tx->date,
                'voucher_no' => $tx->voucher_no,
                'type' => $tx->type,
                'method' => $method,
                'description' => $contraParty,
                'contra_party' => $contraParty,
                'cheque_no' => $tx->cheque_no,
                'cheque_date' => $tx->cheque_date,
                'clear_date' => $tx->clear_date,
                'cheque_status' => $status ?: ($isCleared ? 'Clear' : 'Pending'),
                'is_cleared' => $isCleared,
                'impacts_balance' => $isCleared,
                'debit' => $deposit,
                'credit' => $withdrawal,
                'deposit' => $deposit,
                'withdrawal' => $withdrawal,
                'balance' => $runningBalance,
                'running_balance' => $runningBalance,
                'created_at' => $tx->created_at ? $tx->created_at->format('Y-m-d H:i:s') : null,
            ];
        }

        // Pagination
        $page = (int)request()->input('page', 1);
        $totalItems = count($processedRows);
        $offset = ($page - 1) * $perPage;
        $pageItems = array_slice($processedRows, $offset, $perPage);

        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $pageItems,
            $totalItems,
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return [
            'opening_balance' => $startBankBalance,
            'page_start_balance' => $offset > 0 && isset($processedRows[$offset - 1]) ? $processedRows[$offset - 1]['balance'] : $startBankBalance,
            'start_bank_balance' => $startBankBalance,
            'total_debit' => $totalClearedDeposits,
            'total_credit' => $totalClearedWithdrawals,
            'total_cleared_deposits' => $totalClearedDeposits,
            'total_cleared_withdrawals' => $totalClearedWithdrawals,
            'total_uncleared_float' => $totalUnclearedFloat,
            'closing_balance' => $runningBalance,
            'closing_bank_balance' => $runningBalance,
            'balance_type' => $runningBalance >= 0 ? 'dr' : 'cr',
            'data' => $paginator,
            'cleared_count' => $clearedCount,
            'pending_count' => $pendingCount,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'account' => [
                'id' => $account->id,
                'title' => $account->title,
                'code' => $account->code,
                'type' => $account->accountType->name ?? 'Bank',
            ],
        ];
    }

  

    private function calculateBalanceChange($accountId, $fromDate, $toDate, $beforeId = null)
    {
        // Calculate sum of all transactions between fromDate and toDate
        // This is a simplified version that ignores the ID tie-breaking for now

        $sales = Sales::where('customer_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum(DB::raw('net_total - extra_discount'));
        $purchases = Purchase::where('supplier_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');

        $account = Account::with('accountType')->find($accountId);
        if (!$account) {
            return 0;
        }
        $type = strtolower($account->accountType->name ?? '');
        $isAsset = in_array((int)$account->type, [1, 2, 14])
            || in_array($type, ['cash', 'bank', 'cheque in hand'])
            || (bool)($account->cashbank ?? false);
        $paymentColumn = $isAsset ? 'payment_account_id' : 'account_id';

        $paymentsReceived = Payment::where($paymentColumn, $accountId)->whereBetween('date', [$fromDate, $toDate])->where('type', 'RECEIPT')->sum('amount');
        $paymentsPaid = Payment::where($paymentColumn, $accountId)->whereBetween('date', [$fromDate, $toDate])->where('type', 'PAYMENT')->sum('amount');

        $salesReturns = SalesReturn::where('customer_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $purchaseReturns = PurchaseReturn::where('supplier_id', $accountId)->whereBetween('date', [$fromDate, $toDate])->sum('net_total');

        $debit = $sales + $paymentsPaid + $purchaseReturns;
        $credit = $purchases + $paymentsReceived + $salesReturns;

        return $debit - $credit;
    }

    private function calculateOpeningBalance($accountId, $date, $orientation = 'dr', $params = [])
    {
        $account = Account::with('accountType')->find($accountId);
        if (!$account) {
            return 0;
        }
        $manualOpening = $account->getSignedOpeningBalance();
        
        // Sum all transactions before $date
        $salesQuery = Sales::where('customer_id', $accountId)->where('date', '<', $date);
        if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
            $salesQuery->where('firm_id', $params['firmId']);
        }
        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $salesQuery->where('salesman_id', $params['salemanId']);
        }
        $sales = $salesQuery->sum(DB::raw('net_total - extra_discount'));

        $purchasesQuery = Purchase::where('supplier_id', $accountId)->where('date', '<', $date);
        if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
            $purchasesQuery->where('firm_id', $params['firmId']);
        }
        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $purchasesQuery->where('salesman_id', $params['salemanId']);
        }
        $purchases = $purchasesQuery->sum(DB::raw('net_total - COALESCE(extra_discount, 0)'));

        $type = strtolower($account->accountType->name ?? '');
        $isParty = in_array((int)$account->type, [3, 6])
            || in_array($type, ['supplier', 'customer', 'customers'])
            || (bool)($account->purchase ?? false)
            || (bool)($account->sale ?? false);

        $isAsset = !$isParty && (
            in_array((int)$account->type, [1, 2, 14])
            || in_array($type, ['cash', 'bank', 'cheque in hand'])
        );
        $paymentColumn = $isAsset ? 'payment_account_id' : 'account_id';

        $pQuery = Payment::where($paymentColumn, $accountId)
            ->where('date', '<', $date)
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned'])
                  ->orWhereNull('cheque_status');
            });
        if (isset($params['contraId']) && $params['contraId'] !== 'ALL') {
            $otherCol = $isAsset ? 'account_id' : 'payment_account_id';
            $pQuery->where($otherCol, $params['contraId']);
        }

        $salesReturnsQuery = SalesReturn::where('customer_id', $accountId)->where('date', '<', $date);
        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $salesReturnsQuery->where('salesman_id', $params['salemanId']);
        }
        $salesReturns = $salesReturnsQuery->sum(DB::raw('net_total - extra_discount'));

        $purchaseReturnsQuery = PurchaseReturn::where('supplier_id', $accountId)->where('date', '<', $date);
        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $purchaseReturnsQuery->where('salesman_id', $params['salemanId']);
        }
        $purchaseReturns = $purchaseReturnsQuery->sum(DB::raw('net_total - extra_discount'));

        if ($isAsset) {
            $finPayments = Payment::where('payment_account_id', $accountId)
                ->where('date', '<', $date)
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned'])
                      ->orWhereNull('cheque_status');
                })
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                });
            if (isset($params['contraId']) && $params['contraId'] !== 'ALL') {
                $finPayments->where('account_id', $params['contraId']);
            }
            $finReceiving = (float)$finPayments->clone()->where('type', 'RECEIPT')->sum('amount');
            $finPayment   = (float)$finPayments->clone()->where('type', 'PAYMENT')->sum('amount');

            $partyPayments = Payment::where('account_id', $accountId)
                ->where('date', '<', $date)
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned'])
                      ->orWhereNull('cheque_status');
                })
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                });
            if (isset($params['contraId']) && $params['contraId'] !== 'ALL') {
                $partyPayments->where('payment_account_id', $params['contraId']);
            }
            $partyReceiving = (float)$partyPayments->clone()->where('type', 'PAYMENT')->sum('amount');
            $partyPayment   = (float)$partyPayments->clone()->where('type', 'RECEIPT')->sum('amount');

            $debit  = $finReceiving + $partyReceiving;
            $credit = $finPayment   + $partyPayment;
        } else {
            $debit = $sales + $pQuery->clone()->where('type', 'PAYMENT')->sum(DB::raw('amount + discount')) + $purchaseReturns;
            $credit = $purchases + $pQuery->clone()->where('type', 'RECEIPT')->sum(DB::raw('amount + discount')) + $salesReturns;
        }

        if ($orientation === 'cr') {
            return $manualOpening + ($credit - $debit);
        } else {
            return $manualOpening + ($debit - $credit);
        }
    }

    /**
     * Apply standard filters to an Account query.
     */
    public function applyAccountFilters($query, $params)
    {
        // Cascading geo filter: subarea > area > city > province (most specific wins)
        $subareaId = $params['subareaId'] ?? $params['subarea_id'] ?? null;
        $areaId    = $params['areaId']    ?? $params['area_id']    ?? null;
        $cityId    = $params['cityId']    ?? null;
        $provinceId = $params['provinceId'] ?? null;

        if ($subareaId && $subareaId !== 'ALL') {
            $query->where('subarea_id', $subareaId);
        } elseif ($areaId && $areaId !== 'ALL') {
            $query->where('area_id', $areaId);
        } elseif ($cityId && $cityId !== 'ALL') {
            $query->where('city_id', $cityId);
        } elseif ($provinceId && $provinceId !== 'ALL') {
            $query->where('province_id', $provinceId);
        }

        if (isset($params['salemanId']) && $params['salemanId'] !== 'ALL') {
            $query->where('saleman_id', $params['salemanId']);
        } elseif (isset($params['saleman_id']) && $params['saleman_id'] !== 'ALL') {
            $query->where('saleman_id', $params['saleman_id']);
        }

        if (isset($params['type']) && $params['type'] !== 'ALL') {
            $query->where('type', $params['type']);
        }

        if (isset($params['noteHead']) && $params['noteHead'] !== 'ALL') {
            $query->where('note_head', $params['noteHead']);
        }

        if (isset($params['nature']) && $params['nature'] !== 'ALL') {
            $query->where('category', $params['nature']);
        } elseif (isset($params['category']) && $params['category'] !== 'ALL') {
            $query->where('category', $params['category']);
        }

        return $query;
    }

    // Placeholder for other methods
    public function stockStatus(Request $request)
    {
        // 1. Get all items
        // 2. For each item, calculate stock
        // Optimized approach: Group by item_id in DB

        $purchased = DB::table('purchase_items')
            ->select('item_id', DB::raw('SUM(total_pcs) as total_purchased'))
            ->groupBy('item_id');

        $sold = DB::table('sales_items')
            ->select('item_id', DB::raw('SUM(total_pcs) as total_sold'))
            ->groupBy('item_id');

        $purchaseReturned = DB::table('purchase_return_items')
            ->select('item_id', DB::raw('SUM(total_pcs) as total_purchase_returned'))
            ->groupBy('item_id');

        $salesReturned = DB::table('sales_return_items')
            ->select('item_id', DB::raw('SUM(total_pcs) as total_sales_returned'))
            ->groupBy('item_id');

        $items = DB::table('items')
            ->leftJoinSub($purchased, 'p', 'items.id', '=', 'p.item_id')
            ->leftJoinSub($sold, 's', 'items.id', '=', 's.item_id')
            ->leftJoinSub($purchaseReturned, 'pr', 'items.id', '=', 'pr.item_id')
            ->leftJoinSub($salesReturned, 'sr', 'items.id', '=', 'sr.item_id')
            ->leftJoin('item_categories', 'item_categories.id', '=', 'items.category') // ⬅ Join to get category name
            ->select(
                'items.id',
                'items.title as name',
                'items.code',
                'item_categories.name as category',
                'items.reorder_level',
                'items.packing_qty',
                'items.trade_price', // Added trade_price
                DB::raw('COALESCE(p.total_purchased, 0) as purchased'),
                DB::raw('COALESCE(s.total_sold, 0) as sold'),
                DB::raw('COALESCE(pr.total_purchase_returned, 0) as purchase_returned'),
                DB::raw('COALESCE(sr.total_sales_returned, 0) as sales_returned')
            )
            ->get();


        // Calculate Net Stock in PHP
        $data = $items->map(function ($item) {
            $netStock = ($item->purchased - $item->purchase_returned) - ($item->sold - $item->sales_returned);

            $packingQty = $item->packing_qty > 0 ? $item->packing_qty : 1;
            $cartons = floor($netStock / $packingQty);
            $loose = $netStock % $packingQty;

            // Assuming trade_price is per piece/unit
            $pricePerPiece = $item->trade_price;
            $pricePerCarton = $pricePerPiece * $packingQty;

            return [
                'id' => $item->id,
                'name' => $item->name,
                'code' => $item->code,
                'category' => $item->category,
                'current_stock' => $netStock,
                'reorder_level' => $item->reorder_level,
                'unit' => 'pcs',
                'packing_qty' => $packingQty,
                'stock_cartons' => $cartons,
                'stock_loose' => $loose,
                'price_carton' => $pricePerCarton,
                'price_loose' => $pricePerPiece,
            ];
        });

        return $data;
    }

    public function stockLedger($itemId, $fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        // Opening Stock Calculation
        $opening = $this->calculateStockOpening($itemId, $fromDate);

        // Transactions
        $purchases = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->where('purchase_items.item_id', $itemId)
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->selectRaw("'Purchase' as type, purchases.date, purchases.id as ref_id, purchase_items.total_pcs as qty_in, 0 as qty_out, purchase_items.subtotal as amount, purchases.created_at");

        $sales = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->where('sales_items.item_id', $itemId)
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->selectRaw("'Sale' as type, sales.date, sales.id as ref_id, 0 as qty_in, sales_items.total_pcs as qty_out, sales_items.subtotal as amount, sales.created_at");

        $purchaseReturns = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->where('purchase_return_items.item_id', $itemId)
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate])
            ->selectRaw("'Purchase Return' as type, purchase_returns.date, purchase_returns.id as ref_id, 0 as qty_in, purchase_return_items.total_pcs as qty_out, purchase_return_items.subtotal as amount, purchase_returns.created_at");

        $salesReturns = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->where('sales_return_items.item_id', $itemId)
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->selectRaw("'Sales Return' as type, sales_returns.date, sales_returns.id as ref_id, sales_return_items.total_pcs as qty_in, 0 as qty_out, sales_return_items.subtotal as amount, sales_returns.created_at");

        $query = $purchases->unionAll($sales)
            ->unionAll($purchaseReturns)
            ->unionAll($salesReturns)
            ->orderBy('date')
            ->orderBy('created_at');

        $transactions = $query->get();

        // Calculate Summaries
        $totalPurchaseQty = $transactions->where('type', 'Purchase')->sum('qty_in');
        $totalPurchaseValue = $transactions->where('type', 'Purchase')->sum('amount');

        $totalSaleQty = $transactions->where('type', 'Sale')->sum('qty_out');
        $totalSaleValue = $transactions->where('type', 'Sale')->sum('amount');

        // Calculate Average Cost (Weighted Average)
        $avgCost = $totalPurchaseQty > 0 ? $totalPurchaseValue / $totalPurchaseQty : 0;

        // If no purchases in period, try to get from item master or last purchase (simplified: use item trade_price)
        if ($avgCost == 0) {
            $item = DB::table('items')->where('id', $itemId)->first();
            $avgCost = $item ? $item->trade_price : 0;
        }

        // Calculate Profit
        // Profit = Sales Revenue - COGS
        // COGS = Sales Qty * Avg Cost
        $cogs = $totalSaleQty * $avgCost;
        $profit = $totalSaleValue - $cogs;

        return [
            'opening_stock' => $opening,
            'transactions' => $transactions,
            'summary' => [
                'total_purchase_qty' => $totalPurchaseQty,
                'total_purchase_value' => $totalPurchaseValue,
                'total_sale_qty' => $totalSaleQty,
                'total_sale_value' => $totalSaleValue,
                'avg_cost' => $avgCost,
                'profit' => $profit
            ],
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    private function calculateStockOpening($itemId, $date)
    {
        $purchased = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->where('item_id', $itemId)->where('date', '<', $date)->sum('total_pcs');

        $sold = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->where('item_id', $itemId)->where('date', '<', $date)->sum('total_pcs');

        $pRet = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->where('item_id', $itemId)->where('date', '<', $date)->sum('total_pcs');

        $sRet = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->where('item_id', $itemId)->where('date', '<', $date)->sum('total_pcs');

        return ($purchased - $pRet) - ($sold - $sRet);
    }

    public function profit(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');

        // 1. Fetch Sales Items with Item Cost (Trade Price from Items table)
        // Note: This assumes items.trade_price is the Cost Price.
        // Ideally, we should store cost_price in sales_items at time of sale for accuracy.

        $salesData = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'sales.date',
                'items.title as item_name',
                'sales_items.total_pcs',
                'sales_items.subtotal as revenue', // Selling Price * Qty - Discount
                DB::raw('(sales_items.total_pcs * items.trade_price) as cogs') // Cost * Qty
            )
            ->get();

        // 2. Calculate Totals
        $totalRevenue = $salesData->sum('revenue');
        $totalCOGS = $salesData->sum('cogs');
        $netProfit = $totalRevenue - $totalCOGS;

        // 3. Prepare Trend Data (Group by Date)
        $trend = $salesData->groupBy('date')->map(function ($group, $date) {
            $rev = $group->sum('revenue');
            $cost = $group->sum('cogs');
            return [
                'date' => $date,
                'revenue' => $rev,
                'cogs' => $cost,
                'profit' => $rev - $cost
            ];
        })->values()->sortBy('date');

        // 4. Top Profitable Items
        $topItems = $salesData->groupBy('item_name')->map(function ($group, $name) {
            $rev = $group->sum('revenue');
            $cost = $group->sum('cogs');
            return [
                'name' => $name,
                'profit' => $rev - $cost,
                'revenue' => $rev
            ];
        })->sortByDesc('profit')->take(10)->values();

        return [
            'summary' => [
                'revenue' => $totalRevenue,
                'cogs' => $totalCOGS,
                'profit' => $netProfit,
                'margin' => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0
            ],
            'trend' => $trend,
            'top_items' => $topItems,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function audit(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $userId = $request->input('user_id');
        $module = $request->input('module');
        $action = $request->input('action');

        $query = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
            ->whereBetween('audit_logs.created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->select(
                'audit_logs.*',
                'users.name as user_name'
            );

        if ($userId) {
            $query->where('audit_logs.user_id', $userId);
        }

        if ($module) {
            $query->where('audit_logs.module', $module);
        }

        if ($action) {
            $query->where('audit_logs.action', $action);
        }

        $logs = $query->orderBy('audit_logs.created_at', 'desc')->get();

        // Activity by module
        $activityByModule = DB::table('audit_logs')
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->select('module', DB::raw('COUNT(*) as count'))
            ->groupBy('module')
            ->get();

        // Activity by action
        $activityByAction = DB::table('audit_logs')
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->select('action', DB::raw('COUNT(*) as count'))
            ->groupBy('action')
            ->get();

        // Daily activity trend
        $dailyActivity = DB::table('audit_logs')
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'logs' => $logs,
            'activity_by_module' => $activityByModule,
            'activity_by_action' => $activityByAction,
            'daily_activity' => $dailyActivity,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function purchaseReport(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $supplierId = $request->input('supplier_id');

        $query = DB::table('purchases')
            ->leftJoin('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select(
                'purchases.*',
                'accounts.title as supplier_name'
            );

        if ($supplierId) {
            $query->where('purchases.supplier_id', $supplierId);
        }

        $purchases = $query->orderBy('purchases.date', 'desc')->get();

        // Summary calculations
        $totalPurchases = $purchases->sum('net_total');
        $totalItems = $purchases->sum('no_of_items');
        $supplierCount = $purchases->unique('supplier_id')->count();
        $averagePurchase = $purchases->count() > 0 ? $totalPurchases / $purchases->count() : 0;

        // Daily trend
        $dailyTrend = DB::table('purchases')
            ->whereBetween('date', [$fromDate, $toDate])
            ->when($supplierId, function ($q) use ($supplierId) {
                return $q->where('supplier_id', $supplierId);
            })
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('SUM(net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top suppliers
        $topSuppliers = DB::table('purchases')
            ->join('accounts', 'purchases.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->select(
                'accounts.title as name',
                DB::raw('SUM(purchases.net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_purchases' => $totalPurchases,
                'total_items' => $totalItems,
                'supplier_count' => $supplierCount,
                'average_purchase' => $averagePurchase,
                'purchase_count' => $purchases->count()
            ],
            'daily_trend' => $dailyTrend,
            'top_suppliers' => $topSuppliers,
            'purchases' => $purchases,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function purchaseReturnReport(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $supplierId = $request->input('supplier_id');

        $query = DB::table('purchase_returns')
            ->leftJoin('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate])
            ->select(
                'purchase_returns.*',
                'accounts.title as supplier_name'
            );

        if ($supplierId) {
            $query->where('purchase_returns.supplier_id', $supplierId);
        }

        $returns = $query->orderBy('purchase_returns.date', 'desc')->get();

        // Summary calculations
        $totalReturns = $returns->sum('net_total');
        $totalItems = $returns->sum('no_of_items');
        $supplierCount = $returns->unique('supplier_id')->count();
        $averageReturn = $returns->count() > 0 ? $totalReturns / $returns->count() : 0;

        // Daily trend
        $dailyTrend = DB::table('purchase_returns')
            ->whereBetween('date', [$fromDate, $toDate])
            ->when($supplierId, function ($q) use ($supplierId) {
                return $q->where('supplier_id', $supplierId);
            })
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('SUM(net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top suppliers by returns
        $topSuppliers = DB::table('purchase_returns')
            ->join('accounts', 'purchase_returns.supplier_id', '=', 'accounts.id')
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate])
            ->select(
                'accounts.title as name',
                DB::raw('SUM(purchase_returns.net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_returns' => $totalReturns,
                'total_items' => $totalItems,
                'supplier_count' => $supplierCount,
                'average_return' => $averageReturn,
                'return_count' => $returns->count()
            ],
            'daily_trend' => $dailyTrend,
            'top_suppliers' => $topSuppliers,
            'returns' => $returns,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function salesReport(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $customerId = $request->input('customer_id');

        $query = DB::table('sales')
            ->leftJoin('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'sales.*',
                'accounts.title as customer_name'
            );

        if ($customerId) {
            $query->where('sales.customer_id', $customerId);
        }

        $sales = $query->orderBy('sales.date', 'desc')->get();

        // Summary calculations
        $totalSales = $sales->sum('net_total');
        $totalItems = $sales->sum('no_of_items');
        $customerCount = $sales->unique('customer_id')->count();
        $averageSale = $sales->count() > 0 ? $totalSales / $sales->count() : 0;

        // Daily trend
        $dailyTrend = DB::table('sales')
            ->whereBetween('date', [$fromDate, $toDate])
            ->when($customerId, function ($q) use ($customerId) {
                return $q->where('customer_id', $customerId);
            })
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('SUM(net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top customers
        $topCustomers = DB::table('sales')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->select(
                'accounts.title as name',
                DB::raw('SUM(sales.net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_sales' => $totalSales,
                'total_items' => $totalItems,
                'customer_count' => $customerCount,
                'average_sale' => $averageSale,
                'sale_count' => $sales->count()
            ],
            'daily_trend' => $dailyTrend,
            'top_customers' => $topCustomers,
            'sales' => $sales,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function salesReturnReport(Request $request)
    {
        $fromDate = $request->input('from') ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $request->input('to') ?? date('Y-m-d');
        $customerId = $request->input('customer_id');

        $query = DB::table('sales_returns')
            ->leftJoin('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->select(
                'sales_returns.*',
                'accounts.title as customer_name'
            );

        if ($customerId) {
            $query->where('sales_returns.customer_id', $customerId);
        }

        $returns = $query->orderBy('sales_returns.date', 'desc')->get();

        // Summary calculations
        $totalReturns = $returns->sum('net_total');
        $totalItems = $returns->sum('no_of_items');
        $customerCount = $returns->unique('customer_id')->count();
        $averageReturn = $returns->count() > 0 ? $totalReturns / $returns->count() : 0;

        // Daily trend
        $dailyTrend = DB::table('sales_returns')
            ->whereBetween('date', [$fromDate, $toDate])
            ->when($customerId, function ($q) use ($customerId) {
                return $q->where('customer_id', $customerId);
            })
            ->select(
                DB::raw('DATE(date) as date'),
                DB::raw('SUM(net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top customers by returns
        $topCustomers = DB::table('sales_returns')
            ->join('accounts', 'sales_returns.customer_id', '=', 'accounts.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->select(
                'accounts.title as name',
                DB::raw('SUM(sales_returns.net_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('accounts.id', 'accounts.title')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
        return [
            'summary' => [
                'total_returns' => $totalReturns,
                'total_items' => $totalItems,
                'customer_count' => $customerCount,
                'average_return' => $averageReturn,
                'return_count' => $returns->count()
            ],
            'daily_trend' => $dailyTrend,
            'top_customers' => $topCustomers,
            'returns' => $returns,
            'from' => $fromDate,
            'to' => $toDate
        ];
    }

    public function accountAging($accountId = 'ALL', $toDate = null, $filters = [])
    {
        $toDate = $toDate ?? date('Y-m-d');
        
        $query = Account::select('accounts.id', 'accounts.title as party_name', 'accounts.type as type_id', 'accounts.sale', 'accounts.purchase')
            ->leftJoin('account_types', 'accounts.type', '=', 'account_types.id')
            ->addSelect('account_types.name as account_type')
            ->where(function($q) {
                $q->where('accounts.sale', 1)->orWhere('accounts.purchase', 1);
            });

        if ($accountId !== 'ALL') {
            $query->where('accounts.id', $accountId);
        }

        $this->applyAccountFilters($query, $filters);

        $accounts = $query->get();

        $data = $accounts->map(function ($account) use ($toDate, $filters) {
            // Determine the orientation (Customer=dr, Supplier=cr) based on account type
            $accType = strtolower($account->accountType->name ?? '');
            $isCrNormal = in_array($accType, ['supplier', 'capital', 'amanat payable', 'reserve'])
                || in_array((int)$account->type, [6, 9, 17, 18]);
            $orientation = $isCrNormal ? 'cr' : 'dr';
            
            $netBalance = $this->calculateOpeningBalance($account->id, date('Y-m-d', strtotime($toDate . ' +1 day')), $orientation, $filters);

            // Initial bucket values
            $buckets = [
                'days_01_30' => 0,
                'days_31_60' => 0,
                'days_61_90' => 0,
                'days_91_120' => 0,
                'days_121_150' => 0,
                'days_151_180_plus' => 0,
            ];

            // If trial balance is negative (credit for customer, debit for supplier), aging is 0
            if ($netBalance <= 0) {
                 return array_merge([
                    'party_name' => $account->party_name, 
                    'account_type' => $account->account_type ?? 'Uncategorized',
                    'total' => $netBalance, 
                    'trial_balance' => $netBalance
                 ], $buckets);
            }

            // Fetch transactions for aging
            $transactions = DB::table(function ($q) use ($account, $toDate, $filters) {
                $salesQuery = DB::table('sales')
                    ->where('customer_id', $account->id)
                    ->where('date', '<=', $toDate);
                if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
                    $salesQuery->where('firm_id', $filters['firmId']);
                }
                if (isset($filters['salemanId']) && $filters['salemanId'] !== 'ALL') {
                    $salesQuery->where('salesman_id', $filters['salemanId']);
                }
                $salesQuery->select('date', DB::raw('(net_total - extra_discount) as debit'), DB::raw('0 as credit'));

                $purchasesQuery = DB::table('purchases')
                    ->where('supplier_id', $account->id)
                    ->where('date', '<=', $toDate);
                if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
                    $purchasesQuery->where('firm_id', $filters['firmId']);
                }
                if (isset($filters['salemanId']) && $filters['salemanId'] !== 'ALL') {
                    $purchasesQuery->where('salesman_id', $filters['salemanId']);
                }
                $purchasesQuery->select('date', DB::raw('0 as debit'), 'net_total as credit');

                $isAsset = in_array($account->type_id, [1, 2, 14]);
                $paymentColumn = $isAsset ? 'payment_account_id' : 'account_id';
                $paymentsQuery = DB::table('payments')
                    ->where($paymentColumn, $account->id)
                    ->where('date', '<=', $toDate)
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned'])
                          ->orWhereNull('cheque_status');
                    });
                if (isset($filters['contraId']) && $filters['contraId'] !== 'ALL') {
                    $otherCol = $isAsset ? 'account_id' : 'payment_account_id';
                    $paymentsQuery->where($otherCol, $filters['contraId']);
                }
                if ($isAsset) {
                    $paymentsQuery->where(function($subQ) {
                        $subQ->whereNotIn('payment_method', ['Cheque', 'Online'])
                             ->orWhereNull('cheque_status')
                             ->orWhere('cheque_status', '')
                             ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
                    });
                    $paymentsQuery->select('date', DB::raw('CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END as debit'), DB::raw('CASE WHEN type = "RECEIPT" THEN 0 ELSE amount END as credit'));
                } else {
                    $paymentsQuery->select('date', DB::raw('CASE WHEN type = "RECEIPT" THEN 0 ELSE (amount + discount) END as debit'), DB::raw('CASE WHEN type = "RECEIPT" THEN (amount + discount) ELSE 0 END as credit'));
                }

                $salesReturnsQuery = DB::table('sales_returns')
                    ->where('customer_id', $account->id)
                    ->where('date', '<=', $toDate);
                if (isset($filters['salemanId']) && $filters['salemanId'] !== 'ALL') {
                    $salesReturnsQuery->where('salesman_id', $filters['salemanId']);
                }
                $salesReturnsQuery->select('date', DB::raw('0 as debit'), 'net_total as credit');

                $purchaseReturnsQuery = DB::table('purchase_returns')
                    ->where('supplier_id', $account->id)
                    ->where('date', '<=', $toDate);
                if (isset($filters['salemanId']) && $filters['salemanId'] !== 'ALL') {
                    $purchaseReturnsQuery->where('salesman_id', $filters['salemanId']);
                }
                $purchaseReturnsQuery->select('date', 'net_total as debit', DB::raw('0 as credit'));

                $subQuery = $salesQuery->unionAll($purchasesQuery)
                                     ->unionAll($paymentsQuery)
                                     ->unionAll($salesReturnsQuery)
                                     ->unionAll($purchaseReturnsQuery);

                $q->from(DB::raw('(' . $subQuery->toSql() . ') as temp_union'))
                  ->mergeBindings($subQuery);
            }, 'temp')
            ->orderBy('date', 'desc')
            ->get();

            $remainingBalance = abs($netBalance);

            foreach ($transactions as $tx) {
                if ($remainingBalance <= 0) break;

                // For aging, we only care about the transactions that ADD to the balance type
                // Customer (dr): only Sales/Returns that increase balance
                $amt = ($orientation === 'dr') ? ($tx->debit - $tx->credit) : ($tx->credit - $tx->debit);
                
                if ($amt <= 0) continue;

                $days = (strtotime($toDate) - strtotime($tx->date)) / (60 * 60 * 24);
                $applicable = min($remainingBalance, $amt);

                if ($days <= 30) $buckets['days_01_30'] += $applicable;
                elseif ($days <= 60) $buckets['days_31_60'] += $applicable;
                elseif ($days <= 90) $buckets['days_61_90'] += $applicable;
                elseif ($days <= 120) $buckets['days_91_120'] += $applicable;
                elseif ($days <= 150) $buckets['days_121_150'] += $applicable;
                else $buckets['days_151_180_plus'] += $applicable;

                $remainingBalance -= $applicable;
            }

            // If there's still balance left but no transactions found (or very old opening balance), put it in the oldest bucket
            if ($remainingBalance > 0) {
                $buckets['days_151_180_plus'] += $remainingBalance;
            }

            return array_merge([
                'party_name' => $account->party_name,
                'account_type' => $account->account_type ?? 'Uncategorized',
                'total' => $netBalance,
                'trial_balance' => $netBalance
            ], $buckets);
        });

        return $data->values();
    }

    public function dueBills($accountId = 'ALL', $toDate = null, $filters = [])
    {
        if (is_array($accountId)) {
            $accountId = $accountId['value'] ?? $accountId['id'] ?? $accountId['account_id'] ?? 'ALL';
        }
        if (($accountId === 'ALL' || empty($accountId)) && !empty($filters['account_id'])) {
            $accountId = is_array($filters['account_id']) ? ($filters['account_id']['value'] ?? $filters['account_id']['id'] ?? 'ALL') : $filters['account_id'];
        }
        $toDate = $toDate ?? date('Y-m-d');

        // 1. Fetch Sales (Customer Receivables)
        $salesQuery = Sales::with(['customer' => function($q) {
                $q->select('id', 'title', 'aging_days', 'credit_limit', 'purchase', 'sale', 'type', 'opening_date');
            }])
            ->where('remaining_amount', '>', 0.005);
            
        if ($accountId !== 'ALL' && !empty($accountId)) {
            $salesQuery->where('customer_id', $accountId);
        }
        if (!empty($toDate)) {
            $salesQuery->whereDate('date', '<=', $toDate);
        }
        if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
            $salesQuery->where('firm_id', $filters['firmId']);
        }
        $salesQuery->whereHas('customer', function($q) use ($filters) {
            $this->applyAccountFilters($q, $filters);
        });
        
        $sales = $salesQuery->orderBy('date', 'asc')->get();

        $saleBills = $sales->map(function($sale) use ($toDate) {
            $agingDays = (int)($sale->customer->aging_days ?? 0);
            $dueDate = \Carbon\Carbon::parse($sale->date)->addDays($agingDays);
            $asOn = \Carbon\Carbon::parse($toDate);
            $days = (int) $dueDate->diffInDays($asOn, false);

            return [
                'date' => $sale->date,
                'voucher_no' => str_pad($sale->invoice ?? $sale->id, 6, "0", STR_PAD_LEFT),
                'party_name' => $sale->customer->title ?? 'Unknown',
                'party_id' => $sale->customer_id,
                'customer_id' => $sale->customer_id,
                'supplier_id' => $sale->customer_id,
                'type' => $sale->type ?? 'CREDIT',
                'bill_type' => 'receivable',
                'due_date' => $dueDate->format('Y-m-d'),
                'days' => $days,
                'bill_amt' => (float)$sale->net_total - (float)$sale->extra_discount,
                'paid' => (float)$sale->paid_amount,
                'remaining' => (float)$sale->remaining_amount,
                'credit_days' => $agingDays,
                'credit_limit' => (float)($sale->customer->credit_limit ?? 0),
                'is_opening_balance' => false,
                'is_supplier' => false,
            ];
        });

        // 2. Sales Returns
        $returnQuery = SalesReturn::with(['customer' => function($q) {
                $q->select('id', 'title', 'aging_days', 'credit_limit', 'purchase', 'sale', 'type', 'opening_date');
            }])
            ->where('remaining_amount', '>', 0.005);

        if ($accountId !== 'ALL' && !empty($accountId)) {
            $returnQuery->where('customer_id', $accountId);
        }
        if (!empty($toDate)) {
            $returnQuery->whereDate('date', '<=', $toDate);
        }
        if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
            $returnQuery->where('firm_id', $filters['firmId']);
        }
        $returnQuery->whereHas('customer', function($q) use ($filters) {
            $this->applyAccountFilters($q, $filters);
        });

        $salesReturns = $returnQuery->orderBy('date', 'asc')->get();

        $returnBills = $salesReturns->map(function($return) use ($toDate) {
            $agingDays = (int)($return->customer->aging_days ?? 0);
            $dueDate = \Carbon\Carbon::parse($return->date);
            $asOn = \Carbon\Carbon::parse($toDate);
            $days = (int) $dueDate->diffInDays($asOn, false);

            $netReturn = (float)$return->net_total - (float)$return->extra_discount;
            $remReturn = (float)$return->remaining_amount;

            return [
                'date' => $return->date,
                'voucher_no' => str_pad($return->invoice ?? $return->id, 6, "0", STR_PAD_LEFT),
                'party_name' => $return->customer->title ?? 'Unknown',
                'party_id' => $return->customer_id,
                'customer_id' => $return->customer_id,
                'supplier_id' => $return->customer_id,
                'type' => 'RETURN',
                'bill_type' => 'receivable',
                'due_date' => $dueDate->format('Y-m-d'),
                'days' => $days,
                'bill_amt' => -$netReturn,
                'paid' => -(float)$return->paid_amount,
                'remaining' => -$remReturn,
                'credit_days' => $agingDays,
                'credit_limit' => (float)($return->customer->credit_limit ?? 0),
                'is_opening_balance' => false,
                'is_supplier' => false,
            ];
        });

        // 3. Candidate Customer Accounts
        $partyIdsFromBills = $saleBills->pluck('customer_id')->concat($returnBills->pluck('customer_id'))->unique()->filter()->values()->all();

        $accountQuery = Account::with('accountType');
        if ($accountId !== 'ALL' && !empty($accountId)) {
            $accountQuery->where('id', $accountId);
        } else {
            $receiptPartyIds = Payment::whereIn('type', ['PAYMENT', 'RECEIPT'])
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })
                ->whereNotNull('account_id')
                ->distinct()
                ->pluck('account_id')
                ->toArray();
            $relevantPartyIds = array_unique(array_merge($partyIdsFromBills, $receiptPartyIds));

            $accountQuery->where(function($q) use ($relevantPartyIds) {
                if (!empty($relevantPartyIds)) {
                    $q->whereIn('id', $relevantPartyIds);
                }
                $q->orWhere(function($subQ) {
                    $subQ->whereNotNull('opening_balance')->where('opening_balance', '!=', 0)
                        ->where(function($sQ) {
                            $sQ->where('sale', 1)
                               ->orWhere('type', 3)
                               ->orWhereHas('accountType', fn($at) => $at->where('name', 'Customer'));
                        });
                });
            })->where(function($sQ) {
                $sQ->where('sale', 1)
                   ->orWhere('type', 3)
                   ->orWhereHas('accountType', fn($at) => $at->where('name', 'Customer'));
            });
        }
        $this->applyAccountFilters($accountQuery, $filters);
        $accounts = $accountQuery->get()->keyBy('id');

        // Preload real-time bulk balances efficiently
        PaymentAccountingService::attachBulkBalances($accounts);

        // 4. Fetch Contra Purchases & Purchase Returns for these customer accounts
        $customerAccountIds = $accounts->pluck('id')->all();
        $purchaseBills = collect();
        $purchaseReturnBills = collect();

        if (!empty($customerAccountIds)) {
            $purchaseQuery = Purchase::with(['supplier' => function($q) {
                    $q->select('id', 'title', 'aging_days', 'credit_limit', 'purchase', 'sale', 'type', 'opening_date');
                }])
                ->where('remaining_amount', '>', 0.005)
                ->whereIn('supplier_id', $customerAccountIds);
            if (!empty($toDate)) {
                $purchaseQuery->whereDate('date', '<=', $toDate);
            }
            if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
                $purchaseQuery->where('firm_id', $filters['firmId']);
            }
            $purchases = $purchaseQuery->orderBy('date', 'asc')->get();

            $purchaseBills = $purchases->map(function($purchase) use ($toDate) {
                $supplier = $purchase->supplier;
                $agingDays = (int)($supplier->aging_days ?? 0);
                $dueDate = \Carbon\Carbon::parse($purchase->date)->addDays($agingDays);
                $asOn = \Carbon\Carbon::parse($toDate);
                $days = (int) $dueDate->diffInDays($asOn, false);

                return [
                    'date' => $purchase->date,
                    'voucher_no' => str_pad($purchase->invoice ?? $purchase->id, 6, "0", STR_PAD_LEFT),
                    'party_name' => $supplier->title ?? 'Unknown',
                    'party_id' => $purchase->supplier_id,
                    'customer_id' => $purchase->supplier_id,
                    'supplier_id' => $purchase->supplier_id,
                    'type' => 'PURCHASE',
                    'bill_type' => 'payable',
                    'due_date' => $dueDate->format('Y-m-d'),
                    'days' => $days,
                    'bill_amt' => (float)$purchase->net_total - (float)($purchase->extra_discount ?? 0),
                    'paid' => (float)$purchase->paid_amount,
                    'remaining' => (float)$purchase->remaining_amount,
                    'credit_days' => $agingDays,
                    'credit_limit' => (float)($supplier->credit_limit ?? 0),
                    'is_opening_balance' => false,
                    'is_supplier' => false,
                ];
            });

            $purchaseReturnQuery = PurchaseReturn::with(['supplier' => function($q) {
                    $q->select('id', 'title', 'aging_days', 'credit_limit', 'purchase', 'sale', 'type', 'opening_date');
                }])
                ->where('remaining_amount', '>', 0.005)
                ->whereIn('supplier_id', $customerAccountIds);
            if (!empty($toDate)) {
                $purchaseReturnQuery->whereDate('date', '<=', $toDate);
            }
            if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
                $purchaseReturnQuery->where('firm_id', $filters['firmId']);
            }
            $purchaseReturns = $purchaseReturnQuery->orderBy('date', 'asc')->get();

            $purchaseReturnBills = $purchaseReturns->map(function($return) use ($toDate) {
                $supplier = $return->supplier;
                $agingDays = (int)($supplier->aging_days ?? 0);
                $dueDate = \Carbon\Carbon::parse($return->date);
                $asOn = \Carbon\Carbon::parse($toDate);
                $days = (int) $dueDate->diffInDays($asOn, false);

                $netReturn = (float)$return->net_total - (float)($return->extra_discount ?? 0);
                $remReturn = (float)$return->remaining_amount;

                return [
                    'date' => $return->date,
                    'voucher_no' => str_pad($return->invoice ?? $return->id, 6, "0", STR_PAD_LEFT),
                    'party_name' => $supplier->title ?? 'Unknown',
                    'party_id' => $return->supplier_id,
                    'customer_id' => $return->supplier_id,
                    'supplier_id' => $return->supplier_id,
                    'type' => 'RETURN',
                    'bill_type' => 'payable',
                    'due_date' => $dueDate->format('Y-m-d'),
                    'days' => $days,
                    'bill_amt' => -$netReturn,
                    'paid' => -(float)($return->paid_amount ?? 0),
                    'remaining' => -$remReturn,
                    'credit_days' => $agingDays,
                    'credit_limit' => (float)($supplier->credit_limit ?? 0),
                    'is_opening_balance' => false,
                    'is_supplier' => false,
                ];
            });
        }

        $allBills = $saleBills->concat($returnBills)->concat($purchaseBills)->concat($purchaseReturnBills);
        $groupedBills = $allBills->groupBy('customer_id');

        // Preload payments & receipts
        $allPayments = Payment::whereIn('account_id', $customerAccountIds)
            ->whereNotIn('cheque_status', ['Canceled', 'Returned'])
            ->when(!empty($toDate), fn($q) => $q->whereDate('date', '<=', $toDate))
            ->with('allocations')
            ->orderBy('date', 'asc')
            ->get()
            ->groupBy('account_id');

        $finalData = [];

        foreach ($accounts as $partyId => $account) {
            $partyBills = $groupedBills->get($partyId, collect());
            $accountPayments = $allPayments->get($partyId, collect());
            $unallocatedPayments = $accountPayments->where('type', 'PAYMENT');
            $unallocatedReceipts = $accountPayments->where('type', 'RECEIPT');

            $currentBal = (float)$account->current_balance;
            if (round($currentBal) <= 0) {
                continue;
            }

            $fifoRes = $this->settlePartyBillsFifo(
                $account,
                $partyBills,
                $toDate,
                $unallocatedPayments,
                $unallocatedReceipts,
                'receivable'
            );

            // General Due Bills report: only list parties with due customer receivables (DR)
            if ($accountId === 'ALL' || empty($accountId)) {
                if (empty($fifoRes['surviving_debits'])) {
                    continue;
                }
                $partyBillsToOutput = $fifoRes['surviving_debits'];
            } else {
                // Filtered specifically for a single party: output surviving obligations
                $partyBillsToOutput = !empty($fifoRes['surviving_debits']) ? $fifoRes['surviving_debits'] : $fifoRes['bills'];
            }

            // Exclude bills that have 0 remaining and 0 balance when rounded
            $partyBillsToOutput = array_values(array_filter($partyBillsToOutput, function($b) {
                return round((float)($b['remaining'] ?? 0)) > 0 || round((float)($b['balance'] ?? 0)) > 0;
            }));

            if (empty($partyBillsToOutput)) {
                continue;
            }

            // Exclude parties whose total due + undue amount rounds to 0
            $partyTotalDue = round((float)($fifoRes['due_amount'] ?? 0)) + round((float)($fifoRes['undue_amount'] ?? 0));
            if ($partyTotalDue <= 0) {
                continue;
            }

            $agingDays = (int)($account->aging_days ?? 0);
            $partySummary = [
                'party_un_due_amount' => $fifoRes['undue_amount'],
                'party_due_amount' => $fifoRes['due_amount'],
                'credit_days' => $agingDays,
                'credit_limit' => (float)($account->credit_limit ?? 0),
                'opening_balance' => (float)$account->opening_balance,
                'opening_balance_type' => $account->opening_balance_type ?? 'DR',
            ];

            $count = count($partyBillsToOutput);
            for ($i = 0; $i < $count; $i++) {
                $partyBillsToOutput[$i]['party_summary'] = $partySummary;
                if ($i === $count - 1) {
                    $partyBillsToOutput[$i]['is_last_for_customer'] = true;
                }
                $finalData[] = $partyBillsToOutput[$i];
            }
        }

        // Sort by party name, keeping opening balance and bills ordered chronologically within party
        usort($finalData, function($a, $b) {
            $cmp = strcmp($a['party_name'], $b['party_name']);
            if ($cmp === 0) {
                $aIsOb = !empty($a['is_opening_balance']) ? 0 : 1;
                $bIsOb = !empty($b['is_opening_balance']) ? 0 : 1;
                if ($aIsOb !== $bIsOb) {
                    return $aIsOb - $bIsOb;
                }
                return strtotime($a['date']) - strtotime($b['date']);
            }
            return $cmp;
        });

        // Ensure is_last_for_customer is set accurately after sort
        $totalRows = count($finalData);
        for ($i = 0; $i < $totalRows; $i++) {
            $isLast = ($i === $totalRows - 1) || ($finalData[$i]['customer_id'] !== $finalData[$i + 1]['customer_id']);
            $finalData[$i]['is_last_for_customer'] = $isLast;
        }

        return collect($finalData);
    }

    public function dayBook($fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d');
        $toDate = $toDate ?? date('Y-m-d');

        // 1. Weighted Average Cost per item from purchase_items
        $avgCosts = DB::table('purchase_items')
            ->select(
                'item_id',
                DB::raw('SUM(subtotal) / NULLIF(SUM(total_pcs), 0) as avg_cost')
            )
            ->groupBy('item_id')
            ->pluck('avg_cost', 'item_id');

        // 2. Stock Summary
        $openingStock = (float)$this->calculateStockOpeningAll($fromDate);
        
        // Sum of inward (Purchase + Sales Return)
        $inward = (float)(DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->whereBetween('purchases.date', [$fromDate, $toDate])
            ->sum('total_pcs') +
            DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->sum('total_pcs'));

        // Sum of outward (Sales + Purchase Return)
        $outward = (float)(DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->sum('total_pcs') +
            DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->whereBetween('purchase_returns.date', [$fromDate, $toDate])
            ->sum('total_pcs'));

        $closingStockQty = $openingStock + $inward - $outward;
        
        // Closing stock value using avg cost at toDate
        $purchasedSub = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->where('date', '<=', $toDate)
            ->select('item_id', DB::raw('SUM(total_pcs) as total_purchased'))
            ->groupBy('item_id');

        $soldSub = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->where('date', '<=', $toDate)
            ->select('item_id', DB::raw('SUM(total_pcs) as total_sold'))
            ->groupBy('item_id');

        $pRetSub = DB::table('purchase_return_items')
            ->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')
            ->where('date', '<=', $toDate)
            ->select('item_id', DB::raw('SUM(total_pcs) as total_purchase_returned'))
            ->groupBy('item_id');

        $sRetSub = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->where('date', '<=', $toDate)
            ->select('item_id', DB::raw('SUM(total_pcs) as total_sales_returned'))
            ->groupBy('item_id');

        $closingStockRows = DB::table('items')
            ->leftJoinSub($purchasedSub, 'p', 'items.id', '=', 'p.item_id')
            ->leftJoinSub($soldSub, 's', 'items.id', '=', 's.item_id')
            ->leftJoinSub($pRetSub, 'pr', 'items.id', '=', 'pr.item_id')
            ->leftJoinSub($sRetSub, 'sr', 'items.id', '=', 'sr.item_id')
            ->select(
                'items.id as item_id',
                DB::raw('(COALESCE(p.total_purchased, 0) - COALESCE(pr.total_purchase_returned, 0)) - (COALESCE(s.total_sold, 0) - COALESCE(sr.total_sales_returned, 0)) as qty')
            )
            ->get();

        $totalStockValue = $closingStockRows->sum(function ($row) use ($avgCosts) {
            $cost = $avgCosts[$row->item_id] ?? 0;
            return $cost * $row->qty;
        });

        // 3. Cash Summary (AccountType 1 or name LIKE %Cash%)
        $cashAccounts = Account::where('type', 1)
            ->orWhereHas('accountType', fn($q) => $q->where('name', 'LIKE', '%Cash%'))
            ->pluck('id');
        $cashSummary = $this->getAccountGroupSummary($cashAccounts, $fromDate, $toDate, 'dr');

        // 4. Cheque Summary (AccountType 14 or name LIKE %Cheque%)
        $chequeAccounts = Account::where('type', 14)
            ->orWhereHas('accountType', fn($q) => $q->where('name', 'LIKE', '%Cheque%'))
            ->pluck('id');
        $chequeSummary = $this->getAccountGroupSummary($chequeAccounts, $fromDate, $toDate, 'dr');

        // 5. Bank Summary (AccountType 2 or name LIKE %Bank%)
        $bankAccounts = Account::where('type', 2)
            ->orWhereHas('accountType', fn($q) => $q->where('name', 'LIKE', '%Bank%'))
            ->get();
        $bankDetails = [];
        foreach ($bankAccounts as $bank) {
            $summary = $this->getAccountGroupSummary([$bank->id], $fromDate, $toDate, 'dr');
            $bankDetails[] = [
                'name' => $bank->title,
                'opening' => (float)$summary['opening'],
                'receipts' => (float)$summary['receiving'],
                'payments' => (float)$summary['payment'],
                'closing' => (float)$summary['closing']
            ];
        }
        $bankSummaryOverall = $this->getAccountGroupSummary($bankAccounts->pluck('id'), $fromDate, $toDate, 'dr');

        // 6. Receivables/Payables (Type 3 and 6)
        $customerAccounts = Account::where('type', 3)->pluck('id');
        $supplierAccounts = Account::where('type', 6)->pluck('id');
        
        $receivableSummary = $this->getAccountGroupSummary($customerAccounts, $fromDate, $toDate, 'dr');
        $payableSummary = $this->getAccountGroupSummary($supplierAccounts, $fromDate, $toDate, 'cr');

        // 7. Purchases/Sales
        $grossSales = (float)DB::table('sales')->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $salesReturnSum = (float)DB::table('sales_returns')->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $netSales = $grossSales - $salesReturnSum;

        $grossPurchase = (float)DB::table('purchases')->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $purchaseReturnSum = (float)DB::table('purchase_returns')->whereBetween('date', [$fromDate, $toDate])->sum('net_total');
        $netPurchase = $grossPurchase - $purchaseReturnSum;

        // 8. COGS and Gross Profit
        $purchaseCostsSub = DB::table('purchase_items')
            ->select('item_id', DB::raw('SUM(subtotal) / NULLIF(SUM(total_pcs), 0) as avg_cost'))
            ->groupBy('item_id');

        $cogs = (float)DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->leftJoinSub($purchaseCostsSub, 'pc', 'sales_items.item_id', '=', 'pc.item_id')
            ->whereBetween('sales.date', [$fromDate, $toDate])
            ->selectRaw('SUM(sales_items.total_pcs * COALESCE(pc.avg_cost, 0)) as total_cogs')
            ->value('total_cogs') ?? 0;

        $returnCogs = (float)DB::table('sales_return_items')
            ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->leftJoinSub($purchaseCostsSub, 'pc', 'sales_return_items.item_id', '=', 'pc.item_id')
            ->whereBetween('sales_returns.date', [$fromDate, $toDate])
            ->selectRaw('SUM(sales_return_items.total_pcs * COALESCE(pc.avg_cost, 0)) as total_cogs')
            ->value('total_cogs') ?? 0;

        $cogs = max(0, $cogs - $returnCogs);

        $grossProfit = $netSales - $cogs;

        // 9. Operating Expenses (Type 4)
        $totalExpenses = (float)DB::table('payments')
            ->join('accounts', 'payments.account_id', '=', 'accounts.id')
            ->where('accounts.type', 4)
            ->where('payments.type', 'PAYMENT')
            ->whereBetween('payments.date', [$fromDate, $toDate])
            ->selectRaw('SUM(payments.amount + payments.discount) as total')
            ->value('total') ?? 0;

        $netProfit = $grossProfit - $totalExpenses;
        $netMargin = $netSales > 0 ? round(($netProfit / $netSales) * 100, 2) : 0;
        $grossMargin = $netSales > 0 ? round(($grossProfit / $netSales) * 100, 2) : 0;
        $roi = $totalStockValue > 0 ? round(($netProfit / $totalStockValue) * 100, 2) : 0;

        // 10. Capital (Type 9)
        $capitalAccounts = Account::where('type', 9)->pluck('id');
        $capitalSummary = $this->getAccountGroupSummary($capitalAccounts, $fromDate, $toDate, 'cr');

        // 11. Total DR / Total CR
        $trialBalance = $this->calculateTrialBalanceTotals($toDate);
        $totalDR = $trialBalance['dr'];
        $totalCR = $trialBalance['cr'];

        return [
            'stock' => [
                'opening' => (int)$openingStock,
                'in' => (int)$inward,
                'out' => (int)$outward,
                'closing' => (int)$closingStockQty,
                'closing_amt' => round($totalStockValue, 2)
            ],
            'cash' => [
                'opening' => round((float)$cashSummary['opening'], 2),
                'receiving' => round((float)$cashSummary['receiving'], 2),
                'payment' => round((float)$cashSummary['payment'], 2),
                'closing' => round((float)$cashSummary['closing'], 2)
            ],
            'cheque' => [
                'opening' => round((float)$chequeSummary['opening'], 2),
                'receiving' => round((float)$chequeSummary['receiving'], 2),
                'payment' => round((float)$chequeSummary['payment'], 2),
                'closing' => round((float)$chequeSummary['closing'], 2)
            ],
            'bank' => [
                'details' => $bankDetails,
                'summary' => [
                    'opening' => round((float)$bankSummaryOverall['opening'], 2),
                    'receiving' => round((float)$bankSummaryOverall['receiving'], 2),
                    'payment' => round((float)$bankSummaryOverall['payment'], 2),
                    'closing' => round((float)$bankSummaryOverall['closing'], 2)
                ]
            ],
            'trade' => [
                'purchase' => round($grossPurchase, 2),
                'purchase_return' => round($purchaseReturnSum, 2),
                'net_purchase' => round($netPurchase, 2),
                'sale' => round($grossSales, 2),
                'sales_return' => round($salesReturnSum, 2),
                'net_sale' => round($netSales, 2)
            ],
            'financial' => [
                'day_receivable' => round($netSales, 2),
                'total_receivable' => round((float)$receivableSummary['closing'], 2),
                'day_payable' => round($netPurchase, 2),
                'total_payable' => round((float)$payableSummary['closing'], 2),
                'capital' => round((float)$capitalSummary['closing'], 2),
                'total_dr' => round((float)$totalDR, 2),
                'total_cr' => round((float)$totalCR, 2),

                'cogs' => round($cogs, 2),
                'gross_profit' => round($grossProfit, 2),
                'gross_margin' => (float)$grossMargin,
                'total_expenses' => round($totalExpenses, 2),
                'net_profit' => round($netProfit, 2),
                'net_margin' => (float)$netMargin,
                'roi' => (float)$roi,
                'profit' => round($netProfit, 2)
            ],
            'from' => $fromDate,
            'to' => $toDate
        ];
    }


    private function calculateStockOpeningAll($date)
    {
        $purchased = DB::table('purchase_items')->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')->where('date', '<', $date)->sum('total_pcs');
        $sold = DB::table('sales_items')->join('sales', 'sales_items.sale_id', '=', 'sales.id')->where('date', '<', $date)->sum('total_pcs');
        $pRet = DB::table('purchase_return_items')->join('purchase_returns', 'purchase_return_items.purchase_return_id', '=', 'purchase_returns.id')->where('date', '<', $date)->sum('total_pcs');
        $sRet = DB::table('sales_return_items')->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')->where('date', '<', $date)->sum('total_pcs');
        return ($purchased - $pRet) - ($sold - $sRet);
    }

    private function getAccountGroupSummary($accountIds, $fromDate, $toDate, $orientation = 'dr')
    {
        if (empty($accountIds) || (is_countable($accountIds) && count($accountIds) === 0)) {
            return [
                'opening' => 0,
                'receiving' => 0,
                'payment' => 0,
                'closing' => 0
            ];
        }

        $idsArray = is_array($accountIds) ? $accountIds : $accountIds->toArray();
        $accounts = Account::with('accountType')->whereIn('id', $idsArray)->get();
        if ($accounts->isEmpty()) {
            return [
                'opening' => 0,
                'receiving' => 0,
                'payment' => 0,
                'closing' => 0
            ];
        }

        $opening = 0;
        foreach ($idsArray as $id) {
            $opening += $this->calculateOpeningBalance($id, $fromDate, $orientation);
        }

        $firstAccount = $accounts->first();
        $typeName = strtolower($firstAccount->accountType->name ?? '');
        $isAsset = in_array((int)$firstAccount->type, [1, 2, 14]) || 
                   in_array($typeName, ['cash', 'bank', 'cheque', 'cheque in hand']) ||
                   str_contains($typeName, 'cash') || 
                   str_contains($typeName, 'bank');

        if ($isAsset) {
            // Financial payments (where payment_account_id = bank/cash ID)
            $financialPayments = DB::table('payments')
                ->whereIn('payment_account_id', $idsArray)
                ->whereBetween('date', [$fromDate, $toDate])
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                })
                ->selectRaw("SUM(CASE WHEN type = 'RECEIPT' THEN amount ELSE 0 END) as receiving,
                             SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE 0 END) as payment")
                ->first();

            // Party payments (where account_id = bank/cash ID)
            $partyPayments = DB::table('payments')
                ->whereIn('account_id', $idsArray)
                ->whereBetween('date', [$fromDate, $toDate])
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                })
                ->selectRaw("SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE 0 END) as receiving,
                             SUM(CASE WHEN type = 'RECEIPT' THEN amount ELSE 0 END) as payment")
                ->first();

            $receiving = (float)($financialPayments->receiving ?? 0) + (float)($partyPayments->receiving ?? 0);
            $payment = (float)($financialPayments->payment ?? 0) + (float)($partyPayments->payment ?? 0);

            // For Cash / Bank Assets: Receiving INCREASES balance (+), Payment DECREASES balance (-)
            $closing = $opening + $receiving - $payment;
        } else {
            // Customer / Supplier / Expense / Other accounts
            $payments = DB::table('payments')
                ->whereIn('account_id', $idsArray)
                ->whereBetween('date', [$fromDate, $toDate])
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                })
                ->selectRaw("SUM(CASE WHEN type = 'RECEIPT' THEN amount ELSE 0 END) as receiving,
                             SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE 0 END) as payment")
                ->first();

            $receiving = (float)($payments->receiving ?? 0);
            $payment = (float)($payments->payment ?? 0);

            if ($orientation === 'cr') {
                $closing = $opening + $receiving - $payment;
            } else {
                $closing = $opening + $payment - $receiving;
            }
        }

        return [
            'opening' => $opening,
            'receiving' => $receiving,
            'payment' => $payment,
            'closing' => $closing
        ];
    }

    private function calculateTrialBalanceTotals($toDate)
    {
        $toDate = $toDate ?? date('Y-m-d');

        // Load accountType so getSignedOpeningBalance() can resolve CR-normal check
        $accounts = Account::with('accountType')->get();

        $sales = Sales::where('date', '<=', $toDate)->groupBy('customer_id')->selectRaw('customer_id, SUM(net_total) as total')->pluck('total', 'customer_id');
        $purchases = Purchase::where('date', '<=', $toDate)->groupBy('supplier_id')->selectRaw('supplier_id, SUM(net_total) as total')->pluck('total', 'supplier_id');

        // Include discount to match aggregateAccountBalances() formula
        $payments = Payment::where('date', '<=', $toDate)
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned'])
                  ->orWhereNull('cheque_status');
            })
            ->groupBy('account_id')
            ->selectRaw('account_id,
                SUM(CASE WHEN type = "RECEIPT" THEN (amount + discount) ELSE 0 END) as receipts,
                SUM(CASE WHEN type = "PAYMENT" THEN (amount + discount) ELSE 0 END) as payments')
            ->get()->keyBy('account_id');

        $salesReturns = SalesReturn::where('date', '<=', $toDate)->groupBy('customer_id')->selectRaw('customer_id, SUM(net_total) as total')->pluck('total', 'customer_id');
        $purchaseReturns = PurchaseReturn::where('date', '<=', $toDate)->groupBy('supplier_id')->selectRaw('supplier_id, SUM(net_total) as total')->pluck('total', 'supplier_id');

        $totalDR = 0;
        $totalCR = 0;

        foreach ($accounts as $acc) {
            $id = $acc->id;

            if (in_array($acc->type, [1, 2, 14])) {
                // Bank/Cash: use payment_account_id column
                $payStats = DB::table('payments')->where('payment_account_id', $id)
                    ->where('date', '<=', $toDate)
                    ->where(function($q) {
                        $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled', 'Returned'])
                          ->orWhereNull('cheque_status');
                    })
                    ->selectRaw('SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts,
                                 SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
                    ->first();
                $debit  = $payStats->receipts ?? 0;
                $credit = $payStats->payments ?? 0;
            } else {
                // Customer/Supplier/Other: use account_id
                $debit  = ($sales->get($id) ?? 0) + ($payments->get($id)->payments ?? 0) + ($purchaseReturns->get($id) ?? 0);
                $credit = ($purchases->get($id) ?? 0) + ($payments->get($id)->receipts ?? 0) + ($salesReturns->get($id) ?? 0);
            }

            $signedOb = $acc->getSignedOpeningBalance();

            $isCrNormal = in_array((int)$acc->type, [6, 9, 17, 18])
                || in_array(strtolower($acc->accountType->name ?? ''), ['supplier', 'capital', 'amanat payable', 'reserve']);

            if ($isCrNormal) { // CR-normal (Supplier)
                $bal = $signedOb + ($credit - $debit);
                if ($bal >= 0) $totalCR += $bal; else $totalDR += abs($bal);
            } else {
                $bal = $signedOb + ($debit - $credit);
                if ($bal >= 0) $totalDR += $bal; else $totalCR += abs($bal);
            }
        }

        return ['dr' => $totalDR, 'cr' => $totalCR];
    }

    public function outstandingBillWise($accountId = 'ALL', $fromDate = null, $toDate = null, $params = [])
    {
        if (is_array($accountId)) {
            $accountId = $accountId['value'] ?? $accountId['id'] ?? $accountId['account_id'] ?? 'ALL';
        }
        if (($accountId === 'ALL' || empty($accountId)) && !empty($params['account_id'])) {
            $accountId = is_array($params['account_id']) ? ($params['account_id']['value'] ?? $params['account_id']['id'] ?? 'ALL') : $params['account_id'];
        }
        $toDate = $toDate ?? date('Y-m-d');

        // 1. Fetch Purchases (Supplier Payables)
        $purchaseQuery = Purchase::with(['supplier' => function($q) {
                $q->select('id', 'title', 'aging_days', 'credit_limit', 'purchase', 'sale', 'type', 'opening_date');
            }])
            ->where('remaining_amount', '>', 0.005);
            
        if ($accountId !== 'ALL' && !empty($accountId)) {
            $purchaseQuery->where('supplier_id', $accountId);
        }
        if (!empty($toDate)) {
            $purchaseQuery->whereDate('date', '<=', $toDate);
        }
        if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
            $purchaseQuery->where('firm_id', $params['firmId']);
        }
        $purchaseQuery->whereHas('supplier', function($q) use ($params) {
            $subParams = $params;
            if (isset($subParams['type']) && in_array($subParams['type'], ['Receivable', 'Payable'])) {
                unset($subParams['type']);
            }
            $this->applyAccountFilters($q, $subParams);
        });

        $purchases = $purchaseQuery->orderBy('date', 'asc')->get();

        $purchaseBills = $purchases->map(function($purchase) use ($toDate) {
            $supplier = $purchase->supplier;
            $agingDays = (int)($supplier->aging_days ?? 0);
            $dueDate = \Carbon\Carbon::parse($purchase->date)->addDays($agingDays);
            $asOn = \Carbon\Carbon::parse($toDate);
            $days = (int) $dueDate->diffInDays($asOn, false);

            return [
                'date' => $purchase->date,
                'voucher_no' => str_pad($purchase->invoice ?? $purchase->id, 6, "0", STR_PAD_LEFT),
                'bill_type' => 'payable',
                'party_name' => $supplier->title ?? 'Unknown',
                'party_id' => $purchase->supplier_id,
                'supplier_id' => $purchase->supplier_id,
                'customer_id' => $purchase->supplier_id,
                'due_date' => $dueDate->format('Y-m-d'),
                'days' => $days,
                'bill_amt' => (float)$purchase->net_total - (float)($purchase->extra_discount ?? 0),
                'paid' => (float)$purchase->paid_amount,
                'remaining' => (float)$purchase->remaining_amount,
                'credit_days' => $agingDays,
                'credit_limit' => (float)($supplier->credit_limit ?? 0),
                'is_opening_balance' => false,
                'is_supplier' => true,
            ];
        });

        // 2. Fetch Purchase Returns
        $returnQuery = PurchaseReturn::with(['supplier' => function($q) {
                $q->select('id', 'title', 'aging_days', 'credit_limit', 'purchase', 'sale', 'type', 'opening_date');
            }])
            ->where('remaining_amount', '>', 0.005);

        if ($accountId !== 'ALL' && !empty($accountId)) {
            $returnQuery->where('supplier_id', $accountId);
        }
        if (!empty($toDate)) {
            $returnQuery->whereDate('date', '<=', $toDate);
        }
        if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
            $returnQuery->where('firm_id', $params['firmId']);
        }
        $returnQuery->whereHas('supplier', function($q) use ($params) {
            $subParams = $params;
            if (isset($subParams['type']) && in_array($subParams['type'], ['Receivable', 'Payable'])) {
                unset($subParams['type']);
            }
            $this->applyAccountFilters($q, $subParams);
        });

        $purchaseReturns = $returnQuery->orderBy('date', 'asc')->get();

        $returnBills = $purchaseReturns->map(function($return) use ($toDate) {
            $supplier = $return->supplier;
            $agingDays = (int)($supplier->aging_days ?? 0);
            $dueDate = \Carbon\Carbon::parse($return->date);
            $asOn = \Carbon\Carbon::parse($toDate);
            $days = (int) $dueDate->diffInDays($asOn, false);

            $netReturn = (float)$return->net_total - (float)($return->extra_discount ?? 0);
            $remReturn = (float)$return->remaining_amount;

            return [
                'date' => $return->date,
                'voucher_no' => str_pad($return->invoice ?? $return->id, 6, "0", STR_PAD_LEFT),
                'bill_type' => 'payable',
                'party_name' => $supplier->title ?? 'Unknown',
                'party_id' => $return->supplier_id,
                'supplier_id' => $return->supplier_id,
                'customer_id' => $return->supplier_id,
                'due_date' => $dueDate->format('Y-m-d'),
                'days' => $days,
                'bill_amt' => -$netReturn,
                'paid' => -(float)($return->paid_amount ?? 0),
                'remaining' => -$remReturn,
                'credit_days' => $agingDays,
                'credit_limit' => (float)($supplier->credit_limit ?? 0),
                'is_opening_balance' => false,
                'is_supplier' => true,
            ];
        });

        // 3. Candidate Supplier Accounts
        $partyIdsFromBills = $purchaseBills->pluck('party_id')->concat($returnBills->pluck('party_id'))->unique()->filter()->values()->all();

        $accountQuery = Account::with('accountType');
        if ($accountId !== 'ALL' && !empty($accountId)) {
            $accountQuery->where('id', $accountId);
        } else {
            $paymentPartyIds = Payment::whereIn('type', ['PAYMENT', 'RECEIPT'])
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned'])->orWhereNull('cheque_status');
                })
                ->whereNotNull('account_id')
                ->distinct()
                ->pluck('account_id')
                ->toArray();
            $relevantPartyIds = array_unique(array_merge($partyIdsFromBills, $paymentPartyIds));

            $accountQuery->where(function($q) use ($relevantPartyIds) {
                if (!empty($relevantPartyIds)) {
                    $q->whereIn('id', $relevantPartyIds);
                }
                $q->orWhere(function($subQ) {
                    $subQ->whereNotNull('opening_balance')->where('opening_balance', '!=', 0)
                        ->where(function($pQ) {
                            $pQ->where('purchase', 1)
                               ->orWhere('type', 6)
                               ->orWhereHas('accountType', fn($at) => $at->where('name', 'Supplier'));
                        });
                });
            })->where(function($pQ) {
                $pQ->where('purchase', 1)
                   ->orWhere('type', 6)
                   ->orWhereHas('accountType', fn($at) => $at->where('name', 'Supplier'));
            });
        }
        $this->applyAccountFilters($accountQuery, $params);
        $accounts = $accountQuery->get()->keyBy('id');

        // Preload real-time bulk balances efficiently
        PaymentAccountingService::attachBulkBalances($accounts);

        // 4. Fetch Contra Sales & Sales Returns for these supplier accounts
        $supplierAccountIds = $accounts->pluck('id')->all();
        $saleBills = collect();
        $saleReturnBills = collect();

        if (!empty($supplierAccountIds)) {
            $salesQuery = Sales::with(['customer' => function($q) {
                    $q->select('id', 'title', 'aging_days', 'credit_limit', 'purchase', 'sale', 'type', 'opening_date');
                }])
                ->where('remaining_amount', '>', 0.005)
                ->whereIn('customer_id', $supplierAccountIds);
            if (!empty($toDate)) {
                $salesQuery->whereDate('date', '<=', $toDate);
            }
            if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
                $salesQuery->where('firm_id', $params['firmId']);
            }
            $sales = $salesQuery->orderBy('date', 'asc')->get();

            $saleBills = $sales->map(function($sale) use ($toDate) {
                $agingDays = (int)($sale->customer->aging_days ?? 0);
                $dueDate = \Carbon\Carbon::parse($sale->date)->addDays($agingDays);
                $asOn = \Carbon\Carbon::parse($toDate);
                $days = (int) $dueDate->diffInDays($asOn, false);

                return [
                    'date' => $sale->date,
                    'voucher_no' => str_pad($sale->invoice ?? $sale->id, 6, "0", STR_PAD_LEFT),
                    'party_name' => $sale->customer->title ?? 'Unknown',
                    'party_id' => $sale->customer_id,
                    'customer_id' => $sale->customer_id,
                    'supplier_id' => $sale->customer_id,
                    'type' => $sale->type ?? 'CREDIT',
                    'bill_type' => 'receivable',
                    'due_date' => $dueDate->format('Y-m-d'),
                    'days' => $days,
                    'bill_amt' => (float)$sale->net_total - (float)$sale->extra_discount,
                    'paid' => (float)$sale->paid_amount,
                    'remaining' => (float)$sale->remaining_amount,
                    'credit_days' => $agingDays,
                    'credit_limit' => (float)($sale->customer->credit_limit ?? 0),
                    'is_opening_balance' => false,
                    'is_supplier' => true,
                ];
            });

            $salesReturnQuery = SalesReturn::with(['customer' => function($q) {
                    $q->select('id', 'title', 'aging_days', 'credit_limit', 'purchase', 'sale', 'type', 'opening_date');
                }])
                ->where('remaining_amount', '>', 0.005)
                ->whereIn('customer_id', $supplierAccountIds);
            if (!empty($toDate)) {
                $salesReturnQuery->whereDate('date', '<=', $toDate);
            }
            if (isset($params['firmId']) && $params['firmId'] !== 'ALL') {
                $salesReturnQuery->where('firm_id', $params['firmId']);
            }
            $salesReturns = $salesReturnQuery->orderBy('date', 'asc')->get();

            $saleReturnBills = $salesReturns->map(function($return) use ($toDate) {
                $agingDays = (int)($return->customer->aging_days ?? 0);
                $dueDate = \Carbon\Carbon::parse($return->date);
                $asOn = \Carbon\Carbon::parse($toDate);
                $days = (int) $dueDate->diffInDays($asOn, false);

                $netReturn = (float)$return->net_total - (float)$return->extra_discount;
                $remReturn = (float)$return->remaining_amount;

                return [
                    'date' => $return->date,
                    'voucher_no' => str_pad($return->invoice ?? $return->id, 6, "0", STR_PAD_LEFT),
                    'party_name' => $return->customer->title ?? 'Unknown',
                    'party_id' => $return->customer_id,
                    'customer_id' => $return->customer_id,
                    'supplier_id' => $return->customer_id,
                    'type' => 'RETURN',
                    'bill_type' => 'receivable',
                    'due_date' => $dueDate->format('Y-m-d'),
                    'days' => $days,
                    'bill_amt' => -$netReturn,
                    'paid' => -(float)$return->paid_amount,
                    'remaining' => -$remReturn,
                    'credit_days' => $agingDays,
                    'credit_limit' => (float)($return->customer->credit_limit ?? 0),
                    'is_opening_balance' => false,
                    'is_supplier' => true,
                ];
            });
        }

        $allBills = $purchaseBills->concat($returnBills)->concat($saleBills)->concat($saleReturnBills);
        $groupedBills = $allBills->groupBy('party_id');

        // Preload payments & receipts
        $allPayments = Payment::whereIn('account_id', $supplierAccountIds)
            ->whereNotIn('cheque_status', ['Canceled', 'Returned'])
            ->when(!empty($toDate), fn($q) => $q->whereDate('date', '<=', $toDate))
            ->with('allocations')
            ->orderBy('date', 'asc')
            ->get()
            ->groupBy('account_id');

        $finalData = [];

        foreach ($accounts as $partyId => $account) {
            $partyBills = $groupedBills->get($partyId, collect());
            $accountPayments = $allPayments->get($partyId, collect());
            $unallocatedPayments = $accountPayments->where('type', 'PAYMENT');
            $unallocatedReceipts = $accountPayments->where('type', 'RECEIPT');

            $currentBal = (float)$account->current_balance;
            if (round(abs($currentBal)) <= 0) {
                continue;
            }

            $fifoRes = $this->settlePartyBillsFifo(
                $account,
                $partyBills,
                $toDate,
                $unallocatedPayments,
                $unallocatedReceipts,
                'payable'
            );

            // Filter out 0 balance bills
            $billsToOutput = array_values(array_filter($fifoRes['bills'] ?? [], function($b) {
                return round(abs((float)($b['remaining'] ?? 0))) > 0 || round(abs((float)($b['balance'] ?? 0))) > 0;
            }));

            if (empty($billsToOutput)) {
                continue;
            }

            $fifoRes['bills'] = $billsToOutput;

            $isSupplierAccount = in_array((int)$account->type, [6]) || strtolower($account->accountType->name ?? '') === 'supplier';
            $payableBalance = $isSupplierAccount ? $currentBal : -$currentBal;

            $partySummary = [
                'party_un_due_amount' => $fifoRes['undue_amount'],
                'party_due_amount' => $fifoRes['due_amount'],
                'credit_days' => (int)($account->aging_days ?? 0),
                'credit_limit' => (float)($account->credit_limit ?? 0),
                'party_type' => 'payable',
                'current_balance' => round($payableBalance, 2),
                'total_outstanding' => round($fifoRes['cumulative_balance'], 2),
                'is_reconciled' => abs($fifoRes['cumulative_balance'] - $payableBalance) < 0.05,
                'difference' => round($fifoRes['cumulative_balance'] - $payableBalance, 2),
            ];

            $count = count($fifoRes['bills']);
            for ($i = 0; $i < $count; $i++) {
                $billItem = $fifoRes['bills'][$i];
                $billItem['party_summary'] = $partySummary;
                if ($i === $count - 1) {
                    $billItem['is_last_for_party'] = true;
                }
                $finalData[] = $billItem;
            }
        }

        // Global Sort: Party Name -> (OPENING-BAL first) -> Date -> Voucher
        usort($finalData, function($a, $b) {
            $nameCmp = strcmp($a['party_name'], $b['party_name']);
            if ($nameCmp !== 0) return $nameCmp;

            $aIsOb = !empty($a['is_opening_balance']) || str_starts_with($a['voucher_no'] ?? '', 'OPENING-BAL');
            $bIsOb = !empty($b['is_opening_balance']) || str_starts_with($b['voucher_no'] ?? '', 'OPENING-BAL');
            if ($aIsOb && !$bIsOb) return -1;
            if (!$aIsOb && $bIsOb) return 1;

            $dateCmp = strtotime($a['date']) - strtotime($b['date']);
            if ($dateCmp !== 0) return $dateCmp;

            return strcmp($a['voucher_no'] ?? '', $b['voucher_no'] ?? '');
        });

        // Ensure is_last_for_party flag is accurate after global sort
        $count = count($finalData);
        for ($i = 0; $i < $count; $i++) {
            $isLast = ($i === $count - 1) || ($finalData[$i]['party_id'] !== $finalData[$i + 1]['party_id']);
            $finalData[$i]['is_last_for_party'] = $isLast;
        }

        return collect($finalData);
    }

    /**
     * Generate detailed payment report for a specific period.
     */
    public function paymentDetail($accountId = null, $fromDate = null, $toDate = null)
    {
        return $this->processPaymentReport('PAYMENT', $accountId, $fromDate, $toDate);
    }

    /**
     * Generate detailed receiving report for a specific period.
     */
    public function receivingDetail($accountId = null, $fromDate = null, $toDate = null)
    {
        return $this->processPaymentReport('RECEIPT', $accountId, $fromDate, $toDate);
    }

    /**
     * Internal helper to process payment/receipt reports.
     */
    private function processPaymentReport($type, $accountId = null, $fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $query = Payment::with(['account', 'paymentAccount'])
            ->where('type', $type)
            ->whereBetween('date', [$fromDate, $toDate]);

        if ($accountId && $accountId !== 'ALL') {
            $query->where('account_id', $accountId);
        }

        $payments = $query->orderBy('date')->orderBy('created_at')->get();

        // Efficiently compute balances for all parties involved up to $toDate
        $partyIds = $payments->pluck('account_id')->unique()->filter()->toArray();
        $partyBalances = [];
        
        if (!empty($partyIds)) {
            $sales = Sales::whereIn('customer_id', $partyIds)->where('date', '<=', $toDate)
                ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
                
            $purchases = Purchase::whereIn('supplier_id', $partyIds)->where('date', '<=', $toDate)
                ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

            $paymentsRec = Payment::whereIn('account_id', $partyIds)->where('date', '<=', $toDate)->where('type', 'RECEIPT')
                ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');
                
            $paymentsPaid = Payment::whereIn('account_id', $partyIds)->where('date', '<=', $toDate)->where('type', 'PAYMENT')
                ->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');

            $salesReturns = SalesReturn::whereIn('customer_id', $partyIds)->where('date', '<=', $toDate)
                ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
                
            $purchaseReturns = PurchaseReturn::whereIn('supplier_id', $partyIds)->where('date', '<=', $toDate)
                ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

            foreach($partyIds as $pid) {
                $dr = (float)($sales[$pid] ?? 0) + (float)($paymentsPaid[$pid] ?? 0) + (float)($purchaseReturns[$pid] ?? 0);
                $cr = (float)($purchases[$pid] ?? 0) + (float)($paymentsRec[$pid] ?? 0) + (float)($salesReturns[$pid] ?? 0);
                $partyBalances[$pid] = ['dr' => $dr, 'cr' => $cr];
            }
        }

        return $payments->map(function ($p) use ($type, $partyBalances) {
            $prefix = $type === 'PAYMENT' ? 'BP-' : 'CR-';
            $accId = $p->account_id;
            
            $net = 0;
            if ($accId && isset($partyBalances[$accId])) {
                $opening = (float)($p->account->opening_balance ?? 0);
                // Calculate Net Balance: Opening + Net Debit - Net Credit
                $balData = $partyBalances[$accId];
                $net = $opening + $balData['dr'] - $balData['cr'];
            }

            return [
                'id' => $p->id,
                'voucher_no' => $p->voucher_no ?: $prefix . str_pad($p->id, 5, '0', STR_PAD_LEFT),
                'date' => $p->date,
                'party_name' => $p->account->title ?? 'Unknown',
                'bank_name' => $p->paymentAccount->title ?? 'N/A',
                'amount' => (float)$p->amount,
                'balance' => $net,
                'remarks' => $p->remarks ?? ''
            ];
        });
    }

    /**
     * Generate a summary of all Receivables (Accounts with Net Debit Balance)
     */
    public function receivables($toDate = null, $filters = [])
    {
        return $this->aggregateAccountBalances($toDate, 'debit', $filters);
    }

    /**
     * Generate a summary of all Payables (Accounts with Net Credit Balance)
     */
    public function payables($toDate = null, $filters = [])
    {
        return $this->aggregateAccountBalances($toDate, 'credit', $filters);
    }

    /**
     * Generate a complete Summary (Trial Balance) for all selected accounts
     */
    public function summary($toDate = null, $filters = [])
    {
        return $this->aggregateAccountBalances($toDate, 'all', $filters);
    }

    public function trialBalance($toDate = null, $filters = [])
    {
        return $this->aggregateAccountBalances($toDate, 'all', $filters, false);
    }

    /**
     * Generate 6 Column Trial Balance
     */
    public function trialBalance6Col($fromDate = null, $toDate = null, $filters = [])
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        $accountQuery = Account::with('accountType');
        
        $this->applyAccountFilters($accountQuery, $filters);

        $accounts = $accountQuery->get();
        $accountIds = $accounts->pluck('id')->toArray();

        // --- OPENING BALANCES (Before FROM DATE) ---
        $openSalesQuery = Sales::whereIn('customer_id', $accountIds)->where('date', '<', $fromDate);
        $openPurchasesQuery = Purchase::whereIn('supplier_id', $accountIds)->where('date', '<', $fromDate);
        
        if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
            $openSalesQuery->where('firm_id', $filters['firmId']);
            $openPurchasesQuery->where('firm_id', $filters['firmId']);
        }
        
        $openSales = $openSalesQuery->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $openPurchases = $openPurchasesQuery->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');
        
        $openPaymentsRecQuery = Payment::whereIn('account_id', $accountIds)->where('date', '<', $fromDate)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled');
        $openPaymentsPaidQuery = Payment::whereIn('account_id', $accountIds)->where('date', '<', $fromDate)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled');
        
        if (isset($filters['contraId']) && $filters['contraId'] !== 'ALL') {
            $openPaymentsRecQuery->where('payment_account_id', $filters['contraId']);
            $openPaymentsPaidQuery->where('payment_account_id', $filters['contraId']);
        }

        $openPaymentsRec = $openPaymentsRecQuery->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');
        $openPaymentsPaid = $openPaymentsPaidQuery->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');

        $openSalesReturns = SalesReturn::whereIn('customer_id', $accountIds)->where('date', '<', $fromDate)
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $openPurchaseReturns = PurchaseReturn::whereIn('supplier_id', $accountIds)->where('date', '<', $fromDate)
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

        $openAssetPaymentsQuery = DB::table('payments')
            ->whereIn('payment_account_id', $accountIds)->where('date', '<', $fromDate)
            ->where('cheque_status', '!=', 'Canceled')
            ->where(function($q) {
                $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                  ->orWhereNull('cheque_status')
                  ->orWhere('cheque_status', '')
                  ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
            });

        if (isset($filters['contraId']) && $filters['contraId'] !== 'ALL') {
            $openAssetPaymentsQuery->where('payment_account_id', $filters['contraId']);
        }

        $openAssetPayments = $openAssetPaymentsQuery->groupBy('payment_account_id')
            ->selectRaw('payment_account_id, SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts, SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
            ->get()->keyBy('payment_account_id');

        // --- PERIOD TRANSACTIONS (Between FROM DATE and TO DATE) ---
        $rangeSalesQuery = Sales::whereIn('customer_id', $accountIds)->whereBetween('date', [$fromDate, $toDate]);
        $rangePurchasesQuery = Purchase::whereIn('supplier_id', $accountIds)->whereBetween('date', [$fromDate, $toDate]);
        
        if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
            $rangeSalesQuery->where('firm_id', $filters['firmId']);
            $rangePurchasesQuery->where('firm_id', $filters['firmId']);
        }

        $rangeSales = $rangeSalesQuery->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $rangePurchases = $rangePurchasesQuery->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');
        
        $rangePaymentsRecQuery = Payment::whereIn('account_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled');
        $rangePaymentsPaidQuery = Payment::whereIn('account_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled');
        
        if (isset($filters['contraId']) && $filters['contraId'] !== 'ALL') {
            $rangePaymentsRecQuery->where('payment_account_id', $filters['contraId']);
            $rangePaymentsPaidQuery->where('payment_account_id', $filters['contraId']);
        }

        $rangePaymentsRec = $rangePaymentsRecQuery->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');
        $rangePaymentsPaid = $rangePaymentsPaidQuery->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');

        $rangeSalesReturns = SalesReturn::whereIn('customer_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $rangePurchaseReturns = PurchaseReturn::whereIn('supplier_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

        $rangeAssetPaymentsQuery = DB::table('payments')
            ->whereIn('payment_account_id', $accountIds)->whereBetween('date', [$fromDate, $toDate])
            ->where('cheque_status', '!=', 'Canceled')
            ->where(function($q) {
                $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                  ->orWhereNull('cheque_status')
                  ->orWhere('cheque_status', '')
                  ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
            });

        if (isset($filters['contraId']) && $filters['contraId'] !== 'ALL') {
            $rangeAssetPaymentsQuery->where('payment_account_id', $filters['contraId']);
        }

        $rangeAssetPayments = $rangeAssetPaymentsQuery->groupBy('payment_account_id')
            ->selectRaw('payment_account_id, SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts, SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
            ->get()->keyBy('payment_account_id');

        $results = [];

        foreach ($accounts as $acc) {
            $id = $acc->id;

            // 1. Calculate Opening Balance
            if (in_array($acc->type, [1, 2, 14])) {
                $payStatsOpen = $openAssetPayments->get($id);
                $openDrRaw = $payStatsOpen->receipts ?? 0;
                $openCrRaw = $payStatsOpen->payments ?? 0;

                $openBal = $acc->getSignedOpeningBalance() + ($openDrRaw - $openCrRaw);
                $openDr = $openBal >= 0 ? $openBal : 0;
                $openCr = $openBal < 0 ? abs($openBal) : 0;
            } else {
                $openDrRaw = (float)($openSales[$id] ?? 0) + (float)($openPaymentsPaid[$id] ?? 0) + (float)($openPurchaseReturns[$id] ?? 0);
                $openCrRaw = (float)($openPurchases[$id] ?? 0) + (float)($openPaymentsRec[$id] ?? 0) + (float)($openSalesReturns[$id] ?? 0);

                $signedOb = $acc->getSignedOpeningBalance();

                $isCrNormal = in_array((int)$acc->type, [6, 9, 17, 18])
                    || in_array(strtolower($acc->accountType->name ?? ''), ['supplier', 'capital', 'amanat payable', 'reserve']);

                if ($isCrNormal) { // CR-normal (Supplier)
                    $openBal = $signedOb + ($openCrRaw - $openDrRaw);
                    $openDr = $openBal < 0 ? abs($openBal) : 0;
                    $openCr = $openBal >= 0 ? $openBal : 0;
                } else { // DR-normal (Customer / Other)
                    $openBal = $signedOb + ($openDrRaw - $openCrRaw);
                    $openDr = $openBal >= 0 ? $openBal : 0;
                    $openCr = $openBal < 0 ? abs($openBal) : 0;
                }
            }

            // 2. Calculate Period Transactions
            if (in_array($acc->type, [1, 2, 14])) {
                $payStatsRange = $rangeAssetPayments->get($id);
                $periodDr = (float)($payStatsRange->receipts ?? 0);
                $periodCr = (float)($payStatsRange->payments ?? 0);
            } else {
                $periodDr = (float)($rangeSales[$id] ?? 0) + (float)($rangePaymentsPaid[$id] ?? 0) + (float)($rangePurchaseReturns[$id] ?? 0);
                $periodCr = (float)($rangePurchases[$id] ?? 0) + (float)($rangePaymentsRec[$id] ?? 0) + (float)($rangeSalesReturns[$id] ?? 0);
            }

            // 3. Calculate Closing Balance
            if (! $isCrNormal) { // Debit oriented
                $closeBal = $openDr - $openCr + $periodDr - $periodCr;
                $closeDr = $closeBal >= 0 ? $closeBal : 0;
                $closeCr = $closeBal < 0 ? abs($closeBal) : 0;
            } else { // Credit oriented (Suppliers)
                $closeBal = $openCr - $openDr + $periodCr - $periodDr;
                $closeDr = $closeBal < 0 ? abs($closeBal) : 0;
                $closeCr = $closeBal >= 0 ? $closeBal : 0;
            }

            // Show row if it has any activity or balance
            if (round($openDr, 2) > 0 || round($openCr, 2) > 0 || 
                round($periodDr, 2) > 0 || round($periodCr, 2) > 0 || 
                round($closeDr, 2) > 0 || round($closeCr, 2) > 0) {
                
                $results[] = [
                    'id' => $id,
                    'code' => $acc->code,
                    'title' => $acc->title,
                    'type_name' => str_replace('s', '', strtoupper($acc->accountType->name ?? 'Account')),
                    'opening_dr' => round($openDr, 2),
                    'opening_cr' => round($openCr, 2),
                    'period_dr' => round($periodDr, 2),
                    'period_cr' => round($periodCr, 2),
                    'closing_dr' => round($closeDr, 2),
                    'closing_cr' => round($closeCr, 2),
                ];
            }
        }

        return collect($results)->sortBy('title')->values();
    }

    /**
     * Core logic to aggregate net balances for all relevant accounts.
     */
    private function aggregateAccountBalances($toDate, $filterType = 'debit', $filters = [], $excludeAssets = true)
    {
        $toDate = $toDate ?? date('Y-m-d');

        // 1. Fetch relevant accounts
        $accountQuery = Account::with('accountType');
            
        if ($excludeAssets) {
            $accountQuery->whereNotIn('type', [1, 2, 14]); // Exclude Cash/Bank/Cheque
        }

        $this->applyAccountFilters($accountQuery, $filters);

        $accounts = $accountQuery->get();
        $accountIds = $accounts->pluck('id')->toArray();

        // 2. Aggregate Transactions in bulk to avoid N+1 issues
        $salesQuery = Sales::whereIn('customer_id', $accountIds)->where('date', '<=', $toDate);
        $purchasesQuery = Purchase::whereIn('supplier_id', $accountIds)->where('date', '<=', $toDate);
        
        if (isset($filters['firmId']) && $filters['firmId'] !== 'ALL') {
            $salesQuery->where('firm_id', $filters['firmId']);
            $purchasesQuery->where('firm_id', $filters['firmId']);
        }

        $sales = $salesQuery->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
        $purchases = $purchasesQuery->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

        $paymentsRecQuery = Payment::whereIn('account_id', $accountIds)->where('date', '<=', $toDate)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled');
        $paymentsPaidQuery = Payment::whereIn('account_id', $accountIds)->where('date', '<=', $toDate)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled');

        if (isset($filters['contraId']) && $filters['contraId'] !== 'ALL') {
            $paymentsRecQuery->where('payment_account_id', $filters['contraId']);
            $paymentsPaidQuery->where('payment_account_id', $filters['contraId']);
        }

        $paymentsRec = $paymentsRecQuery->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');
        $paymentsPaid = $paymentsPaidQuery->select('account_id', DB::raw('SUM(amount + discount) as total'))->groupBy('account_id')->pluck('total', 'account_id');

        $salesReturns = SalesReturn::whereIn('customer_id', $accountIds)->where('date', '<=', $toDate)
            ->select('customer_id', DB::raw('SUM(net_total) as total'))->groupBy('customer_id')->pluck('total', 'customer_id');
            
        $purchaseReturns = PurchaseReturn::whereIn('supplier_id', $accountIds)->where('date', '<=', $toDate)
            ->select('supplier_id', DB::raw('SUM(net_total) as total'))->groupBy('supplier_id')->pluck('total', 'supplier_id');

        $assetPayments = collect([]);
        if (!$excludeAssets) {
            $assetPaymentsQuery = DB::table('payments')
                ->whereIn('payment_account_id', $accountIds)
                ->where('date', '<=', $toDate)
                ->where('cheque_status', '!=', 'Canceled')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed']);
                });

            if (isset($filters['contraId']) && $filters['contraId'] !== 'ALL') {
                $assetPaymentsQuery->where('payment_account_id', $filters['contraId']);
            }

            $assetPayments = $assetPaymentsQuery->groupBy('payment_account_id')
                ->selectRaw('payment_account_id, SUM(CASE WHEN type = "RECEIPT" THEN amount ELSE 0 END) as receipts, SUM(CASE WHEN type = "PAYMENT" THEN amount ELSE 0 END) as payments')
                ->get()->keyBy('payment_account_id');
        }

        $results = [];
        foreach ($accounts as $acc) {
            $id = $acc->id;
            
            if (!$excludeAssets && in_array($acc->type, [1, 2, 14])) {
                $payStats = $assetPayments->get($id);
                // Receiving money to cash/bank means DR (asset increases)
                $dr = $payStats->receipts ?? 0;
                $cr = $payStats->payments ?? 0;

                // getSignedOpeningBalance() returns positive for DR-type OB on asset accounts
                $bal = $acc->getSignedOpeningBalance() + ($dr - $cr);
                if ($bal >= 0) {
                    $debit = $bal; $credit = 0;
                } else {
                    $debit = 0; $credit = abs($bal);
                }
            } else {
                $dr = (float)($sales[$id] ?? 0) + (float)($paymentsPaid[$id] ?? 0) + (float)($purchaseReturns[$id] ?? 0);
                $cr = (float)($purchases[$id] ?? 0) + (float)($paymentsRec[$id] ?? 0) + (float)($salesReturns[$id] ?? 0);

                // getSignedOpeningBalance():
                //   Suppliers: returns +OB for CR-type, -OB for DR-type
                //   Customers: returns +OB for DR-type, -OB for CR-type
                $signedOb = $acc->getSignedOpeningBalance();

                $isCrNormal = in_array((int)$acc->type, [6, 9, 17, 18])
                    || in_array(strtolower($acc->accountType->name ?? ''), ['supplier', 'capital', 'amanat payable', 'reserve']);

                if ($isCrNormal) { // CR-normal (Supplier)
                    $bal = $signedOb + ($cr - $dr);
                    if ($bal >= 0) { $debit = 0; $credit = $bal; }
                    else { $debit = abs($bal); $credit = 0; }
                } else { // DR-normal (Customer / Other)
                    $bal = $signedOb + ($dr - $cr);
                    if ($bal >= 0) { $debit = $bal; $credit = 0; }
                    else { $debit = 0; $credit = abs($bal); }
                }
            }

            if ($filterType === 'debit' && round($debit, 2) > 0) {
                $results[] = [
                    'id' => $id,
                    'title' => $acc->title,
                    'type_name' => str_replace('s', '', strtoupper($acc->accountType->name ?? 'Account')),
                    'debit' => round($debit, 2),
                    'credit' => 0
                ];
            } elseif ($filterType === 'credit' && round($credit, 2) > 0) {
                $results[] = [
                    'id' => $id,
                    'title' => $acc->title,
                    'type_name' => str_replace('s', '', strtoupper($acc->accountType->name ?? 'Account')),
                    'debit' => 0,
                    'credit' => round($credit, 2)
                ];
            } elseif ($filterType === 'all' && (round($debit, 2) > 0 || round($credit, 2) > 0)) {
                $results[] = [
                    'id' => $id,
                    'title' => $acc->title,
                    'type_name' => str_replace('s', '', strtoupper($acc->accountType->name ?? 'Account')),
                    'debit' => round($debit, 2),
                    'credit' => round($credit, 2)
                ];
            }
        }

        return collect($results)->sortBy('title')->values();
    }

    /**
     * Generate Roznamcha (Cash flow Period Summary)
     */
    public function roznamcha($fromDate = null, $toDate = null)
    {
        $fromDate = $fromDate ?? date('Y-m-d', strtotime('-30 days'));
        $toDate = $toDate ?? date('Y-m-d');

        // Fetch Cash Opening Balance
        $cashAccounts = Account::where('type', 1)->pluck('id')->toArray();
        $openingCash = 0;
        foreach ($cashAccounts as $id) {
            $openingCash += $this->calculateOpeningBalance($id, $fromDate, 'dr');
        }

        // Aggregate payments for the period
        $payments = DB::table('payments')
            ->join('accounts as acc', 'payments.account_id', '=', 'acc.id')
            ->join('accounts as bank', 'payments.payment_account_id', '=', 'bank.id')
            ->whereBetween('payments.date', [$fromDate, $toDate])
            ->select('payments.type as p_type', 'payments.amount', 'acc.type as acc_type', 'bank.type as bank_type')
            ->get();

        // INFLOWS
        $cashSale = 0; 
        $cashReceivedCreditSale = 0;
        $chequeReceivedCreditSale = 0;
        $drawing = 0; // Image places Drawing on the left
        $loanReceived = 0;

        // OUTFLOWS
        $cashPurchase = 0; 
        $totalExpense = 0;
        $cashPaidCreditPurchase = 0;
        $chequePaidCreditPurchase = 0;
        $deposits = 0;
        $loanPaid = 0;

        foreach ($payments as $p) {
            if ($p->p_type === 'RECEIPT') {
                if ($p->bank_type == 1) { // Received into Cash
                    if ($p->acc_type == 3) $cashReceivedCreditSale += $p->amount;
                    elseif ($p->acc_type == 11) $loanReceived += $p->amount;
                    elseif ($p->acc_type == 8) $drawing += $p->amount; 
                } elseif ($p->bank_type == 14 || $p->bank_type == 2) { // Received Cheque/Bank
                    if ($p->acc_type == 3) $chequeReceivedCreditSale += $p->amount;
                }
            } else { // PAYMENT
                if ($p->bank_type == 1) { // Paid from Cash
                    if ($p->acc_type == 6) $cashPaidCreditPurchase += $p->amount;
                    elseif ($p->acc_type == 4) $totalExpense += $p->amount;
                    elseif ($p->acc_type == 2 || $p->acc_type == 14) $deposits += $p->amount;
                    elseif ($p->acc_type == 11) $loanPaid += $p->amount;
                } elseif ($p->bank_type == 2 || $p->bank_type == 14) { // Paid via Cheque/Bank
                    if ($p->acc_type == 6) $chequePaidCreditPurchase += $p->amount;
                }
            }
        }

        // As per the image: Total Cash Received does NOT include Cheque Received.
        $totalCashReceived = $openingCash + $cashSale + $cashReceivedCreditSale + $drawing + $loanReceived;
        
        // Total Payment does NOT include Cheque Paid in its SUM.
        $totalPayment = $cashPurchase + $totalExpense + $cashPaidCreditPurchase + $deposits + $loanPaid;
        
        $cashInHand = $totalCashReceived - $totalPayment;

        return [
            'inflows' => [
                'cash_opening' => $openingCash,
                'cash_sale' => $cashSale,
                'cash_received_credit_sale' => $cashReceivedCreditSale,
                'cheque_received_credit_sale' => $chequeReceivedCreditSale,
                'drawing' => $drawing,
                'loan_received' => $loanReceived,
                'total_cash_received' => $totalCashReceived
            ],
            'outflows' => [
                'cash_purchase' => $cashPurchase,
                'total_expense' => $totalExpense,
                'cash_paid_credit_purchase' => $cashPaidCreditPurchase,
                'cheque_paid_credit_purchase' => $chequePaidCreditPurchase,
                'deposits' => $deposits,
                'loan_paid' => $loanPaid,
                'total_payment' => $totalPayment
            ],
            'cash_in_hand' => $cashInHand,
            'from_date' => $fromDate,
            'to_date' => $toDate
        ];
    }

    /**
     * Chronological FIFO settlement of all party debits and credits.
     * Settles oldest obligations first, omitting fully covered bills.
     */
    public function settlePartyBillsFifo(
        Account $account,
        \Illuminate\Support\Collection $partyBills,
        string $toDate,
        \Illuminate\Support\Collection $unallocatedPayments,
        \Illuminate\Support\Collection $unallocatedReceipts,
        string $partyType
    ): array {
        $agingDays = (int)($account->aging_days ?? 0);
        $currentBal = (float)$account->current_balance;
        $signedOB = (float)$account->getSignedOpeningBalance();
        $rawOB = abs($signedOB);
        $obType = strtoupper($account->opening_balance_type ?? '');
        if (empty($obType)) {
            $obType = $signedOB >= 0 ? ($partyType === 'payable' ? 'CR' : 'DR') : ($partyType === 'payable' ? 'DR' : 'CR');
        }

        $debits = [];
        $credits = [];

        // 1. Opening Balance
        if ($rawOB > 0.005) {
            $obDate = $account->opening_date ? \Carbon\Carbon::parse($account->opening_date)->format('Y-m-d') : '2026-01-01';
            $dueDate = \Carbon\Carbon::parse($obDate)->addDays($agingDays);
            $days = (int)$dueDate->diffInDays(\Carbon\Carbon::parse($toDate), false);

            $obItem = [
                'date' => $obDate,
                'voucher_no' => 'OPENING-BAL (' . $obType . ')',
                'type' => 'OPENING',
                'bill_type' => $obType === 'DR' ? 'receivable' : 'payable',
                'party_name' => $account->title ?? 'Unknown',
                'party_id' => $account->id,
                'customer_id' => $account->id,
                'supplier_id' => $account->id,
                'bill_amt' => $rawOB,
                'original_amt' => $rawOB,
                'paid' => 0.0,
                'remaining' => $rawOB,
                'due_date' => $dueDate->format('Y-m-d'),
                'days' => $days,
                'credit_days' => $agingDays,
                'credit_limit' => (float)($account->credit_limit ?? 0),
                'is_opening_balance' => true,
                'ob_type' => $obType,
                'opening_balance' => $rawOB,
                'opening_balance_type' => $obType,
                'is_supplier' => ($partyType === 'payable'),
            ];
            if ($obType === 'DR') {
                $debits[] = $obItem;
            } else {
                $credits[] = $obItem;
            }
        }

        // 2. Regular Bills
        foreach ($partyBills as $bill) {
            $rem = (float)$bill['remaining'];
            if (abs($rem) <= 0.005) continue;

            $bType = $bill['bill_type'] ?? 'receivable';
            $item = $bill;
            $item['original_amt'] = abs($rem);

            if ($bType === 'receivable') {
                if ($rem > 0) {
                    $item['remaining'] = $rem;
                    $debits[] = $item;
                } else {
                    $item['remaining'] = abs($rem);
                    $credits[] = $item;
                }
            } else {
                // payable
                if ($rem > 0) {
                    $item['remaining'] = $rem;
                    $credits[] = $item;
                } else {
                    $item['remaining'] = abs($rem);
                    $debits[] = $item;
                }
            }
        }

        // 3. Unallocated Payments (DEBIT)
        foreach ($unallocatedPayments as $pay) {
            $unalloc = PaymentAccountingService::getUnallocatedCash($pay);
            if ($unalloc > 0.005) {
                $payDate = $pay->date ? \Carbon\Carbon::parse($pay->date)->format('Y-m-d') : $toDate;

                $debits[] = [
                    'date' => $payDate,
                    'voucher_no' => $pay->voucher_no,
                    'type' => 'PAYMENT',
                    'bill_type' => 'receivable',
                    'party_name' => $account->title ?? 'Unknown',
                    'party_id' => $account->id,
                    'customer_id' => $account->id,
                    'supplier_id' => $account->id,
                    'bill_amt' => $unalloc,
                    'original_amt' => $unalloc,
                    'paid' => 0.0,
                    'remaining' => $unalloc,
                    'due_date' => $payDate,
                    'days' => 0,
                    'credit_days' => $agingDays,
                    'credit_limit' => (float)($account->credit_limit ?? 0),
                    'is_opening_balance' => false,
                    'is_supplier' => ($partyType === 'payable'),
                ];
            }
        }

        // 4. Unallocated Receipts (CREDIT)
        foreach ($unallocatedReceipts as $rec) {
            $unalloc = PaymentAccountingService::getUnallocatedCash($rec);
            if ($unalloc > 0.005) {
                $recDate = $rec->date ? \Carbon\Carbon::parse($rec->date)->format('Y-m-d') : $toDate;

                $credits[] = [
                    'date' => $recDate,
                    'voucher_no' => $rec->voucher_no,
                    'type' => 'RECEIPT',
                    'bill_type' => 'payable',
                    'party_name' => $account->title ?? 'Unknown',
                    'party_id' => $account->id,
                    'customer_id' => $account->id,
                    'supplier_id' => $account->id,
                    'bill_amt' => $unalloc,
                    'original_amt' => $unalloc,
                    'paid' => 0.0,
                    'remaining' => $unalloc,
                    'due_date' => $recDate,
                    'days' => 0,
                    'credit_days' => $agingDays,
                    'credit_limit' => (float)($account->credit_limit ?? 0),
                    'is_opening_balance' => false,
                    'is_supplier' => ($partyType === 'payable'),
                ];
            }
        }

        // 5. Chronological Sort
        $sortFn = function($a, $b) {
            $aOb = !empty($a['is_opening_balance']) ? 0 : 1;
            $bOb = !empty($b['is_opening_balance']) ? 0 : 1;
            if ($aOb !== $bOb) return $aOb <=> $bOb;
            $d = strtotime($a['date']) <=> strtotime($b['date']);
            if ($d !== 0) return $d;
            return strcmp($a['voucher_no'] ?? '', $b['voucher_no'] ?? '');
        };
        usort($debits, $sortFn);
        usort($credits, $sortFn);

        // 6. Chronological FIFO Settlement
        $dIdx = 0;
        $cIdx = 0;
        $dCount = count($debits);
        $cCount = count($credits);

        while ($dIdx < $dCount && $cIdx < $cCount) {
            $match = min($debits[$dIdx]['remaining'], $credits[$cIdx]['remaining']);

            $debits[$dIdx]['remaining'] = round($debits[$dIdx]['remaining'] - $match, 2);
            $debits[$dIdx]['paid'] = round(($debits[$dIdx]['paid'] ?? 0) + $match, 2);

            $credits[$cIdx]['remaining'] = round($credits[$cIdx]['remaining'] - $match, 2);
            $credits[$cIdx]['paid'] = round(($credits[$cIdx]['paid'] ?? 0) + $match, 2);

            if ($debits[$dIdx]['remaining'] <= 0.005) {
                $dIdx++;
            }
            if ($credits[$cIdx]['remaining'] <= 0.005) {
                $cIdx++;
            }
        }

        $survivingDebits = array_values(array_filter($debits, fn($d) => $d['remaining'] > 0.005));
        $survivingCredits = array_values(array_filter($credits, fn($c) => $c['remaining'] > 0.005));

        // 7. Authoritative Ledger Reconciliation
        $isSupplierAccount = in_array((int)$account->type, [6]) || strtolower($account->accountType->name ?? '') === 'supplier';
        if ($isSupplierAccount) {
            $isNetCredit = $currentBal > 0.005;
            $isNetDebit = $currentBal < -0.005;
        } else {
            $isNetDebit = $currentBal > 0.005;
            $isNetCredit = $currentBal < -0.005;
        }
        $targetBal = abs($currentBal);

        if ($isNetDebit) {
            // Net debit obligation
            $survivingCredits = [];
            if (!empty($survivingDebits)) {
                $totalSurvivingDebits = (float)array_sum(array_column($survivingDebits, 'remaining'));
                
                if ($totalSurvivingDebits > $targetBal + 0.005) {
                    // Excess payments/credits exist that reduce the balance below the open bills.
                    // Apply this credit to the OLDEST bills first (top-down FIFO settlement):
                    $excessCredit = round($totalSurvivingDebits - $targetBal, 2);
                    $count = count($survivingDebits);
                    for ($i = 0; $i < $count && $excessCredit > 0.005; $i++) {
                        $rem = (float)$survivingDebits[$i]['remaining'];
                        $deduct = min($rem, $excessCredit);
                        
                        $survivingDebits[$i]['paid'] = round(($survivingDebits[$i]['paid'] ?? 0) + $deduct, 2);
                        $survivingDebits[$i]['remaining'] = round($rem - $deduct, 2);
                        $excessCredit = round($excessCredit - $deduct, 2);
                    }
                    // Filter out fully cleared bills
                    $survivingDebits = array_values(array_filter($survivingDebits, fn($d) => $d['remaining'] > 0.005));
                } elseif ($totalSurvivingDebits < $targetBal - 0.005) {
                    // Ledger balance is higher than the known open bills (e.g. unbilled opening balance)
                    $diff = round($targetBal - $totalSurvivingDebits, 2);
                    $obDate = $account->opening_date ? \Carbon\Carbon::parse($account->opening_date)->format('Y-m-d') : '2026-01-01';
                    $obDueDate = \Carbon\Carbon::parse($obDate)->addDays($agingDays);
                    $obDays = (int)$obDueDate->diffInDays(\Carbon\Carbon::parse($toDate), false);

                    $survivingDebits[] = [
                        'date' => $obDate,
                        'voucher_no' => 'OPENING-BAL (DR)',
                        'type' => 'OPENING',
                        'bill_type' => 'receivable',
                        'party_name' => $account->title ?? 'Unknown',
                        'party_id' => $account->id,
                        'customer_id' => $account->id,
                        'supplier_id' => $account->id,
                        'bill_amt' => $diff,
                        'original_amt' => $diff,
                        'paid' => 0.0,
                        'remaining' => $diff,
                        'due_date' => $obDueDate->format('Y-m-d'),
                        'days' => $obDays,
                        'credit_days' => $agingDays,
                        'credit_limit' => (float)($account->credit_limit ?? 0),
                        'is_opening_balance' => true,
                        'ob_type' => 'DR',
                        'is_supplier' => ($partyType === 'payable'),
                    ];
                }
            } else {
                $survivingDebits[] = [
                    'date' => $toDate,
                    'voucher_no' => $partyType === 'payable' ? 'ADVANCE (DR)' : 'OPENING-BAL (DR)',
                    'type' => $partyType === 'payable' ? 'PAYMENT' : 'OPENING',
                    'bill_type' => 'receivable',
                    'party_name' => $account->title ?? 'Unknown',
                    'party_id' => $account->id,
                    'customer_id' => $account->id,
                    'supplier_id' => $account->id,
                    'bill_amt' => $targetBal,
                    'original_amt' => $targetBal,
                    'paid' => 0.0,
                    'remaining' => $targetBal,
                    'due_date' => $toDate,
                    'days' => 0,
                    'credit_days' => $agingDays,
                    'credit_limit' => (float)($account->credit_limit ?? 0),
                    'is_opening_balance' => true,
                    'ob_type' => 'DR',
                    'is_supplier' => ($partyType === 'payable'),
                ];
            }
        } elseif ($isNetCredit) {
            // Net credit obligation
            $survivingDebits = [];
            if (!empty($survivingCredits)) {
                $totalSurvivingCredits = (float)array_sum(array_column($survivingCredits, 'remaining'));
                
                if ($totalSurvivingCredits > $targetBal + 0.005) {
                    // Excess receipts/payments exist that reduce the balance below the open bills.
                    // Apply this debit to the OLDEST bills first (top-down FIFO settlement):
                    $excessDebit = round($totalSurvivingCredits - $targetBal, 2);
                    $count = count($survivingCredits);
                    for ($i = 0; $i < $count && $excessDebit > 0.005; $i++) {
                        $rem = (float)$survivingCredits[$i]['remaining'];
                        $deduct = min($rem, $excessDebit);
                        
                        $survivingCredits[$i]['paid'] = round(($survivingCredits[$i]['paid'] ?? 0) + $deduct, 2);
                        $survivingCredits[$i]['remaining'] = round($rem - $deduct, 2);
                        $excessDebit = round($excessDebit - $deduct, 2);
                    }
                    // Filter out fully cleared bills
                    $survivingCredits = array_values(array_filter($survivingCredits, fn($c) => $c['remaining'] > 0.005));
                } elseif ($totalSurvivingCredits < $targetBal - 0.005) {
                    // Ledger balance is higher than the known open bills (e.g. unbilled opening balance)
                    $diff = round($targetBal - $totalSurvivingCredits, 2);
                    $obDate = $account->opening_date ? \Carbon\Carbon::parse($account->opening_date)->format('Y-m-d') : '2026-01-01';
                    $obDueDate = \Carbon\Carbon::parse($obDate)->addDays($agingDays);
                    $obDays = (int)$obDueDate->diffInDays(\Carbon\Carbon::parse($toDate), false);

                    $survivingCredits[] = [
                        'date' => $obDate,
                        'voucher_no' => 'OPENING-BAL (CR)',
                        'type' => 'OPENING',
                        'bill_type' => 'payable',
                        'party_name' => $account->title ?? 'Unknown',
                        'party_id' => $account->id,
                        'customer_id' => $account->id,
                        'supplier_id' => $account->id,
                        'bill_amt' => $diff,
                        'original_amt' => $diff,
                        'paid' => 0.0,
                        'remaining' => $diff,
                        'due_date' => $obDueDate->format('Y-m-d'),
                        'days' => $obDays,
                        'credit_days' => $agingDays,
                        'credit_limit' => (float)($account->credit_limit ?? 0),
                        'is_opening_balance' => true,
                        'ob_type' => 'CR',
                        'is_supplier' => ($partyType === 'payable'),
                    ];
                }
            } else {
                $survivingCredits[] = [
                    'date' => $toDate,
                    'voucher_no' => $partyType === 'payable' ? 'OPENING-BAL (CR)' : 'ADVANCE (CR)',
                    'type' => $partyType === 'payable' ? 'OPENING' : 'RECEIPT',
                    'bill_type' => 'payable',
                    'party_name' => $account->title ?? 'Unknown',
                    'party_id' => $account->id,
                    'customer_id' => $account->id,
                    'supplier_id' => $account->id,
                    'bill_amt' => $targetBal,
                    'original_amt' => $targetBal,
                    'paid' => 0.0,
                    'remaining' => $targetBal,
                    'due_date' => $toDate,
                    'days' => 0,
                    'credit_days' => $agingDays,
                    'credit_limit' => (float)($account->credit_limit ?? 0),
                    'is_opening_balance' => true,
                    'ob_type' => 'CR',
                    'is_supplier' => ($partyType === 'payable'),
                ];
            }
        } else {
            $survivingDebits = [];
            $survivingCredits = [];
        }

        $allSurviving = array_merge($survivingDebits, $survivingCredits);
        usort($allSurviving, $sortFn);

        // 8. Cumulative Running Balance
        $cumulativeBalance = 0.0;
        $partyDueAmount = 0.0;
        $partyUnDueAmount = 0.0;

        foreach ($allSurviving as &$item) {
            $isSameType = ($item['bill_type'] === $partyType);
            $signedRem = $isSameType ? (float)$item['remaining'] : -(float)$item['remaining'];
            $cumulativeBalance += $signedRem;
            $item['balance'] = round($cumulativeBalance, 2);

            if (!$isSameType) {
                $item['bill_amt'] = -(float)abs($item['bill_amt']);
                $item['remaining'] = -(float)abs($item['remaining']);
            }

            if ($isSameType) {
                if ($item['days'] > 0) {
                    $partyDueAmount += (float)$item['remaining'];
                } else {
                    $partyUnDueAmount += (float)$item['remaining'];
                }
            }
        }
        unset($item);

        $survivingDebits = array_values(array_filter($allSurviving, fn($b) => ($b['bill_type'] ?? '') === 'receivable'));
        $survivingCredits = array_values(array_filter($allSurviving, fn($b) => ($b['bill_type'] ?? '') === 'payable'));

        return [
            'bills' => $allSurviving,
            'surviving_debits' => $survivingDebits,
            'surviving_credits' => $survivingCredits,
            'cumulative_balance' => round($cumulativeBalance, 2),
            'due_amount' => round($partyDueAmount, 2),
            'undue_amount' => round($partyUnDueAmount, 2),
        ];
    }
}

