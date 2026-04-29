import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
    params: any;
}

export default function StockTypeWise({ data, formatCurrency, params }: Props) {
    if (!data.length) return null;

    // Group data by item_type
    const groupedData = data.reduce((acc: { [key: string]: any[] }, row) => {
        const type = row.item_type || 'Uncategorized';
        if (!acc[type]) acc[type] = [];
        acc[type].push(row);
        return acc;
    }, {});

    const types = Object.keys(groupedData).sort();

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
                {types.map((type) => {
                    const items = groupedData[type];
                    const typeTotals = items.reduce((acc, item) => ({
                        in: acc.in + Number(item.in_qty || 0),
                        out: acc.out + Number(item.out_qty || 0),
                        balance: acc.balance + Number(item.balance_qty || 0),
                    }), { in: 0, out: 0, balance: 0 });

                    return (
                        <React.Fragment key={type}>
                            {/* Group Header */}
                            <TableRow className="bg-emerald-600/5 hover:bg-emerald-600/10 transition-colors border-y border-emerald-600/20">
                                <TableCell colSpan={7} className="py-2 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 italic">
                                            {type} <span className="text-text-muted/40 ml-2">({items.length} Items)</span>
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Group Items */}
                            {items.map((row, idx) => (
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

                            {/* Group Footer */}
                            <TableRow className="bg-surface-1/20 font-bold border-b-2 border-border/20">
                                <TableCell colSpan={4} className="py-3 px-6 text-right text-[9px] uppercase tracking-widest text-text-muted italic">
                                    {type} Subtotals
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right text-[10px] text-blue-600/60 tabular-nums">
                                    {typeTotals.in.toLocaleString()}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right text-[10px] text-amber-600/60 tabular-nums">
                                    {typeTotals.out.toLocaleString()}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right text-[11px] text-emerald-600 tabular-nums">
                                    {typeTotals.balance.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    );
                })}
            </TableBody>
        </>
    );
}
