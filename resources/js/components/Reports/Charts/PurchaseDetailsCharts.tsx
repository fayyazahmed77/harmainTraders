import React, { useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    ScatterChart, Scatter, ZAxis, ReferenceLine, PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const PurchaseDetailsCharts = ({ data, isDark }: { data: any[], isDark: boolean }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, label: 'Item Volume' },
        { id: 1, label: 'TP vs Rate' },
        { id: 2, label: 'Bonus Efficiency' },
        { id: 3, label: 'Tax Burden' }
    ];

    // Data Aggregations
    const itemVolume = data.reduce((acc: any[], curr) => {
        const name = curr.product_name || curr.item;
        const existing = acc.find(a => a.name === name);
        const qty = Number(curr.qty_full) || 0;
        const bonus = Number(curr.b_full) || 0;
        if (existing) {
            existing.qty += qty;
            existing.bonus += bonus;
        } else {
            acc.push({ name, qty, bonus });
        }
        return acc;
    }, []).sort((a, b) => (b.qty + b.bonus) - (a.qty + a.bonus)).slice(0, 8);

    const scatterData = data.map(r => ({
        name: r.product_name || r.item,
        tp: Number(r.tp) || 0,
        rate: Number(r.rate) || 0,
        diff: (Number(r.tp) || 0) - (Number(r.rate) || 0)
    })).filter(d => d.tp > 0).slice(0, 50);

    const bonusData = itemVolume.map(item => ({
        name: item.name,
        value: item.bonus,
        qty: item.qty
    })).filter(d => d.value > 0);

    const waterfallData = [
        { name: 'Gross', value: data.reduce((acc, r) => acc + (Number(r.amount) || 0), 0), fill: '#10b981' },
        { name: 'Discount', value: -data.reduce((acc, r) => acc + (Number(r.disc_1 || r.discount) || 0), 0), fill: '#f43f5e' },
        { name: 'Tax', value: data.reduce((acc, r) => acc + (Number(r.tax_amt || r.tax) || 0), 0), fill: '#3b82f6' },
        { name: 'Net', value: data.reduce((acc, r) => acc + (Number(r.amount) || 0), 0), fill: '#10b981' }
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border p-4 rounded-xl shadow-2xl backdrop-blur-md`}>
                    <p className={`text-xs font-black ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase mb-2`}>{payload[0].payload.name || label}</p>
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {p.name}: <span className="tabular-nums">{Number(p.value).toLocaleString()}</span>
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
            <div className={`flex gap-2 p-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} rounded-xl w-fit border overflow-x-auto shrink-0 shadow-sm`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                            activeTab === tab.id 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : `${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={`h-[500px] w-full ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-3xl p-8 relative shadow-sm`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="w-full h-full"
                    >
                        {activeTab === 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={itemVolume}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke={isDark ? '#64748b' : '#94a3b8'} 
                                        fontSize={9} 
                                        fontWeight="black"
                                        tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                                    />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', color: isDark ? '#64748b' : '#94a3b8' }} />
                                    <Bar dataKey="qty" name="Purchased Qty" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1000} />
                                    <Bar dataKey="bonus" name="Bonus Received" fill="#f43f5e" radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={300} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 1 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                                    <XAxis type="number" dataKey="tp" name="Trade Price" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <YAxis type="number" dataKey="rate" name="Purchase Rate" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <ZAxis type="number" dataKey="diff" range={[50, 400]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 5000, y: 5000 }]} stroke={isDark ? '#334155' : '#cbd5e1'} strokeDasharray="5 5" />
                                    <Scatter name="Items" data={scatterData} animationDuration={1500}>
                                        {scatterData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.rate > entry.tp ? '#f43f5e' : '#10b981'} 
                                                fillOpacity={0.7}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 2 && (
                            <div className="flex flex-col md:flex-row h-full items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={bonusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                            animationDuration={1500}
                                        >
                                            {bonusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', color: isDark ? '#64748b' : '#94a3b8' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="md:w-1/3 text-center md:text-left flex flex-col justify-center">
                                    <h3 className="text-emerald-500 font-black text-3xl tabular-nums tracking-tighter">
                                        PKR {data.reduce((acc, r) => acc + (Number(r.b_full || 0) * (Number(r.tp) || 0)), 0).toLocaleString()}
                                    </h3>
                                    <p className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-[10px] font-black uppercase tracking-widest mt-2`}>
                                        Total Estimated Bonus Value Saved
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 3 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={waterfallData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                                    <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="black" />
                                    <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" animationDuration={1000}>
                                        {waterfallData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PurchaseDetailsCharts;
