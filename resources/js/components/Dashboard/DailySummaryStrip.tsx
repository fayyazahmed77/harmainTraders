import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
    ShoppingCart, 
    Truck, 
    CreditCard, 
    ArrowDownCircle, 
    TrendingUp,
    LucideIcon
} from "lucide-react";

interface DailySummary {
    dailySales: number;
    dailyPurchases: number;
    dailyExpenses: number;
    dailyRecoveries: number;
    dailyProfit: number;
}

interface DailySummaryStripProps {
    dailySummary: DailySummary;
}

interface StatItem {
    label: string;
    value: number;
    color: string;
    bgColor: string;
    iconColor: string;
    icon: LucideIcon;
    isCurrency: boolean;
}

const DailySummaryStrip: React.FC<DailySummaryStripProps> = ({ dailySummary }) => {
    const stats: StatItem[] = [
        {
            label: 'No. of Sales',
            value: dailySummary.dailySales,
            color: '#e07b1a', // orange
            bgColor: 'bg-orange-500/10',
            iconColor: 'text-orange-500',
            icon: ShoppingCart,
            isCurrency: false
        },
        {
            label: 'No. of Purchases',
            value: dailySummary.dailyPurchases,
            color: '#4caf7a', // green
            bgColor: 'bg-emerald-500/10',
            iconColor: 'text-emerald-500',
            icon: Truck,
            isCurrency: false
        },
        {
            label: 'Expenses',
            value: dailySummary.dailyExpenses,
            color: '#e05a4a', // red
            bgColor: 'bg-red-500/10',
            iconColor: 'text-red-500',
            icon: CreditCard,
            isCurrency: true
        },
        {
            label: 'Today Recoveries',
            value: dailySummary.dailyRecoveries,
            color: '#4a9ede', // blue
            bgColor: 'bg-blue-500/10',
            iconColor: 'text-blue-500',
            icon: ArrowDownCircle,
            isCurrency: true
        },
        {
            label: 'Profit',
            value: dailySummary.dailyProfit,
            color: '#9b7de0', // purple
            bgColor: 'bg-purple-500/10',
            iconColor: 'text-purple-500',
            icon: TrendingUp,
            isCurrency: true
        }
    ];

    const formatCurrency = (val: number): string => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val).replace('PKR', 'Rs');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {stats.map((stat, index) => (
                <Card 
                    key={index} 
                    className="border-gray-200 dark:border-gray-800 overflow-hidden "
                >
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    {stat.label}
                                </p>
                                <h3 
                                    className="text-lg font-black leading-none"
                                    style={{ color: stat.color }}
                                >
                                    {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                                </h3>
                                <p className="text-[8px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-tighter">
                                    Today
                                </p>
                            </div>
                            <div className={`p-1.5 ${stat.bgColor} rounded-md shrink-0 ml-2`}>
                                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default DailySummaryStrip;
