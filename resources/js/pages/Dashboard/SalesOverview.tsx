import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    ReferenceDot
} from 'recharts';
import {
    ShoppingBag,
    Users,
    RefreshCcw,
    DollarSign,
    Download,
    Filter,
    Search,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import * as React from "react"

interface SalesOverviewProps {
    metrics: {
        totalSales: { current: number, last: number },
        newCustomers: { current: number, last: number },
        returns: { current: number, last: number },
        revenue: { current: number, last: number }
    },
    performanceTrend: { month: string, totalSales: number, totalRevenue: number }[],
    recentOrders: {
        info: string,
        id: string,
        date: string,
        customer: string,
        category: string,
        status: string,
        items: number,
        total: string
    }[],
    growthPercentage: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-2xl shadow-xl border-none text-[10px]">
                <p className="font-bold text-gray-900 mb-2">{label}</p>
                <div className="flex justify-between space-x-8 mb-1">
                    <span className="text-gray-400 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-200 mr-2"></span> Total Sales</span>
                    <span className="font-bold text-gray-900">{payload[0].value}</span>
                </div>
                <div className="flex justify-between space-x-8">
                    <span className="text-gray-400 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#f69826] mr-2"></span> Total Revenue</span>
                    <span className="font-bold text-gray-900">Rs {(payload[1].value).toLocaleString()}</span>
                </div>
            </div>
        );
    }
    return null;
};

const DiscreteGauge = ({ percentage = 70.8 }) => {
    const totalSegments = 20;
    const activeSegments = Math.max(0, Math.round((percentage / 100) * totalSegments));

    const data = Array.from({ length: totalSegments }).map((_, i) => ({
        value: 1,
        isActive: i < activeSegments
    }));

    return (
        <div className="relative flex flex-col items-center justify-center h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="70%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => {
                            const opacity = 1 - (index / totalSegments) * 0.7;
                            return (
                                <Cell
                                    key={`segment-${index}`}
                                    fill={entry.isActive ? `rgba(59, 130, 246, ${opacity})` : '#f3f4f6'}
                                    style={{ transition: 'fill 0.3s ease' }}
                                />
                            );
                        })}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[65%] left-1/2 -translate-x-1/2 text-center">
                <h3 className="text-4xl font-bold text-gray-900">{percentage}%</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Sales Growth</p>
            </div>
        </div>
    );
};

