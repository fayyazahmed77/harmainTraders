<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Saleman;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WalletController extends Controller
{
    // Index: Get Wallet History for a Salesman
    public function index($salesmanId)
    {
        $salesman = Saleman::with(['creator'])->findOrFail($salesmanId);

        $transactions = WalletTransaction::where('salesman_id', $salesmanId)
            ->with('sale:id,invoice,date')
            ->orderBy('created_at', 'desc')
            ->paginate(50)
            ->through(function ($t) {
                return [
                    'id' => $t->id,
                    'date' => $t->created_at->format('d M Y'),
                    'type' => $t->type,
                    'amount' => $t->amount,
                    'description' => $t->description,
                    'status' => $t->status,
                    'sale_invoice' => $t->sale ? $t->sale->invoice : '-',
                ];
            });

        $summary = [
            'total_earned' => WalletTransaction::where('salesman_id', $salesmanId)->where('type', 'credit')->sum('amount'),
            'total_paid' => WalletTransaction::where('salesman_id', $salesmanId)->where('type', 'debit')->sum('amount'), // Assuming debits are payments or deductions
            'current_balance' => $salesman->wallet_balance,
            'unpaid_commissions' => WalletTransaction::where('salesman_id', $salesmanId)
                ->where('type', 'credit')
                ->where('status', 'unpaid')
                ->sum('amount'),
        ];

        // Analytics: Last 30 Days Trend
        $dates = collect(range(29, 0))->map(function ($days) {
            return now()->subDays($days)->format('Y-m-d');
        });

        $analyticsCurrent = WalletTransaction::where('salesman_id', $salesmanId)
            ->where('created_at', '>=', now()->subDays(30))
            ->get()
            ->groupBy(function ($val) {
                return $val->created_at->format('Y-m-d');
            });

        $analytics = $dates->map(function ($date) use ($analyticsCurrent) {
            $dayTrans = $analyticsCurrent->get($date, collect());
            return [
                'date' => \Carbon\Carbon::parse($date)->format('d M'),
                'earned' => (float) round($dayTrans->where('type', 'credit')->sum('amount')), // Commission Earned
                'paid' => (float) round($dayTrans->where('type', 'debit')->sum('amount')),   // Commission Paid
            ];
        })->values();


        // Top Customers (by Sales Volume for this Salesman)
        $top_customers = \App\Models\Sales::where('salesman_id', $salesmanId)
            ->select('customer_id', DB::raw('sum(net_total) as total_volume'), DB::raw('count(id) as total_count'))
            // 'customer' points to Account model, using 'title' instead of 'name'
            ->with(['customer' => function ($query) {
                $query->select('id', 'title', 'city_id'); // Load city_id if relationship exists or is needed
            }, 'customer.city:id,name']) // Explicitly load the city relationship
            ->groupBy('customer_id')
            ->orderByDesc('total_volume')
            ->limit(5)
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->customer_id,
                    'name' => $c->customer ? $c->customer->title : 'Unknown', // Changed to title
                    'location' => $c->customer && $c->customer->city ? $c->customer->city->name : '-', // Assuming City model has name
                    'total_volume' => $c->total_volume,
                    'total_count' => $c->total_count,
                    'avatar' => $c->customer ? substr($c->customer->title, 0, 1) : '?',
                ];
            });

        // Recent Sales
        $recent_sales = \App\Models\Sales::where('salesman_id', $salesmanId)
            ->with(['customer:id,title']) // Changed to title
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($s) use ($salesman) {
                // Calculate commission amount for this sale
                $comm = round(($s->net_total * $salesman->commission_percentage) / 100);
                return [
                    'id' => $s->id,
                    'date' => $s->date,
                    'invoice_no' => $s->invoice_no ?? $s->invoice, // Fallback
                    'customer' => $s->customer ? $s->customer->title : 'Unknown', // Changed to title
                    'amount' => $s->net_total,
                    'commission' => $comm,
                    'status' => $s->status ?? 'completed', // Assuming status field
                ];
            });

        return inertia('setup/saleman/wallet', [
            'salesman' => $salesman,
            'transactions' => $transactions,
            'summary' => $summary,
            'analytics' => $analytics,
            'top_customers' => $top_customers,
            'recent_sales' => $recent_sales,
        ]);
    }

    // Store: Manual Transaction (Bonus, Penalty, Payment)
    public function store(Request $request, $salesmanId)
    {
        $request->validate([
            'type' => 'required|in:credit,debit',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
            'status' => 'required|in:paid,unpaid',
        ]);

        $salesman = Saleman::findOrFail($salesmanId);

        DB::transaction(function () use ($salesman, $request) {
            WalletTransaction::create([
                'salesman_id' => $salesman->id,
                'type' => $request->type,
                'amount' => round($request->amount),
                'description' => $request->description,
                'status' => $request->status,
            ]);

            if ($request->type === 'credit') {
                $salesman->increment('wallet_balance', round($request->amount));
            } else {
                $salesman->decrement('wallet_balance', round($request->amount));
            }
        });

        return redirect()->back()->with('success', 'Transaction added successfully.');
    }

    // Mark Pending Commission as Paid
    public function markPaid(Request $request, $transactionId)
    {
        $transaction = WalletTransaction::findOrFail($transactionId);

        if ($transaction->type !== 'credit' || $transaction->status === 'paid') {
            return redirect()->back()->with('error', 'Invalid transaction for payment marking.');
        }

        // When marking as paid, we essentially create a debit transaction or just mark it?
        // The user asked "Mark commission as paid" and "Manually adjust wallet".
        // If we just change status to 'paid', the balance remains high.
        // Usually, PAYING means giving money to salesman, which reduces the company's liability (wallet balance).
        // So, marking as paid should probably create a DEBIT transaction ("Payment for Commission X") OR reduce balance?
        // A standard ledger:
        // Credit: Commission Earned (+Balance)
        // Debit: Cash Given to Salesman (-Balance)
        //
        // If I just mark 'status' = 'paid', balance is still high.
        // I will assume "Mark as Paid" means "Record a Payment against this commission".
        // So I will update status AND create a Debit entry? Or just reduce balance?
        // Let's keep it simple: "Mark as Paid" just updates the status for tracking,
        // BUT to reduce balance, one must add a "Payment" transaction (Debit).
        //
        // However, user requirement 5: "Mark commission as paid".
        // And 4: "status (paid/unpaid)".
        // If I mark it as paid, does it mean the salesman got the money?
        // If yes, then balance should decrease.
        //
        // Let's implement `markPaid` as:
        // 1. Update status to 'paid'.
        // 2. Reduce wallet_balance (Debit).
        // 3. Optional: Create a "Payment" transaction linked to it?
        // The prompt says "Mark commission as paid".
        //
        // Alternative: The user might want to filter by "Unpaid" to see what is owed.
        // When they pay, they might want to pay in bulk or single.
        //
        // Let's stick to: "Mark as Paid" = Changed status to 'paid'.
        // AND create a corresponding Debit transaction to keep proper ledger.

        DB::transaction(function () use ($transaction) {
            $transaction->status = 'paid';
            $transaction->save();

            // Auto-create debit transaction
            WalletTransaction::create([
                'salesman_id' => $transaction->salesman_id,
                'sale_id'     => $transaction->sale_id, // Link to same sale if exists
                'type'        => 'debit',
                'amount'      => $transaction->amount,
                'description' => 'Payment for: ' . $transaction->description,
                'status'      => 'paid',
            ]);

            $salesman = Saleman::find($transaction->salesman_id);
            $salesman->wallet_balance -= $transaction->amount;
            $salesman->save();
        });

        return redirect()->back()->with('success', 'Commission marked as paid.');
    }
}
