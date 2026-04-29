import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function AreaPartyReport({ data, formatCurrency }: Props) {
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
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest w-[80px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest">Account Tittle</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedGroups.map((group: any, gIdx: number) => (
                    <React.Fragment key={gIdx}>
                        {/* [ANIMATION] Group Header Row */}
                        <TableRow className="bg-surface-1/80 border-y border-border/50 hover:bg-surface-2/80 transition-colors">
                            <TableCell colSpan={2} className="py-2.5 px-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest border-r border-border pr-3">Sub Area Tittle</span>
                                    <span className="text-[13px] font-black text-text-primary uppercase italic tracking-tighter">{group.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-2.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Sales</span>
                                    <div className="bg-indigo-600 text-white px-3 py-1 rounded-sm text-[12px] font-black tabular-nums shadow-sm shadow-indigo-600/20">
                                        {formatCurrency(group.total)}
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>

                        {/* [ANIMATION] Individual Party Rows */}
                        {group.items.map((row: any, iIdx: number) => {
                            globalIdx++;
                            return (
                                <TableRow 
                                    key={iIdx} 
                                    className="border-b border-border/5 hover:bg-surface-1/30 transition-all duration-200 group/row"
                                >
                                    <TableCell className="py-3 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover/row:text-text-primary transition-colors">
                                        {globalIdx}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight transition-colors">
                                                {row.account_title}
                                            </span>
                                        </div>
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
                            <TableCell colSpan={3} className="p-0" />
                        </TableRow>
                    </React.Fragment>
                ))}
            </TableBody>
        </>
    );
}
