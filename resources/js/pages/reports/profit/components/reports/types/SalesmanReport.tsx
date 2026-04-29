import React from 'react';
import { 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { ProfitDataRow } from '../../../types/profit';

interface Props {
    data: ProfitDataRow[];
    formatCurrency: (value: number) => string;
}

const SalesmanReport: React.FC<Props> = ({ data, formatCurrency }) => {
    return (
        <>
            <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 w-12 text-center">S.#</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10">Salesman Name</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Sale Amount</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Pur Amount</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Profit Loss</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-center w-[100px]">%</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-border/30 hover:bg-surface-1 transition-colors group">
                        <TableCell className="text-[10px] font-bold text-text-muted text-center tabular-nums">{idx + 1}</TableCell>
                        <TableCell className="text-[10px] font-black text-text-primary uppercase">{row.name}</TableCell>
                        <TableCell className="text-[10px] font-bold text-text-primary/70 text-right tabular-nums">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-text-primary/70 text-right tabular-nums">{formatCurrency(row.cogs)}</TableCell>
                        <TableCell className={`text-[10px] font-black text-right tabular-nums ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatCurrency(row.profit)}
                        </TableCell>
                        <TableCell className="text-center">
                            <div className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[9px] font-black tabular-nums border ${row.margin >= 0 ? 'bg-emerald-500/10 border-emerald-600/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-600/20 text-rose-600 dark:text-rose-400'}`}>
                                {row.margin}%
                            </div>
                        </TableCell>
                    </TableRow>
                ))}

                {data.length > 0 && (() => {
                    const totals = data.reduce((acc, row) => ({
                        revenue: acc.revenue + (Number(row.revenue) || 0),
                        cogs: acc.cogs + (Number(row.cogs) || 0),
                        profit: acc.profit + (Number(row.profit) || 0),
                    }), { revenue: 0, cogs: 0, profit: 0 });

                    const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

                    return (
                        <TableRow className="bg-surface-1/50 border-t-2 border-border font-black hover:bg-surface-1/50">
                            <TableCell colSpan={2} className="text-[10px] text-right uppercase tracking-widest text-text-muted pr-4">Total</TableCell>
                            <TableCell className="text-[10px] text-right tabular-nums">{formatCurrency(totals.revenue)}</TableCell>
                            <TableCell className="text-[10px] text-right tabular-nums text-text-muted">{formatCurrency(totals.cogs)}</TableCell>
                            <TableCell className={`text-[10px] text-right tabular-nums ${totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(totals.profit)}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-sm text-[9px] font-black tabular-nums border ${totalMargin >= 0 ? 'bg-emerald-500/10 border-emerald-600/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-600/20 text-rose-600 dark:text-rose-400'}`}>
                                    {totalMargin.toFixed(2)}%
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })()}
            </TableBody>
        </>
    );
};

export default SalesmanReport;
