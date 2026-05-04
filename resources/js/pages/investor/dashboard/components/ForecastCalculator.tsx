"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Calculator, 
    TrendingUp, 
    ArrowRight, 
    Info,
    Coins,
    BarChart3,
    ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
    currentCapital: number;
    businessStats: {
        avg_monthly_profit: number;
        total_business_capital: number;
        avg_roi_percent: number;
    };
}

export function ForecastCalculator({ currentCapital, businessStats }: Props) {
    const [investment, setInvestment] = useState(100000);
    const [months, setMonths] = useState(12);

    const results = useMemo(() => {
        const newTotalCapital = businessStats.total_business_capital + investment;
        const newMyCapital = currentCapital + investment;
        const newOwnershipPercent = (newMyCapital / newTotalCapital) * 100;
        
        // Estimated monthly profit based on business average ROI
        const estimatedMonthlyProfit = (newMyCapital * (businessStats.avg_roi_percent / 100));
        const totalProjectedReturn = estimatedMonthlyProfit * months;

        return {
            newOwnershipPercent,
            estimatedMonthlyProfit,
            totalProjectedReturn,
            roi: ((totalProjectedReturn / investment) * 100).toFixed(1)
        };
    }, [investment, months, currentCapital, businessStats]);

    return (
        <Card className="border-white/5 bg-[#111318] overflow-hidden shadow-2xl">
            <CardContent className="p-0">
                {/* Header */}
                <div className="p-5 border-b border-white/5 bg-gradient-to-r from-[#C9A84C]/10 to-transparent">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#C9A84C]/10 rounded-lg text-[#C9A84C]">
                            <Calculator size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#F1F1F1]">Investment Strategy Tool</h3>
                            <p className="text-[10px] text-[#6B7280] uppercase tracking-widest font-black">Simulation Engine</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">New Capital Investment</Label>
                                <span className="text-sm font-black text-[#C9A84C] tabular-nums">PKR {investment.toLocaleString()}</span>
                            </div>
                            <Slider
                                value={[investment]}
                                max={5000000}
                                step={50000}
                                onValueChange={(vals) => setInvestment(vals[0])}
                                className="[&_[role=slider]]:bg-[#C9A84C]"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Time Horizon</Label>
                                <span className="text-sm font-black text-[#F1F1F1] tabular-nums">{months} Months</span>
                            </div>
                            <Slider
                                value={[months]}
                                max={36}
                                min={1}
                                step={1}
                                onValueChange={(vals) => setMonths(vals[0])}
                                className="[&_[role=slider]]:bg-[#F1F1F1]"
                            />
                        </div>
                    </div>

                    {/* Result Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#6B7280]">New Ownership</p>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-[#3B82F6]" />
                                <span className="text-lg font-black text-[#F1F1F1]">{results.newOwnershipPercent.toFixed(3)}%</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-[#C9A84C]/5 border border-[#C9A84C]/10 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/70">Monthly Yield</p>
                            <div className="flex items-center gap-2">
                                <Coins size={14} className="text-[#C9A84C]" />
                                <span className="text-lg font-black text-[#F1F1F1]">PKR {Math.round(results.estimatedMonthlyProfit).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Projection */}
                    <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[#181C23] to-[#111318] border border-white/5 overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart3 size={64} className="text-[#C9A84C]" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] mb-2">Total Projected Profit ({months}m)</p>
                            <h4 className="text-3xl font-black text-[#F1F1F1] tracking-tighter">
                                PKR {Math.round(results.totalProjectedReturn).toLocaleString()}
                            </h4>
                            <div className="flex items-center gap-2 mt-3">
                                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                    <ArrowUpRight size={10} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase">{results.roi}% Est. Return</span>
                                </div>
                                <span className="text-[9px] text-[#374151] font-bold uppercase tracking-tight italic">Based on {businessStats.avg_roi_percent}% avg business ROI</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex gap-3 items-start">
                        <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-[9px] text-blue-400/80 leading-relaxed font-medium">
                            This simulation uses historical business performance ({businessStats.avg_roi_percent}% monthly avg) and accounts for the capital dilution across the entire partner pool. Past performance does not guarantee future results.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
