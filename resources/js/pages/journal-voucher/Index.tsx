import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, ShieldCheck, Trash2 } from "lucide-react";
import { Link, router, usePage } from '@inertiajs/react';
import { motion } from "framer-motion";
import { route } from 'ziggy-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSafeDate } from '@/lib/utils';
import { Card } from "@/components/ui/card";
import toast, { Toaster } from 'react-hot-toast';

interface Props {
    jvs: {
        data: any[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: any;
}

export default function JournalVoucherIndex({ jvs, filters }: Props) {
    const { flash } = usePage().props as any;

    React.useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this Journal Voucher? This will reverse both sides of the transaction.')) {
            router.delete(route('journal-vouchers.destroy', id));
        }
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={[{ title: "Dashboard", href: "/" }, { title: "Journal Vouchers", href: "#" }]} />

                <div className="mx-auto w-full max-w-[1600px] p-5 lg:p-6 space-y-8">

                    {/* PROFESSIONAL ACTION HEADER */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-sm">
                                <LayoutDashboard className="h-6 w-6 text-indigo-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                                        Journal Vouchers
                                    </h1>
                                    <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                                        CONTRA_ENGINE
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> DOUBLE_ENTRY_SYS
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2"
                        >
                            <Button
                                onClick={() => router.visit(route('journal-vouchers.create'))}
                                className="h-11 px-6 text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 border-none transition-all group tracking-widest uppercase"
                            >
                                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                Create JV
                            </Button>
                        </motion.div>
                    </div>

                    <Card className="rounded-xl border-border/50 shadow-sm overflow-hidden bg-card">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface-1/50 hover:bg-surface-1/50 border-b border-border/50">
                                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-text-muted">Date</TableHead>
                                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-text-muted">Voucher No</TableHead>
                                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-text-muted">Debit Account</TableHead>
                                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-text-muted">Credit Account</TableHead>
                                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Amount</TableHead>
                                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-text-muted">Remarks</TableHead>
                                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jvs.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-sm font-medium text-muted-foreground">
                                                No Journal Vouchers found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        jvs.data.map((jv) => (
                                            <TableRow key={jv.id} className="border-b border-border/10 hover:bg-indigo-500/5 transition-colors">
                                                <TableCell className="py-3 text-[11px] font-bold text-text-muted whitespace-nowrap">
                                                    {formatSafeDate(jv.date, 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="py-3 text-[11px] font-black text-indigo-500">
                                                    {jv.voucher_no}
                                                </TableCell>
                                                <TableCell className="py-3 text-[11px] font-bold text-text-primary uppercase">
                                                    {jv.debit_account}
                                                </TableCell>
                                                <TableCell className="py-3 text-[11px] font-bold text-text-primary uppercase">
                                                    {jv.credit_account}
                                                </TableCell>
                                                <TableCell className="py-3 text-[11px] font-black text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                                                    {Number(jv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="py-3 text-[10px] font-medium text-text-muted italic max-w-[200px] truncate">
                                                    {jv.remarks || '-'}
                                                </TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                                                        onClick={() => handleDelete(jv.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
