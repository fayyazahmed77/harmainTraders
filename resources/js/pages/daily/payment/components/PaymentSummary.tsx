import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, FileText } from "lucide-react";

interface SummaryProps {
    summary: {
        total_receipts: number;
        total_payments: number;
        net_flow: number;
        count: number;
        active_count: number;
        canceled_count: number;
        canceled_amount: number;
    };
}

export default function PaymentSummary({ summary }: SummaryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Receipts */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none text-white shadow-lg overflow-hidden relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute right-0 top-0 h-full w-24 bg-white/10 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform duration-500"></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-100 font-medium text-sm">Total Receipts</p>
                            <h3 className="text-2xl font-bold mt-1 text-white" title={formatCurrency(summary.total_receipts)}>
                                {formatCurrency(summary.total_receipts)}
                            </h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm transition-transform group-hover:scale-110">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-emerald-100">
                        <span className="bg-emerald-400/30 px-2 py-0.5 rounded text-xs mr-2 font-bold">Inflow</span>
                        Money received
                    </div>
                </CardContent>
            </Card>

            {/* Total Payments */}
            <Card className="bg-gradient-to-br from-rose-500 to-pink-600 border-none text-white shadow-lg overflow-hidden relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute right-0 top-0 h-full w-24 bg-white/10 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform duration-500"></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-rose-100 font-medium text-sm">Total Payments</p>
                            <h3 className="text-2xl font-bold mt-1 text-white" title={formatCurrency(summary.total_payments)}>
                                {formatCurrency(summary.total_payments)}
                            </h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm transition-transform group-hover:scale-110">
                            <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-rose-100">
                        <span className="bg-rose-400/30 px-2 py-0.5 rounded text-xs mr-2 font-bold">Outflow</span>
                        Money paid
                    </div>
                </CardContent>
            </Card>

            {/* Net Cash Flow */}
            <Card className={`border-none text-white shadow-lg overflow-hidden relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${summary.net_flow >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
                <div className="absolute right-0 top-0 h-full w-24 bg-white/10 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform duration-500"></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`font-medium text-sm ${summary.net_flow >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>Net Cash Flow</p>
                            <h3 className="text-2xl font-bold mt-1 text-white">
                                {formatCurrency(summary.net_flow)}
                            </h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm transition-transform group-hover:scale-110">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className={`mt-4 flex items-center text-sm ${summary.net_flow >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>
                        <span className={`px-2 py-0.5 rounded text-xs mr-2 font-bold ${summary.net_flow >= 0 ? 'bg-blue-400/30' : 'bg-orange-400/30'}`}>
                            {summary.net_flow >= 0 ? 'Positive' : 'Negative'}
                        </span>
                        Receipts - Payments
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Count */}
            <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-none text-white shadow-lg overflow-hidden relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute right-0 top-0 h-full w-24 bg-white/10 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform duration-500"></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-violet-100 font-medium text-sm">Transactions</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold mt-1 text-white">
                                    {summary.active_count}
                                </h3>
                                {summary.canceled_count > 0 && (
                                    <span className="text-sm text-violet-200 line-through decoration-white/40">
                                        + {summary.canceled_count} canceled
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm transition-transform group-hover:scale-110">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1">
                        <div className="flex items-center text-sm text-violet-100 font-bold">
                            <span className="bg-violet-400/30 px-2 py-0.5 rounded text-xs mr-2 tracking-wide">Volume</span>
                            {summary.count} Total records
                        </div>
                        {summary.canceled_amount > 0 && (
                            <div className="text-[10px] text-violet-200 ml-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                {formatCurrency(summary.canceled_amount)} reversed
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
