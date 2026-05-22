import { IconFileInvoice } from '@tabler/icons-react';
import React, { useState } from 'react';

const statusPills: Record<string, string> = {
    Cash: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Credit: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Cheque: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Pending: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Returned: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

interface Invoice {
    id: string;
    customer: string;
    items: number;
    amount: string;
    payment: string;
    status: string;
}

interface InvoiceTableProps {
    todayInvoices?: Invoice[];
    weekInvoices?: Invoice[];
    monthInvoices?: Invoice[];
}

export default function InvoiceTable({
    todayInvoices = [],
    weekInvoices = [],
    monthInvoices = [],
}: InvoiceTableProps) {
    const [activeTab, setActiveTab] = useState('Today');

    const invoices = activeTab === 'Today' ? todayInvoices : (activeTab === 'This week' ? weekInvoices : monthInvoices);

    const totalAmount = invoices.reduce((sum, inv) => {
        const val = parseFloat(inv.amount.replace(/[^\d.]/g, '')) || 0;
        return sum + val;
    }, 0);

    return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col h-full overflow-hidden shadow-xs">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                    <IconFileInvoice size={14} className="text-orange-500" />
                    <span className="text-[13px] font-medium text-foreground">Counter invoices</span>
                </div>
                <div className="flex gap-1">
                    {['Today', 'This week', 'Month'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-2.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                                activeTab === tab
                                    ? 'bg-orange-600 dark:bg-orange-500 text-white'
                                    : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                             }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr>
                            <th className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border pb-1.5 font-normal">Invoice #</th>
                            <th className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border pb-1.5 font-normal">Customer</th>
                            <th className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border pb-1.5 font-normal text-center">Items</th>
                            <th className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border pb-1.5 font-normal text-right">Amount</th>
                            <th className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border pb-1.5 font-normal pl-4">Payment</th>
                            <th className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground border-b border-border pb-1.5 font-normal pl-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-[11px] text-muted-foreground">
                                    No invoices found.
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv, idx) => (
                                <tr key={idx} className={`hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${inv.status === 'Returned' ? 'border-l-2 border-l-red-500' : ''}`}>
                                    <td className="py-2 text-[11px] text-orange-600 dark:text-orange-400 font-medium whitespace-nowrap pl-1">{inv.id}</td>
                                    <td className="py-2 text-[11px] text-foreground whitespace-nowrap">{inv.customer}</td>
                                    <td className="py-2 text-[11px] text-muted-foreground text-center">{inv.items}</td>
                                    <td className="py-2 text-[11px] text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap font-medium">{inv.amount}</td>
                                    <td className="py-2 pl-4">
                                        <span className={`inline-block border text-[9px] px-2 py-0.5 rounded-full ${statusPills[inv.payment] || 'bg-muted text-muted-foreground border-border'}`}>
                                            {inv.payment}
                                        </span>
                                    </td>
                                    <td className="py-2 pl-4">
                                        <span className={`inline-block border text-[9px] px-2 py-0.5 rounded-full ${statusPills[inv.status] || 'bg-muted text-muted-foreground border-border'}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {invoices.length > 0 && (
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="py-2 text-right text-[10px] uppercase tracking-[0.04em] text-muted-foreground pr-4">Total Amount</td>
                                <td className="py-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold text-right whitespace-nowrap">Rs {number_format(totalAmount)}</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

// Simple JS implementation of PHP's number_format to match formatting
function number_format(num: number) {
    return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
