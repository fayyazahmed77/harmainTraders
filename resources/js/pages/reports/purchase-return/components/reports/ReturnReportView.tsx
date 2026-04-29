import { 
    BillReport, 
    DateReport, 
    DetailsReport, 
    ItemReport,
    MonthReport,
    PaymentReport,
    InvoiceDetailsReport
} from '@/pages/reports/purchase-return/components/reports/types';
import { Card } from '@/components/ui/card';
import { DollarSign, Printer, FileText, FileSpreadsheet, Package, Users, Calendar, TrendingUp, List, ClipboardList, BarChart3, Wallet, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import AnalyticsButton from '@/components/Reports/AnalyticsButton';
import AnalyticsDialog from '@/components/Reports/AnalyticsDialog';

interface ReturnReportViewProps {
    data: any[];
    type: string;
    criteria: string;
    onExport: (format: 'print' | 'pdf' | 'excel') => void;
}

export function ReturnReportView({ data, type, criteria, onExport }: ReturnReportViewProps) {
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const totals = data.reduce((acc, row) => ({
        amount: acc.amount + (Number(row.amount) || Number(row.total_amount) || Number(row.net_amount) || 0),
        qty: acc.qty + (Number(row.qty) || Number(row.total_qty) || Number(row.qty_pcs) || 0),
    }), { amount: 0, qty: 0 });

    const reportComponents: { [key: string]: React.FC<any> } = {
        bill: BillReport,
        date: DateReport,
        details: DetailsReport,
        item: ItemReport,
        month: MonthReport,
        payment: PaymentReport,
        invoice_details: InvoiceDetailsReport,
    };

    const ActiveReport = reportComponents[type] || BillReport;

    const stats = [
        { label: 'Return Value', value: totals.amount, icon: Undo2, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'Units Reverted', value: totals.qty, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Return Count', value: data.length, icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Avg Reversal', value: data.length > 0 ? totals.amount / data.length : 0, icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return (
        <div className="space-y-4">
            {/* Executive Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="p-4 bg-surface-1/40 border-border/50 shadow-sm rounded-sm backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className={cn("h-10 w-10 rounded-sm flex items-center justify-center", stat.bg)}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{stat.label}</p>
                                <h3 className={cn("text-xl font-black tabular-nums tracking-tighter", stat.color)}>
                                    {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
                                </h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Data Table */}
            <Card className="bg-surface-0 border-border/50 shadow-xl rounded-sm overflow-hidden ring-1 ring-border/5">
                <div className="p-5 border-b border-border/50 flex items-center justify-between bg-surface-1/30">
                    <div>
                        <h3 className="text-md font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                             Purchase Return Dashboard
                             <Badge variant="outline" className="bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 text-[9px] uppercase font-bold rounded-none">
                                {type.replace('_', ' ')}
                             </Badge>
                        </h3>
                        <p className="text-[9px] font-bold text-text-muted uppercase mt-1 tracking-widest">{criteria}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <AnalyticsButton onClick={() => setIsAnalyticsOpen(true)} />
                        <div className="h-4 w-[1px] bg-border mx-1" />
                        <Button variant="outline" size="sm" onClick={() => onExport('print')} className="h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                            <Printer className="h-3.5 w-3.5 text-indigo-500" /> Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onExport('pdf')} className="h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-rose-500" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onExport('excel')} className="h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> Excel
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <ActiveReport data={data} formatCurrency={formatCurrency} criteria={criteria} />
                    </Table>
                </div>
            </Card>

            <AnalyticsDialog 
                isOpen={isAnalyticsOpen} 
                onClose={() => setIsAnalyticsOpen(false)} 
                reportType={'purchase_return_' + type} 
                data={data} 
            />
        </div>
    );
}
