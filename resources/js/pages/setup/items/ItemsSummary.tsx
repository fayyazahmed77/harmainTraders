import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle, DollarSign, AlertTriangle, XCircle } from "lucide-react";

interface SummaryProps {
    summary: {
        total_items: number;
        active_items: number;
        stock_value: number;
        out_of_stock: number;
        low_stock: number;
    };
}

export default function ItemsSummary({ summary }: SummaryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const cards = [
        {
            title: "Total Items",
            value: summary.total_items,
            icon: Package,
            color: "bg-gradient-to-br from-blue-500 to-blue-600",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Active Items",
            value: summary.active_items,
            icon: CheckCircle,
            color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Stock Value",
            value: summary.stock_value,
            icon: DollarSign,
            color: "bg-gradient-to-br from-violet-500 to-violet-600",
            textColor: "text-white",
            isCurrency: true,
        },
        {
            title: "Out of Stock",
            value: summary.out_of_stock,
            icon: XCircle,
            color: "bg-gradient-to-br from-red-500 to-red-600",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Low Stock",
            value: summary.low_stock,
            icon: AlertTriangle,
            color: "bg-gradient-to-br from-amber-400 to-amber-500",
            textColor: "text-white",
            isCurrency: false,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            {cards.map((card, index) => (
                <Card key={index} className={`${card.color} border-none shadow-lg transform transition-all hover:scale-105 duration-300`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${card.textColor} opacity-90`}>
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.textColor} opacity-75`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${card.textColor}`}>
                            {card.isCurrency ? formatCurrency(card.value) : card.value}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
