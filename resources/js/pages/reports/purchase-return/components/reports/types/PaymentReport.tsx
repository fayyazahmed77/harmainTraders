import React from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';

export const PaymentReport = ({ data, formatCurrency }: { data: any[], formatCurrency: (v: number) => string }) => {
    const totals = data.reduce((acc, row) => ({
        amount: acc.amount + Number(row.total_amount || 0),
        paid: acc.paid + Number(row.paid_amount || 0),
        balance: acc.balance + Number(row.balance || 0),
    }), { amount: 0, paid: 0, balance: 0 });

    return (
        <>
            <TableHeader className="bg-surface-1/50">
                <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Invoice #</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted">Supplier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Net Return</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Refund Recv</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-muted text-right">Pending Credit</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, i) => (
                    <TableRow key={i} className="border-border/40 group hover:bg-rose-500/5">
                        <TableCell className="text-[10px] font-bold text-text-secondary">{row.date}</TableCell>
                        <TableCell className="text-[10px] font-black text-rose-600 dark:text-rose-400">{row.invoice}</TableCell>
                        <TableCell className="text-[10px] font-bold text-text-primary uppercase">{row.account_name}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums">{formatCurrency(row.total_amount)}</TableCell>
                        <TableCell className="text-[10px] font-bold text-right tabular-nums text-emerald-500">{formatCurrency(row.paid_amount)}</TableCell>
                        <TableCell className="text-[11px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400">{formatCurrency(row.balance)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter className="bg-surface-1/50 border-t-2 border-border/60">
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-[10px] font-black uppercase text-text-primary">Aggregate Credit Settlement</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums">{formatCurrency(totals.amount)}</TableCell>
                    <TableCell className="text-[11px] font-black text-right tabular-nums text-emerald-500">{formatCurrency(totals.paid)}</TableCell>
                    <TableCell className="text-[12px] font-black text-right tabular-nums text-rose-600 dark:text-rose-400 bg-rose-500/5">{formatCurrency(totals.balance)}</TableCell>
                </TableRow>
            </TableFooter>
        </>
    );
};
