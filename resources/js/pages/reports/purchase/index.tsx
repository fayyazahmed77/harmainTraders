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
import { ShoppingCart, Package, Users, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { FileText, FileSpreadsheet } from "lucide-react";

interface Supplier {
    id: number;
    title: string;
}

interface Purchase {
    id: number;
    date: string;
    invoice: string;
    supplier_name: string;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    net_total: number;
}

interface PurchaseData {
    summary: {
        total_purchases: number;
        total_items: number;
        supplier_count: number;
        average_purchase: number;
        purchase_count: number;
    };
    daily_trend: {
        date: string;
        total: number;
        count: number;
    }[];
    top_suppliers: {
        name: string;
        total: number;
        count: number;
    }[];
    purchases: Purchase[];
}

interface Props {
    suppliers: Supplier[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Reports", href: "/reports" },
    { title: "Purchase Reports", href: "/reports/purchase" },
];

export default function PurchaseReport({ suppliers }: Props) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [data, setData] = useState<PurchaseData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('reports.purchase'), {
                params: {
                    from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
                    to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
                    supplier_id: selectedSupplier !== 'all' ? selectedSupplier : null,
                },
                headers: { 'Accept': 'application/json' }
            });
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch purchase data", error);
            toast.error("Failed to load purchase report");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange, selectedSupplier]);

    const paginatedData = useMemo(() => {
        if (!data) return [];
        const start = pagination.pageIndex * pagination.pageSize;
        return data.purchases.slice(start, start + pagination.pageSize);
    }, [data, pagination]);

    const pageCount = data ? Math.ceil(data.purchases.length / pagination.pageSize) : 0;

    const columns: ColumnDef<Purchase>[] = [
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => format(new Date(row.original.date), 'dd MMM yyyy'),
        },
        {
            accessorKey: 'invoice',
            header: 'Invoice',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono">
                    {row.original.invoice}
                </Badge>
            )
        },
        {
            accessorKey: 'supplier_name',
            header: 'Supplier',
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
                <span className="font-bold text-purple-600">
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
            <Head title="Purchase Reports" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Purchase Reports</h1>
                                <p className="text-slate-500">Comprehensive purchase analysis and insights</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                {/* Date Picker */}
                                <DateRangePicker date={dateRange} setDate={setDateRange} />

                                {/* Button Group */}
                                <ButtonGroup>
                                    {/* PDF Export */}
                                    <Button
                                        asChild
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <a
                                            href={route("reports.purchase.export.pdf", {
                                                from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null,
                                                to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
                                                supplier_id: selectedSupplier !== "all" ? selectedSupplier : null,
                                            })}
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            PDF
                                        </a>
                                    </Button>

                                    {/* Excel Export */}
                                    <Button
                                        asChild
                                        className="bg-green-600 hover:bg-green-700 text-white"

                                    >
                                        <a
                                            href={route("reports.purchase.export.excel", {
                                                from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null,
                                                to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
                                                supplier_id: selectedSupplier !== "all" ? selectedSupplier : null,
                                            })}
                                        >
                                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                                            Excel
                                        </a>
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-4">
                            <Card className="border-l-4 border-l-purple-500 shadow-sm bg-purple-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                                    <div className="h-8 w-8 text-purple-500 border-2 border-purple-500 rounded-full p-2 flex items-center justify-center">
                                        <ShoppingCart className="h-6 w-6 text-purple-500"  />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {formatCurrency(data.summary.total_purchases)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{data.summary.purchase_count} transactions</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-blue-500 shadow-sm bg-blue-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                                    <div className="h-8 w-8 text-blue-500 border-2 border-blue-500 rounded-full p-2 flex items-center justify-center">
                                        <Package className="h-6 w-6 text-blue-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {data.summary.total_items.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Items purchased</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-green-500 shadow-sm bg-green-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                                    <div className="h-8 w-8 text-green-500 border-2 border-green-500 rounded-full p-2 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-green-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {data.summary.supplier_count}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Unique suppliers</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-orange-500 shadow-sm bg-orange-100">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Average Purchase</CardTitle>
                                    <div className="h-8 w-8 text-orange-500 border-2 border-orange-500 rounded-full p-2 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-orange-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {formatCurrency(data.summary.average_purchase)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Per transaction</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <ChartCard title="Daily Purchase Trend">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.daily_trend}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                                            <Area type="monotone" dataKey="total" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Top 10 Suppliers">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.top_suppliers} layout="vertical">
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
                                            <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total" barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Purchase Transactions</CardTitle>
                                <CardDescription>Detailed purchase records</CardDescription>
                                <div className="mt-4">
                                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                        <SelectTrigger className="w-full md:w-[300px]">
                                            <SelectValue placeholder="All Suppliers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Suppliers</SelectItem>
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
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
