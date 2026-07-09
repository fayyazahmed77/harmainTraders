import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatSafeDate } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function DateWiseReport({ data, formatCurrency }: Props) {
    const totalBills = data.reduce((sum, row) => sum + (Number(row.bill_count) || 0), 0);
    const totalQtyFull = data.reduce((sum, row) => sum + (Number(row.qty_full) || 0), 0);
    const totalQtyPcs = data.reduce((sum, row) => sum + (Number(row.qty_pcs) || 0), 0);
    const totalGross = data.reduce((sum, row) => sum + (Number(row.gross) || 0), 0);
    const totalDiscount = data.reduce((sum, row) => sum + (Number(row.discount) || 0), 0);
    const totalSalesReturn = data.reduce((sum, row) => sum + (Number(row.sales_return) || 0), 0);
    const totalAmount = data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Date</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Bill Count</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Qty (Ctn)</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Qty (Pcs)</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Gross</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic text-amber-500">Discount</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Sales Return</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Net Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/50 transition-all duration-300 group">
                        <TableCell className="py-4 px-6 text-[10px] font-black text-text-muted/40 uppercase italic">{idx + 1}</TableCell>
                        <TableCell className="py-4 px-4 text-[11px] font-bold text-text-primary uppercase">
                            {formatSafeDate(row.date).toUpperCase()}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">
                            {Number(row.bill_count).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">
                            {Number(row.qty_full).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">
                            {Number(row.qty_pcs).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-muted text-[11px] tabular-nums">
                            {formatCurrency(Number(row.gross))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-amber-500 text-[11px] tabular-nums">
                            {Number(row.discount) > 0 ? formatCurrency(Number(row.discount)) : '---'}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-rose-500 text-[11px] tabular-nums">
                            {Number(row.sales_return) > 0 ? formatCurrency(Number(row.sales_return)) : '---'}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-[11px] bg-surface-1/20 tabular-nums">
                            {formatCurrency(Number(row.amount))}
                        </TableCell>
                    </TableRow>
                ))}
                {data.length > 0 && (
                    <TableRow className="bg-surface-1/50 border-t-2 border-text-primary hover:bg-surface-1/50 font-black">
                        <TableCell colSpan={2} className="py-4 px-6 text-[10px] font-black text-text-primary uppercase tracking-widest italic">Total</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">{totalBills.toLocaleString()}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">{totalQtyFull.toLocaleString()}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">{totalQtyPcs.toLocaleString()}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-muted text-[11px] tabular-nums">{formatCurrency(totalGross)}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-amber-500 text-[11px] tabular-nums">{formatCurrency(totalDiscount)}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-rose-500 text-[11px] tabular-nums">{formatCurrency(totalSalesReturn)}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-[11px] bg-surface-1/20 tabular-nums">{formatCurrency(totalAmount)}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </>
    );
}
