import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FundItem {
    name: string;
    value: number;
    color: string;
}

interface FundsPieChartProps {
    fundsData: FundItem[];
}

const FundsPieChart: React.FC<FundsPieChartProps> = ({ fundsData }) => {
    // Filter out negative values to prevent overdrafts/deficits from displaying
    const filteredFundsData = fundsData.filter(item => item.value >= 0);
    const total = filteredFundsData.reduce((sum, item) => sum + item.value, 0);

    const formatRs = (val: number): string => {
        const roundedVal = Math.round(val);
        if (roundedVal >= 10000000) {
            return (roundedVal / 10000000).toFixed(2) + 'Cr';
        } else if (roundedVal >= 100000) {
            return (roundedVal / 100000).toFixed(1) + 'L';
        } else if (roundedVal >= 1000) {
            return (roundedVal / 1000).toFixed(1) + 'K';
        }
        return roundedVal.toLocaleString('en-PK');
    };

    const formatCurrency = (val: number): string => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val).replace('PKR', 'Rs');
    };

    return (
        <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-0">
                <CardTitle className="text-base font-semibold">Available Funds</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Distribution by payment type</p>
            </CardHeader>
            <CardContent>
                <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={filteredFundsData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {filteredFundsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Centered Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '0px' }}>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Total</span>
                        <span className="text-sm font-black text-gray-900 dark:text-gray-100">{formatRs(total)}</span>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="mt-4 space-y-2">
                    {filteredFundsData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-2.5 h-2.5 rounded-sm shrink-0" 
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-400">
                                    {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                                </span>
                                <span className="text-xs font-black text-gray-900 dark:text-gray-100 min-w-[60px] text-right">
                                    Rs {formatRs(item.value)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default FundsPieChart;
