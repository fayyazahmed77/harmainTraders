import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Edit3, Calendar, Clock, User, ArrowRightLeft } from "lucide-react";
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Card } from "@/components/ui/card";
import { formatSafeDate } from '@/lib/utils';

interface Props {
    receipt: any;
    payment: any;
    voucher_no: string;
}

export default function JournalVoucherShow({ receipt, payment, voucher_no }: Props) {
    const handlePrint = () => {
        window.open(route('journal-vouchers.pdf', receipt.id), '_blank');
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={[
                    { title: "Dashboard", href: "/" },
                    { title: "Journal Vouchers", href: route('journal-vouchers.index') },
                    { title: voucher_no, href: "#" }
                ]} />

                <div className="mx-auto w-full max-w-[1200px] p-4 lg:p-6 space-y-6">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => router.visit(route('journal-vouchers.index'))} className="h-10 w-10 rounded-xl">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                                        {voucher_no}
                                    </h1>
                                    <div className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                                        Journal Voucher
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                    Direct Balance Transfer Details
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.visit(route('journal-vouchers.edit', receipt.id))}
                                className="h-11 px-5 text-xs font-black rounded-xl uppercase tracking-widest border-border/80 text-foreground hover:bg-slate-100"
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit JV
                            </Button>
                            <Button
                                onClick={handlePrint}
                                className="h-11 px-5 text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 border-none transition-all uppercase tracking-widest"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Summary Info */}
                        <Card className="p-6 rounded-2xl border-border/50 bg-surface-1/50 shadow-sm space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">General Info</h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-indigo-500" />
                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Voucher Date</p>
                                        <p className="text-xs font-bold text-foreground">{formatSafeDate(receipt.date, 'dd MMMM yyyy')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Created At</p>
                                        <p className="text-xs font-bold text-foreground">
                                            {new Date(receipt.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-indigo-500" />
                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Prepared By</p>
                                        <p className="text-xs font-bold text-foreground">{receipt.created_by_user?.name || 'Fayyaz Ahmed'}</p>
                                    </div>
                                </div>
                            </div>

                            {receipt.remarks && (
                                <div className="pt-3 border-t border-border/50">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Remarks</p>
                                    <p className="text-xs font-medium text-foreground italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-border/50">
                                        "{receipt.remarks}"
                                    </p>
                                </div>
                            )}
                        </Card>

                        {/* Double Entry Flow */}
                        <Card className="md:col-span-2 p-6 rounded-2xl border-indigo-500/20 shadow-sm relative overflow-hidden bg-card flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-6">Double Entry Details</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center relative z-10">
                                    {/* Debit (Payment) Side */}
                                    <div className="p-4 rounded-2xl border border-rose-500/10 bg-rose-500/5 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">DEBIT (Destination)</span>
                                        </div>
                                        <p className="text-base font-black text-foreground uppercase">{payment.account?.title}</p>
                                        <p className="text-xs font-semibold text-muted-foreground">{payment.account?.code || 'No Code'}</p>
                                    </div>

                                    {/* Credit (Receipt) Side */}
                                    <div className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">CREDIT (Source)</span>
                                        </div>
                                        <p className="text-base font-black text-foreground uppercase">{receipt.account?.title}</p>
                                        <p className="text-xs font-semibold text-muted-foreground">{receipt.account?.code || 'No Code'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Amount Transfer Value</span>
                                    <p className="text-3xl font-black tracking-tight text-indigo-600 tabular-nums">
                                        PKR {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">In Words</span>
                                    <p className="text-xs font-black text-foreground uppercase italic mt-1">
                                        "{receipt.amount_in_words || 'Rupees Only'}"
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Allocations Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {/* Source Account Allocations */}
                        <Card className="rounded-2xl border-rose-500/20 shadow-sm overflow-hidden flex flex-col bg-card">
                            <div className="bg-rose-500/10 px-4 py-3 border-b border-rose-500/10">
                                <h3 className="text-xs font-black uppercase tracking-widest text-rose-600">Credit Allocations (Source)</h3>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Bills reduced by this JV entry</p>
                            </div>
                            <div className="p-4 space-y-2">
                                {receipt.allocations.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground font-semibold">No bills adjusted.</div>
                                ) : (
                                    receipt.allocations.map((alloc: any) => (
                                        <div key={alloc.id} className="flex justify-between items-center p-3 rounded-xl border border-border/50 bg-surface-1">
                                            <div>
                                                <p className="text-[11px] font-black text-foreground">
                                                    {alloc.bill?.invoice || 'Bill ID ' + alloc.bill_id}
                                                </p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">
                                                    {alloc.bill_type === 'App\\Models\\Sales' ? 'Sales Invoice' : 'Purchase Bill'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-rose-600">PKR {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Adjusted</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        {/* Destination Account Allocations */}
                        <Card className="rounded-2xl border-emerald-500/20 shadow-sm overflow-hidden flex flex-col bg-card">
                            <div className="bg-emerald-500/10 px-4 py-3 border-b border-emerald-500/10">
                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Debit Allocations (Destination)</h3>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Bills reduced by this JV entry</p>
                            </div>
                            <div className="p-4 space-y-2">
                                {payment.allocations.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground font-semibold">No bills adjusted.</div>
                                ) : (
                                    payment.allocations.map((alloc: any) => (
                                        <div key={alloc.id} className="flex justify-between items-center p-3 rounded-xl border border-border/50 bg-surface-1">
                                            <div>
                                                <p className="text-[11px] font-black text-foreground">
                                                    {alloc.bill?.invoice || 'Bill ID ' + alloc.bill_id}
                                                </p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">
                                                    {alloc.bill_type === 'App\\Models\\Sales' ? 'Sales Invoice' : 'Purchase Bill'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-emerald-600">PKR {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Adjusted</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
