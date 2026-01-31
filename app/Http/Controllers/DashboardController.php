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
        $now = Carbon::now();
        $thisMonth = $now->month;
        $thisYear = $now->year;
        $last7Days = $now->copy()->subDays(6);

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

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'totalSalesYear' => $totalSalesYear,
                'totalOrdersYear' => $totalOrdersYear,
                'cancelledOrdersYear' => $cancelledOrdersYear,
                'totalCustomers' => $totalCustomers,
            ],
            'orderChartData' => $orderChart,
            'heatmapData' => $heatmapData,
            'recentCustomers' => $recentCustomers,
            'recentPurchases' => $recentPurchases,
            'recentTransactions' => $recentTransactions,
            // Keeping these for potential use or compatibility
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
