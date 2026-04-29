import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
    params: any;
}

export default function StockNegativeAudit({ data, formatCurrency, params }: Props) {
    if (!data.length) return null;

    const totalNegativeValue = data.reduce((acc, row) => acc + (Math.abs(row.balance_qty) * row.rate), 0);

    return (
        <>
            <TableHeader>
                <TableRow className="bg-rose-600/5 border-b-2 border-rose-600 hover:bg-rose-600/5">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-rose-600 uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-rose-600 uppercase tracking-widest italic min-w-[300px]">Item Description</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-rose-600 uppercase tracking-widest italic">Unit Rate</TableHead>
                    <TableHead className="py-4 px-4 text-center text-[10px] font-black text-rose-600 uppercase tracking-widest italic">Pack</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-rose-600 uppercase tracking-widest italic">Negative Balance</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-rose-600 uppercase tracking-widest italic">Audit Value</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-rose-100/10 hover:bg-rose-600/5 transition-all duration-200 group">
                        <TableCell className="py-4 px-6 text-[10px] font-black text-rose-600/40 uppercase italic group-hover:text-rose-600 transition-colors">{idx + 1}</TableCell>
                        <TableCell className="py-4 px-4">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-text-primary uppercase italic tracking-tighter group-hover:text-rose-600 transition-colors">
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
                        <TableCell className="py-4 px-4 text-right font-black text-rose-600 text-[12px] tabular-nums bg-rose-600/5">
                            {Number(row.balance_qty).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-rose-700 text-[12px] tabular-nums">
                            {formatCurrency(Math.abs(row.balance_qty) * row.rate)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <tfoot className="bg-rose-600/10 border-t-2 border-rose-600 font-black">
                <TableRow>
                    <TableCell colSpan={5} className="py-6 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                            <AlertTriangle className="h-4 w-4 text-rose-600" />
                            <span className="text-[11px] uppercase tracking-[0.2em] text-rose-600 italic">Total Negative Inventory Valuation</span>
                        </div>
                    </TableCell>
                    <TableCell className="py-6 px-4 text-right text-[16px] text-rose-600 tabular-nums tracking-tighter italic">
                        {formatCurrency(totalNegativeValue)}
                    </TableCell>
                </TableRow>
            </tfoot>
        </>
    );
}
