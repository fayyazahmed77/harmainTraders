import { IconClock, IconUsers, IconFileInvoice, IconCash, IconCreditCard, IconRefresh } from '@tabler/icons-react';
import React from 'react';

interface ShiftSummary {
    walkIn: string;
    invoices: string;
    cashCollected: string;
    creditSales: string;
    returns: string;
    netShiftSales: string;
}

interface ShiftSummaryPanelProps {
    shiftSummary?: Partial<ShiftSummary>;
}

export default function ShiftSummaryPanel({ shiftSummary = {} }: ShiftSummaryPanelProps) {
    const summaryItems = [
        { icon: IconUsers, iconColor: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', label: 'Walk-in customers', sub: 'Served today', value: shiftSummary.walkIn || '0', valColor: 'text-orange-600 dark:text-orange-400' },
        { icon: IconFileInvoice, iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', label: 'Invoices created', sub: 'All types', value: shiftSummary.invoices || '0', valColor: 'text-emerald-600 dark:text-emerald-400' },
        { icon: IconCash, iconColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', label: 'Cash collected', sub: 'In drawer', value: shiftSummary.cashCollected || 'Rs 0', valColor: 'text-blue-600 dark:text-blue-400' },
        { icon: IconCreditCard, iconColor: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', label: 'Credit sales', sub: 'Pending recovery', value: shiftSummary.creditSales || 'Rs 0', valColor: 'text-purple-600 dark:text-purple-400' },
        { icon: IconRefresh, iconColor: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', label: 'Returns processed', sub: 'Amount reversed', value: shiftSummary.returns || 'Rs 0', valColor: 'text-red-600 dark:text-red-400' },
    ];

    return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col h-full shadow-xs">
            <div className="flex items-center gap-1.5 mb-3 text-blue-600 dark:text-blue-400">
                <IconClock size={14} className="text-blue-500" />
                <span className="text-[13px] font-medium text-foreground">Shift summary</span>
            </div>

            <div className="flex flex-col flex-1">
                {summaryItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0 flex-1">
                        <div 
                            className={`w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 ${item.bg}`}
                        >
                            <item.icon size={14} className={item.iconColor} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] text-foreground font-medium leading-tight">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.sub}</span>
                        </div>
                        <div className={`ml-auto text-[11px] font-bold ${item.valColor}`}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-border flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">Net shift sales</span>
                <span className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">{shiftSummary.netShiftSales || 'Rs 0'}</span>
            </div>
        </div>
    );
}
