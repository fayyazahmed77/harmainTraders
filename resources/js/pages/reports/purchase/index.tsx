import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { subMonths, format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { BreadcrumbItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Search, LayoutDashboard } from 'lucide-react';
import { PurchaseParameterForm } from './components/PurchaseParameterForm';
import { PurchaseReportView } from './components/reports/PurchaseReportView';
import { useAppearance } from '@/hooks/use-appearance';

interface PageProps {
    accounts: any[];
    items: any[];
    firms: any[];
    areas: any[];
    sub_areas: any[];
    categories: any[];
    salesmen: any[];
    users: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Reports", href: "/reports" },
    { title: "Purchase Playground", href: "/reports/purchase" },
];

export default function PurchaseReports({ accounts, items, firms, areas, sub_areas, categories, salesmen, users }: PageProps) {
    const { appearance } = useAppearance();
    const isDark = appearance === 'dark';

    const [params, setParams] = useState({
        fromDate: subMonths(new Date(), 1),
        toDate: new Date(),
        accountId: 'ALL',
        itemId: 'ALL',
        reportId: 'transaction',
        firmId: 'ALL',
        areaId: 'ALL',
        subAreaId: 'ALL',
        categoryId: 'ALL',
        salesmanId: 'ALL',
        userId: 'ALL',
        printOn: 'screen',
    });

    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const fetchData = async () => {
        setHasSearched(true);
        
        if (params.printOn === 'pdf' || params.printOn === 'printer') {
            handleExport(params.printOn === 'pdf' ? 'pdf' : 'print');
            return;
        }

        setLoading(true);
        try {
            const endpoint = route('reports.purchase.data');
            const response = await axios.get(endpoint, {
                params: {
                    ...params,
                    fromDate: format(params.fromDate, 'yyyy-MM-dd'),
                    toDate: format(params.toDate, 'yyyy-MM-dd'),
                },
                headers: { 'Accept': 'application/json' }
            });

            setReportData(response.data?.data || []);
            toast.success("Analysis Complete", {
                description: `${(response.data?.data || []).length} procurement records processed.`
            });
        } catch (error: any) {
            console.error("Failed to fetch purchase report", error);
            const message = error.response?.data?.message || "Failed to load purchase data";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type: 'pdf' | 'excel' | 'print') => {
        let baseUrl = '';
        switch(type) {
            case 'pdf': baseUrl = route('reports.purchase.export'); break;
            case 'excel': baseUrl = route('reports.purchase.excel'); break;
            case 'print': baseUrl = route('reports.purchase.print'); break;
        }

        const queryParams = new URLSearchParams({
            ...params as any,
            fromDate: params.fromDate.toISOString(),
            toDate: params.toDate.toISOString(),
        });

        window.open(`${baseUrl}?${queryParams.toString()}`, '_blank');
    };

    const getCriteriaString = () => {
        const parts = [];
        parts.push(`${format(params.fromDate, 'dd/MM/yyyy')} TO ${format(params.toDate, 'dd/MM/yyyy')}`);
        
        if (params.accountId !== 'ALL') {
            const acc = accounts.find(a => a.id.toString() === params.accountId);
            if (acc) parts.push(`SUPPLIER: ${acc.title}`);
        }
        
        return parts.join(' | ');
    }

    return (
        <>
            <Head title="Purchase Analysis Playground" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-background selection:bg-emerald-500/30">
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    
                    <div className="relative min-h-screen bg-transparent transition-colors duration-500">
                        {/* Background Decor - Adaptive to Theme (Using Emerald for Purchase) */}
                        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-600/5 to-transparent pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-full max-w-[1600px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                        
                        <div className="relative p-6 md:p-10 max-w-[1640px] mx-auto space-y-8">
                            
                            {/* Page Title Section */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-[2px] w-6 bg-emerald-500 rounded-full" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Procurement Audit</span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase italic drop-shadow-sm">
                                        Purchase <span className="text-emerald-500">Playground</span>
                                    </h1>
                                    <div className="text-text-secondary/60 text-[10px] font-black uppercase tracking-[0.15em] mt-3 flex items-center gap-2">
                                        <div className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                                        Deep Visibility into your procurement and supply efficiency
                                    </div>
                                </div>
                            </div>

                            {/* Main Parameter Form */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <PurchaseParameterForm 
                                    data={params} 
                                    setData={setParams} 
                                    onExecute={fetchData}
                                    bootstrap={{ accounts, items, firms, areas, sub_areas, categories, salesmen, users }} 
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
                                        <h3 className="text-xl font-black text-text-muted uppercase tracking-tighter">Ready to Analyze</h3>
                                        <p className="text-[9px] font-bold text-text-muted/40 mt-2 uppercase tracking-[0.2em] max-w-sm text-center">Configure your procurement dimensions and triggers above</p>
                                    </motion.div>
                                ) : loading ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="h-[50vh] flex flex-col items-center justify-center bg-surface-1/40 rounded-sm border border-dashed border-border/50"
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                                            <RefreshCcw className="h-10 w-10 text-emerald-500 animate-spin relative z-10" />
                                        </div>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase mt-8 tracking-[0.4em] animate-pulse">Aggregating Procurement Dimensions...</p>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="data" 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-8 pb-20"
                                    >
                                        <PurchaseReportView 
                                            data={reportData} 
                                            type={params.reportId} 
                                            criteria={getCriteriaString()} 
                                            onExport={handleExport}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
