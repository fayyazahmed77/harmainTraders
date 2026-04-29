import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Search } from 'lucide-react';
import { ParameterForm } from './components/ParameterForm';
import { ReportView } from './components/reports/ReportView';
import { route } from 'ziggy-js';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PageProps {
    items: any[];
    companies: any[];
    categories: any[];
    firms: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Reports", href: "/reports" },
    { title: "Stock Playground", href: "/reports/stock" },
];

export default function StockReportsIndex({ items, companies, categories, firms }: PageProps) {
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [params, setParams] = useState({
        reportId: 'summary',
        fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 01.01.2000 from image, but let's use current year start
        toDate: new Date().toISOString().split('T')[0],
        deadStockDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        itemId: 'ALL',
        companyId: 'ALL',
        categoryId: 'ALL',
        itemType: 'ALL',
        firmId: 'ALL',
        godownId: 'ALL',
        supplierId: 'ALL',
        valuation: 'last_purchase',
        displayOption: 'all',
        withAmount: true,
        showTP: true,
        showPT2: false,
        showPT3: false,
        showPT4: false,
        showPT5: false,
        showPT6: false,
        showPT7: false,
        showRetail: true,
        sortBy: 'ITEM_DESC',
        printOn: 'screen'
    });

    const fetchReportData = async () => {
        setHasSearched(true);
        setLoading(true);
        
        // Artificial delay to showcase the processing animations
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const endpoint = route('reports.stock.data');
            const response = await axios.get(endpoint, {
                params: {
                    ...params,
                    fromDate: format(new Date(params.fromDate), 'yyyy-MM-dd'),
                    toDate: format(new Date(params.toDate), 'yyyy-MM-dd'),
                }
            });

            setReportData(response.data?.data || []);
            toast.success("Inventory Synchronized", {
                description: `${(response.data?.data || []).length} stock matrix points processed.`
            });
        } catch (error: any) {
            console.error("Failed to fetch report data", error);
            toast.error("Inventory Engine Failure");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        const baseUrl = type === 'pdf' ? route('reports.stock.export') : route('reports.stock.excel');
        const queryParams = new URLSearchParams({
            ...params as any,
            fromDate: format(new Date(params.fromDate), 'yyyy-MM-dd'),
            toDate: format(new Date(params.toDate), 'yyyy-MM-dd'),
        });
        window.open(`${baseUrl}?${queryParams.toString()}`, '_blank');
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background selection:bg-emerald-500/30">
                <Head title="Stock Analysis Playground" />
                <SiteHeader breadcrumbs={breadcrumbs} />
                
                <div className="relative min-h-screen bg-transparent">
                    {/* Background Decor (Emerald for Stock) */}
                    <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-600/5 to-transparent pointer-events-none" />
                    
                    <div className="relative p-6 md:p-10 max-w-[1640px] mx-auto space-y-8">
                        
                        {/* Page Title */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-[2px] w-6 bg-emerald-600 rounded-full" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Inventory Audit Module</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase italic">
                                    Stock <span className="text-emerald-600">Playground</span>
                                </h1>
                            </div>
                            
                            <button 
                                onClick={fetchReportData}
                                disabled={loading}
                                className="h-12 px-6 bg-surface-1 border border-border/40 rounded-sm text-text-primary hover:bg-surface-0 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm group"
                            >
                                <RefreshCcw className={`h-4 w-4 text-emerald-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                Sync Inventory
                            </button>
                        </div>

                        {/* Parameter Form */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <ParameterForm 
                                params={params} 
                                setParams={setParams} 
                                onSearch={fetchReportData}
                                loading={loading}
                                items={items}
                                companies={companies}
                                categories={categories}
                                firms={firms}
                            />
                        </motion.div>

                        {/* Results */}
                        <AnimatePresence mode="wait">
                            {!hasSearched ? (
                                <motion.div 
                                    key="empty"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-[50vh] flex flex-col items-center justify-center bg-surface-1/40 rounded-sm border border-dashed border-border/50"
                                >
                                    <div className="h-20 w-20 bg-surface-1 rounded-sm flex items-center justify-center mb-6 shadow-inner ring-1 ring-border/5">
                                        <Search className="h-8 w-8 text-text-muted/20" />
                                    </div>
                                    <h3 className="text-xl font-black text-text-muted uppercase tracking-tighter italic">Ready to Audit</h3>
                                    <p className="text-[9px] font-bold text-text-muted/40 mt-2 uppercase tracking-[0.2em]">Configure your inventory dimensions above</p>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="data" 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8 pb-20"
                                >
                                    <ReportView 
                                        reportId={params.reportId}
                                        data={reportData}
                                        loading={loading}
                                        onExportPdf={() => handleExport('pdf')}
                                        onExportExcel={() => handleExport('excel')}
                                        params={params}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
