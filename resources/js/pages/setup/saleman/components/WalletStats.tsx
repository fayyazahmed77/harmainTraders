import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, TrendingUp, ArrowUpRight, DollarSign } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StatsProps {
    type: "earned" | "paid" | "balance";
    data: any; // { value: number, label: string }
    trend?: any[]; // For mini chart
}

export default function WalletStats({ type, data, trend }: StatsProps) {
    const theme = {
        earned: {
            gradient: "from-emerald-500 to-teal-600",
            iconBg: "bg-emerald-500/10 text-emerald-500",
            accent: "text-emerald-500",
            chartColor: "#10b981",
            border: "border-emerald-500/10",
        },
        paid: {
            gradient: "from-rose-500 to-pink-600",
            iconBg: "bg-rose-500/10 text-rose-500",
            accent: "text-rose-500",
            chartColor: "#f43f5e",
            border: "border-rose-500/10",
        },
        balance: {
            gradient: "from-blue-500 to-indigo-600",
            iconBg: "bg-blue-500/10 text-blue-500",
            accent: "text-blue-500",
            chartColor: "#3b82f6",
            border: "border-blue-500/10",
        }
    }[type];

    const currentTheme = theme;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace('PKR', '').trim();
    };

    const Chart = () => (
        <div className="h-16 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend || []}>
                    <defs>
                        <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={currentTheme.chartColor} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={currentTheme.chartColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={currentTheme.chartColor}
                        strokeWidth={2}
                        fill={`url(#gradient-${type})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <Card className={`p-0 border overflow-hidden relative group transition-all duration-300 rounded-[0.5rem] ${currentTheme.border} bg-card`}>
            <CardContent className="p-6 flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                            {data.label}
                        </p>
                        <h3 className="text-2xl font-black tracking-tight mt-1 flex items-baseline gap-1">
                            <span className="text-sm text-muted-foreground font-normal">Rs</span>
                            {formatCurrency(data.value)}
                        </h3>
                    </div>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${currentTheme.iconBg}`}>
                        {type === 'earned' && <TrendingUp className="h-5 w-5" />}
                        {type === 'paid' && <CreditCard className="h-5 w-5" />}
                        {type === 'balance' && <Wallet className="h-5 w-5" />}
                    </div>
                </div>

                {/* Mini Graph or details */}
                {trend && trend.length > 0 && <Chart />}

                <div className="mt-auto pt-4 flex items-center gap-2">
                    <div className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${currentTheme.iconBg} ${currentTheme.accent}`}>
                        LIVE
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                        Updated just now
                    </span>
                </div>
            </CardContent>

            {/* Background Decoration */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-10 ${type === 'earned' ? 'bg-emerald-500' : type === 'paid' ? 'bg-rose-500' : 'bg-blue-500'}`} />
        </Card>
    );
}
