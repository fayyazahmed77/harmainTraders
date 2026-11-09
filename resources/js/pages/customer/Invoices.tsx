import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import CustomerPortalLayout from "@/layouts/CustomerPortalLayout";
import {
    Receipt,
    CheckCircle2,
    Clock,
    FileText,
    Download,
    Search,
    Filter,
    ArrowUpDown,
    AlertCircle,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
    business_name?: string | null;
    approval_status: string;
    account_id?: number | null;
}

interface SaleInvoice {
    id: number;
    invoice: string;
    date: string;
    net_total: number;
    extra_discount: number;
    total_receivable: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
    firm?: {
        id: number;
        name: string;
    } | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Summary {
    total_invoiced: number;
    total_paid: number;
    total_due: number;
    count_paid: number;
    count_due: number;
}

interface Props {
    customer: CustomerUser;
    invoices: PaginatedData<SaleInvoice>;
    summary: Summary;
    is_linked: boolean;
    filters: {
        tab: string;
        search: string;
    };
}

export default function CustomerInvoices({ customer, invoices, summary, is_linked, filters }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const activeTab = filters.tab || "all";

    const handleTabChange = (newTab: string) => {
        router.get(
            "/customer/invoices",
            { tab: newTab, search: search.trim() },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/customer/invoices",
            { tab: activeTab, search: search.trim() },
            { preserveState: true, replace: true }
        );
    };

    return (
        <CustomerPortalLayout customer={customer}>
            <Head title="Invoices & Paid Bills - Haramain Traders" />

            <div className="space-y-6">
                {/* Page Title & Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                            Invoices & Paid Bills
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Review your official ERP sales bills, payment statuses, and download tax invoices.
                        </p>
                    </div>

                    <Link href="/live-offers">
                        <Button className="h-10 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                            Browse Live Offers
                        </Button>
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Invoiced</span>
                        <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                            Rs. {Number(summary.total_invoiced || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-zinc-400">All ERP wholesale sales</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Settled / Paid</span>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            Rs. {Number(summary.total_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-zinc-400">{summary.count_paid} fully settled bill(s)</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Outstanding / Due</span>
                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                            Rs. {Number(summary.total_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-zinc-400">{summary.count_due} pending payment</span>
                    </div>
                </div>

                {/* Filters & Search Bar */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {/* Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
                            {[
                                { id: "all", label: "All Invoices" },
                                { id: "paid", label: "Paid Bills" },
                                { id: "due", label: "Due / Unpaid" },
                                { id: "partial", label: "Partially Paid" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                        activeTab === tab.id
                                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search input */}
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-xs w-full">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Search invoice number..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 text-xs pl-8 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-xl font-mono"
                                />
                                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            </div>
                            <Button type="submit" size="sm" variant="outline" className="h-9 px-3 rounded-xl text-xs font-bold">
                                Search
                            </Button>
                        </form>
                    </div>

                    {/* Table View */}
                    {!is_linked ? (
                        <div className="py-14 text-center text-zinc-400 space-y-3">
                            <AlertCircle className="w-10 h-10 mx-auto text-amber-500/80" />
                            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                                ERP Account Not Yet Linked
                            </h3>
                            <p className="text-xs max-w-md mx-auto">
                                Your online registration is currently pending linking to your ERP Chart of Accounts. 
                                Invoices and bill history will populate automatically once linked by accounts.
                            </p>
                        </div>
                    ) : invoices.data.length === 0 ? (
                        <div className="py-14 text-center text-zinc-400 space-y-2">
                            <Receipt className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                            <p className="text-xs font-semibold">No invoices found matching your filter criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-bold">
                                        <th className="py-3 px-3">Invoice #</th>
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3 text-right">Total (Rs.)</th>
                                        <th className="py-3 px-3 text-right">Paid (Rs.)</th>
                                        <th className="py-3 px-3 text-right">Due Balance (Rs.)</th>
                                        <th className="py-3 px-3 text-center">Status</th>
                                        <th className="py-3 px-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {invoices.data.map((inv) => {
                                        const remaining = Number(inv.remaining_amount);
                                        const isPaid = remaining <= 0.005;
                                        const isPartial = !isPaid && Number(inv.paid_amount) > 0;

                                        return (
                                            <tr key={inv.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                                                <td className="py-3.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                                    {inv.invoice}
                                                </td>
                                                <td className="py-3.5 px-3 text-zinc-500">
                                                    {new Date(inv.date).toLocaleDateString(undefined, {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </td>
                                                <td className="py-3.5 px-3 text-right font-black text-zinc-900 dark:text-zinc-100">
                                                    {Number(inv.total_receivable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {Number(inv.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3.5 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                                                    {isPaid ? "0.00" : remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3.5 px-3 text-center">
                                                    {isPaid ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px] px-2 py-0.5 font-bold">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                                                        </Badge>
                                                    ) : isPartial ? (
                                                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-[10px] px-2 py-0.5 font-bold">
                                                            Partial
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 text-[10px] px-2 py-0.5 font-bold">
                                                            Due
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <a
                                                            href={`/customer/invoices/${inv.id}/pdf`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] transition-colors"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            <span>View</span>
                                                        </a>
                                                        <a
                                                            href={`/customer/invoices/${inv.id}/pdf`}
                                                            download={`Invoice-${inv.invoice}.pdf`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                            <span>PDF</span>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {invoices.last_page > 1 && (
                                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                                    <span>
                                        Showing page {invoices.current_page} of {invoices.last_page} ({invoices.total} records)
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {invoices.prev_page_url && (
                                            <Link href={invoices.prev_page_url}>
                                                <Button size="sm" variant="outline" className="h-8 text-xs font-bold">
                                                    Previous
                                                </Button>
                                            </Link>
                                        )}
                                        {invoices.next_page_url && (
                                            <Link href={invoices.next_page_url}>
                                                <Button size="sm" variant="outline" className="h-8 text-xs font-bold">
                                                    Next
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </CustomerPortalLayout>
    );
}

