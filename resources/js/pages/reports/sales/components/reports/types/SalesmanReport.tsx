import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function SalesmanReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    const totals = data.reduce((acc, row) => ({
        gross: acc.gross + Number(row.gross || 0),
        discount: acc.discount + Number(row.discount || 0),
        amount: acc.amount + Number(row.amount || 0),
        recovery: acc.recovery + Number(row.recovery || 0),
    }), { gross: 0, discount: 0, amount: 0, recovery: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Salesman</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Gross</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Discount</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Net Amount</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Recovery</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[100px]">Per %</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/30 transition-all duration-200 group">
                        <TableCell className="py-4 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover:text-text-primary transition-colors">{idx + 1}</TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-[12px] font-black text-text-primary uppercase italic tracking-tighter">
                                {row.salesman_name}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-muted text-[11px] tabular-nums">
                            {formatCurrency(Number(row.gross))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-rose-600/60 text-[10px] tabular-nums italic">
                            {formatCurrency(Number(row.discount))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-[12px] tabular-nums">
                            {formatCurrency(Number(row.amount))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-[11px] tabular-nums">
                            {formatCurrency(Number(row.recovery))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-muted/60 text-[10px] tabular-nums italic">
                            {Number(row.percentage || 0).toFixed(2)}%
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <tfoot className="bg-surface-1/80 border-t-2 border-border/50 font-black">
                <TableRow>
                    <TableCell colSpan={2} className="py-4 px-6 text-right text-[10px] uppercase tracking-widest text-text-muted">
                        Sales Performance Total
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[11px] text-text-muted tabular-nums">
                        {formatCurrency(totals.gross)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[10px] text-rose-600/60 tabular-nums italic">
                        {formatCurrency(totals.discount)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[14px] text-indigo-600 tabular-nums">
                        {formatCurrency(totals.amount)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[12px] text-emerald-600 tabular-nums">
                        {formatCurrency(totals.recovery)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[11px] text-text-muted tabular-nums">
                        100.00%
                    </TableCell>
                </TableRow>
            </tfoot>
        </>
    );
}
