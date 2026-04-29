import React from 'react';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MonthReport = ({ data, formatCurrency }: any) => {
    // Group data by month
    const groupedData = data.reduce((acc: any, row: any) => {
        if (!acc[row.month_key]) {
            acc[row.month_key] = {
                name: row.month_name,
                accounts: [],
                totals: { amount: 0, discount: 0, tax: 0, net: 0, paid: 0, balance: 0 }
            };
        }
        acc[row.month_key].accounts.push(row);
        acc[row.month_key].totals.amount += Number(row.gross_amount) || 0;
        acc[row.month_key].totals.discount += Number(row.discount_amount) || 0;
        acc[row.month_key].totals.tax += Number(row.tax_amount) || 0;
        acc[row.month_key].totals.net += Number(row.total_amount) || 0;
        acc[row.month_key].totals.paid += Number(row.paid_amount) || 0;
        acc[row.month_key].totals.balance += Number(row.balance) || 0;
        return acc;
    }, {});

    const months: any[] = Object.values(groupedData);

    return (
        <>
            <TableHeader>
                <TableRow className="bg-surface-1/50 border-b border-border/50">
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted w-[50px]">S.#</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted">Account</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Amount</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Discount</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Tax</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Total</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right text-emerald-500">Paid</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest text-text-muted text-right text-rose-500">Balance</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {months.map((month: any, mIdx: number) => (
                    <React.Fragment key={mIdx}>
                        {/* Month Header Row */}
                        <TableRow className="bg-surface-2/40 border-y-2 border-border/30">
                            <TableCell colSpan={8} className="py-2 text-center">
                                <span className="text-[11px] font-black uppercase tracking-[3px] text-emerald-500">{month.name}</span>
                            </TableCell>
                        </TableRow>

                        {/* Account Rows */}
                        {month.accounts.map((row: any, aIdx: number) => (
                            <TableRow key={aIdx} className="border-b border-border/5 hover:bg-emerald-500/5 transition-colors text-[10px]">
                                <TableCell className="py-1.5 font-bold text-text-muted pl-4">{aIdx + 1}</TableCell>
                                <TableCell className="py-1.5 font-bold text-text-primary uppercase">{row.account_name}</TableCell>
                                <TableCell className="py-1.5 font-bold text-right tabular-nums text-text-secondary">{formatCurrency(row.gross_amount)}</TableCell>
                                <TableCell className="py-1.5 font-bold text-right tabular-nums text-rose-500">{formatCurrency(row.discount_amount)}</TableCell>
                                <TableCell className="py-1.5 font-bold text-right tabular-nums text-amber-500">{formatCurrency(row.tax_amount)}</TableCell>
                                <TableCell className="py-1.5 font-black text-right tabular-nums text-text-primary">{formatCurrency(row.total_amount)}</TableCell>
                                <TableCell className="py-1.5 font-black text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(row.paid_amount)}</TableCell>
                                <TableCell className="py-1.5 font-black text-right tabular-nums text-rose-600 dark:text-rose-400">{formatCurrency(row.balance)}</TableCell>
                            </TableRow>
                        ))}

                        {/* Month Summary Footer */}
                        <TableRow className="bg-surface-1/20 font-black">
                            <TableCell colSpan={2} className="py-2 text-[9px] font-black uppercase text-center">{month.name} Totals</TableCell>
                            <TableCell className="py-2 text-right tabular-nums text-text-secondary">{formatCurrency(month.totals.amount)}</TableCell>
                            <TableCell className="py-2 text-right tabular-nums text-rose-500">{formatCurrency(month.totals.discount)}</TableCell>
                            <TableCell className="py-2 text-right tabular-nums text-amber-500">{formatCurrency(month.totals.tax)}</TableCell>
                            <TableCell className="py-2 text-right tabular-nums text-text-primary font-black">{formatCurrency(month.totals.net)}</TableCell>
                            <TableCell className="py-2 text-right tabular-nums text-emerald-600">{formatCurrency(month.totals.paid)}</TableCell>
                            <TableCell className="py-2 text-right tabular-nums text-rose-600">{formatCurrency(month.totals.balance)}</TableCell>
                        </TableRow>
                        <TableRow className="h-6" />
                    </React.Fragment>
                ))}
            </TableBody>
        </>
    );
};

export default MonthReport;
