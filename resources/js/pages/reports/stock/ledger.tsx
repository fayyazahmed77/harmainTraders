import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/Reports/DataTable';
import { DateRangePicker } from '@/components/Reports/DateRangePicker';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { ChartCard } from '@/components/Reports/ChartCard';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { BreadcrumbItem } from '@/types';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Reports", href: "/reports" },
    { title: "Stock Ledger", href: "/reports/stock/ledger" },
];

interface Item {
    id: number;
    title: string;
}

interface LedgerRow {
    date: string;
    type: string;
    ref_id: number;
    qty_in: number;
    qty_out: number;
    amount: number;
    created_at: string;
}

interface SummaryData {
    total_purchase_qty: number;
    total_purchase_value: number;
    total_sale_qty: number;
    total_sale_value: number;
    avg_cost: number;
    profit: number;
}

interface PageProps {
    items: Item[];
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

export default function StockLedger({ items }: PageProps) {
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const [data, setData] = useState<LedgerRow[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [openingStock, setOpeningStock] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });

    const fetchData = async () => {
        if (!selectedItem) return;

        setLoading(true);
        try {
            const response = await axios.get(route('reports.stock.ledger'), {
                params: {
                    item_id: selectedItem,
                    from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
                    to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
                },
                headers: { 'Accept': 'application/json' }
            });

            setData(response.data.transactions);
            setOpeningStock(response.data.opening_stock);
            setSummary(response.data.summary);
        } catch (error) {
            console.error("Failed to fetch stock ledger", error);
            toast.error("Failed to load ledger data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedItem) {
            fetchData();
        }
    }, [selectedItem, dateRange]);

    // Calculate running balance
    const processedData = useMemo(() => {
        let balance = openingStock;
        return data.map(row => {
            balance = balance + Number(row.qty_in) - Number(row.qty_out);
            return { ...row, balance };
        });
    }, [data, openingStock]);

    // Current Available Stock is the balance of the last transaction, or opening stock if no transactions
    const currentStock = processedData.length > 0 ? processedData[processedData.length - 1].balance : openingStock;

    const columns: ColumnDef<LedgerRow & { balance: number }>[] = [
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => format(new Date(row.original.date), 'dd-MMM-yyyy'),
        },
        {
            accessorKey: 'type',
            header: 'Type',
        },
        {
            accessorKey: 'qty_in',
            header: 'In',
            cell: ({ row }) => row.original.qty_in > 0 ? row.original.qty_in : '-',
        },
        {
            accessorKey: 'qty_out',
            header: 'Out',
            cell: ({ row }) => row.original.qty_out > 0 ? row.original.qty_out : '-',
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => row.original.amount > 0 ? new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(row.original.amount) : '-',
        },
        {
            accessorKey: 'balance',
            header: 'Balance',
            cell: ({ row }) => <span className="font-bold">{row.original.balance}</span>,
        },
    ];

    // Client-side pagination
    const paginatedData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return processedData.slice(start, start + pagination.pageSize);
    }, [processedData, pagination]);

    const pageCount = Math.ceil(processedData.length / pagination.pageSize);

    // Chart Data
    const chartData = useMemo(() => {
        return processedData.map(row => ({
            date: format(new Date(row.date), 'dd MMM'),
            balance: row.balance
        }));
    }, [processedData]);

    const pieData = useMemo(() => {
        if (!summary) return [];
        // Show Revenue Breakdown: Cost vs Profit
        // If profit is negative (loss), we handle it gracefully? 
        // For Pie chart, values must be positive.
        // If loss, maybe show Cost and 0 Profit? Or visualize Loss separately?
        // Let's assume standard case: Revenue = Cost + Profit.
        // If Profit < 0, then Cost > Revenue.

        const revenue = summary.total_sale_value;
        const profit = summary.profit;
        const cost = revenue - profit; // This is effectively COGS

        // If profit is negative, we can't easily show it in a "breakdown of revenue" pie chart.
        // So we'll just show Cost and Net Profit (if positive).

        return [
            { name: 'Cost of Sales', value: cost > 0 ? cost : 0 },
            { name: 'Net Profit', value: profit > 0 ? profit : 0 },
        ];
    }, [summary]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

    return (
        <>
            <Head title="Stock Ledger Report" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <div className="p-6 space-y-6 min-h-screen">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Stock Ledger</h1>
                                <p className="text-slate-500">Detailed item movement and profitability analysis</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-[300px]">
                                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Select Item" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {items.map((item) => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DateRangePicker date={dateRange} setDate={setDateRange} />
                                <Button onClick={fetchData} disabled={!selectedItem || loading}>
                                    Apply
                                </Button>
                            </div>
                        </div>

                        {selectedItem && summary && (
                            <>
                                <div className="grid gap-6 md:grid-cols-4">
                                    <Card className="border-l-4 border-l-blue-500 shadow-sm bg-blue-50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                                            <TrendingDown className="h-4 w-4 text-blue-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-blue-700">
                                                {formatCurrency(summary.total_purchase_value)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Qty: {summary.total_purchase_qty}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-l-4 border-l-green-500 shadow-sm bg-green-50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-green-700">
                                                {formatCurrency(summary.total_sale_value)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Qty: {summary.total_sale_qty}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-l-4 border-l-purple-500 shadow-sm bg-purple-50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Est. Profit</CardTitle>
                                            <DollarSign className="h-4 w-4 text-purple-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
                                                {formatCurrency(summary.profit)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Margin: {summary.total_sale_value > 0 ? ((summary.profit / summary.total_sale_value) * 100).toFixed(1) : 0}%
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-l-4 border-l-orange-500 shadow-sm bg-orange-50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Avg Cost</CardTitle>
                                            <Activity className="h-4 w-4 text-orange-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-orange-700">
                                                {formatCurrency(summary.avg_cost)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Per Unit</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid gap-6 md:grid-cols-12">

                                    {/* Area Chart — col-8 */}
                                    <div className="md:col-span-9">
                                        <ChartCard title="Stock Movement History">
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData}>
                                                        <defs>
                                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            tick={{ fontSize: 12 }}
                                                            tickFormatter={(val) => val}
                                                        />
                                                        <YAxis tick={{ fontSize: 12 }} />
                                                        <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="balance"
                                                            stroke="#8884d8"
                                                            fillOpacity={1}
                                                            fill="url(#colorBalance)"
                                                            name="Stock Balance"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </ChartCard>
                                    </div>

                                    {/* Pie Chart — col-4 */}
                                    <div className="md:col-span-3">
                                        <ChartCard title="Profit Analysis (Revenue Breakdown)">
                                            <div className="h-[300px] w-full flex items-center justify-center">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={pieData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={100}
                                                            fill="#8884d8"
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {pieData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value: number) => formatCurrency(value)}
                                                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                                        />
                                                        <Legend verticalAlign="bottom" height={36} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </ChartCard>
                                    </div>

                                </div>


                                <Card className="shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Item Movement Details</CardTitle>
                                        <div className="text-sm font-medium px-3 py-1 bg-slate-100 rounded-full">
                                            Available Stock: <span className="text-blue-600 font-bold">{currentStock}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <DataTable
                                            columns={columns}
                                            data={paginatedData}
                                            pageCount={pageCount}
                                            pagination={pagination}
                                            onPaginationChange={setPagination}
                                            isLoading={loading}
                                        />
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
