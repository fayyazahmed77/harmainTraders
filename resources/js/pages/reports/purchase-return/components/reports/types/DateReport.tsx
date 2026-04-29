import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';

export const DateReport = ({ data, formatCurrency }: { data: any[], formatCurrency: (v: number) => string }) => {
    const totals = data.reduce((acc, row) => ({
        bills: acc.bills + Number(row.total_bills || 0),
        amount: acc.amount + Number(row.total_amount || 0),
    }), { bills: 0, amount: 0 });

    return (
        <>
            <TableHeader className="bg-surface-1/50">
                <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Return Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Invoices Returned</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Net Reversal Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, i) => (
                    <TableRow key={i} className="border-border/40 group hover:bg-rose-500/5">
                        <TableCell className="text-[10px] font-black text-text-primary uppercase tracking-wider">{row.date_display || row.date}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-text-secondary">{row.total_bills}</TableCell>
                        <TableCell className="text-[11px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400">{formatCurrency(row.total_amount)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter className="bg-surface-1/50 border-t-2 border-border/60">
                <TableRow className="hover:bg-transparent">
                    <TableCell className="text-[10px] font-black uppercase text-text-primary">Total Daily Reversals</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{totals.bills}</TableCell>
                    <TableCell className="text-[12px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400 bg-rose-500/5">{formatCurrency(totals.amount)}</TableCell>
                </TableRow>
            </TableFooter>
        </>
    );
};
