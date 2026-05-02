import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface KpiCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    delta?: number;
    delay?: number;
}

const KpiCard = ({ title, value, subtitle, icon: Icon, delta, delay = 0 }: KpiCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="h-full"
        >
            <Card className="flex flex-col h-full min-h-[140px] relative overflow-hidden border-white/5 bg-[#111318] p-5 transition-all hover:bg-[#181C23]">
                <div className="absolute top-0 left-0 h-1 w-full bg-[#C9A84C]/20" />
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">{title}</p>
                            <h3 className="mt-2 text-2xl font-bold text-[#F1F1F1]">{value}</h3>
                            <p className="mt-1 text-xs text-[#374151] truncate">{subtitle}</p>
                        </div>
                        <div className="rounded-lg bg-[#C9A84C]/10 p-2 text-[#C9A84C] shrink-0 ml-2">
                            <Icon size={18} />
                        </div>
                    </div>
                    
                    {delta !== undefined && (
                        <div className="mt-4 flex items-center gap-2">
                            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${delta >= 0 ? 'bg-green-500/10 text-[#22C55E]' : 'bg-red-500/10 text-[#EF4444]'}`}>
                                {delta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(delta)}%
                            </div>
                            <span className="text-[10px] font-medium text-[#374151]">vs last month</span>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

interface KpiCardRowProps {
    stats: {
        current_capital: number;
        initial_capital: number;
        ownership_percentage: number;
        available_balance: number;
        daily_estimate: number;
        yearly_projection: number;
        last_month_profit: number;
    };
}

export const KpiCardRow = ({ stats }: KpiCardRowProps) => {
    const formatPKR = (val: number) => `PKR ${val.toLocaleString()}`;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard 
                title="My Capital" 
                value={formatPKR(stats.current_capital)} 
                subtitle={`Initial: ${formatPKR(stats.initial_capital)}`}
                icon={DollarSign}
                delay={0.1}
            />
            <KpiCard 
                title="Ownership" 
                value={`${stats.ownership_percentage}%`} 
                subtitle="of total business pool"
                icon={PieChart}
                delay={0.2}
            />
            <KpiCard 
                title="This Month Profit" 
                value={formatPKR(stats.last_month_profit)} 
                subtitle="Distributed share"
                icon={TrendingUp}
                delta={12} // Placeholder delta, would be calculated from history
                delay={0.3}
            />
            <KpiCard 
                title="Daily Estimate" 
                value={formatPKR(stats.daily_estimate)} 
                subtitle="Avg based on trend"
                icon={Activity}
                delay={0.4}
            />
            <KpiCard 
                title="Yearly Projection" 
                value={formatPKR(stats.yearly_projection)} 
                subtitle="At current growth rate"
                icon={Calendar}
                delay={0.5}
            />
            <KpiCard 
                title="Available Balance" 
                value={formatPKR(stats.available_balance)} 
                subtitle="Ready for withdrawal"
                icon={DollarSign}
                delay={0.6}
            />
        </div>
    );
};
