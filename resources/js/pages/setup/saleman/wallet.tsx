"use client";

import React, { useState } from 'react';
import { usePage, Head, router } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet, ShieldCheck, LayoutDashboard, History, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useToastFromQuery from "@/hooks/useToastFromQuery";

// Components
import WalletStats from './components/WalletStats';
import WalletPerformance from './components/WalletPerformance';
import TopCustomers from './components/TopCustomers';
import RecentSales from './components/RecentSales';

interface Transaction {
    id: number;
    date: string;
    type: "credit" | "debit";
    amount: number;
    description: string;
    status: "paid" | "unpaid";
    sale_invoice: string;
}

interface Salesman {
    id: number;
    name: string;
    code: string;
    wallet_balance: number;
    commission_percentage: number;
}

interface WalletPageProps {
    salesman: Salesman;
    transactions: {
        data: Transaction[];
        links: any[];
    };
    summary: {
        total_earned: number;
        total_paid: number;
        current_balance: number;
        unpaid_commissions: number;
    };
    analytics: any[];
    top_customers: any[];
    recent_sales: any[];
}

export default function WalletPage({ salesman, transactions, summary, analytics, top_customers, recent_sales }: WalletPageProps) {
    useToastFromQuery();

    const [manualTxOpen, setManualTxOpen] = useState(false);
    const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
    const [selectedTxForPayment, setSelectedTxForPayment] = useState<number | null>(null);

    // Form states
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('credit'); // credit (bonus), debit (penalty/payment)
    const [status, setStatus] = useState('unpaid');

    const handleManualTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(`/salemen/${salesman.id}/wallet/transaction`, {
            type,
            amount: parseFloat(amount),
            description,
            status: type === 'debit' ? 'paid' : status, // Debits usually paid immediately/deducted
        }, {
            onSuccess: () => {
                setManualTxOpen(false);
                setDescription('');
                setAmount('');
                setType('credit');
            }
        });
    };

    const handleMarkPaid = () => {
        if (!selectedTxForPayment) return;
        router.put(`/salemen/wallet/transactions/${selectedTxForPayment}/pay`, {}, {
            onSuccess: () => {
                setPaymentConfirmOpen(false);
                setSelectedTxForPayment(null);
            }
        });
    };

    const currencyFormat = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={[
                    { title: "Setup", href: "/salemen" },
                    { title: "Salesmen", href: "/salemen" },
                    { title: "Wallet", href: "#" }
                ]} />
                <Head title={`Wallet: ${salesman.name}`} />

                <div className="mx-auto w-full max-w-[1600px] p-5 lg:p-6 space-y-8">

                    {/* PROFESSIONAL ACTION HEADER */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                                        {salesman.name}
                                    </h1>
                                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                        WALLET_ID: {salesman.code}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> VERIFIED_PARTNER
                                    </p>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 italic">
                                        COMMISSION: {salesman.commission_percentage}%
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-2">
                            <Dialog open={manualTxOpen} onOpenChange={setManualTxOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-11 px-6 text-xs font-black bg-[#FF8904] text-white hover:bg-[#e67a03] rounded-xl shadow-lg shadow-orange-500/10 border-none transition-all group tracking-widest uppercase">
                                        <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                        Manual Transaction
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Manual Transaction</DialogTitle>
                                        <DialogDescription>
                                            Add a bonus, penalty, or manual payment data adjustment.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleManualTransaction} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select value={type} onValueChange={setType}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="credit">Credit (Add to Wallet/Bonus)</SelectItem>
                                                    <SelectItem value="debit">Debit (Deduct/Payment/Penalty)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Input
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="e.g. Monthly Bonus or Cash Advance"
                                                required
                                            />
                                        </div>
                                        {type === 'credit' && (
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select value={status} onValueChange={setStatus}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unpaid">Unpaid (Pending)</SelectItem>
                                                        <SelectItem value="paid">Paid (Settled)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <DialogFooter>
                                            <Button type="submit" className="w-full">Submit Transaction</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* COCKPIT GRID (Stats) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
                        <div className="col-span-1 md:col-span-1 h-full">
                            <WalletStats
                                type="balance"
                                data={{ value: summary.current_balance, label: "Current Balance" }}
                            />
                        </div>
                        <div className="col-span-1 md:col-span-1 h-full">
                            <WalletStats
                                type="earned"
                                data={{ value: summary.total_earned, label: "Total Earned" }}
                                trend={analytics.map(a => ({ value: a.earned }))}
                            />
                        </div>
                        <div className="col-span-1 md:col-span-1 h-full">
                            <WalletStats
                                type="paid"
                                data={{ value: summary.total_paid, label: "Total Paid" }}
                                trend={analytics.map(a => ({ value: a.paid }))}
                            />
                        </div>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="space-y-6">
                        {/* ROW 1: Trend & Top Customers (Equal Height) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[380px]">
                            {/* Commission Trend (2/3) */}
                            <div className="lg:col-span-2 h-[380px] lg:h-full">
                                <WalletPerformance data={analytics} />
                            </div>
                            {/* Top Customers (1/3) */}
                            <div className="lg:col-span-1 h-[380px] lg:h-full">
                                <TopCustomers customers={top_customers} />
                            </div>
                        </div>

                        {/* ROW 2: History & Recent Sales */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            {/* Transaction History (2/3) */}
                            <div className="lg:col-span-2">
                                <Card className="border-none shadow-sm bg-card/50 overflow-hidden min-h-[500px]">
                                    <CardHeader className=" border-border/50">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
                                                <History className="h-5 w-5 text-orange-500" />
                                                Transaction History
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                                                    LIVE RECORDS
                                                </span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                                                    <tr>
                                                        <th className="px-4 py-3">Date</th>
                                                        <th className="px-4 py-3">Description</th>
                                                        <th className="px-4 py-3">Invoice</th>
                                                        <th className="px-4 py-3 text-center">Type</th>
                                                        <th className="px-4 py-3 text-right">Amount</th>
                                                        <th className="px-4 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {transactions.data.map((tx) => (
                                                        <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                                            <td className="px-4 py-3 font-mono text-xs">{tx.date}</td>
                                                            <td className="px-4 py-3 font-medium max-w-[300px] truncate">{tx.description}</td>
                                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.sale_invoice}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <Badge variant={tx.type === 'credit' ? 'outline' : 'destructive'} className={tx.type === 'credit' ? 'border-primary text-primary bg-primary/10' : ''}>
                                                                    {tx.type}
                                                                </Badge>
                                                            </td>
                                                            <td className={`px-4 py-3 text-right font-bold font-mono ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {currencyFormat.format(tx.amount)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {tx.type === 'credit' && tx.status === 'unpaid' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-xs bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300"
                                                                        onClick={() => {
                                                                            setSelectedTxForPayment(tx.id);
                                                                            setPaymentConfirmOpen(true);
                                                                        }}
                                                                    >
                                                                        Mark Paid
                                                                    </Button>
                                                                )}
                                                                {tx.status === 'paid' && (
                                                                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                                                                        PAID
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {transactions.data.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                                <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                                No transactions found for this wallet.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recent Sales (1/3) */}
                            <div className="lg:col-span-1 h-full min-h-[500px]">
                                <RecentSales sales={recent_sales} />
                            </div>
                        </div>
                    </div>

                    {/* COMPACT FOOTER SYSTEM */}
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-6 mt-8 opacity-30 select-none pointer-events-none mb-6">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em]">WALLET_ENGINE_V2.0 // OPS.ID: SALES-SYS</p>
                        <p className="text-[8px] font-bold font-mono tracking-widest mt-2 sm:mt-0 uppercase">SECURE_LEDGER // 2026-HB-SYS</p>
                    </div>
                </div>

                <Dialog open={paymentConfirmOpen} onOpenChange={setPaymentConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Payment</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to mark this commission as PAID? This will deduct the amount from the wallet balance.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPaymentConfirmOpen(false)}>Cancel</Button>
                            <Button onClick={handleMarkPaid}>Confirm Payment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
