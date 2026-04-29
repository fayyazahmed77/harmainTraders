import React, { useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    ScatterChart, Scatter, ZAxis, Treemap, PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ItemWiseCharts = ({ data, isDark }: { data: any[], isDark: boolean }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, label: 'Value Ranking' },
        { id: 1, label: 'Efficiency' },
        { id: 2, label: 'Share Treemap' },
        { id: 3, label: 'Packing Dist' }
    ];

    // Data Transformations
    const rankingData = [...data].sort((a, b) => (Number(b.net_amount) || 0) - (Number(a.net_amount) || 0)).slice(0, 10);
    
    const scatterData = data.map(r => ({
        name: r.name,
        gross: Number(r.gross_amount) || 0,
        net: Number(r.net_amount) || 0,
        full: Number(r.qty_full) || 0,
        ratio: (Number(r.net_amount) || 1) / (Number(r.gross_amount) || 1)
    })).filter(d => d.gross > 0).slice(0, 30);

    const treemapData = {
        name: "Procurement",
        children: data.slice(0, 15).map(r => ({
            name: r.name,
            size: Number(r.net_amount) || 0,
            disc: (Number(r.discount_amount) || 0) / (Number(r.gross_amount) || 1)
        }))
    };

    const packingData = data.reduce((acc: any[], curr) => {
        const packing = curr.packing || 'Other';
        const existing = acc.find(a => a.name === packing);
        if (existing) {
            existing.value++;
        } else {
            acc.push({ name: packing, value: 1 });
        }
        return acc;
    }, []).sort((a, b) => b.value - a.value);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border p-4 rounded-xl shadow-2xl backdrop-blur-md`}>
                    <p className={`text-xs font-black ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase mb-2`}>
                        {payload[0].payload.name || label}
                    </p>
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

            <div className={`h-[500px] w-full ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-3xl p-8 relative shadow-sm`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full h-full"
                    >
                        {activeTab === 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rankingData} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                                    <XAxis type="number" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        stroke={isDark ? '#64748b' : '#94a3b8'} 
                                        fontSize={9} 
                                        fontWeight="black" 
                                        width={100}
                                        tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="net_amount" name="Net Value" radius={[0, 4, 4, 0]} animationDuration={1000}>
                                        {rankingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={1 - (index * 0.05)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 1 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                                    <XAxis type="number" dataKey="gross" name="Gross" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <YAxis type="number" dataKey="net" name="Net" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} fontWeight="bold" />
                                    <ZAxis type="number" dataKey="full" range={[100, 1000]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Scatter name="Items" data={scatterData} animationDuration={1500}>
                                        {scatterData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.ratio < 0.9 ? '#10b981' : '#f43f5e'} 
                                                fillOpacity={0.6}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 2 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <Treemap
                                    data={treemapData.children}
                                    dataKey="size"
                                    stroke={isDark ? '#0f172a' : '#ffffff'}
                                    fill="#10b981"
                                    animationDuration={1500}
                                >
                                    <Tooltip content={<CustomTooltip />} />
                                </Treemap>
                            </ResponsiveContainer>
                        )}

                        {activeTab === 3 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={packingData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {packingData.map((entry, index) => (
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

export default ItemWiseCharts;
