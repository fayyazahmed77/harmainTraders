import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ItemReport = ({ data, formatCurrency }: any) => {
    const totals = data.reduce((acc: any, row: any) => ({
        full: acc.full + (Number(row.qty_full) || 0),
        pcs: acc.pcs + (Number(row.qty_pcs) || 0),
        gross: acc.gross + (Number(row.gross_amount) || 0),
        disc: acc.disc + (Number(row.discount_amount) || 0),
        net: acc.net + (Number(row.net_amount) || 0),
    }), { full: 0, pcs: 0, gross: 0, disc: 0, net: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b border-border/50">
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted w-[50px]">S.#</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Item Description</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Packing</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Full</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Pcs</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Gross Amount</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Disc Amt</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Net Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row: any, index: number) => (
                    <TableRow key={index} className="border-b border-border/10 hover:bg-emerald-500/5 transition-colors text-[10px]">
                        <TableCell className="py-1.5 font-bold text-text-muted">{index + 1}</TableCell>
                        <TableCell className="py-1.5 font-bold text-text-primary uppercase">{row.name}</TableCell>
                        <TableCell className="py-1.5 font-bold text-center tabular-nums text-text-secondary">{row.packing}</TableCell>
                        <TableCell className="py-1.5 font-black text-center tabular-nums text-blue-500">{row.qty_full}</TableCell>
                        <TableCell className="py-1.5 font-black text-center tabular-nums text-blue-400">{row.qty_pcs}</TableCell>
                        <TableCell className="py-1.5 font-bold text-right tabular-nums text-text-secondary">{formatCurrency(row.gross_amount)}</TableCell>
                        <TableCell className="py-1.5 font-bold text-right tabular-nums text-rose-500">{formatCurrency(row.discount_amount)}</TableCell>
                        <TableCell className="py-1.5 font-black text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(row.net_amount)}</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/30 font-black border-t-2 border-border/50">
                    <TableCell colSpan={3} className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Grand Totals</TableCell>
                    <TableCell className="py-3 text-[10px] font-black text-center tabular-nums text-blue-500">{totals.full}</TableCell>
                    <TableCell className="py-3 text-[10px] font-black text-center tabular-nums text-blue-400">{totals.pcs}</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-text-secondary">{formatCurrency(totals.gross)}</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-rose-500">{formatCurrency(totals.disc)}</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-emerald-500">{formatCurrency(totals.net)}</TableCell>
                </TableRow>
            </TableBody>
        </>
    );
};

export default ItemReport;
