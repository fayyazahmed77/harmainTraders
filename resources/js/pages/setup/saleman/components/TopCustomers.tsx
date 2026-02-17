import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MapPin } from "lucide-react";

interface TopCustomersProps {
    customers: any[];
}

export default function TopCustomers({ customers }: TopCustomersProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace('PKR', '').trim();
    };

    return (
        <Card className="h-full border-none shadow-sm bg-card/50 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Top Customers
                    </CardTitle>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">VOL</span>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="divide-y divide-border/50">
                    {customers.map((customer, index) => (
                        <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="text-xs font-bold leading-none">{customer.name}</p>
                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {customer.location}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black font-mono">
                                    <span className="text-[9px] text-muted-foreground mr-1">Rs</span>
                                    {formatCurrency(customer.total_volume)}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-medium">
                                    {customer.total_count} Orders
                                </p>
                            </div>
                        </div>
                    ))}
                    {customers.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-xs">
                            No customer data available
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
