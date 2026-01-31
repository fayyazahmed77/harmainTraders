import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import * as React from "react"
import { route } from "ziggy-js";
import { router } from "@inertiajs/react";
import {
    DollarSign,
    ShoppingCart,
    XCircle,
    Users,
    Phone,
    ChevronDown,
    ArrowRight,
    Star
} from "lucide-react";

interface DashboardProps {
    stats: {
        totalSalesYear: number;
        totalOrdersYear: number;
        cancelledOrdersYear: number;
        totalCustomers: number;
    };
    orderChartData: { day: string, orders: number }[];
    heatmapData: { category: string, values: number[] }[];
    recentCustomers: { id: number, name: string, location: string, rating: number, avatar: string }[];
    recentPurchases: { id: number, city: string, rating: number, address: string, phone: string, invoice: string, amount: number }[];
    recentTransactions: { date: string, paymentVia: string, status: "Success" | "Failed" | "Pending", amount: number, party: string }[];
}

export default function DashboardPage({ stats, orderChartData, heatmapData, recentCustomers, recentPurchases, recentTransactions }: DashboardProps) {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("en-US").format(num);
    };

    const statCards = [
        {
            title: "Total Revenue (Year)",
            value: formatCurrency(stats.totalSalesYear),
            icon: DollarSign,
            color: "orange",
            chartData: Array.from({ length: 20 }, (_, i) => ({ value: Math.random() * 100 + 50 })),
            type: "area" as const
        },
        {
            title: "Total Orders (Year)",
            value: formatNumber(stats.totalOrdersYear),
            icon: ShoppingCart,
            color: "orange",
            chartData: Array.from({ length: 12 }, (_, i) => ({ value: Math.random() * 80 + 20 })),
            type: "bar" as const
        },
        {
            title: "Total Returns (Year)",
            value: formatNumber(stats.cancelledOrdersYear),
            icon: XCircle,
            color: "orange",
            chartData: Array.from({ length: 20 }, (_, i) => ({ value: Math.random() * 60 + 30 })),
            type: "area" as const
        },
        {
            title: "Total Customers",
            value: formatNumber(stats.totalCustomers),
            icon: Users,
            color: "orange",
            chartData: Array.from({ length: 12 }, (_, i) => ({ value: Math.random() * 90 + 40 })),
            type: "bar" as const
        },
    ];

    // Days for heatmap
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Success": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
            case "Pending": return "bg-amber-100 text-amber-700 hover:bg-amber-100";
            case "Failed": return "bg-red-100 text-red-700 hover:bg-red-100";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getHeatmapColor = (value: number) => {
        if (value === 0) return "#f8fafc"; // Slate-50 for zero
        if (value < 0.2) return "#fff7ed";
        if (value < 0.4) return "#ffedd5";
        if (value < 0.6) return "#fed7aa";
        if (value < 0.8) return "#fdba74";
        return "#f97316";
    };

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-950">

                    {/* Top Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map((card, index) => (
                            <Card key={index} className="relative overflow-hidden border-gray-200 p-0 dark:border-gray-800">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                                            <h3 className="text-2xl font-bold text-sidebar-primary mt-1">{card.value}</h3>
                                        </div>
                                        <div className="p-2 bg-sidebar-primary/10 rounded-lg">
                                            <card.icon className="w-5 h-5 text-sidebar-primary" />
                                        </div>
                                    </div>
                                    <div className="h-16 -mx-6 -mb-6">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {card.type === "area" ? (
                                                <AreaChart data={card.chartData}>
                                                    <Area type="monotone" dataKey="value" stroke="#ea580c" fill="#ea580c" fillOpacity={0.2} strokeWidth={2} />
                                                </AreaChart>
                                            ) : (
                                                <BarChart data={card.chartData}>
                                                    <Bar dataKey="value" fill="#ea580c" radius={[2, 2, 0, 0]} />
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Main Content Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Order Chart */}
                        <Card className="lg:col-span-2 border-gray-200 dark:border-gray-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">Weekly Sales Volume</CardTitle>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => router.get(route('sale.index'))}>
                                        WEEKLY <ChevronDown className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                                <p className="text-xs text-sidebar-primary mt-2">Sales activity for the last 7 days</p>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={orderChartData} margin={{ top: 20, right: 10, bottom: 5, left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 10 }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shop by Category */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">Sales by Category</CardTitle>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => router.get(route('item-categories.index'))}>
                                        MONTHLY <ChevronDown className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                                <p className="text-xs text-sidebar-primary mt-2">Distribution across top 5 categories</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {/* Days Header */}
                                    <div className="grid grid-cols-8 gap-1 text-[10px] font-medium text-gray-500 mb-1 pl-16">
                                        {days.map(day => (
                                            <div key={day} className="text-center">{day}</div>
                                        ))}
                                    </div>
                                    {/* Heatmap Rows */}
                                    {heatmapData.length > 0 ? heatmapData.map((row, rowIndex) => (
                                        <div key={rowIndex} className="grid grid-cols-8 gap-1 items-center">
                                            <div className="col-span-1 text-[10px] font-semibold text-gray-700 pr-2 truncate text-right w-16" title={row.category}>{row.category}</div>
                                            {row.values.map((value, colIndex) => (
                                                <div
                                                    key={colIndex}
                                                    className="h-7 rounded-sm transition-colors duration-200 hover:ring-1 hover:ring-orange-300"
                                                    style={{ backgroundColor: getHeatmapColor(value) }}
                                                    title={`${Math.round(value * 100)}% volume`}
                                                />
                                            ))}
                                        </div>
                                    )) : (
                                        <div className="h-48 flex items-center justify-center text-xs text-gray-400">No data available</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Row - Data Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Recent Customers */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">Recent Customers</CardTitle>
                                    <Button variant="link" className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto" onClick={() => router.get(route('account.index'))}>
                                        VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recentCustomers.length > 0 ? recentCustomers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-sidebar-primary/10 flex items-center justify-center text-sidebar-primary font-bold text-sm group-hover:bg-sidebar-primary group-hover:text-white transition-colors capitalize">
                                                {user.avatar}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px]" title={user.name}>{user.name}</p>
                                                <p className="text-[10px] text-gray-500">City: {user.location}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <span className="text-[10px] font-medium text-gray-700">Verified</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="sm" className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-white h-7 text-xs px-3" onClick={() => router.get(route('account.edit', user.id))}>
                                            Details
                                        </Button>
                                    </div>
                                )) : (
                                    <div className="text-center py-4 text-gray-400 text-xs text-muted-foreground italic">No recent customers</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Purchases */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">Recent Purchases</CardTitle>
                                    <Button variant="link" className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto" onClick={() => router.get(route('purchase.index'))}>
                                        VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recentPurchases.length > 0 ? recentPurchases.map(purchase => (
                                    <div key={purchase.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0 hover:bg-gray-50/50 rounded-lg p-1 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                {purchase.city}
                                                <Badge variant="outline" className="text-[8px] h-4 px-1">{purchase.invoice}</Badge>
                                            </h4>
                                            <span className="text-xs font-bold text-orange-600">{formatCurrency(purchase.amount)}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-start gap-2 text-[10px] text-gray-500">
                                                <span className="text-gray-400">📍</span>
                                                <span className="truncate">{purchase.address}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-sidebar-primary">
                                                <Phone className="w-3 h-3" />
                                                <span className="font-medium">{purchase.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-4 text-gray-400 text-xs italic">No recent purchases</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card className="border-gray-200 dark:border-gray-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => router.get(route('payments.index'))}>
                                        LATEST <ChevronDown className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-gray-500 pb-2 border-b border-gray-100 uppercase tracking-tighter">
                                        <div>Date</div>
                                        <div>Party</div>
                                        <div>Status</div>
                                        <div className="text-right">Amount</div>
                                    </div>
                                    {recentTransactions.length > 0 ? recentTransactions.map((item, index) => (
                                        <div key={index} className="grid grid-cols-4 gap-2 text-[10px] items-center py-1.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                            <div className="text-gray-600 font-medium">{item.date}</div>
                                            <div className="text-gray-800 font-bold truncate" title={item.party}>{item.party}</div>
                                            <div>
                                                <Badge className={`text-[8px] h-4 px-1.5 font-bold uppercase shadow-none ring-0 ${getStatusColor(item.status)}`}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                            <div className="text-right font-bold text-gray-900">{formatNumber(item.amount)}</div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-4 text-gray-400 text-xs italic">No recent transactions</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
