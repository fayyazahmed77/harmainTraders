import React from "react";
import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ShoppingBag, 
    ChevronRight,
    RefreshCw,
    Receipt,
    CreditCard
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CatalogHeader } from "./components/CatalogHeader";
import { CatalogFooter } from "./components/CatalogFooter";
import { Cart } from "./components/types";

interface Bill {
    id: number;
    invoice: string;
    date: string;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
}

interface Payment {
    id: number;
    voucher_no: string;
    date: string;
    amount: number;
    payment_method: string;
}

interface GuestDashboardProps {
    account: {
        id: number;
        title: string;
        code: string;
    };
    summary: {
        current_balance: number;
        unpaid_count: number;
        total_unpaid: number;
    };
    unpaidBills: Bill[];
    paidBills: Bill[];
    recentPayments: Payment[];
    token: string;
}

export default function GuestDashboard({ account, summary, unpaidBills, paidBills, recentPayments, token }: GuestDashboardProps) {
    const [cart, setCart] = React.useState<Cart>(() => {
        const saved = localStorage.getItem(`cart_${token}`);
        return saved ? JSON.parse(saved) : {};
    });

    const cartCount = Object.keys(cart).length;
    const cartTotal = Object.values(cart).reduce((acc, item) => {
        return acc + (item.qty_carton * item.price_carton) + (item.qty_pcs * (item.price_piece || 0));
    }, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(amount).replace('PKR', 'Rs');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100">
            <Head title="Customer Dashboard" />

            <CatalogHeader 
                search=""
                setSearch={() => {}}
                cartCount={cartCount}
                cartTotal={cartTotal}
                formatCurrency={formatCurrency}
                setCheckoutOpen={() => {
                    // Redirect to catalog if they want to checkout or see cart details
                    window.location.href = `/g/${token}/catalog`;
                }}
                account={account}
                token={token}
            />

            <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wallet size={120} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                                <h2 className="text-3xl font-black">{formatCurrency(summary.current_balance)}</h2>
                                <div className="mt-4 flex items-center gap-2">
                                    <Badge className={`${summary.current_balance > 0 ? 'bg-orange-500' : 'bg-emerald-500'} border-none`}>
                                        {summary.current_balance > 0 ? 'Payable' : 'Advance'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <Card className="p-6 bg-white dark:bg-zinc-900 shadow-xl border-none flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Unpaid Invoices</p>
                                    <h2 className="text-3xl font-black text-orange-600">{summary.unpaid_count}</h2>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600">
                                    <AlertCircle size={24} />
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                                Total outstanding: <span className="font-bold text-slate-900 dark:text-zinc-100">{formatCurrency(summary.total_unpaid)}</span>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Main Content Tabs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Tabs defaultValue="unpaid" className="w-full">
                        <TabsList className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 h-12 p-1 rounded-xl shadow-sm">
                            <TabsTrigger value="unpaid" className="flex-1 rounded-lg font-bold text-xs gap-2">
                                <Clock size={14} /> Unpaid
                            </TabsTrigger>
                            <TabsTrigger value="paid" className="flex-1 rounded-lg font-bold text-xs gap-2">
                                <CheckCircle2 size={14} /> Paid
                            </TabsTrigger>
                            <TabsTrigger value="payments" className="flex-1 rounded-lg font-bold text-xs gap-2">
                                <CreditCard size={14} /> History
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="unpaid" className="space-y-4">
                                {unpaidBills.length > 0 ? (
                                    unpaidBills.map((bill) => (
                                        <Link 
                                            key={bill.id} 
                                            href={`/g/${token}/invoice/${bill.invoice}`}
                                            className="block group"
                                        >
                                            <Card className="p-4 bg-white dark:bg-zinc-900 border-none shadow-md group-hover:shadow-lg transition-all active:scale-[0.98]">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg text-orange-600 group-hover:bg-orange-100 transition-colors">
                                                            <Receipt size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-sm">#{bill.invoice}</h3>
                                                            <p className="text-[10px] text-slate-500">{bill.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className="font-black text-sm text-orange-600">{formatCurrency(bill.remaining_amount)}</p>
                                                            <p className="text-[9px] text-slate-400 line-through text-right">{formatCurrency(bill.net_total)}</p>
                                                        </div>
                                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">
                                                        {bill.status}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-500 flex items-center gap-1 transition-colors">
                                                        View Order Detail
                                                    </span>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-zinc-100 italic text-sm">All bills paid!</h3>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="paid" className="space-y-4">
                                {paidBills.map((bill) => (
                                    <Link 
                                        key={bill.id} 
                                        href={`/g/${token}/invoice/${bill.invoice}`}
                                        className="block group"
                                    >
                                        <Card className="p-4 bg-white dark:bg-zinc-900 border-none shadow-md opacity-90 group-hover:opacity-100 transition-all active:scale-[0.98] ring-1 ring-emerald-500/20">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-sm">#{bill.invoice}</h3>
                                                        <p className="text-[10px] text-slate-500">{bill.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="font-black text-sm text-emerald-600">{formatCurrency(bill.net_total)}</p>
                                                        <Badge className="bg-emerald-500 border-none text-[8px] h-4">PAID</Badge>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </TabsContent>

                            <TabsContent value="payments" className="space-y-4">
                                {recentPayments.map((payment) => (
                                    <Link 
                                        key={payment.id} 
                                        href={`/g/${token}/receipt/${payment.voucher_no}`}
                                        className="block group"
                                    >
                                        <Card className="p-4 bg-white dark:bg-zinc-900 border-none shadow-md group-hover:shadow-lg transition-all active:scale-[0.98]">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                                        <ArrowDownLeft size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-sm">Receipt #{payment.voucher_no}</h3>
                                                        <p className="text-[10px] text-slate-500">{payment.date} • {payment.payment_method}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="font-black text-sm text-emerald-600">+{formatCurrency(payment.amount)}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </TabsContent>
                        </div>
                    </Tabs>
                </motion.div>
            </main>

            <CatalogFooter token={token} />
        </div>
    );
}
