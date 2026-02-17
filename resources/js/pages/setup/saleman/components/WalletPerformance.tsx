import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";
import { Activity } from "lucide-react";

interface PerformanceProps {
    data: any[];
}

export default function WalletPerformance({ data }: PerformanceProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace('PKR', '').trim();
    };

    return (
        <Card className="p-0 border-none overflow-hidden relative group transition-all duration-300 bg-[#fff7ed] dark:bg-[#1c1917] rounded-lg h-full border border-orange-100 dark:border-border/50">
            <CardContent className="p-0 flex flex-col h-full">
                {/* HEADER SECTION */}
                <div className="p-6 pb-0 flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-400 opacity-60" />
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-[#9a3412]/80 dark:text-white">Commission Trend</span>
                        </div>
                        <p className="text-[10px] font-black text-[#9a3412]/30 dark:text-[#d6d3d1]/20 uppercase tracking-[0.15em] ml-6">Rolling 30-Day Matrix</p>
                    </div>

                    <div className="flex items-center gap-6 pt-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#9a3412]/40 dark:text-[#d6d3d1]/40">EARNED</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#9a3412]/40 dark:text-[#d6d3d1]/40">PAID</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[190px] w-full p-6 pt-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            {/* Removed gradients for simplicity */}
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-orange-900/10 dark:text-white/5" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', className: 'text-[#9a3412]/40 dark:text-[#d6d3d1]/20' }}
                                dy={10}
                                minTickGap={30}
                            />
                            <YAxis hide domain={[0, 'auto']} />
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
                                formatter={(value: any, name: any) => [`Rs ${formatCurrency(value as number)}`, name === 'earned' ? 'Earned' : 'Paid']}
                            />

                            <Bar
                                name="earned"
                                dataKey="earned"
                                fill="#f59e0b"
                                radius={[4, 4, 0, 0]}
                                barSize={12}
                            />
                            <Line
                                type="monotone"
                                name="paid"
                                dataKey="paid"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
