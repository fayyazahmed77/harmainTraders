import React from 'react';
import { format } from 'date-fns';
import { 
    NotebookText, 
    ArrowDownToLine, 
    ArrowUpFromLine, 
    Layers,
    Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoznamchaInflows {
    cash_opening: number;
    cash_sale: number;
    cash_received_credit_sale: number;
    cheque_received_credit_sale: number;
    drawing: number;
    loan_received: number;
    total_cash_received: number;
}

interface RoznamchaOutflows {
    cash_purchase: number;
    total_expense: number;
    cash_paid_credit_purchase: number;
    cheque_paid_credit_purchase: number;
    deposits: number;
    loan_paid: number;
    total_payment: number;
}

export interface RoznamchaData {
    inflows: RoznamchaInflows;
    outflows: RoznamchaOutflows;
    cash_in_hand: number;
    from_date: string;
    to_date: string;
}

interface RoznamchaReportViewProps {
    data: RoznamchaData | null;
}

export function RoznamchaReportView({ data }: RoznamchaReportViewProps) {
    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-1/30 rounded-3xl border border-border/50">
                <Layers className="h-10 w-10 text-text-muted/20 mb-4" />
                <h3 className="text-sm font-display font-black text-text-muted uppercase tracking-widest">No Intelligence Data</h3>
            </div>
        );
    }

    const { inflows, outflows, cash_in_hand, to_date } = data;

    const formatNum = (num: number) => {
        return Math.round(num).toLocaleString();
    };

    const StatementRow = ({ label, amount, isTotal = false }: { label: string, amount: number, isTotal?: boolean }) => (
        <div className={cn(
            "flex justify-between items-center py-2.5 px-1",
            isTotal && "mt-4 pt-4 border-t-2 border-b-4 border-double border-text-primary/70 mb-2"
        )}>
            <span className={cn(
                "font-display text-[11px] tracking-wide",
                isTotal ? "font-black text-text-primary uppercase" : "font-semibold text-text-primary"
            )}>
                {label}
            </span>
            <span className={cn(
                "font-mono-jet text-[12px]",
                isTotal ? "font-black text-text-primary" : "font-bold text-text-primary"
            )}>
                {formatNum(amount)}
            </span>
        </div>
    );

    return (
        <div className="relative -mt-6">
            <div className="bg-card border border-border shadow-sm rounded-xl p-8">
                
                {/* Embedded Header for Screen Reference */}
                <div className="flex flex-col items-center mb-10 border-b border-border pb-6">
                    <h2 className="text-xl font-display font-black text-text-primary tracking-wider uppercase">Harmain Traders</h2>
                    <h3 className="text-[10px] font-display font-bold text-text-muted uppercase tracking-[0.2em] mt-1">
                        Summary for the period ended {format(new Date(to_date), 'dd-MMM-yyyy')}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 relative">
                    {/* Center Divider for Desktop */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-8 w-[1px] bg-border/80 -translate-x-1/2" />
                    
                    {/* LEFT COLUMN: INFLOWS */}
                    <div className="flex flex-col pr-0 md:pr-4">
                        <div className="flex items-center gap-2 mb-6 opacity-30">
                            <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
                            <span className="text-[9px] font-display font-black uppercase tracking-widest text-emerald-500">Inflows</span>
                        </div>
                        
                        <div className="space-y-0.5 flex-1">
                            <StatementRow label="Cash Opening" amount={inflows.cash_opening} />
                            <StatementRow label="Cash Sale" amount={inflows.cash_sale} />
                            <StatementRow label="Cash Received On Credit Sale" amount={inflows.cash_received_credit_sale} />
                            <StatementRow label="Cheque Received On Credit Sale" amount={inflows.cheque_received_credit_sale} />
                            <StatementRow label="Drawing" amount={inflows.drawing} />
                            <StatementRow label="Loan Received" amount={inflows.loan_received} />
                        </div>
                        
                        <div className="mt-auto">
                            <StatementRow label="Total Cash Received" amount={inflows.total_cash_received} isTotal />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: OUTFLOWS */}
                    <div className="flex flex-col pl-0 md:pl-4 mt-10 md:mt-0">
                        <div className="flex items-center gap-2 mb-6 opacity-30">
                            <ArrowUpFromLine className="h-4 w-4 text-rose-500" />
                            <span className="text-[9px] font-display font-black uppercase tracking-widest text-rose-500">Outflows</span>
                        </div>

                        <div className="space-y-0.5 flex-1">
                            <StatementRow label="Cash Purchase" amount={outflows.cash_purchase} />
                            <StatementRow label="Total Expense" amount={outflows.total_expense} />
                            <StatementRow label="Cash Paid On Credit Purchase" amount={outflows.cash_paid_credit_purchase} />
                            <StatementRow label="Cheque Paid On Credit Purchase" amount={outflows.cheque_paid_credit_purchase} />
                            <StatementRow label="Deposits" amount={outflows.deposits} />
                            <StatementRow label="Loan Paid" amount={outflows.loan_paid} />
                        </div>
                        
                        <div className="mt-auto">
                            <StatementRow label="Total Payment" amount={outflows.total_payment} isTotal />
                        </div>
                    </div>
                </div>

                {/* FOOTER SUMMARY */}
                <div className="mt-12 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-8 py-3 px-8 bg-surface-1/50 rounded-lg border border-border/50">
                        <span className="text-[12px] font-display font-black text-text-primary uppercase tracking-widest">
                            Cash In Hand
                        </span>
                        <span className="text-[14px] font-mono-jet font-black text-emerald-600 dark:text-emerald-400">
                            {formatNum(cash_in_hand)}
                        </span>
                    </div>
                    <span className="text-[9px] font-display font-bold text-text-muted mt-4 uppercase tracking-[0.2em]">
                        Cheque Not Include
                    </span>
                </div>

            </div>
        </div>
    );
}
