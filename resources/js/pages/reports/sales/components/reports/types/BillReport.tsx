import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function BillReport({ data, formatCurrency }: Props) {
    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">Invoice</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">Date</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">Customer</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">Salesman</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest">Gross</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest">Discount</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest">Net Amount</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest">Paid</TableHead>
                    <TableHead className="py-4 px-4 text-center text-[10px] font-black text-text-primary uppercase tracking-widest">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow 
                        key={idx} 
                        className="relative group border-b border-border/10 hover:bg-surface-1/50 transition-colors duration-150 animate-slide-up will-change-transform"
                        style={{ animationDelay: `${Math.min(idx, 15) * 40}ms`, animationDuration: '280ms' }}
                    >
                        <TableCell className="relative py-4 px-6 text-[10px] font-black text-text-muted/40 uppercase italic">
                            {/* [ANIMATION] Left side accent bar */}
                            <div className="absolute left-0 inset-y-0 w-[2px] bg-indigo-600 scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-200 ease-out z-10" />
                            {idx + 1}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-tighter font-mono bg-indigo-500/5 px-1.5 py-0.5 rounded-sm uppercase group-hover:bg-indigo-600/20 transition-colors duration-150">
                                {row.invoice}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-[11px] font-bold text-text-primary uppercase">{row.date}</TableCell>
                        <TableCell className="py-4 px-4 text-[11px] font-bold text-text-primary uppercase">{row.customer_name}</TableCell>
                        <TableCell className="py-4 px-4 text-[11px] font-bold text-text-primary uppercase">{row.salesman_name}</TableCell>
                        
                        {/* [ANIMATION] Currency Cell Highlighting */}
                        <TableCell className="py-4 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-[11px] group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-150">{formatCurrency(row.gross)}</TableCell>
                        <TableCell className="py-4 px-4 text-right">
                            <span className={cn("text-[11px] font-black transition-colors duration-150", Number(row.discount) > 0 ? "text-rose-500 dark:text-rose-400" : "text-text-muted/40")}>
                                {Number(row.discount) > 0 ? formatCurrency(row.discount) : '---'}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-[11px] bg-surface-1/20 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-150">{formatCurrency(row.amount)}</TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-[11px] group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-150">{formatCurrency(row.paid_amount)}</TableCell>
                        
                        <TableCell className="py-4 px-4 text-center">
                            <Badge variant="outline" className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-none uppercase tracking-widest flex items-center justify-center",
                                row.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : 
                                row.status === 'PENDING' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : 
                                "bg-slate-500/10 text-text-muted border-border"
                            )}>
                                {/* [ANIMATION] Pulse Dot Indicator */}
                                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                    <span className={cn(
                                        "absolute inline-flex h-full w-full rounded-full opacity-60",
                                        row.status === 'COMPLETED' ? "bg-emerald-500 animate-ping" :
                                        row.status === 'PENDING'   ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                                    )} />
                                    <span className={cn(
                                        "relative inline-flex rounded-full h-1.5 w-1.5",
                                        row.status === 'COMPLETED' ? "bg-emerald-500" :
                                        row.status === 'PENDING'   ? "bg-amber-500" : "bg-slate-400"
                                    )} />
                                </span>
                                {row.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </>
    );
}
