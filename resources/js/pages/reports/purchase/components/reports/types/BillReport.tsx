import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSafeDate } from '@/lib/utils';

const BillReport = ({ data, formatCurrency }: any) => {
    const totals = data.reduce((acc: any, row: any) => ({
        gross: acc.gross + (Number(row.gross) || 0),
        discount: acc.discount + (Number(row.discount) || 0),
        net: acc.net + (Number(row.amount) || 0),
        paid: acc.paid + (Number(row.paid_amount) || 0),
    }), { gross: 0, discount: 0, net: 0, paid: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b border-border/50">
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted w-[50px]">S.#</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted">Inv #</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted">Date</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted">Account</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Gross</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Discount</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Net Amount</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Cash Paid</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row: any, index: number) => (
                    <TableRow key={index} className="border-b border-border/10 hover:bg-emerald-500/5 transition-colors">
                        <TableCell className="py-2 text-[10px] font-bold text-text-muted">{index + 1}</TableCell>
                        <TableCell className="py-2 text-[10px] font-black text-emerald-500 uppercase">{row.invoice}</TableCell>
                        <TableCell className="py-2 text-[10px] font-bold text-text-muted whitespace-nowrap">
                            {formatSafeDate(row.date, 'dd-MMM-yy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="py-2 text-[10px] font-bold text-text-primary uppercase">{row.account_name}</TableCell>
                        <TableCell className="py-2 text-[10px] font-bold text-right tabular-nums text-text-secondary">{row.gross > 0 ? formatCurrency(row.gross) : ''}</TableCell>
                        <TableCell className="py-2 text-[10px] font-bold text-right tabular-nums text-rose-500">{row.discount != 0 ? formatCurrency(row.discount) : ''}</TableCell>
                        <TableCell className="py-2 text-[10px] font-black text-right tabular-nums text-emerald-600 dark:text-emerald-400">{row.amount > 0 ? formatCurrency(row.amount) : ''}</TableCell>
                        <TableCell className="py-2 text-[10px] font-bold text-right tabular-nums text-blue-500">{row.paid_amount > 0 ? formatCurrency(row.paid_amount) : ''}</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/30 font-black border-t-2 border-border/50">
                    <TableCell colSpan={4} className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Grand Totals</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-text-secondary">{formatCurrency(totals.gross)}</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-rose-500">{formatCurrency(totals.discount)}</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-emerald-500">{formatCurrency(totals.net)}</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-blue-500">{formatCurrency(totals.paid)}</TableCell>
                </TableRow>
            </TableBody>
        </>
    );
};

export default BillReport;
