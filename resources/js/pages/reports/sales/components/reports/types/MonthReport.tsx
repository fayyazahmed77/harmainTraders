import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function MonthReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    // Group data by Month -> Account -> Item
    const groupedData = data.reduce((acc: any, row: any) => {
        const month = row.month_name;
        const account = row.account_name;
        const item = row.item_name;

        if (!acc[month]) {
            acc[month] = {
                name: month,
                totalAmount: 0,
                totalQtyF: 0,
                totalQtyP: 0,
                accounts: {}
            };
        }

        acc[month].totalAmount += Number(row.amount) || 0;
        acc[month].totalQtyF += Number(row.qty_f) || 0;
        acc[month].totalQtyP += Number(row.qty_p) || 0;

        if (!acc[month].accounts[account]) {
            acc[month].accounts[account] = [];
        }

        acc[month].accounts[account].push({
            item,
            qtyF: row.qty_f,
            qtyP: row.qty_p,
            amount: row.amount
        });

        return acc;
    }, {});

    // Sort months descending (chronological)
    const monthOrder: { [key: string]: number } = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    const sortedMonths = Object.values(groupedData).sort((a: any, b: any) => {
        return (monthOrder[b.name] || 0) - (monthOrder[a.name] || 0);
    });

    return (
        <div className="space-y-8 pb-10">
            {sortedMonths.map((month: any, mIdx: number) => (
                <div key={month.name} className="relative">
                    {/* Month Header Block */}
                    <div className="bg-surface-2 text-text-primary p-2 rounded-t-sm flex flex-wrap items-center justify-between gap-6 shadow-sm relative z-10 border-b border-border/50">
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest">Month Name</span>
                                <span className="text-xl font-black italic tracking-tighter text-indigo-600 dark:text-indigo-400 uppercase">{month.name}</span>
                            </div>
                            <div className="flex flex-col border-l border-border/50 pl-8">
                                <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest">Total Qty</span>
                                <span className="text-[13px] font-black uppercase tracking-tight text-text-primary tabular-nums">
                                    {parseInt(month.totalQtyF)}.{parseInt(month.totalQtyP)}
                                </span>
                            </div>
                        </div>
                        <div className="px-6 py-2 rounded-sm">
                            <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest block mb-0.5">Total Amount</span>
                            <span className="text-xl font-black tabular-nums tracking-tighter text-text-primary">{formatCurrency(month.totalAmount)}</span>
                        </div>
                    </div>

                    {/* Details Table */}
                    <div className="border-x border-b border-border/50 shadow-sm overflow-hidden rounded-b-sm bg-surface-0">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-1/80 border-b border-border/30">
                                    <th className="py-3 px-6 text-left text-[9px] font-black text-text-muted uppercase tracking-widest w-[250px]">Account Description</th>
                                    <th className="py-3 px-4 text-left text-[9px] font-black text-text-muted uppercase tracking-widest">Item Description</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black text-text-muted uppercase tracking-widest w-[120px]">Qty</th>
                                    <th className="py-3 px-6 text-right text-[9px] font-black text-text-muted uppercase tracking-widest w-[150px]">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(month.accounts).map(([accountName, items]: [string, any], aIdx) => (
                                    <React.Fragment key={accountName}>
                                        {items.map((item: any, iIdx: number) => (
                                            <tr key={iIdx} className="border-b border-border/10 hover:bg-surface-1/50 transition-colors group/row">
                                                {iIdx === 0 && (
                                                    <td rowSpan={items.length} className="py-3 px-6 text-[11px] font-black text-text-primary uppercase tracking-tight border-r border-border/10 align-top bg-surface-1/20">
                                                        {accountName}
                                                    </td>
                                                )}
                                                <td className="py-2.5 px-4">
                                                    <span className="text-[11px] font-bold text-text-muted group-hover/row:text-text-primary uppercase tracking-tight">{item.item}</span>
                                                </td>
                                                <td className="py-2.5 px-4 text-center text-[11px] font-black text-text-primary tabular-nums">
                                                    {parseInt(item.qtyF)}.{parseInt(item.qtyP)}
                                                </td>
                                                <td className="py-2.5 px-6 text-right text-[11px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                    {formatCurrency(Number(item.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
