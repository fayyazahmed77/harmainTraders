import React, { useState } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, ComposedChart, Line, Legend, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const MonthWiseCharts = ({ data, isDark }: { data: any[], isDark: boolean }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, label: 'Trend' },
        { id: 1, label: 'Growth' },
        { id: 2, label: 'Seasonal' },
        { id: 3, label: 'Liability' }
    ];

    // Data Transformations
    const monthStats = data.reduce((acc: any[], curr) => {
        const month = curr.month_name;
        const existing = acc.find(a => a.name === month);
        const purchase = Number(curr.total_amount) || 0;
        const payment = Number(curr.paid_amount) || 0;
        const balance = Number(curr.balance) || 0;
        if (existing) {
            existing.purchase += purchase;
            existing.payment += payment;
            existing.balance += balance;
        } else {
            acc.push({ name: month, purchase, payment, balance });
        }
        return acc;
    }, []);

    const growthData = monthStats.map((m, idx) => {
        const prev = monthStats[idx - 1];
        const growth = prev ? ((m.purchase - prev.purchase) / prev.purchase) * 100 : 0;
        return { ...m, growth };
    });

    let cumulativeBalance = 0;
    const cumulativeData = monthStats.map(m => {
        cumulativeBalance += m.balance;
        return { ...m, cumulativeBalance };
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border p-4 rounded-xl shadow-2xl backdrop-blur-md`}>
                    <p className={`text-xs font-black ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase mb-2`}>{label}</p>
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {p.name}: <span className="tabular-nums">
                                    {p.name.includes('Growth') ? `${Number(p.value).toFixed(1)}%` : `PKR ${Number(Math.abs(p.value)).toLocaleString()}`}
                                </span>
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

            <div className={`h-[500px] w-full ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-3xl p-8 relative shadow-sm overflow-y-auto custom-scrollbar`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full h-full"
                    >
                        {activeTab === 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthStats}>
                                    <defs>
                                        <linearGradient id="colorMonth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="black" />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="purchase" name="Monthly Purchase" stroke="#10b981" fillOpacity={1} fill="url(#colorMonth)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="payment" name="Monthly Payment" stroke="#3b82f6" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 1 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={growthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="black" />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="purchase" name="Purchase Volume" fill={isDark ? '#1e293b' : '#f1f5f9'} radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="growth" name="Growth Rate %" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 2 && (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                {monthStats.map((month, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-emerald-500/10' : 'bg-white border-slate-200 hover:bg-emerald-500/5'} border p-6 rounded-2xl flex flex-col items-center justify-center group transition-all shadow-sm dark:shadow-none`}
                                    >
                                        <p className={`text-[10px] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>{month.name}</p>
                                        <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-2`}>PKR {Number(month.purchase).toLocaleString()}</p>
                                        <div className={`mt-4 flex gap-1 h-1.5 w-full ${isDark ? 'bg-slate-900' : 'bg-slate-100'} rounded-full overflow-hidden`}>
                                            <div className="h-full bg-emerald-500" style={{ width: `${(month.payment / month.purchase) * 100}%` }} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {activeTab === 3 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cumulativeData}>
                                    <defs>
                                        <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="black" />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="cumulativeBalance" name="Cumulative Debt" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCum)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MonthWiseCharts;
