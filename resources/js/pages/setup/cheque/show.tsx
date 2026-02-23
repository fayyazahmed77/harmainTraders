"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Building2, User as UserIcon, Calendar as CalendarIcon, Hash, Fingerprint, ShieldCheck, Landmark, ReceiptText, Banknote, TimerReset } from "lucide-react";
import { Link, usePage, Head } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/Heading";

interface ChequeDetail {
    id: number;
    cheque_no: string;
    entry_date: string;
    bank_name: string;
    status: string;
    remarks: string | null;
    voucher_code: string | null;
    prefix: string | null;
    created_at: string;
    created_by_name: string;
    // Payment details (if used)
    payment_amount?: number;
    payment_date?: string;
    assigned_to?: string;
    payment_voucher_no?: string;
    payment_cheque_status?: string;
    payment_clear_date?: string | null;
}

const PREMIUM_ROUNDING = "rounded-2xl";

export default function ChequeBookShow() {
    const { chequebook } = usePage().props as unknown as { chequebook: ChequeDetail };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Financials", href: "/cheque" },
        { title: `Dossier #${chequebook.cheque_no}`, href: "#" },
    ];

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "issued":
            case "used":
                return {
                    label: "Issued",
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20",
                    icon: ShieldCheck
                };
            case "cancelled":
                return {
                    label: "Cancelled",
                    color: "text-rose-500",
                    bg: "bg-rose-500/10",
                    border: "border-rose-500/20",
                    icon: XCircle
                };
            case "unused":
            default:
                return {
                    label: "Unused",
                    color: "text-emerald-500",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    icon: Clock
                };
        }
    };

    const statusConfig = getStatusConfig(chequebook.status);

    return (
        <SidebarProvider>
            <Head title={`Asset Dossier | ${chequebook.prefix}-${chequebook.cheque_no}`} />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8">
                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                        >
                            <div className="flex flex-col gap-4">
                                <Link href="/cheque" className="w-fit">
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-400 hover:text-orange-500 group -ml-2">
                                        <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                                        Return to Registry
                                    </Button>
                                </Link>
                                <div className="flex items-center gap-4">
                                    <Heading
                                        title={`${chequebook.prefix || "PFX"}-${chequebook.cheque_no}`}
                                        description="Master Financial Asset Specification"
                                    />
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
                                        statusConfig.bg, statusConfig.color, statusConfig.border
                                    )}>
                                        <statusConfig.icon className="h-3 w-3" />
                                        {statusConfig.label}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-end">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Registry Hash</p>
                                    <p className="text-xs font-mono font-black uppercase tracking-tighter">
                                        {chequebook.id.toString().padStart(6, '0')}-{chequebook.cheque_no}
                                    </p>
                                </div>
                                <div className="h-10 w-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center">
                                    <Fingerprint className="h-5 w-5 text-white dark:text-zinc-900" />
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Primary Instrument Details */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="lg:col-span-12"
                            >
                                <Card className={cn(PREMIUM_ROUNDING, "overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl")}>
                                    <div className="p-1 bg-gradient-to-r from-orange-500 via-orange-500/20 to-transparent" />
                                    <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-zinc-200 dark:border-zinc-800">
                                        {[
                                            { label: "Financial Entity", value: chequebook.bank_name, icon: Landmark, color: "text-orange-500" },
                                            { label: "Induction Point", value: new Date(chequebook.entry_date).toLocaleDateString(), icon: CalendarIcon, color: "text-blue-500" },
                                            { label: "Protocol Operator", value: chequebook.created_by_name, icon: UserIcon, color: "text-zinc-500" },
                                            { label: "Voucher Signature", value: chequebook.voucher_code || "GEN-ALPHA", icon: ReceiptText, color: "text-emerald-500" },
                                        ].map((stat, i) => (
                                            <div key={i} className="p-8 space-y-3 group hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-500 transition-colors">{stat.label}</p>
                                                    <stat.icon className={cn("h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:rotate-6 transition-all", stat.color)} />
                                                </div>
                                                <p className="text-xl font-black tracking-tighter uppercase dark:text-zinc-100 truncate">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>

                            <div className="lg:col-span-8 space-y-8">
                                {/* Extended Data Fields */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl")}>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <ReceiptText className="h-4 w-4 text-orange-500" />
                                                Operation Metadata
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Registry Notes</span>
                                                    <p className="text-sm leading-relaxed p-4 rounded-xl border-2 border-dashed border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-500 italic">
                                                        {chequebook.remarks || "Zero metadata assigned to this financial instrument archive."}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Created At Index</span>
                                                        <span className="text-xs font-bold font-mono">{new Date(chequebook.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Asset Hash Identity</span>
                                                        <span className="text-xs font-bold font-mono uppercase">ASSET-{chequebook.id}-{Math.random().toString(36).substring(7).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Payment Realization (If Used) */}
                                <AnimatePresence>
                                    {(chequebook.status === 'issued' || chequebook.status === 'used') && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <Card className={cn(PREMIUM_ROUNDING, "overflow-hidden border-orange-500/30 bg-orange-500/[0.02] backdrop-blur-xl ring-1 ring-orange-500/10")}>
                                                <div className="p-4 border-b border-orange-500/10 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Landmark className="h-4 w-4 text-orange-500" />
                                                        <span className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Liquidation Realization Report</span>
                                                    </div>
                                                    <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">PROCESSED</Badge>
                                                </div>
                                                <CardContent className="pt-8 space-y-8">
                                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                                        <div className="flex flex-col items-center md:items-start">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Beneficiary Entity</span>
                                                            <span className="text-2xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-100">{chequebook.assigned_to}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center md:items-end">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Liquidation Amount</span>
                                                            <span className="text-3xl font-black tracking-tighter text-orange-500">
                                                                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(chequebook.payment_amount || 0)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {[
                                                            { label: "Voucher Reference", value: chequebook.payment_voucher_no },
                                                            { label: "Payment Induction", value: chequebook.payment_date ? new Date(chequebook.payment_date).toLocaleDateString() : 'VOID' },
                                                            { label: "Clearing Status", value: chequebook.payment_cheque_status === 'Clear' ? 'CLEARED' : (chequebook.payment_cheque_status || 'PENDING') },
                                                            { label: "Clearance Date", value: chequebook.payment_clear_date ? new Date(chequebook.payment_clear_date).toLocaleDateString() : 'N/A' },
                                                        ].map((item, i) => (
                                                            <div key={i} className="space-y-1">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">{item.label}</span>
                                                                <span className="text-xs font-bold dark:text-zinc-200">{item.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="lg:col-span-4 space-y-8"
                            >
                                <Card className={cn(PREMIUM_ROUNDING, "border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white shadow-2xl overflow-hidden")}>
                                    <div className="p-1 bg-orange-500" />
                                    <CardHeader>
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" />
                                            Verification Node
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Landmark className="h-4 w-4 text-zinc-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Bank Verification</span>
                                                </div>
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Fingerprint className="h-4 w-4 text-zinc-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Registry Sync</span>
                                                </div>
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <TimerReset className="h-4 w-4 text-zinc-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Real-time Delta</span>
                                                </div>
                                                <span className="text-[9px] font-black text-orange-500">LIVE</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/10">
                                            <p className="text-[9px] text-zinc-500 leading-relaxed uppercase">
                                                This asset is digitally verified against the main financial ledger and is currently synced with the central registry node.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={cn(PREMIUM_ROUNDING, "border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl")}>
                                    <CardHeader className="pb-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contextual Actions</h4>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 gap-2">
                                        <Button variant="outline" className="w-full justify-start rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-500 hover:text-orange-500 hover:border-orange-500/30 transition-all">
                                            <ReceiptText className="mr-2 h-3.5 w-3.5" /> Export Manifest
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-500 hover:text-orange-500 hover:border-orange-500/30 transition-all">
                                            <Landmark className="mr-2 h-3.5 w-3.5" /> bank sync history
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <style>{`
                  .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                  .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; border: 1px solid transparent; background-clip: padding-box; }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
                `}</style>
            </SidebarInset>
        </SidebarProvider>
    );
}
