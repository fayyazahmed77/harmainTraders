import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';

export const MonthReport = ({ data, formatCurrency }: { data: any[], formatCurrency: (v: number) => string }) => {
    const totals = data.reduce((acc, row) => ({
        gross: acc.gross + Number(row.gross_amount || 0),
        discount: acc.discount + Number(row.discount_amount || 0),
        amount: acc.amount + Number(row.total_amount || 0),
    }), { gross: 0, discount: 0, amount: 0 });

    return (
        <>
            <TableHeader className="bg-surface-1/50">
                <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Analysis Month</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Supplier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Gross Total</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Total Discount</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Net Reversal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, i) => (
                    <TableRow key={i} className="border-border/40 group hover:bg-rose-500/5">
                        <TableCell className="text-[10px] font-black text-text-primary uppercase tracking-wider">{row.month_name}</TableCell>
                        <TableCell className="text-[10px] font-bold text-text-primary uppercase">{row.account_name}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums">{formatCurrency(row.gross_amount)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-rose-500">{formatCurrency(row.discount_amount)}</TableCell>
                        <TableCell className="text-[11px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400">{formatCurrency(row.total_amount)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter className="bg-surface-1/50 border-t-2 border-border/60">
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="text-[10px] font-black uppercase text-text-primary">Aggregate Monthly Trends</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{formatCurrency(totals.gross)}</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums text-rose-500">{formatCurrency(totals.discount)}</TableCell>
                    <TableCell className="text-[12px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400 bg-rose-500/5">{formatCurrency(totals.amount)}</TableCell>
                </TableRow>
            </TableFooter>
        </>
    );
};
