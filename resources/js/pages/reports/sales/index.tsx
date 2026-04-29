// Sales Report Engine - Module Sync Trigger
import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Search, BarChart3, LayoutDashboard } from 'lucide-react';
import { ParameterForm } from './components/ParameterForm';
import { ReportView } from './components/reports/ReportView';
import { salesReports } from './constants/salesReports';
import { route } from 'ziggy-js';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAppearance } from '@/hooks/use-appearance';

interface PageProps {
    customers: any[];
    items: any[];
    firms: any[];
    salesmen: any[];
    areas: any[];
    categories: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Reports", href: "/reports" },
    { title: "Sales Playground", href: "/reports/sales" },
];

export default function SalesReportsIndex({ customers, items, firms, salesmen, areas, categories }: PageProps) {
    const { appearance } = useAppearance();
    const isDark = appearance === 'dark';

    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [params, setParams] = useState({
        reportId: 'bill',
        fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        customerId: 'ALL',
        itemId: 'ALL',
        salesmanId: 'ALL',
        areaId: 'ALL',
        firmId: 'ALL',
        categoryId: 'ALL',
        printOn: 'screen'
    });

    const fetchReportData = async () => {
        if (params.printOn === 'pdf' || params.printOn === 'excel') {
            handleExport(params.printOn === 'pdf' ? 'pdf' : 'excel');
            return;
        }

        setHasSearched(true);
        setLoading(true);
        try {
            const endpoint = route('reports.sales.data');
            const response = await axios.get(endpoint, {
                params: {
                    ...params,
                    fromDate: format(new Date(params.fromDate), 'yyyy-MM-dd'),
                    toDate: format(new Date(params.toDate), 'yyyy-MM-dd'),
                },
                headers: { 'Accept': 'application/json' }
            });

            setReportData(response.data?.data || []);
            toast.success("Intelligence Aggregated", {
                description: `${(response.data?.data || []).length} sales matrix points processed.`
            });
        } catch (error: any) {
            console.error("Failed to fetch report data", error);
            const message = error.response?.data?.message || "Analysis Engine Failure";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        let baseUrl = '';
        switch(type) {
            case 'pdf': baseUrl = route('reports.sales.export'); break;
            case 'excel': baseUrl = route('reports.sales.excel'); break;
        }

        const queryParams = new URLSearchParams({
            ...params as any,
            fromDate: format(new Date(params.fromDate), 'yyyy-MM-dd'),
            toDate: format(new Date(params.toDate), 'yyyy-MM-dd'),
        });

        window.open(`${baseUrl}?${queryParams.toString()}`, '_blank');
    };

    const getCriteriaString = () => {
        const parts = [];
        parts.push(`${format(new Date(params.fromDate), 'dd/MM/yyyy')} TO ${format(new Date(params.toDate), 'dd/MM/yyyy')}`);
        
        if (params.customerId !== 'ALL') {
            const acc = customers.find(a => a.id.toString() === params.customerId);
            if (acc) parts.push(`CUSTOMER: ${acc.title}`);
        }
        
        return parts.join(' | ');
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background selection:bg-indigo-500/30">
                <Head title="Sales Analysis Playground" />
                <SiteHeader breadcrumbs={breadcrumbs} />
                
                <div className="relative min-h-screen bg-transparent transition-colors duration-500">
                    {/* Background Decor - Adaptive to Theme (Using Indigo for Sales) */}
                    <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-full max-w-[1600px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                    
                    <div className="relative p-6 md:p-10 max-w-[1640px] mx-auto space-y-8">
                        
                        {/* Page Title Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-[2px] w-6 bg-indigo-600 rounded-full" />
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Sales Audit Module</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase italic drop-shadow-sm">
                                    Sales <span className="text-indigo-600">Playground</span>
                                </h1>
                                <div className="text-text-secondary/60 text-[10px] font-black uppercase tracking-[0.15em] mt-3 flex items-center gap-2">
                                    <div className="h-1 w-1 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,1)]" />
                                    Deep visibility into revenue performance and territory metrics
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={fetchReportData}
                                    disabled={loading}
                                    className="h-12 px-6 bg-surface-1 border border-border/40 rounded-sm text-text-primary hover:bg-surface-0 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm group"
                                >
                                    <RefreshCcw className={`h-4 w-4 text-indigo-600 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                    Sync Intelligence
                                </button>
                            </div>
                        </div>

                        {/* Main Parameter Form */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <ParameterForm 
                                params={params} 
                                setParams={setParams} 
                                onSearch={fetchReportData}
                                loading={loading}
                                customers={customers}
                                items={items}
                                firms={firms}
                                salesmen={salesmen}
                                areas={areas}
                                categories={categories}
                            />
                        </motion.div>

                        {/* Report Results */}
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
                                    <h3 className="text-xl font-black text-text-muted uppercase tracking-tighter italic">Ready to Analyze</h3>
                                    <p className="text-[9px] font-bold text-text-muted/40 mt-2 uppercase tracking-[0.2em] max-w-sm text-center">Configure your sales dimensions and triggers above to start auditing</p>
                                </motion.div>
                            ) : loading ? (
                                <motion.div 
                                    key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="h-[50vh] flex flex-col items-center justify-center bg-surface-1/40 rounded-sm border border-dashed border-border/50"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-600/20 blur-2xl rounded-full" />
                                        <RefreshCcw className="h-10 w-10 text-indigo-600 animate-spin relative z-10" />
                                    </div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase mt-8 tracking-[0.4em] animate-pulse">Processing Sales Matrix...</p>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="data" 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
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
