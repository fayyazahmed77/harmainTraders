import { IconChartBar } from '@tabler/icons-react';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HourlyItem {
    time: string;
    sales: number | null;
    cash: number | null;
}

interface HourlySalesChartProps {
    hourlyData?: HourlyItem[];
}

export default function HourlySalesChart({ hourlyData = [] }: HourlySalesChartProps) {
    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border p-2 rounded shadow-lg text-[11px]">
                    <p className="text-foreground font-semibold mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
                            <span>{entry.name}:</span>
                            <span className="font-semibold">Rs {entry.value?.toLocaleString()}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card border border-border rounded-lg p-4 col-span-full shadow-xs">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                        <IconChartBar size={14} className="text-orange-500" />
                        <span className="text-[13px] font-medium text-foreground">Counter sales vs cash collection</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Hourly breakdown — today's shift</div>
                </div>
                
                {/* Custom HTML Legend */}
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="w-[9px] h-[9px] bg-[#e07b1a] rounded-sm"></div>
                        <span>Sales</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-[9px] h-[9px] bg-[#4caf7a] rounded-sm"></div>
                        <span>Cash collected</span>
                    </div>
                </div>
            </div>

            <div className="h-[170px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={hourlyData}
                        margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                        barSize={14}
                        barCategoryGap="30%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.12)" vertical={false} />
                        <XAxis 
                            dataKey="time" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'currentColor', fontSize: 10 }}
                            className="text-muted-foreground/70"
                            dy={5}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'currentColor', fontSize: 10 }}
                            className="text-muted-foreground/70"
                            tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(0) + 'K' : v}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.15 }} />
                        <Bar dataKey="sales" name="Sales" fill="#e07b1a" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="cash" name="Cash collected" fill="#4caf7a" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
