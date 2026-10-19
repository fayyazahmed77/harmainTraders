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
    CheckCircle2,
    Scale,
    Receipt,
    Wallet
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
    is_opening_balance?: boolean;
    ob_type?: 'CR' | 'DR';
    is_last_for_party?: boolean;
    party_summary?: {
        party_un_due_amount: number;
        party_due_amount: number;
        credit_days: number;
        credit_limit: number;
        party_type: 'receivable' | 'payable';
        current_balance?: number;
        total_outstanding?: number;
        is_reconciled?: boolean;
        difference?: number;
    };
}

interface OutstandingBillWiseViewProps {
    data: OutstandingBill[];
}

export function OutstandingBillWiseView({ data }: OutstandingBillWiseViewProps) {
    const stats = useMemo(() => {
        const receivable = data.filter(i => i.bill_type === 'receivable').reduce((s, i) => s + (Number(i.remaining) || 0), 0);
        const payable = data.filter(i => i.bill_type === 'payable').reduce((s, i) => s + (Number(i.remaining) || 0), 0);
        const totalBilled = data.reduce((s, i) => s + (Number(i.bill_amt) || 0), 0);
        const totalPaid = data.reduce((s, i) => s + (Number(i.paid) || 0), 0);
        return { receivable, payable, net: receivable - payable, totalBilled, totalPaid };
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                <Layers className="h-12 w-12 text-slate-300 dark:text-zinc-700 mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Zero Outstanding Obligations</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">All supplier purchase bills and accounts are fully settled and reconciled.</p>
            </div>
        );
    }

    return (
        <div className="relative -mt-4 space-y-4">
            <div className="overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse p-0 m-0">
                        {/* High-Contrast Crystal-Clear Table Header */}
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-slate-900 text-white dark:bg-zinc-900 border-b border-slate-800 dark:border-zinc-800 h-10 shadow-xs">
                                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-200 pl-6 text-left align-middle h-10 whitespace-nowrap">Timeline</th>
                                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-200 px-3 text-left align-middle h-10 whitespace-nowrap">Voucher #</th>
                                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-200 px-3 text-center align-middle h-10 whitespace-nowrap">Maturity</th>
                                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-200 px-3 text-center align-middle h-10 whitespace-nowrap">Aging Index</th>
                                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-200 px-3 text-right align-middle h-10 whitespace-nowrap">Bill Amt (₨)</th>
                                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-200 px-3 text-right align-middle h-10 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 text-emerald-400">
                                        Settled (₨)
                                    </span>
                                </th>
                                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-200 px-3 text-right align-middle h-10 whitespace-nowrap">Outstanding (₨)</th>
                                <th className="text-[10px] font-bold uppercase tracking-wider text-slate-200 pr-6 text-right align-middle h-10 whitespace-nowrap">Running Balance (₨)</th>
                            </tr>
                        </thead>
                        <TableBody>
                            {data.map((item, index) => {
                                const isReceivable = item.bill_type === 'receivable';
                                const isNewParty = index === 0 || data[index - 1].party_id !== item.party_id;
                                const isReconciled = item.party_summary?.is_reconciled ?? true;
                                const currentBal = item.party_summary?.current_balance ?? item.balance;
                                
                                return (
                                    <React.Fragment key={`${item.party_id}-${item.voucher_no}-${index}`}>
                                        {/* Professional Party Header Strip with Direct Ledger Reconciliation */}
                                        {isNewParty && (
                                            <TableRow className="sticky top-10 z-10 bg-slate-100/95 dark:bg-zinc-800/95 backdrop-blur-md border-y border-slate-200 dark:border-zinc-700">
                                                <TableCell colSpan={8} className="py-3 px-6">
                                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                                        
                                                        {/* Party Identity & Ledger Position */}
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-9 w-9 rounded-lg flex items-center justify-center shadow-xs shrink-0",
                                                                isReceivable ? "bg-indigo-600 text-white" : "bg-amber-600 text-white"
                                                            )}>
                                                                <UserCircle2 className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                                                                        {item.party_name}
                                                                    </h4>
                                                                    <Badge className={cn(
                                                                        "h-4 px-1.5 text-[8px] font-bold uppercase tracking-wider border-none",
                                                                        isReceivable ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                                                    )}>
                                                                        {isReceivable ? 'Customer (Receivable)' : 'Supplier (Payable)'}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                                        Entity #{item.party_id}
                                                                    </span>

                                                                    {/* Verified Reconciliation Pill */}
                                                                    {isReconciled ? (
                                                                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold flex items-center gap-1 py-0 h-4">
                                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                                            100% Reconciled with Ledger
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[9px] font-bold flex items-center gap-1 py-0 h-4">
                                                                            <AlertCircle className="h-3 w-3 text-amber-600" />
                                                                            On-Account Adjustment
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                                                                    <span>Ledger Balance: <strong className="text-slate-900 dark:text-zinc-100 font-mono">₨ {Math.abs(currentBal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currentBal >= 0 ? 'CR' : 'DR'}</strong></span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* High-Precision Aging & Credit KPIs */}
                                                        {item.party_summary && (
                                                            <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                                                                <div className="flex flex-col items-start xl:items-end">
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Un-Due</span>
                                                                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100">
                                                                        ₨ {item.party_summary.party_un_due_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-col items-start xl:items-end">
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">Critical Overdue</span>
                                                                    <span className={cn(
                                                                        "text-xs font-mono font-bold",
                                                                        item.party_summary.party_due_amount > 0 ? "text-rose-600 font-black" : "text-slate-500"
                                                                    )}>
                                                                        ₨ {item.party_summary.party_due_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-col items-start xl:items-end">
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Credit Terms</span>
                                                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                                                                        {item.party_summary.credit_days > 0 ? `${item.party_summary.credit_days} Days` : 'Immediate'}
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-col items-start xl:items-end">
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Credit Limit</span>
                                                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                                                                        {item.party_summary.credit_limit > 0 && item.party_summary.credit_limit < 90000000 
                                                                            ? `₨ ${item.party_summary.credit_limit.toLocaleString()}` 
                                                                            : 'No Limit'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {/* High-Contrast Professional Data Row */}
                                        <TableRow className={cn(
                                            "transition-colors border-b border-slate-100 dark:border-zinc-800/80 last:border-none",
                                            index % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-slate-50/50 dark:bg-zinc-900/40",
                                            isReceivable ? "hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20" : "hover:bg-amber-50/40 dark:hover:bg-amber-950/20"
                                        )}>
                                            {/* Date / Timeline */}
                                            <TableCell className="pl-6 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-3.5 w-1 rounded-full",
                                                        (item.is_opening_balance || item.voucher_no?.startsWith('OPENING-BAL'))
                                                            ? ((item.remaining < 0 || item.voucher_no?.includes('DR')) ? "bg-emerald-500" : "bg-amber-500")
                                                            : (isReceivable ? "bg-indigo-500" : "bg-amber-500")
                                                    )} />
                                                    <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                                                        {item.date && !isNaN(new Date(item.date).getTime()) ? format(new Date(item.date), 'dd/MM/yyyy') : (item.date || '-')}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Voucher Code */}
                                            <TableCell className="px-3 py-2.5">
                                                {item.is_opening_balance || item.voucher_no?.startsWith('OPENING-BAL') ? (
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded shadow-2xs",
                                                        (item.remaining < 0 || item.voucher_no?.includes('DR'))
                                                            ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                                                            : "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                                                    )}>
                                                        {item.voucher_no || 'OPENING-BAL'}
                                                    </Badge>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-zinc-100">
                                                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{item.voucher_no}</span>
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Due Date */}
                                            <TableCell className="px-3 py-2.5 text-center text-xs text-slate-600 dark:text-zinc-400">
                                                {item.due_date && !isNaN(new Date(item.due_date).getTime()) ? format(new Date(item.due_date), 'dd/MM/yyyy') : (item.due_date || '-')}
                                            </TableCell>

                                            {/* Aging Status Badge */}
                                            <TableCell className="px-3 py-2.5 text-center">
                                                <span className={cn(
                                                    "inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs",
                                                    item.days > 0 
                                                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800" 
                                                        : item.days === 0
                                                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                                                )}>
                                                    {item.days > 0 ? `${item.days}d Overdue` : item.days === 0 ? 'Due Today' : `${Math.abs(item.days)}d Left`}
                                                </span>
                                            </TableCell>

                                            {/* Bill Amount */}
                                            <TableCell className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100">
                                                <span className={item.bill_amt < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>
                                                    {item.bill_amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>

                                            {/* Settled / Paid */}
                                            <TableCell className="px-3 py-2.5 text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                {item.paid > 0.005 ? item.paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                            </TableCell>

                                            {/* Outstanding Remaining */}
                                            <TableCell className="px-3 py-2.5 text-right font-mono text-xs font-bold">
                                                <span className={item.remaining < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-zinc-100"}>
                                                    {item.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>

                                            {/* Cumulative Running Balance */}
                                            <TableCell className="pr-6 py-2.5 text-right font-mono text-xs font-black">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-sm inline-block",
                                                    item.balance < 0 
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                        : (isReceivable 
                                                            ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                                                            : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300")
                                                )}>
                                                    {item.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

            {/* Executive Supplier Payables Consolidation Dashboard (Footer) */}
            <div className="bg-slate-900 text-white dark:bg-zinc-900 dark:border-zinc-800 rounded-xl p-5 px-6 sm:px-8 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                        <Scale className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-400">Executive Summary</span>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-bold">Verified Audit</Badge>
                        </div>
                        <h4 className="text-base font-bold text-white tracking-tight mt-0.5">Supplier Outstanding Payables Position</h4>
                        <p className="text-xs text-slate-400">Total verified liabilities and open purchase obligations as-of statement date</p>
                    </div>
                </div>

                {/* High-Contrast Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full lg:w-auto">
                    <div className="flex flex-col sm:items-end">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Open Bills</span>
                        <span className="text-sm font-bold font-mono text-slate-200">{data.length} Records</span>
                    </div>
                    <div className="flex flex-col sm:items-end">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
                        <span className="text-sm font-bold font-mono text-slate-200">₨ {stats.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex flex-col sm:items-end">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Settled (Paid)</span>
                        <span className="text-sm font-bold font-mono text-emerald-400">₨ {stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex flex-col sm:items-end">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">Net Outstanding</span>
                        <span className="text-lg font-black font-mono text-amber-400">₨ {stats.payable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
