import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecentSalesProps {
    sales: any[];
}

export default function RecentSales({ sales }: RecentSalesProps) {
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
                        <ShoppingCart className="h-4 w-4 text-emerald-500" />
                        Recent Sales
                    </CardTitle>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">LATEST</span>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold sticky top-0 bg-card z-10">
                            <tr>
                                <th className="px-4 py-3">Invoice</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-right">Comm.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {sales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-3 font-medium font-mono whitespace-nowrap">{sale.invoice_no}</td>
                                    <td className="px-4 py-3 truncate max-w-[100px]">{sale.customer}</td>
                                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                                        {formatCurrency(sale.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold whitespace-nowrap">
                                        +{formatCurrency(sale.commission)}
                                    </td>
                                </tr>
                            ))}
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No recent sales found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
