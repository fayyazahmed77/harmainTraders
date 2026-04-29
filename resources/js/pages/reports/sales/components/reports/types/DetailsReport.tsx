import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function DetailsReport({ data, formatCurrency }: Props) {
    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Invoice</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Date</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Customer</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Product</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Qty (Ctn)</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Qty (Pcs)</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">TP</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/50 transition-all duration-300 group">
                        <TableCell className="py-4 px-6 text-[10px] font-black text-text-muted/40 uppercase italic">{idx + 1}</TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-tighter font-mono bg-indigo-500/5 px-1.5 py-0.5 rounded-sm uppercase">
                                {row.invoice}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-[11px] font-bold text-text-primary uppercase">{row.date}</TableCell>
                        <TableCell className="py-4 px-4 text-[11px] font-bold text-text-primary uppercase">{row.customer_name}</TableCell>
                        <TableCell className="py-4 px-4 text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase italic">{row.product_name}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">{row.qty_full}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">{row.qty_pcs}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-muted text-[11px] tabular-nums">{formatCurrency(row.tp)}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-[11px] bg-surface-1/20 tabular-nums">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </>
    );
}
