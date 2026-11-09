import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import CustomerPortalLayout from "@/layouts/CustomerPortalLayout";
import {
    BookOpen,
    Download,
    Calendar,
    Filter,
    AlertCircle,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
    business_name?: string | null;
    approval_status: string;
    account_id?: number | null;
    account?: {
        id: number;
        code: string;
        title: string;
    } | null;
}

interface Transaction {
    id: number;
    date: string;
    type: string;
    voucher_no?: string;
    description?: string;
    debit: number;
    credit: number;
    balance: number;
}

interface LedgerData {
    opening_balance: number;
    opening_balance_type: string;
    total_debit: number;
    total_credit: number;
    closing_balance: number;
    current_balance: number;
    balance_type: string;
    data: {
        data: Transaction[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    from_date: string | null;
    to_date: string | null;
}

interface Props {
    customer: CustomerUser;
    ledger?: LedgerData | null;
    is_linked: boolean;
    filters: {
        from: string | null;
        to: string | null;
    };
}

export default function CustomerLedger({ customer, ledger, is_linked, filters }: Props) {
    const [from, setFrom] = useState(filters.from || "");
    const [to, setTo] = useState(filters.to || "");

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/customer/ledger",
            { from, to },
            { preserveState: true, replace: true }
        );
    };

    return (
        <CustomerPortalLayout customer={customer}>
            <Head title="Account Statement & Ledger - Haramain Traders" />

            <div className="space-y-6">
                {/* Header & Statement Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                            Account Statement & Ledger
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Transparent running statement of wholesale debits, payments, credits, and current closing balance.
                        </p>
                    </div>

                    {is_linked && (
                        <a
                            href={`/customer/ledger/pdf?from=${from}&to=${to}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button className="h-10 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5">
                                <Download className="w-4 h-4" />
                                <span>Export PDF Statement</span>
                            </Button>
                        </a>
                    )}
                </div>

                {/* Summary Cards */}
                {ledger && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Opening Balance</span>
                            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                Rs. {Number(ledger.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">
                                {ledger.opening_balance_type}
                            </span>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Period Debits (Sales)</span>
                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                Rs. {Number(ledger.total_debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Billed to Account</span>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Period Credits (Payments)</span>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                Rs. {Number(ledger.total_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Payments Received</span>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Current Balance</span>
                            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                Rs. {Number(ledger.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-amber-600 font-bold uppercase">Net Payable</span>
                        </div>
                    </div>
                )}

                {/* Filter & Transactions Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
                    {/* Date Filter Bar */}
                    <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500">From:</span>
                            <Input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="h-9 text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500">To:</span>
                            <Input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="h-9 text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl"
                            />
                        </div>
                        <Button type="submit" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white">
                            Filter Statement
                        </Button>
                    </form>

                    {!is_linked ? (
                        <div className="py-14 text-center text-zinc-400 space-y-3">
                            <AlertCircle className="w-10 h-10 mx-auto text-amber-500/80" />
                            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                                ERP Ledger Linkage Pending
                            </h3>
                            <p className="text-xs max-w-md mx-auto">
                                Detailed general ledger statements will appear once our administration links your wholesale account.
                            </p>
                        </div>
                    ) : !ledger || ledger.data.data.length === 0 ? (
                        <div className="py-14 text-center text-zinc-400 space-y-2">
                            <BookOpen className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                            <p className="text-xs font-semibold">No transactions found in this statement range.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-bold">
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Type</th>
                                        <th className="py-3 px-3">Voucher #</th>
                                        <th className="py-3 px-3">Description</th>
                                        <th className="py-3 px-3 text-right">Debit (Rs.)</th>
                                        <th className="py-3 px-3 text-right">Credit (Rs.)</th>
                                        <th className="py-3 px-3 text-right">Running Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {ledger.data.data.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                                            <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 font-mono">
                                                {new Date(tx.date).toLocaleDateString(undefined, {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </td>
                                            <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                                                {tx.type}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-zinc-500">
                                                {tx.voucher_no || "-"}
                                            </td>
                                            <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                                                {tx.description || "-"}
                                            </td>
                                            <td className="py-3 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                                                {Number(tx.debit) > 0 ? Number(tx.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                            </td>
                                            <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                {Number(tx.credit) > 0 ? Number(tx.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                            </td>
                                            <td className="py-3 px-3 text-right font-black text-zinc-900 dark:text-zinc-100">
                                                Rs. {Number(tx.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {ledger.data.last_page > 1 && (
                                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                                    <span>
                                        Showing page {ledger.data.current_page} of {ledger.data.last_page} ({ledger.data.total} records)
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {ledger.data.prev_page_url && (
                                            <Link href={ledger.data.prev_page_url}>
                                                <Button size="sm" variant="outline" className="h-8 text-xs font-bold">
                                                    Previous
                                                </Button>
                                            </Link>
                                        )}
                                        {ledger.data.next_page_url && (
                                            <Link href={ledger.data.next_page_url}>
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

