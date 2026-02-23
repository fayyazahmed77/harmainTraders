"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Hash, CreditCard, Building2, Calendar as CalendarIcon } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { Link, usePage, Head } from "@inertiajs/react";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { DataTable } from "@/components/setup/cheque/DataTable";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/Heading";
import { Card } from "@/components/ui/card";

// ✅ Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
    { title: "Financials", href: "#" },
    { title: "Cheque Assets", href: "/cheque" },
];

// ✅ ChequeBook Interface
interface ChequeBook {
    id: number;
    bank_id: number;
    bank: {
        id: number;
        title: string;
    };
    logo_url: string;
    created_by_name: string;
    created_by_avatar?: string | null;
    entry_date?: string;
    voucher_code?: string | null;
    remarks?: string | null;
    prefix?: string;
    cheque_no: string;
    total_cheques?: number;
    created_at: string;
}

const PREMIUM_ROUNDING = "rounded-2xl";

export default function ChequeBookPage() {
    // ✅ Inertia props
    const { chequebook } = usePage().props as unknown as {
        chequebook: ChequeBook[];
    };

    // ✅ Toast for success/error messages
    useToastFromQuery();

    // ✅ Auth & Permissions
    const pageProps = usePage().props as unknown as {
        auth: {
            user: any;
            permissions: string[];
        };
        errors: Record<string, string>;
    };

    const permissions = pageProps.auth?.permissions || [];
    const errors = pageProps.errors || {};

    // ✅ Permission: can user create new cheque books?
    const canCreate = permissions.includes("create chequebook");

    return (
        <SidebarProvider>
            <Head title="Financial Assets | Cheque Registry" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                        {/* ===== Header Section ===== */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                        >
                            <Heading
                                title="Cheque Assets"
                                description="Secure registry of generated cheque books and financial instruments"
                            />
                            <div className="flex gap-3">
                                <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                                    <Link href="/cheque/create">
                                        <Plus className="mr-2 h-4 w-4" /> Provision Cheque Book
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>

                        {/* ===== Stats / Overview Bar (Optional for Premium Feel) ===== */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            {[
                                { label: "Total Asset Count", value: chequebook.length, icon: CreditCard, color: "text-orange-500" },
                                { label: "Bank Entities", value: Array.from(new Set(chequebook.map(c => c.bank_id))).length, icon: Building2, color: "text-zinc-500" },
                                { label: "Registry Protocols", value: "ACTIVE", icon: Hash, color: "text-green-500", suffix: "ONLINE" },
                                { label: "Last Induction", value: chequebook.length > 0 ? new Date(chequebook[0].created_at).toLocaleDateString() : "VOID", icon: CalendarIcon, color: "text-blue-500" },
                            ].map((stat, i) => (
                                <Card key={i} className={cn(PREMIUM_ROUNDING, "p-4 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between")}>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">{stat.label}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black tracking-tighter">{stat.value}</span>
                                            {stat.suffix && <span className="text-[10px] font-bold text-green-500">{stat.suffix}</span>}
                                        </div>
                                    </div>
                                    <stat.icon className={cn("h-8 w-8 opacity-20", stat.color)} />
                                </Card>
                            ))}
                        </motion.div>

                        {/* ===== Main Content ===== */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className={cn(PREMIUM_ROUNDING, "overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl")}>
                                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/30">
                                    <div className="flex items-center gap-4 flex-1 max-w-md">
                                        <div className="relative w-full">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <input
                                                type="text"
                                                placeholder="Decrypt cheque serial or bank signature..."
                                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                            />
                                        </div>
                                        <Button variant="outline" size="icon" className="rounded-xl flex-shrink-0">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Master Financial Registry</span>
                                    </div>
                                </div>

                                <div className="p-0">
                                    {chequebook.length === 0 ? (
                                        <div className="text-center py-20 flex flex-col items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <CreditCard className="h-8 w-8 text-zinc-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold uppercase tracking-widest text-sm">No Assets Detected</h3>
                                                <p className="text-xs text-zinc-400">Initialize a new cheque book to begin tracking</p>
                                            </div>
                                            <Button asChild variant="outline" className="mt-2 rounded-xl border-dashed">
                                                <Link href="/cheque/create">Provision New Registry</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <DataTable data={chequebook} />
                                    )}
                                </div>
                            </Card>
                        </motion.div>
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
