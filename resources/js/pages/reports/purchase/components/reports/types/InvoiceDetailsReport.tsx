import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

const InvoiceDetailsReport = ({ data, formatCurrency }: any) => {
    // Group data by invoice
    const groupedData = data.reduce((acc: any, row: any) => {
        if (!acc[row.invoice]) {
            acc[row.invoice] = {
                invoice: row.invoice,
                date: row.date,
                account_name: row.account_name,
                items: [],
                total_amount: 0
            };
        }
        acc[row.invoice].items.push(row);
        acc[row.invoice].total_amount += Number(row.amount) || 0;
        return acc;
    }, {});

    const invoices: any[] = Object.values(groupedData);
    const grandTotal = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b border-border/50">
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted w-[40px]">S.#</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Item Details</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">T.P.</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Qty F</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Qty P</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Rate</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">B.Full</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">B.Pcs</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Disc</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Tax</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((inv: any, invIdx: number) => (
                    <React.Fragment key={inv.invoice}>
                        {/* Invoice Header Row */}
                        <TableRow className="bg-surface-2/40 border-y-2 border-border/30">
                            <TableCell className="py-2 text-[10px] font-black text-text-muted">#{invIdx + 1}</TableCell>
                            <TableCell colSpan={9} className="py-2">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase text-text-muted">Inv:</span>
                                        <span className="text-[10px] font-black text-emerald-500">{inv.invoice}</span>
                                    </div>
                                    <div className="flex items-center gap-2 border-l border-border/50 pl-6">
                                        <span className="text-[9px] font-black uppercase text-text-muted">Date:</span>
                                        <span className="text-[10px] font-bold text-text-secondary">{format(new Date(inv.date), 'dd MMM yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 border-l border-border/50 pl-6">
                                        <span className="text-[9px] font-black uppercase text-text-muted">Supplier:</span>
                                        <span className="text-[10px] font-black text-text-primary uppercase">{inv.account_name}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-2 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black uppercase text-text-muted leading-none mb-1">Invoice Total</span>
                                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(inv.total_amount)}</span>
                                </div>
                            </TableCell>
                        </TableRow>

                        {/* Item Rows */}
                        {inv.items.map((row: any, rowIdx: number) => (
                            <TableRow key={rowIdx} className="border-b border-border/5 hover:bg-emerald-500/5 transition-colors group text-[10px]">
                                <TableCell className="py-1.5 font-bold text-text-muted pl-6">{rowIdx + 1}</TableCell>
                                <TableCell className="py-1.5 font-bold text-text-primary uppercase">{row.product_name}</TableCell>
                                <TableCell className="py-1.5 font-bold text-center tabular-nums text-text-muted">{formatCurrency(row.tp)}</TableCell>
                                <TableCell className="py-1.5 font-black text-center tabular-nums text-blue-500">{row.qty_full > 0 ? row.qty_full : '0'}</TableCell>
                                <TableCell className="py-1.5 font-black text-center tabular-nums text-blue-400">{row.qty_pcs > 0 ? row.qty_pcs : '0'}</TableCell>
                                <TableCell className="py-1.5 font-bold text-center tabular-nums text-text-primary">{formatCurrency(row.rate)}</TableCell>
                                <TableCell className="py-1.5 font-bold text-center tabular-nums text-rose-500">{row.b_full > 0 ? row.b_full : '0'}</TableCell>
                                <TableCell className="py-1.5 font-bold text-center tabular-nums text-rose-500">{row.b_pcs > 0 ? row.b_pcs : '0'}</TableCell>
                                <TableCell className="py-1.5 font-bold text-center tabular-nums text-rose-500">{row.disc_1 > 0 ? formatCurrency(row.disc_1) : '0.00'}</TableCell>
                                <TableCell className="py-1.5 font-bold text-center tabular-nums text-amber-500">{row.tax_amt > 0 ? formatCurrency(row.tax_amt) : '0'}</TableCell>
                                <TableCell className="py-1.5 font-black text-right tabular-nums text-text-secondary">{formatCurrency(row.amount)}</TableCell>
                            </TableRow>
                        ))}
                        {/* Spacer Row */}
                        <TableRow className="h-4 bg-surface-1/5" />
                    </React.Fragment>
                ))}

                {/* Grand Totals */}
                <TableRow className="bg-surface-1/30 font-black border-t-2 border-border/50">
                    <TableCell colSpan={10} className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Grand Total (All Invoices)</TableCell>
                    <TableCell className="py-3 text-[12px] font-black text-right tabular-nums text-emerald-500">{formatCurrency(grandTotal)}</TableCell>
                </TableRow>
            </TableBody>
        </>
    );
};

export default InvoiceDetailsReport;
