import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

const PaymentReport = ({ data, formatCurrency }: any) => {
    const totals = data.reduce((acc: any, row: any) => ({
        purchase: acc.purchase + (Number(row.total_purchase) || 0),
        payment: acc.payment + (Number(row.total_payment) || 0),
        balance: acc.balance + (Number(row.balance) || 0),
    }), { purchase: 0, payment: 0, balance: 0 });

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b border-border/50">
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted w-[50px]">S.#</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Area</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Account</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Contact</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Purchases</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Payment</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Balance</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row: any, index: number) => (
                    <TableRow key={index} className="border-b border-border/10 hover:bg-emerald-500/5 transition-colors text-[10px]">
                        <TableCell className="py-1.5 font-bold text-text-muted">{index + 1}</TableCell>
                        <TableCell className="py-1.5 font-bold text-text-muted uppercase">{row.area_name || '---'}</TableCell>
                        <TableCell className="py-1.5 font-bold text-text-primary uppercase">{row.account_name}</TableCell>
                        <TableCell className="py-1.5 font-bold text-text-secondary tabular-nums">{row.contact || '---'}</TableCell>
                        <TableCell className="py-1.5 font-bold text-right tabular-nums text-text-secondary">{formatCurrency(row.total_purchase)}</TableCell>
                        <TableCell className="py-1.5 font-black text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(row.total_payment)}</TableCell>
                        <TableCell className="py-1.5 font-black text-right tabular-nums text-rose-600 dark:text-rose-400">{formatCurrency(row.balance)}</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-surface-1/30 font-black border-t-2 border-border/50">
                    <TableCell colSpan={4} className="py-3 text-[10px] font-black uppercase tracking-widest text-center">Grand Totals</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-text-secondary">{formatCurrency(totals.purchase)}</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-emerald-500">{formatCurrency(totals.payment)}</TableCell>
                    <TableCell className="py-3 text-[11px] font-black text-right tabular-nums text-rose-500">{formatCurrency(totals.balance)}</TableCell>
                </TableRow>
            </TableBody>
        </>
    );
};

export default PaymentReport;
