import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, Building2, Clock } from "lucide-react";
import { router } from '@inertiajs/react';
import PaymentSummary from './components/PaymentSummary';
import DataTable from './components/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
    stats: {
        sales: { total: number; paid: number; due: number };
        purchases: { total: number; paid: number; due: number };
        payments: { receipts: number; payments: number };
        clearing: {
            available_funds: number;
            pending_receipts_amount: number;
            pending_payments_amount: number;
        };
    };
    payments: {
        data: any[];
        links: any[];
    };
    accounts: any[];
    filters: {
        status: string;
        account_id: string;
    };
    summaries: {
        tomorrow_amount: number;
        day_after_tomorrow_amount: number;
        bank_summaries: { bank_name: string; count: number; total_amount: number }[];
    };
}

export default function ClearingChequeIndex({ stats, payments, accounts, filters, summaries }: Props) {

    const handleTabChange = (value: string) => {
        router.get('/clearing-cheque', { ...filters, status: value }, { preserveState: true, preserveScroll: true });
    };

    const handleAccountChange = (value: string) => {
        router.get('/clearing-cheque', { ...filters, account_id: value === 'all' ? '' : value }, { preserveState: true, preserveScroll: true });
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={[{ title: "Clearing Cheque", href: "/clearingcheque" }]} />
                <div className="mx-auto w-full max-w-[1720px] px-6 lg:px-10 py-10 space-y-8">
                    {/* PREMIUM HEADER */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border pb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h1 className="text-2xl font-black tracking-tighter text-foreground dark:text-white uppercase">
                                        Clearing Cheque
                                    </h1>
                                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                        SECURE_ASSETS
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-60">
                                    <Clock className="h-2.5 w-2.5 text-orange-500" /> Operational Matrix // RE-V8
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-[220px]">
                                <Select value={filters.account_id || 'all'} onValueChange={handleAccountChange}>
                                    <SelectTrigger className="h-11 rounded-xl bg-card border-border shadow-sm font-black text-[10px] uppercase tracking-widest text-[#9a3412]/60 dark:text-[#d6d3d1]/40">
                                        <SelectValue placeholder="Filter by Bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Banks</SelectItem>
                                        {accounts.map((account) => (
                                            <SelectItem key={account.id} value={String(account.id)}>
                                                {account.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <PaymentSummary stats={stats} />

                    <Tabs defaultValue={filters.status} onValueChange={handleTabChange} className="w-full">
                        <TabsList>
                            <TabsTrigger value="Pending">Pending</TabsTrigger>
                            <TabsTrigger value="Clear">Clear</TabsTrigger>
                            <TabsTrigger value="Return">Return</TabsTrigger>
                        </TabsList>

                        {filters.status === 'Pending' && (
                            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mt-6">
                                {/* Tomorrow's Clearing */}
                                <Card className="p-0 border-none shadow-md transition-all duration-300 bg-[#fff7ed] dark:bg-[#1c1917] rounded-xl border border-orange-100 dark:border-border/50 overflow-hidden relative group">
                                    <div className="absolute top-0 right-4 w-12 h-1 bg-orange-400 rounded-b-full z-20"></div>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700/60 dark:text-orange-400/40">Tomorrow</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#9a3412]/30 dark:text-[#d6d3d1]/20 uppercase tracking-widest mb-1 leading-none">Expected Intake</p>
                                            <h3 className="text-2xl font-black text-foreground dark:text-white tracking-tighter">
                                                <span className="text-xs opacity-40 mr-1.5 font-sans">Rs</span>
                                                {new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0 }).format(summaries.tomorrow_amount)}
                                            </h3>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-orange-100/50 dark:border-white/[0.03] flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                                            <p className="text-[9px] font-black text-[#9a3412]/40 dark:text-[#d6d3d1]/30 uppercase tracking-widest">Clearing in 24h</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Day After Tomorrow */}
                                <Card className="p-0 border-none shadow-md transition-all duration-300 bg-[#fff7ed] dark:bg-[#1c1917] rounded-xl border border-orange-100 dark:border-border/50 overflow-hidden relative group">
                                    <div className="absolute top-0 right-4 w-12 h-1 bg-blue-400 rounded-b-full z-20"></div>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700/60 dark:text-blue-400/40">Day After</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#9a3412]/30 dark:text-[#d6d3d1]/20 uppercase tracking-widest mb-1 leading-none">Forecasted Flow</p>
                                            <h3 className="text-2xl font-black text-foreground dark:text-white tracking-tighter">
                                                <span className="text-xs opacity-40 mr-1.5 font-sans">Rs</span>
                                                {new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0 }).format(summaries.day_after_tomorrow_amount)}
                                            </h3>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-orange-100/50 dark:border-white/[0.03] flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                            <p className="text-[9px] font-black text-[#9a3412]/40 dark:text-[#d6d3d1]/30 uppercase tracking-widest">Clearing in 48h</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {filters.status === 'Pending' && summaries.bank_summaries.length > 0 && (
                            <div className="mt-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Bank Liquidity Distribution</h3>
                                </div>
                                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                                    {summaries.bank_summaries.map((bank, index) => {
                                        const color = [
                                            { accent: 'bg-emerald-500', icon: 'text-emerald-500', bg: 'bg-emerald-500/5', text: 'text-emerald-700' },
                                            { accent: 'bg-blue-500', icon: 'text-blue-500', bg: 'bg-blue-500/5', text: 'text-blue-700' },
                                            { accent: 'bg-amber-500', icon: 'text-amber-500', bg: 'bg-amber-500/5', text: 'text-amber-700' },
                                            { accent: 'bg-rose-500', icon: 'text-rose-500', bg: 'bg-rose-500/5', text: 'text-rose-700' },
                                        ][index % 4];
                                        return (
                                            <Card key={index} className="p-0 border-none shadow-md bg-[#fff7ed] dark:bg-[#1c1917] rounded-xl border border-orange-100 dark:border-border/50 overflow-hidden relative group transition-all duration-300 hover:-translate-y-1">
                                                <div className={`absolute top-0 right-3 w-8 h-1 ${color.accent} rounded-b-full z-20 opacity-40`}></div>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${color.text} truncate pr-1`}>{bank.bank_name}</span>
                                                        <Building2 className={`h-3 w-3 ${color.icon} opacity-40`} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-sm font-black text-foreground dark:text-white tracking-tight">
                                                            <span className="text-[10px] opacity-30 mr-1 font-sans">Rs</span>
                                                            {new Intl.NumberFormat('en-PK', { notation: 'compact' }).format(bank.total_amount)}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`h-1 w-1 rounded-full ${color.accent} opacity-40`}></div>
                                                            <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter">{bank.count} Cheque{bank.count !== 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <DataTable data={payments.data} />
                        </div>
                    </Tabs>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
