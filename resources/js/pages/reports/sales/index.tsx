import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/Reports/DataTable';
import { DateRangePicker } from '@/components/Reports/DateRangePicker';
import { ChartCard } from '@/components/Reports/ChartCard';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { BreadcrumbItem } from '@/types';
import { CreditCard, Package, Users, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { FileText, FileSpreadsheet } from "lucide-react"
interface Customer {
    id: number;
    title: string;
}

interface Sale {
    id: number;
    date: string;
    invoice: string;
    customer_name: string;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    net_total: number;
}

interface SalesData {
    summary: {
        total_sales: number;
        total_items: number;
        customer_count: number;
        average_sale: number;
        sale_count: number;
    };
    daily_trend: {
        date: string;
        total: number;
        count: number;
    }[];
    top_customers: {
        name: string;
        total: number;
        count: number;
    }[];
    sales: Sale[];
}

interface Props {
    customers: Customer[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Reports", href: "/reports" },
    { title: "Sales Reports", href: "/reports/sales" },
];

export default function SalesReport({ customers }: Props) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [data, setData] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('reports.sales'), {
                params: {
                    from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
                    to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
                    customer_id: selectedCustomer !== 'all' ? selectedCustomer : null,
                },
                headers: { 'Accept': 'application/json' }
            });
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch sales data", error);
            toast.error("Failed to load sales report");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange, selectedCustomer]);

    const paginatedData = useMemo(() => {
        if (!data) return [];
        const start = pagination.pageIndex * pagination.pageSize;
        return data.sales.slice(start, start + pagination.pageSize);
    }, [data, pagination]);

    const pageCount = data ? Math.ceil(data.sales.length / pagination.pageSize) : 0;

    const columns: ColumnDef<Sale>[] = [
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => format(new Date(row.original.date), 'dd MMM yyyy'),
        },
        {
            accessorKey: 'invoice',
            header: 'Invoice',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono bg-green-50 text-green-700 border-green-200">
                    {row.original.invoice}
                </Badge>
            )
        },
        {
            accessorKey: 'customer_name',
            header: 'Customer',
        },
        {
            accessorKey: 'no_of_items',
            header: 'Items',
            cell: ({ row }) => (
                <span className="text-blue-600 font-semibold">
                    {row.original.no_of_items}
                </span>
            )
        },
        {
            accessorKey: 'gross_total',
            header: 'Gross Total',
            cell: ({ row }) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(row.original.gross_total),
        },
        {
            accessorKey: 'discount_total',
            header: 'Discount',
            cell: ({ row }) => row.original.discount_total > 0 ? (
                <span className="text-green-600">
                    {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(row.original.discount_total)}
                </span>
            ) : '-',
        },
        {
            accessorKey: 'net_total',
            header: 'Net Total',
            cell: ({ row }) => (
                <span className="font-bold text-green-600">
                    {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(row.original.net_total)}
                </span>
            ),
        },
    ];

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
            <Head title="Sales Reports" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <div className="p-6 space-y-6 min-h-screen">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
                                <p className="text-slate-500">Track and analyze sales performance</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <DateRangePicker date={dateRange} setDate={setDateRange} />

                                <ButtonGroup>
                                    <Button
                                        asChild
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <a
                                            href={route("reports.sales.export.pdf", {
                                                from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null,
                                                to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
                                                customer_id: selectedCustomer !== "all" ? selectedCustomer : null,
                                            })}
                                        >
                                            <FileText className="w-4 h-4 mr-1" /> PDF
                                        </a>
                                    </Button>

                                    <Button
                                        asChild
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <a
                                            href={route("reports.sales.export.excel", {
                                                from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null,
                                                to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
                                                customer_id: selectedCustomer !== "all" ? selectedCustomer : null,
                                            })}
                                        >
                                            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
                                        </a>
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-4">
                            <Card className="border-l-4 border-l-green-500 shadow-sm bg-green-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                    <CreditCard className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(data.summary.total_sales)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{data.summary.sale_count} transactions</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-blue-500 shadow-sm bg-blue-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                                    <Package className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {data.summary.total_items.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Items sold</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-purple-500 shadow-sm bg-purple-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                                    <Users className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {data.summary.customer_count}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Active customers</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-orange-500 shadow-sm bg-orange-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {formatCurrency(data.summary.average_sale)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Per transaction</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="Daily Sales Trend">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.daily_trend}>
                                            <defs>
                                                <linearGradient id="colorSalesTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => format(new Date(str), 'dd MMM')}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                labelFormatter={(str) => format(new Date(str), 'dd MMM yyyy')}
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorSalesTotal)" name="Total" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Top 10 Customers by Sales">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.top_customers} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={120}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} name="Total" barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Sales Transactions</CardTitle>
                                <CardDescription>Detailed sales records</CardDescription>
                                <div className="mt-4">
                                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                        <SelectTrigger className="w-full md:w-[300px]">
                                            <SelectValue placeholder="All Customers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Customers</SelectItem>
                                            {customers.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
