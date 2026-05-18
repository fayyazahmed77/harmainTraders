import React, { useState, useEffect, useMemo } from 'react';
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
import { DollarSign, Printer, FileText, FileSpreadsheet, Package, Users, Calendar, TrendingUp, List, ClipboardList, BarChart3, Wallet, Undo2, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AnalyticsButton from '@/components/Reports/AnalyticsButton';
import AnalyticsDialog from '@/components/Reports/AnalyticsDialog';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';

interface ReturnReportViewProps {
    data: any[];
    type: string;
    criteria: string;
    onExport: (format: 'print' | 'pdf' | 'excel', currentSort?: string) => void;
}

const getSortOptions = (reportType: string) => {
    const baseOptions = [
        { value: 'default', label: 'Default Order' },
        { value: 'amount_desc', label: 'Amount: High to Low' },
        { value: 'amount_asc', label: 'Amount: Low to High' },
    ];

    switch (reportType) {
        case 'bill':
            return [
                { value: 'default', label: 'Default (Newest First)' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'name_asc', label: 'Supplier Name: A to Z' },
                { value: 'name_desc', label: 'Supplier Name: Z to A' },
                { value: 'gross_desc', label: 'Gross: High to Low' },
                { value: 'gross_asc', label: 'Gross: Low to High' },
                { value: 'discount_desc', label: 'Discount: High to Low' },
                { value: 'discount_asc', label: 'Discount: Low to High' },
                { value: 'amount_desc', label: 'Net Amount: High to Low' },
                { value: 'amount_asc', label: 'Net Amount: Low to High' },
            ];
        case 'date':
            return [
                { value: 'default', label: 'Default (Oldest First)' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'bills_desc', label: 'Total Bills: High to Low' },
                { value: 'bills_asc', label: 'Total Bills: Low to High' },
                { value: 'amount_desc', label: 'Total Amount: High to Low' },
                { value: 'amount_asc', label: 'Total Amount: Low to High' },
            ];
        case 'details':
        case 'invoice_details':
            return [
                { value: 'default', label: 'Default (Newest First)' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'name_asc', label: 'Supplier Name: A to Z' },
                { value: 'name_desc', label: 'Supplier Name: Z to A' },
                { value: 'product_name_asc', label: 'Product Name: A to Z' },
                { value: 'product_name_desc', label: 'Product Name: Z to A' },
                { value: 'qty_desc', label: 'Quantity Cartons: High to Low' },
                { value: 'qty_asc', label: 'Quantity Cartons: Low to High' },
                { value: 'amount_desc', label: 'Subtotal Amount: High to Low' },
                { value: 'amount_asc', label: 'Subtotal Amount: Low to High' },
            ];
        case 'item':
            return [
                { value: 'default', label: 'Default (Net Amount Desc)' },
                { value: 'name_asc', label: 'Product Name: A to Z' },
                { value: 'name_desc', label: 'Product Name: Z to A' },
                { value: 'gross_desc', label: 'Gross Amount: High to Low' },
                { value: 'gross_asc', label: 'Gross Amount: Low to High' },
                { value: 'discount_desc', label: 'Discount: High to Low' },
                { value: 'discount_asc', label: 'Discount: Low to High' },
                { value: 'amount_desc', label: 'Net Amount: High to Low' },
                { value: 'amount_asc', label: 'Net Amount: Low to High' },
            ];
        case 'month':
            return [
                { value: 'default', label: 'Default (Newest First)' },
                { value: 'date_desc', label: 'Month: Newest First' },
                { value: 'date_asc', label: 'Month: Oldest First' },
                { value: 'name_asc', label: 'Supplier Name: A to Z' },
                { value: 'name_desc', label: 'Supplier Name: Z to A' },
                { value: 'gross_desc', label: 'Gross: High to Low' },
                { value: 'gross_asc', label: 'Gross: Low to High' },
                { value: 'amount_desc', label: 'Net Amount: High to Low' },
                { value: 'amount_asc', label: 'Net Amount: Low to High' },
            ];
        case 'payment':
            return [
                { value: 'default', label: 'Default (Newest First)' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'name_asc', label: 'Supplier Name: A to Z' },
                { value: 'name_desc', label: 'Supplier Name: Z to A' },
                { value: 'amount_desc', label: 'Total Amount: High to Low' },
                { value: 'amount_asc', label: 'Total Amount: Low to High' },
                { value: 'paid_desc', label: 'Paid Refunded: High to Low' },
                { value: 'paid_asc', label: 'Paid Refunded: Low to High' },
                { value: 'balance_desc', label: 'Remaining Balance: High to Low' },
                { value: 'balance_asc', label: 'Remaining Balance: Low to High' },
            ];
        default:
            return baseOptions;
    }
};

export function ReturnReportView({ data, type, criteria, onExport }: ReturnReportViewProps) {
    const [sortBy, setSortBy] = useState<string>('default');
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

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
        amount: acc.amount + (Number(row.amount) || Number(row.total_amount) || Number(row.net_total) || Number(row.net_amount) || 0),
        qty: acc.qty + (Number(row.qty) || Number(row.total_qty) || Number(row.qty_pcs) || 0),
    }), { amount: 0, qty: 0 });

    const sortedData = useMemo(() => {
        if (sortBy === 'default') return data;

        const dataCopy = [...data];

        return dataCopy.sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            switch (sortBy) {
                case 'amount_desc':
                    valA = Number(a.amount || a.total_amount || a.net_amount || 0);
                    valB = Number(b.amount || b.total_amount || b.net_amount || 0);
                    return valB - valA;
                case 'amount_asc':
                    valA = Number(a.amount || a.total_amount || a.net_amount || 0);
                    valB = Number(b.amount || b.total_amount || b.net_amount || 0);
                    return valA - valB;
                case 'gross_desc':
                    valA = Number(a.gross || a.gross_amount || 0);
                    valB = Number(b.gross || b.gross_amount || 0);
                    return valB - valA;
                case 'gross_asc':
                    valA = Number(a.gross || a.gross_amount || 0);
                    valB = Number(b.gross || b.gross_amount || 0);
                    return valA - valB;
                case 'discount_desc':
                    valA = Number(a.discount || a.discount_amount || 0);
                    valB = Number(b.discount || b.discount_amount || 0);
                    return valB - valA;
                case 'discount_asc':
                    valA = Number(a.discount || a.discount_amount || 0);
                    valB = Number(b.discount || b.discount_amount || 0);
                    return valA - valB;
                case 'paid_desc':
                    return (Number(b.paid_amount) || 0) - (Number(a.paid_amount) || 0);
                case 'paid_asc':
                    return (Number(a.paid_amount) || 0) - (Number(b.paid_amount) || 0);
                case 'qty_desc':
                    return (Number(b.qty_full) || 0) - (Number(a.qty_full) || 0);
                case 'qty_asc':
                    return (Number(a.qty_full) || 0) - (Number(b.qty_full) || 0);
                case 'bills_desc':
                    return (Number(b.total_bills) || 0) - (Number(a.total_bills) || 0);
                case 'bills_asc':
                    return (Number(a.total_bills) || 0) - (Number(b.total_bills) || 0);
                case 'balance_desc':
                    return (Number(b.balance) || 0) - (Number(a.balance) || 0);
                case 'balance_asc':
                    return (Number(a.balance) || 0) - (Number(b.balance) || 0);
                case 'date_desc':
                    valA = String(a.date || a.month || '0');
                    valB = String(b.date || b.month || '0');
                    return valB.localeCompare(valA);
                case 'date_asc':
                    valA = String(a.date || a.month || '0');
                    valB = String(b.date || b.month || '0');
                    return valA.localeCompare(valB);
                case 'name_asc':
                    valA = String(a.account_name || a.name || '').toLowerCase();
                    valB = String(b.account_name || b.name || '').toLowerCase();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                case 'name_desc':
                    valA = String(a.account_name || a.name || '').toLowerCase();
                    valB = String(b.account_name || b.name || '').toLowerCase();
                    return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                case 'product_name_asc':
                    valA = String(a.product_name || '').toLowerCase();
                    valB = String(b.product_name || '').toLowerCase();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                case 'product_name_desc':
                    valA = String(a.product_name || '').toLowerCase();
                    valB = String(b.product_name || '').toLowerCase();
                    return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                default:
                    return 0;
            }
        });
    }, [data, sortBy]);

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
                <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-1/30">
                    <div>
                        <h3 className="text-md font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                             Purchase Return Dashboard
                             <Badge variant="outline" className="bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 text-[9px] uppercase font-bold rounded-none">
                                {type.replace('_', ' ')}
                             </Badge>
                        </h3>
                        <p className="text-[9px] font-bold text-text-muted uppercase mt-1 tracking-widest">{criteria}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <AnalyticsButton onClick={() => setIsAnalyticsOpen(true)} />
                        <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

                        {/* Premium Sorting Dropdown */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 w-[190px] rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight focus:ring-0 focus:ring-offset-0 flex items-center gap-2">
                                <ArrowUpDown className="h-3.5 w-3.5 text-rose-500 shrink-0" />
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

                        <Button variant="outline" size="sm" onClick={() => onExport('print', sortBy)} className="h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                            <Printer className="h-3.5 w-3.5 text-indigo-500" /> Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onExport('pdf', sortBy)} className="h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-rose-500" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onExport('excel', sortBy)} className="h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> Excel
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <ActiveReport data={sortedData} formatCurrency={formatCurrency} criteria={criteria} />
                    </Table>
                </div>
            </Card>

            <AnalyticsDialog 
                isOpen={isAnalyticsOpen} 
                onClose={() => setIsAnalyticsOpen(false)} 
                reportType={'purchase_return_' + type} 
                data={sortedData} 
            />
        </div>
    );
}
