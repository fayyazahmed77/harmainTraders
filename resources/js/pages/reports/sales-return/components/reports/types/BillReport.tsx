import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatSafeDate } from '@/lib/utils';

interface BillReportProps {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function BillReport({ data, formatCurrency }: BillReportProps) {
    return (
        <>
            <TableHeader className="bg-surface-1">
                <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-text-muted text-center italic">S#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Voucher #</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Customer</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Gross</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Discount</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Net Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, index) => (
                    <TableRow key={index} className="hover:bg-orange-500/5 transition-colors group border-border/10">
                        <TableCell className="text-center text-[11px] font-bold text-text-muted/60">{index + 1}</TableCell>
                        <TableCell className="text-[11px] font-black text-orange-600 group-hover:underline underline-offset-4 cursor-pointer">
                            {row.voucher_no}
                        </TableCell>
                        <TableCell className="text-[11px] font-bold text-text-primary uppercase">{formatSafeDate(row.date).toUpperCase()}</TableCell>
                        <TableCell className="text-[11px] font-black text-text-primary uppercase italic tracking-tight">{row.customer_name}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-muted">{formatCurrency(row.gross)}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-red-500/80">-{formatCurrency(row.discount)}</TableCell>
                        <TableCell className="text-right text-[11px] font-black text-orange-600">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/40 hover:bg-surface-1/40 border-t-2 border-border/50">
                    <TableCell colSpan={4} className="text-right text-[10px] font-black uppercase tracking-widest italic py-6">Total Return Volume</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-text-primary">{formatCurrency(data.reduce((acc, r) => acc + Number(r.gross), 0))}</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-red-500">-{formatCurrency(data.reduce((acc, r) => acc + Number(r.discount), 0))}</TableCell>
                    <TableCell className="text-right text-[14px] font-black text-orange-600 underline decoration-double decoration-orange-600/30 underline-offset-4">
                        {formatCurrency(data.reduce((acc, r) => acc + Number(r.amount), 0))}
                    </TableCell>
                </TableRow>
            </TableBody>
        </>
    );
}
