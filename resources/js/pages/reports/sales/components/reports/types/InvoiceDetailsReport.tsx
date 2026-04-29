import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
    data: any[];
    formatCurrency: (val: number) => string;
}

export default function InvoiceDetailsReport({ data, formatCurrency }: Props) {
    if (!data.length) return null;

    // Group items by invoice (sale_id)
    const invoices = data.reduce((acc: any, row: any) => {
        const invId = row.sale_id;
        if (!acc[invId]) {
            acc[invId] = {
                id: invId,
                invNo: row.inv_no,
                invDate: row.inv_date,
                account: row.account_title,
                totalAmount: row.inv_amount,
                items: []
            };
        }
        acc[invId].items.push(row);
        return acc;
    }, {});

    const sortedInvoices = Object.values(invoices).sort((a: any, b: any) => b.id - a.id);

    return (
        <div className="space-y-3 pb-4">
            {sortedInvoices.map((inv: any, idx: number) => (
                <div key={inv.id} className="relative group/inv">
                    {/* Invoice Header Block */}
                    <div className="bg-surface-2 text-text-primary p-2 rounded-t-sm flex flex-wrap items-center justify-between gap-6 shadow-sm relative z-10 border-b border-border/50">
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest">Invoice Number</span>
                                <span className="text-xl font-black italic tracking-tighter text-indigo-600 dark:text-indigo-400">{inv.invNo}</span>
                            </div>
                            <div className="flex flex-col border-l border-border/50 pl-8">
                                <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest">Invoice Date</span>
                                <span className="text-[13px] font-black uppercase tracking-tight text-text-primary">
                                    {(() => {
                                        try {
                                            const d = new Date(inv.invDate);
                                            return !isNaN(d.getTime()) ? format(d, 'dd-MMMM-yyyy') : 'N/A';
                                        } catch (e) {
                                            return 'N/A';
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="flex flex-col border-l border-border/50 pl-8">
                                <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest">Account Title</span>
                                <span className="text-[13px] font-black uppercase text-text-primary tracking-tight">{inv.account}</span>
                            </div>
                        </div>
                        <div className=" px-6 py-2 rounded-sm">
                            <span className="text-[9px] font-black text-text-muted/60  uppercase tracking-widest block mb-0.5">Inv Amount</span>
                            <span className="text-xl font-black tabular-nums tracking-tighter">{formatCurrency(inv.totalAmount)}</span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border-x border-b border-border/50 shadow-sm overflow-hidden rounded-b-sm bg-surface-0">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-1/80 border-b border-border/30">
                                    <th className="py-3 px-6 text-left text-[9px] font-black text-text-muted uppercase tracking-widest w-[50px]">S.#</th>
                                    <th className="py-3 px-4 text-left text-[9px] font-black text-text-muted uppercase tracking-widest">Item Description</th>
                                    <th className="py-3 px-4 text-right text-[9px] font-black text-text-muted uppercase tracking-widest">Trade Price</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black text-text-muted uppercase tracking-widest">Qty F</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black text-text-muted uppercase tracking-widest">Qty P</th>
                                    <th className="py-3 px-4 text-right text-[9px] font-black text-text-muted uppercase tracking-widest">Rate</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black text-text-muted uppercase tracking-widest">B.F.</th>
                                    <th className="py-3 px-4 text-center text-[9px] font-black text-text-muted uppercase tracking-widest">B.P.</th>
                                    <th className="py-3 px-4 text-right text-[9px] font-black text-text-muted uppercase tracking-widest">Disc</th>
                                    <th className="py-3 px-4 text-right text-[9px] font-black text-text-muted uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inv.items.map((item: any, iIdx: number) => (
                                    <tr key={iIdx} className="border-b border-border/10 hover:bg-surface-1/50 transition-colors group/row">
                                        <td className="py-2.5 px-6 text-[10px] font-bold text-text-muted/40 group-hover/row:text-text-primary tabular-nums">{iIdx + 1}</td>
                                        <td className="py-2.5 px-4">
                                            <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight">{item.item_name}</span>
                                        </td>
                                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-text-muted tabular-nums">{formatCurrency(item.trade_price)}</td>
                                        <td className="py-2.5 px-4 text-center text-[11px] font-black text-text-primary tabular-nums">{item.qty_full}</td>
                                        <td className="py-2.5 px-4 text-center text-[11px] font-black text-text-primary tabular-nums">{item.qty_pcs}</td>
                                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-text-muted tabular-nums">{formatCurrency(item.rate)}</td>
                                        <td className="py-2.5 px-4 text-center text-[11px] font-black text-text-muted/40 tabular-nums">{item.bonus_full}</td>
                                        <td className="py-2.5 px-4 text-center text-[11px] font-black text-text-muted/40 tabular-nums">{item.bonus_pcs}</td>
                                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-rose-500/60 tabular-nums">{formatCurrency(item.disc_1)}</td>
                                        <td className="py-2.5 px-4 text-right text-[11px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{formatCurrency(item.amount)}</td>
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
