import React, { useMemo } from 'react';
import { 
    TableBody, 
    TableCell, 
    TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { 
    FileText,
    Scale,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentDetail {
    id: number;
    voucher_no: string;
    date: string;
    party_name: string;
    bank_name: string;
    amount: number;
    balance: number;
    remarks: string;
}

interface PaymentDetailReportViewProps {
    data: PaymentDetail[];
}

export function PaymentDetailReportView({ data }: PaymentDetailReportViewProps) {
    const totalAmount = useMemo(() => {
        return data.reduce((s, i) => s + i.amount, 0);
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-1/30 rounded-3xl border border-border/50">
                <Layers className="h-10 w-10 text-text-muted/20 mb-4" />
                <h3 className="text-sm font-display font-black text-text-muted uppercase tracking-widest">No Intelligence Data</h3>
            </div>
        );
    }

    return (
        <div className="relative -mt-6">
            <div className="overflow-hidden bg-card border border-border shadow-sm rounded-xl flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-separate border-spacing-0 p-0 m-0">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-gradient-to-r from-surface-4/95 to-surface-3/95 backdrop-blur-2xl border-b border-border/40 hover:bg-surface-4 h-9">
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white pl-6 m-0 border-b border-border/40 text-left align-middle h-9">Code</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-left align-middle h-9">Payment Date</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-left align-middle h-9">Account Title</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-left align-middle h-9">Bank</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-right align-middle h-9">Amount</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-right align-middle h-9">Balance</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white pr-6 m-0 border-b border-border/40 text-left align-middle h-9">Remarks</th>
                            </tr>
                        </thead>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={item.id} className={cn(
                                    "group transition-colors border-b border-border/5 last:border-none",
                                    index % 2 === 0 ? "bg-card" : "bg-surface-1/30"
                                )}>
                                    <TableCell className="pl-6 py-1.5">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-text-muted/40" />
                                            <span className="text-[11px] font-mono-jet font-black text-text-primary tracking-tight">
                                                {item.voucher_no}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-1.5 px-2">
                                        <span className="text-[10px] font-bold text-text-muted tracking-tight">
                                            {format(new Date(item.date), 'dd MMM yy')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-1.5 px-2">
                                        <span className="text-[11px] font-display font-black text-text-primary uppercase">
                                            {item.party_name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-1.5 px-2">
                                        <span className="text-[10px] font-bold text-indigo-500/80 uppercase">
                                            {item.bank_name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-1.5 px-2 text-[11px] font-mono-jet font-black text-text-primary">
                                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right py-1.5 px-2 text-[11px] font-mono-jet font-bold text-text-muted">
                                        {item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="pr-6 py-1.5 px-2 text-[10px] font-bold text-text-muted italic">
                                        {item.remarks}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </table>
                </div>
            </div>

            {/* Premium Intelligence Footer */}
            <div className="bg-surface-4 dark:bg-surface-3 p-4 px-8 mt-3 rounded-xl flex items-center justify-between border-b-2 border-indigo-500/30 shadow-sm">
                <div className="flex items-center gap-6">
                    <Scale className="h-5 w-5 text-indigo-400" />
                    <div>
                        <h5 className="text-[8px] font-display font-black text-text-muted uppercase tracking-[0.3em]">Payment Consolidation</h5>
                        <p className="text-sm font-display font-black text-text-primary tracking-widest uppercase">Transaction Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-display font-black text-text-muted uppercase tracking-widest mb-1">Total Distributed Volume</span>
                        <p className="text-base font-mono-jet font-black tracking-tighter text-text-primary">
                            <span className="text-[10px] font-medium opacity-30 mr-1.5 font-sans">PKR</span>
                            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
