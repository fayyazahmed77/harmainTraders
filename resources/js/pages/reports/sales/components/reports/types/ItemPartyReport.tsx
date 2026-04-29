import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function ItemPartyReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    // Group data by Account Title
    const groupedData = data.reduce((acc: any, row: any) => {
        const title = row.account_title || 'UNASSIGNED';
        if (!acc[title]) acc[title] = [];
        acc[title].push(row);
        return acc;
    }, {});

    return (
        <div className="space-y-8 pb-10">
            {Object.entries(groupedData).map(([account, items]: [string, any], idx: number) => (
                <div key={idx} className="border border-border rounded-sm overflow-hidden bg-surface-0 shadow-sm">
                    {/* Account Header */}
                    <div className="bg-surface-1/50 border-b border-border px-6 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest italic">Account Title</span>
                            <span className="text-sm font-black text-text-primary uppercase tracking-tight">{account}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest italic">Total Sales</span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {formatCurrency(items.reduce((sum: number, i: any) => sum + Number(i.amount), 0))}
                            </span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-0 border-b border-border/30">
                                    <th className="py-3 px-6 text-left text-[9px] font-black text-text-muted uppercase tracking-widest w-[60px]">S.#</th>
                                    <th className="py-3 px-4 text-left text-[9px] font-black text-text-muted uppercase tracking-widest">Product</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black text-text-muted uppercase tracking-widest w-[100px]">Pack Size</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black text-text-muted uppercase tracking-widest w-[80px]">Qty F</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black text-text-muted uppercase tracking-widest w-[80px]">Qty P</th>
                                    <th className="py-3 px-4 text-right text-[9px] font-black text-text-muted uppercase tracking-widest w-[100px]">Rate</th>
                                    <th className="py-3 px-6 text-right text-[9px] font-black text-text-muted uppercase tracking-widest w-[120px]">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row: any, iIdx: number) => (
                                    <tr key={iIdx} className="border-b border-border/10 hover:bg-surface-1/50 transition-colors group">
                                        <td className="py-2.5 px-6 text-[10px] font-bold text-text-muted/40 italic group-hover:text-text-primary tabular-nums">{iIdx + 1}</td>
                                        <td className="py-2.5 px-4 text-[11px] font-bold text-text-primary uppercase tracking-tight">{row.product_name}</td>
                                        <td className="py-2.5 px-4 text-center text-[11px] font-bold text-text-muted uppercase">{row.pack_size}</td>
                                        <td className="py-2.5 px-4 text-center text-[11px] font-black text-text-primary tabular-nums">{row.qty_full}</td>
                                        <td className="py-2.5 px-4 text-center text-[11px] font-black text-text-primary tabular-nums">{row.qty_pcs}</td>
                                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-text-muted tabular-nums">{formatCurrency(row.rate)}</td>
                                        <td className="py-2.5 px-6 text-right text-[11px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(row.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
