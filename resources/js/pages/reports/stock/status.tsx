import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/Reports/DataTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, ReferenceLine } from 'recharts';
import { ChartCard } from '@/components/Reports/ChartCard';
import { route } from 'ziggy-js';
import { BreadcrumbItem } from '@/types';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

interface StockItem {
    id: number;
    name: string;
    code: string;
    category: string;
    current_stock: number;
    reorder_level: number;
    unit: string;
    packing_qty: number;
    stock_cartons: number;
    stock_loose: number;
    price_carton: number;
    price_loose: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Reports", href: "/reports" },
    { title: "Stock Status", href: "/reports/stock/status" },
];

const columns: ColumnDef<StockItem>[] = [
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>
    },
    {
        accessorKey: 'name',
        header: 'Item Name',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium">{row.original.name}</span>
                <span className="text-xs text-muted-foreground">Pack: {row.original.packing_qty}</span>
            </div>
        )
    },
    {
        accessorKey: 'category',
        header: 'Category',
    },
    {
        header: 'Stock Details',
        columns: [
            {
                accessorKey: 'stock_cartons',
                header: 'Ctn',
                cell: ({ row }) => <span className="font-semibold">{row.original.stock_cartons}</span>
            },
            {
                accessorKey: 'stock_loose',
                header: 'Loose',
                cell: ({ row }) => <span className="text-muted-foreground">{row.original.stock_loose}</span>
            },
            {
                accessorKey: 'current_stock',
                header: 'Total Pcs',
                cell: ({ row }) => (
                    <div className={`font-bold ${row.original.current_stock <= row.original.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                        {row.original.current_stock}
                    </div>
                ),
            }
        ]
    },
    {
        header: 'Price Info',
        columns: [
            {
                accessorKey: 'price_carton',
                header: 'Price (Ctn)',
                cell: ({ row }) => <span>{new Intl.NumberFormat('en-PK').format(row.original.price_carton)}</span>
            },
            {
                accessorKey: 'price_loose',
                header: 'Price (Loose)',
                cell: ({ row }) => <span>{new Intl.NumberFormat('en-PK').format(row.original.price_loose)}</span>
            }
        ]
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const isLow = row.original.current_stock <= row.original.reorder_level;
            return (
                <Badge variant={isLow ? "destructive" : "outline"} className={!isLow ? "bg-green-50 text-green-700 border-green-200" : ""}>
                    {isLow ? "Low Stock" : "In Stock"}
                </Badge>
            );
        }
    }
];

export default function StockStatus() {
    const [data, setData] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('reports.stock.status'), {
                headers: { 'Accept': 'application/json' }
            });
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch stock status", error);
            toast.error("Failed to load stock data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const paginatedData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return data.slice(start, start + pagination.pageSize);
    }, [data, pagination]);

    const pageCount = Math.ceil(data.length / pagination.pageSize);

    // Prepare chart data: Top 10 items by stock
    const chartData = useMemo(() => {
        return [...data]
            .sort((a, b) => b.current_stock - a.current_stock)
            .slice(0, 10)
            .map(item => ({
                name: item.name,
                stock: item.current_stock,
                reorder: item.reorder_level
            }));
    }, [data]);

    const totalItems = data.length;
    const lowStockItems = data.filter(i => i.current_stock <= i.reorder_level).length;
    const healthyStockItems = totalItems - lowStockItems;

    return (
        <>
            <Head title="Stock Status" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <div className="p-6 space-y-6 min-h-screen">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Stock Status</h1>
                                <p className="text-slate-500">Real-time inventory levels and alerts</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalItems}</div>
                                    <p className="text-xs text-muted-foreground">Active inventory items</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-red-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">{lowStockItems}</div>
                                    <p className="text-xs text-muted-foreground">Items below reorder level</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-green-500 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Healthy Stock</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{healthyStockItems}</div>
                                    <p className="text-xs text-muted-foreground">Items with sufficient stock</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                            <div className="lg:col-span-3">
                                <ChartCard title="Top Inventory Items">
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                <defs>
                                                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                                    interval={0}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                />
                                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="stock" radius={[4, 4, 0, 0]} fill="url(#colorStock)">
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.stock <= entry.reorder ? '#ef4444' : 'url(#colorStock)'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>
                            </div>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Detailed Inventory List</CardTitle>
                                <CardDescription>Complete list of all items and their current stock levels.</CardDescription>
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
