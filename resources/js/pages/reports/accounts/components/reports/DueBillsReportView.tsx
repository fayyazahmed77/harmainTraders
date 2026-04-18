import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Search, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function DueBillsReportView({ 
    data, 
    criteria
}: any) {
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (amount: number) => {
        if (!amount && amount !== 0) return '';
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Filter and group data by customer
    const groupedData = useMemo(() => {
        const filtered = data.filter((row: any) => 
            !searchTerm || 
            (row.party_name && row.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (row.voucher_no && row.voucher_no.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const groups: Record<string, any[]> = {};
        filtered.forEach((row: any) => {
            if (!groups[row.customer_id]) {
                groups[row.customer_id] = [];
            }
            groups[row.customer_id].push(row);
        });

        return groups;
    }, [data, searchTerm]);

    const totalUnDue = data.reduce((acc: number, cur: any) => cur.is_last_for_customer ? acc + cur.party_summary.party_un_due_amount : acc, 0);
    const totalDue = data.reduce((acc: number, cur: any) => cur.is_last_for_customer ? acc + cur.party_summary.party_due_amount : acc, 0);

    return (
        <div className="space-y-6">
            <Card className="bg-card border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border/10 flex justify-between items-center bg-surface-1/50">
                    <div>
                        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-indigo-500" /> Due Bills Report
                        </h3>
                        {criteria && <p className="text-[10px] font-medium text-text-muted mt-1 uppercase tracking-wide">{criteria}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search party or voucher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 pl-8 pr-3 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-[200px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {Object.entries(groupedData).map(([customerId, bills]) => {
                        const lastBill = bills[bills.length - 1];
                        // Get summary from original data just in case filtered lost it, 
                        // but actually our logic embedded it in the last element originally.
                        // If user searches, the "last element" might be filtered out.
                        // So we look for the original summary.
                        const originalLastBill = data.find((r: any) => r.customer_id == customerId && r.is_last_for_customer) || lastBill;
                        const summary = originalLastBill.party_summary || { party_un_due_amount: 0, party_due_amount: 0, credit_days: 0, credit_limit: 0 };
                        
                        return (
                            <div key={customerId} className="border border-border/20 rounded-md overflow-hidden bg-card">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-[10px] text-text-muted uppercase font-black bg-surface-1 border-b-2 border-border">
                                            <tr>
                                                <th className="px-4 py-2 border-r border-border w-[100px]">Date</th>
                                                <th className="px-4 py-2 border-r border-border w-[100px]">Voucher #</th>
                                                <th className="px-4 py-2 border-r border-border">Party Name</th>
                                                <th className="px-4 py-2 border-r border-border w-[100px] text-center">Due Date</th>
                                                <th className="px-3 py-2 border-r border-border w-[60px] text-center">Days</th>
                                                <th className="px-4 py-2 border-r border-border text-right w-[100px]">Bill Amt</th>
                                                <th className="px-4 py-2 border-r border-border text-right w-[100px]">Paid</th>
                                                <th className="px-4 py-2 border-r border-border text-right w-[100px]">Remaining</th>
                                                <th className="px-4 py-2 text-right w-[100px]">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/10">
                                            {bills.map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-surface-1/50">
                                                    <td className="px-4 py-2 font-black text-text-secondary tabular-nums border-r border-border/10">{format(new Date(row.date), 'dd-MMM-yy').toUpperCase()}</td>
                                                    <td className="px-4 py-2 font-bold text-text-muted border-r border-border/10">{row.voucher_no}</td>
                                                    <td className="px-4 py-2 font-medium text-text-secondary border-r border-border/10">{row.party_name}</td>
                                                    <td className="px-4 py-2 text-center tabular-nums text-text-muted border-r border-border/10">{format(new Date(row.due_date), 'dd-MMM-yy').toUpperCase()}</td>
                                                    <td className="px-3 py-2 text-center font-bold tabular-nums border-r border-border/10">{row.days}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums text-text-muted border-r border-border/10">{formatCurrency(row.bill_amt)}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums text-text-muted border-r border-border/10">{formatCurrency(row.paid)}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums font-bold text-rose-500 border-r border-border/10">{formatCurrency(row.remaining)}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums font-black text-text-primary">{formatCurrency(row.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-surface-1 border-t-2 border-border">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-2 font-black text-text-muted uppercase text-[10px] border-r border-border">Party Un Due Amount</td>
                                                <td className="px-4 py-2 font-black tabular-nums border-r border-border">{formatCurrency(summary.party_un_due_amount)}</td>
                                                <td colSpan={1} className="px-4 py-2 font-black text-text-muted uppercase text-[10px] border-r border-border">Due Amount</td>
                                                <td colSpan={2} className="px-4 py-2 font-black tabular-nums border-r border-border">{formatCurrency(summary.party_due_amount)}</td>
                                                <td className="px-4 py-2 font-black text-text-muted uppercase text-[10px] border-r border-border text-right">Credit Days</td>
                                                <td className="px-4 py-2 font-black tabular-nums border-r border-border text-right">{summary.credit_days}</td>
                                                <td className="px-4 py-2 font-black text-text-muted uppercase text-[10px] bg-card border-l-4 border-l-border text-right">
                                                    Limit: {summary.credit_limit > 0 ? formatCurrency(summary.credit_limit) : '**********'}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(groupedData).length === 0 && (
                        <div className="text-center py-8 text-text-muted font-medium">
                            No due bills match your current search/filters.
                        </div>
                    )}
                </div>
            </Card>

            {data.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-card border-border shadow-sm p-5 border-l-4 border-l-emerald-500">
                        <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Total Un Due Amount</p>
                        <h3 className="text-2xl font-black text-text-primary">{formatCurrency(totalUnDue)}</h3>
                    </Card>
                    <Card className="bg-card border-border shadow-sm p-5 border-l-4 border-l-rose-500">
                        <p className="text-[11px] font-bold tracking-wider text-text-muted uppercase">Total Due Amount</p>
                        <h3 className="text-2xl font-black text-rose-500">{formatCurrency(totalDue)}</h3>
                    </Card>
                </div>
            )}
        </div>
    );
}
