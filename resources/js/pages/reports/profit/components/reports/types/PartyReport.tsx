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

const PartyReport: React.FC<Props> = ({ data, formatCurrency }) => {
    return (
        <>
            <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 w-12 text-center">S.#</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10">Customer</TableHead>
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
                                {row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(2) : '0.00'}%
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </>
    );
};

export default PartyReport;
