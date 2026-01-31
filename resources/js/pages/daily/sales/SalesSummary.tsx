import React, { useMemo } from "react";
import { DollarSign, Calendar, TrendingUp, RefreshCcw, ArrowUpRight, CheckCircle, Activity } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

interface Sale {
    id: number;
    date: string;
    net_total: number;
    paid_amount: number;
    status: string;
}

interface SummaryProps {
    summary: {
        total_sales: number;
        total_sales_return: number;
        partial_return: number;
        total_paid: number;
        total_unpaid: number;
    };
    sales: Sale[];
}

export default function SalesSummary({ summary, sales }: SummaryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount).replace('PKR', '').trim();
    };

    const netSales = summary.total_sales - summary.total_sales_return;
    const recoveryPercentage = netSales > 0
        ? Math.round((summary.total_paid / netSales) * 100)
        : 0;
    const cappedPercentage = Math.min(100, Math.max(0, recoveryPercentage));

    // Process 7-Day Weekly Data
    const weeklyData = useMemo(() => {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const label = format(date, 'MMM dd');

            const dailySales = sales
                .filter(s => isSameDay(new Date(s.date), date))
                .reduce((acc, curr) => acc + Number(curr.net_total), 0);

            const dailyCollection = sales
                .filter(s => isSameDay(new Date(s.date), date))
                .reduce((acc, curr) => acc + Number(curr.paid_amount), 0);

            days.push({
                date: label,
                sales: dailySales,
                collection: dailyCollection,
            });
        }
        return days;
    }, [sales]);

    const getTheme = () => {
        if (cappedPercentage < 50) {
            return {
                card: "bg-rose-500/5 border-rose-500/10",
                ringTrack: "stroke-rose-500/10",
                ringProgress: "stroke-rose-500",
                icon: "bg-rose-500/10 text-rose-500",
                textMuted: "text-rose-500/60",
                border: "border-rose-500/10"
            };
        } else if (cappedPercentage < 100) {
            return {
                card: "bg-amber-500/5 border-amber-500/10",
                ringTrack: "stroke-amber-500/10",
                ringProgress: "stroke-amber-500",
                icon: "bg-amber-500/10 text-amber-500",
                textMuted: "text-amber-500/60",
                border: "border-amber-500/10"
            };
        } else {
            return {
                card: "bg-emerald-500/5 border-emerald-500/10",
                ringTrack: "stroke-emerald-500/10",
                ringProgress: "stroke-emerald-500",
                icon: "bg-emerald-500/10 text-emerald-500",
                textMuted: "text-emerald-500/60",
                border: "border-emerald-500/10"
            };
        }
    };

    const theme = getTheme();

    return (
        <div className="bg-card text-card-foreground rounded-[0.5rem] border border-border shadow-sm p-4 md:p-6 mb-8 overflow-hidden">

            {/* 2. PRO-BAR (Theme Aware) */}
            <div className="bg-muted/30 rounded-[0.5rem] p-4 flex flex-col lg:flex-row items-center justify-between gap-6 mb-6 border border-border px-6">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
                        <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-tight">Revenue Stream</p>
                        <p className="text-[10px] text-primary font-black tracking-widest uppercase italic">Elevated</p>
                    </div>
                </div>

                <div className="flex-1 w-full lg:max-w-md">
                    <div className="flex justify-between items-center mb-1.5 px-1">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Recovery Success</span>
                        <span className="text-[10px] font-black text-primary">{cappedPercentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full p-[1px]">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${cappedPercentage}%` }}
                        ></div>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground border-l border-border pl-6 h-6">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black tracking-tight uppercase">Period: 7-Day Window</span>
                </div>
            </div>

            {/* 3. COCKPIT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch min-h-[260px]">

                {/* HERO BLOCK */}
                <div className="flex flex-col bg-primary/5 rounded-[0.5rem] p-6 border border-primary/10 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/10 rounded-full blur-3xl opacity-60 group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md mb-4 relative z-10">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] mb-1">Total Sales Revenue</p>
                    <h3 className="text-4xl font-black text-foreground tracking-tight leading-none mb-4 uppercase">
                        {formatCurrency(summary.total_sales)} <span className="text-sm font-bold opacity-30">PKR</span>
                    </h3>
                    <div className="mt-auto space-y-3 relative z-10">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Cash Collected</span>
                            <span className="text-xs font-black text-foreground uppercase">{formatCurrency(summary.total_paid)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-background/50 backdrop-blur-sm p-3 rounded-xl border border-border/50">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Performance Trend</span>
                            <span className="text-[10px] font-black text-primary flex items-center">
                                <ArrowUpRight className="h-3 w-3 mr-1" /> SURGING
                            </span>
                        </div>
                    </div>
                </div>

                {/* STATS BLOCK */}
                <div className={`flex flex-col rounded-[0.5rem] p-6 border transition-all duration-500 ${theme.card}`}>
                    <div className="flex items-center justify-between mb-4">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMuted}`}>Settlement Flow</p>
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-sm ${theme.icon}`}>
                            <CheckCircle className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-8 my-auto p-2">
                        <div className="relative h-28 w-28 shrink-0">
                            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle className={theme.ringTrack} cx="18" cy="18" r="15.9155" strokeWidth="3" fill="none" />
                                <circle
                                    className={`${theme.ringProgress} transition-all duration-1000 ease-out`}
                                    cx="18" cy="18" r="15.9155"
                                    strokeWidth="3"
                                    strokeDasharray={`${cappedPercentage}, 100`}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black leading-none">{cappedPercentage}%</span>
                                <span className="text-[7px] font-black text-muted-foreground uppercase tracking-tighter mt-1 tabular-nums">Recovery</span>
                            </div>
                        </div>
                        <div className="flex-1 w-full space-y-3">
                            <div className={`flex justify-between border-b pb-2 ${theme.border}`}>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Returns</span>
                                <span className="text-sm font-black text-foreground font-mono tracking-tighter">{formatCurrency(summary.total_sales_return)}</span>
                            </div>
                            <div className={`flex justify-between border-b pb-2 ${theme.border}`}>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Partial</span>
                                <span className="text-sm font-black text-foreground font-mono tracking-tighter">{formatCurrency(summary.partial_return)}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Unpaid Net</span>
                                <span className="text-lg font-black text-rose-500 font-mono tracking-tighter italic">{formatCurrency(summary.total_unpaid)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WEEKLY ANALYTICS (COMPOSED CHART) */}
                <div className="hidden lg:flex flex-col bg-muted/20 border border-border rounded-[0.5rem] p-5 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center">
                                <Activity className="h-3 w-3 mr-1 text-primary" /> Matrix Analytics
                            </p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Sales vs Collections</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mb-0.5"></div>
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Sales</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mb-0.5"></div>
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Cash</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[160px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={weeklyData}>
                                <defs>
                                    <linearGradient id="salesBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={1} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 8, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border)',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '10px'
                                    }}
                                    itemStyle={{ fontWeight: 900, fontSize: '11px', color: 'var(--foreground)' }}
                                    labelStyle={{ fontWeight: 900, color: 'var(--primary)', marginBottom: '4px' }}
                                    formatter={(value: any) => [formatCurrency(value as number), '']}
                                />
                                <Bar dataKey="sales" fill="url(#salesBar)" radius={[4, 4, 0, 0]} barSize={16} />
                                <Line
                                    type="monotone"
                                    dataKey="collection"
                                    stroke="var(--chart-1)"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 1.5, stroke: 'var(--card)' }}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
