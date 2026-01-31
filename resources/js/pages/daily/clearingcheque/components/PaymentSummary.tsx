import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Wallet,
    Banknote,
    ArrowUpCircle,
    ArrowDownCircle
} from "lucide-react";

interface Stats {
    sales: { total: number; paid: number; due: number };
    purchases: { total: number; paid: number; due: number };
    payments: { receipts: number; payments: number };
    clearing: {
        available_funds: number;
        pending_receipts_amount: number;
        pending_payments_amount: number;
    };
}

export default function PaymentSummary({ stats }: { stats: Stats }) {
    const totalPending = Number(stats.clearing.pending_receipts_amount) + Number(stats.clearing.pending_payments_amount);

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {/* Available Funds */}
            <Card className="p-0 border-none shadow-md dark:shadow-2xl overflow-hidden relative group transition-all duration-300 bg-[#fff7ed] dark:bg-[#1c1917] rounded-xl border border-orange-100 dark:border-border/50">
                <div className="absolute top-0 right-4 w-12 h-1 bg-emerald-500 rounded-b-full z-20"></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
                            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700/60 dark:text-emerald-400/40">Reliable Funds</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#9a3412]/40 dark:text-[#d6d3d1]/30 uppercase tracking-widest leading-none">Available Capital</p>
                        <h3 className="text-2xl font-black text-foreground dark:text-white tracking-tighter">
                            <span className="text-xs opacity-40 mr-1.5 font-sans">Rs</span>
                            {Number(stats.clearing.available_funds).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                        </h3>
                    </div>
                </CardContent>
            </Card>

            {/* Pending Cheques */}
            <Card className="p-0 border-none shadow-md dark:shadow-2xl overflow-hidden relative group transition-all duration-300 bg-[#fff7ed] dark:bg-[#1c1917] rounded-xl border border-orange-100 dark:border-border/50">
                <div className="absolute top-0 right-4 w-12 h-1 bg-amber-500 rounded-b-full z-20"></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
                            <Banknote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700/60 dark:text-amber-400/40">In Processing</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#9a3412]/40 dark:text-[#d6d3d1]/30 uppercase tracking-widest leading-none">Pending Pipeline</p>
                        <h3 className="text-2xl font-black text-foreground dark:text-white tracking-tighter">
                            <span className="text-xs opacity-40 mr-1.5 font-sans">Rs</span>
                            {totalPending.toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                        </h3>
                    </div>
                </CardContent>
            </Card>

            {/* Total Receipts */}
            <Card className="p-0 border-none shadow-md dark:shadow-2xl overflow-hidden relative group transition-all duration-300 bg-[#fff7ed] dark:bg-[#1c1917] rounded-xl border border-orange-100 dark:border-border/50">
                <div className="absolute top-0 right-4 w-12 h-1 bg-blue-500 rounded-b-full z-20"></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                            <ArrowDownCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700/60 dark:text-blue-400/40">Capital Inflow</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#9a3412]/40 dark:text-[#d6d3d1]/30 uppercase tracking-widest leading-none">Total Receipts</p>
                        <h3 className="text-2xl font-black text-foreground dark:text-white tracking-tighter">
                            <span className="text-xs opacity-40 mr-1.5 font-sans">Rs</span>
                            {Number(stats.payments.receipts).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                        </h3>
                    </div>
                </CardContent>
            </Card>

            {/* Total Payments */}
            <Card className="p-0 border-none shadow-md dark:shadow-2xl overflow-hidden relative group transition-all duration-300 bg-[#fff7ed] dark:bg-[#1c1917] rounded-xl border border-orange-100 dark:border-border/50">
                <div className="absolute top-0 right-4 w-12 h-1 bg-rose-500 rounded-b-full z-20"></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-rose-500/10 dark:bg-rose-500/20 rounded-lg">
                            <ArrowUpCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700/60 dark:text-rose-400/40">Capital Outflow</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#9a3412]/40 dark:text-[#d6d3d1]/30 uppercase tracking-widest leading-none">Total Payments</p>
                        <h3 className="text-2xl font-black text-foreground dark:text-white tracking-tighter">
                            <span className="text-xs opacity-40 mr-1.5 font-sans">Rs</span>
                            {Number(stats.payments.payments).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                        </h3>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
