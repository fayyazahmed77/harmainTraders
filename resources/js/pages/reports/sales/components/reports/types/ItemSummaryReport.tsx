import React from 'react';
import { cn } from '@/lib/utils';

interface HistoryItem {
    invoice: string;
    date: string;
    customer_name: string;
    qty_full: number | string;
    qty_pcs: number | string;
    tp: number;
    amount: number;
}

interface ReportRow {
    item_description: string;
    packing: string;
    qty_full: number | string;
    qty_pcs: number | string;
    gross_amount: number;
    disc_amt: number;
    net_amount: number;
    history?: HistoryItem[];
}

interface Props {
    data: ReportRow[];
    formatCurrency: (val: number) => string;
}

export default function ItemSummaryReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    const historyRow = data.find(row => row.history && row.history.length > 0);
    const historyData = historyRow ? historyRow.history : null;

    return (
        <div className="space-y-8 pb-10">
            <div className="border border-border rounded-sm overflow-hidden bg-surface-0 shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="bg-surface-2 text-text-primary border-b border-border/50">
                            <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest w-[60px]">S.#</th>
                            <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest">Item Description</th>
                            <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest w-[80px]">Packing</th>
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
                                    <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight">{row.item_description}</span>
                                </td>
                                <td className="py-3 px-4 text-center text-[11px] font-bold text-text-muted uppercase tracking-tight">{row.packing}</td>
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
                            <td colSpan={3} className="py-4 px-6 text-right text-[10px] text-text-muted uppercase tracking-widest">Total Volumes</td>
                            <td className="py-4 px-4 text-center text-[12px] text-text-primary tabular-nums">{data.reduce((sum: number, r: ReportRow) => sum + Number(r.qty_full), 0)}</td>
                            <td className="py-4 px-4 text-center text-[12px] text-text-primary tabular-nums">{data.reduce((sum: number, r: ReportRow) => sum + Number(r.qty_pcs), 0)}</td>
                            <td className="py-4 px-4 text-right text-[12px] text-text-muted tabular-nums">{formatCurrency(data.reduce((sum: number, r: ReportRow) => sum + Number(r.gross_amount), 0))}</td>
                            <td className="py-4 px-4 text-right text-[12px] text-rose-500 tabular-nums">{formatCurrency(data.reduce((sum: number, r: ReportRow) => sum + Number(r.disc_amt), 0))}</td>
                            <td className="py-4 px-6 text-right text-[14px] text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(data.reduce((sum: number, r: ReportRow) => sum + Number(r.net_amount), 0))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {historyData && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-[2px] bg-indigo-600" />
                        <div>
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-tighter italic">Sales <span className="text-indigo-600">History</span></h3>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">Detailed transaction log for selected item</p>
                        </div>
                    </div>

                    <div className="border border-border rounded-sm overflow-hidden bg-surface-0 shadow-lg ring-1 ring-black/5">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-2 text-text-primary border-b border-border/50">
                                    <th className="py-3 px-6 text-left text-[9px] font-black uppercase tracking-[0.2em] w-[100px]">Inv.#</th>
                                    <th className="py-3 px-4 text-left text-[9px] font-black uppercase tracking-[0.2em] w-[100px]">Date</th>
                                    <th className="py-3 px-4 text-left text-[9px] font-black uppercase tracking-[0.2em]">Customer Name</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black uppercase tracking-[0.2em] w-[80px]">Full</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black uppercase tracking-[0.2em] w-[80px]">Pcs</th>
                                    <th className="py-3 px-4 text-right text-[9px] font-black uppercase tracking-[0.2em] w-[100px]">Rate</th>
                                    <th className="py-3 px-6 text-right text-[9px] font-black uppercase tracking-[0.2em] w-[120px]">Net Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyData.map((h, i) => (
                                    <tr key={i} className="border-b border-border/5 hover:bg-surface-1/30 transition-colors">
                                        <td className="py-2.5 px-6 text-[10px] font-black text-indigo-600 font-mono italic uppercase">{h.invoice}</td>
                                        <td className="py-2.5 px-4 text-[10px] font-bold text-text-muted tabular-nums">{h.date}</td>
                                        <td className="py-2.5 px-4 text-[10px] font-black text-text-primary uppercase tracking-tight">{h.customer_name}</td>
                                        <td className="py-2.5 px-4 text-center text-[10px] font-black text-text-primary tabular-nums">{h.qty_full}</td>
                                        <td className="py-2.5 px-4 text-center text-[10px] font-black text-text-primary tabular-nums">{h.qty_pcs}</td>
                                        <td className="py-2.5 px-4 text-right text-[10px] font-bold text-text-muted tabular-nums">{formatCurrency(h.tp)}</td>
                                        <td className="py-2.5 px-6 text-right">
                                            <span className="text-[11px] font-black text-text-primary tabular-nums">{formatCurrency(h.amount)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-surface-1/50 font-black border-t border-border">
                                    <td colSpan={3} className="py-3 px-6 text-right text-[9px] text-text-muted uppercase tracking-widest">Sub-Total Transactions</td>
                                    <td className="py-3 px-4 text-center text-[11px] text-text-primary tabular-nums">{historyData.reduce((sum: number, h: HistoryItem) => sum + Number(h.qty_full), 0)}</td>
                                    <td className="py-3 px-4 text-center text-[11px] text-text-primary tabular-nums">{historyData.reduce((sum: number, h: HistoryItem) => sum + Number(h.qty_pcs), 0)}</td>
                                    <td className="py-3 px-4" />
                                    <td className="py-3 px-6 text-right text-[12px] text-indigo-600 tabular-nums">{formatCurrency(historyData.reduce((sum: number, h: HistoryItem) => sum + Number(h.amount), 0))}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
