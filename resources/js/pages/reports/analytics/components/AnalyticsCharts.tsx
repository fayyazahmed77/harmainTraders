import React from 'react';
import { Card } from '@/components/ui/card';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    BarChart, 
    Bar, 
    PieChart, 
    Pie, 
    Cell, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend 
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, ArrowRightLeft } from 'lucide-react';

interface AnalyticsChartsProps {
    reportType: string;
    data: any;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ reportType, data }) => {
    if (!data) return null;

    const CustomTooltip = ({ active, payload, label, prefix = 'Rs ' }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface-0 border border-border/40 p-3 rounded-lg shadow-xl text-xs font-mono">
                    <p className="font-bold text-text-primary mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color || entry.fill }}>
                            <span className="font-semibold">{entry.name}: </span>
                            {prefix}{Number(entry.value).toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (reportType === 'sales') {
        return (
            <div className="space-y-6">
                {/* Main Trend Line/Area Chart */}
                <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Sales Revenue Trend</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            Daily Breakdown
                        </span>
                    </div>
                    <div className="h-72 w-full">
                        {data.trend && data.trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip prefix="Rs " />} />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesColor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-text-muted font-mono uppercase">No Sales Trend Data Found</div>
                        )}
                    </div>
                </Card>

                {/* Secondary Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top 10 Products Horizontal Bar Chart */}
                    <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Top 10 Products by Revenue</h3>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            {data.topProducts && data.topProducts.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={data.topProducts} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip content={<CustomTooltip prefix="Rs " />} />
                                        <Bar dataKey="amount" name="Revenue" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-text-muted font-mono uppercase">No Product Data Found</div>
                            )}
                        </div>
                    </Card>

                    {/* Category Sales Distribution Donut Chart */}
                    <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-purple-600" />
                                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Sales by Category</h3>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.categoryBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {data.categoryBreakdown.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip prefix="Rs " />} />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-text-muted font-mono uppercase">No Category Data Found</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (reportType === 'purchase') {
        return (
            <div className="space-y-6">
                {/* Main Purchase Trend Chart */}
                <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Purchase Expenditure Trend</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                            Daily Outflux
                        </span>
                    </div>
                    <div className="h-72 w-full">
                        {data.trend && data.trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="purchaseColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip prefix="Rs " />} />
                                    <Area type="monotone" dataKey="cost" name="Expenditure" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#purchaseColor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-text-muted font-mono uppercase">No Purchase Trend Data Found</div>
                        )}
                    </div>
                </Card>

                {/* Secondary Purchase Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Suppliers Bar Chart */}
                    <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-600" />
                                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Top Suppliers by Volume</h3>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            {data.topSuppliers && data.topSuppliers.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={data.topSuppliers} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip content={<CustomTooltip prefix="Rs " />} />
                                        <Bar dataKey="amount" name="Purchase Value" fill="#10b981" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-text-muted font-mono uppercase">No Supplier Data Found</div>
                            )}
                        </div>
                    </Card>

                    {/* Category Purchase Breakdown */}
                    <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-cyan-600" />
                                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Purchases by Category</h3>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.categoryBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {data.categoryBreakdown.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip prefix="Rs " />} />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-text-muted font-mono uppercase">No Category Data Found</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Stock Analytics Charts
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Movement IN vs OUT Chart */}
            <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Period Stock Movement (IN vs OUT)</h3>
                    </div>
                </div>
                <div className="h-72 w-full">
                    {data.stockMovement ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.stockMovement} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip prefix="" />} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Bar dataKey="Stock IN (Purchase)" fill="#10b981" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="Stock OUT (Sales)" fill="#ef4444" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-text-muted font-mono uppercase">No Movement Data Found</div>
                    )}
                </div>
            </Card>

            {/* Company Stock Valuation Breakdown */}
            <Card className="p-5 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Stock Valuation by Company</h3>
                    </div>
                </div>
                <div className="h-72 w-full">
                    {data.companyValuation && data.companyValuation.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.companyValuation}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {data.companyValuation.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip prefix="Rs " />} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-text-muted font-mono uppercase">No Company Data Found</div>
                    )}
                </div>
            </Card>
        </div>
    );
};
