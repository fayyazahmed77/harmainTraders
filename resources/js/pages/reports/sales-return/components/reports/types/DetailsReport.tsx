import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface DetailsReportProps {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function DetailsReport({ data, formatCurrency }: DetailsReportProps) {
    return (
        <>
            <TableHeader className="bg-surface-1">
                <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-text-muted text-center italic">S#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Voucher #</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Customer</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Product</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Qty F</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Qty P</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Rate</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Subtotal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, index) => (
                    <TableRow key={index} className="hover:bg-orange-500/5 transition-colors group border-border/10">
                        <TableCell className="text-center text-[11px] font-bold text-text-muted/60">{index + 1}</TableCell>
                        <TableCell className="text-[11px] font-black text-orange-600 uppercase tracking-tighter">{row.voucher_no}</TableCell>
                        <TableCell className="text-[11px] font-bold text-text-primary uppercase">{row.date}</TableCell>
                        <TableCell className="text-[11px] font-black text-text-primary uppercase italic tracking-tight">{row.customer_name}</TableCell>
                        <TableCell className="text-[11px] font-black text-text-primary uppercase italic tracking-tight text-blue-600">{row.product_name}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-primary">{row.qty_full}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-primary">{row.qty_pcs}</TableCell>
                        <TableCell className="text-right text-[11px] font-bold text-text-muted">{formatCurrency(row.tp)}</TableCell>
                        <TableCell className="text-right text-[11px] font-black text-orange-600">{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/40 hover:bg-surface-1/40 border-t-2 border-border/50">
                    <TableCell colSpan={5} className="text-right text-[10px] font-black uppercase tracking-widest italic py-6">Total Line-Item Volume</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-text-primary">{data.reduce((acc, r) => acc + Number(r.qty_full), 0)}</TableCell>
                    <TableCell className="text-right text-[12px] font-black text-text-primary">{data.reduce((acc, r) => acc + Number(r.qty_pcs), 0)}</TableCell>
                    <TableCell />
                    <TableCell className="text-right text-[14px] font-black text-orange-600 underline decoration-double decoration-orange-600/30 underline-offset-4">
                        {formatCurrency(data.reduce((acc, r) => acc + Number(r.amount), 0))}
                    </TableCell>
                </TableRow>
            </TableBody>
        </>
    );
}
