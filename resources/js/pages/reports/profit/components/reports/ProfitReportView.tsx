import TransactionReport from './types/TransactionReport';
import PartyReport from './types/PartyReport';
import SalesmanReport from './types/SalesmanReport';
import CompanyReport from './types/CompanyReport';
import DateReport from './types/DateReport';
import MonthReport from './types/MonthReport';
import { ProfitDataRow } from '../../types/profit';
import { Card } from '@/components/ui/card';
import { DollarSign, Percent, TrendingDown, TrendingUp, Printer, FileText, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfitReportViewProps {
    data: ProfitDataRow[];
    type: string;
    criteria: string;
    onExport: (format: 'print' | 'pdf' | 'excel') => void;
}

export function ProfitReportView({ data, type, criteria, onExport }: ProfitReportViewProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const totals = data.reduce((acc, row) => ({
        revenue: acc.revenue + (Number(row.revenue) || 0),
        cogs: acc.cogs + (Number(row.cogs) || 0),
        profit: acc.profit + (Number(row.profit) || 0),
        expense: acc.expense + (Number(row.expense) || 0),
        net_profit: acc.net_profit + (Number(row.net_profit) || 0),
    }), { revenue: 0, cogs: 0, profit: 0, expense: 0, net_profit: 0 });

    const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

    const reportComponents: { [key: string]: React.FC<any> } = {
        transaction: TransactionReport,
        party: PartyReport,
        salesman: SalesmanReport,
        company: CompanyReport,
        date: DateReport,
        month: MonthReport,
    };

    const ActiveReport = reportComponents[type] || TransactionReport;

    const stats = type === 'month' ? [
        { label: 'Total Revenue', value: totals.revenue, icon: DollarSign, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Gross Profit', value: totals.profit, icon: totals.profit >= 0 ? TrendingUp : TrendingDown, color: totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bg: totals.profit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
        { label: 'Total Expense', value: totals.expense, icon: TrendingDown, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Net Profit', value: totals.net_profit, icon: totals.net_profit >= 0 ? TrendingUp : TrendingDown, color: totals.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bg: totals.net_profit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
    ] : [
        { label: 'Total Revenue', value: totals.revenue, icon: DollarSign, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Total COGS', value: totals.cogs, icon: Database, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Gross Profit', value: totals.profit, icon: totals.profit >= 0 ? TrendingUp : TrendingDown, color: totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', bg: totals.profit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
        { label: 'Avg Margin', value: `${totalMargin.toFixed(2)}%`, icon: Percent, color: totalMargin >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400', bg: 'bg-indigo-500/10' },
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
                             Detailed Profit Breakdown
                             <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[9px] uppercase font-bold rounded-none">
                                {type.replace('_', ' ')}
                             </Badge>
                        </h3>
                        <p className="text-[9px] font-bold text-text-muted uppercase mt-1 tracking-widest">{criteria}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onExport('print')}
                            className="h-8 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2"
                        >
                            <Printer className="h-3 w-3 text-indigo-500" />
                            Print
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onExport('pdf')}
                            className="h-8 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2"
                        >
                            <FileText className="h-3 w-3 text-rose-500" />
                            PDF
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onExport('excel')}
                            className="h-8 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2"
                        >
                            <FileSpreadsheet className="h-3 w-3 text-emerald-500" />
                            Excel
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <ActiveReport data={data} formatCurrency={formatCurrency} criteria={criteria} />
                    </Table>
                </div>
            </Card>
        </div>
    );
}

const Database = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
);

const format = (date: Date, str: string) => {
    const d = new Date(date);
    if (str === 'dd/MM/yy') {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
    if (str === 'MMM dd, yyyy') {
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
    return d.toISOString();
};
