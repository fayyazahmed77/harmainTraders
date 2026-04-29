import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function PartySummaryReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    return (
        <div className="border border-border rounded-sm overflow-hidden bg-surface-0 shadow-sm pb-10">
            <table className="w-full">
                <thead>
                    <tr className="bg-surface-2 text-text-primary border-b border-border/50">
                        <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest w-[60px]">S.#</th>
                        <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest">Party / Customer Name</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest w-[80px]">Full</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest w-[80px]">Pcs</th>
                        <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest w-[120px]">Gross Amount</th>
                        <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest w-[100px]">Disc Amt</th>
                        <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest w-[130px]">Net Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={idx} className="border-b border-border/10 hover:bg-surface-1/50 transition-all duration-200 group">
                            <td className="py-3 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover:text-text-primary tabular-nums">{idx + 1}</td>
                            <td className="py-3 px-4">
                                <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight">{row.party_name}</span>
                            </td>
                            <td className="py-3 px-4 text-center text-[11px] font-black text-text-primary tabular-nums">{row.qty_full}</td>
                            <td className="py-3 px-4 text-center text-[11px] font-black text-text-primary tabular-nums">{row.qty_pcs}</td>
                            <td className="py-3 px-4 text-right text-[11px] font-black text-text-muted tabular-nums">{formatCurrency(row.gross_amount)}</td>
                            <td className="py-3 px-4 text-right text-[11px] font-black text-rose-500 tabular-nums">{formatCurrency(row.disc_amt)}</td>
                            <td className="py-3 px-6 text-right">
                                <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(row.net_amount)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-surface-1/80 font-black border-t-2 border-indigo-600">
                        <td colSpan={2} className="py-4 px-6 text-right text-[10px] text-text-muted uppercase tracking-widest">Total Volumes</td>
                        <td className="py-4 px-4 text-center text-[12px] text-text-primary tabular-nums">{data.reduce((sum, r) => sum + Number(r.qty_full), 0)}</td>
                        <td className="py-4 px-4 text-center text-[12px] text-text-primary tabular-nums">{data.reduce((sum, r) => sum + Number(r.qty_pcs), 0)}</td>
                        <td className="py-4 px-4 text-right text-[12px] text-text-muted tabular-nums">{formatCurrency(data.reduce((sum, r) => sum + Number(r.gross_amount), 0))}</td>
                        <td className="py-4 px-4 text-right text-[12px] text-rose-500 tabular-nums">{formatCurrency(data.reduce((sum, r) => sum + Number(r.disc_amt), 0))}</td>
                        <td className="py-4 px-6 text-right text-[14px] text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(data.reduce((sum, r) => sum + Number(r.net_amount), 0))}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
