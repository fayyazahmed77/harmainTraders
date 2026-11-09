<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\OnlineOrder;
use App\Models\OnlineOrderItem;
use App\Models\OnlineOrderRevision;
use App\Models\OnlineOrderHistory;
use App\Models\Sales;
use App\Models\Firm;
use App\Models\Account;
use App\Services\ReportBuilder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CustomerPortalController extends Controller
{
    protected ReportBuilder $reportBuilder;

    public function __construct(ReportBuilder $reportBuilder)
    {
        $this->reportBuilder = $reportBuilder;
    }

    /**
     * Customer Portal Executive Dashboard.
     */
    public function dashboard(Request $request)
    {
        $customerUser = Auth::guard('customer')->user();
        if ($customerUser->account_id) {
            $customerUser->load('account');
        }

        // Online Orders Metrics
        $ordersCount = OnlineOrder::where('customer_user_id', $customerUser->id)->count();
        $pendingOrdersCount = OnlineOrder::where('customer_user_id', $customerUser->id)
            ->whereIn('status', ['submitted', 'under_review', 'awaiting_customer_acceptance'])
            ->count();
        $confirmedOrdersCount = OnlineOrder::where('customer_user_id', $customerUser->id)
            ->where('status', 'confirmed')
            ->count();

        // Financial & Bill Metrics (if linked to ERP Account)
        $currentBalance = 0;
        $dueBillsCount = 0;
        $totalDueAmount = 0;
        $paidBillsCount = 0;
        $recentInvoices = collect();

        if ($customerUser->account_id) {
            $account = $customerUser->account;
            $currentBalance = $account ? (float)$account->current_balance : 0;

            $salesQuery = Sales::where('customer_id', $customerUser->account_id);
            $dueBillsCount = (clone $salesQuery)->where('remaining_amount', '>', 0.005)->count();
            $totalDueAmount = (float)(clone $salesQuery)->where('remaining_amount', '>', 0.005)->sum('remaining_amount');
            $paidBillsCount = (clone $salesQuery)->where('remaining_amount', '<=', 0.005)->count();

            $recentInvoices = (clone $salesQuery)
                ->select('id', 'invoice', 'date', 'net_total', 'extra_discount', 'total_receivable', 'paid_amount', 'remaining_amount', 'status')
                ->orderBy('date', 'desc')
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();
        }

        $recentOrders = OnlineOrder::where('customer_user_id', $customerUser->id)
            ->with(['items.item:id,title,code'])
            ->orderBy('submitted_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('customer/Dashboard', [
            'customer' => $customerUser,
            'metrics'  => [
                'total_orders'     => $ordersCount,
                'pending_orders'   => $pendingOrdersCount,
                'confirmed_orders' => $confirmedOrdersCount,
                'current_balance'  => $currentBalance,
                'due_bills_count'  => $dueBillsCount,
                'total_due_amount' => $totalDueAmount,
                'paid_bills_count' => $paidBillsCount,
                'is_linked'        => (bool)$customerUser->account_id,
            ],
            'recent_orders'   => $recentOrders,
            'recent_invoices' => $recentInvoices,
        ]);
    }
    /**
     * Display authenticated customer's order history.
     */
    public function orders(Request $request)
    {
        $customerUser = Auth::guard('customer')->user();

        $orders = OnlineOrder::where('customer_user_id', $customerUser->id)
            ->with(['items', 'activeRevision'])
            ->orderBy('submitted_at', 'desc')
            ->paginate(15);

        return Inertia::render('customer/Orders', [
            'customer' => $customerUser,
            'orders'   => $orders,
        ]);
    }

    /**
     * Display order detail with status timeline and revision comparison.
     */
    public function showOrder($orderNo)
    {
        $customerUser = Auth::guard('customer')->user();

        $order = OnlineOrder::where(function ($q) use ($orderNo) {
                $q->where('order_no', $orderNo);
                if (is_numeric($orderNo)) {
                    $q->orWhere('id', $orderNo);
                }
            })
            ->where('customer_user_id', $customerUser->id)
            ->with([
                'items.item:id,title,code,trade_price,retail',
                'revisions.items.item:id,title,code',
                'histories',
                'activeRevision.items.item:id,title,code',
                'sale:id,invoice,net_total,extra_discount,total_receivable,status',
            ])
            ->firstOrFail();

        return Inertia::render('customer/OrderDetail', [
            'customer' => $customerUser,
            'order'    => $order,
        ]);
    }

    /**
     * Download or view sales invoice PDF for customer's confirmed order.
     */
    public function downloadInvoicePdf($orderNo)
    {
        $customerUser = Auth::guard('customer')->user();

        $order = OnlineOrder::where(function ($q) use ($orderNo) {
                $q->where('order_no', $orderNo);
                if (is_numeric($orderNo)) {
                    $q->orWhere('id', $orderNo);
                }
            })
            ->where('customer_user_id', $customerUser->id)
            ->firstOrFail();

        if (!$order->sale_id) {
            abort(404, 'No confirmed sales invoice is linked to this order yet.');
        }

        $sale = Sales::with('customer', 'salesman', 'items.item', 'messageLine')->findOrFail($order->sale_id);
        $firm = Firm::find($sale->firm_id);

        $returns = \App\Models\SalesReturn::with(['items.item'])
            ->where('original_invoice', $sale->invoice)
            ->get();

        $sale->returns = $returns;

        $pdf = Pdf::loadView('pdf.sale', compact('sale', 'firm'));
        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream("Invoice-{$sale->invoice}.pdf");
    }

    /**
     * Customer Paid & Due Invoices / Bills list.
     */
    public function invoices(Request $request)
    {
        $customerUser = Auth::guard('customer')->user();
        if ($customerUser->account_id) {
            $customerUser->load('account');
        }

        $tab = $request->input('tab', 'all'); // 'all', 'paid', 'due', 'partial'
        $search = trim($request->input('search', ''));

        if (!$customerUser->account_id) {
            return Inertia::render('customer/Invoices', [
                'customer' => $customerUser,
                'invoices' => new \Illuminate\Pagination\LengthAwarePaginator([], 0, 15),
                'summary'  => [
                    'total_invoiced' => 0,
                    'total_paid'     => 0,
                    'total_due'      => 0,
                    'count_paid'     => 0,
                    'count_due'      => 0,
                ],
                'is_linked' => false,
                'filters'   => ['tab' => $tab, 'search' => $search],
            ]);
        }

        $query = Sales::where('customer_id', $customerUser->account_id)
            ->with('firm:id,name');

        if ($tab === 'paid') {
            $query->where('remaining_amount', '<=', 0.005);
        } elseif ($tab === 'due') {
            $query->where('paid_amount', '<=', 0)->where('remaining_amount', '>', 0.005);
        } elseif ($tab === 'partial') {
            $query->where('paid_amount', '>', 0)->where('remaining_amount', '>', 0.005);
        }

        if ($search !== '') {
            $query->where('invoice', 'LIKE', "%{$search}%");
        }

        $invoices = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        $allSales = Sales::where('customer_id', $customerUser->account_id);
        $totalInvoiced = (float)(clone $allSales)->sum('total_receivable');
        $totalPaid = (float)(clone $allSales)->sum('paid_amount');
        $totalDue = (float)(clone $allSales)->where('remaining_amount', '>', 0.005)->sum('remaining_amount');
        $countPaid = (clone $allSales)->where('remaining_amount', '<=', 0.005)->count();
        $countDue = (clone $allSales)->where('remaining_amount', '>', 0.005)->count();

        return Inertia::render('customer/Invoices', [
            'customer' => $customerUser,
            'invoices' => $invoices,
            'summary'  => [
                'total_invoiced' => $totalInvoiced,
                'total_paid'     => $totalPaid,
                'total_due'      => $totalDue,
                'count_paid'     => $countPaid,
                'count_due'      => $countDue,
            ],
            'is_linked' => true,
            'filters'   => ['tab' => $tab, 'search' => $search],
        ]);
    }

    /**
     * Download or view direct Sales Invoice PDF by sale ID.
     */
    public function downloadSalesInvoicePdf($saleId)
    {
        $customerUser = Auth::guard('customer')->user();
        if (!$customerUser->account_id) {
            abort(403, 'Account not linked to ERP.');
        }

        $sale = Sales::with('customer', 'salesman', 'items.item', 'messageLine')
            ->where('customer_id', $customerUser->account_id)
            ->findOrFail($saleId);

        $firm = Firm::find($sale->firm_id);
        $returns = \App\Models\SalesReturn::with(['items.item'])
            ->where('original_invoice', $sale->invoice)
            ->get();
        $sale->returns = $returns;

        $pdf = Pdf::loadView('pdf.sale', compact('sale', 'firm'));
        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream("Invoice-{$sale->invoice}.pdf");
    }

    /**
     * Customer Account Ledger / Statement.
     */
    public function ledger(Request $request)
    {
        $customerUser = Auth::guard('customer')->user();
        if ($customerUser->account_id) {
            $customerUser->load('account');
        }

        if (!$customerUser->account_id) {
            return Inertia::render('customer/Ledger', [
                'customer' => $customerUser,
                'ledger'   => null,
                'is_linked'=> false,
                'filters'  => ['from' => null, 'to' => null],
            ]);
        }

        $from = $request->input('from');
        $to = $request->input('to', date('Y-m-d'));

        $ledgerData = $this->reportBuilder->accountLedger(
            $customerUser->account_id,
            $from,
            $to,
            25,
            $request->all()
        );

        return Inertia::render('customer/Ledger', [
            'customer' => $customerUser,
            'ledger'   => $ledgerData,
            'is_linked'=> true,
            'filters'  => ['from' => $from, 'to' => $to],
        ]);
    }

    /**
     * Export customer ledger as PDF statement.
     */
    public function exportLedgerPdf(Request $request)
    {
        $customerUser = Auth::guard('customer')->user();
        if (!$customerUser->account_id) {
            abort(403, 'Account not linked to ERP.');
        }

        $account = Account::findOrFail($customerUser->account_id);
        $from = $request->input('from');
        $to = $request->input('to', date('Y-m-d'));

        $data = $this->reportBuilder->accountLedger(
            $customerUser->account_id,
            $from,
            $to,
            10000,
            $request->all()
        );

        $pdfData = [
            'account'              => $account,
            'transactions'         => $data['data'],
            'opening_balance'      => $data['opening_balance'],
            'opening_balance_type' => $data['opening_balance_type'],
            'total_debit'          => $data['total_debit'],
            'total_credit'         => $data['total_credit'],
            'closing_balance'      => $data['closing_balance'],
            'balance_type'         => $data['balance_type'],
            'from_date'            => $from,
            'to_date'              => $to,
        ];

        $pdf = Pdf::loadView('pdf.account-ledger', $pdfData);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download("Statement-{$account->title}-" . date('d-M-Y') . ".pdf");
    }

    /**
     * Customer accepts proposed revision.
     */
    public function acceptRevision(Request $request, $id)
    {
        $customerUser = Auth::guard('customer')->user();

        $order = OnlineOrder::where('id', $id)
            ->where('customer_user_id', $customerUser->id)
            ->firstOrFail();

        if ($order->status !== 'awaiting_customer_acceptance') {
            return redirect()->back()->with('error', 'This order is not currently awaiting revision acceptance.');
        }

        $activeRevision = OnlineOrderRevision::where('online_order_id', $order->id)
            ->whereIn('revision_status', ['awaiting_customer_acceptance', 'draft'])
            ->latest('revision_number')
            ->first();

        if (!$activeRevision) {
            return redirect()->back()->with('error', 'No pending revision found to accept.');
        }

        DB::transaction(function () use ($order, $activeRevision, $customerUser) {
            // Apply revision items to order items
            OnlineOrderItem::where('online_order_id', $order->id)->delete();

            $revItems = $activeRevision->items;
            foreach ($revItems as $revItem) {
                OnlineOrderItem::create([
                    'online_order_id'     => $order->id,
                    'product_id'          => $revItem->product_id,
                    'item_code_snapshot'  => $revItem->item_code_snapshot,
                    'item_name_snapshot'  => $revItem->item_name_snapshot,
                    'unit_snapshot'       => $revItem->unit_snapshot,
                    'qty_carton'          => $revItem->qty_carton,
                    'qty_pcs'             => $revItem->qty_pcs,
                    'total_pcs'           => $revItem->total_pcs,
                    'price_carton'        => $revItem->price_carton,
                    'price_piece'         => $revItem->price_piece,
                    'line_subtotal'       => $revItem->line_subtotal,
                ]);
            }

            // Update order financial totals
            $prevStatus = $order->status;
            $order->current_subtotal = $activeRevision->proposed_subtotal;
            $order->discount_type = $activeRevision->proposed_discount_type;
            $order->discount_rate = $activeRevision->proposed_discount_rate;
            $order->discount_amount = $activeRevision->proposed_discount_amount;
            $order->delivery_charges = $activeRevision->proposed_delivery_charges;
            $order->final_total = $activeRevision->proposed_final_total;
            $order->customer_accepted_at = now();
            $order->status = 'under_review'; // ready for final admin confirmation
            $order->save();

            // Mark revision as accepted
            $activeRevision->revision_status = 'accepted';
            $activeRevision->customer_accepted_at = now();
            $activeRevision->save();

            // Log history
            OnlineOrderHistory::create([
                'online_order_id' => $order->id,
                'action'          => 'revision_accepted',
                'previous_status' => $prevStatus,
                'new_status'      => 'under_review',
                'actor_type'      => 'Customer',
                'actor_id'        => $customerUser->id,
                'description'     => "Customer {$customerUser->name} accepted Revision #{$activeRevision->revision_number}. Payable Amount: Rs. " . number_format($order->final_total, 2),
                'created_at'      => now(),
            ]);
        });

        return redirect()->back()->with('success', "You have accepted the revised order! Our team will now confirm and process your shipment.");
    }

    /**
     * Customer rejects proposed revision.
     */
    public function rejectRevision(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $customerUser = Auth::guard('customer')->user();

        $order = OnlineOrder::where('id', $id)
            ->where('customer_user_id', $customerUser->id)
            ->firstOrFail();

        if ($order->status !== 'awaiting_customer_acceptance') {
            return redirect()->back()->with('error', 'This order is not currently awaiting revision acceptance.');
        }

        $activeRevision = OnlineOrderRevision::where('online_order_id', $order->id)
            ->whereIn('revision_status', ['awaiting_customer_acceptance', 'draft'])
            ->latest('revision_number')
            ->first();

        if (!$activeRevision) {
            return redirect()->back()->with('error', 'No pending revision found to reject.');
        }

        DB::transaction(function () use ($order, $activeRevision, $customerUser, $request) {
            $prevStatus = $order->status;
            $order->status = 'under_review';
            $order->save();

            $activeRevision->revision_status = 'rejected';
            $activeRevision->customer_rejected_at = now();
            $activeRevision->save();

            OnlineOrderHistory::create([
                'online_order_id' => $order->id,
                'action'          => 'revision_rejected',
                'previous_status' => $prevStatus,
                'new_status'      => 'under_review',
                'actor_type'      => 'Customer',
                'actor_id'        => $customerUser->id,
                'description'     => "Customer {$customerUser->name} rejected Revision #{$activeRevision->revision_number}." . ($request->reason ? " Reason: {$request->reason}" : ''),
                'reason'          => $request->reason,
                'created_at'      => now(),
            ]);
        });

        return redirect()->back()->with('success', "You have declined the proposed revision. An admin will review your order again.");
    }
}
