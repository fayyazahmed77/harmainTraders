import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserMinus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface SummaryProps {
    summary: {
        total_accounts: number;
        customers_count: number;
        suppliers_count: number;
        total_receivables: number;
        total_payables: number;
    };
}

export default function AccountSummary({ summary }: SummaryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const cards = [
        {
            title: "Total Accounts",
            value: summary.total_accounts,
            icon: Users,
            color: "bg-gradient-to-br from-gray-700 to-gray-800",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Customers",
            value: summary.customers_count,
            icon: UserCheck,
            color: "bg-gradient-to-br from-blue-500 to-blue-600",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Suppliers",
            value: summary.suppliers_count,
            icon: UserMinus,
            color: "bg-gradient-to-br from-cyan-500 to-blue-600",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Total Receivables",
            value: summary.total_receivables,
            icon: ArrowDownCircle,
            color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
            textColor: "text-white",
            isCurrency: true,
        },
        {
            title: "Total Payables",
            value: summary.total_payables,
            icon: ArrowUpCircle,
            color: "bg-gradient-to-br from-rose-500 to-red-600",
            textColor: "text-white",
            isCurrency: true,
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
