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
        >
            <Card className="relative overflow-hidden border-white/5 bg-[#111318] p-5 transition-all hover:bg-[#181C23]">
                <div className="absolute top-0 left-0 h-1 w-full bg-[#C9A84C]/20" />
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">{title}</p>
                        <h3 className="mt-2 text-2xl font-bold text-[#F1F1F1]">{value}</h3>
                        <p className="mt-1 text-xs text-[#374151]">{subtitle}</p>
                    </div>
                    <div className="rounded-lg bg-[#C9A84C]/10 p-2 text-[#C9A84C]">
                        <Icon size={20} />
                    </div>
                </div>
                {delta !== undefined && (
                    <div className="mt-4 flex items-center gap-1">
                        {delta >= 0 ? (
                            <span className="flex items-center gap-0.5 text-xs font-medium text-[#22C55E]">
                                <TrendingUp size={12} />
                                {delta}%
                            </span>
                        ) : (
                            <span className="flex items-center gap-0.5 text-xs font-medium text-[#EF4444]">
                                <TrendingDown size={12} />
                                {Math.abs(delta)}%
                            </span>
                        )}
                        <span className="text-[10px] text-[#374151]">vs last month</span>
                    </div>
                )}
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
