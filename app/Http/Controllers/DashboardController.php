<?php

namespace App\Http\Controllers;

use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\Items;
use App\Models\Account;
use App\Models\SalesReturn;
use App\Models\ItemCategory;
use App\Services\ReportBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    protected $reportBuilder;

    public function __construct(ReportBuilder $reportBuilder)
    {
        $this->reportBuilder = $reportBuilder;
    }

    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($user->hasRole('Investor')) {
            return redirect()->route('investor.dashboard');
        }

        $now = Carbon::now();
        $today = Carbon::today();
        $thisMonth = $now->month;
        $thisYear = $now->year;
        $last7Days = $now->copy()->subDays(6);

        // Daily Summary Stats
        $dailySales      = Sales::whereDate('date', $today)->count();
        $dailyPurchases  = Purchase::whereDate('date', $today)->count();
        $dailyExpenses   = Payment::whereDate('date', $today)->whereHas('account', function($q) {
            $q->where('type', 4); // Expense account type
        })->where(function($q) {
            $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
        })->sum('amount');
        $dailyRecoveries = Payment::whereDate('date', $today)->where('type', 'RECEIPT')
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
            })->sum('amount');
        
        $dailySalesRevenue = (float)Sales::whereDate('date', $today)->sum('net_total');
        $dailyPurchaseCost = (float)Purchase::whereDate('date', $today)->sum('net_total');
        $dailyProfit = $dailySalesRevenue - $dailyPurchaseCost - (float)$dailyExpenses;

        $dailySummary = [
            'dailySales' => $dailySales,
            'dailyPurchases' => $dailyPurchases,
            'dailyExpenses' => (float)$dailyExpenses,
            'dailyRecoveries' => (float)$dailyRecoveries,
            'dailyProfit' => (float)$dailyProfit,
        ];

        // 1. Stat Cards
        $totalSalesYear = (float)Sales::whereYear('date', $thisYear)->sum('net_total');
        $totalOrdersYear = Sales::whereYear('date', $thisYear)->count();
        $cancelledOrdersYear = SalesReturn::whereYear('date', $thisYear)->count();
        $totalCustomers = Account::where('sale', 1)->count();

        // Weekly Order Chart (Last 7 Days)
        $orderChart = DB::table('sales')
            ->where('date', '>=', $last7Days)
            ->select(
                DB::raw("DATE_FORMAT(date, '%a') as day"),
                DB::raw("COUNT(*) as orders"),
                DB::raw("DATE(date) as full_date")
            )
            ->groupBy('full_date', 'day')
            ->orderBy('full_date', 'asc')
            ->get();

        // 2. Shop by Category (Heatmap)
        // Get top 5 categories by sales volume
        $categories = ItemCategory::select('id', 'name')
            ->whereHas('items.salesItems')
            ->withCount('items as sales_count')
            ->orderByDesc('sales_count')
            ->take(5)
            ->get();

        $heatmapData = [];
        $daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        foreach ($categories as $cat) {
            $values = [];
            foreach ($daysOfWeek as $day) {
                $count = DB::table('sales_items')
                    ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
                    ->join('items', 'sales_items.item_id', '=', 'items.id')
                    ->where('items.category', $cat->id)
                    ->where(DB::raw("DATE_FORMAT(sales.date, '%a')"), $day)
                    ->where('sales.date', '>=', $now->copy()->subDays(30)) // Last 30 days for better distribution
                    ->count();
                $values[] = $count;
            }
            // Normalize values for heatmap (0 to 1)
            $max = count($values) > 0 ? max($values) : 1;
            $heatmapData[] = [
                'category' => $cat->name,
                'values' => array_map(function ($v) use ($max) {
                    return $max > 0 ? $v / $max : 0;
                }, $values)
            ];
        }

        // 3. Recent Customers (New Users replacement)
        $recentCustomers = Account::where('sale', 1)
            ->orderByDesc('created_at')
            ->take(4)
            ->get()
            ->map(function ($acc) {
                $names = explode(' ', $acc->title);
                $initials = (isset($names[0][0]) ? $names[0][0] : '') . (isset($names[1][0]) ? $names[1][0] : '');
                return [
                    'id' => $acc->id,
                    'name' => $acc->title,
                    'location' => $acc->city?->name ?? 'N/A',
                    'rating' => 5.0, // Default rating as we don't have this in DB
                    'avatar' => strtoupper($initials ?: 'CU')
                ];
            });

        // 4. Recent Purchases (Other Outlets replacement)
        $recentPurchases = Purchase::with(['supplier.city'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->take(3)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'city' => strtoupper($p->supplier?->city?->name ?? 'GENERAL'),
                    'rating' => 5.0,
                    'address' => $p->supplier?->address1 ?? 'No Address',
                    'phone' => $p->supplier?->mobile ?? $p->supplier?->telephone1 ?? 'N/A',
                    'invoice' => $p->invoice,
                    'amount' => $p->net_total
                ];
            });

        // 5. Recent Transactions (Delivered Status replacement)
        $recentTransactions = Payment::with('account')
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->take(8)
            ->get()
            ->map(function ($pay) {
                $status = 'Success';
                if ($pay->cheque_status === 'Canceled') $status = 'Failed';
                if ($pay->cheque_status === 'Pending') $status = 'Pending';

                return [
                    'date' => Carbon::parse($pay->date)->format('Y-m-d'),
                    'paymentVia' => $pay->payment_method,
                    'status' => $status,
                    'amount' => (float)$pay->amount,
                    'party' => $pay->account?->title ?? 'N/A'
                ];
            });

        // Available Funds Distribution (Calculated dynamically)
        $bankIds   = Account::where('type', 2)->pluck('id');
        $cashIds   = Account::where('type', 1)->pluck('id');
        $chequeIds = Account::where('type', 14)->pluck('id');

        $getFunds = function($ids) {
            if ($ids->isEmpty()) return 0;
            
            $opening = Account::whereIn('id', $ids)->sum('opening_balance');
            
            $totalIn = Payment::whereIn('payment_account_id', $ids)
                ->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Pending']);
                })->sum('amount');

            $totalOut = Payment::whereIn('payment_account_id', $ids)
                ->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereNull('cheque_status')
                      ->orWhere('cheque_status', '')
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Pending']);
                })->sum('amount');

            return (float)$opening + $totalIn - $totalOut;
        };

        $fundsData = [
            ['name' => 'Bank',   'value' => $getFunds($bankIds),   'color' => '#4a9ede'],
            ['name' => 'Cash',   'value' => $getFunds($cashIds),   'color' => '#4caf7a'],
            ['name' => 'Cheque', 'value' => $getFunds($chequeIds), 'color' => '#e07b1a'],
        ];

        // FEATURE 3: Sales & Recoveries Datasets
        $salesRecoveries = [];

        // Daily (Last 7 Days)
        $days = collect(range(6, 0))->map(fn($i) => Carbon::today()->subDays($i));
        $salesRecoveries['daily'] = $days->map(fn($d) => [
            'label' => $d->format('D'),
            'sales' => (float)Sales::whereDate('date', $d)->sum('net_total'),
            'recoveries' => (float)Payment::whereDate('date', $d)->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
                })->sum('amount'),
        ]);

        // Weekly (Last 4 Weeks)
        $weeks = collect(range(3, 0))->map(fn($i) => [
            'start' => Carbon::now()->subWeeks($i)->startOfWeek(),
            'end' => Carbon::now()->subWeeks($i)->endOfWeek(),
            'label' => 'W' . (4 - $i)
        ]);
        $salesRecoveries['weekly'] = $weeks->map(fn($w) => [
            'label' => $w['label'],
            'sales' => (float)Sales::whereBetween('date', [$w['start'], $w['end']])->sum('net_total'),
            'recoveries' => (float)Payment::whereBetween('date', [$w['start'], $w['end']])->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
                })->sum('amount'),
        ]);

        // Monthly (12 Months of current year)
        $months = collect(range(1, 12))->map(fn($m) => Carbon::create($thisYear, $m, 1));
        $salesRecoveries['monthly'] = $months->map(fn($m) => [
            'label' => $m->format('M'),
            'sales' => (float)Sales::whereMonth('date', $m->month)->whereYear('date', $m->year)->sum('net_total'),
            'recoveries' => (float)Payment::whereMonth('date', $m->month)->whereYear('date', $m->year)->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
                })->sum('amount'),
        ]);

        // Yearly (Last 5 Years)
        $years = collect(range(4, 0))->map(fn($i) => $thisYear - $i);
        $salesRecoveries['yearly'] = $years->map(fn($y) => [
            'label' => (string)$y,
            'sales' => (float)Sales::whereYear('date', $y)->sum('net_total'),
            'recoveries' => (float)Payment::whereYear('date', $y)->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
                })->sum('amount'),
        ]);

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'totalSalesYear' => $totalSalesYear,
                'totalOrdersYear' => $totalOrdersYear,
                'cancelledOrdersYear' => $cancelledOrdersYear,
                'totalCustomers' => $totalCustomers,
            ],
            'orderChartData' => $orderChart,
            'fundsData' => $fundsData,
            'salesRecoveries' => $salesRecoveries,
            'postDateCheques' => Payment::with('account')
                ->where('type', 'PAYMENT')
                ->whereNotNull('cheque_no')
                ->where('cheque_date', '>=', $today)
                ->orderBy('cheque_date')
                ->get()
                ->map(function($p) use ($today) {
                    $dueDate = Carbon::parse($p->cheque_date);
                    return [
                        'id' => $p->id,
                        'customer_name' => $p->account?->title ?? 'N/A',
                        'cheque_no' => $p->cheque_no,
                        'due_date' => $dueDate->format('Y-m-d'),
                        'amount' => (float)$p->amount,
                        'status' => strtolower($p->cheque_status ?: 'pending'),
                        'due_soon' => $dueDate->diffInDays($today) <= 7
                    ];
                }),
            'stockItems' => Items::with('category')
                ->select('*')
                ->selectRaw('(IFNULL(stock_1, 0) * IFNULL(packing_qty, 1)) + IFNULL(stock_2, 0) as total_qty')
                ->orderBy('total_qty', 'asc')
                ->take(20)
                ->get()
                ->map(fn($p) => [
                    'sku'       => $p->code,
                    'name'      => $p->title,
                    'category'  => $p->category?->name ?? 'Uncategorized',
                    'unit'      => $p->packing_size ?: 'Pcs',
                    'qty'       => (int)$p->total_qty,
                    'min_level' => (int)$p->reorder_level,
                    'status'    => $p->total_qty <= 0 ? 'out' : ($p->total_qty <= $p->reorder_level ? 'low' : 'ok'),
                ]),
            'stockSummary' => [
                'total_skus'    => Items::count(),
                'low_stock'     => Items::whereRaw('(IFNULL(stock_1, 0) * IFNULL(packing_qty, 1)) + IFNULL(stock_2, 0) <= reorder_level')->whereRaw('(IFNULL(stock_1, 0) * IFNULL(packing_qty, 1)) + IFNULL(stock_2, 0) > 0')->count(),
                'out_of_stock'  => Items::whereRaw('(IFNULL(stock_1, 0) * IFNULL(packing_qty, 1)) + IFNULL(stock_2, 0) <= 0')->count(),
            ],
            'recentCustomers' => $recentCustomers,
            'recentPurchases' => $recentPurchases,
            'recentTransactions' => $recentTransactions,
            // Keeping these for potential use or compatibility
            'dailySummary' => $dailySummary,
            'roiTrendData' => [],
            'breakdownData' => [],
            'paymentsTrendData' => [],
        ]);
    }

    public function salesOverview()
    {
        $now = Carbon::now();
        $thisMonth = $now->month;
        $thisYear = $now->year;
        $lastMonth = $now->copy()->subMonth()->month;
        $lastMonthYear = $now->copy()->subMonth()->year;

        // Metric Card Data
        $metrics = [
            'totalSales' => [
                'current' => Sales::whereMonth('date', $thisMonth)->whereYear('date', $thisYear)->count(),
                'last' => Sales::whereMonth('date', $lastMonth)->whereYear('date', $lastMonthYear)->count(),
            ],
            'newCustomers' => [
                'current' => Account::where('sale', 1)->whereMonth('created_at', $thisMonth)->whereYear('created_at', $thisYear)->count(),
                'last' => Account::where('sale', 1)->whereMonth('created_at', $lastMonth)->whereYear('created_at', $lastMonthYear)->count(),
            ],
            'returns' => [
                'current' => SalesReturn::whereMonth('date', $thisMonth)->whereYear('date', $thisYear)->count(),
                'last' => SalesReturn::whereMonth('date', $lastMonth)->whereYear('date', $lastMonthYear)->count(),
            ],
            'revenue' => [
                'current' => Sales::whereMonth('date', $thisMonth)->whereYear('date', $thisYear)->sum('net_total'),
                'last' => Sales::whereMonth('date', $lastMonth)->whereYear('date', $lastMonthYear)->sum('net_total'),
            ]
        ];

        // Performance Trend (8 Months)
        $performanceTrend = DB::table('sales')
            ->where('date', '>=', $now->copy()->subMonths(7)->startOfMonth())
            ->select(
                DB::raw("DATE_FORMAT(date, '%b') as month"),
                DB::raw("COUNT(*) as totalSales"),
                DB::raw("SUM(net_total) as totalRevenue"),
                DB::raw("YEAR(date) as y"),
                DB::raw("MONTH(date) as mo")
            )
            ->groupBy('y', 'mo', 'month')
            ->orderBy('y', 'asc')
            ->orderBy('mo', 'asc')
            ->get();

        // Latest 10 Orders
        $recentOrders = Sales::with('customer')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'info' => $sale->items()->first()?->item?->title ?? 'N/A',
                    'id' => '#' . $sale->invoice,
                    'date' => Carbon::parse($sale->date)->format('d M Y'),
                    'customer' => $sale->customer?->title ?? 'Walk-In',
                    'category' => $sale->items()->first()?->item?->category?->name ?? 'General',
                    'status' => $sale->status ?? 'Completed',
                    'items' => $sale->no_of_items,
                    'total' => 'Rs ' . $sale->net_total,
                ];
            });

        // Sales Growth Gauge (Compared to last month)
        $growth = 0;
        if ($metrics['totalSales']['last'] > 0) {
            $growth = (($metrics['totalSales']['current'] - $metrics['totalSales']['last']) / $metrics['totalSales']['last']) * 100;
        }

        return Inertia::render('Dashboard/SalesOverview', [
            'metrics' => $metrics,
            'performanceTrend' => $performanceTrend,
            'recentOrders' => $recentOrders,
            'growthPercentage' => round($growth, 1)
        ]);
    }
}
