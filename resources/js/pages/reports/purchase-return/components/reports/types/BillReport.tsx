import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';

export const BillReport = ({ data, formatCurrency }: { data: any[], formatCurrency: (v: number) => string }) => {
    const totals = data.reduce((acc, row) => ({
        gross: acc.gross + Number(row.gross || 0),
        discount: acc.discount + Number(row.discount || 0),
        amount: acc.amount + Number(row.amount || 0),
    }), { gross: 0, discount: 0, amount: 0 });

    return (
        <>
            <TableHeader className="bg-surface-1/50">
                <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-center w-[120px]">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Invoice #</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Supplier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Gross Total</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Discount</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Net Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, i) => (
                    <TableRow key={i} className="border-border/40 group hover:bg-rose-500/5">
                        <TableCell className="text-[10px] font-bold text-center text-text-secondary">{row.date}</TableCell>
                        <TableCell className="text-[10px] font-black text-rose-600 dark:text-rose-400">{row.invoice}</TableCell>
                        <TableCell className="text-[10px] font-bold text-text-primary uppercase">{row.account_name}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums">{formatCurrency(row.gross)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-rose-500">{formatCurrency(row.discount)}</TableCell>
                        <TableCell className="text-[11px] font-black text-right tabular-nums text-text-primary">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter className="bg-surface-1/50 border-t-2 border-border/60">
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-[10px] font-black uppercase text-text-primary">Total Aggregated Returns</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{formatCurrency(totals.gross)}</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums text-rose-500">{formatCurrency(totals.discount)}</TableCell>
                    <TableCell className="text-[12px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400 bg-rose-500/5">{formatCurrency(totals.amount)}</TableCell>
                    <TableCell />
                </TableRow>
            </TableFooter>
        </>
    );
};
