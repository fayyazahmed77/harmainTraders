import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn, formatSafeDate } from '@/lib/utils';

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
                        <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic whitespace-nowrap">Inv No</TableHead>
                        <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic min-w-[200px]">Account</TableHead>
                        <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic min-w-[200px]">Item</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Rate</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Purchase</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Sale</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Net Amount</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Balance</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Stock Value</TableHead>
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Profit/Loss</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, idx) => (
                        <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/30 transition-all duration-200 group">
                            <TableCell className="py-4 px-4 text-[10px] font-black text-text-muted uppercase tabular-nums">
                                {formatSafeDate(row.date).toUpperCase()}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-[10px] font-black uppercase tabular-nums">
                                <span className={cn(
                                    "font-black tracking-wider px-2 py-0.5 rounded text-[10px] border",
                                    row.type === 'sale' ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" :
                                    row.type === 'purchase' ? "text-blue-600 bg-blue-500/10 border-blue-500/20" :
                                    "text-rose-600 bg-rose-500/10 border-rose-500/20"
                                )}>
                                    {row.voucher_no || row.invoice || '-'}
                                </span>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-text-primary uppercase italic tracking-tighter">
                                        {row.account_name}
                                    </span>
                                    <span className={cn(
                                        "text-[8px] font-bold uppercase tracking-widest opacity-80",
                                        row.type === 'sale' ? "text-emerald-600" :
                                        row.type === 'purchase' ? "text-blue-600" :
                                        "text-rose-600"
                                    )}>
                                        {(row.type || '').replace('_', ' ')}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                                <span className="text-[11px] font-black text-text-primary uppercase italic tracking-tighter">
                                    {row.item_name}
                                </span>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-bold text-text-muted text-[11px] tabular-nums">
                                {formatCurrency(Number(row.rate))}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-black text-blue-600 text-[11px] tabular-nums">
                                {row.in_fmt || (row.in_qty > 0 ? Number(row.in_qty).toLocaleString() : '-')}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-black text-amber-600 text-[11px] tabular-nums">
                                {row.out_fmt || (row.out_qty > 0 ? Number(row.out_qty).toLocaleString() : '-')}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-black text-purple-600 text-[11px] tabular-nums">
                                {row.subtotal > 0 ? formatCurrency(Number(row.subtotal)) : '-'}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-right font-black text-emerald-600 text-[11px] tabular-nums">
                                {row.balance_fmt || Number(row.balance).toLocaleString()}
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
