import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Package, DollarSign, Archive, History, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { router, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";

interface Props {
    item: any;
    stats: {
        purchase: {
            count: number;
            total_qty_pcs: number;
            total_value: number;
            avg_cost: number;
        };
        sale: {
            count: number;
            total_qty_pcs: number;
            total_value: number;
            avg_price: number;
        };
        profit: {
            cogs: number;
            gross_profit: number;
            margin: number;
            profit_per_pc: number;
        };
    };
    recentPurchases: any[];
    recentSales: any[];
    pagination: {
        prev_id: number | null;
        next_id: number | null;
        current: number;
        total: number;
    };
}

export default function ItemShow({ item, stats, recentPurchases, recentSales, pagination }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).format(amount);
    };

    // Calculate Stock Breakdown
    const stockFull = Math.floor((item.stock_1 || 0) / (item.packing_qty || 1));
    const stockLoose = (item.stock_1 || 0) % (item.packing_qty || 1);

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={[
                    { title: "Setup", href: "#" },
                    { title: "Items", href: "/items" },
                    { title: item.title, href: "#" }
                ]} />

                <div className="p-6 space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{item.title}</h1>
                                <Badge variant={item.is_active ? "default" : "secondary"}>
                                    {item.is_active ? "Active" : "Inactive"}
                                </Badge>
                                {item.is_import === 1 && <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Imported</Badge>}
                            </div>
                            <p className="text-gray-500 font-medium">{item.code} | {item.company} | {item.category?.name}</p>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Pagination Controls */}
                            <div className="flex items-center gap-3 mr-2">
                                <div className="flex items-center border border-blue-100 rounded-lg overflow-hidden bg-white shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-11 rounded-none border-r border-blue-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                        disabled={!pagination.prev_id}
                                        onClick={() => pagination.prev_id && router.visit(`/items/${pagination.prev_id}/show`)}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-11 rounded-none text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                        disabled={!pagination.next_id}
                                        onClick={() => pagination.next_id && router.visit(`/items/${pagination.next_id}/show`)}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="text-lg font-medium text-gray-700 tabular-nums">
                                    {pagination.current} <span className="text-gray-400 font-normal">of</span> {pagination.total}
                                </div>
                            </div>

                            <div className="h-10 w-px bg-gray-200"></div>

                            <div className="text-right">
                                <p className="text-sm text-gray-500">Current Stock</p>
                                <div className="text-2xl font-bold text-gray-900">{Number(item.stock_1).toLocaleString()} <span className="text-sm font-normal text-gray-500">pcs</span></div>
                            </div>
                            <div className="h-10 w-px bg-gray-200"></div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Trade Price</p>
                                <div className="text-xl font-bold text-gray-900">{formatCurrency(item.trade_price)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Purchase Stats */}
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-blue-700 flex items-center gap-2 text-lg">
                                    <Archive className="w-5 h-5" /> Purchase Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Purchased Value</span>
                                        <span className="font-bold text-lg text-blue-900">{formatCurrency(stats.purchase.total_value)}</span>
                                    </div>
                                    <Separator className="bg-blue-200" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Total Qty</p>
                                            <p className="font-semibold text-gray-900">{Number(stats.purchase.total_qty_pcs).toLocaleString()} pcs</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Avg Cost / Pc</p>
                                            <p className="font-semibold text-gray-900">{formatCurrency(stats.purchase.avg_cost)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sales Stats */}
                        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-emerald-700 flex items-center gap-2 text-lg">
                                    <TrendingUp className="w-5 h-5" /> Sales Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Sales Value</span>
                                        <span className="font-bold text-lg text-emerald-900">{formatCurrency(stats.sale.total_value)}</span>
                                    </div>
                                    <Separator className="bg-emerald-200" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Total Sold</p>
                                            <p className="font-semibold text-gray-900">{Number(stats.sale.total_qty_pcs).toLocaleString()} pcs</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Avg Price / Pc</p>
                                            <p className="font-semibold text-gray-900">{formatCurrency(stats.sale.avg_price)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profit Stats */}
                        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100 shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-violet-700 flex items-center gap-2 text-lg">
                                    <DollarSign className="w-5 h-5" /> Profitability
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Gross Profit</span>
                                        <span className="font-bold text-2xl text-violet-900">{formatCurrency(stats.profit.gross_profit)}</span>
                                    </div>
                                    <div className="w-full bg-violet-200 h-2 rounded-full overflow-hidden">
                                        <div className="bg-violet-600 h-full" style={{ width: `${Math.min(stats.profit.margin, 100)}%` }}></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Est. Margin</p>
                                            <p className="font-semibold text-gray-900">{stats.profit.margin.toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Profit / Pc</p>
                                            <p className="font-semibold text-gray-900">{formatCurrency(stats.profit.profit_per_pc)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stock Detail & History */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Stock & Basic Info */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Current Stock Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 items-center justify-center p-4 bg-slate-50 rounded-lg border border-dashed text-center">
                                        <div>
                                            <div className="text-3xl font-bold text-slate-700">{Math.floor((item.stock_1 || 0) / (item.packing_qty || 1))}</div>
                                            <div className="text-xs text-slate-500 uppercase font-semibold">Full Cartons</div>
                                            <div className="text-[10px] text-slate-400">Pack of {item.packing_qty}</div>
                                        </div>
                                        <div className="text-slate-300 text-xl font-light">+</div>
                                        <div>
                                            <div className="text-3xl font-bold text-slate-700">{(item.stock_1 || 0) % (item.packing_qty || 1)}</div>
                                            <div className="text-xs text-slate-500 uppercase font-semibold">Loose Pcs</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-500">Total Stock (Pcs)</span>
                                            <span className="font-semibold">{Number(item.stock_1).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-500">Reorder Level</span>
                                            <span className="font-semibold text-orange-600">{item.reorder_level || 0}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-gray-500">Retail Price</span>
                                            <span className="font-semibold">{formatCurrency(item.retail)}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500">Advance Tax (Filer)</span>
                                            <span className="font-semibold">{item.adv_tax_filer || 0}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Transaction History */}
                        <div className="lg:col-span-2">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="w-5 h-5" /> Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="sales" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                            <TabsTrigger value="sales">Recent Sales</TabsTrigger>
                                            <TabsTrigger value="purchases">Recent Purchases</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="sales">
                                            {recentSales.length > 0 ? (
                                                <div className="border rounded-md">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-gray-50 text-gray-500 font-medium">
                                                            <tr>
                                                                <th className="px-4 py-3">Date</th>
                                                                <th className="px-4 py-3">Invoice</th>
                                                                <th className="px-4 py-3">Customer</th>
                                                                <th className="px-4 py-3 text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {recentSales.map((sale: any) => (
                                                                <tr key={sale.id} className="hover:bg-gray-50/50">
                                                                    <td className="px-4 py-3">{format(new Date(sale.date), "MMM dd, yyyy")}</td>
                                                                    <td className="px-4 py-3 font-medium text-blue-600">{sale.invoice}</td>
                                                                    <td className="px-4 py-3">{sale.customer?.title || "Unknown"}</td>
                                                                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(sale.net_total)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">No recent sales found</div>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="purchases">
                                            {recentPurchases.length > 0 ? (
                                                <div className="border rounded-md">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-gray-50 text-gray-500 font-medium">
                                                            <tr>
                                                                <th className="px-4 py-3">Date</th>
                                                                <th className="px-4 py-3">Invoice</th>
                                                                <th className="px-4 py-3">Supplier</th>
                                                                <th className="px-4 py-3 text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {recentPurchases.map((purchase: any) => (
                                                                <tr key={purchase.id} className="hover:bg-gray-50/50">
                                                                    <td className="px-4 py-3">{format(new Date(purchase.date), "MMM dd, yyyy")}</td>
                                                                    <td className="px-4 py-3 font-medium text-blue-600">{purchase.invoice}</td>
                                                                    <td className="px-4 py-3">{purchase.supplier?.title || "Unknown"}</td>
                                                                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(purchase.net_total)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">No recent purchases found</div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
