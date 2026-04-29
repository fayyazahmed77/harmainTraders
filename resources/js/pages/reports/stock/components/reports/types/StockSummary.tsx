import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (amount: number) => string;
    params: any;
}

export default function StockSummary({ data, formatCurrency, params }: Props) {
    if (!data.length) return null;

    const totals = data.reduce((acc, row) => ({
        in: acc.in + Number(row.in_qty || 0),
        out: acc.out + Number(row.out_qty || 0),
        balance: acc.balance + Number(row.balance_qty || 0),
        amount: acc.amount + Number(row.amount || 0),
    }), { in: 0, out: 0, balance: 0, amount: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic min-w-[300px]">Item</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Rate</TableHead>
                    <TableHead className="py-4 px-4 text-center text-[10px] font-black text-text-primary uppercase tracking-widest italic">Packing</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">In</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Out</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Balance</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/30 transition-all duration-200 group">
                        <TableCell className="py-4 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover:text-text-primary transition-colors">{idx + 1}</TableCell>
                        <TableCell className="py-4 px-4">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-text-primary uppercase italic tracking-tighter">
                                    {row.item_name}
                                </span>
                                <span className="text-[9px] font-bold text-text-muted/40 uppercase tracking-widest">
                                    {row.company_name}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-bold text-text-muted text-[11px] tabular-nums">
                            {formatCurrency(Number(row.rate))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center font-bold text-text-muted text-[11px] tabular-nums">
                            {row.packing_qty}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-bold text-blue-600 text-[11px] tabular-nums">
                            {Number(row.in_qty).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-bold text-amber-600 text-[11px] tabular-nums">
                            {Number(row.out_qty).toLocaleString()}
                        </TableCell>
                        <TableCell className={cn(
                            "py-4 px-4 text-right font-black text-[12px] tabular-nums",
                            row.balance_qty < 0 ? "text-rose-600" : "text-emerald-600"
                        )}>
                            {Number(row.balance_qty).toLocaleString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <tfoot className="bg-surface-1/80 border-t-2 border-border/50 font-black">
                <TableRow>
                    <TableCell colSpan={4} className="py-4 px-6 text-right text-[10px] uppercase tracking-widest text-text-muted">
                        Page Totals
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[11px] text-blue-600 tabular-nums">
                        {totals.in.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[11px] text-amber-600 tabular-nums">
                        {totals.out.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[12px] text-emerald-600 tabular-nums">
                        {totals.balance.toLocaleString()}
                    </TableCell>
                </TableRow>
            </tfoot>
        </>
    );
}
