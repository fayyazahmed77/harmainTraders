import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function MonthAmountReport({ data, formatCurrency }: Props) {
    // 1. Extract unique months and sort them chronologically (descending)
    const monthOrder: { [key: string]: number } = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    const months = useMemo(() => {
        const uniqueMonths = Array.from(new Set(data.map(item => item.month_name)));
        return uniqueMonths.sort((a, b) => (monthOrder[b] || 0) - (monthOrder[a] || 0));
    }, [data]);

    // 2. Group data by Account
    const accountGroups = useMemo(() => {
        const groups: { [key: string]: any } = {};
        data.forEach(item => {
            if (!groups[item.account_name]) {
                groups[item.account_name] = { accountName: item.account_name, months: {}, total: 0 };
            }
            const amount = parseFloat(item.amount || 0);
            groups[item.account_name].months[item.month_name] = amount;
            groups[item.account_name].total += amount;
        });
        return Object.values(groups);
    }, [data]);

    // 3. Calculate column (month) totals
    const monthTotals = useMemo(() => {
        const totals: { [key: string]: number } = {};
        months.forEach(m => totals[m] = 0);
        
        data.forEach(item => {
            if (totals[item.month_name] !== undefined) {
                totals[item.month_name] += parseFloat(item.amount || 0);
            }
        });
        return totals;
    }, [data, months]);

    const grandTotal = useMemo(() => {
        return Object.values(monthTotals).reduce((sum, val) => sum + val, 0);
    }, [monthTotals]);

    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-text-muted">No data available for the selected period.</div>;
    }

    return (
        <>
            <TableHeader className="bg-surface-2 border-b border-border/50">
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[300px] font-black text-[10px] text-text-muted/70 uppercase tracking-widest py-3">Account Description</TableHead>
                    {months.map(month => (
                        <TableHead key={month} className="text-right font-black text-[10px] text-text-muted/70 uppercase tracking-widest py-3">
                            {month}
                        </TableHead>
                    ))}
                    <TableHead className="text-right font-black text-[10px] text-indigo-600/70 uppercase tracking-widest py-3 bg-indigo-500/5">
                        Total Amount
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                            {accountGroups.map((account, index) => (
                                <TableRow key={index} className="group border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                                    <TableCell className="font-bold text-[11px] text-text-primary uppercase py-2">
                                        {account.accountName}
                                    </TableCell>
                                    
                                    {months.map(month => (
                                        <TableCell key={month} className="text-right text-[11px] font-medium text-text-secondary py-2">
                                            {account.months[month] > 0 ? formatCurrency(account.months[month]) : <span className="text-text-muted/30">-</span>}
                                        </TableCell>
                                    ))}
                                    
                                    <TableCell className="text-right text-[12px] font-bold text-indigo-600 dark:text-indigo-400 py-2 bg-indigo-500/5">
                                        {account.total > 0 ? formatCurrency(account.total) : <span className="text-text-muted/30">-</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                            
                            {/* Grand Total Row */}
                            <TableRow className="bg-surface-2 border-t-2 border-border/50 hover:bg-surface-2">
                                <TableCell className="font-black text-[11px] text-text-primary uppercase py-3">
                                    Grand Total
                                </TableCell>
                                
                                {months.map(month => (
                                    <TableCell key={month} className="text-right text-[12px] font-black text-text-primary py-3">
                                        {monthTotals[month] > 0 ? formatCurrency(monthTotals[month]) : <span className="text-text-muted/30">-</span>}
                                    </TableCell>
                                ))}
                                
                                <TableCell className="text-right text-[13px] font-black text-indigo-600 dark:text-indigo-400 py-3 bg-indigo-500/10">
                                    {formatCurrency(grandTotal)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
        </>
    );
};
