import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { KpiCardRow } from './components/KpiCardRow';
import { ProfitChart } from './components/ProfitChart';
import { RequestModals } from './components/RequestModals';
import { Button } from '@/components/ui/button';
import { 
    History, 
    ArrowRightLeft, 
    FileText, 
    PlusCircle, 
    ArrowUpCircle, 
    ArrowDownCircle,
    ChevronRight,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    investor: {
        id: number;
        name: string;
        status: string;
        joining_date: string;
    };
    stats: {
        current_capital: number;
        initial_capital: number;
        ownership_percentage: number;
        available_balance: number;
        daily_estimate: number;
        yearly_projection: number;
        last_month_profit: number;
    };
    charts: {
        profit_history: any[];
    };
    requests: {
        pending: any[];
    };
}

export default function Dashboard({ investor, stats, charts, requests }: Props) {
    const [modalType, setModalType] = useState<'reinvest' | 'withdraw_profit' | 'withdraw_capital' | null>(null);

    const breadcrumbs = [
        { title: 'Investor Panel', href: '/investor/dashboard' },
        { title: 'Dashboard', href: '/investor/dashboard' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Investor Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-bold tracking-tight text-[#F1F1F1]"
                        >
                            Welcome back, {investor.name}
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-sm text-[#6B7280]"
                        >
                            Investor since {new Date(investor.joining_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </motion.p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button 
                            onClick={() => setModalType('reinvest')}
                            className="bg-[#C9A84C] text-[#0A0C10] hover:bg-[#C9A84C]/90"
                        >
                            <PlusCircle size={16} className="mr-2" /> Reinvest Profit
                        </Button>
                        <Button 
                            onClick={() => setModalType('withdraw_profit')}
                            variant="outline" 
                            className="border-white/5 bg-[#181C23] text-[#F1F1F1] hover:bg-[#22272e]"
                        >
                            <ArrowDownCircle size={16} className="mr-2" /> Withdraw Profit
                        </Button>
                        <Button 
                            onClick={() => setModalType('withdraw_capital')}
                            variant="outline" 
                            className="border-[#EF4444]/20 bg-[#181C23] text-[#EF4444] hover:bg-[#EF4444]/5"
                        >
                            <Landmark size={16} className="mr-2" /> Withdraw Capital
                        </Button>
                    </div>
                </div>

                {/* KPI Row */}
                <KpiCardRow stats={stats} />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Chart */}
                    <div className="lg:col-span-2">
                        <ProfitChart data={charts.profit_history} />
                    </div>

                    {/* Side Sidebar / Quick Info */}
                    <div className="flex flex-col gap-6">
                        {/* Pending Requests */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <div className="rounded-lg border border-white/5 bg-[#111318] p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#F1F1F1]">
                                        <Clock size={16} className="text-[#C9A84C]" /> Pending Requests
                                    </h3>
                                    <Link href="/investor/requests" className="text-[10px] text-[#6B7280] hover:text-[#C9A84C]">
                                        View All
                                    </Link>
                                </div>
                                <div className="space-y-3">
                                    {requests.pending.length > 0 ? (
                                        requests.pending.map((req) => (
                                            <div key={req.id} className="flex items-center justify-between rounded-md bg-[#181C23] p-3 border-l-2 border-[#C9A84C]">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-tighter text-[#6B7280]">
                                                        {req.request_type.replace('_', ' ')}
                                                    </p>
                                                    <p className="text-sm font-semibold text-[#F1F1F1]">PKR {req.amount.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-[#374151]">
                                                        {new Date(req.requested_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="py-4 text-center text-xs text-[#374151]">No pending requests</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Navigation Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="grid grid-cols-1 gap-3"
                        >
                            <Link href="/investor/transactions" className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111318] p-4 transition-colors hover:bg-[#181C23] group">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-md bg-[#3B82F6]/10 p-2 text-[#3B82F6]">
                                        <ArrowRightLeft size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#F1F1F1]">Transaction Ledger</p>
                                        <p className="text-[10px] text-[#6B7280]">Full audit trail of your funds</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-[#374151] group-hover:text-[#F1F1F1]" />
                            </Link>

                            <Link href="/investor/profit/history" className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111318] p-4 transition-colors hover:bg-[#181C23] group">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-md bg-[#22C55E]/10 p-2 text-[#22C55E]">
                                        <History size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#F1F1F1]">Profit Distributions</p>
                                        <p className="text-[10px] text-[#6B7280]">Monthly performance history</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-[#374151] group-hover:text-[#F1F1F1]" />
                            </Link>

                            <a href="/investor/transactions/export-pdf" target="_blank" className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111318] p-4 transition-colors hover:bg-[#181C23] cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-md bg-[#C9A84C]/10 p-2 text-[#C9A84C]">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#F1F1F1]">Download Ledger</p>
                                        <p className="text-[10px] text-[#6B7280]">Full transaction audit trail (PDF)</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-[#374151] group-hover:text-[#F1F1F1]" />
                            </a>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <RequestModals 
                isOpen={!!modalType} 
                onClose={() => setModalType(null)} 
                type={modalType || 'reinvest'} 
                availableBalance={stats.available_balance}
                currentCapital={stats.current_capital}
            />
        </AppLayout>
    );
}

// Landmark icon import fix
import { Landmark } from 'lucide-react';
