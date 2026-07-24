import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbItem } from "@/types";
import {
    ArrowLeftIcon,
    PrinterIcon,
    DownloadIcon,
    Receipt,
    RefreshCcw,
    CheckCircle,
    RotateCw,
    Info,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    User,
    Building,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { router } from "@inertiajs/react";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────
type SaleStatus = "Completed" | "Partial Return" | "Returned" | "Pending Order" | "Canceled" | "Partial";

interface SaleItem {
    id: number;
    item_id: number;
    qty_carton: number;
    qty_pcs: number;
    total_pcs: number;
    trade_price: number;
    discount: number;
    gst_amount: number;
    subtotal: number;
    item: {
        id: number;
        title: string;
        code?: string;
        trade_price?: number;
        retail?: number;
        packing_qty?: number;
    };
}

interface SalesReturnItem {
    id: number;
    item_id: number;
    qty_carton: number;
    qty_pcs: number;
    total_pcs: number;
    trade_price: number;
    subtotal: number;
    item: {
        id: number;
        title: string;
    };
}

interface SalesReturn {
    id: number;
    invoice: string;
    date: string;
    original_invoice: string;
    net_total: number;
    remarks?: string;
    items: SalesReturnItem[];
}

interface Sale {
    id: number;
    date: string;
    invoice: string;
    code: string;
    status: SaleStatus;
    type?: string;
    customer?: { 
        id: number; 
        title: string; 
        code?: string;
        mobile?: string;
        telephone1?: string;
        item_category?: string | null;
    };
    salesman?: { id: number; name: string };
    firm?: {
        id: number;
        name: string;
    };
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    courier_charges: number;
    net_total: number;
    extra_discount?: number;
    total_receivable?: number;
    paid_amount: number;
    remaining_amount: number;
    items: SaleItem[];
    returns?: SalesReturn[];
    message_line?: {
        id: number;
        messageline: string;
    };
    message_line_id?: number;
    created_at?: string;
    updated_at?: string;
    is_online?: boolean;
}

interface Props {
    sale: Sale;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/" },
    { title: "Sales", href: "/sales" },
    { title: "Invoice Detail", href: "#" },
];

export default function View({ sale }: Props) {
    const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
    const [courierCharges, setCourierCharges] = useState<number>(sale.courier_charges || 0);
    const [isProcessing, setIsProcessing] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDateLong = (dateStr: string | null | undefined): string => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr + 'T00:00:00'); // prevent timezone shift
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDateTimeLong = (dateStr: string | null | undefined): string => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${formattedDate} ${formattedTime}`;
    };

    // Dynamic Financial Summary Calculations
    const netTotal = Number(sale.net_total || 0);
    const extraDiscount = Number(sale.extra_discount || 0);
    const totalReceivable = Number(sale.total_receivable || 0);
    
    const currentInvoiceTotal = Math.max(0, netTotal - extraDiscount);
    const paidAmount = Number(sale.paid_amount || 0);



    // Robust previous balance formula: total_receivable - (remaining_amount_stored + paid_amount_stored)
    const previousBalance = totalReceivable > 0 
        ? Math.max(0, Math.round(totalReceivable - (Number(sale.remaining_amount || 0) + Number(sale.paid_amount || 0)))) 
        : 0;

    const netBalance = currentInvoiceTotal + previousBalance - paidAmount;

    // Status colors
    const statusConfig = {
        Completed: {
            label: "Completed",
            color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300",
            icon: <CheckCircle className="h-3 w-3" />,
        },
        "Partial Return": {
            label: "Partial Return",
            color: "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300",
            icon: <RotateCw className="h-3 w-3" />,
        },
        Returned: {
            label: "Returned",
            color: "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300",
            icon: <RefreshCcw className="h-3 w-3" />,
        },
        "Pending Order": {
            label: "Pending Order",
            color: "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 animate-pulse",
            icon: <Clock className="h-3 w-3" />,
        },
        Canceled: {
            label: "Canceled",
            color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-300",
            icon: <AlertCircle className="h-3 w-3" />,
        },
        Partial: {
            label: "Partial Settled",
            color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300",
            icon: <RotateCw className="h-3 w-3" />,
        },
    };

    const currentStatus = statusConfig[sale.status] || statusConfig.Completed;



    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/20">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6 space-y-4 print:p-0">


                    {/* ──────────────────────────────────────────────────
                        HEADER: Action Buttons & Navigation
                        ────────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 print:hidden">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.history.back()}
                                className="h-9 w-9 md:h-10 md:w-10 rounded-xl shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl md:text-2xl font-black tracking-tight text-black dark:text-white flex items-center gap-2">
                                    Sales Invoice <span className="font-mono text-orange-500 bg-orange-500/5 dark:bg-orange-500/10 px-2 py-0.5 rounded-lg text-lg md:text-xl border border-orange-500/10">{sale.invoice}</span>
                                </h1>
                                <Badge className={cn("px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border flex items-center gap-1.5 shadow-none", currentStatus.color)}>
                                    {currentStatus.icon}
                                    {currentStatus.label}
                                </Badge>
                            </div>
                        </div>

                        {/* Action Buttons: Desktop, Laptop (compact), Mobile (3-dot menu) */}
                        <div className="flex items-center gap-2">
                            {sale.status === "Pending Order" && (
                                <>
                                    <Button
                                        onClick={() => setIsVerifyDialogOpen(true)}
                                        className="h-9 md:h-10 px-3 md:px-5 text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 md:gap-2"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="hidden sm:inline">Verify & Process</span>
                                        <span className="sm:hidden">Verify</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (confirm("Are you sure you want to cancel this order?")) {
                                                router.post(`/sales/${sale.id}/cancel`);
                                            }
                                        }}
                                        className="h-9 md:h-10 px-3 md:px-4 text-xs font-bold rounded-xl border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400 transition-all shadow-sm"
                                    >
                                        <AlertCircle className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Cancel Order</span>
                                    </Button>
                                </>
                            )}

                            {/* Mobile (3-dot More Menu) */}
                            <div className="md:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                                        >
                                            <MoreVertical className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                                        <DropdownMenuItem
                                            onClick={() => window.open(`/sales/${sale.id}/pdf?format=small`, "_blank")}
                                            className="cursor-pointer gap-2.5 text-xs font-bold py-2.5"
                                        >
                                            <PrinterIcon className="h-4 w-4 text-orange-500" />
                                            Print Small
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => window.open(`/sales/${sale.id}/pdf?format=big`, "_blank")}
                                            className="cursor-pointer gap-2.5 text-xs font-bold py-2.5"
                                        >
                                            <PrinterIcon className="h-4 w-4 text-blue-500" />
                                            Print Large
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => (window.location.href = `/sales/${sale.id}/download?format=big`)}
                                            className="cursor-pointer gap-2.5 text-xs font-bold py-2.5"
                                        >
                                            <DownloadIcon className="h-4 w-4 text-emerald-500" />
                                            Download PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Laptop (Compact Buttons: md to lg) */}
                            <div className="hidden md:flex lg:hidden items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`/sales/${sale.id}/pdf?format=small`, "_blank")}
                                    className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <PrinterIcon className="h-3.5 w-3.5 text-orange-500" />
                                    Print Small
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`/sales/${sale.id}/pdf?format=big`, "_blank")}
                                    className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <PrinterIcon className="h-3.5 w-3.5 text-blue-500" />
                                    Print Large
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => (window.location.href = `/sales/${sale.id}/download?format=big`)}
                                    className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <DownloadIcon className="h-3.5 w-3.5 text-emerald-500" />
                                    Download PDF
                                </Button>
                            </div>

                            {/* Desktop (Full Buttons: lg and up) */}
                            <div className="hidden lg:flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`/sales/${sale.id}/pdf?format=small`, "_blank")}
                                    className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <PrinterIcon className="h-4 w-4 text-orange-500" />
                                    Print Small
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`/sales/${sale.id}/pdf?format=big`, "_blank")}
                                    className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <PrinterIcon className="h-4 w-4 text-blue-500" />
                                    Print Large
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => (window.location.href = `/sales/${sale.id}/download?format=big`)}
                                    className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <DownloadIcon className="h-4 w-4 text-emerald-500" />
                                    Download PDF
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ──────────────────────────────────────────────────
                        INFORMATION SECTION: Inline Two-Column
                        ────────────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 px-1 py-3 border-b border-zinc-200 dark:border-zinc-800 text-xs print:hidden">
                        {/* Left Column */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Customer:</span>
                                <span className="text-black dark:text-white font-black uppercase">{sale.customer?.title || "Cash Customer"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Receipt className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Invoice #:</span>
                                <span className="text-orange-500 font-mono font-black">{sale.invoice}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Invoice Date:</span>
                                <span className="text-black dark:text-white font-mono font-bold">{formatDateLong(sale.date)}</span>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Created At:</span>
                                <span className="text-black dark:text-white font-mono font-bold">
                                    {sale.created_at ? formatDateTimeLong(sale.created_at) : formatDateLong(sale.date)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Agent:</span>
                                <span className="text-black dark:text-white font-black uppercase">{sale.salesman?.name || "Direct Sale"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Firm:</span>
                                <span className="text-black dark:text-white font-black uppercase">{sale.firm?.name || "Haramain Traders"}</span>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="space-y-1">
                            {/* SECTION 2: Invoice Items Table */}
                            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 py-0 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden">
                                <CardHeader className="px-6 py-1 pt-3 pb-0 bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Receipt className="h-5 w-5 text-primary" />
                                            <div>
                                                <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-200">Invoice Items Manifest</CardTitle>
                                                <CardDescription className="text-[10px] text-zinc-500 font-mono">Detailed manifest of products and transaction row totals</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-mono border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-none">
                                            SID_{sale.id}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse table-auto">
                                        <thead>
                                            <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                                                <th rowSpan={2} className="px-6 py-3 text-left align-middle border-b border-zinc-200 dark:border-zinc-800">#</th>
                                                <th rowSpan={2} className="px-3 py-3 text-left align-middle border-b border-zinc-200 dark:border-zinc-800">Description of Goods</th>
                                                <th colSpan={2} className="px-3 py-1.5 text-center border-b border-zinc-200 dark:border-zinc-800">Quantity</th>
                                                <th rowSpan={2} className="px-4 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">Retail</th>
                                                <th rowSpan={2} className="px-4 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">Rate</th>
                                                <th rowSpan={2} className="px-4 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">Disc %</th>
                                                <th rowSpan={2} className="px-4 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">After Discount</th>
                                                <th rowSpan={2} className="px-6 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">Net Amount</th>
                                            </tr>
                                            <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                                                <th className="px-3 py-1.5 text-center">Box</th>
                                                <th className="px-3 py-1.5 text-center">Pcs</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                                            {sale.items.map((it, idx) => {
                                                const subtotalGross = Number(it.subtotal || 0);
                                                const discPercent = subtotalGross > 0 ? (Number(it.discount || 0) / subtotalGross) * 100 : 0;
                                                const afterDiscRate = Number(it.trade_price || 0) * (1 - discPercent / 100);
                                                return (
                                                    <tr
                                                        key={it.id}
                                                        className="group transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 border-l-2 border-transparent text-xs"
                                                    >
                                                        <td className="px-6 py-3.5 text-zinc-400 font-mono">{idx + 1}</td>
                                                        <td className="px-3 py-3.5">
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-zinc-900 dark:text-zinc-200 uppercase truncate max-w-[320px]">{it.item?.title}</p>
                                                                <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">Code: {it.item?.code || "N/A"} • Pk: {it.item?.packing_qty || 1}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">{it.qty_carton}</td>
                                                        <td className="px-3 py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">{it.qty_pcs}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                                            {it.item?.retail ? formatCurrency(it.item.retail).replace('PKR', '').trim() : "0.00"}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                                            {formatCurrency(it.trade_price).replace('PKR', '').trim()}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-rose-500">
                                                            {discPercent > 0 ? discPercent.toFixed(2) : "0.00"}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            {formatCurrency(afterDiscRate).replace('PKR', '').trim()}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                                            {formatCurrency(it.subtotal - it.discount).replace('PKR', '').trim()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-zinc-50/50 dark:bg-zinc-950/20 font-black text-xs border-t border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <td colSpan={2} className="px-6 py-3.5 text-zinc-500">Total</td>
                                                <td className="px-3 py-3.5 text-center text-zinc-900 dark:text-zinc-100 font-mono">
                                                    {sale.items.reduce((acc, it) => acc + Number(it.qty_carton || 0), 0)}
                                                </td>
                                                <td className="px-3 py-3.5 text-center text-zinc-900 dark:text-zinc-100 font-mono">
                                                    {sale.items.reduce((acc, it) => acc + Number(it.qty_pcs || 0), 0)}
                                                </td>
                                                <td className="px-4 py-3.5"></td>
                                                <td className="px-4 py-3.5"></td>
                                                <td className="px-4 py-3.5 text-right text-rose-500 font-mono">
                                                    -{formatCurrency(sale.items.reduce((acc, it) => acc + Number(it.discount || 0), 0)).replace('PKR', '').trim()}
                                                </td>
                                                <td className="px-4 py-3.5"></td>
                                                <td className="px-6 py-3.5 text-right text-orange-500 font-mono">
                                                    {formatCurrency(sale.items.reduce((acc, it) => acc + (Number(it.subtotal || 0) - Number(it.discount || 0)), 0)).replace('PKR', '').trim()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Summary section matching Image 1 */}
                                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                        
                                        {/* Left Column: Total Items & Signature */}
                                        <div className="space-y-12">
                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-bold text-sm">
                                                <span>Total # Of Items:</span>
                                                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-black">
                                                    {sale.items.length}
                                                </span>
                                            </div>
                                            
                                            <div className="pt-6">
                                                <div className="w-48 border-b border-zinc-300 dark:border-zinc-700"></div>
                                                <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-black mt-2">
                                                    Check By Name & Time
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Right Column: Financial Figures */}
                                        <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold">
                                            <div className="flex justify-between items-center">
                                                <span>Courier Charges :-</span>
                                                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                                                    {formatCurrency(sale.courier_charges).replace('PKR', '').trim()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-rose-500">
                                                <span>Extra Discount :-</span>
                                                <span className="font-mono font-bold">
                                                    -{formatCurrency(extraDiscount).replace('PKR', '').trim()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                                <span>Total Rs. :-</span>
                                                <span className="font-mono">
                                                    {formatCurrency(currentInvoiceTotal).replace('PKR', '').trim()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Previous Balance :-</span>
                                                <span className={cn(
                                                    "font-mono font-bold",
                                                    previousBalance > 0 ? "text-rose-500" : previousBalance < 0 ? "text-emerald-500" : "text-zinc-500"
                                                )}>
                                                    {previousBalance < 0 ? "-" : ""}{formatCurrency(Math.abs(previousBalance)).replace('PKR', '').trim()}
                                                </span>
                                            </div>
                                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
                                            <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                                <span>Total Balance :-</span>
                                                <span className="font-mono text-orange-500">
                                                    {formatCurrency(currentInvoiceTotal + previousBalance).replace('PKR', '').trim()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                                                <span>Cash Received :-</span>
                                                <span className="font-mono font-black">
                                                    {formatCurrency(sale.paid_amount).replace('PKR', '').trim()}
                                                </span>
                                            </div>
                                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
                                            <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                                <span>Total Receivable :</span>
                                                <span className={cn(
                                                    "font-mono font-black text-base",
                                                    netBalance > 0 ? "text-rose-600" : "text-emerald-600"
                                                )}>
                                                    {formatCurrency(netBalance).replace('PKR', '').trim()}
                                                </span>
                                            </div>
                                        </div>
                                        
                                    </div>
                                </div>
                            </Card>

                            {/* SECTION 6: Returns History */}
                            {sale.returns && sale.returns.length > 0 && (
                                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader className="px-6 py-4 bg-rose-500/[0.02] border-b border-rose-500/10">
                                        <div className="flex items-center gap-2.5">
                                            <RefreshCcw className="h-5 w-5 text-rose-500 animate-spin-slow" />
                                            <div>
                                                <CardTitle className="text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Return & Reverse History</CardTitle>
                                                <CardDescription className="text-[10px] text-rose-400">Adjustment credit notes processed for this sale</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black text-rose-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                                                    <th className="px-6 py-3">Return Voucher</th>
                                                    <th className="px-4 py-3 text-center">Return Date</th>
                                                    <th className="px-4 py-3">Reason / Remarks</th>
                                                    <th className="px-4 py-3 text-center">Returned Qty</th>
                                                    <th className="px-6 py-3 text-right">Return Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-xs">
                                                {sale.returns.map((returnItem) => {
                                                    const retQty = returnItem.items.reduce((acc, curr) => acc + Number(curr.total_pcs), 0);
                                                    return (
                                                        <React.Fragment key={returnItem.id}>
                                                            <tr className="hover:bg-rose-500/[0.01]">
                                                                <td className="px-6 py-3.5 font-bold font-mono text-zinc-900 dark:text-zinc-200">{returnItem.invoice}</td>
                                                                <td className="px-4 py-3.5 text-center text-zinc-500 font-mono">{formatDateLong(returnItem.date)}</td>
                                                                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400 font-medium italic">{returnItem.remarks || "No remarks provided"}</td>
                                                                <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{retQty} Pcs</td>
                                                                <td className="px-6 py-3.5 text-right font-mono font-bold text-rose-600">
                                                                    -{formatCurrency(returnItem.net_total).replace('PKR', '').trim()}
                                                                </td>
                                                            </tr>
                                                            {/* Nested item list for returns */}
                                                            <tr className="bg-zinc-50/20 dark:bg-zinc-950/10">
                                                                <td colSpan={5} className="px-8 py-2">
                                                                    <div className="border-l-2 border-rose-300 pl-4 py-1 text-[10px] space-y-1">
                                                                        <span className="font-bold uppercase text-rose-500 block mb-1">Return Manifest:</span>
                                                                        {returnItem.items.map(ri => (
                                                                            <div key={ri.id} className="flex justify-between max-w-md text-zinc-500">
                                                                                <span>{ri.item?.title}</span>
                                                                                <span className="font-mono font-semibold">{ri.qty_carton} F, {ri.qty_pcs} P ({ri.total_pcs} Pcs)</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}

                            {/* Message Line notice at bottom if not null */}
                            {sale.message_line?.messageline && (
                                <Card className="bg-orange-500/[0.02] border border-orange-500/10 shadow-sm rounded-xl p-5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block mb-2 flex items-center gap-1.5">
                                        <Info className="h-4 w-4" /> Message Line / Special Notice
                                    </span>
                                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 italic uppercase">
                                        "{sale.message_line.messageline}"
                                    </p>
                                </Card>
                            )}

                        </div>

                    {/* print footer info */}
                    <div className="hidden print:flex flex-col items-center justify-center border-t border-zinc-200 pt-6 mt-12 text-center text-xs text-zinc-400 font-mono">
                        <p className="font-bold uppercase tracking-wider">Harnain Traders Wholesale & Supply Chain</p>
                        <p className="mt-1">Generated dynamically on {new Date().toLocaleString()}</p>
                    </div>

                </div>
            </SidebarInset>

            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">Verify & Process Sale</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Finalize shipment details for invoice {sale.invoice}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="courier_charges" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Courier / Logistics Charges (PKR)
                            </Label>
                            <Input
                                id="courier_charges"
                                type="number"
                                value={courierCharges}
                                onChange={(e) => setCourierCharges(Number(e.target.value))}
                                className="h-12 rounded-xl font-black text-lg border-2 focus-visible:ring-emerald-500"
                                autoFocus
                            />
                            <p className="text-[9px] font-bold text-muted-foreground italic">
                                * This amount will be added to the final net total of the invoice.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsVerifyDialogOpen(false)}
                            className="h-12 rounded-xl font-bold text-xs uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => {
                                setIsProcessing(true);
                                router.post(`/sales/${sale.id}/confirm`, {
                                    courier_charges: courierCharges
                                }, {
                                    onSuccess: () => {
                                        setIsVerifyDialogOpen(false);
                                        setIsProcessing(false);
                                    },
                                    onFinish: () => setIsProcessing(false)
                                });
                            }}
                            disabled={isProcessing}
                            className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 border-none transition-all"
                        >
                            {isProcessing ? "PROCESSING..." : "CONFIRM & VERIFY"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
