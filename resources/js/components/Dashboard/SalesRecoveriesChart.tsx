import React, { useState } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PostDateChequesTab from "./PostDateChequesTab";
import StockTab from "./StockTab";

interface SalesRecoveriesData {
    label: string;
    sales: number;
    recoveries: number;
}

interface SalesRecoveriesChartProps {
    salesRecoveries: {
        daily: SalesRecoveriesData[];
        weekly: SalesRecoveriesData[];
        monthly: SalesRecoveriesData[];
        yearly: SalesRecoveriesData[];
    };
    postDateCheques: any[];
    stockItems: any[];
    stockSummary: any;
}

const SalesRecoveriesChart: React.FC<SalesRecoveriesChartProps> = ({ salesRecoveries, postDateCheques, stockItems, stockSummary }) => {
    const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

    const formatYAxis = (value: number) => {
        if (value >= 10000000) return (value / 10000000).toFixed(1) + 'Cr';
        if (value >= 100000) return (value / 100000).toFixed(1) + 'L';
        if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
        return value.toString();
    };

    const data = salesRecoveries[filter];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-gray-900/95 border border-gray-100 dark:border-gray-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-50 dark:border-gray-800 pb-1.5">
                        {label}
                    </p>
                    <div className="space-y-2">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-2.5">
                                    <div 
                                        className="w-2 h-2 rounded-full shadow-sm" 
                                        style={{ backgroundColor: entry.fill.includes('url') ? (entry.name === 'sales' ? '#e07b1a' : '#4a9ede') : entry.color }} 
                                    />
                                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 capitalize">
                                        {entry.name}
                                    </span>
                                </div>
                                <span className="text-[11px] font-black text-gray-900 dark:text-gray-100">
                                    Rs {new Intl.NumberFormat('en-PK').format(entry.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="border-gray-200 dark:border-gray-800 ">
            <Tabs defaultValue="sales" className="w-full">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-6">
                    <TabsList className="bg-gray-100/80 dark:bg-gray-800/50 p-1 rounded-xl">
                        <TabsTrigger value="sales" className="rounded-lg px-4 font-bold text-xs">Sales & Recoveries</TabsTrigger>
                        <TabsTrigger value="cheques" className="rounded-lg px-4 font-bold text-xs">Post-Date Cheques</TabsTrigger>
                        <TabsTrigger value="stock" className="rounded-lg px-4 font-bold text-xs">Stock</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex bg-gray-100/50 dark:bg-gray-800/30 p-1 rounded-xl gap-1">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? "secondary" : "ghost"}
                                size="sm"
                                className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                    filter === f 
                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-sidebar-primary dark:text-orange-400' 
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                
                <CardContent>
                    <TabsContent value="sales" className="mt-0 outline-none">
                        <div className="flex items-center gap-6 mb-8 pl-2">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-md bg-[#e07b1a] shadow-sm shadow-orange-500/20" />
                                <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Sales</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-md bg-[#4a9ede] shadow-sm shadow-blue-500/20" />
                                <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Recoveries</span>
                            </div>
                        </div>
                        
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#e07b1a" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#e07b1a" stopOpacity={0.8} />
                                        </linearGradient>
                                        <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4a9ede" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#4a9ede" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-200 dark:text-gray-800" opacity={0.5} />
                                    <XAxis 
                                        dataKey="label" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                                        dy={15}
                                    />
                                    <YAxis 
                                        tickFormatter={formatYAxis} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'currentColor', className: 'text-gray-100/50 dark:text-gray-800/30', radius: 4 }}
                                        content={<CustomTooltip />}
                                    />
                                    <Bar 
                                        dataKey="sales" 
                                        fill="url(#salesGradient)" 
                                        radius={[4, 4, 0, 0]} 
                                        barSize={filter === 'yearly' ? 50 : 25}
                                        animationDuration={1500}
                                    />
                                    <Bar 
                                        dataKey="recoveries" 
                                        fill="url(#recoveryGradient)" 
                                        radius={[4, 4, 0, 0]} 
                                        barSize={filter === 'yearly' ? 50 : 25}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="cheques" className="mt-0 outline-none">
                        <PostDateChequesTab cheques={postDateCheques} />
                    </TabsContent>
                    
                    <TabsContent value="stock" className="mt-0 outline-none">
                        <StockTab stockItems={stockItems} stockSummary={stockSummary} />
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    );
};

export default SalesRecoveriesChart;
