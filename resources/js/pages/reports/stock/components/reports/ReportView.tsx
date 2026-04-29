import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
    Box, 
    Printer, 
    FileSpreadsheet, 
    TrendingUp, 
    List, 
    BarChart3,
    AlertCircle,
    PackageSearch
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

interface ReportViewProps {
    reportId: string;
    data: any[];
    loading: boolean;
    onExportPdf: () => void;
    onExportExcel: () => void;
    params: any;
}

export function ReportView({ 
    reportId, 
    data, 
    loading, 
    onExportPdf, 
    onExportExcel,
    params
}: ReportViewProps) {
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
                <div className="p-5 border-b border-border/50 flex items-center justify-between bg-surface-1/30">
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
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onExportPdf} className="h-9 rounded-sm border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2 italic">
                            <Printer className="h-3.5 w-3.5 text-emerald-500" /> Print PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={onExportExcel} className="h-9 rounded-sm border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2 italic">
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
                                    };

                                    const ActiveComponent = components[reportId] || StockSummary;
                                    return <ActiveComponent data={data} formatCurrency={formatCurrency} params={params} />;
                                })()}
                            </Table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
