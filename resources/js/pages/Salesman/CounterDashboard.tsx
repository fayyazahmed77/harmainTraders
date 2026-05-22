import React from 'react';
import TopNavBar from '@/components/Counter/TopNavBar';
import KpiCards from '@/components/Counter/KpiCards';
import InvoiceTable from '@/components/Counter/InvoiceTable';
import PaymentMethodsPanel from '@/components/Counter/PaymentMethodsPanel';
import HourlySalesChart from '@/components/Counter/HourlySalesChart';
import TopProductsPanel from '@/components/Counter/TopProductsPanel';
import QuickActionsAlerts from '@/components/Counter/QuickActionsAlerts';
import ShiftSummaryPanel from '@/components/Counter/ShiftSummaryPanel';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface CounterDashboardProps {
    kpis: any[];
    todayInvoices: any[];
    weekInvoices: any[];
    monthInvoices: any[];
    paymentMethods: any[];
    trendData: any[];
    hourlyData: any[];
    topProducts: any[];
    shiftSummary: any;
    alerts: any[];
}

export default function CounterDashboard({
    kpis = [],
    todayInvoices = [],
    weekInvoices = [],
    monthInvoices = [],
    paymentMethods = [],
    trendData = [],
    hourlyData = [],
    topProducts = [],
    shiftSummary = {},
    alerts = []
}: CounterDashboardProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Counter Dashboard', href: '/salesman/dashboard' }]}>
            <Head title="Counter Dashboard - Harmain Traders" />
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-3 bg-gray-50 dark:bg-gray-950 text-foreground font-sans">
                <div className="mx-auto w-full flex flex-col gap-3">
                    
                    {/* KPI Row */}
                    <KpiCards kpis={kpis} />
                    
                    {/* Invoice + Payment Panel Row */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] gap-3">
                        <InvoiceTable 
                            todayInvoices={todayInvoices} 
                            weekInvoices={weekInvoices} 
                            monthInvoices={monthInvoices} 
                        />
                        <PaymentMethodsPanel 
                            paymentMethods={paymentMethods} 
                            trendData={trendData} 
                        />
                    </div>
                    
                    {/* Hourly Sales Chart Row */}
                    <HourlySalesChart hourlyData={hourlyData} />
                    
                    {/* Bottom Row - 3 equal columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <TopProductsPanel topProducts={topProducts} />
                        <QuickActionsAlerts alerts={alerts} />
                        <ShiftSummaryPanel shiftSummary={shiftSummary} />
                    </div>
                    
                </div>
            </div>
        </AppLayout>
    );
}
