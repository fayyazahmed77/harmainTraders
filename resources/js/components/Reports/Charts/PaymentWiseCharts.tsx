import React, { useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, ComposedChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentWiseCharts = ({ data, isDark }: { data: any[], isDark: boolean }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, label: 'Area Heatmap' },
        { id: 1, label: 'Liability Gap' },
        { id: 2, label: 'Waterfall' },
        { id: 3, label: 'Area Share' }
    ];

    // Data Transformations
    const areaStats = data.reduce((acc: any[], curr) => {
        const area = curr.area_name || 'Other';
        const existing = acc.find(a => a.name === area);
        const purchase = Number(curr.total_purchase) || 0;
        const payment = Number(curr.total_payment) || 0;
        const balance = Number(curr.balance) || 0;
        if (existing) {
            existing.purchase += purchase;
            existing.payment += payment;
            existing.balance += balance;
            existing.count++;
        } else {
            acc.push({ name: area, purchase, payment, balance, count: 1 });
        }
        return acc;
    }, []).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    const topSuppliers = [...data].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 8);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border p-4 rounded-xl shadow-2xl backdrop-blur-md`}>
                    <p className={`text-xs font-black ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase mb-2`}>{payload[0].payload.account_name || payload[0].payload.name || label}</p>
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {p.name}: <span className="tabular-nums">PKR {Number(Math.abs(p.value)).toLocaleString()}</span>
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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="w-full h-full"
                    >
                        {activeTab === 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {areaStats.map((area, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:border-rose-500/50' : 'bg-white border-slate-200 hover:border-rose-500/50'} border p-4 rounded-2xl flex flex-col items-center justify-center text-center group transition-all shadow-sm dark:shadow-none`}
                                    >
                                        <div className={`h-3 w-full rounded-full mb-3 ${isDark ? 'bg-slate-900' : 'bg-slate-100'} overflow-hidden`}>
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (Math.abs(area.balance) / 500000) * 100)}%` }}
                                                className="h-full bg-rose-500"
                                            />
                                        </div>
                                        <p className={`text-[10px] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest truncate w-full`}>{area.name}</p>
                                        <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>PKR {Math.abs(area.balance).toLocaleString()}</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {activeTab === 1 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topSuppliers}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis dataKey="account_name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} fontWeight="black" tickFormatter={(val) => val.substring(0, 10)} />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total_purchase" name="Purchases" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="total_payment" name="Payments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 2 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={areaStats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} fontWeight="black" />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="balance" name="Liability Flow" radius={[4, 4, 4, 4]}>
                                        {areaStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.balance > 0 ? '#10b981' : '#f43f5e'} />
                                        ))}
                                    </Bar>
                                    <Line type="monotone" dataKey="purchase" name="Purchase Volume" stroke="#6366f1" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 3 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={areaStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="purchase"
                                        animationDuration={1500}
                                    >
                                        {areaStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', color: isDark ? '#64748b' : '#94a3b8' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PaymentWiseCharts;
