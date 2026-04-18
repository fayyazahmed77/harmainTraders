import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
    Calendar, 
    FileText, 
    ArrowUpRight, 
    ArrowDownRight, 
    Clock, 
    ShieldCheck, 
    AlertCircle, 
    Activity,
    Layers,
    UserCircle2,
    TrendingUp,
    TrendingDown,
    Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutstandingBill {
    date: string;
    voucher_no: string;
    bill_type: 'receivable' | 'payable';
    party_name: string;
    party_id: number;
    due_date: string;
    days: number;
    bill_amt: number;
    paid: number;
    remaining: number;
    balance: number;
    credit_days: number;
    credit_limit: number;
    is_last_for_party?: boolean;
    party_summary?: {
        party_un_due_amount: number;
        party_due_amount: number;
        credit_days: number;
        credit_limit: number;
        party_type: 'receivable' | 'payable';
    };
}

interface OutstandingBillWiseViewProps {
    data: OutstandingBill[];
}

export function OutstandingBillWiseView({ data }: OutstandingBillWiseViewProps) {
    const stats = useMemo(() => {
        const receivable = data.filter(i => i.bill_type === 'receivable').reduce((s, i) => s + i.remaining, 0);
        const payable = data.filter(i => i.bill_type === 'payable').reduce((s, i) => s + i.remaining, 0);
        return { receivable, payable, net: receivable - payable };
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
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white pl-6 m-0 border-b border-border/40 text-left align-middle h-9">Timeline</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-left align-middle h-9">Voucher</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-left align-middle h-9">Maturity</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-center align-middle h-9">Aging Index</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-right align-middle h-9">Bill Amt</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-center align-middle h-9">
                                    <Badge variant="outline" className="text-[7px] font-black border-indigo-500/30 text-indigo-400 bg-indigo-500/5 px-1 tracking-widest">Settled</Badge>
                                </th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-right align-middle h-9">Outstanding</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white pr-6 m-0 border-b border-border/40 text-right align-middle h-9">Balance</th>
                            </tr>
                        </thead>
                        <TableBody>
                            {data.map((item, index) => {
                                const isReceivable = item.bill_type === 'receivable';
                                const isNewParty = index === 0 || data[index-1].party_id !== item.party_id;
                                
                                return (
                                    <React.Fragment key={`${item.party_id}-${item.voucher_no}-${index}`}>
                                        {/* Sticky Party intelligence Row */}
                                        {isNewParty && (
                                            <TableRow className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur-md border-y border-border/40 group/header">
                                                <TableCell colSpan={8} className="py-2.5 px-6">
                                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-8 w-8 rounded-lg flex items-center justify-center shadow-md",
                                                                isReceivable ? "bg-indigo-600" : "bg-amber-600"
                                                            )}>
                                                                <UserCircle2 className="h-4.5 w-4.5 text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-display font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                                                                    {item.party_name}
                                                                    <Badge className={cn(
                                                                        "h-3.5 px-1.5 text-[8px] font-black uppercase tracking-widest border-none",
                                                                        isReceivable ? "bg-indigo-500/10 text-indigo-500" : "bg-amber-500/10 text-amber-500"
                                                                    )}>
                                                                        {isReceivable ? 'Receivable' : 'Payable'}
                                                                    </Badge>
                                                                </h4>
                                                                <span className="text-[10px] font-bold text-text-muted flex items-center gap-1.5 mt-0.5">
                                                                 <Activity className="h-3 w-3" /> Professional Entity ID: {item.party_id}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Compact Stats Row */}
                                                        {item.party_summary && (
                                                            <div className="flex items-center gap-6">
                                                                {[
                                                                    { label: 'Un Due', val: item.party_summary.party_un_due_amount, icon: Clock, color: 'text-text-primary' },
                                                                    { label: 'Critical Due', val: item.party_summary.party_due_amount, icon: AlertCircle, color: 'text-rose-500' },
                                                                    { label: 'Cr. Limit', val: item.party_summary.credit_limit, icon: ShieldCheck, color: 'text-indigo-500' },
                                                                    { label: 'Health', val: item.party_summary.credit_days, icon: Activity, color: 'text-emerald-500', suffix: ' Days' }
                                                                ].map((stat, sIdx) => (
                                                                    <div key={sIdx} className="flex flex-col items-end">
                                                                        <span className="text-[8px] font-display font-black text-text-muted uppercase tracking-widest mb-0.5">{stat.label}</span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <stat.icon className={cn("h-3 w-3 opacity-60", stat.color)} />
                                                                            <span className={cn("text-[10px] font-mono-jet font-black tracking-tighter", stat.color)}>
                                                                                {stat.val.toLocaleString()}{stat.suffix}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {/* High-Density Row */}
                                        <TableRow className={cn(
                                            "group transition-colors border-b border-border/5 last:border-none",
                                            isReceivable ? "hover:bg-indigo-500/5" : "hover:bg-amber-500/5",
                                            index % 2 === 0 ? "bg-card" : "bg-surface-1/30"
                                        )}>
                                            <TableCell className="pl-6 py-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-4 border-l-2",
                                                        isReceivable ? "border-indigo-500" : "border-amber-500"
                                                    )} />
                                                    <span className="text-[10px] font-bold text-text-muted">{format(new Date(item.date), 'dd/MM/yy')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-3 w-3 text-text-muted/40" />
                                                    <span className="text-[11px] font-mono-jet font-black text-text-primary tracking-tight">
                                                        {item.voucher_no}
                                                        {isReceivable ? <ArrowUpRight className="inline-block h-3 w-3 ml-1 text-indigo-400 opacity-0 group-hover:opacity-100" /> : <ArrowDownRight className="inline-block h-3 w-3 ml-1 text-amber-400 opacity-0 group-hover:opacity-100" />}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[11px] font-bold text-text-muted">
                                                {format(new Date(item.due_date), 'dd/MM/yy')}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "text-[10px] font-black tracking-tight px-2 py-0.5 rounded-full border",
                                                        item.days > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    )}>
                                                        {item.days > 0 ? `${item.days} Ovr` : `${Math.abs(item.days)} Gr`}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-[11px] font-mono-jet font-bold text-text-secondary">
                                                {item.bill_amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right text-[11px] font-mono-jet font-bold text-emerald-500/80">
                                                {item.paid > 0 ? item.paid.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-[11px] font-mono-jet font-black text-text-primary">
                                                {item.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                               <span className={cn(
                                                   "text-[11px] font-mono-jet font-black px-1.5 py-0.5 rounded-sm",
                                                   isReceivable ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                               )}>
                                                   {item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                               </span>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </table>
                </div>
            </div>

            {/* Slim Stealth intelligence Footer */}
            <div className="bg-surface-4 dark:bg-surface-3 p-4 px-8 mt-3 rounded-xl flex items-center justify-between border-b-2 border-indigo-500/30 shadow-sm">
                <div className="flex items-center gap-6">
                    <Scale className="h-5 w-5 text-indigo-400" />
                    <div>
                        <h5 className="text-[8px] font-display font-black text-text-muted uppercase tracking-[0.3em]">Net Portfolio Position</h5>
                        <p className="text-sm font-display font-black text-text-primary tracking-widest uppercase">Financial Intelligence Consolidation</p>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    {[
                        { label: 'Receivables', val: stats.receivable, color: 'text-emerald-500' },
                        { label: 'Payables', val: stats.payable, color: 'text-amber-500' },
                        { label: 'Liquidity Position', val: stats.net, color: stats.net >= 0 ? 'text-indigo-500' : 'text-rose-500', bold: true }
                    ].map((s, idx) => (
                        <div key={idx} className="flex flex-col items-end">
                            <span className="text-[8px] font-display font-black text-text-muted uppercase tracking-widest mb-1">{s.label}</span>
                            <p className={cn("text-base font-mono-jet font-black tracking-tighter", s.color)}>
                                <span className="text-[10px] font-medium opacity-30 mr-1.5 font-sans">PKR</span>
                                {s.val.toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
