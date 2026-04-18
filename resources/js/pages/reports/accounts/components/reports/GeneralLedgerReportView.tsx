import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PaginationState } from '@tanstack/react-table';

export function GeneralLedgerReportView({ 
    data, 
    criteria,
    openingBalance,
    totalDebit,
    totalCredit,
    closingBalance,
    pageCount,
    pagination,
    setPagination,
    balanceType
}: any) {
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatVoucherNo = (type: string, id: number, credit: number, debit: number) => {
        const paddedId = String(id).padStart(6, '0');
        if (type === 'Sale') return paddedId;
        if (type === 'Purchase') return paddedId;
        if (type === 'Sales Return') return `SR-${paddedId}`;
        if (type === 'Purchase Return') return `PR-${paddedId}`;
        if (type === 'Payment') {
            return Number(credit) > 0 ? `BR-${id}` : `BP-${id}`;
        }
        return String(id);
    };

    const formatRemarks = (type: string, description: string) => {
        const descStr = String(description || '').toUpperCase();
        if (descStr.includes('{')) return descStr;

        if (type === 'Sale') return 'TOTAL SALES { SALE }';
        if (type === 'Purchase') return 'TOTAL PURCHASE { PURCHASE }';
        if (type === 'Sales Return') return 'SALES RETURN { RETURN }';
        if (type === 'Purchase Return') return 'PURCHASE RETURN { RETURN }';
        if (type === 'Payment') {
            if (descStr.trim() === 'CASH IN HAND' || !descStr) {
                return 'CASH IN HAND { BNK_REC }';
            }
            return `CASH IN HAND { ${descStr} }`;
        }
        return descStr;
    };

    const renderBalance = (bal: number, orient: string) => {
        const numBal = Number(bal);
        if (Math.abs(numBal) < 0.01) return 'CR';
        const formatted = formatCurrency(Math.abs(numBal));
        const orientation = numBal > 0 ? orient.toUpperCase() : (orient === 'cr' ? 'DR' : 'CR');
        return `${formatted} ${orientation}`;
    };

    const filteredData = data.filter((row: any) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const remarks = formatRemarks(row.type, row.description).toLowerCase();
        const voucher = formatVoucherNo(row.type, row.id, row.credit, row.debit).toLowerCase();
        return remarks.includes(term) || voucher.includes(term);
    });

    return (
        <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-indigo-500 p-5 shadow-sm">
                    <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Opening Balance</p>
                    <h3 className="text-2xl font-bold text-text-primary">{formatCurrency(openingBalance)}</h3>
                </div>
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-emerald-500 p-5 shadow-sm">
                    <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Total Credit</p>
                    <h3 className="text-2xl font-bold text-emerald-500">{formatCurrency(totalCredit)}</h3>
                </div>
                <div className="bg-card rounded-lg border border-border border-l-4 border-l-rose-500 p-5 shadow-sm">
                    <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Total Debit</p>
                    <h3 className="text-2xl font-bold text-rose-500">{formatCurrency(totalDebit)}</h3>
                </div>
                <div className={cn("bg-card rounded-lg border border-border border-l-4 p-5 shadow-sm", closingBalance >= 0 ? "border-l-text-primary" : "border-l-red-500")}>
                    <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Closing Balance</p>
                    <h3 className={cn("text-2xl font-black", closingBalance >= 0 ? "text-text-primary" : "text-red-500")}>{formatCurrency(closingBalance)}</h3>
                </div>
            </div>

            {/* Ledger Table */}
            <Card className="bg-card border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border/10 flex justify-between items-center bg-surface-1/50">
                    <div>
                        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-indigo-500" /> Transaction Ledger
                        </h3>
                        {criteria && <p className="text-[10px] font-medium text-text-muted mt-1 uppercase tracking-wide">{criteria}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                            <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search ledger..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 pl-8 pr-3 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-[200px]"
                            />
                        </div>
                        <span className="text-[10px] font-bold text-text-muted uppercase bg-surface-1 px-2 py-1 rounded">{filteredData.length} Vouchers</span>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] text-text-muted uppercase font-black bg-surface-1 border-b-2 border-border">
                            <tr>
                                <th className="px-4 py-3 border-r border-border w-[100px]">Date</th>
                                <th className="px-4 py-3 border-r border-border w-[100px] text-center">Voucher #</th>
                                <th className="px-4 py-3 border-r border-border">Remarks</th>
                                <th className="px-3 py-3 border-r border-border text-center w-[80px]">Chq #</th>
                                <th className="px-3 py-3 border-r border-border text-center w-[80px]">Chq Dt</th>
                                <th className="px-4 py-3 border-r border-border text-right w-[100px]">Debit</th>
                                <th className="px-4 py-3 border-r border-border text-right w-[100px]">Credit</th>
                                <th className="px-4 py-3 text-right w-[120px]">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredData.map((row: any, i: number) => {
                                const debit = Number(row.debit);
                                const credit = Number(row.credit);

                                return (
                                    <tr key={i} className="hover:bg-surface-1 transition-colors bg-card">
                                        <td className="px-4 py-2.5 whitespace-nowrap border-r border-border/10">
                                            <div className="font-bold text-text-secondary tabular-nums">
                                                {format(new Date(row.date), 'dd-MMM-yy').toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 border-r border-border/10 font-bold text-text-muted text-[11px] text-center">
                                            {formatVoucherNo(row.type, row.id, credit, debit)}
                                        </td>
                                        <td className="px-4 py-2.5 text-text-secondary font-medium border-r border-border/10">
                                            {formatRemarks(row.type, row.description)}
                                        </td>
                                        <td className="px-3 py-2.5 text-center text-text-muted border-r border-border/10 tabular-nums">
                                            {row.cheque_no || ''}
                                        </td>
                                        <td className="px-3 py-2.5 text-center text-text-muted border-r border-border/10 tabular-nums">
                                            {row.cheque_date ? format(new Date(row.cheque_date), 'dd-MM-yy') : ''}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-rose-500 border-r border-border/10 tabular-nums">
                                            {debit > 0 ? formatCurrency(debit) : ''}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-emerald-500 border-r border-border/10 tabular-nums">
                                            {credit > 0 ? formatCurrency(credit) : ''}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-black text-text-primary tabular-nums">
                                            {renderBalance(row.balance, balanceType)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-text-muted font-medium">
                                        No ledger records found for the selected criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-border flex justify-between items-center bg-surface-1/50">
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPagination((p: any) => ({ ...p, pageIndex: p.pageIndex - 1 }))} disabled={pagination.pageIndex === 0} className="h-8 shadow-sm">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPagination((p: any) => ({ ...p, pageIndex: p.pageIndex + 1 }))} disabled={pagination.pageIndex >= (pageCount - 1)} className="h-8 shadow-sm">
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                    <span className="text-[11px] font-black text-text-secondary uppercase tracking-wider bg-background border border-border px-3 py-1.5 rounded-full">
                        Page {pagination.pageIndex + 1} of {pageCount || 1}
                    </span>
                </div>
            </Card>
        </div>
    );
}
