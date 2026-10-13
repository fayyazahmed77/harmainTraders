import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Printer, 
    Edit3, 
    Calendar, 
    Clock, 
    User, 
    ArrowRightLeft,
    CheckCircle2,
    FileText,
    Building2,
    CreditCard
} from "lucide-react";
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSafeDate } from '@/lib/utils';

interface Props {
    receipt: any;
    payment: any;
    voucher_no: string;
    amount_in_words?: string;
}

export default function JournalVoucherShow({ receipt, payment, voucher_no, amount_in_words }: Props) {
    const handlePrint = () => {
        window.open(route('journal-vouchers.pdf', receipt.id), '_blank');
    };

    const hasAllocations = (receipt.allocations && receipt.allocations.length > 0) || 
                          (payment.allocations && payment.allocations.length > 0);

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-slate-50/50 dark:bg-zinc-950 min-w-0">
                <SiteHeader breadcrumbs={[
                    { title: "Dashboard", href: "/" },
                    { title: "Journal Vouchers", href: route('journal-vouchers.index') },
                    { title: voucher_no, href: "#" }
                ]} />

                <div className="w-full px-4 py-4 md:px-6 space-y-4 max-w-7xl mx-auto">
                    
                    {/* TOP ACTION HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => router.visit(route('journal-vouchers.index'))} 
                                className="h-9 w-9 rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-mono">
                                        {voucher_no}
                                    </h1>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                                        Journal Voucher
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                    Contra double-entry balance adjustment
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.visit(route('journal-vouchers.edit', receipt.id))}
                                className="h-9 px-3.5 text-xs font-semibold rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                Edit Voucher
                            </Button>
                            <Button
                                onClick={handlePrint}
                                className="h-9 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-lg shadow-xs transition-colors"
                            >
                                <Printer className="h-3.5 w-3.5 mr-1.5" />
                                Print PDF
                            </Button>
                        </div>
                    </div>

                    {/* VOUCHER SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs space-y-1">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Voucher Date
                            </span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                {formatSafeDate(receipt.date, 'dd MMM yyyy')}
                            </p>
                        </div>

                        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs space-y-1">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" /> Created Time
                            </span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                {new Date(receipt.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs space-y-1">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 text-slate-400" /> Total Amount
                            </span>
                            <p className="text-sm font-bold font-mono text-slate-900 dark:text-zinc-100">
                                PKR {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>

                        <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs space-y-1">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Status
                            </span>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                Balanced (Posted)
                            </p>
                        </div>
                    </div>

                    {/* DOUBLE ENTRY LEDGER TABLE */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" /> Double Entry Financial Entries
                            </h2>
                            <span className="text-[11px] font-mono text-slate-500">Dr = Cr</span>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900">
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 w-24">Side</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 w-32">Account Code</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300">Account Title</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 w-32">Account Type</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 text-right w-36">Debit (Dr)</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 text-right w-36">Credit (Cr)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Debit Entry (Payment side) */}
                                    <TableRow className="border-b border-slate-100 dark:border-zinc-800/60">
                                        <TableCell className="py-2.5 px-3">
                                            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                                                DEBIT
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 font-mono text-xs text-slate-500">
                                            {payment.account?.code || '-'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 font-semibold text-xs text-slate-900 dark:text-zinc-100">
                                            {payment.account?.title || 'N/A'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 text-xs text-slate-500">
                                            {payment.account?.account_type?.name || 'General'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 font-mono font-semibold text-xs text-right text-slate-900 dark:text-zinc-100 tabular-nums">
                                            PKR {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 font-mono text-xs text-right text-slate-400">
                                            -
                                        </TableCell>
                                    </TableRow>

                                    {/* Credit Entry (Receipt side) */}
                                    <TableRow className="border-b border-slate-100 dark:border-zinc-800/60">
                                        <TableCell className="py-2.5 px-3">
                                            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                                                CREDIT
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 font-mono text-xs text-slate-500">
                                            {receipt.account?.code || '-'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 font-semibold text-xs text-slate-900 dark:text-zinc-100">
                                            {receipt.account?.title || 'N/A'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 text-xs text-slate-500">
                                            {receipt.account?.account_type?.name || 'General'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 font-mono text-xs text-right text-slate-400">
                                            -
                                        </TableCell>
                                        <TableCell className="py-2.5 px-3 font-mono font-semibold text-xs text-right text-slate-900 dark:text-zinc-100 tabular-nums">
                                            PKR {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-zinc-800/40 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                            <div className="text-slate-600 dark:text-zinc-400">
                                <span className="font-medium">In Words: </span>
                                <span className="font-semibold text-slate-800 dark:text-zinc-200 italic">
                                    "{amount_in_words || 'PKR ' + Number(receipt.amount).toLocaleString()}"
                                </span>
                            </div>
                            <div className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                                Balanced: PKR {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* REMARKS CARD */}
                    {receipt.remarks && (
                        <div className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs space-y-1">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                                Remarks / Narration
                            </span>
                            <p className="text-xs text-slate-800 dark:text-zinc-200 italic">
                                {receipt.remarks}
                            </p>
                        </div>
                    )}

                    {/* BILL ALLOCATIONS SECTION */}
                    {hasAllocations && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Credit Side Allocations */}
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                            Source Allocations (Credit)
                                        </h3>
                                        <p className="text-[10px] text-slate-500">Invoices settled for {receipt.account?.title}</p>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                                        {receipt.allocations?.length || 0} bills
                                    </span>
                                </div>
                                <div className="p-3 space-y-2">
                                    {(!receipt.allocations || receipt.allocations.length === 0) ? (
                                        <div className="text-center py-6 text-xs text-slate-400">No individual bills assigned.</div>
                                    ) : (
                                        receipt.allocations.map((alloc: any) => (
                                            <div key={alloc.id} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/30 text-xs">
                                                <div>
                                                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                                        {alloc.bill?.invoice || 'Bill #' + alloc.bill_id}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400">
                                                        {alloc.bill_type === 'App\\Models\\Sales' ? 'Sales Invoice' : 'Purchase Bill'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                                                        PKR {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400">Settled</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Debit Side Allocations */}
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                            Destination Allocations (Debit)
                                        </h3>
                                        <p className="text-[10px] text-slate-500">Invoices settled for {payment.account?.title}</p>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                                        {payment.allocations?.length || 0} bills
                                    </span>
                                </div>
                                <div className="p-3 space-y-2">
                                    {(!payment.allocations || payment.allocations.length === 0) ? (
                                        <div className="text-center py-6 text-xs text-slate-400">No individual bills assigned.</div>
                                    ) : (
                                        payment.allocations.map((alloc: any) => (
                                            <div key={alloc.id} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/30 text-xs">
                                                <div>
                                                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                                        {alloc.bill?.invoice || 'Bill #' + alloc.bill_id}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400">
                                                        {alloc.bill_type === 'App\\Models\\Sales' ? 'Sales Invoice' : 'Purchase Bill'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                                                        PKR {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400">Settled</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
