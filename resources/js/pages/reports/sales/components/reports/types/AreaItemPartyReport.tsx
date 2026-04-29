import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function AreaItemPartyReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    // Group data by subarea_name
    const groups = data.reduce((acc: any, row: any) => {
        const area = row.subarea_name || 'UNASSIGNED AREA';
        if (!acc[area]) {
            acc[area] = {
                name: area,
                items: [],
                total: 0
            };
        }
        acc[area].items.push(row);
        acc[area].total += Number(row.amount || 0);
        return acc;
    }, {});

    const sortedGroups = Object.values(groups).sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    let globalIdx = 0;

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">Account Tittle</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">Product</TableHead>
                    <TableHead className="py-4 px-4 text-center text-[10px] font-black text-text-primary uppercase tracking-widest">Pack Size</TableHead>
                    <TableHead className="py-4 px-4 text-center text-[10px] font-black text-text-primary uppercase tracking-widest">Qty Full</TableHead>
                    <TableHead className="py-4 px-4 text-center text-[10px] font-black text-text-primary uppercase tracking-widest">Qty Pcs</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest">Rate</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedGroups.map((group: any, gIdx: number) => (
                    <React.Fragment key={gIdx}>
                        {/* Group Header Row */}
                        <TableRow className="bg-surface-1/80 border-y border-border/50 hover:bg-surface-2/80 transition-colors">
                            <TableCell colSpan={6} className="py-2.5 px-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest border-r border-border pr-3">Sub Area Tittle</span>
                                    <span className="text-[13px] font-black text-text-primary uppercase italic tracking-tighter">{group.name}</span>
                                </div>
                            </TableCell>
                            <TableCell colSpan={2} className="py-2.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Sales</span>
                                    <div className="bg-indigo-600 text-white px-3 py-1 rounded-sm text-[12px] font-black tabular-nums shadow-sm shadow-indigo-600/20">
                                        {formatCurrency(group.total)}
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>

                        {/* Individual Rows */}
                        {group.items.map((row: any, iIdx: number) => {
                            globalIdx++;
                            return (
                                <TableRow key={iIdx} className="border-b border-border/5 hover:bg-surface-1/30 transition-all duration-200 group/row">
                                    <TableCell className="py-3 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover/row:text-text-primary transition-colors">
                                        {globalIdx}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight transition-colors">
                                            {row.account_title}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-tight group-hover/row:text-text-primary transition-colors">
                                            {row.product_name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                        <span className="text-[11px] font-black text-text-muted group-hover/row:text-text-primary">{row.pack_size}</span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center font-black text-text-primary text-[11px] tabular-nums">
                                        {row.qty_full}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-center font-black text-text-primary text-[11px] tabular-nums">
                                        {row.qty_pcs}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-right font-black text-text-muted group-hover/row:text-text-primary text-[11px] tabular-nums">
                                        {formatCurrency(row.rate)}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 group-hover/row:text-indigo-500 transition-colors tabular-nums">
                                            {formatCurrency(row.amount)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        
                        {/* Spacer between groups */}
                        <TableRow className="h-4 border-none hover:bg-transparent">
                            <TableCell colSpan={8} className="p-0" />
                        </TableRow>
                    </React.Fragment>
                ))}
            </TableBody>
        </>
    );
}
