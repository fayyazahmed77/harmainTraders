import React, { useMemo } from "react";
import { ShoppingCart, Calendar, TrendingUp, RefreshCcw, ArrowUpRight, Activity, Wallet, PieChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Purchase {
    id: number;
    date: string;
    net_total: number;
    paid_amount: number;
    status: string;
}

interface SummaryProps {
    summary: {
        total_purchase: number;
        total_paid: number;
        total_unpaid: number;
        total_returns: number;
        count: number;
    };
    purchases: Purchase[];
}

const PREMIUM_ROUNDING = "rounded-2xl";

export default function PurchaseSummary({ summary, purchases }: SummaryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount).replace('PKR', '₨').trim();
    };

    const netPurchase = summary.total_purchase - summary.total_returns;
    const paidPercentage = netPurchase > 0
        ? Math.round((summary.total_paid / netPurchase) * 100)
        : 0;
    const cappedPercentage = Math.min(100, Math.max(0, paidPercentage));

    // Process 7-Day Weekly Data
    const weeklyData = useMemo(() => {
        const days = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = subDays(today, i);
            const label = format(date, 'MMM dd');

            const dailyPurchase = purchases
                .filter(p => isSameDay(new Date(p.date), date))
                .reduce((acc, curr) => acc + Number(curr.net_total), 0);

            const dailyPayment = purchases
                .filter(p => isSameDay(new Date(p.date), date))
                .reduce((acc, curr) => acc + Number(curr.paid_amount), 0);

            days.push({
                date: label,
                purchase: dailyPurchase,
                payment: dailyPayment,
            });
        }
        return days;
    }, [purchases]);

    const getRecoveryStatus = () => {
        if (cappedPercentage < 40) return { label: "CRITICAL", color: "rose" };
        if (cappedPercentage < 80) return { label: "STABLE", color: "orange" };
        return { label: "OPTIMIZED", color: "emerald" };
    };

    const status = getRecoveryStatus();

    return (
        <div className="space-y-6">
            {/* 1. Tactical Intelligence Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    PREMIUM_ROUNDING,
                    "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm"
                )}
            >
                <div className="flex items-center gap-4 shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Intelligence Node</p>
                        <p className={cn(
                            "text-xs font-black tracking-widest uppercase flex items-center gap-2",
                            status.color === 'rose' ? "text-rose-500" : status.color === 'orange' ? "text-orange-500" : "text-emerald-500"
                        )}>
                            <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                            Procurement {status.label}
                        </p>
                    </div>
                </div>

                <div className="flex-1 w-full lg:max-w-2xl px-4">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Efficiency Benchmark</span>
                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100">{cappedPercentage}% RECOVERY</span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full p-[2px] shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cappedPercentage}%` }}
                            className={cn(
                                "h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.5)]",
                                status.color === 'rose' ? "bg-rose-500" : "bg-orange-500"
                            )}
                        />
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-6 border-l border-zinc-200 dark:border-zinc-800 pl-8 h-10">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Active Cycle</span>
                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase">12-Day Window</span>
                    </div>
                    <Calendar className="h-5 w-5 text-zinc-300" />
                </div>
            </motion.div>

            {/* 2. Analytical Core Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* PRIMARY METRIC: Cumulative Commitment */}
                <motion.div
                    whileHover={{ y: -4 }}
                    className={cn(
                        PREMIUM_ROUNDING,
                        "p-6 bg-zinc-900 border border-zinc-800 relative overflow-hidden group shadow-2xl"
                    )}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingCart className="h-32 w-32 text-orange-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 mb-6 font-black italic">
                            Σ
                        </div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1 leading-none">Total Procurement Value</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-6">
                            {formatCurrency(summary.total_purchase)}
                        </h3>

                        <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-zinc-800/50">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Ledger Count</span>
                                <span className="text-sm font-black text-white uppercase tabular-nums">{summary.count} ENTRIES</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Health Index</span>
                                <span className="text-sm font-black text-emerald-500 uppercase flex items-center">
                                    <ShieldCheck className="h-3.5 w-3.5 mr-1" /> OPTIMAL
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* SECONDARY METRIC: Recovery Index */}
                <motion.div
                    whileHover={{ y: -4 }}
                    className={cn(
                        PREMIUM_ROUNDING,
                        "p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-sm"
                    )}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <RefreshCcw className="h-4 w-4 text-zinc-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">Recovery Matrix</span>
                    </div>

                    <div className="flex items-center gap-8 flex-1">
                        <div className="relative h-24 w-24 shrink-0">
                            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle className="stroke-zinc-100 dark:stroke-zinc-800" cx="18" cy="18" r="15.9155" strokeWidth="3" fill="none" />
                                <motion.circle
                                    initial={{ strokeDasharray: "0, 100" }}
                                    animate={{ strokeDasharray: `${cappedPercentage}, 100` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="stroke-orange-500"
                                    cx="18" cy="18" r="15.9155"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter tabular-nums">{cappedPercentage}%</span>
                                <span className="text-[6px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Cleared</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {[
                                { label: "Settled", value: summary.total_paid, color: "text-zinc-900 dark:text-zinc-100" },
                                { label: "Returns", value: summary.total_returns, color: "text-zinc-500" },
                                { label: "Outstanding", value: summary.total_unpaid, color: "text-rose-500", highlight: true }
                            ].map((item) => (
                                <div key={item.label} className="flex flex-col">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none">{item.label}</span>
                                        <span className={cn("text-[11px] font-black tabular-nums tracking-tighter leading-none font-mono", item.color)}>
                                            {formatCurrency(item.value)}
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: Math.min(1, item.value / (summary.total_purchase || 1)) }}
                                            className={cn("h-full origin-left", item.highlight ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-700")}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* TERTIARY METRIC: Performance Visualization */}
                <motion.div
                    whileHover={{ y: -4 }}
                    className={cn(
                        PREMIUM_ROUNDING,
                        "p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-sm relative overflow-hidden"
                    )}
                >
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em] flex items-center">
                                <Activity className="h-3.5 w-3.5 mr-2 text-orange-500" /> Flux Logistics
                            </p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">7-Cycle Flux Matrix</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Inflow</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Outflow</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[160px] relative z-10 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={weeklyData.slice(-7)}>
                                <defs>
                                    <linearGradient id="fluxInflow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(161, 161, 170, 0.1)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 8, fontWeight: 900, fill: '#71717a' }}
                                    dy={10}
                                />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Tooltip
                                    cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg shadow-xl backdrop-blur-md bg-opacity-90">
                                                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1.5">{payload[0].payload.date}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Purchase</span>
                                                            <span className="text-[9px] font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tighter leading-none">{formatCurrency(payload[0].value as number)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Payment</span>
                                                            <span className="text-[9px] font-black text-orange-500 font-mono tracking-tighter leading-none">{formatCurrency(payload[1].value as number)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey="purchase" stroke="none" fill="url(#fluxInflow)" />
                                <Bar dataKey="purchase" fill="#f97316" radius={[4, 4, 0, 0]} barSize={14} opacity={0.6} />
                                <Line
                                    type="monotone"
                                    dataKey="payment"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: '#f97316', strokeWidth: 2, stroke: 'white' }}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
