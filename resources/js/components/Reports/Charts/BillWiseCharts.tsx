import React, { useState } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ComposedChart, Line, Legend, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const BillWiseCharts = ({ data, isDark }: { data: any[], isDark: boolean }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, label: 'Timeline' },
        { id: 1, label: 'Suppliers' },
        { id: 2, label: 'Radar' },
        { id: 3, label: 'Gap' }
    ];

    // Data Transformation
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const supplierData = data.reduce((acc: any[], curr) => {
        const existing = acc.find(a => a.account === curr.account_name || a.account === curr.account);
        const name = curr.account_name || curr.account;
        const gross = Number(curr.gross_amount) || Number(curr.gross) || 0;
        if (existing) {
            existing.gross += gross;
        } else {
            acc.push({ account: name, gross });
        }
        return acc;
    }, []).sort((a, b) => b.gross - a.gross).slice(0, 10);

    const radarData = data.slice(0, 5).map(r => ({
        subject: (r.account_name || r.account || "N/A").substring(0, 10),
        Gross: Number(r.gross) || 0,
        Net: Number(r.amount) || 0,
        Discount: Number(r.discount) || 0,
        Paid: Number(r.paid_amount) || 0,
        fullMark: 150,
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border p-4 rounded-xl shadow-2xl backdrop-blur-md`}>
                    <p className={`text-xs font-black ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase mb-2`}>{label}</p>
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {p.name}: <span className="tabular-nums">PKR {Number(p.value).toLocaleString()}</span>
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Tab Bar */}
            <div className={`flex gap-2 p-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} rounded-xl w-fit border shrink-0 shadow-sm`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                            activeTab === tab.id 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : `${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Chart Container */}
            <div className={`h-[500px] w-full ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-3xl p-8 relative overflow-hidden shadow-sm`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full h-full"
                    >
                        {activeTab === 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sortedData}>
                                    <defs>
                                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke={isDark ? '#64748b' : '#94a3b8'} 
                                        fontSize={10} 
                                        fontWeight="bold"
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="amount" 
                                        name="Net Total"
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorNet)" 
                                        animationDuration={1500}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="paid_amount" 
                                        name="Cash Paid"
                                        stroke="#f43f5e" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorPaid)" 
                                        animationDuration={1500}
                                        animationBegin={500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 1 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={supplierData} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                                    <XAxis type="number" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <YAxis 
                                        dataKey="account" 
                                        type="category" 
                                        stroke={isDark ? '#64748b' : '#94a3b8'} 
                                        fontSize={9} 
                                        fontWeight="black" 
                                        width={80}
                                        tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="gross" name="Gross Spend" radius={[0, 4, 4, 0]} animationDuration={1000}>
                                        {supplierData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index < 3 ? '#059669' : '#10b981'} fillOpacity={1 - (index * 0.08)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 2 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    <PolarAngleAxis dataKey="subject" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    <Radar name="Gross" dataKey="Gross" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                    <Radar name="Net" dataKey="Net" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                    <Radar name="Discount" dataKey="Discount" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: isDark ? '#64748b' : '#94a3b8' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 3 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={sortedData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="amount" name="Billed Amount" fill={isDark ? '#1e293b' : '#f1f5f9'} radius={[4, 4, 0, 0]} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="paid_amount" 
                                        name="Payment Flow" 
                                        stroke="#f43f5e" 
                                        strokeWidth={4} 
                                        dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#ffffff' }}
                                        activeDot={{ r: 6 }}
                                        animationDuration={2000}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BillWiseCharts;
