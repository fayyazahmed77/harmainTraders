import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Landmark, Clock, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn, formatSafeDate } from '@/lib/utils';
import { PaginationState } from '@tanstack/react-table';

export function BankLedgerReportView({ 
    data, 
    criteria,
    openingBalance = 0,
    totalDebit = 0, // Cleared Deposits
    totalCredit = 0, // Cleared Withdrawals
    totalUnclearedFloat = 0, // Pending cheques issued
    closingBalance = 0, // Real Cleared Bank Balance
    pageCount = 1,
    pagination,
    setPagination,
    accountInfo
}: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState<'all' | 'cleared' | 'pending'>('all');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const filteredData = data.filter((row: any) => {
        // Mode filter
        if (filterMode === 'cleared' && !row.is_cleared) return false;
        if (filterMode === 'pending' && row.is_cleared) return false;

        // Search filter
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const party = (row.contra_party || row.description || '').toLowerCase();
        const voucher = (row.voucher_no || '').toLowerCase();
        const cheque = (row.cheque_no || '').toLowerCase();
        const status = (row.cheque_status || '').toLowerCase();
        return party.includes(term) || voucher.includes(term) || cheque.includes(term) || status.includes(term);
    });

    return (
        <div className="space-y-6">
            {/* 5 KPI Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Opening Bank Balance */}
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-indigo-500 p-4 shadow-sm">
                    <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Opening Bank Balance</p>
                    <div className="flex items-center gap-2 mt-1">
                        <h3 className="text-xl font-bold text-text-primary">Rs {formatCurrency(Math.abs(openingBalance))}</h3>
                        {Math.abs(Number(openingBalance)) >= 0.01 && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-black text-white uppercase",
                                openingBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"
                            )}>
                                {openingBalance >= 0 ? 'DR' : 'CR'}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-text-muted mt-1">Cleared before period</p>
                </div>

                {/* 2. Total Cleared Deposits */}
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-emerald-500 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Deposits (IN)</p>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-500 mt-1">Rs {formatCurrency(totalDebit)}</h3>
                    <p className="text-[10px] text-text-muted mt-1">Cleared money in</p>
                </div>

                {/* 3. Total Cleared Withdrawals */}
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-rose-500 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Withdrawals (OUT)</p>
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-rose-500 mt-1">Rs {formatCurrency(totalCredit)}</h3>
                    <p className="text-[10px] text-text-muted mt-1">Cleared cheques / debits</p>
                </div>

                {/* 4. Uncleared Float (Issued Pending Cheques) */}
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-amber-500 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Pending Cheques Float</p>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-amber-600 mt-1">Rs {formatCurrency(totalUnclearedFloat)}</h3>
                    <p className="text-[10px] text-amber-700/80 mt-1 font-medium">Issued but unpresented</p>
                </div>

                {/* 5. Real Cleared Bank Balance */}
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-sky-500 p-4 shadow-sm bg-gradient-to-br from-sky-50/30 to-transparent dark:from-sky-950/20">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold tracking-wider text-sky-800 dark:text-sky-300 uppercase">Real Bank Balance</p>
                        <Landmark className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <h3 className={cn("text-xl font-black", closingBalance >= 0 ? "text-sky-700 dark:text-sky-300" : "text-rose-600")}>
                            Rs {formatCurrency(Math.abs(closingBalance))}
                        </h3>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-black text-white uppercase",
                            closingBalance >= 0 ? "bg-emerald-600" : "bg-rose-600"
                        )}>
                            {closingBalance >= 0 ? 'DR' : 'CR'}
                        </span>
                    </div>
                    <p className="text-[10px] text-sky-700 dark:text-sky-400 mt-1 font-semibold">Matches Real Bank Book</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                    <Button 
                        size="sm" 
                        variant={filterMode === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilterMode('all')}
                        className="text-xs h-8"
                    >
                        All Transactions
                    </Button>
                    <Button 
                        size="sm" 
                        variant={filterMode === 'cleared' ? 'default' : 'outline'}
                        onClick={() => setFilterMode('cleared')}
                        className="text-xs h-8"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                        Cleared Only
                    </Button>
                    <Button 
                        size="sm" 
                        variant={filterMode === 'pending' ? 'default' : 'outline'}
                        onClick={() => setFilterMode('pending')}
                        className="text-xs h-8"
                    >
                        <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" />
                        Pending Cheques Only
                    </Button>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input 
                        type="text"
                        placeholder="Search party, voucher, cheque #..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface-0 border border-border rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Data Table */}
            <Card className="shadow-none border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 uppercase font-semibold text-text-muted text-[11px] border-b border-border">
                            <tr>
                                <th className="p-3 w-24">Date</th>
                                <th className="p-3 w-28">Voucher #</th>
                                <th className="p-3">Beneficiary / Contra Party</th>
                                <th className="p-3 w-20">Method</th>
                                <th className="p-3 w-28">Cheque #</th>
                                <th className="p-3 w-24">Cheque Date</th>
                                <th className="p-3 w-24">Clear Date</th>
                                <th className="p-3 w-32 text-center">Status</th>
                                <th className="p-3 w-28 text-right">Deposit (IN)</th>
                                <th className="p-3 w-28 text-right">Withdrawal (OUT)</th>
                                <th className="p-3 w-32 text-right">Bank Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center p-8 text-text-muted">
                                        No bank transactions found matching the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row: any, idx: number) => {
                                    const isPending = !row.is_cleared;
                                    return (
                                        <tr 
                                            key={row.id || idx} 
                                            className={cn(
                                                "hover:bg-muted/20 transition-colors",
                                                isPending && "bg-amber-50/30 dark:bg-amber-950/10"
                                            )}
                                        >
                                            <td className="p-3 whitespace-nowrap text-text-muted font-medium">
                                                {formatSafeDate(row.date)}
                                            </td>
                                            <td className="p-3 whitespace-nowrap font-semibold text-text-primary">
                                                {row.voucher_no}
                                            </td>
                                            <td className="p-3 font-medium text-text-primary">
                                                {row.contra_party || row.description || 'General Account'}
                                            </td>
                                            <td className="p-3 whitespace-nowrap text-text-muted">
                                                {row.method || 'Cash'}
                                            </td>
                                            <td className="p-3 whitespace-nowrap font-mono text-text-secondary">
                                                {row.cheque_no || '-'}
                                            </td>
                                            <td className="p-3 whitespace-nowrap text-text-muted">
                                                {row.cheque_date ? formatSafeDate(row.cheque_date) : '-'}
                                            </td>
                                            <td className="p-3 whitespace-nowrap text-text-muted">
                                                {row.clear_date ? formatSafeDate(row.clear_date) : '-'}
                                            </td>
                                            <td className="p-3 text-center whitespace-nowrap">
                                                {row.is_cleared ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        CLEARED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right whitespace-nowrap font-semibold text-emerald-600">
                                                {row.deposit > 0 ? formatCurrency(row.deposit) : '-'}
                                            </td>
                                            <td className="p-3 text-right whitespace-nowrap font-semibold text-rose-600">
                                                {row.withdrawal > 0 ? formatCurrency(row.withdrawal) : '-'}
                                            </td>
                                            <td className="p-3 text-right whitespace-nowrap font-bold text-text-primary">
                                                {formatCurrency(row.running_balance || row.balance)}
                                                {isPending && (
                                                    <span className="block text-[9px] font-normal text-amber-600">
                                                        (No impact yet)
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pageCount > 1 && pagination && setPagination && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
                        <span className="text-xs text-text-muted">
                            Page {pagination.pageIndex + 1} of {pageCount}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                disabled={pagination.pageIndex === 0}
                                onClick={() => setPagination((prev: PaginationState) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                disabled={pagination.pageIndex >= pageCount - 1}
                                onClick={() => setPagination((prev: PaginationState) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

