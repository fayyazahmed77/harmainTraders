import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SummaryRow {
    id: number;
    title: string;
    type_name: string;
    debit: number;
    credit: number;
}

interface SummaryReportViewProps {
    data: SummaryRow[];
    title?: string;
}

export function SummaryReportView({ data, title = "Total Summary" }: SummaryReportViewProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-1/30 rounded-3xl border border-border/50">
                <Layers className="h-10 w-10 text-text-muted/20 mb-4" />
                <h3 className="text-sm font-display font-black text-text-muted uppercase tracking-widest">No Intelligence Data</h3>
            </div>
        );
    }

    const { totalDebit, totalCredit } = useMemo(() => {
        return data.reduce((acc, row) => ({
            totalDebit: acc.totalDebit + (Number(row.debit) || 0),
            totalCredit: acc.totalCredit + (Number(row.credit) || 0)
        }), { totalDebit: 0, totalCredit: 0 });
    }, [data]);

    const formatNum = (num: number) => {
        if (!num || num === 0) return '';
        return Math.round(num).toLocaleString();
    };

    return (
        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-0 border-b-2 border-border/60">
                        <tr>
                            <th className="px-6 py-4 font-display font-black text-xs text-text-muted uppercase tracking-wider w-16 text-center">S.#</th>
                            <th className="px-6 py-4 font-display font-black text-xs text-text-muted uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 font-display font-black text-xs text-text-muted uppercase tracking-wider">Account Typed</th>
                            <th className="px-6 py-4 font-display font-black text-xs text-text-muted uppercase tracking-wider text-right">Debit</th>
                            <th className="px-6 py-4 font-display font-black text-xs text-text-muted uppercase tracking-wider text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {data.map((row, index) => (
                            <tr 
                                key={row.id} 
                                className="hover:bg-surface-1/30 transition-colors duration-150 group"
                            >
                                <td className="px-6 py-3 font-mono-jet text-xs text-text-muted/60 text-center">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-3 font-semibold text-text-primary group-hover:text-amber-500 transition-colors">
                                    {row.title}
                                </td>
                                <td className="px-6 py-3 font-medium text-text-muted text-xs">
                                    {row.type_name}
                                </td>
                                <td className="px-6 py-3 font-mono-jet font-bold text-emerald-600 dark:text-emerald-400 text-right">
                                    {formatNum(row.debit)}
                                </td>
                                <td className="px-6 py-3 font-mono-jet font-bold text-rose-600 dark:text-rose-400 text-right">
                                    {formatNum(row.credit)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-surface-0 border-t-2 border-text-primary/10">
                        <tr>
                            <td colSpan={3} className="px-6 py-4 font-display font-black text-sm text-text-primary uppercase tracking-widest text-right">
                                {title}
                            </td>
                            <td className="px-6 py-4 font-mono-jet font-black text-sm text-emerald-600 dark:text-emerald-400 text-right">
                                {Number(totalDebit) > 0 ? Math.round(totalDebit).toLocaleString() : ''}
                            </td>
                            <td className="px-6 py-4 font-mono-jet font-black text-sm text-rose-600 dark:text-rose-400 text-right">
                                {Number(totalCredit) > 0 ? Math.round(totalCredit).toLocaleString() : ''}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
