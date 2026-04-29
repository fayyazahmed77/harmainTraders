import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

const DetailsReport = ({ data, formatCurrency }: any) => {
    const total = data.reduce((acc: any, row: any) => ({
        qty_full: acc.qty_full + (Number(row.qty_full) || 0),
        qty_pcs: acc.qty_pcs + (Number(row.qty_pcs) || 0),
        tax: acc.tax + (Number(row.tax_amt) || 0),
        amount: acc.amount + (Number(row.amount) || 0),
    }), { qty_full: 0, qty_pcs: 0, tax: 0, amount: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b border-border/50">
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted w-[40px]">S.#</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Inv #</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Date</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Party</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Item</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">T.P.</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Qty Full</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Qty Pcs</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Rate</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">B.Full</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">B.Pcs</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Disc</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Tax</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row: any, index: number) => (
                    <TableRow key={index} className="border-b border-border/10 hover:bg-emerald-500/5 transition-colors group text-[10px]">
                        <TableCell className="py-1.5 font-bold text-text-muted">{index + 1}</TableCell>
                        <TableCell className="py-1.5 font-black text-emerald-500 uppercase">{row.invoice}</TableCell>
                        <TableCell className="py-1.5 font-bold text-text-muted whitespace-nowrap">
                            {format(new Date(row.date), 'dd-MMM-yy')}
                        </TableCell>
                        <TableCell className="py-1.5 font-bold text-text-primary uppercase">{row.account_name}</TableCell>
                        <TableCell className="py-1.5 font-bold text-text-primary uppercase">{row.product_name}</TableCell>
                        <TableCell className="py-1.5 font-bold text-center tabular-nums text-text-muted">{formatCurrency(row.tp)}</TableCell>
                        <TableCell className="py-1.5 font-black text-center tabular-nums text-blue-500">{row.qty_full > 0 ? row.qty_full : '0'}</TableCell>
                        <TableCell className="py-1.5 font-black text-center tabular-nums text-blue-400">{row.qty_pcs > 0 ? row.qty_pcs : '0'}</TableCell>
                        <TableCell className="py-1.5 font-bold text-center tabular-nums text-text-primary">{formatCurrency(row.rate)}</TableCell>
                        <TableCell className="py-1.5 font-bold text-center tabular-nums text-amber-500">{row.b_full > 0 ? row.b_full : '0'}</TableCell>
                        <TableCell className="py-1.5 font-bold text-center tabular-nums text-amber-500">{row.b_pcs > 0 ? row.b_pcs : '0'}</TableCell>
                        <TableCell className="py-1.5 font-bold text-center tabular-nums text-rose-500">{row.disc_1 > 0 ? formatCurrency(row.disc_1) : '0.00'}</TableCell>
                        <TableCell className="py-1.5 font-bold text-center tabular-nums text-amber-500">{row.tax_amt > 0 ? formatCurrency(row.tax_amt) : '0'}</TableCell>
                        <TableCell className="py-1.5 font-black text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/30 font-black border-t-2 border-border/50">
                    <TableCell colSpan={6} className="py-2 text-[9px] font-black uppercase tracking-widest text-center">Grand Totals</TableCell>
                    <TableCell className="py-2 text-[10px] font-black text-center tabular-nums text-blue-500">{total.qty_full}</TableCell>
                    <TableCell className="py-2 text-[10px] font-black text-center tabular-nums text-blue-400">{total.qty_pcs}</TableCell>
                    <TableCell colSpan={4} className="py-2"></TableCell>
                    <TableCell className="py-2 text-[10px] font-black text-center tabular-nums text-amber-500">{formatCurrency(total.tax)}</TableCell>
                    <TableCell className="py-2 text-[10px] font-black text-right tabular-nums text-emerald-500">{formatCurrency(total.amount)}</TableCell>
                </TableRow>
            </TableBody>
        </>
    );
};

export default DetailsReport;
