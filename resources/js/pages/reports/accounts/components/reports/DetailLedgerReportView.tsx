import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PaginationState } from '@tanstack/react-table';

export function DetailLedgerReportView({ 
    data, 
    criteria,
    openingBalance,
    totalDebit,
    totalCredit,
    closingBalance,
    pageCount,
    pagination,
    setPagination
}: any) {
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const filteredData = data.filter((row: any) => 
        !searchTerm || 
        (row.description && row.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (row.voucher_no && row.voucher_no.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                            <FileSpreadsheet className="h-4 w-4 text-indigo-500" /> Detail Ledger Report
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
                                <th className="px-4 py-3 border-r border-border w-[120px]">Voucher #</th>
                                <th className="px-4 py-3 border-r border-border">Description / Remarks</th>
                                <th className="px-3 py-3 border-r border-border text-right w-[60px]">Qty</th>
                                <th className="px-3 py-3 border-r border-border text-right w-[60px]">T.P.</th>
                                <th className="px-3 py-3 border-r border-border text-right w-[50px]">Disc</th>
                                <th className="px-3 py-3 border-r border-border text-right w-[60px]">Rate</th>
                                <th className="px-4 py-3 border-r border-border text-right w-[90px]">Debit</th>
                                <th className="px-4 py-3 border-r border-border text-right w-[90px]">Credit</th>
                                <th className="px-4 py-3 text-right w-[100px]">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredData.map((row: any, i: number) => {
                                const isReceipt = row.credit > 0 && row.debit == 0;
                                const hasDetails = row.details && row.details.length > 0;
                                const rowsToRender = hasDetails ? Math.max(1, row.details.length) : 1;
                                
                                return Array.from({ length: rowsToRender }).map((_, detailIndex) => {
                                    const isFirstRow = detailIndex === 0;
                                    const detail = hasDetails ? row.details[detailIndex] : null;
 
                                    return (
                                        <tr key={`${i}-${detailIndex}`} className={cn(
                                            "transition-colors",
                                            isFirstRow ? "bg-card" : "bg-card",
                                            detailIndex === rowsToRender - 1 ? "border-b border-border" : "" // Thicker border separating vouchers
                                        )}>
                                            {/* Date */}
                                            <td className="px-4 py-2 whitespace-nowrap border-r border-border/10">
                                                {isFirstRow && (
                                                    <div className="font-black text-text-secondary tabular-nums">
                                                        {format(new Date(row.date), 'dd MMM yy').toUpperCase()}
                                                    </div>
                                                )}
                                            </td>
                                            {/* Voucher */}
                                            <td className="px-4 py-2 border-r border-border/10 font-bold text-text-muted text-[11px] uppercase">
                                                {isFirstRow && row.voucher_no}
                                            </td>
                                            {/* Description */}
                                            <td className="px-4 py-2 text-text-secondary font-medium border-r border-border/10">
                                                {detail ? detail.description : (isFirstRow ? row.remarks : '')}
                                            </td>
                                            {/* Details Columns */}
                                            <td className="px-3 py-2 text-right text-text-muted border-r border-border/10 tabular-nums">
                                                {detail && detail.qty ? detail.qty : ''}
                                            </td>
                                            <td className="px-3 py-2 text-right text-text-muted border-r border-border/10 tabular-nums">
                                                {detail && detail.tp ? detail.tp : ''}
                                            </td>
                                            <td className="px-3 py-2 text-right text-text-muted border-r border-border/10 tabular-nums">
                                                {detail && detail.disc ? detail.disc : ''}
                                            </td>
                                            <td className="px-3 py-2 text-right text-text-muted border-r border-border/10 tabular-nums">
                                                {detail && detail.rate ? detail.rate : ''}
                                            </td>
                                            
                                            {/* Totals Columns */}
                                            <td className="px-4 py-2 text-right font-bold text-rose-500 border-r border-border/10 tabular-nums">
                                                {isFirstRow && row.debit > 0 ? formatCurrency(row.debit) : ''}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-emerald-500 border-r border-border/10 tabular-nums">
                                                {isFirstRow && row.credit > 0 ? formatCurrency(row.credit) : ''}
                                            </td>
                                            <td className="px-4 py-2 text-right font-black text-text-primary tabular-nums">
                                                {isFirstRow && row.balance ? formatCurrency(row.balance) : ''}
                                            </td>
                                        </tr>
                                    );
                                });
                            })}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-text-muted font-medium">
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
