import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Columns } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrialBalance6ColRow {
    id: number;
    code: string;
    title: string;
    type_name: string;
    opening_dr: number;
    opening_cr: number;
    period_dr: number;
    period_cr: number;
    closing_dr: number;
    closing_cr: number;
}

interface TrialBalance6ColReportViewProps {
    data: TrialBalance6ColRow[];
    fromDate: Date;
    toDate: Date;
}

export function TrialBalance6ColReportView({ data, fromDate, toDate }: TrialBalance6ColReportViewProps) {
    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            opening_dr: acc.opening_dr + Number(row.opening_dr),
            opening_cr: acc.opening_cr + Number(row.opening_cr),
            period_dr: acc.period_dr + Number(row.period_dr),
            period_cr: acc.period_cr + Number(row.period_cr),
            closing_dr: acc.closing_dr + Number(row.closing_dr),
            closing_cr: acc.closing_cr + Number(row.closing_cr),
        }), {
            opening_dr: 0,
            opening_cr: 0,
            period_dr: 0,
            period_cr: 0,
            closing_dr: 0,
            closing_cr: 0,
        });
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-1/30 rounded-3xl border border-border/50">
                <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                    <Columns className="w-8 h-8 text-text-secondary" />
                </div>
                <h3 className="text-xl font-display font-bold text-text-primary mb-2">No Data Available</h3>
                <p className="text-text-secondary">Try adjusting your filters or date range.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="overflow-x-auto rounded-sm border border-text-primary/10 shadow-xl bg-surface-0/50 backdrop-blur-sm">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-1 border-b border-text-primary/10">
                            <th rowSpan={2} className="px-4 py-6 text-left text-xs font-display font-black text-text-primary uppercase tracking-widest border-r border-text-primary/5">Account Code</th>
                            <th rowSpan={2} className="px-4 py-6 text-left text-xs font-display font-black text-text-primary uppercase tracking-widest border-r border-text-primary/5">Account Name</th>
                            <th rowSpan={2} className="px-4 py-6 text-left text-xs font-display font-black text-text-primary uppercase tracking-widest border-r border-text-primary/5 text-center">Type</th>
                            <th colSpan={2} className="px-4 py-3 text-center text-xs font-display font-black text-text-primary uppercase tracking-widest border-r border-text-primary/5 border-b border-text-primary/5 bg-surface-2/30">Opening Balance</th>
                            <th colSpan={2} className="px-4 py-3 text-center text-xs font-display font-black text-text-primary uppercase tracking-widest border-r border-text-primary/5 border-b border-text-primary/5 bg-indigo-500/5">Trans. ({format(fromDate, 'dd MMM yy')} - {format(toDate, 'dd MMM yy')})</th>
                            <th colSpan={2} className="px-4 py-3 text-center text-xs font-display font-black text-text-primary uppercase tracking-widest bg-emerald-500/5 border-b border-text-primary/5">Closing Balance</th>
                        </tr>
                        <tr className="bg-surface-1 border-b border-text-primary/10">
                            <th className="px-4 py-3 text-right text-xs font-display font-black text-text-secondary uppercase tracking-widest border-r border-text-primary/5">Debit</th>
                            <th className="px-4 py-3 text-right text-xs font-display font-black text-text-secondary uppercase tracking-widest border-r border-text-primary/5">Credit</th>
                            <th className="px-4 py-3 text-right text-xs font-display font-black text-text-secondary uppercase tracking-widest border-r border-text-primary/5">Debit</th>
                            <th className="px-4 py-3 text-right text-xs font-display font-black text-text-secondary uppercase tracking-widest border-r border-text-primary/5">Credit</th>
                            <th className="px-4 py-3 text-right text-xs font-display font-black text-text-secondary uppercase tracking-widest border-r border-text-primary/5">Debit</th>
                            <th className="px-4 py-3 text-right text-xs font-display font-black text-text-secondary uppercase tracking-widest">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-text-primary/5 font-mono-jet">
                        {data.map((row) => (
                            <tr key={row.id} className="hover:bg-text-primary/5 transition-colors group">
                                <td className="px-4 py-4 text-sm text-text-primary border-r border-text-primary/5">{row.code}</td>
                                <td className="px-4 py-4 text-sm font-display font-bold text-text-primary border-r border-text-primary/5 whitespace-nowrap">{row.title}</td>
                                <td className="px-4 py-4 text-xs font-bold text-text-secondary text-center border-r border-text-primary/5">{row.type_name}</td>
                                <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-text-primary">
                                    {row.opening_dr > 0 ? row.opening_dr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-text-primary">
                                    {row.opening_cr > 0 ? row.opening_cr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-indigo-600 dark:text-indigo-400 font-black">
                                    {row.period_dr > 0 ? row.period_dr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-rose-600 dark:text-rose-400 font-black">
                                    {row.period_cr > 0 ? row.period_cr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-emerald-600 dark:text-emerald-400 font-black">
                                    {row.closing_dr > 0 ? row.closing_dr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-right text-emerald-600 dark:text-emerald-400 font-black">
                                    {row.closing_cr > 0 ? row.closing_cr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-surface-1 border-t-2 border-text-primary/10 font-mono-jet">
                        <tr className="font-black">
                            <td colSpan={3} className="px-4 py-4 text-right text-xs font-display uppercase tracking-widest text-text-primary border-r border-text-primary/5">Totals</td>
                            <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-text-primary">
                                {totals.opening_dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-text-primary">
                                {totals.opening_cr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-indigo-600 dark:text-indigo-400">
                                {totals.period_dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-rose-600 dark:text-rose-400">
                                {totals.period_cr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-sm text-right border-r border-text-primary/5 text-emerald-600 dark:text-emerald-400 underline underline-offset-4 decoration-2">
                                {totals.closing_dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-sm text-right text-emerald-600 dark:text-emerald-400 underline underline-offset-4 decoration-2">
                                {totals.closing_cr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-0/50 backdrop-blur-sm p-6 rounded-3xl border border-text-primary/10 shadow-lg flex justify-between items-center">
                    <span className="text-text-secondary font-display font-bold uppercase tracking-widest text-xs tracking-widest">Net Profit / Loss</span>
                    <div className={cn(
                        "text-2xl font-black font-mono-jet",
                        (totals.closing_dr - totals.closing_cr) >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                       {Math.abs(totals.closing_dr - totals.closing_cr).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       <span className="text-xs ml-2 opacity-60">{(totals.closing_dr - totals.closing_cr) >= 0 ? 'DR' : 'CR'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
