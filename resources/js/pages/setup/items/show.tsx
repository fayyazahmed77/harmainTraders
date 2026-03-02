import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    TrendingUp, 
    TrendingDown, 
    Package, 
    DollarSign, 
    History, 
    ChevronLeft, 
    ChevronRight,
    ArrowRight,
    Search,
    Layers,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ShoppingBag,
    Coins,
    Calendar,
    Settings,
    LayoutDashboard,
    Building2,
    Activity,
    Box,
    FileText,
    Info,
    MoveUpRight,
    Percent
} from "lucide-react";
import { format } from "date-fns";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { useAppearance } from "@/hooks/use-appearance";
import { cn } from "@/lib/utils";

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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function ItemShow({ item, stats, recentPurchases, recentSales, pagination }: Props) {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={[
                    { title: "Catalog", href: "/items" },
                    { title: item.title, href: "#" }
                ]} />

                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* PROFESSIONAL HEADER BAR */}
                    <div className="border-b bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                                <Box size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    {item.title}
                                    <Badge variant={item.is_active ? "default" : "secondary"} className="text-[10px] h-5 py-0">
                                        {item.is_active ? "Active" : "Archived"}
                                    </Badge>
                                </h1>
                                <p className="text-xs text-zinc-500 font-medium">{item.company} &bull; {item.code}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center border rounded-md h-9 overflow-hidden bg-zinc-50/50 dark:bg-zinc-800/50">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-none border-r"
                                    disabled={!pagination.prev_id}
                                    onClick={() => pagination.prev_id && router.visit(`/items/${pagination.prev_id}/show`)}
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                                <span className="text-[11px] font-bold px-3 text-zinc-500">{pagination.current} / {pagination.total}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-none border-l"
                                    disabled={!pagination.next_id}
                                    onClick={() => pagination.next_id && router.visit(`/items/${pagination.next_id}/show`)}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 font-semibold"
                                onClick={() => router.visit(`/items/${item.id}/edit`)}
                            >
                                <Settings size={14} className="mr-2" />
                                Edit Item
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* MAIN COLUMN */}
                            <div className="lg:col-span-8 space-y-8">
                                
                                {/* SUMMARY CARDS */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex items-center justify-between text-zinc-500">
                                                <span className="text-[10px] font-black uppercase tracking-wider">Available Stock</span>
                                                <Package size={14} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                                    {Number(item.stock_1).toLocaleString()} <span className="text-sm font-medium text-zinc-400 ml-1">Pcs</span>
                                                </h3>
                                                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                                                    Approx. {Math.floor((item.stock_1 || 0) / (item.packing_qty || 1))} full cartons
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                                <span className="text-[10px] font-black uppercase tracking-wider">Gross Margin</span>
                                                <TrendingUp size={14} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                                    {stats.profit.margin.toFixed(1)}%
                                                </h3>
                                                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                                                    {formatCurrency(stats.profit.profit_per_pc)} profit per unit
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex items-center justify-between text-zinc-500">
                                                <span className="text-[10px] font-black uppercase tracking-wider">Item Valuation</span>
                                                <DollarSign size={14} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                                    {formatCurrency(item.trade_price)}
                                                </h3>
                                                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                                                    Standard trade rate
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* TRANSACTION HISTORY */}
                                <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                    <CardHeader className="p-6 border-b">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                    <History size={16} className="text-zinc-400" /> Activity registry
                                                </CardTitle>
                                                <CardDescription className="text-xs">Historical log of movements</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <Tabs defaultValue="sales" className="w-full">
                                        <div className="px-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-b">
                                            <TabsList className="bg-transparent h-10 p-0 gap-6">
                                                <TabsTrigger value="sales" className="rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 dark:data-[state=active]:border-white px-0 bg-transparent text-[11px] font-bold uppercase tracking-wider">
                                                    Sales (Out)
                                                </TabsTrigger>
                                                <TabsTrigger value="purchases" className="rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 dark:data-[state=active]:border-white px-0 bg-transparent text-[11px] font-bold uppercase tracking-wider">
                                                    Purchases (In)
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>
                                        <TabsContent value="sales" className="m-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-zinc-50/50 dark:bg-zinc-900/50">
                                                            <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-500 text-left border-b">Reference</th>
                                                            <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-500 text-left border-b">Consignee</th>
                                                            <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-500 text-right border-b">Net Value</th>
                                                            <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-500 text-right border-b">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y text-xs">
                                                        {recentSales.map((sale) => (
                                                            <tr key={sale.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30">
                                                                <td className="px-6 py-4">
                                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{sale.invoice}</span>
                                                                    <span className="text-[10px] text-zinc-500">{format(new Date(sale.date), "dd MMM, yyyy")}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium">{sale.customer?.title || "Walk-in"}</td>
                                                                <td className="px-6 py-4 text-right font-bold">{formatCurrency(sale.net_total)}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <Badge variant="outline" className="text-[9px] h-5">Completed</Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {recentSales.length === 0 && (
                                                            <tr>
                                                                <td colSpan={4} className="py-12 text-center text-zinc-400 text-xs font-medium">No sales history found for this item.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="purchases" className="m-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-zinc-50/50 dark:bg-zinc-900/50">
                                                            <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-500 text-left border-b">Reference</th>
                                                            <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-500 text-left border-b">Supplier</th>
                                                            <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-500 text-right border-b">Net Value</th>
                                                            <th className="px-6 py-3 text-[10px] uppercase font-bold text-zinc-500 text-right border-b">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y text-xs">
                                                        {recentPurchases.map((purchase) => (
                                                            <tr key={purchase.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30">
                                                                <td className="px-6 py-4">
                                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{purchase.invoice}</span>
                                                                    <span className="text-[10px] text-zinc-500">{format(new Date(purchase.date), "dd MMM, yyyy")}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium">{purchase.supplier?.title || "Manual Inbound"}</td>
                                                                <td className="px-6 py-4 text-right font-bold">{formatCurrency(purchase.net_total)}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <Badge variant="outline" className="text-[9px] h-5">Invoiced</Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {recentPurchases.length === 0 && (
                                                            <tr>
                                                                <td colSpan={4} className="py-12 text-center text-zinc-400 text-xs font-medium">No purchase history recorded.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </Card>

                                {/* ANALYTICS BAR GRAPH PLACEHOLDER */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                        <CardHeader className="p-5 pb-2">
                                            <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <PieChart size={14} /> Unit Profitability
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-zinc-500">Gross Realized Profit</span>
                                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.profit.gross_profit)}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-zinc-500">Margin Efficiency</span>
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white">{stats.profit.margin.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(stats.profit.margin, 100)}%` }} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                        <CardHeader className="p-5 pb-2">
                                            <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <BarChart3 size={14} /> Inventory analysis
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-zinc-500">Risk Threshold</span>
                                                <span className={cn("text-xs font-bold uppercase", item.stock_1 <= item.reorder_level ? "text-rose-500" : "text-emerald-500")}>
                                                    {item.stock_1 <= item.reorder_level ? "Refill required" : "Healthy levels"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-zinc-500">Reorder Criticality</span>
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white">{Math.round((item.stock_1 / (item.reorder_level || 1)) * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className={cn("h-full rounded-full transition-all", item.stock_1 <= item.reorder_level ? "bg-rose-500" : "bg-zinc-900 dark:bg-zinc-400")} style={{ width: `${Math.min((item.stock_1 / (item.reorder_level || 1)) * 100, 100)}%` }} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* SIDEBAR COLUMN */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* PRODUCT SPECS */}
                                <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                    <CardHeader className="p-6 border-b">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                            <Info size={14} /> Item Specifications
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y text-[13px]">
                                            <div className="px-6 py-4 flex justify-between items-center">
                                                <span className="text-zinc-500 font-medium">Packaging Unit</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.packing_qty || 0} Pcs/Carton</span>
                                            </div>
                                            <div className="px-6 py-4 flex justify-between items-center">
                                                <span className="text-zinc-500 font-medium">Logistics Weight</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.weight || 0} KG</span>
                                            </div>
                                            <div className="px-6 py-4 flex justify-between items-center">
                                                <span className="text-zinc-500 font-medium">Warehouse Storage</span>
                                                <Badge variant="outline" className="font-bold border-zinc-200 dark:border-zinc-800">{item.shelf || "Not Assigned"}</Badge>
                                            </div>
                                            <div className="px-6 py-4 flex justify-between items-center">
                                                <span className="text-zinc-500 font-medium">Inventory Model</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100 italic">FIFO (Standard)</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* TAX & COMPLIANCE */}
                                <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                    <CardHeader className="p-6 border-b">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                            <Percent size={14} /> Tax Compliance
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y text-[13px]">
                                            <div className="px-6 py-4 flex justify-between items-center">
                                                <span className="text-zinc-500 font-medium">GST (%)</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.gst_percent || 0}%</span>
                                            </div>
                                            <div className="px-6 py-4 flex justify-between items-center">
                                                <span className="text-zinc-500 font-medium">WHT (Filer)</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.adv_tax_filer || 0}%</span>
                                            </div>
                                            <div className="px-6 py-4 flex justify-between items-center">
                                                <span className="text-zinc-500 font-medium">WHT (Non-Filer)</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.adv_tax_non_filer || 0}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* PERSISTENCE DATA */}
                                <Card className="shadow-none border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <CardBody className="p-6 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                            <Calendar size={12} /> System Registry
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Creation Point</p>
                                                <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                                                    {format(new Date(item.created_at), "MMMM dd, yyyy @ HH:mm")}
                                                </p>
                                            </div>
                                            <Separator className="bg-zinc-100 dark:bg-zinc-800" />
                                            <div>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Last Interaction</p>
                                                <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                                                    {format(new Date(item.updated_at), "MMMM dd, yyyy @ HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* QUICK ACTIONS / BANNER */}
                                <div className="p-6 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black space-y-4 shadow-xl">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Revenue Target</h4>
                                        <p className="text-2xl font-black">{formatCurrency(item.retail)}</p>
                                    </div>
                                    <p className="text-[11px] font-medium opacity-70 leading-relaxed">
                                        Suggested retail price based on current trade valuation and market elasticity.
                                    </p>
                                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 border-none font-bold text-xs h-10 rounded-lg">
                                        Generate Inventory Report
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

const CardBody = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("p-6", className)}>
        {children}
    </div>
);
