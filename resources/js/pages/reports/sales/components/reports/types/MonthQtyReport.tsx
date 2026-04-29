import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MonthQtyReportProps {
    data: any[];
}

export default function MonthQtyReport({ data }: MonthQtyReportProps) {
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
                groups[item.account_name] = { accountName: item.account_name, monthsF: {}, monthsP: {}, totalF: 0, totalP: 0 };
            }
            const qtyF = parseInt(item.qty_f || 0, 10);
            const qtyP = parseInt(item.qty_p || 0, 10);
            
            groups[item.account_name].monthsF[item.month_name] = qtyF;
            groups[item.account_name].monthsP[item.month_name] = qtyP;
            
            groups[item.account_name].totalF += qtyF;
            groups[item.account_name].totalP += qtyP;
        });
        return Object.values(groups);
    }, [data]);

    // 3. Calculate column (month) totals
    const monthTotals = useMemo(() => {
        const totalsF: { [key: string]: number } = {};
        const totalsP: { [key: string]: number } = {};
        months.forEach(m => {
            totalsF[m] = 0;
            totalsP[m] = 0;
        });
        
        data.forEach(item => {
            if (totalsF[item.month_name] !== undefined) {
                totalsF[item.month_name] += parseInt(item.qty_f || 0, 10);
                totalsP[item.month_name] += parseInt(item.qty_p || 0, 10);
            }
        });
        return { totalsF, totalsP };
    }, [data, months]);

    const grandTotal = useMemo(() => {
        const totalF = Object.values(monthTotals.totalsF).reduce((sum, val) => sum + val, 0);
        const totalP = Object.values(monthTotals.totalsP).reduce((sum, val) => sum + val, 0);
        return { totalF, totalP };
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
                        <TableHead key={month} className="text-center font-black text-[10px] text-text-muted/70 uppercase tracking-widest py-3">
                            {month}
                        </TableHead>
                    ))}
                    <TableHead className="text-center font-black text-[10px] text-indigo-600/70 uppercase tracking-widest py-3 bg-indigo-500/5">
                        Total Qty
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {accountGroups.map((account, index) => (
                    <TableRow key={index} className="group border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                        <TableCell className="font-bold text-[11px] text-text-primary uppercase py-2">
                            {account.accountName}
                        </TableCell>
                        
                        {months.map(month => {
                            const qF = account.monthsF[month] || 0;
                            const qP = account.monthsP[month] || 0;
                            const hasData = qF > 0 || qP > 0;
                            return (
                                <TableCell key={month} className="text-center text-[11px] font-medium text-text-secondary py-2">
                                    {hasData ? `${qF}.${qP}` : <span className="text-text-muted/30">-</span>}
                                </TableCell>
                            );
                        })}
                        
                        <TableCell className="text-center text-[12px] font-bold text-indigo-600 dark:text-indigo-400 py-2 bg-indigo-500/5">
                            {(account.totalF > 0 || account.totalP > 0) ? `${account.totalF}.${account.totalP}` : <span className="text-text-muted/30">-</span>}
                        </TableCell>
                    </TableRow>
                ))}
                
                {/* Grand Total Row */}
                <TableRow className="bg-surface-2 border-t-2 border-border/50 hover:bg-surface-2">
                    <TableCell className="font-black text-[11px] text-text-primary uppercase py-3">
                        Grand Total
                    </TableCell>
                    
                    {months.map(month => {
                        const mF = monthTotals.totalsF[month] || 0;
                        const mP = monthTotals.totalsP[month] || 0;
                        const hasMonthData = mF > 0 || mP > 0;
                        return (
                            <TableCell key={month} className="text-center text-[12px] font-black text-text-primary py-3">
                                {hasMonthData ? `${mF}.${mP}` : <span className="text-text-muted/30">-</span>}
                            </TableCell>
                        );
                    })}
                    
                    <TableCell className="text-center text-[13px] font-black text-indigo-600 dark:text-indigo-400 py-3 bg-indigo-500/10">
                        {grandTotal.totalF}.{grandTotal.totalP}
                    </TableCell>
                </TableRow>
            </TableBody>
        </>
    );
}
