import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';

export const DetailsReport = ({ data, formatCurrency }: { data: any[], formatCurrency: (v: number) => string }) => {
    const totals = data.reduce((acc, row) => ({
        qty_full: acc.qty_full + Number(row.qty_full || 0),
        qty_pcs: acc.qty_pcs + Number(row.qty_pcs || 0),
        amount: acc.amount + Number(row.amount || 0),
    }), { qty_full: 0, qty_pcs: 0, amount: 0 });

    return (
        <>
            <TableHeader className="bg-surface-1/50">
                <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[9px] font-black uppercase text-text-muted">Date</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-text-muted">Invoice</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-text-muted">Supplier</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-text-muted">Product</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-text-muted text-right">Qty (Ctn)</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-text-muted text-right">Qty (Pcs)</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-text-muted text-right">Rate (TP)</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-text-muted text-right">Discount</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-text-muted text-right">Net Value</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, i) => (
                    <TableRow key={i} className="border-border/40 group hover:bg-rose-500/5">
                        <TableCell className="text-[9px] font-bold text-text-secondary">{row.date}</TableCell>
                        <TableCell className="text-[9px] font-black text-rose-600 dark:text-rose-400">{row.invoice}</TableCell>
                        <TableCell className="text-[9px] font-bold text-text-primary uppercase truncate max-w-[150px]">{row.account_name}</TableCell>
                        <TableCell className="text-[9px] font-black text-text-primary uppercase truncate max-w-[200px]">{row.product_name}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-text-secondary">{row.qty_full}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-text-secondary">{row.qty_pcs}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums">{formatCurrency(row.rate)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-rose-500">{formatCurrency(row.disc_1)}</TableCell>
                        <TableCell className="text-[10px] font-black text-right tabular-nums text-text-primary">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter className="bg-surface-1/50 border-t-2 border-border/60">
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="text-[10px] font-black uppercase text-text-primary">Aggregate Return Breakdown</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{totals.qty_full}</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{totals.qty_pcs}</TableCell>
                    <TableCell colSpan={2} />
                    <TableCell className="text-[12px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400 bg-rose-500/5">{formatCurrency(totals.amount)}</TableCell>
                </TableRow>
            </TableFooter>
        </>
    );
};
