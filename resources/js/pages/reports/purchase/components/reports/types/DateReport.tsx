import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSafeDate } from '@/lib/utils';

const DateReport = ({ data, formatCurrency }: any) => {
    const total = data.reduce((acc: number, row: any) => acc + (Number(row.total_amount) || 0), 0);

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b border-border/50">
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted w-[80px]">S.#</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted">Date</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row: any, index: number) => (
                    <TableRow key={index} className="border-b border-border/10 hover:bg-emerald-500/5 transition-colors group">
                        <TableCell className="py-2.5 text-[10px] font-bold text-text-muted">{index + 1}</TableCell>
                        <TableCell className="py-2.5 text-[11px] font-black text-text-primary uppercase tracking-tight">
                            {formatSafeDate(row.date)}
                        </TableCell>
                        <TableCell className="py-2.5 text-[11px] font-black text-right tabular-nums text-emerald-500">
                            {formatCurrency(row.total_amount)}
                        </TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/30 font-black border-t-2 border-border/50">
                    <TableCell colSpan={2} className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Grand Totals</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-emerald-500">
                        {formatCurrency(total)}
                    </TableCell>
                </TableRow>
            </TableBody>
        </>
    );
};

export default DateReport;
