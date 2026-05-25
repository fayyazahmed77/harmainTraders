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
        if ($user->hasRole('investor') || $user->hasRole('Investor')) {
            return redirect()->route('investor.dashboard');
        }
        if ($user->hasRole('Sales man') || $user->hasRole('salesman')) {
            return redirect()->route('salesman.dashboard');
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

        $totalSalesMonth = (float)Sales::whereMonth('date', $thisMonth)->whereYear('date', $thisYear)->sum('net_total');
        $totalOrdersMonth = Sales::whereMonth('date', $thisMonth)->whereYear('date', $thisYear)->count();
        $cancelledOrdersMonth = SalesReturn::whereMonth('date', $thisMonth)->whereYear('date', $thisYear)->count();
        $currentMonthName = $now->format('F');

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
                'totalSalesMonth' => $totalSalesMonth,
                'totalOrdersMonth' => $totalOrdersMonth,
                'cancelledOrdersMonth' => $cancelledOrdersMonth,
                'currentMonthName' => $currentMonthName,
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

    public function counterDashboard()
    {
        $userId = Auth::id();
        $timezone = 'Asia/Karachi';
        $today = Carbon::today($timezone);
        $yesterday = Carbon::yesterday($timezone);
        $startOfWeek = Carbon::now($timezone)->startOfWeek();
        $startOfMonth = Carbon::now($timezone)->startOfMonth();

        // 1. Get Sales IDs created by this user
        $userSalesIds = DB::table('audit_logs')
            ->where('user_id', $userId)
            ->where('module', 'Sales')
            ->where('action', 'created')
            ->pluck('module_id');

        // 2. Get Payment IDs created by this user
        $userPaymentIds = DB::table('audit_logs')
            ->where('user_id', $userId)
            ->where('module', 'Payment')
            ->where('action', 'created')
            ->pluck('module_id');

        // KPI calculations
        $todaySalesQuery = Sales::whereIn('id', $userSalesIds)->whereDate('date', $today);
        $yesterdaySalesQuery = Sales::whereIn('id', $userSalesIds)->whereDate('date', $yesterday);

        // KPI 1: Walk-in / Transactions served today
        $todayTxCount = (clone $todaySalesQuery)->count();
        $yesterdayTxCount = (clone $yesterdaySalesQuery)->count();
        $txDiff = $todayTxCount - $yesterdayTxCount;
        $txSubLabel = $txDiff >= 0 ? "↑ {$txDiff} vs yesterday" : "↓ " . abs($txDiff) . " vs yesterday";
        $txSubColor = $txDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

        // KPI 2: Counter sales today
        $todaySalesSum = (float)(clone $todaySalesQuery)->sum('net_total');
        $allDaysSalesSum = Sales::whereIn('id', $userSalesIds)->sum('net_total');
        $uniqueDaysCount = Sales::whereIn('id', $userSalesIds)->distinct('date')->count('date') ?: 1;
        $avgDailySales = $allDaysSalesSum / $uniqueDaysCount;
        $salesDiff = $todaySalesSum - $avgDailySales;
        
        $formatAmount = function($amount) {
            if ($amount >= 100000) {
                return 'Rs ' . number_format($amount / 100000, 2) . 'L';
            }
            return 'Rs ' . number_format($amount);
        };

        $salesSubLabel = $salesDiff >= 0 ? "↑ " . $formatAmount($salesDiff) . " vs avg" : "↓ " . $formatAmount(abs($salesDiff)) . " vs avg";
        $salesSubColor = $salesDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

        // KPI 3: Cash collected today
        $todayCashQuery = Payment::whereIn('id', $userPaymentIds)
            ->whereDate('date', $today)
            ->where('payment_method', 'Cash')
            ->where(function($q) {
                $q->whereNotIn('cheque_status', ['Canceled', 'Cancelled'])->orWhereNull('cheque_status');
            });
        $todayCashCollected = (float)(clone $todayCashQuery)->sum('amount');
        $todayCashTxCount = (clone $todayCashQuery)->count();
        $cashSubLabel = "{$todayCashTxCount} cash transactions";

        // KPI 4: Returns today
        $userSalesInvoices = Sales::whereIn('id', $userSalesIds)->pluck('invoice');
        $todayReturnsQuery = SalesReturn::whereIn('original_invoice', $userSalesInvoices)->whereDate('date', $today);
        $todayReturnsCount = (clone $todayReturnsQuery)->count();
        $todayReturnsAmount = (float)(clone $todayReturnsQuery)->sum('net_total');
        $returnsSubLabel = $formatAmount($todayReturnsAmount) . " reversed";

        $kpis = [
            [
                'title' => 'Walk-in customers',
                'value' => (string)$todayTxCount,
                'subLabel' => $txSubLabel,
                'subColor' => $txSubColor,
                'iconType' => 'users',
            ],
            [
                'title' => 'Counter sales today',
                'value' => $formatAmount($todaySalesSum),
                'subLabel' => $salesSubLabel,
                'subColor' => $salesSubColor,
                'iconType' => 'cash',
            ],
            [
                'title' => 'Cash collected',
                'value' => $formatAmount($todayCashCollected),
                'subLabel' => $cashSubLabel,
                'subColor' => 'text-muted-foreground',
                'iconType' => 'wallet',
            ],
            [
                'title' => 'Returns today',
                'value' => (string)$todayReturnsCount,
                'subLabel' => $returnsSubLabel,
                'subColor' => $todayReturnsAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
                'iconType' => 'refresh',
            ],
        ];

        // 4. Recent Invoices
        $getPaymentMethod = function($sale) {
            $paymentAllocation = DB::table('payment_allocations')
                ->join('payments', 'payment_allocations.payment_id', '=', 'payments.id')
                ->where('payment_allocations.bill_id', $sale->id)
                ->where('payment_allocations.bill_type', 'App\Models\Sales')
                ->select('payments.payment_method')
                ->first();
            
            return $paymentAllocation?->payment_method ?? ($sale->type === 'CREDIT' && $sale->remaining_amount > 0 ? 'Credit' : 'Cash');
        };

        $mapSale = function($sale) use ($getPaymentMethod) {
            return [
                'id' => $sale->invoice,
                'customer' => $sale->customer?->title ?? 'Walk-in (Cash)',
                'items' => $sale->no_of_items,
                'amount' => 'Rs ' . number_format($sale->net_total),
                'payment' => $getPaymentMethod($sale),
                'status' => $sale->remaining_amount <= 0 ? 'Paid' : ($sale->paid_amount > 0 ? 'Partial' : 'Pending'),
            ];
        };

        $todayInvoices = Sales::with('customer')
            ->whereIn('id', $userSalesIds)
            ->whereDate('date', $today)
            ->orderBy('id', 'desc')
            ->get()
            ->map($mapSale);

        $weekInvoices = Sales::with('customer')
            ->whereIn('id', $userSalesIds)
            ->whereBetween('date', [$startOfWeek, $today])
            ->orderBy('id', 'desc')
            ->get()
            ->map($mapSale);

        $monthInvoices = Sales::with('customer')
            ->whereIn('id', $userSalesIds)
            ->whereBetween('date', [$startOfMonth, $today])
            ->orderBy('id', 'desc')
            ->get()
            ->map($mapSale);

        // 5. Payment Methods
        $cashAmount = Payment::whereIn('id', $userPaymentIds)->whereDate('date', $today)->where('payment_method', 'Cash')->sum('amount');
        $chequeAmount = Payment::whereIn('id', $userPaymentIds)->whereDate('date', $today)->where('payment_method', 'Cheque')->sum('amount');
        $creditAmount = Sales::whereIn('id', $userSalesIds)->whereDate('date', $today)->sum('remaining_amount');
        $pmTotal = $cashAmount + $chequeAmount + $creditAmount;

        $pmData = [
            [
                'name' => 'Cash',
                'value' => $pmTotal > 0 ? round(($cashAmount / $pmTotal) * 100) : 0,
                'color' => '#4caf7a',
                'amount' => 'Rs ' . number_format($cashAmount)
            ],
            [
                'name' => 'Credit',
                'value' => $pmTotal > 0 ? round(($creditAmount / $pmTotal) * 100) : 0,
                'color' => '#4a9ede',
                'amount' => 'Rs ' . number_format($creditAmount)
            ],
            [
                'name' => 'Cheque',
                'value' => $pmTotal > 0 ? round(($chequeAmount / $pmTotal) * 100) : 0,
                'color' => '#e07b1a',
                'amount' => 'Rs ' . number_format($chequeAmount)
            ]
        ];

        // Last 7 days trend averages
        $last7DaysDate = Carbon::today($timezone)->subDays(6);
        $avgCash = Payment::whereIn('id', $userPaymentIds)->whereBetween('date', [$last7DaysDate, $today])->where('payment_method', 'Cash')->sum('amount') / 7;
        $avgCheque = Payment::whereIn('id', $userPaymentIds)->whereBetween('date', [$last7DaysDate, $today])->where('payment_method', 'Cheque')->sum('amount') / 7;
        $avgCredit = Sales::whereIn('id', $userSalesIds)->whereBetween('date', [$last7DaysDate, $today])->sum('remaining_amount') / 7;

        $trendData = [
            [
                'name' => 'Cash',
                'value' => $pmTotal > 0 ? round(($cashAmount / $pmTotal) * 100) : 0,
                'color' => '#4caf7a',
                'amount' => 'Rs ' . number_format($avgCash)
            ],
            [
                'name' => 'Credit',
                'value' => $pmTotal > 0 ? round(($creditAmount / $pmTotal) * 100) : 0,
                'color' => '#4a9ede',
                'amount' => 'Rs ' . number_format($avgCredit)
            ],
            [
                'name' => 'Cheque',
                'value' => $pmTotal > 0 ? round(($chequeAmount / $pmTotal) * 100) : 0,
                'color' => '#e07b1a',
                'amount' => 'Rs ' . number_format($avgCheque)
            ]
        ];

        // 6. Hourly Sales
        $hourlyData = [];
        $nowHour = Carbon::now($timezone)->hour;

        // Dynamic hours range: standard 8am to 4pm (16), but auto-expanding if now or sales exceed that range
        $earliestHour = 8;
        $minSalesHour = DB::table('sales')
            ->whereIn('id', $userSalesIds)
            ->whereDate('date', $today)
            ->selectRaw('MIN(HOUR(DATE_ADD(created_at, INTERVAL 5 HOUR))) as min_hour')
            ->value('min_hour');
        if ($minSalesHour !== null && $minSalesHour < $earliestHour && $minSalesHour >= 0) {
            $earliestHour = (int)$minSalesHour;
        }

        $latestHour = max(16, $nowHour);
        $maxSalesHour = DB::table('sales')
            ->whereIn('id', $userSalesIds)
            ->whereDate('date', $today)
            ->selectRaw('MAX(HOUR(DATE_ADD(created_at, INTERVAL 5 HOUR))) as max_hour')
            ->value('max_hour');
        if ($maxSalesHour !== null && $maxSalesHour > $latestHour) {
            $latestHour = (int)$maxSalesHour;
        }

        $hours = [];
        for ($h = $earliestHour; $h <= $latestHour; $h++) {
            $formattedTime = ($h === 12) ? '12pm' : (($h === 0 || $h === 24) ? '12am' : (($h > 12) ? ($h - 12) . 'pm' : $h . 'am'));
            $hours[$h] = $formattedTime;
        }

        foreach ($hours as $h => $label) {
            if ($h > $nowHour) {
                $hourlyData[] = [
                    'time' => $label,
                    'sales' => null,
                    'cash' => null,
                ];
            } else {
                $salesSum = Sales::whereIn('id', $userSalesIds)
                    ->whereDate('date', $today)
                    ->whereRaw('HOUR(DATE_ADD(created_at, INTERVAL 5 HOUR)) = ?', [$h])
                    ->sum('net_total');
                $cashSum = Payment::whereIn('id', $userPaymentIds)
                    ->whereDate('date', $today)
                    ->whereRaw('HOUR(DATE_ADD(created_at, INTERVAL 5 HOUR)) = ?', [$h])
                    ->where('payment_method', 'Cash')
                    ->sum('amount');
                $hourlyData[] = [
                    'time' => $label,
                    'sales' => (float)$salesSum ?: 0,
                    'cash' => (float)$cashSum ?: 0,
                ];
            }
        }

        // 7. Top Products sold today
        $topProducts = DB::table('sales_items')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->join('items', 'sales_items.item_id', '=', 'items.id')
            ->whereIn('sales.id', $userSalesIds)
            ->whereDate('sales.date', $today)
            ->select(
                'items.title as name',
                DB::raw('SUM(sales_items.total_pcs) as units'),
                'items.reorder_level'
            )
            ->groupBy('items.id', 'items.title', 'items.reorder_level')
            ->orderByDesc('units')
            ->take(6)
            ->get();

        if ($topProducts->isEmpty()) {
            $topProducts = DB::table('sales_items')
                ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
                ->join('items', 'sales_items.item_id', '=', 'items.id')
                ->whereIn('sales.id', $userSalesIds)
                ->select(
                    'items.title as name',
                    DB::raw('SUM(sales_items.total_pcs) as units'),
                    'items.reorder_level'
                )
                ->groupBy('items.id', 'items.title', 'items.reorder_level')
                ->orderByDesc('units')
                ->take(6)
                ->get();
        }

        $topProductsMapped = $topProducts->map(function($prod, $idx) {
            $item = Items::where('title', $prod->name)->first();
            $totalStock = $item ? ($item->stock_1 * ($item->packing_qty ?: 1) + $item->stock_2) : 0;
            return [
                'rank' => $idx + 1,
                'name' => $prod->name,
                'units' => (int)$prod->units,
                'max' => 50,
                'lowStock' => $totalStock <= $prod->reorder_level
            ];
        });

        // 8. Shift Summary
        $shiftSales = (float)Sales::whereIn('id', $userSalesIds)->whereDate('date', $today)->sum('net_total');
        $shiftReturns = (float)SalesReturn::whereIn('original_invoice', $userSalesInvoices)->whereDate('date', $today)->sum('net_total');
        
        $shiftSummary = [
            'walkIn' => (string)$todayTxCount,
            'invoices' => (string)$todayTxCount,
            'cashCollected' => 'Rs ' . number_format($todayCashCollected),
            'creditSales' => 'Rs ' . number_format($creditAmount),
            'returns' => 'Rs ' . number_format($todayReturnsAmount),
            'netShiftSales' => 'Rs ' . number_format($shiftSales - $shiftReturns),
        ];

        // 9. Alerts
        $lowStockItems = Items::whereRaw('(IFNULL(stock_1, 0) * IFNULL(packing_qty, 1)) + IFNULL(stock_2, 0) <= reorder_level')->take(2)->get();
        $pendingCheques = Payment::whereIn('id', $userPaymentIds)->where('payment_method', 'Cheque')->where('cheque_status', 'Pending')->take(2)->get();
        
        $alerts = [];
        foreach ($lowStockItems as $item) {
            $totalStock = ($item->stock_1 * ($item->packing_qty ?: 1) + $item->stock_2);
            $alerts[] = [
                'dotClass' => 'bg-red-500',
                'text' => "{$item->title} — only {$totalStock} units left",
                'sub' => 'Low stock warning'
            ];
        }
        foreach ($pendingCheques as $cheque) {
            $days = Carbon::parse($cheque->cheque_date)->diffInDays(Carbon::today());
            $alerts[] = [
                'dotClass' => 'bg-orange-500',
                'text' => "Cheque no {$cheque->cheque_no} due in {$days} days — Rs " . number_format($cheque->amount),
                'sub' => 'Follow up required'
            ];
        }
        if ($todayCashCollected > 0) {
            $alerts[] = [
                'dotClass' => 'bg-emerald-500',
                'text' => 'Cash drawer balanced — Rs ' . number_format($todayCashCollected),
                'sub' => 'Last verified recently'
            ];
        }

        return Inertia::render('Salesman/CounterDashboard', [
            'kpis' => $kpis,
            'todayInvoices' => $todayInvoices,
            'weekInvoices' => $weekInvoices,
            'monthInvoices' => $monthInvoices,
            'paymentMethods' => $pmData,
            'trendData' => $trendData,
            'hourlyData' => $hourlyData,
            'topProducts' => $topProductsMapped,
            'shiftSummary' => $shiftSummary,
            'alerts' => $alerts,
        ]);
    }
}
