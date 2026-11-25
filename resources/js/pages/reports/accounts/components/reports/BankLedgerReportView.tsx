import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Landmark, CheckCircle2, ArrowDownRight, ArrowUpRight, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatSafeDate } from '@/lib/format-utils';
import { PaginationState } from '@tanstack/react-table';

const BANK_FILTER_LABELS: Record<string, string> = {
    online: 'Online Only',
    cheque: 'Cheque Only',
    payment: 'Debit Only (OUT)',
    receipt: 'Credit Only (IN)',
};

export function BankLedgerReportView({ 
    data, 
    criteria,
    openingBalance = 0,
    totalDebit = 0,   // Real Bank Statement Debit = Withdrawals / Money OUT
    totalCredit = 0,  // Real Bank Statement Credit = Deposits / Money IN
    closingBalance = 0, // Real Cleared Bank Balance
    pageCount = 1,
    totalRecords,
    pagination,
    setPagination,
    bankFilter = 'ALL',
    searchTerm: controlledSearchTerm,
    setSearchTerm: controlledSetSearchTerm,
    isLoading = false,
    accountInfo
}: any) {
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    const searchTerm = controlledSearchTerm !== undefined ? controlledSearchTerm : localSearchTerm;
    const setSearchTerm = controlledSetSearchTerm ?? setLocalSearchTerm;

    const isServerFiltered = controlledSearchTerm !== undefined;
    const activeBankFilterLabel = BANK_FILTER_LABELS[String(bankFilter || '').toLowerCase()];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const filteredData = isServerFiltered
        ? data
        : data.filter((row: any) => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const party = (row.contra_party || row.description || '').toLowerCase();
            const voucher = (row.voucher_no || '').toLowerCase();
            const cheque = (row.cheque_no || '').toLowerCase();
            const method = (row.method || '').toLowerCase();
            return party.includes(term) || voucher.includes(term) || cheque.includes(term) || method.includes(term);
        });

    return (
        <div className="space-y-6">
            {/* 4 KPI Metric Cards (Real Bank Statement Summary) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* 2. Total Debit (Withdrawals / Money OUT) */}
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-rose-500 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Debit</p>
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-rose-500 mt-1">Rs {formatCurrency(totalDebit)}</h3>
                    <p className="text-[10px] text-text-muted mt-1">Withdrawals / Money out</p>
                </div>

                {/* 3. Total Credit (Deposits / Money IN) */}
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-emerald-500 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Credit</p>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-500 mt-1">Rs {formatCurrency(totalCredit)}</h3>
                    <p className="text-[10px] text-text-muted mt-1">Deposits / Money in</p>
                </div>

                {/* 4. Real Cleared Bank Balance */}
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

            {/* Statement Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-3 rounded-lg border border-border">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Bank Statement (Cleared Transactions Only)
                    </span>
                    {activeBankFilterLabel && (
                        <Badge variant="outline" className="h-8 px-2.5 text-[11px] font-bold border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                            Filter: {activeBankFilterLabel}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {isLoading && (
                        <RefreshCcw className="h-3.5 w-3.5 text-sky-500 animate-spin shrink-0" />
                    )}
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
            </div>

            {/* Data Table */}
            <Card className={cn("shadow-none border border-border rounded-lg overflow-hidden transition-opacity", isLoading && "opacity-60")}>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 uppercase font-semibold text-text-muted text-[11px] border-b border-border">
                            <tr>
                                <th className="p-3 w-28">Date</th>
                                <th className="p-3 w-32">Voucher #</th>
                                <th className="p-3">Beneficiary / Contra Party</th>
                                <th className="p-3 w-24">Method</th>
                                <th className="p-3 w-32">Cheque #</th>
                                <th className="p-3 w-32 text-right">Debit</th>
                                <th className="p-3 w-32 text-right">Credit</th>
                                <th className="p-3 w-36 text-right">Bank Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-text-muted">
                                        No cleared bank transactions found matching the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row: any, idx: number) => {
                                    const debitAmount = Number(row.withdrawal ?? row.bank_debit ?? 0);
                                    const creditAmount = Number(row.deposit ?? row.bank_credit ?? 0);
                                    return (
                                        <tr 
                                            key={row.id || idx} 
                                            className="hover:bg-muted/20 transition-colors"
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
                                            <td className="p-3 text-right whitespace-nowrap font-semibold text-rose-600">
                                                {debitAmount > 0 ? formatCurrency(debitAmount) : '-'}
                                            </td>
                                            <td className="p-3 text-right whitespace-nowrap font-semibold text-emerald-600">
                                                {creditAmount > 0 ? formatCurrency(creditAmount) : '-'}
                                            </td>
                                            <td className="p-3 text-right whitespace-nowrap font-bold text-text-primary">
                                                {formatCurrency(row.running_balance ?? row.balance ?? 0)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pageCount >= 1 && pagination && setPagination && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-border bg-card">
                        <span className="text-xs text-text-muted font-medium">
                            Page <span className="font-bold text-text-primary">{pagination.pageIndex + 1}</span> of <span className="font-bold text-text-primary">{pageCount}</span>
                            {typeof totalRecords === 'number' && (
                                <span className="ml-2 text-[11px] text-text-muted">({totalRecords.toLocaleString()} records)</span>
                            )}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 text-xs gap-1"
                                title="First Page"
                                disabled={isLoading || pagination.pageIndex === 0}
                                onClick={() => setPagination((prev: PaginationState) => ({ ...prev, pageIndex: 0 }))}
                            >
                                <ChevronsLeft className="h-3.5 w-3.5" />
                                First
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 text-xs gap-1"
                                title="Previous Page"
                                disabled={isLoading || pagination.pageIndex === 0}
                                onClick={() => setPagination((prev: PaginationState) => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Prev
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 text-xs gap-1"
                                title="Next Page"
                                disabled={isLoading || pagination.pageIndex >= pageCount - 1}
                                onClick={() => setPagination((prev: PaginationState) => ({ ...prev, pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1) }))}
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2.5 text-xs gap-1"
                                title="Last Page"
                                disabled={isLoading || pagination.pageIndex >= pageCount - 1}
                                onClick={() => setPagination((prev: PaginationState) => ({ ...prev, pageIndex: Math.max(0, pageCount - 1) }))}
                            >
                                Last
                                <ChevronsRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

