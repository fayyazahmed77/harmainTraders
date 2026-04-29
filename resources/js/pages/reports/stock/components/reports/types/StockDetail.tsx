import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
    data: any[];
    formatCurrency: (amount: number) => string;
    params: any;
}

export default function StockDetail({ data, formatCurrency, params }: Props) {
    if (!data.length) return null;

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                        <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic whitespace-nowrap">Date</TableHead>
                        <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic whitespace-nowrap">Voucher #</TableHead>
                        <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic min-w-[200px]">Account</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Rate</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Purchase</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Sale</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Balance</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">COGS Rt</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Amount</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Profit/Loss</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, idx) => (
                        <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/30 transition-all duration-200 group">
                            <TableCell className="py-4 px-4 text-[10px] font-black text-text-muted uppercase tabular-nums">
                                {format(new Date(row.date), 'dd-MMM-yy')}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-[10px] font-black text-text-muted uppercase italic tabular-nums">
                                {row.voucher_no}
                            </TableCell>
                            <TableCell className="py-4 px-4">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-text-primary uppercase italic tracking-tighter">
                                        {row.account_name}
                                    </span>
                                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest opacity-60">
                                        {row.type.replace('_', ' ')}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-bold text-text-muted text-[11px] tabular-nums">
                                {formatCurrency(Number(row.rate))}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-black text-blue-600 text-[11px] tabular-nums">
                                {row.in_qty > 0 ? Number(row.in_qty).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-black text-amber-600 text-[11px] tabular-nums">
                                {row.out_qty > 0 ? Number(row.out_qty).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-black text-emerald-600 text-[11px] tabular-nums">
                                {Number(row.balance).toLocaleString()}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-bold text-text-muted/40 text-[10px] tabular-nums italic">
                                {formatCurrency(Number(row.cogs_rate))}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-black text-indigo-600 text-[11px] tabular-nums">
                                {formatCurrency(Number(row.amount))}
                            </TableCell>
                            <TableCell className={cn(
                                "py-4 px-4 text-right font-black text-[11px] tabular-nums",
                                row.profit_loss > 0 ? "text-emerald-600" : row.profit_loss < 0 ? "text-rose-600" : "text-text-muted/20"
                            )}>
                                {row.profit_loss !== 0 ? formatCurrency(row.profit_loss) : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
