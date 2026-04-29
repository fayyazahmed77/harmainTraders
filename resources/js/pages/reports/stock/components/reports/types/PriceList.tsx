import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
    params: any;
}

export default function PriceList({ data, formatCurrency, params }: Props) {
    if (!data.length) return null;

    const showTP = params.showTP !== false;
    const showRetail = params.showRetail !== false;
    const showPT2 = !!params.showPT2;
    const showPT3 = !!params.showPT3;
    const showPT4 = !!params.showPT4;
    const showPT5 = !!params.showPT5;
    const showPT6 = !!params.showPT6;
    const showPT7 = !!params.showPT7;

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[100px]">Code</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Item Description</TableHead>
                    {showTP && <TableHead className="py-4 px-4 text-right text-[10px] font-black text-blue-600 uppercase tracking-widest italic">T.P.</TableHead>}
                    {showPT2 && <TableHead className="py-4 px-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">PT 2</TableHead>}
                    {showPT3 && <TableHead className="py-4 px-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">PT 3</TableHead>}
                    {showPT4 && <TableHead className="py-4 px-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">PT 4</TableHead>}
                    {showPT5 && <TableHead className="py-4 px-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">PT 5</TableHead>}
                    {showPT6 && <TableHead className="py-4 px-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">PT 6</TableHead>}
                    {showPT7 && <TableHead className="py-4 px-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">PT 7</TableHead>}
                    {showRetail && <TableHead className="py-4 px-4 text-right text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Retail</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/30 transition-all duration-200 group">
                        <TableCell className="py-4 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover:text-text-primary transition-colors">{idx + 1}</TableCell>
                        <TableCell className="py-4 px-4 text-[10px] font-black text-text-muted uppercase italic tabular-nums">
                            {row.code}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-[12px] font-black text-text-primary uppercase italic tracking-tighter">
                                {row.item_name}
                            </span>
                        </TableCell>
                        {showTP && <TableCell className="py-4 px-4 text-right font-black text-blue-600 text-[12px] tabular-nums">{formatCurrency(Number(row.trade_price))}</TableCell>}
                        {showPT2 && <TableCell className="py-4 px-4 text-right font-bold text-indigo-600 text-[11px] tabular-nums">{formatCurrency(Number(row.pt2))}</TableCell>}
                        {showPT3 && <TableCell className="py-4 px-4 text-right font-bold text-indigo-600 text-[11px] tabular-nums">{formatCurrency(Number(row.pt3))}</TableCell>}
                        {showPT4 && <TableCell className="py-4 px-4 text-right font-bold text-indigo-600 text-[11px] tabular-nums">{formatCurrency(Number(row.pt4))}</TableCell>}
                        {showPT5 && <TableCell className="py-4 px-4 text-right font-bold text-indigo-600 text-[11px] tabular-nums">{formatCurrency(Number(row.pt5))}</TableCell>}
                        {showPT6 && <TableCell className="py-4 px-4 text-right font-bold text-indigo-600 text-[11px] tabular-nums">{formatCurrency(Number(row.pt6))}</TableCell>}
                        {showPT7 && <TableCell className="py-4 px-4 text-right font-bold text-indigo-600 text-[11px] tabular-nums">{formatCurrency(Number(row.pt7))}</TableCell>}
                        {showRetail && <TableCell className="py-4 px-4 text-right font-black text-emerald-600 text-[12px] tabular-nums">{formatCurrency(Number(row.retail))}</TableCell>}
                    </TableRow>
                ))}
            </TableBody>
        </>
    );
}
