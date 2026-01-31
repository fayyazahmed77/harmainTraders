import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw, ShoppingBag, CreditCard, Activity, ArrowUpRight, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, PieChart, Pie, Cell } from "recharts";

interface StatsProps {
    type: "sales" | "purchase";
    mode: "value" | "analytics";
    data: any;
    analyticsData?: any[];
}

export default function DashboardStats({ type, mode, data, analyticsData }: StatsProps) {
    const isSales = type === "sales";
    const theme = isSales
        ? {
            gradient: "from-emerald-500 to-teal-600",
            lightGradient: "bg-emerald-500/5 border-emerald-500/10",
            iconBg: "bg-emerald-500/10 text-emerald-500",
            accent: "text-emerald-500",
            muted: "text-emerald-100",
            chartColor: "#10b981"
        }
        : {
            gradient: "from-rose-500 to-pink-600",
            lightGradient: "bg-rose-500/5 border-rose-500/10",
            iconBg: "bg-rose-500/10 text-rose-500",
            accent: "text-rose-500",
            muted: "text-rose-100",
            chartColor: "#f43f5e"
        };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount).replace('PKR', '').trim();
    };

    if (mode === "value") {
        const percentage = isSales
            ? (data.total_sales > 0 ? Math.round((data.total_paid / data.total_sales) * 100) : 0)
            : (data.total_purchase > 0 ? Math.round((data.total_paid / data.total_purchase) * 100) : 0);

        const cappedPercentage = Math.min(100, Math.max(0, percentage));

        const getTheme = () => {
            if (cappedPercentage < 50) {
                return {
                    card: "bg-rose-500/5 dark:bg-[#1c1917] border-rose-500/10",
                    ringTrack: "stroke-rose-500/10 dark:stroke-rose-500/20",
                    ringProgress: "stroke-rose-500",
                    icon: "bg-rose-500/10 text-rose-500",
                    textMuted: "text-rose-500/60 dark:text-rose-500/40",
                    border: "border-rose-500/10",
                    accentText: "text-rose-500"
                };
            } else if (cappedPercentage < 100) {
                return {
                    card: "bg-amber-500/5 dark:bg-[#1c1917] border-amber-500/10",
                    ringTrack: "stroke-amber-500/10 dark:stroke-amber-500/20",
                    ringProgress: "stroke-amber-500",
                    icon: "bg-amber-500/10 text-amber-500",
                    textMuted: "text-amber-500/60 dark:text-amber-500/40",
                    border: "border-amber-500/10",
                    accentText: "text-amber-500"
                };
            } else {
                return {
                    card: "bg-emerald-500/5 dark:bg-[#1c1917] border-emerald-500/10",
                    ringTrack: "stroke-emerald-500/10 dark:stroke-emerald-500/20",
                    ringProgress: "stroke-emerald-500",
                    icon: "bg-emerald-500/10 text-emerald-500",
                    textMuted: "text-emerald-500/60 dark:text-emerald-500/40",
                    border: "border-emerald-500/10",
                    accentText: "text-emerald-500"
                };
            }
        };

        const currentTheme = getTheme();

        return (
            <Card className={`p-0 border  overflow-hidden relative group transition-all duration-300 rounded-[0.5rem] h-full ${currentTheme.card}`}>
                <CardContent className="p-6 flex flex-col h-full">
                    {/* Header Inline */}
                    <div className="flex items-center justify-between mb-6">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${currentTheme.textMuted}`}>
                            {isSales ? "Sale Flow Recovery" : "Purchase Flow Recovery"}
                        </span>
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-sm ${currentTheme.icon}`}>
                            <RefreshCcw className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 my-auto">
                        {/* CHART SIDE */}
                        <div className="relative h-28 w-28 shrink-0">
                            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle className={currentTheme.ringTrack} cx="18" cy="18" r="15.9155" strokeWidth="3" fill="none" />
                                <circle
                                    className={`${currentTheme.ringProgress} transition-all duration-1000 ease-out`}
                                    cx="18" cy="18" r="15.9155"
                                    strokeWidth="3"
                                    strokeDasharray={`${cappedPercentage}, 100`}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-foreground dark:text-white leading-none">{cappedPercentage}%</span>
                                <span className="text-[7px] font-black text-muted-foreground dark:text-[#d6d3d1]/30 uppercase tracking-tighter mt-1 tabular-nums">Recovery</span>
                            </div>
                        </div>

                        {/* DATA SIDE */}
                        <div className="flex-1 w-full space-y-3">
                            <div className={`flex items-center justify-between border-b pb-2.5 ${currentTheme.border}`}>
                                <span className="text-[9px] font-black text-muted-foreground/50 dark:text-[#d6d3d1]/40 uppercase tracking-widest">Settled</span>
                                <p className="text-sm font-black text-foreground dark:text-white font-mono tracking-tighter">
                                    <span className="text-[10px] opacity-40 dark:opacity-30 mr-1.5 font-sans">Rs</span>{formatCurrency(data.total_paid)}
                                </p>
                            </div>
                            <div className={`flex items-center justify-between border-b pb-2.5 ${currentTheme.border}`}>
                                <span className="text-[9px] font-black text-muted-foreground/50 dark:text-[#d6d3d1]/40 uppercase tracking-widest">Returns</span>
                                <p className="text-sm font-black text-foreground dark:text-white font-mono tracking-tighter">
                                    <span className="text-[10px] opacity-40 dark:opacity-30 mr-1.5 font-sans">Rs</span>{formatCurrency(data.total_returns)}
                                </p>
                            </div>
                            <div className="flex justify-between items-center pt-1 transition-all group-hover:translate-x-1">
                                <span className="text-[9px] font-black text-muted-foreground/50 dark:text-[#d6d3d1]/40 uppercase tracking-widest">Balance</span>
                                <p className={`text-lg font-black italic tracking-tighter ${isSales ? 'text-emerald-500' : 'text-rose-500'} font-mono`}>
                                    <span className="text-[10px] opacity-40 dark:opacity-40 not-italic mr-2 font-bold tracking-normal text-foreground dark:text-white font-sans">Rs</span>
                                    {formatCurrency(data.total_unpaid)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Mini Analytics Mode
    const chartData = analyticsData?.map(d => ({ value: isSales ? d.sales : d.purchases })) || [];

    return (
        <Card className={`p-0 border border-border  overflow-hidden relative group transition-all duration-300 bg-card rounded-[0.5rem]`}>
            {/* TOP ACCENT BAR */}
            <div className={`absolute top-0 right-4 w-12 h-1 ${isSales ? 'bg-emerald-500' : 'bg-rose-500'} rounded-b-full z-20`}></div>

            <CardContent className="p-0 flex flex-col h-full">
                <div className="p-4 flex justify-between items-center bg-muted/20 border-b border-border">
                    <div>
                        <p className="text-muted-foreground font-black text-[8px] uppercase tracking-[0.2em] mb-0.5">
                            {isSales ? "Revenue" : "Expenditure"} Trend
                        </p>
                        <div className="flex items-center gap-1">
                            <Activity className={`w-3 h-3 ${theme.accent}`} />
                            <span className="text-[10px] font-black uppercase tracking-tight">Rolling Matrix</span>
                        </div>
                    </div>
                    <div className={`h-8 w-8 rounded-lg ${theme.iconBg} flex items-center justify-center shadow-sm`}>
                        <ArrowUpRight className="w-4 h-4" />
                    </div>
                </div>

                <div className="flex-1 min-h-[90px] w-full relative group-hover:opacity-90 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`colorValue-${type}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.chartColor} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={theme.chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={theme.chartColor}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#colorValue-${type})`}
                                animationDuration={1500}
                                strokeLinecap="round"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-x-0 bottom-2 px-4 flex justify-between items-end pointer-events-none">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-50">STABLE_FLOW</span>
                        <div className="flex items-center gap-1">
                            <div className={`h-1.5 w-1.5 rounded-full ${isSales ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`}></div>
                            <span className={`text-[9px] font-black ${theme.accent} tracking-widest`}>ACTIVE</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
