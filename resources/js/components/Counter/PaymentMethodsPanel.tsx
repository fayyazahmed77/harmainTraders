import { IconChartPie } from '@tabler/icons-react';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PaymentMethodItem {
    name: string;
    value: number;
    color: string;
    amount: string;
}

interface PaymentMethodsPanelProps {
    paymentMethods?: PaymentMethodItem[];
    trendData?: PaymentMethodItem[];
}

export default function PaymentMethodsPanel({
    paymentMethods = [],
    trendData = []
}: PaymentMethodsPanelProps) {
    const totalAmount = paymentMethods.reduce((sum, item) => {
        const val = parseFloat(item.amount.replace(/[^\d.]/g, '')) || 0;
        return sum + val;
    }, 0);

    const formatAmount = (num: number) => {
        if (num >= 100000) {
            return 'Rs ' + (num / 100000).toFixed(2) + 'L';
        }
        return 'Rs ' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    // If total today is 0, make sure chart has at least one grey placeholder slice
    const chartData = totalAmount === 0 
        ? [{ name: 'No sales', value: 100, color: 'var(--border)', amount: 'Rs 0' }]
        : paymentMethods;

    return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col h-full shadow-xs">
            <div className="flex items-center gap-1.5 mb-4">
                <IconChartPie size={14} className="text-orange-500 dark:text-orange-400" />
                <span className="text-[13px] font-medium text-foreground">Payment methods</span>
            </div>

            <div className="flex flex-col flex-1">
                {/* Donut Chart */}
                <div className="relative h-[150px] w-full flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="var(--card)"
                                strokeWidth={2}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[14px] font-bold text-foreground leading-tight">{formatAmount(totalAmount)}</span>
                        <span className="text-[9px] text-muted-foreground">Today total</span>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="mt-2 space-y-2">
                    {paymentMethods.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                                <div className="w-[9px] h-[9px] rounded-sm" style={{ backgroundColor: item.color }}></div>
                                <span className="text-foreground">{item.name}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-foreground mr-2">{item.value}%</span>
                                <span className="text-muted-foreground">{item.amount}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Collection Trend */}
                <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground mb-2.5">
                        Collection trend — last 7 days
                    </div>
                    <div className="space-y-2.5">
                        {trendData.map((item, idx) => (
                            <div key={`trend-${idx}`}>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span style={{ color: item.color }} className="font-medium">{item.name}</span>
                                    <span className="text-muted-foreground/10">{item.amount} avg</span>
                                </div>
                                <div className="h-1.5 bg-muted-foreground rounded-full overflow-hidden w-full">
                                    <div 
                                        className="h-full rounded-full" 
                                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
