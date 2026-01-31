import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Link, router } from '@inertiajs/react';
import { motion } from "framer-motion";
import DashboardStats from './components/DashboardStats';
import UnifiedPerformanceLog from './components/UnifiedPerformanceLog';
import AnalyticsCharts from './components/AnalyticsCharts';
import PaymentFilters from './PaymentFilters';
import DataTable from './components/DataTable';
import { route } from 'ziggy-js';

interface Props {
    payments: {
        data: any[];
        links: any[];
    };
    summary: any;
    sales_summary: any;
    purchase_summary: any;
    analytics: any[];
    filters: any;
    accounts: any[];
}

export default function PaymentIndex({
    payments,
    summary,
    sales_summary,
    purchase_summary,
    analytics,
    filters,
    accounts
}: Props) {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={[{ title: "Dashboard", href: "/" }, { title: "Payments", href: "#" }]} />

                <div className="mx-auto w-full max-w-[1600px] p-5 lg:p-6 space-y-8">

                    {/* PROFESSIONAL ACTION HEADER */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                <LayoutDashboard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                                        Payment Dashboard
                                    </h1>
                                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                        CORE_FINANCE
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> SYSTEM_AUDITED
                                    </p>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 italic">LOG_REF: {new Date().toISOString().split('T')[0]}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2"
                        >
                            <Button
                                onClick={() => router.visit(route('payment.create'))}
                                className="h-11 px-6 text-xs font-black bg-[#FF8904] text-white hover:bg-[#e67a03] rounded-xl shadow-lg shadow-orange-500/10 border-none transition-all group tracking-widest uppercase"
                            >
                                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                Initiate Payment
                            </Button>
                        </motion.div>
                    </div>

                    {/* COCKPIT GRID (3-Column Layout) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch w-full">
                        <DashboardStats type="sales" mode="value" data={sales_summary} />
                        <UnifiedPerformanceLog data={analytics} />
                        <DashboardStats type="purchase" mode="value" data={purchase_summary} />
                    </div>



                    {/* FILTERS & DATA TABLE */}
                    <div className="space-y-6 pt-4">
                        <PaymentFilters filters={filters} accounts={accounts} />
                        <DataTable data={payments.data} />
                    </div>

                    {/* COMPACT FOOTER SYSTEM */}
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-6 mt-8 opacity-30 select-none pointer-events-none mb-6">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em]">FIN_TX_ENGINE_V3.1 // OPS.ID: 9942-PAY-SYS</p>
                        <p className="text-[8px] font-bold font-mono tracking-widest mt-2 sm:mt-0 uppercase">GATEWAY_VERIFIED // 2026-HB-SYS</p>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
