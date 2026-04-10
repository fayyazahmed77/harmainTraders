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
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const cards = [
        {
            title: "Total Accounts",
            value: summary.total_accounts,
            icon: Users,
            color: "from-zinc-800 to-zinc-950 dark:from-zinc-900 dark:to-black",
            iconBg: "bg-white/10",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Customers",
            value: summary.customers_count,
            icon: UserCheck,
            color: "from-blue-600 to-blue-800",
            iconBg: "bg-white/20",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Suppliers",
            value: summary.suppliers_count,
            icon: UserMinus,
            color: "from-indigo-600 to-indigo-800",
            iconBg: "bg-white/20",
            textColor: "text-white",
            isCurrency: false,
        },
        {
            title: "Total Receivables",
            value: summary.total_receivables,
            icon: ArrowDownCircle,
            color: "from-emerald-600 to-emerald-800",
            iconBg: "bg-white/20",
            textColor: "text-white",
            isCurrency: true,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => (
                <Card 
                    key={index} 
                    className={`bg-gradient-to-br ${card.color} border-none shadow-lg overflow-hidden relative group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <card.icon className="h-16 w-16" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className={`text-[10px] md:text-sm font-bold uppercase tracking-widest ${card.textColor} opacity-80`}>
                            {card.title}
                        </CardTitle>
                        <div className={`p-1.5 rounded-lg ${card.iconBg} backdrop-blur-md`}>
                            <card.icon className={`h-3 w-3 md:h-4 md:w-4 ${card.textColor}`} />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className={`text-xl md:text-2xl font-black ${card.textColor} tracking-tight`}>
                            {card.isCurrency ? formatCurrency(card.value) : card.value}
                        </div>
                        <div className={`h-1 w-8 mt-2 rounded-full ${card.iconBg}`} />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
