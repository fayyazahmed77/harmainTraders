import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface AreaItemPartyReportProps {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function AreaItemPartyReport({ data, formatCurrency }: AreaItemPartyReportProps) {
    let currentSubarea = '';
    
    return (
        <>
            <TableHeader className="bg-surface-1">
                <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-text-muted text-center italic">S#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Customer</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted italic">Product</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Qty F</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Qty P</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Rate</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right italic">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, index) => {
                    const showHeader = currentSubarea !== row.subarea_name;
                    if (showHeader) currentSubarea = row.subarea_name;

                    return (
                        <React.Fragment key={index}>
                            {showHeader && (
                                <TableRow className="bg-orange-600/5 hover:bg-orange-600/10 border-border/20">
                                    <TableCell colSpan={7} className="py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-4 bg-orange-600 rounded-full" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-600 italic">
                                                AREA: {row.subarea_name || 'UNASSIGNED'}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            <TableRow className="hover:bg-orange-500/5 transition-colors group border-border/10">
                                <TableCell className="text-center text-[11px] font-bold text-text-muted/60">{index + 1}</TableCell>
                                <TableCell className="text-[11px] font-black text-text-primary uppercase italic tracking-tight">{row.account_title}</TableCell>
                                <TableCell className="text-[11px] font-black text-blue-600 uppercase italic tracking-tight">
                                    {row.product_name}
                                    <span className="ml-2 text-[9px] text-text-muted/40 font-bold tracking-widest">({row.pack_size})</span>
                                </TableCell>
                                <TableCell className="text-right text-[11px] font-bold text-text-primary">{row.qty_full}</TableCell>
                                <TableCell className="text-right text-[11px] font-bold text-text-primary">{row.qty_pcs}</TableCell>
                                <TableCell className="text-right text-[11px] font-bold text-text-muted">{formatCurrency(row.rate)}</TableCell>
                                <TableCell className="text-right text-[11px] font-black text-orange-600">{formatCurrency(row.amount)}</TableCell>
                            </TableRow>
                        </React.Fragment>
                    );
                })}
                <TableRow className="bg-surface-1/40 hover:bg-surface-1/40 border-t-2 border-border/50">
                    <TableCell colSpan={3} className="text-right text-[10px] font-black uppercase tracking-widest italic py-6">Aggregated Area Volume</TableCell>
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
