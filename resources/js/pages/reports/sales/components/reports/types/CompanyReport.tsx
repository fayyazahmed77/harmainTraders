import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function CompanyReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    const totalAmount = data.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">Client</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest w-[180px]">Amount</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest w-[120px]">Per %</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-border/5 hover:bg-surface-1/30 transition-all duration-200 group/row">
                        <TableCell className="py-3 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover/row:text-text-primary transition-colors">
                            {idx + 1}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                            <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight transition-colors">
                                {row.company_name || 'UNASSIGNED COMPANY'}
                            </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                            <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 transition-colors tabular-nums">
                                {formatCurrency(row.amount)}
                            </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-black text-text-muted text-[11px] tabular-nums">
                            {Number(row.percentage || 0).toFixed(2)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <tfoot className="bg-surface-1/80 border-t-2 border-border font-black">
                <TableRow>
                    <TableCell colSpan={2} className="py-4 px-6 text-right text-[10px] uppercase tracking-widest text-text-muted">
                        Total Summary
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[14px] text-indigo-600 tabular-nums">
                        {formatCurrency(totalAmount)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[11px] text-text-muted tabular-nums">
                        100.00
                    </TableCell>
                </TableRow>
            </tfoot>
        </>
    );
}
