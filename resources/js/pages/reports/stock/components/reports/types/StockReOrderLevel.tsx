import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (amount: number) => string;
    params: any;
}

export default function StockReOrderLevel({ data, formatCurrency, params }: Props) {
    if (!data.length) return null;

    const totals = data.reduce((acc, row) => ({
        balance: acc.balance + Number(row.balance_qty || 0),
        shortfall: acc.shortfall + Number(row.shortfall || 0),
        amount: acc.amount + Number(row.amount || 0),
    }), { balance: 0, shortfall: 0, amount: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic min-w-[300px]">Item Description</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Rate</TableHead>
                    <TableHead className="py-4 px-4 text-center text-[10px] font-black text-text-primary uppercase tracking-widest italic">Packing</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Re-Order</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Balance</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic text-amber-600">Shortfall</TableHead>
                    {params.withAmount && (
                        <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Amount</TableHead>
                    )}
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
                        <TableCell className="py-4 px-4 text-right font-bold text-text-primary text-[11px] tabular-nums bg-surface-1/20">
                            {Number(row.reorder_level || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className={cn(
                            "py-4 px-4 text-right font-bold text-[11px] tabular-nums",
                            row.balance_qty < 0 ? "text-rose-600" : "text-emerald-600"
                        )}>
                            {Number(row.balance_qty).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-amber-600 text-[12px] tabular-nums bg-amber-500/5">
                            {Number(row.shortfall).toLocaleString()}
                        </TableCell>
                        {params.withAmount && (
                            <TableCell className="py-4 px-4 text-right font-black text-[12px] text-emerald-600 tabular-nums">
                                {formatCurrency(Number(row.amount || 0))}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
            <tfoot className="bg-surface-1/80 border-t-2 border-border/50 font-black">
                <TableRow>
                    <TableCell colSpan={5} className="py-4 px-6 text-right text-[10px] uppercase tracking-widest text-text-muted">
                        Analysis Totals
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[11px] text-emerald-600 tabular-nums">
                        {totals.balance.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[12px] text-amber-600 tabular-nums">
                        {totals.shortfall.toLocaleString()}
                    </TableCell>
                    {params.withAmount && (
                        <TableCell className="py-4 px-4 text-right text-[13px] text-emerald-600 tabular-nums underline decoration-double decoration-emerald-600/30">
                            {formatCurrency(totals.amount)}
                        </TableCell>
                    )}
                </TableRow>
            </tfoot>
        </>
    );
}
