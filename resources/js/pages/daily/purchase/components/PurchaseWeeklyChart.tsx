import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PurchaseWeeklyChartProps {
    weeklyData: Array<{
        date: string;
        purchase: number;
        payment: number;
    }>;
    formatCurrency: (amount: number) => string;
}

export default function PurchaseWeeklyChart({ weeklyData, formatCurrency }: PurchaseWeeklyChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyData}>
                <defs>
                    <linearGradient id="purchaseBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={1} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 7, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                    dy={6}
                />
                <YAxis hide />
                <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                    contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '9px'
                    }}
                    itemStyle={{ fontWeight: 900, fontSize: '10px', color: 'var(--foreground)' }}
                    labelStyle={{ fontWeight: 900, color: '#f97316', marginBottom: '2px' }}
                    formatter={(value: any) => [`Rs ${formatCurrency(value as number)}`, '']}
                />
                <Bar dataKey="purchase" fill="url(#purchaseBar)" radius={[3, 3, 0, 0]} barSize={10} />
                <Line
                    type="monotone"
                    dataKey="payment"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#f97316', strokeWidth: 1, stroke: 'var(--card)' }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
