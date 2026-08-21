import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    BarChart2, 
    TrendingUp, 
    ShoppingCart, 
    Package, 
    Printer, 
    Download, 
    RotateCcw, 
    Loader2 
} from 'lucide-react';
import { AnalyticsKpiGrid } from './components/AnalyticsKpiGrid';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AnalyticsFilterBar } from './components/AnalyticsFilterBar';
import { AnalyticsDataTable } from './components/AnalyticsDataTable';

interface AnalyticsIndexProps {
    initialAnalytics: any;
    filters: any;
    companies: any[];
    customers: any[];
    suppliers: any[];
    categories: any[];
    firms: any[];
    items: any[];
    salesmen: any[];
}

export default function AnalyticsIndex({
    initialAnalytics,
    filters: initialFilters,
    companies,
    customers,
    suppliers,
    categories,
    firms,
    items,
    salesmen,
}: AnalyticsIndexProps) {
    const [filters, setFilters] = useState(initialFilters);
    const [analytics, setAnalytics] = useState(initialAnalytics);
    const [loading, setLoading] = useState(false);

    const fetchAnalyticsData = async (currentFilters: any) => {
        setLoading(true);
        try {
            const query = new URLSearchParams(currentFilters).toString();
            const response = await fetch(`/reports/analytics/data?${query}`);
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error("Failed to load analytics data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        fetchAnalyticsData(newFilters);
    };

    const handleReportTypeChange = (type: string) => {
        const updated = { ...filters, reportType: type };
        setFilters(updated);
        fetchAnalyticsData(updated);
    };

    return (
        <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "16rem", "--header-height": "3.5rem" } as React.CSSProperties}>
            <Head title="Haramain Traders | Analytics & Business Intelligence" />
            <AppSidebar variant="inset" />
            
            <SidebarInset className="bg-background selection:bg-emerald-500/30 min-h-screen flex flex-col">
                <SiteHeader breadcrumbs={[
                    { title: "Reports", href: "/reports" },
                    { title: "Analytics & Intelligence", href: "/reports/analytics" }
                ]} />

                <main className="flex-1 p-4 md:p-6 space-y-6 max-w-[1700px] w-full mx-auto">
                    {/* Module Header & Report Type Selector */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/20 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                                    <BarChart2 className="h-5 w-5" />
                                </div>
                                <h1 className="text-xl font-black text-text-primary tracking-tight">
                                    Analytics & Business Intelligence
                                </h1>
                            </div>
                            <p className="text-xs font-mono text-text-muted mt-1">
                                Executive insights, period comparisons, and transaction trends across ERP operations.
                            </p>
                        </div>
 
                        {/* Report Type Segmented Control */}
                        <div className="flex items-center gap-1.5 p-1.5 bg-surface-1/80 border border-border/40 rounded-2xl shadow-inner backdrop-blur-md">
                            <button
                                onClick={() => handleReportTypeChange('sales')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    filters.reportType === 'sales'
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-0/50'
                                }`}
                            >
                                <TrendingUp className="h-4 w-4" />
                                Sales Analytics
                            </button>
                            <button
                                onClick={() => handleReportTypeChange('purchase')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    filters.reportType === 'purchase'
                                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 scale-[1.02]'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-0/50'
                                }`}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Purchase Analytics
                            </button>
                            <button
                                onClick={() => handleReportTypeChange('stock')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    filters.reportType === 'stock'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-0/50'
                                }`}
                            >
                                <Package className="h-4 w-4" />
                                Stock Analytics
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Filter Controls */}
                    <AnalyticsFilterBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        companies={companies}
                        customers={customers}
                        suppliers={suppliers}
                        categories={categories}
                        firms={firms}
                        items={items}
                        loading={loading}
                    />

                    {/* Loading Overlay or Content Grid */}
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-surface-1/40 rounded-2xl border border-border/20">
                            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                            <span className="text-xs font-black font-mono uppercase tracking-widest text-text-muted">
                                Computing Analytics & Aggregating Insights...
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Executive KPI Cards */}
                            <AnalyticsKpiGrid
                                reportType={filters.reportType}
                                kpis={analytics.kpis}
                            />

                            {/* Business Intelligence Visualizations */}
                            <AnalyticsCharts
                                reportType={filters.reportType}
                                data={analytics}
                            />

                            {/* Underlying Table Explorer */}
                            <AnalyticsDataTable
                                reportType={filters.reportType}
                                tableData={analytics.tableData}
                            />
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
