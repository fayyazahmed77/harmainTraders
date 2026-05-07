import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface ItemSummaryReportProps {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function ItemSummaryReport({ data, formatCurrency }: ItemSummaryReportProps) {
    return (
        <>
            <TableHeader className="bg-surface-1">
                <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-text-muted text-center italic">S#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Item Description</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Qty F</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Qty P</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Gross Amt</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Disc</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Net Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, index) => (
                    <TableRow key={index} className="hover:bg-orange-500/5 transition-colors group border-border/10">
                        <TableCell className="text-center text-[11px] font-bold text-text-muted/60">{index + 1}</TableCell>
                        <TableCell className="text-[11px] font-black text-text-primary uppercase italic tracking-tight">
                            {row.item_description}
                            <span className="ml-2 text-[9px] text-text-muted/40 font-bold tracking-widest">({row.packing})</span>
                        </TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-primary">{row.qty_full}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-primary">{row.qty_pcs}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-muted">{formatCurrency(row.gross_amount)}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-red-500/80">-{formatCurrency(row.disc_amt)}</TableCell>
                        <TableCell className="text-right text-[11px] font-black text-orange-600">{formatCurrency(row.net_amount)}</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/40 hover:bg-surface-1/40 border-t-2 border-border/50">
                    <TableCell colSpan={2} className="text-right text-[10px] font-black uppercase tracking-widest italic py-6">Aggregated Product Returns</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-text-primary">{data.reduce((acc, r) => acc + Number(r.qty_full), 0)}</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-text-primary">{data.reduce((acc, r) => acc + Number(r.qty_pcs), 0)}</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-text-primary">{formatCurrency(data.reduce((acc, r) => acc + Number(r.gross_amount), 0))}</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-red-500">-{formatCurrency(data.reduce((acc, r) => acc + Number(r.disc_amt), 0))}</TableCell>
                    <TableCell className="text-right text-[14px] font-black text-orange-600 underline decoration-double decoration-orange-600/30 underline-offset-4">
                        {formatCurrency(data.reduce((acc, r) => acc + Number(r.net_amount), 0))}
                    </TableCell>
                </TableRow>
            </TableBody>
        </>
    );
}
