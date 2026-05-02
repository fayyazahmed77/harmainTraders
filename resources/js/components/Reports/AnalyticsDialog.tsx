import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Layers, Calculator } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import BillWiseCharts from '@/components/Reports/Charts/BillWiseCharts';
import PurchaseDetailsCharts from '@/components/Reports/Charts/PurchaseDetailsCharts';
import ItemWiseCharts from '@/components/Reports/Charts/ItemWiseCharts';
import PaymentWiseCharts from '@/components/Reports/Charts/PaymentWiseCharts';
import MonthWiseCharts from '@/components/Reports/Charts/MonthWiseCharts';

interface AnalyticsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    reportType: string;
    data: any[];
}

const AnalyticsDialog = ({ isOpen, onClose, reportType, data }: AnalyticsDialogProps) => {
    const { appearance } = useAppearance();
    const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Handle ESC key
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // KPI Calculations
    const kpis = useMemo(() => {
        if (!data || data.length === 0) return null;

        let total = 0;
        let avg = 0;
        let max = 0;
        const count = data.length;

        if (reportType === 'bill') {
            total = data.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
            max = Math.max(...data.map(r => Number(r.amount) || 0));
        } else if (reportType === 'details' || reportType === 'invoice_details') {
            total = data.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
            max = Math.max(...data.map(r => Number(r.amount) || 0));
        } else if (reportType === 'item') {
            total = data.reduce((acc, r) => acc + (Number(r.net_amount) || 0), 0);
            max = Math.max(...data.map(r => Number(r.net_amount) || 0));
        } else if (reportType === 'payment') {
            total = data.reduce((acc, r) => acc + (Math.abs(Number(r.balance)) || 0), 0);
            max = Math.max(...data.map(r => Math.abs(Number(r.balance)) || 0));
        } else if (reportType === 'month') {
            total = data.reduce((acc, r) => acc + (Number(r.total_amount) || 0), 0);
            max = Math.max(...data.map(r => Number(r.total_amount) || 0));
        }

        avg = total / (count || 1);

        return [
            { label: 'Total Volume', value: total, icon: Calculator, color: 'text-emerald-500' },
            { label: 'Average Value', value: avg, icon: TrendingUp, color: 'text-blue-500' },
            { label: 'Maximum Entry', value: max, icon: TrendingDown, color: 'text-rose-500' },
            { label: 'Total Records', value: count, icon: Layers, color: 'text-amber-500', isRaw: true },
        ];
    }, [data, reportType]);

    const formatVal = (val: number, isRaw?: boolean) => {
        if (isRaw) return val.toLocaleString();
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
    };

    const renderCharts = () => {
        const props = { data, isDark };
        switch (reportType) {
            case 'bill': return <BillWiseCharts {...props} />;
            case 'details':
            case 'invoice_details': return <PurchaseDetailsCharts {...props} />;
            case 'item': return <ItemWiseCharts {...props} />;
            case 'payment': return <PaymentWiseCharts {...props} />;
            case 'month': return <MonthWiseCharts {...props} />;
            default: return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md"
                    />

                    {/* Dialog Content */}
                    <motion.div
                        initial={{ y: 60, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 60, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative w-full max-w-7xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                    <span className="text-emerald-500">Purchase</span> Analytics
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                    Deep Data Intelligence & Performance Metrics
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* KPI Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-900/30">
                            {kpis?.map((kpi, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 + (idx * 0.1) }}
                                    className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-4 rounded-2xl flex items-center gap-4 group hover:border-emerald-500/50 transition-colors shadow-sm dark:shadow-none"
                                >
                                    <div className={`h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${kpi.color} shadow-inner`}>
                                        <kpi.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                            {formatVal(kpi.value, kpi.isRaw)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Charts Area */}
                        <div className="flex-1 bg-white dark:bg-slate-950/50 p-6 overflow-y-auto custom-scrollbar">
                            <div className="w-full min-h-[500px]">
                                {renderCharts()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                            <div className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                                Harmain Traders Analytics Engine v4.0 • Real-time Processing Active
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AnalyticsDialog;
