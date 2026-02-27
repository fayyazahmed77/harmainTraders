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
    Info,
    History as HistoryIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────

interface SalesReturnItem {
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

interface SalesReturn {
    id: number;
    invoice: string;
    date: string;
    original_invoice: string;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    remarks?: string;
    customer: { id: number; title: string };
    salesman: { id: number; name: string };
    items: SalesReturnItem[];
}

interface Props {
    returnData: SalesReturn;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/" },
    { title: "Sales Return", href: "/sales-return" },
    { title: "Credit Registry Details", href: "#" },
];

export default function View({ returnData }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const totalPcs = returnData.items.reduce((acc, curr) => acc + Number(curr.total_pcs), 0);

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="mx-auto w-full max-w-[1600px] p-6 lg:p-8 space-y-6 text-foreground">

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
                                    <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                                        {returnData.invoice}
                                    </h1>
                                    <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-500 flex items-center gap-1">
                                        <RefreshCcw className="h-2.5 w-2.5" />
                                        CREDIT_MEMO_ACTIVE
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> REVERSAL_PROTOCOL_VERIFIED
                                    </p>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">INDEX: {returnData.id}</span>
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
                                onClick={() => window.open(`/sales-return/${returnData.id}/pdf`, "_blank")}
                                className="h-10 px-4 text-xs font-bold rounded-xl border-border bg-card hover:bg-muted/50 transition-all shadow-sm"
                            >
                                <PrinterIcon className="h-3.5 w-3.5 mr-2 text-orange-500" />
                                PRINT CREDIT NOTE
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
                                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Return Date</span>
                                                <p className="text-sm font-black tracking-tight leading-none mt-0.5">{returnData.date}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                                    </div>
                                    <div className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <User className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Client Entity</span>
                                            <p className="text-sm font-black tracking-tight leading-none mt-0.5 uppercase">{returnData.customer?.title || "UNRESOLVED_ENTITY"}</p>
                                            <div className="flex items-center gap-1.5 mt-1 opacity-60">
                                                <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
                                                <span className="text-[8px] font-bold uppercase tracking-tighter">Officer: {returnData.salesman?.name || "Direct"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                            <Hash className="h-4 w-4 text-purple-500" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Origin Protocol</span>
                                            <p className="text-sm font-black tracking-tight leading-none mt-0.5 uppercase">{returnData.original_invoice || "MANUAL_RETURN"}</p>
                                        </div>
                                    </div>

                                    {returnData.remarks && (
                                        <div className="p-4 flex items-center gap-3 bg-sky-500/5 hover:bg-sky-500/10 transition-colors border-l-2 border-sky-500/50">
                                            <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                                                <Info className="h-4 w-4 text-sky-500" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[8px] font-black text-sky-500 uppercase tracking-widest">Memo Remarks</span>
                                                <p className="text-sm font-black tracking-tight leading-relaxed mt-0.5 text-sky-700 dark:text-sky-300">
                                                    {returnData.remarks}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                {/* STATS ROW: VOLUMES */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="p-4 bg-muted/20 border-border shadow-sm flex flex-col justify-between">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Impacted Skus</span>
                                        <div className="flex items-center justify-between">
                                            <Box className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-lg font-black text-foreground">{returnData.items.length}</p>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-card border-border shadow-sm flex flex-col justify-between">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Reversed Units</span>
                                        <div className="flex items-center justify-between text-orange-500">
                                            <TrendingUp className="h-4 w-4" />
                                            <p className="text-lg font-black tabular-nums">{totalPcs}</p>
                                        </div>
                                    </Card>
                                </div>
                            </motion.div>

                            {/* COMPACT CREDIT HUD */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="p-5 rounded-xl bg-slate-900 dark:bg-card text-white dark:text-foreground shadow-xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                    <Receipt className="h-20 w-20" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2.5 mb-5 opacity-80">
                                        <div className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg">
                                            <RefreshCcw className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Reversal Impact</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 border-t border-white/5 pt-4">
                                        <div>
                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-widest block mb-1">Total Adjustment Credited</span>
                                            <p className="text-2xl font-black text-orange-500 font-mono tracking-tighter">
                                                {formatCurrency(returnData.net_total).replace('PKR', '').trim()} <span className="text-[10px] opacity-40">PKR</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* DATA WING: TABLE & FINANCIALS (8 COLS) */}
                        <div className="xl:col-span-8 space-y-6">

                            <Card className="p-0 rounded-xl border-border shadow-md shadow-muted/10 overflow-hidden bg-card transition-all">
                                {/* COMPACT TABLE HEADER */}
                                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                            <HistoryIcon className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Reversal Allocation Manifest</h3>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-3 bg-background px-2 py-1 rounded-lg border border-border">
                                        <span className="text-[8px] font-black text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded tracking-[0.2em]">INVENTORY_RECLAIMED</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-muted/20 text-[9px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
                                                <th className="px-6 py-3 text-left">SKU Spec</th>
                                                <th className="px-3 py-3 text-center">CTN</th>
                                                <th className="px-3 py-3 text-center">PCS</th>
                                                <th className="px-3 py-3 text-center">TOT</th>
                                                <th className="px-4 py-3 text-right">CREDIT RATE</th>
                                                <th className="px-6 py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {returnData.items.map((it, idx) => (
                                                <tr key={it.id} className="group transition-all hover:bg-muted/30">
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 shrink-0 rounded-lg bg-muted flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shadow-inner group-hover:-rotate-3">
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
                                                        <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-black text-foreground border border-border group-hover:border-orange-500/30">
                                                            {it.total_pcs}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-[10px] font-black text-muted-foreground font-mono">
                                                        {it.trade_price.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="text-[13px] font-black text-foreground font-mono tracking-tighter">
                                                            {it.subtotal.toLocaleString()}
                                                            <span className="text-[8px] font-bold opacity-30 ml-1">PKR</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
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
                                <Card className="p-5 bg-card border-border flex flex-col justify-between group hover:border-orange-500/20 transition-all shadow-sm">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-3">Gross Reversal</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-black tracking-tight font-mono">{returnData.gross_total.toLocaleString()}</span>
                                        <span className="text-[8px] font-bold opacity-30 uppercase">PKR</span>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-blue-500/[0.03] border-blue-500/10 flex flex-col justify-between group hover:bg-blue-500/[0.08] transition-all">
                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-3">Tax Adjustment</p>
                                    <div className="flex items-baseline gap-2 text-blue-600">
                                        <span className="text-xl font-black tracking-tight font-mono">+{returnData.tax_total.toLocaleString()}</span>
                                        <span className="text-[8px] font-black opacity-40 uppercase italic ml-1 leading-none">GST_REV</span>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-rose-500/[0.03] border-rose-500/10 flex flex-col justify-between group hover:bg-rose-500/[0.08] transition-all">
                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-3">Discount Reclaim</p>
                                    <div className="flex items-baseline gap-2 text-rose-600">
                                        <span className="text-xl font-black tracking-tight font-mono">-{returnData.discount_total.toLocaleString()}</span>
                                        <span className="text-[8px] font-black opacity-40 uppercase italic ml-1 leading-none">DISC_REV</span>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-orange-600 text-white shadow-xl shadow-orange-500/10 flex flex-col justify-center relative overflow-hidden group border-none">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                        <TrendingUp className="h-12 w-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80 mb-6">Net Credit Entry</p>
                                        <div className="flex items-baseline justify-end gap-2 translate-y-1">
                                            <span className="text-3xl font-black tracking-tighter font-mono tabular-nums leading-none">
                                                {returnData.net_total.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-black opacity-60">PKR</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                        </div>
                    </div>

                    {/* COMPACT FOOTER SYSTEM */}
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-6 mt-4 opacity-30 select-none pointer-events-none mb-6">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em]">H_REVERSAL_TX_CORE_V1.0 // OPS.LOG_INDEX:RET-{returnData.id}</p>
                        <p className="text-[8px] font-bold font-mono tracking-widest mt-2 sm:mt-0 uppercase">REGISTRY_VERIFIED: {returnData.date}</p>
                    </div>

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
