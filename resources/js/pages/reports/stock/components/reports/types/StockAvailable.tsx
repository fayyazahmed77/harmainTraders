import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
    data: any[];
    formatCurrency: (amount: number) => string;
    params: any;
}

export default function StockAvailable({ data, formatCurrency, params }: Props) {
    if (!data.length) return null;

    const totals = data.reduce((acc, row) => ({
        balance: acc.balance + Number(row.balance_qty || 0),
        amount: acc.amount + Number(row.amount || 0),
        full: acc.full + Number(row.full_qty || 0),
        pcs: acc.pcs + Number(row.pcs_qty || 0),
    }), { balance: 0, amount: 0, full: 0, pcs: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b-2 border-text-primary hover:bg-surface-1/50">
                    <TableHead className="py-4 px-6 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic w-[60px]">S.#</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic min-w-[200px]">Item & Company</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Profile</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">T.P</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Retail</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">L.P.P</TableHead>
                    <TableHead className="py-4 px-4 text-left text-[10px] font-black text-text-primary uppercase tracking-widest italic">Last Supplier</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Full</TableHead>
                    <TableHead className="py-4 px-4 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">PCS</TableHead>
                    <TableHead className="py-4 px-6 text-right text-[10px] font-black text-text-primary uppercase tracking-widest italic">Balance</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-border/10 hover:bg-surface-1/30 transition-all duration-200 group">
                        <TableCell className="py-4 px-6 text-[10px] font-black text-text-muted/40 uppercase italic group-hover:text-text-primary transition-colors">{idx + 1}</TableCell>
                        <TableCell className="py-4 px-4">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-text-primary uppercase italic tracking-tighter">
                                    {row.item_name}
                                </span>
                                <span className="text-[9px] font-bold text-text-muted/40 uppercase tracking-widest">
                                    {row.company_name}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                             <span className="text-[10px] font-black text-indigo-600/60 uppercase tracking-widest bg-indigo-600/5 px-2 py-1 rounded-none border border-indigo-600/10">
                                {row.item_type || 'N/A'}
                             </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-bold text-text-muted text-[11px] tabular-nums">
                            {formatCurrency(Number(row.rate))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-bold text-text-muted text-[11px] tabular-nums">
                            {formatCurrency(Number(row.retail || 0))}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-bold text-emerald-600 text-[11px] tabular-nums">
                            {formatCurrency(Number(row.last_purchase_price || 0))}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-[10px] font-bold text-text-muted/60 uppercase truncate block max-w-[150px]">
                                {row.last_supplier_name}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">
                            {row.full_qty}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right font-black text-text-primary text-[11px] tabular-nums">
                            {row.pcs_qty}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right font-black text-emerald-600 text-[12px] tabular-nums">
                            {Number(row.balance_qty).toLocaleString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <tfoot className="bg-surface-1/80 border-t-2 border-border/50 font-black">
                <TableRow>
                    <TableCell colSpan={7} className="py-4 px-6 text-right text-[10px] uppercase tracking-widest text-text-muted">
                        Inventory Matrix Totals
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[11px] text-text-primary tabular-nums">
                        {totals.full.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right text-[11px] text-text-primary tabular-nums">
                        {totals.pcs.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right text-[12px] text-emerald-600 tabular-nums">
                        {totals.balance.toLocaleString()}
                    </TableCell>
                </TableRow>
            </tfoot>
        </>
    );
}
