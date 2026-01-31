import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Activity } from "lucide-react";

interface PerformanceLogProps {
    data: any[];
}

export default function UnifiedPerformanceLog({ data }: PerformanceLogProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount).replace('PKR', '').trim();
    };

    return (
        <Card className="p-0 border-none overflow-hidden relative group transition-all duration-300  bg-[#fff7ed] dark:bg-[#1c1917] rounded-xl h-full border border-orange-100 dark:border-border/50">
            <CardContent className="p-0 flex flex-col h-full">
                {/* HEADER SECTION */}
                <div className="p-6 pb-0 flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-400 opacity-60" />
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-[#9a3412]/80 dark:text-white">Performance Log</span>
                        </div>
                        <p className="text-[10px] font-black text-[#9a3412]/30 dark:text-[#d6d3d1]/20 uppercase tracking-[0.15em] ml-6">Rolling 7-Day Matrix</p>
                    </div>

                    <div className="flex items-center gap-6 pt-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#9a3412]/40 dark:text-[#d6d3d1]/40">P.VOLUME</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#9a3412]/40 dark:text-[#d6d3d1]/40">PAYMENTS</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[160px] w-full p-6 pt-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -40, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-orange-900/10 dark:text-white/5" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', className: 'text-[#9a3412]/40 dark:text-[#d6d3d1]/20' }}
                                dy={15}
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
                                    color: 'var(--foreground)'
                                }}
                                formatter={(value: any) => [`Rs ${formatCurrency(value as number)}`, '']}
                            />

                            <Bar
                                name="Receipts"
                                dataKey="receipts"
                                fill="url(#barGlow)"
                                radius={[6, 6, 0, 0]}
                                barSize={22}
                            />

                            <Line
                                type="monotone"
                                dataKey="payments"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#fff7ed' }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
