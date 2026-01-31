import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    ComposedChart,
    Area
} from "recharts";
import { Activity, LayoutDashboard, BarChart3, TrendingUp } from "lucide-react";

interface AnalyticsProps {
    data: any[];
}

export default function AnalyticsCharts({ data }: AnalyticsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount).replace('PKR', '').trim();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PERFORMANCE LOG: LINE & AREA CHART */}
            <Card className="p-0 rounded-sm border-none  dark:shadow-2xl bg-card  overflow-hidden relative border border-border/50">
                <div className="absolute top-0 right-1/4 w-16 h-1 bg-orange-500 rounded-b-full z-20"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-6 px-8 bg-muted/40 dark:bg-[#26211e]/30 border-b border-border dark:border-white/[0.03]">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground dark:text-white">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            Performance Matrix
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground/60 dark:text-[#d6d3d1]/30 font-bold tracking-tight uppercase">Comparative Sales & Purchase Flow</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="h-[320px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="currentColor" className="text-border dark:text-white/5" opacity={0.2} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor', className: 'text-muted-foreground/40 dark:text-[#d6d3d1]/20' }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }}
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        borderRadius: '1rem',
                                        border: '1px solid var(--border)',
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        padding: '12px',
                                        color: 'var(--foreground)'
                                    }}
                                    formatter={(value: any) => [`Rs ${formatCurrency(value as number)}`, '']}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    height={36}
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-[#d6d3d1]/40 ml-1">{value}</span>}
                                />
                                <Line
                                    name="Sales"
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'var(--card)' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    name="Purchases"
                                    type="monotone"
                                    dataKey="purchases"
                                    stroke="#f43f5e"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: 'var(--card)' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* VOLUME ANALYSIS: BAR CHART */}
            <Card className="p-0 rounded-sm border-none  dark:shadow-2xl bg-card  overflow-hidden relative border border-border/50">
                <div className="absolute top-0 right-1/4 w-16 h-1 bg-orange-500 rounded-b-full z-20"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-6 px-8 bg-muted/40 dark:bg-[#26211e]/30 border-b border-border dark:border-white/[0.03]">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground dark:text-white">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Volume Spectrum
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground/60 dark:text-[#d6d3d1]/30 font-bold tracking-tight uppercase">Cash Movement Dynamics</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="h-[320px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="currentColor" className="text-border dark:text-white/5" opacity={0.2} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor', className: 'text-muted-foreground/40 dark:text-[#d6d3d1]/20' }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'currentColor', className: 'text-muted/10 dark:text-white/5 opacity-0.1' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        borderRadius: '1rem',
                                        border: '1px solid var(--border)',
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        padding: '12px',
                                        color: 'var(--foreground)'
                                    }}
                                    formatter={(value: any) => [`Rs ${formatCurrency(value as number)}`, '']}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    height={36}
                                    iconType="rect"
                                    iconSize={8}
                                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-[#d6d3d1]/40 ml-1">{value}</span>}
                                />
                                <Bar name="Receipts" dataKey="receipts" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
                                <Bar name="Payments" dataKey="payments" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
