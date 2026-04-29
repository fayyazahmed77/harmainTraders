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

const CompanyReport: React.FC<Props> = ({ data, formatCurrency }) => {
    return (
        <>
            <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10">Company / Manufacturer</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Sales</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Purchases</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Gross Profit</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-center w-[100px]">Gross Profit %</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-border/30 hover:bg-surface-1 transition-colors group">
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
            </TableBody>
        </>
    );
};

export default CompanyReport;
