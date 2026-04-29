import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function RecoveryReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    const totals = data.reduce((acc, row) => ({
        sales: acc.sales + Number(row.sales || 0),
        received: acc.received + Number(row.received || 0),
        balance: acc.balance + Number(row.balance || 0),
    }), { sales: 0, received: 0, balance: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Area</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Account</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Contact</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Sales</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Received</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Balance</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/30 transition-all duration-200 group">
                        <TableCell className="py-4 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover:text-text-primary transition-colors">{idx + 1}</TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight truncate max-w-[120px] block">
                                {row.area_name || 'N/A'}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-[11px] font-black text-text-primary uppercase italic tracking-tighter">
                                {row.account_name}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-[10px] font-bold text-text-muted/60 tabular-nums">
                                {row.contact || '---'}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">
                            {formatCurrency(Number(row.sales))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-[11px] tabular-nums">
                            {formatCurrency(Number(row.received))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                            <span className={cn(
                                "text-[12px] font-black tabular-nums",
                                Number(row.balance) > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                                {formatCurrency(Number(row.balance))}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <tfoot className="bg-surface-1/80 border-t-2 border-border/50 font-black">
                <TableRow>
                    <TableCell colSpan={4} className="py-4 px-6 text-right text-[10px] uppercase tracking-widest text-text-muted">
                        Matrix Totals
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[12px] text-text-primary tabular-nums">
                        {formatCurrency(totals.sales)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[12px] text-emerald-600 tabular-nums">
                        {formatCurrency(totals.received)}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[14px] text-indigo-600 tabular-nums">
                        {formatCurrency(totals.balance)}
                    </TableCell>
                </TableRow>
            </tfoot>
        </>
    );
}
