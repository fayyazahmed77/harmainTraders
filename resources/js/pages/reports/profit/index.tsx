import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartCard } from '@/components/Reports/ChartCard';
import { DateRangePicker } from '@/components/Reports/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import axios from 'axios';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { DataTable } from '@/components/Reports/DataTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { BreadcrumbItem } from '@/types';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ProfitData {
    summary: {
        revenue: number;
        cogs: number;
        profit: number;
        margin: number;
    };
    trend: {
        date: string;
        revenue: number;
        cogs: number;
        profit: number;
    }[];
    top_items: {
        name: string;
        profit: number;
        revenue: number;
    }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Reports", href: "/reports" },
    { title: "Profit & Loss", href: "/reports/profit" },
];

export default function ProfitReport() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [data, setData] = useState<ProfitData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('reports.profit'), {
                params: {
                    from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
                    to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
                },
                headers: { 'Accept': 'application/json' }
            });
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch profit data", error);
            toast.error("Failed to load profit report");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (!data && loading) return <div className="p-6">Loading...</div>;
    if (!data) return null;

    return (
        <>
            <Head title="Profit & Loss" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <div className="p-6 space-y-6 min-h-screen">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
                                <p className="text-slate-500">Financial performance overview</p>
                            </div>
                            <DateRangePicker date={dateRange} setDate={setDateRange} />
                        </div>

                        <div className="grid gap-6 md:grid-cols-4">
                            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatCurrency(data.summary.revenue)}</div>
                                    <p className="text-xs text-muted-foreground">Total sales in period</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-orange-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">COGS</CardTitle>
                                    <Activity className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatCurrency(data.summary.cogs)}</div>
                                    <p className="text-xs text-muted-foreground">Cost of goods sold</p>
                                </CardContent>
                            </Card>
                            <Card className={`border-l-4 shadow-sm ${data.summary.profit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                    {data.summary.profit >= 0 ?
                                        <TrendingUp className="h-4 w-4 text-green-500" /> :
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                    }
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${data.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(data.summary.profit)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Revenue - COGS</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-purple-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                                    <Activity className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.summary.margin}%</div>
                                    <p className="text-xs text-muted-foreground">Net profit ratio</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="Profit Trend">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => format(new Date(str), 'dd MMM')}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <Tooltip
                                                labelFormatter={(str) => format(new Date(str), 'dd MMM yyyy')}
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                            <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Top 10 Profitable Items">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.top_items} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={150}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="profit" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Profit" barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
