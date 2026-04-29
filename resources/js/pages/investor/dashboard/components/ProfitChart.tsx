import React from 'react';
import { Card } from '@/components/ui/card';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';

interface ProfitChartProps {
    data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-white/10 bg-[#181C23] p-3 shadow-xl backdrop-blur-md">
                <p className="text-xs font-medium text-[#6B7280]">{label}</p>
                <p className="text-sm font-bold text-[#C9A84C]">
                    PKR {payload[0].value.toLocaleString()}
                </p>
                {payload[0].payload.type === 'projected' && (
                    <p className="mt-1 text-[10px] text-[#22C55E]/80 italic">Projected Forecast</p>
                )}
            </div>
        );
    }
    return null;
};

export const ProfitChart = ({ data }: ProfitChartProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="h-full"
        >
            <Card className="flex h-full flex-col border-white/5 bg-[#111318] p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-[#F1F1F1]">Profit Trend & Forecast</h3>
                        <p className="text-xs text-[#6B7280]">Historical performance vs 6-month projection</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                            <span className="text-[10px] text-[#6B7280]">Historical</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full border border-dashed border-[#C9A84C]" />
                            <span className="text-[10px] text-[#6B7280]">Forecast</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                            <XAxis 
                                dataKey="period" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#374151', fontSize: 10 }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#374151', fontSize: 10 }}
                                tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
                            
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorHistorical)"
                                connectNulls
                                data={data.filter(d => d.type === 'historical')}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#C9A84C"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#colorProjected)"
                                data={data.filter(d => d.type === 'projected')}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </motion.div>
    );
};