export default function SalesOverview({ metrics, performanceTrend, recentOrders, growthPercentage }: SalesOverviewProps) {
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredOrders = recentOrders.filter(order =>
        order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.info.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateTrend = (current: number, last: number) => {
        if (last === 0) return 0;
        return (((current - last) / last) * 100).toFixed(1);
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-6 space-y-8 bg-[#f8faff] min-h-screen font-sans">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Sales Overview</h1>
                            <p className="text-sm text-gray-500">Your live sales summary and current business activity</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button variant="outline" className="bg-white text-xs h-9 px-4 rounded-xl border-gray-100 flex items-center">
                                This Month <MoreHorizontal className="ml-2 w-4 h-4 text-gray-400 rotate-90" />
                            </Button>
                            <Button variant="outline" className="bg-white text-xs h-9 px-4 rounded-xl border-gray-100" onClick={() => window.print()}>
                                <Download className="mr-2 w-4 h-4 text-gray-400" /> Export
                            </Button>
                            <Button className="bg-[#f69826] hover:bg-orange-600 text-xs h-9 px-4 rounded-xl shadow-lg shadow-orange-100">
                                <Filter className="mr-2 w-4 h-4" /> Filter
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-gradient-to-br from-[#f69826] to-[#f6982694] border-none text-white rounded-[1rem] p-6 relative overflow-hidden shadow-xl shadow-orange-100">
                            <div className="relative z-10">
                                <p className="text-sm opacity-80 mb-4 font-medium">Total Sales</p>
                                <div className="flex items-baseline space-x-2">
                                    <h2 className="text-4xl font-bold">{metrics.totalSales.current}</h2>
                                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full flex items-center font-bold">
                                        <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> {calculateTrend(metrics.totalSales.current, metrics.totalSales.last)}%
                                    </span>
                                </div>
                                <p className="text-[10px] opacity-60 mt-4 font-medium">Last month: {metrics.totalSales.last}</p>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-4 rounded-full">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                        </Card>

                        <Card className="bg-white border-none shadow-sm rounded-[1rem] p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-sm text-gray-500 mb-4 font-medium">New Customer</p>
                                <div className="flex items-baseline space-x-2">
                                    <h2 className="text-4xl font-bold text-gray-900">{metrics.newCustomers.current}</h2>
                                    <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full flex items-center font-bold">
                                        <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> {calculateTrend(metrics.newCustomers.current, metrics.newCustomers.last)}%
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-4 font-medium">Last month: {metrics.newCustomers.last}</p>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900 p-4 rounded-full text-white">
                                <Users className="w-6 h-6" />
                            </div>
                        </Card>

                        <Card className="bg-white border-none shadow-sm rounded-[1rem] p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-sm text-gray-500 mb-4 font-medium">Return Products</p>
                                <div className="flex items-baseline space-x-2">
                                    <h2 className="text-4xl font-bold text-gray-900">{metrics.returns.current}</h2>
                                    <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full flex items-center font-bold">
                                        <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" /> {calculateTrend(metrics.returns.current, metrics.returns.last)}%
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-4 font-medium">Last month: {metrics.returns.last}</p>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-orange-100 p-4 rounded-full text-orange-600">
                                <RefreshCcw className="w-6 h-6" />
                            </div>
                        </Card>

                        <Card className="bg-white border-none shadow-sm rounded-[1rem] p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-sm text-gray-500 mb-4 font-medium">Total Revenue</p>
                                <div className="flex items-baseline space-x-2">
                                    <h2 className="text-4xl font-bold text-gray-900">Rs {metrics.revenue.current.toLocaleString()}</h2>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-4 font-medium">Last month: Rs {metrics.revenue.last.toLocaleString()}</p>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-orange-600 p-4 rounded-full text-white">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 bg-white border-none shadow-sm rounded-[1rem] p-8">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="font-bold text-xl text-gray-900">Performance Overview</h3>
                                <Button variant="ghost" className="text-xs font-semibold h-9 px-4 rounded-xl bg-gray-50 text-gray-600">
                                    Real-time Trend <MoreHorizontal className="ml-2 w-4 h-4 text-gray-400 rotate-90" />
                                </Button>
                            </div>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceTrend} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barGap={-40}>
                                        <defs>
                                            <pattern id="diagonalStripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.4)" strokeWidth="4" />
                                            </pattern>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="month"
                                            fontSize={12}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontWeight: 500 }}
                                            dy={15}
                                        />
                                        <YAxis
                                            fontSize={12}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontWeight: 500 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fbfc', opacity: 0.4 }} />
                                        <Bar dataKey="totalSales" fill="#f3f4f6" radius={[12, 12, 12, 12]} barSize={60} />
                                        <Bar dataKey="totalRevenue" radius={[12, 12, 12, 12]} barSize={60}>
                                            {performanceTrend.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={index === performanceTrend.length - 1 ? '#f69826' : '#e5e7eb'}
                                                />
                                            ))}
                                        </Bar>
                                        {/* Pattern and Dot for the latest month bar */}
                                        {performanceTrend.map((entry, index) => (
                                            index === performanceTrend.length - 1 && (
                                                <ReferenceDot
                                                    key="peak"
                                                    x={entry.month}
                                                    y={entry.totalRevenue}
                                                    r={4}
                                                    fill="#8b5cf6"
                                                    stroke="#fff"
                                                    strokeWidth={2}
                                                    isFront
                                                />
                                            )
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="bg-white border-none shadow-sm rounded-[1rem] p-8 flex flex-col items-stretch">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-gray-900">Sales Overview</h3>
                                <div className="bg-gray-50 p-2 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <DiscreteGauge percentage={growthPercentage} />

                            <div className="space-y-4 mt-auto">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-gray-50 rounded-2xl p-5 flex-1 shadow-sm border border-gray-50/50">
                                        <p className="text-[10px] text-gray-400 uppercase font-black mb-2 tracking-tight">Number of Sales</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-black text-gray-900">{metrics.totalSales.current}</span>
                                            <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-1 rounded-full flex items-center font-bold">
                                                {calculateTrend(metrics.totalSales.current, metrics.totalSales.last)}% <ArrowUpRight className="w-3 h-3 ml-1" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-5 flex-1 shadow-sm border border-gray-50/50">
                                        <p className="text-[10px] text-gray-400 uppercase font-black mb-2 tracking-tight">Total Revenue</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-black text-gray-900">Rs {metrics.revenue.current.toLocaleString()}</span>
                                            <span className="text-[9px] bg-black text-white px-2 py-1 rounded-full flex items-center font-bold">
                                                {calculateTrend(metrics.revenue.current, metrics.revenue.last)}% <ArrowUpRight className="w-3 h-3 ml-1" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Table Section */}
                    <Card className="bg-white border-none shadow-sm rounded-[1rem] overflow-hidden p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-xl text-gray-900">Recent orders</h3>
                            <div className="flex items-center space-x-4">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                    <Input
                                        placeholder="Search orders, customers, products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 h-11 rounded-2xl border-none bg-gray-50 text-xs w-72 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all font-medium"
                                    />
                                </div>
                                <Button variant="outline" className="h-11 px-5 rounded-2xl text-xs border-none bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100">
                                    <Filter className="mr-2 w-4 h-4 text-gray-400" /> Sort by <MoreHorizontal className="ml-2 w-4 h-4 text-gray-400 rotate-90" />
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-50/50">
                                        <th className="px-6 py-5 font-black tracking-widest text-left">Product info</th>
                                        <th className="px-6 py-5 font-black tracking-widest text-left">Order Id</th>
                                        <th className="px-6 py-5 font-black tracking-widest text-left">Date</th>
                                        <th className="px-6 py-5 font-black tracking-widest text-left">Customer</th>
                                        <th className="px-6 py-5 font-black tracking-widest text-left">Category</th>
                                        <th className="px-6 py-5 font-black tracking-widest text-left">Status</th>
                                        <th className="px-6 py-5 font-black tracking-widest text-left">Items</th>
                                        <th className="px-6 py-5 font-black tracking-widest text-left">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50/50">
                                    {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                                        <tr key={i} className="text-sm group hover:bg-[#fcfdff] transition-colors">
                                            <td className="px-6 py-5 font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{order.info}</td>
                                            <td className="px-6 py-5 text-gray-400 font-medium">{order.id}</td>
                                            <td className="px-6 py-5 text-gray-500 font-medium">{order.date}</td>
                                            <td className="px-6 py-5 text-gray-600 font-semibold">{order.customer}</td>
                                            <td className="px-6 py-5 text-gray-400 font-medium">{order.category}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${order.status === 'Completed' || order.status === 'active' ? 'bg-green-50 text-green-600' :
                                                        order.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                                                            'bg-orange-50 text-orange-600'
                                                    }`}>
                                                    {order.status || 'Completed'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-gray-900">{order.items}</td>
                                            <td className="px-6 py-5 font-black text-gray-900 text-lg">{order.total}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-medium italic">No orders found matching your search...</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-8 flex justify-center">
                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] italic">Linked to live system data</p>
                        </div>
                    </Card>

                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
