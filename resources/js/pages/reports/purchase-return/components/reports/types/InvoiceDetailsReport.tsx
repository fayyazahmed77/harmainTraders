import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';

export const InvoiceDetailsReport = ({ data, formatCurrency }: { data: any[], formatCurrency: (v: number) => string }) => {
    // Group by invoice
    const grouped = data.reduce((acc: any, row: any) => {
        if (!acc[row.invoice]) acc[row.invoice] = { 
            items: [], 
            total: 0, 
            date: row.date, 
            supplier: row.account_name 
        };
        acc[row.invoice].items.push(row);
        acc[row.invoice].total += Number(row.amount || 0);
        return acc;
    }, {});

    return (
        <>
            <TableHeader className="bg-surface-1/50">
                <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Invoice Details Breakdown</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Qty (Ctn)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Qty (Pcs)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Rate</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Net Value</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Object.entries(grouped).map(([invoice, group]: [string, any], i) => (
                    <React.Fragment key={invoice}>
                        {/* Header Row */}
                        <TableRow className="bg-surface-1/30 border-y border-border/20">
                            <TableCell colSpan={4} className="py-2">
                                <div className="flex items-center gap-4">
                                    <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tighter">INV # {invoice}</span>
                                    <span className="h-3 w-[1px] bg-border/40" />
                                    <span className="text-[10px] font-bold text-text-primary uppercase">{group.supplier}</span>
                                    <span className="h-3 w-[1px] bg-border/40" />
                                    <span className="text-[9px] font-bold text-text-muted tracking-widest">{group.date}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right py-2">
                                <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                    {formatCurrency(group.total)}
                                </span>
                            </TableCell>
                        </TableRow>
                        {/* Item Rows */}
                        {group.items.map((item: any, idx: number) => (
                            <TableRow key={idx} className="border-border/10 hover:bg-rose-500/5 group/row">
                                <TableCell className="pl-8 py-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-border group-hover/row:bg-rose-500 transition-colors" />
                                        <span className="text-[10px] font-medium text-text-secondary uppercase">{item.product_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-[10px] font-bold tabular-nums text-text-muted">{item.qty_full}</TableCell>
                                <TableCell className="text-right text-[10px] font-bold tabular-nums text-text-muted">{item.qty_pcs}</TableCell>
                                <TableCell className="text-right text-[10px] font-bold tabular-nums text-text-muted">{formatCurrency(item.rate)}</TableCell>
                                <TableCell className="text-right text-[10px] font-black tabular-nums text-text-primary">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
                ))}
            </TableBody>
        </>
    );
};
