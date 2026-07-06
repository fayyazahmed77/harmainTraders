import React, { useState, useMemo } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Search, 
    Filter, 
    RotateCcw, 
    Printer, 
    Eye, 
    LayoutDashboard,
    ShieldCheck,
    Calendar as CalendarIcon 
} from "lucide-react";
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { route } from 'ziggy-js';

import DashboardStats from './components/DashboardStats';
import UnifiedPerformanceLog from './components/UnifiedPerformanceLog';

interface Invoice {
    id: number;
    invoice_no: string;
    date: string;
    type: 'Sale' | 'Purchase';
    party_name: string;
    account_id: number;
    gross_total: number;
    discount_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
}

interface Account {
    id: number;
    title: string;
    type: string;
}

interface Props {
    invoices: Invoice[];
    accounts: Account[];
    sales_summary: any;
    purchase_summary: any;
    analytics: any[];
    filters: {
        start_date?: string;
        end_date?: string;
        account_id?: string;
        type?: string;
    };
}

export default function UnpaidBills({ 
    invoices, 
    accounts, 
    sales_summary, 
    purchase_summary, 
    analytics, 
    filters 
}: Props) {
    const [search, setSearch] = useState("");
    const [type, setType] = useState(filters.type || "all");
    const [accountId, setAccountId] = useState(filters.account_id || "all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });

    // Apply server-side filters (to recalculate statistics and retrieve matching invoices)
    const applyFilters = () => {
        router.get(
            "/payments/unpaid-invoices",
            {
                start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "",
                end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "",
                account_id: accountId === "all" ? "" : accountId,
                type: type === "all" ? "" : type,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Reset filters
    const clearFilters = () => {
        setSearch("");
        setType("all");
        setAccountId("all");
        setDateRange(undefined);
        router.get("/payments/unpaid-invoices");
    };

    // Client-side real-time table filtering (for search keyword)
    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv) => {
            const matchesSearch = 
                inv.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
                inv.party_name?.toLowerCase().includes(search.toLowerCase());

            // If user hasn't clicked apply yet, but changed state, we also match local selections for instant response
            const matchesType = type === "all" || inv.type === type;
            const matchesAccount = accountId === "all" || inv.account_id.toString() === accountId;

            return matchesSearch && matchesType && matchesAccount;
        });
    }, [invoices, search, type, accountId]);

    return (
        <SidebarProvider>
            <Head title="Payments | Unpaid Invoices Registry" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={[
                    { title: "Dashboard", href: "/" },
                    { title: "Unpaid Invoices Registry", href: "#" }
                ]} />

                <div className="mx-auto w-full max-w-[1600px] p-5 lg:p-6 space-y-8">

                    {/* PROFESSIONAL ACTION HEADER (Identical to index.tsx) */}
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
                                        Unpaid Invoices Registry
                                    </h1>
                                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                        OUTSTANDING
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
                                onClick={() => router.visit(route('payment.index'))}
                                className="h-11 px-6 text-xs font-black bg-[#FF8904] text-white hover:bg-[#e67a03] rounded-xl shadow-lg shadow-orange-500/10 border-none transition-all group tracking-widest uppercase"
                            >
                                Payment Dashboard
                            </Button>
                        </motion.div>
                    </div>

                    {/* COCKPIT GRID (3-Column Layout - Identical to index.tsx) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch w-full">
                        <DashboardStats type="sales" mode="value" data={sales_summary} />
                        <UnifiedPerformanceLog data={analytics} />
                        <DashboardStats type="purchase" mode="value" data={purchase_summary} />
                    </div>

                    {/* FILTERS & SEARCH PANEL (Identical style to PaymentFilters.tsx) */}
                    <div className="space-y-4 pt-4">
                        <div className="p-4 rounded-lg shadow-sm border space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            {/* Search Keyword */}
                            <div className="flex-1 min-w-[200px] relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Search invoice or party name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 rounded-lg"
                                />
                            </div>

                            {/* Date Range Picker */}
                            <div className="flex-1 min-w-[200px]">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant="outline"
                                            className={cn(
                                                "w-full h-10 justify-start text-left font-normal rounded-lg",
                                                !dateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Account Selector */}
                            <div className="flex-1 min-w-[180px]">
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger className="h-10 rounded-lg w-full">
                                        <SelectValue placeholder="Select Party" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Accounts</SelectItem>
                                        {accounts.map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id.toString()}>
                                                {acc.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Type Selector */}
                            <div className="flex-1 min-w-[150px]">
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="h-10 rounded-lg w-full">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="Sale">Sales (Customers)</SelectItem>
                                        <SelectItem value="Purchase">Purchases (Suppliers)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={applyFilters} 
                                    className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-4 rounded-lg"
                                >
                                    <Filter className="mr-2 h-4 w-4" /> Apply
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={clearFilters} 
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-3 rounded-lg"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* DATA TABLE (Identical styled headers) */}
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest py-3">Date</TableHead>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest">Invoice #</TableHead>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest">Type</TableHead>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest">Party Name</TableHead>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest text-right">Net Total</TableHead>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest text-right">Paid Amount</TableHead>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest text-right text-orange-600 dark:text-orange-400">Remaining</TableHead>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                                        <TableHead className="font-extrabold uppercase text-[10px] tracking-widest text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredInvoices.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="h-32 text-center text-zinc-400 dark:text-zinc-600 font-bold uppercase text-[10px] tracking-widest">
                                                    No outstanding unpaid invoices found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredInvoices.map((inv) => (
                                                <TableRow 
                                                    key={`${inv.type}_${inv.id}`} 
                                                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                                >
                                                    {/* Date */}
                                                    <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400 py-3.5">
                                                        {inv.date ? format(new Date(inv.date), "dd-MMM-yyyy") : "N/A"}
                                                    </TableCell>

                                                    {/* Invoice # */}
                                                    <TableCell className="font-bold text-xs text-zinc-950 dark:text-zinc-50">
                                                        {inv.invoice_no}
                                                    </TableCell>

                                                    {/* Type */}
                                                    <TableCell>
                                                        <span className={cn(
                                                            "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border",
                                                            inv.type === 'Sale' 
                                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-400"
                                                                : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-400"
                                                        )}>
                                                            {inv.type}
                                                        </span>
                                                    </TableCell>

                                                    {/* Party Title */}
                                                    <TableCell className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                                                        {inv.party_name}
                                                    </TableCell>

                                                    {/* Net Total */}
                                                    <TableCell className="font-mono text-xs text-right font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {inv.net_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </TableCell>

                                                    {/* Paid Amount */}
                                                    <TableCell className="font-mono text-xs text-right text-zinc-500 dark:text-zinc-400">
                                                        {inv.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </TableCell>

                                                    {/* Remaining */}
                                                    <TableCell className="font-mono text-xs text-right font-bold text-orange-600 dark:text-orange-400">
                                                        {inv.remaining_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full",
                                                            inv.status?.toLowerCase() === 'unpaid' 
                                                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                        )}>
                                                            {inv.status || 'UNPAID'}
                                                        </span>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* View Details */}
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                                onClick={() => {
                                                                    const viewUrl = inv.type === 'Sale' 
                                                                        ? `/sales/${inv.id}/view` 
                                                                        : `/purchase/${inv.id}/view`;
                                                                    window.open(viewUrl, '_blank');
                                                                }}
                                                                title="View Dossier"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>

                                                            {/* Print PDF */}
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                                onClick={() => {
                                                                    const printUrl = inv.type === 'Sale' 
                                                                        ? `/sales/${inv.id}/pdf` 
                                                                        : `/purchase/${inv.id}/pdf`;
                                                                    window.open(printUrl, '_blank');
                                                                }}
                                                                title="Print Voucher"
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* COMPACT FOOTER FOOTNOTE */}
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-8 opacity-30 select-none pointer-events-none mb-6">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em]">FIN_OUTSTANDING_LOG_V1.0 // OPS.ID: 9942-OUT-SYS</p>
                        <p className="text-[8px] font-bold font-mono tracking-widest mt-2 sm:mt-0 uppercase">REGISTRY_ACTIVE // {new Date().getFullYear()}-HB-SYS</p>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
