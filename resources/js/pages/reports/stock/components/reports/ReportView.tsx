import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { 
    Box, 
    Printer, 
    FileSpreadsheet, 
    TrendingUp, 
    List, 
    BarChart3,
    AlertCircle,
    PackageSearch,
    ArrowUpDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { stockReports } from '../../constants/stockReports';
import StockSummary from './types/StockSummary';
import PriceList from './types/PriceList';
import StockDetail from './types/StockDetail';
import StockTypeWise from './types/StockTypeWise';
import StockNegativeAudit from './types/StockNegativeAudit';
import StockAvailable from './types/StockAvailable';
import StockReOrderLevel from './types/StockReOrderLevel';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';

interface ReportViewProps {
    reportId: string;
    data: any[];
    loading: boolean;
    onExportPdf: (sortBy?: string) => void;
    onExportExcel: (sortBy?: string) => void;
    params: any;
}

const getSortOptions = (reportId: string) => {
    const baseOptions = [
        { value: 'default', label: 'Default Order' },
        { value: 'item_name_asc', label: 'Item Description: A to Z' },
        { value: 'item_name_desc', label: 'Item Description: Z to A' },
    ];

    switch (reportId) {
        case 'summary':
        case 'type_wise':
        case 'less_than_zero':
            return [
                { value: 'default', label: 'Default Order' },
                { value: 'item_name_asc', label: 'Item Description: A to Z' },
                { value: 'item_name_desc', label: 'Item Description: Z to A' },
                { value: 'company_name_asc', label: 'Company: A to Z' },
                { value: 'company_name_desc', label: 'Company: Z to A' },
                { value: 'category_name_asc', label: 'Category: A to Z' },
                { value: 'category_name_desc', label: 'Category: Z to A' },
                { value: 'qty_desc', label: 'Balance Quantity: High to Low' },
                { value: 'qty_asc', label: 'Balance Quantity: Low to High' },
                { value: 'amount_desc', label: 'Valuation Amount: High to Low' },
                { value: 'amount_asc', label: 'Valuation Amount: Low to High' },
            ];
        case 'detail':
            return [
                { value: 'default', label: 'Default (Oldest First)' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'item_name_asc', label: 'Account/Supplier: A to Z' },
                { value: 'item_name_desc', label: 'Account/Supplier: Z to A' },
                { value: 'qty_desc', label: 'Ledger Balance: High to Low' },
                { value: 'qty_asc', label: 'Ledger Balance: Low to High' },
                { value: 'amount_desc', label: 'Valuation: High to Low' },
                { value: 'amount_asc', label: 'Valuation: Low to High' },
            ];
        case 'price_list':
            return [
                { value: 'default', label: 'Default Order' },
                { value: 'item_name_asc', label: 'Item Description: A to Z' },
                { value: 'item_name_desc', label: 'Item Description: Z to A' },
                { value: 'amount_desc', label: 'Trade Price: High to Low' },
                { value: 'amount_asc', label: 'Trade Price: Low to High' },
            ];
        case 'available_stock':
            return [
                { value: 'default', label: 'Default Order' },
                { value: 'item_name_asc', label: 'Item Description: A to Z' },
                { value: 'item_name_desc', label: 'Item Description: Z to A' },
                { value: 'company_name_asc', label: 'Supplier/Company: A to Z' },
                { value: 'company_name_desc', label: 'Supplier/Company: Z to A' },
                { value: 'qty_desc', label: 'Available Qty: High to Low' },
                { value: 'qty_asc', label: 'Available Qty: Low to High' },
            ];
        case 're_order_level':
            return [
                { value: 'default', label: 'Default Order' },
                { value: 'item_name_asc', label: 'Item Description: A to Z' },
                { value: 'item_name_desc', label: 'Item Description: Z to A' },
                { value: 'company_name_asc', label: 'Company: A to Z' },
                { value: 'company_name_desc', label: 'Company: Z to A' },
                { value: 'qty_desc', label: 'Balance Qty: High to Low' },
                { value: 'qty_asc', label: 'Balance Qty: Low to High' },
                { value: 'shortfall_desc', label: 'Shortfall: High to Low' },
                { value: 'shortfall_asc', label: 'Shortfall: Low to High' },
            ];
        default:
            return baseOptions;
    }
};

export function ReportView({ 
    reportId, 
    data, 
    loading, 
    onExportPdf, 
    onExportExcel,
    params
}: ReportViewProps) {
    const [sortBy, setSortBy] = useState<string>('default');

    // Reset sort option when report ID changes
    useEffect(() => {
        setSortBy('default');
    }, [reportId]);

    const activeReport = stockReports.find(r => r.id === reportId) || stockReports[0];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const totals = data.reduce((acc, row) => ({
        valuation: acc.valuation + (Number(row.amount) || 0),
        qty: acc.qty + (Number(row.balance_qty) || Number(row.qty) || 0),
    }), { valuation: 0, qty: 0 });

    const sortedData = useMemo(() => {
        if (sortBy === 'default') return data;

        const dataCopy = [...data];

        return dataCopy.sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            switch (sortBy) {
                case 'amount_desc':
                    valA = Number(a.amount || a.trade_price || 0);
                    valB = Number(b.amount || b.trade_price || 0);
                    return valB - valA;
                case 'amount_asc':
                    valA = Number(a.amount || a.trade_price || 0);
                    valB = Number(b.amount || b.trade_price || 0);
                    return valA - valB;
                case 'qty_desc':
                    valA = Number(a.balance_qty ?? a.balance ?? a.in_qty ?? 0);
                    valB = Number(b.balance_qty ?? b.balance ?? b.in_qty ?? 0);
                    return valB - valA;
                case 'qty_asc':
                    valA = Number(a.balance_qty ?? a.balance ?? a.in_qty ?? 0);
                    valB = Number(b.balance_qty ?? b.balance ?? b.in_qty ?? 0);
                    return valA - valB;
                case 'shortfall_desc':
                    valA = Number(a.shortfall ?? 0);
                    valB = Number(b.shortfall ?? 0);
                    return valB - valA;
                case 'shortfall_asc':
                    valA = Number(a.shortfall ?? 0);
                    valB = Number(b.shortfall ?? 0);
                    return valA - valB;
                case 'item_name_asc':
                    valA = String(a.item_name || a.account_name || '').toLowerCase();
                    valB = String(b.item_name || b.account_name || '').toLowerCase();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                case 'item_name_desc':
                    valA = String(a.item_name || a.account_name || '').toLowerCase();
                    valB = String(b.item_name || b.account_name || '').toLowerCase();
                    return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                case 'company_name_asc':
                    valA = String(a.company_name || a.last_supplier_name || '').toLowerCase();
                    valB = String(b.company_name || b.last_supplier_name || '').toLowerCase();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                case 'company_name_desc':
                    valA = String(a.company_name || a.last_supplier_name || '').toLowerCase();
                    valB = String(b.company_name || b.last_supplier_name || '').toLowerCase();
                    return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                case 'category_name_asc':
                    valA = String(a.category_name || '').toLowerCase();
                    valB = String(b.category_name || '').toLowerCase();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                case 'category_name_desc':
                    valA = String(a.category_name || '').toLowerCase();
                    valB = String(b.category_name || '').toLowerCase();
                    return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                case 'date_desc':
                    valA = String(a.date || '0');
                    valB = String(b.date || '0');
                    return valB.localeCompare(valA);
                case 'date_asc':
                    valA = String(a.date || '0');
                    valB = String(b.date || '0');
                    return valA.localeCompare(valB);
                default:
                    return 0;
            }
        });
    }, [data, sortBy]);

    const stats = [
        { label: 'Inventory Valuation', value: formatCurrency(totals.valuation), icon: Box, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
        { label: 'Analytic Items', value: data.length, icon: PackageSearch, color: 'text-blue-600', bg: 'bg-blue-600/10' },
        { label: 'Active Matrix', value: activeReport.title, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-600/10', isStatic: true },
        { label: 'Avg Valuation/Item', value: formatCurrency(data.length > 0 ? totals.valuation / data.length : 0), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-600/10' },
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
                                <h3 className={cn("text-xl font-black tabular-nums tracking-tighter truncate max-w-[200px] font-mono", stat.color)}>
                                    {stat.value}
                                </h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Data Table */}
            <Card className="bg-surface-0 border-border/50 shadow-xl rounded-sm overflow-hidden min-h-[500px] relative">
                <div className="p-5 border-b border-border/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface-1/30">
                    <div>
                        <h3 className="text-md font-black text-text-primary uppercase tracking-tight flex items-center gap-2 italic">
                             Inventory Analysis <span className="text-emerald-600">Engine</span>
                             <Badge variant="outline" className="bg-emerald-600/10 border-emerald-600/30 text-emerald-600 text-[9px] uppercase font-black rounded-none">
                                {activeReport.id}
                             </Badge>
                        </h3>
                        <p className="text-[9px] font-bold text-text-muted uppercase mt-1 tracking-widest opacity-60">
                            VALUATION: {params.valuation.replace('_', ' ')} | DATA POINTS: {data.length}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        
                        {/* Premium Sorting Dropdown */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 w-[190px] rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight focus:ring-0 focus:ring-offset-0 flex items-center gap-2">
                                <ArrowUpDown className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <SelectValue placeholder="SORT BY" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none bg-surface-0 border-border/50 text-[10px] font-bold uppercase tracking-tight">
                                {getSortOptions(reportId).map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-bold uppercase tracking-tight cursor-pointer hover:bg-surface-1 rounded-none">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" onClick={() => onExportPdf(sortBy)} className="h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2 italic">
                            <Printer className="h-3.5 w-3.5 text-emerald-500" /> Print PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onExportExcel(sortBy)} className="h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2 italic">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> Excel
                        </Button>
                    </div>
                </div>

                <div className="p-0">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                            <AlertCircle className="h-10 w-10 text-text-muted/20" />
                            <div>
                                <h3 className="text-lg font-black text-text-muted uppercase tracking-tighter italic opacity-40">No Data Synchronized</h3>
                                <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest">Adjust filters to begin intelligence aggregation.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                {(() => {
                                    const components: { [key: string]: React.FC<any> } = {
                                        'summary': StockSummary,
                                        'price_list': PriceList,
                                        'detail': StockDetail,
                                        'type_wise': StockTypeWise,
                                        'less_than_zero': StockNegativeAudit,
                                        'available_stock': StockAvailable,
                                        're_order_level': StockReOrderLevel,
                                    };

                                    const ActiveComponent = components[reportId] || StockSummary;
                                    return <ActiveComponent data={sortedData} formatCurrency={formatCurrency} params={params} />;
                                })()}
                            </Table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
