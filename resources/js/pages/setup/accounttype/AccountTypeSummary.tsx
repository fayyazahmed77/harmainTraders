import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";

interface SummaryProps {
    count: number;
}

export default function AccountTypeSummary({ count }: SummaryProps) {
    const cards = [
        {
            title: "Total Account Types",
            value: count,
            icon: Layers,
            color: "bg-gradient-to-br from-orange-500 to-orange-600",
            textColor: "text-white",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
                            {card.value}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
