import React from 'react';
import { 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ProfitDataRow } from '../../../types/profit';

interface Props {
    data: ProfitDataRow[];
    formatCurrency: (value: number) => string;
}

const TransactionReport: React.FC<Props> = ({ data, formatCurrency }) => {
    const totals = {
        revenue: data.reduce((sum, row) => sum + row.revenue, 0),
        cogs: data.reduce((sum, row) => sum + row.cogs, 0),
        profit: data.reduce((sum, row) => sum + row.profit, 0),
    };
    const margin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

    return (
        <>
            <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-[8px] font-black text-text-muted uppercase h-10 w-[40px]">S.#</TableHead>
                    <TableHead className="text-[8px] font-black text-text-muted uppercase h-10">Inv #</TableHead>
                    <TableHead className="text-[8px] font-black text-text-muted uppercase h-10">Date</TableHead>
                    <TableHead className="text-[8px] font-black text-text-muted uppercase h-10">Account</TableHead>
                    <TableHead className="text-[8px] font-black text-text-muted uppercase h-10">Product</TableHead>
                    <TableHead className="text-[8px] font-black text-text-muted uppercase h-10 text-right">Qty</TableHead>
                    <TableHead className="text-[8px] font-black text-text-muted uppercase h-10 text-right">Sale Rate</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Sales</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Purch Rate</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Purch Amt</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-right">Profit</TableHead>
                    <TableHead className="text-[9px] font-black text-text-muted uppercase h-10 text-center w-[100px]">%</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-border/30 hover:bg-surface-1 transition-colors group">
                        <TableCell className="text-[10px] font-bold text-text-muted tabular-nums">{idx + 1}</TableCell>
                        <TableCell className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{row.invoice}</TableCell>
                        <TableCell className="text-[10px] items-center font-bold text-text-muted tabular-nums whitespace-nowrap">
                            {row.date ? format(new Date(row.date), 'dd/MM/yy') : '---'}
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-text-primary">{row.customer_name}</TableCell>
                        <TableCell className="text-[10px] font-black text-text-primary uppercase truncate max-w-[150px]">{row.product_name}</TableCell>
                        <TableCell className="text-[10px] font-black text-text-primary text-right tabular-nums">{formatCurrency(row.qty || 0)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-text-muted text-right tabular-nums">{formatCurrency(row.sale_rate || 0)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-text-primary/70 text-right tabular-nums">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-text-muted text-right tabular-nums">{formatCurrency(row.purchase_rate || 0)}</TableCell>
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
                <TableRow className="bg-surface-1/40 border-t-2 border-border/50 hover:bg-surface-1/50 group/total">
                    <TableCell colSpan={7} className="text-[10px] font-black text-text-primary uppercase text-right h-12 pr-6">GRAND TOTALS</TableCell>
                    <TableCell className="text-[11px] font-black text-text-primary text-right tabular-nums border-l border-border/20">{formatCurrency(totals.revenue)}</TableCell>
                    <TableCell className="text-[11px] font-black text-text-muted text-right tabular-nums opacity-50">---</TableCell>
                    <TableCell className="text-[11px] font-black text-rose-600/80 dark:text-rose-400/80 text-right tabular-nums">{formatCurrency(totals.cogs)}</TableCell>
                    <TableCell className={`text-[11px] font-black text-right tabular-nums ${totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(totals.profit)}
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-indigo-600 text-white text-[10px] font-black shadow-sm">
                            {margin.toFixed(2)}%
                        </div>
                    </TableCell>
                </TableRow>
            </TableBody>
        </>
    );
};

export default TransactionReport;
