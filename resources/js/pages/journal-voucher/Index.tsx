import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
    Plus, 
    Trash2, 
    Eye, 
    Edit3, 
    Printer, 
    ChevronLeft, 
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileSpreadsheet,
    FileText
} from "lucide-react";
import { router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatSafeDate } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import toast, { Toaster } from 'react-hot-toast';
import JournalVoucherFilters from './components/JournalVoucherFilters';

interface Props {
    jvs: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page?: number;
        total: number;
        links?: any[];
    };
    total_amount?: number;
    accounts?: any[];
    filters: any;
}

export default function JournalVoucherIndex({ jvs, total_amount = 0, accounts = [], filters }: Props) {
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
        if (confirm('Are you sure you want to delete this Journal Voucher? This will reverse both debit and credit entries.')) {
            router.delete(route('journal-vouchers.destroy', id));
        }
    };

    const handlePageChange = (url: string | null) => {
        if (!url) return;
        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handlePerPageChange = (val: string) => {
        router.get(
            '/journal-vouchers',
            { ...filters, per_page: val, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const currentPerPage = Number(jvs.per_page) || 50;
    const fromItem = jvs.total === 0 ? 0 : (jvs.current_page - 1) * currentPerPage + 1;
    const toItem = Math.min(jvs.current_page * currentPerPage, jvs.total);

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-slate-50/50 dark:bg-zinc-950 min-w-0">
                <SiteHeader breadcrumbs={[{ title: "Dashboard", href: "/" }, { title: "Journal Vouchers", href: "#" }]} />

                <div className="w-full px-4 py-4 md:px-6 space-y-4">

                    {/* PROFESSIONAL ERP HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                                Journal Vouchers
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                Double-entry contra adjustments and journal entries
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Summary KPI Badges */}
                            <div className="hidden sm:flex items-center gap-4 text-xs pr-2 border-r border-slate-200 dark:border-zinc-800">
                                <div>
                                    <span className="text-slate-400 font-medium">Vouchers: </span>
                                    <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">{jvs.total}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Total: </span>
                                    <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">
                                        Rs {Number(total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.visit(route('journal-vouchers.create'))}
                                className="h-9 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-lg shadow-xs transition-colors"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Create JV
                            </Button>
                        </div>
                    </div>

                    {/* ESSENTIAL CORE FILTERS BAR */}
                    <JournalVoucherFilters
                        filters={filters}
                        accounts={accounts}
                        totalAmount={total_amount}
                        totalCount={jvs.total}
                    />

                    {/* DATA TABLE CONTAINER */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800">
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 w-28">Date</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 w-32">Voucher No</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300">Debit Account (Dr)</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300">Credit Account (Cr)</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 text-right w-36">Amount (PKR)</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300">Remarks</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-zinc-300 text-right w-28">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jvs.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-36 text-center text-xs text-slate-500 dark:text-zinc-400">
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <FileText className="h-6 w-6 text-slate-400 stroke-1" />
                                                    <p className="font-medium text-slate-700 dark:text-zinc-300">No Journal Vouchers Found</p>
                                                    <p className="text-slate-400">Try adjusting your search or date filters.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        jvs.data.map((jv) => (
                                            <TableRow key={jv.id} className="h-10 border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                                                <TableCell className="py-2 px-3 text-xs text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                                                    {formatSafeDate(jv.date, 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-xs font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                    <button 
                                                        onClick={() => router.visit(route('journal-vouchers.show', jv.id))}
                                                        className="hover:underline text-left"
                                                    >
                                                        {jv.voucher_no}
                                                    </button>
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-xs font-medium text-slate-800 dark:text-zinc-200">
                                                    {jv.debit_account}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-xs font-medium text-slate-800 dark:text-zinc-200">
                                                    {jv.credit_account}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-xs font-semibold font-mono text-slate-900 dark:text-zinc-100 text-right tabular-nums whitespace-nowrap">
                                                    Rs {Number(jv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[240px]">
                                                    {jv.remarks || '-'}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-0.5">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
                                                            title="View"
                                                            onClick={() => router.visit(route('journal-vouchers.show', jv.id))}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
                                                            title="Edit"
                                                            onClick={() => router.visit(route('journal-vouchers.edit', jv.id))}
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
                                                            title="Print"
                                                            onClick={() => window.open(route('journal-vouchers.pdf', jv.id), '_blank')}
                                                        >
                                                            <Printer className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md"
                                                            title="Delete"
                                                            onClick={() => handleDelete(jv.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* PROFESSIONAL PAGINATION FOOTER (DEFAULT 50 ROWS) */}
                        {jvs.total > 0 && (
                            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-zinc-400">
                                <div>
                                    Showing <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">{fromItem}</span> to <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">{toItem}</span> of <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">{jvs.total}</span> entries
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Per Page Selector */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Rows per page:</span>
                                        <Select value={String(currentPerPage)} onValueChange={handlePerPageChange}>
                                            <SelectTrigger className="h-7 w-16 text-xs font-medium rounded-md border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg">
                                                <SelectItem value="15">15</SelectItem>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Page Number Buttons */}
                                    {jvs.links && jvs.links.length > 3 && (
                                        <div className="flex items-center gap-1">
                                            {jvs.links.map((link, idx) => {
                                                const isPrev = link.label.includes('&laquo;') || link.label.toLowerCase().includes('prev');
                                                const isNext = link.label.includes('&raquo;') || link.label.toLowerCase().includes('next');
                                                const label = isPrev ? <ChevronLeft className="h-3.5 w-3.5" /> : isNext ? <ChevronRight className="h-3.5 w-3.5" /> : link.label;

                                                return (
                                                    <Button
                                                        key={idx}
                                                        size="sm"
                                                        variant={link.active ? "default" : "outline"}
                                                        disabled={!link.url}
                                                        onClick={() => handlePageChange(link.url)}
                                                        className={cn(
                                                            "h-7 min-w-7 px-2 text-xs font-medium rounded-md transition-colors",
                                                            link.active 
                                                                ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100" 
                                                                : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300",
                                                            !link.url && "opacity-40 cursor-not-allowed"
                                                        )}
                                                    >
                                                        {label}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
