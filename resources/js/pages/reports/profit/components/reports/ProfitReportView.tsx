import React, { useState, useEffect, useMemo } from 'react';
import TransactionReport from './types/TransactionReport';
import PartyReport from './types/PartyReport';
import SalesmanReport from './types/SalesmanReport';
import CompanyReport from './types/CompanyReport';
import DateReport from './types/DateReport';
import MonthReport from './types/MonthReport';
import { ProfitDataRow } from '../../types/profit';
import { Card } from '@/components/ui/card';
import { DollarSign, Percent, TrendingDown, TrendingUp, Printer, FileText, FileSpreadsheet, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';

interface ProfitReportViewProps {
    data: ProfitDataRow[];
    type: string;
    criteria: string;
    onExport: (format: 'print' | 'pdf' | 'excel', currentSort?: string) => void;
}

const getSortOptions = (reportType: string) => {
    const baseOptions = [
        { value: 'default', label: 'Default Order' },
        { value: 'revenue_desc', label: 'Sales: High to Low' },
        { value: 'revenue_asc', label: 'Sales: Low to High' },
        { value: 'profit_desc', label: 'Profit: High to Low' },
        { value: 'profit_asc', label: 'Profit: Low to High' },
    ];

    switch (reportType) {
        case 'transaction':
            return [
                { value: 'default', label: 'Default (Newest First)' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'revenue_desc', label: 'Sales: High to Low' },
                { value: 'revenue_asc', label: 'Sales: Low to High' },
                { value: 'profit_desc', label: 'Profit: High to Low' },
                { value: 'profit_asc', label: 'Profit: Low to High' },
                { value: 'margin_desc', label: 'Margin %: High to Low' },
                { value: 'margin_asc', label: 'Margin %: Low to High' },
                { value: 'qty_desc', label: 'Quantity: High to Low' },
                { value: 'qty_asc', label: 'Quantity: Low to High' },
            ];
        case 'party':
            return [
                { value: 'default', label: 'Default (Profit Desc)' },
                { value: 'name_asc', label: 'Party Name: A to Z' },
                { value: 'name_desc', label: 'Party Name: Z to A' },
                { value: 'revenue_desc', label: 'Sales: High to Low' },
                { value: 'revenue_asc', label: 'Sales: Low to High' },
                { value: 'profit_desc', label: 'Profit: High to Low' },
                { value: 'profit_asc', label: 'Profit: Low to High' },
                { value: 'margin_desc', label: 'Margin %: High to Low' },
                { value: 'margin_asc', label: 'Margin %: Low to High' },
            ];
        case 'salesman':
            return [
                { value: 'default', label: 'Default (Profit Desc)' },
                { value: 'name_asc', label: 'Salesman: A to Z' },
                { value: 'name_desc', label: 'Salesman: Z to A' },
                { value: 'revenue_desc', label: 'Sales: High to Low' },
                { value: 'revenue_asc', label: 'Sales: Low to High' },
                { value: 'profit_desc', label: 'Profit: High to Low' },
                { value: 'profit_asc', label: 'Profit: Low to High' },
                { value: 'margin_desc', label: 'Margin %: High to Low' },
                { value: 'margin_asc', label: 'Margin %: Low to High' },
            ];
        case 'company':
            return [
                { value: 'default', label: 'Default (Profit Desc)' },
                { value: 'name_asc', label: 'Company: A to Z' },
                { value: 'name_desc', label: 'Company: Z to A' },
                { value: 'revenue_desc', label: 'Sales: High to Low' },
                { value: 'revenue_asc', label: 'Sales: Low to High' },
                { value: 'profit_desc', label: 'Profit: High to Low' },
                { value: 'profit_asc', label: 'Profit: Low to High' },
                { value: 'margin_desc', label: 'Margin %: High to Low' },
                { value: 'margin_asc', label: 'Margin %: Low to High' },
            ];
        case 'date':
            return [
                { value: 'default', label: 'Default (Oldest First)' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'revenue_desc', label: 'Sales: High to Low' },
                { value: 'revenue_asc', label: 'Sales: Low to High' },
                { value: 'profit_desc', label: 'Profit: High to Low' },
                { value: 'profit_asc', label: 'Profit: Low to High' },
                { value: 'margin_desc', label: 'Margin %: High to Low' },
                { value: 'margin_asc', label: 'Margin %: Low to High' },
            ];
        case 'month':
            return [
                { value: 'default', label: 'Default (Chronological)' },
                { value: 'revenue_desc', label: 'Sales: High to Low' },
                { value: 'revenue_asc', label: 'Sales: Low to High' },
                { value: 'profit_desc', label: 'Gross Profit: High to Low' },
                { value: 'profit_asc', label: 'Gross Profit: Low to High' },
                { value: 'net_profit_desc', label: 'Net Profit: High to Low' },
                { value: 'net_profit_asc', label: 'Net Profit: Low to High' },
            ];
        default:
            return baseOptions;
    }
};

export function ProfitReportView({ data, type, criteria, onExport }: ProfitReportViewProps) {
    const [sortBy, setSortBy] = useState<string>('default');

    // Reset sort option when report type changes
    useEffect(() => {
        setSortBy('default');
    }, [type]);

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

    const sortedData = useMemo(() => {
        if (sortBy === 'default') return data;

        const dataCopy = [...data];

        return dataCopy.sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            switch (sortBy) {
                case 'revenue_desc':
                    return (Number(b.revenue) || 0) - (Number(a.revenue) || 0);
                case 'revenue_asc':
                    return (Number(a.revenue) || 0) - (Number(b.revenue) || 0);
                case 'profit_desc':
                    return (Number(b.profit) || 0) - (Number(a.profit) || 0);
                case 'profit_asc':
                    return (Number(a.profit) || 0) - (Number(b.profit) || 0);
                case 'margin_desc':
                    return (Number(b.margin) || 0) - (Number(a.margin) || 0);
                case 'margin_asc':
                    return (Number(a.margin) || 0) - (Number(b.margin) || 0);
                case 'qty_desc':
                    return (Number(b.qty) || 0) - (Number(a.qty) || 0);
                case 'qty_asc':
                    return (Number(a.qty) || 0) - (Number(b.qty) || 0);
                case 'net_profit_desc':
                    return (Number(b.net_profit) || 0) - (Number(a.net_profit) || 0);
                case 'net_profit_asc':
                    return (Number(a.net_profit) || 0) - (Number(b.net_profit) || 0);
                case 'date_desc':
                    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
                case 'date_asc':
                    return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
                case 'name_asc':
                    valA = String(a.name || '').toLowerCase();
                    valB = String(b.name || '').toLowerCase();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                case 'name_desc':
                    valA = String(a.name || '').toLowerCase();
                    valB = String(b.name || '').toLowerCase();
                    return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                default:
                    return 0;
            }
        });
    }, [data, sortBy]);

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
                <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-1/30">
                    <div>
                        <h3 className="text-md font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                             Detailed Profit Breakdown
                             <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[9px] uppercase font-bold rounded-none">
                                {type.replace('_', ' ')}
                             </Badge>
                        </h3>
                        <p className="text-[9px] font-bold text-text-muted uppercase mt-1 tracking-widest">{criteria}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Dynamic Premium Sorting Dropdown */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-8 w-[190px] rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight focus:ring-0 focus:ring-offset-0 flex items-center gap-2">
                                <ArrowUpDown className="h-3 w-3 text-indigo-500 shrink-0" />
                                <SelectValue placeholder="SORT BY" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none bg-surface-0 border-border/50 text-[10px] font-bold uppercase tracking-tight">
                                {getSortOptions(type).map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-bold uppercase tracking-tight cursor-pointer hover:bg-surface-1 rounded-none">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onExport('print', sortBy)}
                            className="h-8 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2"
                        >
                            <Printer className="h-3 w-3 text-indigo-500" />
                            Print
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onExport('pdf', sortBy)}
                            className="h-8 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2"
                        >
                            <FileText className="h-3 w-3 text-rose-500" />
                            PDF
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onExport('excel', sortBy)}
                            className="h-8 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2"
                        >
                            <FileSpreadsheet className="h-3 w-3 text-emerald-500" />
                            Excel
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <ActiveReport data={sortedData} formatCurrency={formatCurrency} criteria={criteria} />
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
