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
    Info,
    Receipt,
    Tag,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PurchaseItem {
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

interface Purchase {
    id: number;
    date: string;
    invoice: string;
    code: string;
    supplier?: { id: number; title: string };
    salesman?: { id: number; name: string };
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    message_line_id?: number | null;
    message_line?: {
        id: number;
        messageline: string;
    } | null;
    items: PurchaseItem[];
}

interface Props {
    purchase: Purchase;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/" },
    { title: "Purchases", href: "/purchase" },
    { title: "Order Detail", href: "#" },
];

export default function View({ purchase }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const totalPcs = purchase.items.reduce((acc, curr) => acc + Number(curr.total_pcs), 0);

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="mx-auto w-full max-w-[1600px] p-6 lg:p-8 space-y-6">

                    {/* PROFESSIONAL ACTION HEADER (COMPACT) */}
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
                                        {purchase.invoice}
                                    </h1>
                                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                        PROCUREMENT_ORDER
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> SYSTEM_VERIFIED
                                    </p>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">INDEX: {purchase.id}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2"
                        >
                            <Button
                                variant="outline"
                                onClick={() => window.open(`/purchase/${purchase.id}/pdf`, "_blank")}
                                className="h-10 px-4 text-xs font-bold rounded-xl border-border bg-card hover:bg-muted/50 transition-all shadow-sm"
                            >
                                <PrinterIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                PRINT
                            </Button>
                            <Button
                                onClick={() => window.location.href = `/purchase/${purchase.id}/download`}
                                className="h-10 px-6 text-xs font-bold bg-[#FF8904] text-white hover:bg-[#e67a03] rounded-xl shadow-lg shadow-orange-500/10 border-none transition-all group"
                            >
                                <DownloadIcon className="h-3.5 w-3.5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                                EXPORT PDF
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
                                {/* DATE & SUPPLIER TILE (COMBINED REFINED) */}
                                <Card className="p-0 border-border bg-card shadow-sm overflow-hidden divide-y divide-border text-foreground">
                                    <div className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                <Calendar className="h-4 w-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Entry Date</span>
                                                <p className="text-sm font-black tracking-tight leading-none mt-0.5">{purchase.date}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                                    </div>
                                    <div className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <User className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Source Merchant</span>
                                            <p className="text-sm font-black tracking-tight leading-none mt-0.5 uppercase">{purchase.supplier?.title || "MARKET_SOURCE"}</p>
                                            <div className="flex items-center gap-1.5 mt-1 opacity-60">
                                                <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
                                                <span className="text-[8px] font-bold uppercase tracking-tighter">Rep: {purchase.salesman?.name || "Direct"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* STATS ROW: VOLUMES */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="p-4 bg-muted/20 border-border shadow-sm flex flex-col justify-between">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Invoice Skus</span>
                                        <div className="flex items-center justify-between">
                                            <Box className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-lg font-black text-foreground">{purchase.no_of_items}</p>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-card border-border shadow-sm flex flex-col justify-between">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Total Unit Pcs</span>
                                        <div className="flex items-center justify-between text-primary">
                                            <TrendingUp className="h-4 w-4" />
                                            <p className="text-lg font-black tabular-nums">{totalPcs}</p>
                                        </div>
                                    </Card>

                                    {/* MESSAGE LINE SECTION */}
                                    {purchase.message_line && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="col-span-2 p-4 rounded-[0.5rem] border border-sky-100 bg-sky-50/30 flex items-center gap-3 shadow-sm group hover:bg-sky-50/50 transition-all"
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
                                                <Info className="h-4 w-4 text-sky-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[8px] font-black text-sky-600/60 uppercase tracking-widest block mb-0.5">Instruction / Message</span>
                                                <p className="text-sm font-black text-sky-900 leading-tight break-words px-1 border-l-2 border-sky-200 ml-1 italic group-hover:translate-x-1 transition-transform">
                                                    {purchase.message_line.messageline}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>

                            {/* COMPACT PAYMENT INDICATOR - HUD (Horizontal-ish) */}
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
                                        <span className="text-[9px] font-black uppercase tracking-widest">Financial Summary</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                        <div>
                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-widest block mb-1">Settled</span>
                                            <p className="text-sm font-black font-mono">
                                                {formatCurrency(purchase.paid_amount).replace('PKR', '').trim()} <span className="text-[8px] opacity-40">PKR</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-widest block mb-1">Due</span>
                                            <p className="text-sm font-black text-[#FF8904] font-mono">
                                                {formatCurrency(purchase.remaining_amount).replace('PKR', '').trim()}
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
                                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Line Allocation</h3>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-3 bg-background px-2 py-1 rounded-lg border border-border">
                                        <span className="text-[8px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded">VERIFIED</span>
                                        <span className="text-[8px] font-bold font-mono text-muted-foreground">ID_{purchase.id}</span>
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
                                                <th className="px-6 py-3 text-right">Price @</th>
                                                <th className="px-6 py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {purchase.items.map((it, idx) => (
                                                <motion.tr
                                                    key={it.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
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
                                                    <td className="px-6 py-3 text-right text-[10px] font-black text-muted-foreground font-mono">
                                                        {formatCurrency(it.trade_price).replace('PKR', '').trim()}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="text-[13px] font-black text-foreground font-mono tracking-tighter">
                                                            {formatCurrency(it.subtotal).replace('PKR', '').trim()}
                                                            <span className="text-[8px] font-bold opacity-30 ml-1">PKR</span>
                                                        </div>
                                                        {it.discount > 0 && (
                                                            <p className="text-[8px] font-bold text-rose-500 mt-0.5 flex items-center justify-end gap-1">
                                                                -{formatCurrency(it.discount)} Disc
                                                            </p>
                                                        )}
                                                    </td>
                                                </motion.tr>
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
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                                <Card className="p-5 bg-card border-border flex flex-col justify-between group hover:border-primary/20 transition-all shadow-sm">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-3">Gross Allocation</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-black tracking-tight font-mono">{formatCurrency(purchase.gross_total).replace('PKR', '').trim()}</span>
                                        <span className="text-[8px] font-bold opacity-30 uppercase">PKR</span>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-rose-500/[0.03] border-rose-500/10 flex flex-col justify-between group hover:bg-rose-500/[0.08] transition-all">
                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-3">Invoice Savings</p>
                                    <div className="flex items-baseline gap-2 text-rose-600">
                                        <span className="text-xl font-black tracking-tight font-mono">-{formatCurrency(purchase.discount_total).replace('PKR', '').trim()}</span>
                                        <span className="text-[8px] font-black opacity-40 uppercase italic ml-1 leading-none">DISC</span>
                                    </div>
                                </Card>

                                <Card className="p-5 bg-[#FF8904] text-white shadow-xl shadow-orange-500/10 flex flex-col justify-center relative overflow-hidden group border-none">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                        <TrendingUp className="h-12 w-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80 mb-6">Final Payable Sum</p>
                                        <div className="flex items-baseline justify-end gap-2 translate-y-1">
                                            <span className="text-3xl font-black tracking-tighter font-mono tabular-nums leading-none">
                                                {formatCurrency(purchase.net_total).replace('PKR', '').trim()}
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
                        <p className="text-[8px] font-black uppercase tracking-[0.3em]">TX_ENGINE_V2.7 // OPS.LOG_INDEX:4492-AXL</p>
                        <p className="text-[8px] font-bold font-mono tracking-widest mt-2 sm:mt-0 uppercase">REG_VERIFIED: 2026-01-24</p>
                    </div>

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
