import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';

export const ItemReport = ({ data, formatCurrency }: { data: any[], formatCurrency: (v: number) => string }) => {
    const totals = data.reduce((acc, row) => ({
        qty_full: acc.qty_full + Number(row.qty_full || 0),
        qty_pcs: acc.qty_pcs + Number(row.qty_pcs || 0),
        gross: acc.gross + Number(row.gross_amount || 0),
        discount: acc.discount + Number(row.discount_amount || 0),
        net: acc.net + Number(row.net_amount || 0),
    }), { qty_full: 0, qty_pcs: 0, gross: 0, discount: 0, net: 0 });

    return (
        <>
            <TableHeader className="bg-surface-1/50">
                <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Product Dimensions</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-center">Packing</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Total Ctn</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Total Pcs</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Gross Value</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Discount</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Net Reversal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, i) => (
                    <TableRow key={i} className="border-border/40 group hover:bg-rose-500/5">
                        <TableCell className="text-[10px] font-black text-text-primary uppercase tracking-tight">{row.name}</TableCell>
                        <TableCell className="text-[10px] font-bold text-center text-text-muted">1x{row.packing}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-text-secondary">{row.qty_full}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-text-secondary">{row.qty_pcs}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums">{formatCurrency(row.gross_amount)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-rose-500">{formatCurrency(row.discount_amount)}</TableCell>
                        <TableCell className="text-[11px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400">{formatCurrency(row.net_amount)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter className="bg-surface-1/50 border-t-2 border-border/60">
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="text-[10px] font-black uppercase text-text-primary">Aggregate Product Reversals</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{totals.qty_full}</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{totals.qty_pcs}</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{formatCurrency(totals.gross)}</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums text-rose-500">{formatCurrency(totals.discount)}</TableCell>
                    <TableCell className="text-[12px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400 bg-rose-500/5">{formatCurrency(totals.net)}</TableCell>
                </TableRow>
            </TableFooter>
        </>
    );
};
