import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { 
    DollarSign, 
    Printer, 
    FileText, 
    FileSpreadsheet, 
    TrendingUp, 
    List, 
    BarChart3,
    LayoutDashboard,
    ArrowUpDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { salesReturnReports } from '../../constants/salesReturnReports';
import AnalyticsButton from '@/components/Reports/AnalyticsButton';
import AnalyticsDialog from '@/components/Reports/AnalyticsDialog';
import * as Reports from './types';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';

// [ANIMATION] Custom Hook for Count-Up Animation
function useCountUp(target: number, duration = 1200, delay = 0) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let start: number;
        let frame: number;
        const timeout = setTimeout(() => {
            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                // easeOutExpo
                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                setValue(target * eased);
                if (progress < 1) frame = requestAnimationFrame(step);
            };
            frame = requestAnimationFrame(step);
        }, delay);
        return () => { 
            clearTimeout(timeout); 
            if (frame) cancelAnimationFrame(frame); 
        };
    }, [target, duration, delay]);
    return value;
}

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
        { value: 'amount_desc', label: 'Refund: High to Low' },
        { value: 'amount_asc', label: 'Refund: Low to High' },
    ];

    switch (reportId) {
        case 'bill':
            return [
                { value: 'default', label: 'Default Order' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'name_asc', label: 'Customer: A to Z' },
                { value: 'name_desc', label: 'Customer: Z to A' },
                { value: 'gross_desc', label: 'Gross: High to Low' },
                { value: 'gross_asc', label: 'Gross: Low to High' },
                { value: 'discount_desc', label: 'Discount: High to Low' },
                { value: 'discount_asc', label: 'Discount: Low to High' },
                { value: 'amount_desc', label: 'Refund Amount: High to Low' },
                { value: 'amount_asc', label: 'Refund Amount: Low to High' },
            ];
        case 'detail':
        case 'details_wise':
            return [
                { value: 'default', label: 'Default (Newest First)' },
                { value: 'date_desc', label: 'Date: Newest First' },
                { value: 'date_asc', label: 'Date: Oldest First' },
                { value: 'name_asc', label: 'Customer: A to Z' },
                { value: 'name_desc', label: 'Customer: Z to A' },
                { value: 'product_name_asc', label: 'Product: A to Z' },
                { value: 'product_name_desc', label: 'Product: Z to A' },
                { value: 'qty_desc', label: 'Quantity Cartons: High to Low' },
                { value: 'qty_asc', label: 'Quantity Cartons: Low to High' },
                { value: 'amount_desc', label: 'Refund: High to Low' },
                { value: 'amount_asc', label: 'Refund: Low to High' },
            ];
        case 'area_item_party':
            return [
                { value: 'default', label: 'Default Order' },
                { value: 'name_asc', label: 'Customer: A to Z' },
                { value: 'name_desc', label: 'Customer: Z to A' },
                { value: 'product_name_asc', label: 'Product: A to Z' },
                { value: 'product_name_desc', label: 'Product: Z to A' },
                { value: 'qty_desc', label: 'Quantity Cartons: High to Low' },
                { value: 'qty_asc', label: 'Quantity Cartons: Low to High' },
                { value: 'amount_desc', label: 'Refund: High to Low' },
                { value: 'amount_asc', label: 'Refund: Low to High' },
            ];
        case 'item_summary':
            return [
                { value: 'default', label: 'Default Order' },
                { value: 'product_name_asc', label: 'Product: A to Z' },
                { value: 'product_name_desc', label: 'Product: Z to A' },
                { value: 'gross_desc', label: 'Gross: High to Low' },
                { value: 'gross_asc', label: 'Gross: Low to High' },
                { value: 'discount_desc', label: 'Discount: High to Low' },
                { value: 'discount_asc', label: 'Discount: Low to High' },
                { value: 'amount_desc', label: 'Refund Amount: High to Low' },
                { value: 'amount_asc', label: 'Refund Amount: Low to High' },
            ];
        case 'month':
            return [
                { value: 'default', label: 'Default Order' },
                { value: 'name_asc', label: 'Customer: A to Z' },
                { value: 'name_desc', label: 'Customer: Z to A' },
                { value: 'product_name_asc', label: 'Product: A to Z' },
                { value: 'product_name_desc', label: 'Product: Z to A' },
                { value: 'qty_desc', label: 'Quantity: High to Low' },
                { value: 'qty_asc', label: 'Quantity: Low to High' },
                { value: 'amount_desc', label: 'Refund: High to Low' },
                { value: 'amount_asc', label: 'Refund: Low to High' },
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
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [pdfFlash, setPdfFlash] = useState(false);
    const [excelFlash, setExcelFlash] = useState(false);
    
    // Reset sort option when report ID changes
    useEffect(() => {
        setSortBy('default');
    }, [reportId]);

    const activeReport = salesReturnReports.find(r => r.id === reportId) || salesReturnReports[0];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const totals = data.reduce((acc, row) => ({
        amount: acc.amount + (Number(row.amount) || Number(row.total_amount) || Number(row.net_total) || Number(row.net_amount) || 0),
        qty: acc.qty + (Number(row.qty) || Number(row.total_qty) || Number(row.qty_f) || Number(row.qty_full) || 0),
    }), { amount: 0, qty: 0 });

    const sortedData = useMemo(() => {
        if (sortBy === 'default') return data;

        const dataCopy = [...data];

        return dataCopy.sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            switch (sortBy) {
                case 'amount_desc':
                    valA = Number(a.amount || a.net_amount || 0);
                    valB = Number(b.amount || b.net_amount || 0);
                    return valB - valA;
                case 'amount_asc':
                    valA = Number(a.amount || a.net_amount || 0);
                    valB = Number(b.amount || b.net_amount || 0);
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
                    valA = Number(a.discount || a.disc_amt || 0);
                    valB = Number(b.discount || b.disc_amt || 0);
                    return valB - valA;
                case 'discount_asc':
                    valA = Number(a.discount || a.disc_amt || 0);
                    valB = Number(b.discount || b.disc_amt || 0);
                    return valA - valB;
                case 'qty_desc':
                    valA = Number(a.qty_full || a.qty_f || a.qty || 0);
                    valB = Number(b.qty_full || b.qty_f || b.qty || 0);
                    return valB - valA;
                case 'qty_asc':
                    valA = Number(a.qty_full || a.qty_f || a.qty || 0);
                    valB = Number(b.qty_full || b.qty_f || b.qty || 0);
                    return valA - valB;
                case 'date_desc':
                    valA = String(a.date || a.month_name || '0');
                    valB = String(b.date || b.month_name || '0');
                    return valB.localeCompare(valA);
                case 'date_asc':
                    valA = String(a.date || a.month_name || '0');
                    valB = String(b.date || b.month_name || '0');
                    return valA.localeCompare(valB);
                case 'name_asc':
                    valA = String(a.customer_name || a.account_name || a.account_title || '').toLowerCase();
                    valB = String(b.customer_name || b.account_name || b.account_title || '').toLowerCase();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                case 'name_desc':
                    valA = String(a.customer_name || a.account_name || a.account_title || '').toLowerCase();
                    valB = String(b.customer_name || b.account_name || b.account_title || '').toLowerCase();
                    return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                case 'product_name_asc':
                    valA = String(a.product_name || a.item_name || a.item_description || '').toLowerCase();
                    valB = String(b.product_name || b.item_name || b.item_description || '').toLowerCase();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                case 'product_name_desc':
                    valA = String(a.product_name || a.item_name || a.item_description || '').toLowerCase();
                    valB = String(b.product_name || b.item_name || b.item_description || '').toLowerCase();
                    return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
                default:
                    return 0;
            }
        });
    }, [data, sortBy]);

    // [ANIMATION] Count-up values
    const animatedTotalReturns = useCountUp(totals.amount, 1200, 300);
    const animatedPoints = useCountUp(data.length, 1000, 100);
    const animatedAvg = useCountUp(data.length > 0 ? totals.amount / data.length : 0, 1200, 450);

    const stats = [
        { label: 'Total Returns', value: animatedTotalReturns, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-600/10', isCurrency: true },
        { label: 'Analytic points', value: Math.floor(animatedPoints), icon: List, color: 'text-red-600', bg: 'bg-red-600/10', isCurrency: false },
        { label: 'Active Matrix', value: activeReport.title, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-600/10', isCurrency: false, isStatic: true },
        { label: 'Avg / Point', value: animatedAvg, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-600/10', isCurrency: true },
    ];

    const criteria = `${params.fromDate} TO ${params.toDate} | DIMENSION: ${activeReport.title}`;

    const handlePdfClick = () => {
        setPdfFlash(true);
        onExportPdf(sortBy);
        setTimeout(() => setPdfFlash(false), 600);
    };

    const handleExcelClick = () => {
        setExcelFlash(true);
        onExportExcel(sortBy);
        setTimeout(() => setExcelFlash(false), 600);
    };

    return (
        <div className="space-y-4">
            {/* [ANIMATION] Styles Injection */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { 
                    animation: slideUpFade 350ms cubic-bezier(0.16, 1, 0.3, 1) both; 
                }
                
                @keyframes progressBar {
                    0%   { width: 0%; margin-left: 0%; }
                    50%  { width: 70%; margin-left: 15%; }
                    100% { width: 0%; margin-left: 100%; }
                }
                .animate-progress-bar {
                    animation: progressBar 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
 
                @keyframes breathe {
                    0%, 100% { opacity: 0.6; }
                    50%       { opacity: 1; }
                }
                .animate-breathe { animation: breathe 3s ease-in-out infinite; }
 
                @keyframes scanLine {
                    0%   { top: 20%; opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: 1; }
                    100% { top: 80%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scanLine 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
 
                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after { 
                        animation-duration: 0.01ms !important; 
                        transition-duration: 0.01ms !important;
                    }
                }
            `}} />

            {/* Executive Highlights */}
            <div key={data.length} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card 
                        key={i} 
                        className="p-4 bg-surface-1/40 border-border/50 shadow-sm rounded-sm backdrop-blur-md animate-slide-up will-change-transform"
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn("h-10 w-10 rounded-sm flex items-center justify-center", stat.bg)}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{stat.label}</p>
                                <h3 className={cn("text-xl font-black tabular-nums tracking-tighter truncate max-w-[150px] font-mono", stat.color)}>
                                    {stat.isStatic ? stat.value : (stat.isCurrency ? formatCurrency(stat.value as number) : stat.value)}
                                </h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Data Table Container */}
            <Card 
                key={reportId + data.length}
                className="bg-surface-0 border-border/50 shadow-xl rounded-sm overflow-hidden ring-1 ring-border/5 min-h-[500px] relative animate-slide-up will-change-transform"
                style={{ animationDelay: '320ms', animationDuration: '400ms' }}
            >
                {/* [ANIMATION] Top Progress Bar when loading */}
                <div className={cn(
                    "absolute top-0 left-0 right-0 h-[2px] bg-orange-600/10 overflow-hidden rounded-none z-50 transition-opacity duration-300",
                    loading ? "opacity-100" : "opacity-0"
                )}>
                    <div className="h-full bg-orange-600 animate-progress-bar" />
                </div>

                <div className={cn(
                    "absolute inset-0 bg-surface-0/60 backdrop-blur-[2px] z-40 flex items-center justify-center transition-opacity duration-300",
                    loading ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    <div className="w-full h-full p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="h-3 w-6 rounded-sm bg-border/20" />
                                <div className="h-3 w-16 rounded-sm bg-border/20" />
                                <div className="h-3 w-20 rounded-sm bg-border/20" />
                                <div className="h-3 w-28 rounded-sm bg-border/20" />
                                <div className="h-3 w-20 rounded-sm bg-border/20" />
                                <div className="h-3 w-16 rounded-sm bg-border/20" />
                                <div className="h-3 w-12 rounded-sm bg-border/20" />
                                <div className="h-3 w-16 rounded-sm bg-border/20" />
                                <div className="h-3 w-16 rounded-sm bg-border/20" />
                                <div className="h-3 w-14 rounded-sm bg-border/20" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-5 border-b border-border/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface-1/30">
                    <div>
                        <h3 className="text-md font-black text-text-primary uppercase tracking-tight flex items-center gap-2 italic">
                             Return Analysis <span className="text-orange-600">Engine</span>
                             <Badge variant="outline" className="bg-orange-600/10 border-orange-600/30 text-orange-600 text-[9px] uppercase font-black rounded-none">
                                {activeReport.id}
                             </Badge>
                        </h3>
                        <p className="text-[9px] font-bold text-text-muted uppercase mt-1 tracking-widest opacity-60">{criteria}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        {/* [ANIMATION] Analytics Button heartbeat */}
                        <div className="animate-breathe">
                            <AnalyticsButton 
                                onClick={() => setIsAnalyticsOpen(true)} 
                                className="border-orange-600/20 bg-orange-600/10 text-orange-600 hover:bg-orange-600 hover:text-white"
                                icon={
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-orange-600/20 rounded-sm animate-ping opacity-40" />
                                        <BarChart3 className="relative h-4 w-4 text-orange-600 group-hover:text-white transition-colors" />
                                    </div>
                                } 
                            />
                        </div>
                        
                        <div className="h-4 w-[1px] bg-border mx-1 hidden lg:block" />

                        {/* Premium Sorting Dropdown */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 w-[190px] rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight focus:ring-0 focus:ring-offset-0 flex items-center gap-2">
                                <ArrowUpDown className="h-3.5 w-3.5 text-orange-600 shrink-0" />
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
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handlePdfClick} 
                            className={cn(
                                "h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2 italic transition-all active:scale-95 duration-150",
                                pdfFlash ? "bg-orange-600 text-white border-orange-600" : ""
                            )}
                        >
                            <Printer className={cn("h-3.5 w-3.5 transition-colors", pdfFlash ? "text-white" : "text-orange-500")} /> Print PDF
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleExcelClick} 
                            className={cn(
                                "h-9 rounded-none border-border/50 bg-surface-1 hover:bg-surface-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2 italic transition-all active:scale-95 duration-150",
                                excelFlash ? "bg-emerald-600 text-white border-emerald-600" : ""
                            )}
                        >
                            <FileSpreadsheet className={cn("h-3.5 w-3.5 transition-colors", excelFlash ? "text-white" : "text-emerald-500")} /> Excel
                        </Button>
                    </div>
                </div>

                <div className="p-0 relative">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4 relative">
                            {/* [ANIMATION] Empty state scan line */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-600/20 to-transparent animate-scan-line" />
                            </div>

                            <div className="h-20 w-20 bg-surface-1 rounded-sm flex items-center justify-center text-text-muted/10 ring-1 ring-border/5">
                                <LayoutDashboard className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-text-muted uppercase tracking-tighter italic opacity-40">No Data Synchronized</h3>
                                <p className="text-[9px] font-black text-text-muted/30 max-w-[250px] mx-auto uppercase tracking-widest">Adjust filters to begin intelligence aggregation.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                {(() => {
                                    const components: { [key: string]: React.FC<any> } = {
                                        bill: Reports.BillReport,
                                        detail: Reports.DetailsReport,
                                        details_wise: Reports.InvoiceDetailsReport,
                                        area_item_party: Reports.AreaItemPartyReport,
                                        item_summary: Reports.ItemSummaryReport,
                                        month: Reports.MonthReport,
                                    };

                                    const ActiveComponent = components[reportId] || Reports.BillReport;
                                    return <ActiveComponent data={sortedData} formatCurrency={formatCurrency} />;
                                })()}
                            </Table>
                        </div>
                    )}
                </div>
            </Card>

            <AnalyticsDialog 
                isOpen={isAnalyticsOpen} 
                onClose={() => setIsAnalyticsOpen(false)} 
                reportType={reportId} 
                data={sortedData} 
            />
        </div>
    );
}
