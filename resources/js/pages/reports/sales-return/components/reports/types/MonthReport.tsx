import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface MonthReportProps {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function MonthReport({ data, formatCurrency }: MonthReportProps) {
    return (
        <>
            <TableHeader className="bg-surface-1">
                <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-text-muted text-center italic">S#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Account Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Item Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic text-center">Month</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Qty F</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Qty P</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, index) => (
                    <TableRow key={index} className="hover:bg-orange-500/5 transition-colors group border-border/10">
                        <TableCell className="text-center text-[11px] font-bold text-text-muted/60">{index + 1}</TableCell>
                        <TableCell className="text-[11px] font-black text-text-primary uppercase italic tracking-tight">{row.account_name}</TableCell>
                        <TableCell className="text-[11px] font-black text-blue-600 uppercase italic tracking-tight">{row.item_name}</TableCell>
                        <TableCell className="text-center text-[11px] font-black text-orange-600 bg-orange-600/5 rounded-sm">{row.month_name}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-primary">{row.qty_f}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-primary">{row.qty_p}</TableCell>
                        <TableCell className="text-right text-[11px] font-black text-orange-600">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/40 hover:bg-surface-1/40 border-t-2 border-border/50">
                    <TableCell colSpan={4} className="text-right text-[10px] font-black uppercase tracking-widest italic py-6">Total Period Volume</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-text-primary">{data.reduce((acc, r) => acc + Number(r.qty_f), 0)}</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-text-primary">{data.reduce((acc, r) => acc + Number(r.qty_p), 0)}</TableCell>
                    <TableCell className="text-right text-[14px] font-black text-orange-600 underline decoration-double decoration-orange-600/30 underline-offset-4">
                        {formatCurrency(data.reduce((acc, r) => acc + Number(r.amount), 0))}
                    </TableCell>
                </TableRow>
            </TableBody>
        </>
    );
}
