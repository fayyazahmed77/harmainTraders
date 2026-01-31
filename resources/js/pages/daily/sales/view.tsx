import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbItem } from "@/types";
import {
    ArrowLeftIcon,
    PrinterIcon,
    DownloadIcon,
    Calendar,
    Hash,
    User,
    CreditCard,
    Box,
    TrendingUp,
    ShieldCheck,
    Receipt,
    Tag,
    ChevronRight,
    RefreshCcw,
    CheckCircle,
    RotateCw,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────
type SaleStatus = "Completed" | "Partial Return" | "Returned";

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
    customer?: { id: number; title: string };
    salesman?: { id: number; name: string };
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    items: SaleItem[];
    returns?: SalesReturn[];
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
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const totalPcs = sale.items.reduce((acc, curr) => acc + Number(curr.total_pcs), 0);

    const statusConfig = {
        Completed: {
            label: "SALE_COMPLETED",
            color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            icon: <CheckCircle className="h-2.5 w-2.5" />,
        },
        "Partial Return": {
            label: "PARTIAL_RETURN",
            color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            icon: <RotateCw className="h-2.5 w-2.5" />,
        },
        Returned: {
            label: "FULL_RETURNED",
            color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
            icon: <RefreshCcw className="h-2.5 w-2.5" />,
        },
    };

    const currentStatus = statusConfig[sale.status] || statusConfig.Completed;

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="mx-auto w-full max-w-[1600px] p-6 lg:p-8 space-y-6">

                    {/* PROFESSIONAL ACTION HEADER */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.history.back()}
                                className="h-10 w-10 rounded-xl shadow-sm border-border bg-card hover:bg-muted/50"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h1 className="text-2xl font-black tracking-tighter text-foreground">
                                        {sale.invoice}
                                    </h1>
                                    <div className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border flex items-center gap-1", currentStatus.color)}>
                                        {currentStatus.icon}
                                        {currentStatus.label}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> TRANSACTION_VERIFIED
                                    </p>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">INDEX: {sale.id}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center flex-wrap gap-2"
                        >
                            <Button
                                variant="outline"
                                onClick={() => window.open(`/sales/${sale.id}/pdf?format=big`, "_blank")}
                                className="h-10 px-4 text-xs font-bold rounded-xl border-border bg-card hover:bg-muted/50 transition-all shadow-sm"
                            >
                                <PrinterIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                PRINT BIG
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.open(`/sales/${sale.id}/pdf?format=small`, "_blank")}
                                className="h-10 px-4 text-xs font-bold rounded-xl border-border bg-card hover:bg-muted/50 transition-all shadow-sm"
                            >
                                <PrinterIcon className="h-3.5 w-3.5 mr-2 text-orange-500" />
                                PRINT SMALL
                            </Button>
                            <Button
                                onClick={() => (window.location.href = `/sales/${sale.id}/download?format=big`)}
                                className="h-10 px-6 text-xs font-bold bg-[#FF8904] text-white hover:bg-[#e67a03] rounded-xl shadow-lg shadow-orange-500/10 border-none transition-all group"
                            >
                                <DownloadIcon className="h-3.5 w-3.5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                                DOWNLOAD BIG
                            </Button>
                        </motion.div>
                    </div>

                    {/* PRECISION COMPACT GRID */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                        {/* SIDEBAR WING: ADMINISTRATION (4 COLS) */}
                        <div className="xl:col-span-4 space-y-4">

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 gap-4"
                            >
                                {/* DATE & CUSTOMER TILE */}
                                <Card className="p-0 border-border bg-card shadow-sm overflow-hidden divide-y divide-border text-foreground">
                                    <div className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                <Calendar className="h-4 w-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Sale Date</span>
                                                <p className="text-sm font-black tracking-tight leading-none mt-0.5">{sale.date}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                                    </div>
                                    <div className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <User className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Customer Entity</span>
                                            <p className="text-sm font-black tracking-tight leading-none mt-0.5 uppercase">{sale.customer?.title || "CASH_CUSTOMER"}</p>
                                            <div className="flex items-center gap-1.5 mt-1 opacity-60">
                                                <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
                                                <span className="text-[8px] font-bold uppercase tracking-tighter">Salesman: {sale.salesman?.name || "Direct"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {sale.code && (
                                        <div className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                <Hash className="h-4 w-4 text-purple-500" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Reference Code</span>
                                                <p className="text-sm font-black tracking-tight leading-none mt-0.5">{sale.code}</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                {/* STATS ROW: VOLUMES */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="p-4 bg-muted/20 border-border shadow-sm flex flex-col justify-between">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Item Skus</span>
                                        <div className="flex items-center justify-between">
                                            <Box className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-lg font-black text-foreground">{sale.no_of_items}</p>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-card border-border shadow-sm flex flex-col justify-between">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Total Quantity (Pcs)</span>
                                        <div className="flex items-center justify-between text-primary">
                                            <TrendingUp className="h-4 w-4" />
                                            <p className="text-lg font-black tabular-nums">{totalPcs}</p>
                                        </div>
                                    </Card>
                                </div>
                            </motion.div>

                            {/* COMPACT PAYMENT INDICATOR - HUD */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="p-5 rounded-[0.5rem] bg-slate-900 dark:bg-card text-white dark:text-foreground shadow-xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                    <CreditCard className="h-20 w-20" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2.5 mb-5 opacity-80">
                                        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                                            <CreditCard className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Revenue Status</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                        <div>
                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-widest block mb-1">Recovered</span>
                                            <p className="text-sm font-black font-mono">
                                                {formatCurrency(sale.paid_amount).replace('PKR', '').trim()} <span className="text-[8px] opacity-40">PKR</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-widest block mb-1">Outstanding</span>
                                            <p className="text-sm font-black text-[#FF8904] font-mono">
                                                {formatCurrency(sale.remaining_amount).replace('PKR', '').trim()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* DATA WING: TABLE & FINANCIALS (8 COLS) */}
                        <div className="xl:col-span-8 space-y-6">

                            <Card className="p-0 rounded-[0.5rem] border-border shadow-md shadow-muted/10 overflow-hidden bg-card transition-all">
                                {/* COMPACT TABLE HEADER */}
                                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Receipt className="h-4 w-4 text-primary" />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Sale Line Allocation</h3>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-3 bg-background px-2 py-1 rounded-lg border border-border">
                                        <span className="text-[8px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded">AUDITED</span>
                                        <span className="text-[8px] font-bold font-mono text-muted-foreground">SID_{sale.id}</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-muted/20 text-[9px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
                                                <th className="px-6 py-3 text-left">Product Spec</th>
                                                <th className="px-3 py-3 text-center">CTN</th>
                                                <th className="px-3 py-3 text-center">PCS</th>
                                                <th className="px-3 py-3 text-center">TOT</th>
                                                <th className="px-4 py-3 text-right">TP @</th>
                                                <th className="px-6 py-3 text-right">Line Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            <AnimatePresence mode="popLayout">
                                                {sale.items.map((it, idx) => (
                                                    <motion.tr
                                                        key={it.id}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ delay: 0.1 + idx * 0.03 }}
                                                        className="group hover:bg-muted/30 transition-all cursor-default"
                                                    >
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 shrink-0 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner group-hover:-rotate-3">
                                                                    <Tag className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-foreground tracking-tight leading-tight uppercase group-hover:translate-x-1 transition-transform">{it.item?.title}</p>
                                                                    <p className="text-[8px] font-bold text-muted-foreground font-mono mt-0.5 tracking-widest opacity-60">#{it.item?.code || "UN_MKD"}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center text-[10px] font-black text-muted-foreground font-mono opacity-50">{it.qty_carton}</td>
                                                        <td className="px-3 py-3 text-center text-[10px] font-black text-muted-foreground font-mono opacity-50">{it.qty_pcs}</td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-black text-foreground border border-border group-hover:border-primary/30">
                                                                {it.total_pcs}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-[10px] font-black text-muted-foreground font-mono">
                                                            {formatCurrency(it.trade_price).replace('PKR', '').trim()}
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <div className="text-[13px] font-black text-foreground font-mono tracking-tighter">
                                                                {formatCurrency(it.subtotal).replace('PKR', '').trim()}
                                                                <span className="text-[8px] font-bold opacity-30 ml-1">PKR</span>
                                                            </div>
                                                            {(it.discount > 0 || it.gst_amount > 0) && (
                                                                <div className="flex flex-col items-end gap-0.5 mt-1">
                                                                    {it.discount > 0 && (
                                                                        <p className="text-[8px] font-bold text-rose-500 flex items-center gap-1">
                                                                            -{formatCurrency(it.discount)} Disc
                                                                        </p>
                                                                    )}
                                                                    {it.gst_amount > 0 && (
                                                                        <p className="text-[8px] font-bold text-blue-500 flex items-center gap-1">
                                                                            +{formatCurrency(it.gst_amount)} GST
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* COMPACT FINANCIAL HUD (FOOTER) */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                            >
                                <Card className="p-5 bg-card border-border flex flex-col justify-between group hover:border-primary/20 transition-all shadow-sm">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-3">Gross Value</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-black tracking-tight font-mono">{formatCurrency(sale.gross_total).replace('PKR', '').trim()}</span>
                                        <span className="text-[8px] font-bold opacity-30 uppercase">PKR</span>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-blue-500/[0.03] border-blue-500/10 flex flex-col justify-between group hover:bg-blue-500/[0.08] transition-all">
                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-3">Tax Component</p>
                                    <div className="flex items-baseline gap-2 text-blue-600">
                                        <span className="text-xl font-black tracking-tight font-mono">+{formatCurrency(sale.tax_total).replace('PKR', '').trim()}</span>
                                        <span className="text-[8px] font-black opacity-40 uppercase italic ml-1 leading-none">GST</span>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-rose-500/[0.03] border-rose-500/10 flex flex-col justify-between group hover:bg-rose-500/[0.08] transition-all">
                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-3">Loyalty Credits</p>
                                    <div className="flex items-baseline gap-2 text-rose-600">
                                        <span className="text-xl font-black tracking-tight font-mono">-{formatCurrency(sale.discount_total).replace('PKR', '').trim()}</span>
                                        <span className="text-[8px] font-black opacity-40 uppercase italic ml-1 leading-none">DISC</span>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-[#FF8904] text-white shadow-xl shadow-orange-500/10 flex flex-col justify-center relative overflow-hidden group border-none">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                        <TrendingUp className="h-12 w-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80 mb-6">Final Net Bill</p>
                                        <div className="flex items-baseline justify-end gap-2 translate-y-1">
                                            <span className="text-3xl font-black tracking-tighter font-mono tabular-nums leading-none">
                                                {formatCurrency(sale.net_total).replace('PKR', '').trim()}
                                            </span>
                                            <span className="text-[10px] font-black opacity-60">PKR</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                        </div>
                    </div>

                    {/* RETURNS SECTION (Ported to new design language) */}
                    {sale.returns && sale.returns.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                    <RefreshCcw className="h-5 w-5 text-rose-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tighter uppercase">Line Reversals ({sale.returns.length})</h2>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Inventory Adjustments Processed</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {sale.returns.map((returnItem) => (
                                    <Card key={returnItem.id} className="p-0 rounded-[0.5rem] border-rose-500/10 shadow-lg overflow-hidden bg-card">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-rose-500/[0.02] p-6 border-b border-border">
                                            <div>
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Return Voucher</p>
                                                <p className="text-sm font-black tracking-tight">{returnItem.invoice}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Reverse Date</p>
                                                <p className="text-sm font-black tracking-tight">{returnItem.date}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Impacted Sale</p>
                                                <p className="text-sm font-black tracking-tight">{returnItem.original_invoice}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Credit Adjustment</p>
                                                <p className="text-xl font-black text-rose-600 font-mono tracking-tighter">
                                                    -{formatCurrency(returnItem.net_total).replace('PKR', '').trim()}
                                                </p>
                                            </div>
                                        </div>

                                        {returnItem.remarks && (
                                            <div className="px-6 py-3 bg-muted/20 flex items-center gap-2 border-b border-border">
                                                <Info className="h-3 w-3 text-muted-foreground" />
                                                <p className="text-[10px] font-bold text-muted-foreground italic uppercase">Notes: {returnItem.remarks}</p>
                                            </div>
                                        )}

                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-muted/10 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                                                        <th className="px-6 py-3 text-left">SKU SPEC</th>
                                                        <th className="px-3 py-3 text-center">CTN</th>
                                                        <th className="px-3 py-3 text-center">PCS</th>
                                                        <th className="px-3 py-3 text-center">TOTAL</th>
                                                        <th className="px-6 py-3 text-right">RETURN VAL</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/30">
                                                    {returnItem.items.map((item) => (
                                                        <tr key={item.id} className="text-sm group hover:bg-rose-500/[0.01]">
                                                            <td className="px-6 py-3">
                                                                <p className="text-[11px] font-black text-foreground uppercase">{item.item?.title}</p>
                                                            </td>
                                                            <td className="px-3 py-3 text-center text-[10px] font-black text-muted-foreground font-mono">{item.qty_carton}</td>
                                                            <td className="px-3 py-3 text-center text-[10px] font-black text-muted-foreground font-mono">{item.qty_pcs}</td>
                                                            <td className="px-3 py-3 text-center text-[10px] font-black text-muted-foreground font-mono">
                                                                <span className="px-1.5 py-0.5 bg-muted/50 rounded">{item.total_pcs}</span>
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className="text-[11px] font-black font-mono tracking-tighter">
                                                                    {formatCurrency(item.subtotal).replace('PKR', '').trim()}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* COMPACT FOOTER SYSTEM */}
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-6 mt-4 opacity-30 select-none pointer-events-none mb-6">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em]">H_SALES_TX_CORE_V4.2 // OPS.LOG_INDEX:5512-SXL</p>
                        <p className="text-[8px] font-bold font-mono tracking-widest mt-2 sm:mt-0 uppercase">GATEWAY_VERIFIED: 2026-01-26</p>
                    </div>

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
