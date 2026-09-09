import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Wallet, 
    History as HistoryIcon, 
    FileText, 
    CheckCircle2, 
    XCircle,
    Clock,
    Plus,
    Minus,
    ExternalLink,
    AlertCircle,
    Landmark,
    Banknote,
    FileCheck,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PaymentAccount {
    id: number;
    title: string;
    type: string | number;
    account_type?: {
        name: string;
    };
}

interface CustomerCheque {
    id: number;
    voucher_no: string;
    cheque_no: string;
    cheque_date: string;
    amount: number | string;
    account?: {
        title: string;
    };
    payment_account?: {
        title: string;
    };
}

interface Props {
    investor: any;
    pending_requests: any[];
    available_balance: number;
    paymentAccounts?: PaymentAccount[];
    availableCustomerCheques?: CustomerCheque[];
}

export default function Show({ 
    investor, 
    pending_requests, 
    available_balance,
    paymentAccounts = [],
    availableCustomerCheques = []
}: Props) {
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [bankCheques, setBankCheques] = useState<any[]>([]);
    const [loadingBankCheques, setLoadingBankCheques] = useState(false);

    const breadcrumbs = [
        { title: 'Investor Management', href: '/admin/investors' },
        { title: investor.full_name, href: `/admin/investors/${investor.id}` },
    ];

    const cashAccounts = useMemo(() => {
        return (paymentAccounts || []).filter(a => {
            const name = (a.account_type?.name || a.title || '').toLowerCase();
            return name.includes('cash');
        });
    }, [paymentAccounts]);

    const bankAccounts = useMemo(() => {
        return (paymentAccounts || []).filter(a => {
            const name = (a.account_type?.name || a.title || '').toLowerCase();
            return name.includes('bank');
        });
    }, [paymentAccounts]);

    const chequeInHandAccounts = useMemo(() => {
        return (paymentAccounts || []).filter(a => {
            const name = (a.account_type?.name || a.title || '').toLowerCase();
            return name.includes('cheque in hand');
        });
    }, [paymentAccounts]);

    const adjustmentForm = useForm({
        amount: '',
        type: 'capital_in',
        payment_category: 'cash', // 'cash' | 'bank' | 'cheque'
        payment_account_id: '',
        payment_method: 'Cash', // 'Cash' | 'Online' | 'Cheque'
        cheque_no: '',
        cheque_date: '',
        clear_date: '',
        cheque_id: '',
        original_cheque_id: '',
        notes: '',
    });

    const rejectionForm = useForm({
        admin_note: '',
    });

    // Set initial payment account when modal opens or category changes
    const selectPaymentCategory = (category: 'cash' | 'bank' | 'cheque') => {
        let accountId = '';
        let method = 'Cash';

        if (category === 'cash') {
            accountId = cashAccounts[0]?.id?.toString() || '';
            method = 'Cash';
        } else if (category === 'bank') {
            accountId = bankAccounts[0]?.id?.toString() || '';
            method = 'Online';
        } else if (category === 'cheque') {
            accountId = chequeInHandAccounts[0]?.id?.toString() || '';
            method = 'Cheque';
        }

        adjustmentForm.setData(data => ({
            ...data,
            payment_category: category,
            payment_account_id: accountId,
            payment_method: method,
            cheque_no: '',
            cheque_date: '',
            clear_date: '',
            cheque_id: '',
            original_cheque_id: '',
        }));
    };

    // Open modal with clean defaults
    const openAdjustmentModal = () => {
        const defaultAcc = cashAccounts[0] || paymentAccounts[0];
        const defaultCat = (defaultAcc?.account_type?.name?.toLowerCase().includes('bank'))
            ? 'bank' 
            : (defaultAcc?.account_type?.name?.toLowerCase().includes('cheque in hand'))
                ? 'cheque'
                : 'cash';

        adjustmentForm.setData({
            amount: '',
            type: 'capital_in',
            payment_category: defaultCat,
            payment_account_id: defaultAcc?.id?.toString() || '',
            payment_method: defaultCat === 'bank' ? 'Online' : (defaultCat === 'cheque' ? 'Cheque' : 'Cash'),
            cheque_no: '',
            cheque_date: '',
            clear_date: '',
            cheque_id: '',
            original_cheque_id: '',
            notes: '',
        });
        setIsAdjustmentOpen(true);
    };

    // Fetch unused bank cheques if Bank + Cheque + capital_out
    useEffect(() => {
        if (
            adjustmentForm.data.payment_category === 'bank' &&
            adjustmentForm.data.payment_method === 'Cheque' &&
            adjustmentForm.data.payment_account_id
        ) {
            setLoadingBankCheques(true);
            fetch(`/payment/available-cheques?account_id=${adjustmentForm.data.payment_account_id}`)
                .then(res => res.json())
                .then(data => {
                    setBankCheques(Array.isArray(data) ? data : []);
                })
                .catch(() => setBankCheques([]))
                .finally(() => setLoadingBankCheques(false));
        } else {
            setBankCheques([]);
        }
    }, [
        adjustmentForm.data.payment_category, 
        adjustmentForm.data.payment_method, 
        adjustmentForm.data.payment_account_id
    ]);

    const handleAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        adjustmentForm.post(`/admin/investors/${investor.id}/adjust-capital`, {
            onSuccess: () => {
                setIsAdjustmentOpen(false);
                adjustmentForm.reset();
            },
        });
    };

    const approveRequest = () => {
        if (!selectedRequest) return;
        router.post(`/admin/requests/${selectedRequest.id}/approve`, {}, {
            onSuccess: () => {
                setIsApproveOpen(false);
                setSelectedRequest(null);
            },
        });
    };

    const rejectRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;
        rejectionForm.post(`/admin/requests/${selectedRequest.id}/reject`, {
            onSuccess: () => {
                setIsRejectOpen(false);
                rejectionForm.reset();
                setSelectedRequest(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${investor.full_name} - Investor Detail`} />

            <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6 space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4"
                    >
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => window.history.back()} 
                            className="h-10 w-10 rounded-xl border-border/50 bg-surface-1/50 backdrop-blur-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                                {investor.full_name}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-surface-2 px-2 py-0.5 rounded">
                                    INV-{investor.id.toString().padStart(4, '0')}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {investor.phone}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                    
                    <div className="flex items-center gap-2">
                        <a href={`/admin/investors/${investor.id}/export-pdf`} target="_blank">
                            <Button variant="outline" className="h-10 rounded-xl border-border/50 bg-surface-1/50 backdrop-blur-sm">
                                <FileText size={16} className="mr-2 text-rose-500" /> 
                                <span className="text-[10px] font-black uppercase tracking-wider">Investor Ledger</span>
                            </Button>
                        </a>
                        <Button 
                            onClick={openAdjustmentModal}
                            className="h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                        >
                            <Plus size={16} className="mr-2" /> 
                            <span className="text-[10px] font-black uppercase tracking-wider">Manual Entry</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {[
                        { label: 'Current Capital', value: `RS ${(investor.capital_account?.current_capital || 0).toLocaleString()}`, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                        { label: 'Ownership Share', value: `${Number(investor.capital_account?.ownership_percentage || 0).toFixed(2)}%`, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                        { label: 'Available Profit', value: `RS ${(available_balance || 0).toLocaleString()}`, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                        { label: 'Total Activity', value: (investor.transactions || []).length, color: 'text-primary', bg: 'bg-primary/5' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`rounded-2xl border border-border/50 ${stat.bg} p-6 backdrop-blur-md shadow-sm`}
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            <h2 className={`mt-2 text-2xl font-black ${stat.color} tracking-tight tabular-nums`}>{stat.value}</h2>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                    {/* Left: Transaction Ledger / Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-border/50 bg-surface-1/50 backdrop-blur-xl shadow-sm overflow-hidden"
                        >
                            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-surface-2/30">
                                <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <HistoryIcon size={14} className="text-primary" /> Investment Ledger
                                </h3>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-2 py-1 rounded-md border border-border/50">
                                    Total Items: {investor.transactions.length}
                                </span>
                            </div>
                            
                            <div className="p-6">
                                <div className="space-y-10 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-border/20 before:to-transparent">
                                    {investor.transactions.length > 0 ? (
                                        (() => {
                                            const grouped = investor.transactions.reduce((acc: any, tx: any) => {
                                                const date = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                                if (!acc[date]) acc[date] = [];
                                                acc[date].push(tx);
                                                return acc;
                                            }, {});

                                            return Object.entries(grouped).map(([month, txs]: [string, any], groupIdx) => (
                                                <div key={month} className="space-y-6">
                                                    <div className="relative pl-10">
                                                        <div className="absolute left-[13px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-border border-4 border-background z-10" />
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{month}</h4>
                                                    </div>

                                                    {txs.map((tx: any) => {
                                                        const txType = tx.type || tx.transaction_type;
                                                        const isCredit = ['capital_in', 'profit_credit', 'reinvestment'].includes(txType);
                                                        const txDesc = tx.narration || tx.description || 'System Transaction';

                                                        return (
                                                            <div key={tx.id} className="relative pl-10 group">
                                                                <div className={`absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-background z-10 transition-all duration-300 group-hover:scale-125 ${
                                                                    isCredit 
                                                                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                                                    : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                                                }`} />
                                                                
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-2/20 border border-border/40 hover:border-primary/30 hover:bg-surface-2/40 transition-all duration-300 shadow-sm">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`p-2.5 rounded-xl ${
                                                                            isCredit 
                                                                            ? 'bg-emerald-500/5 text-emerald-500' 
                                                                            : 'bg-rose-500/5 text-rose-500'
                                                                        }`}>
                                                                            {txType === 'profit_credit' && <CheckCircle2 size={18} />}
                                                                            {txType === 'capital_in' && <Wallet size={18} />}
                                                                            {txType === 'profit_withdrawal' && <ExternalLink size={18} />}
                                                                            {['capital_out', 'withdrawal'].includes(txType) && <Minus size={18} />}
                                                                            {txType === 'reinvestment' && <HistoryIcon size={18} />}
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-black text-foreground uppercase tracking-tight">{txDesc}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                                                                    isCredit 
                                                                                    ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' 
                                                                                    : 'bg-rose-500/5 text-rose-500 border-rose-500/10'
                                                                                }`}>
                                                                                    {(txType || '').replace('_', ' ')}
                                                                                </span>
                                                                                <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
                                                                                    {new Date(tx.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-8 text-right">
                                                                        <div>
                                                                            <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest mb-0.5">Amount</p>
                                                                            <p className={`text-sm font-black font-mono tabular-nums ${
                                                                                isCredit ? 'text-emerald-500' : 'text-rose-500'
                                                                            }`}>
                                                                                {isCredit ? '+' : '-'}
                                                                                {Number(tx.amount || 0).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    <div className="min-w-[120px]">
                                                                        <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest mb-0.5">Rolling Balance</p>
                                                                        <p className="text-sm font-black text-foreground font-mono tabular-nums tracking-tighter">
                                                                            RS {tx.balance_after.toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                </div>
                                            ));
                                        })()
                                    ) : (
                                        <div className="py-20 text-center bg-surface-2/10 rounded-3xl border border-dashed border-border/50">
                                            <div className="mx-auto w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-4 text-muted-foreground/30">
                                                <HistoryIcon size={24} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No transaction activity found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Actions & Status */}
                    <div className="space-y-6">
                        {/* Pending Requests */}
                        <div className="rounded-2xl border border-border/50 bg-surface-1/50 backdrop-blur-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-blue-500/5">
                                <Clock size={14} className="text-blue-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Pending Approval</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {pending_requests.length > 0 ? (
                                    pending_requests.map((req) => (
                                        <motion.div 
                                            key={req.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-4 rounded-xl bg-background/50 border border-border/50 group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{(req.request_type || '').replace('_', ' ')}</p>
                                                    <p className="text-lg font-black text-foreground tabular-nums tracking-tighter">RS {req.amount.toLocaleString()}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase italic">{new Date(req.requested_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setIsApproveOpen(true);
                                                    }}
                                                    size="sm" 
                                                    className="flex-1 h-9 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                                >
                                                    Approve
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setIsRejectOpen(true);
                                                    }}
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="flex-1 h-9 text-rose-500 hover:bg-rose-500/10 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                        <CheckCircle2 size={24} className="text-emerald-500/40 mb-2" />
                                        <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">All tasks clear</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ownership Snapshot */}
                        <div className="rounded-2xl border border-border/50 bg-surface-1/50 backdrop-blur-xl shadow-sm p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
                                <AlertCircle size={14} /> Capital Status
                            </h3>
                            <div className="space-y-5">
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Equity Stake</p>
                                    <p className="text-2xl font-black text-foreground tracking-tighter">{Number(investor.capital_account?.ownership_percentage || 0).toFixed(2)}%</p>
                                </div>
                                <div className="h-2.5 w-full bg-surface-3 rounded-full overflow-hidden border border-border/20 shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${investor.capital_account.ownership_percentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-primary to-amber-400" 
                                    />
                                </div>
                                <div className="p-3 bg-surface-2/50 rounded-xl border border-border/50">
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase leading-relaxed italic">
                                        * EQUITY IS RECALCULATED AUTOMATICALLY UPON EVERY CAPITAL ADJECTION OR WITHDRAWAL APPROVAL TO ENSURE SYSTEM-WIDE INTEGRITY.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Capital Entry Drawer (Slide-over on Right Side) */}
            <Sheet open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
                <SheetContent 
                    side="right" 
                    className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-surface-1 border-l border-border/50 text-foreground shadow-2xl overflow-hidden gap-0"
                >
                    <SheetHeader className="p-5 bg-surface-2/70 border-b border-border/50 shrink-0">
                        <div className="flex items-center justify-between pr-8">
                            <div>
                                <SheetTitle className="text-sm font-black uppercase tracking-widest text-foreground">
                                    Manual Capital Entry
                                </SheetTitle>
                                <SheetDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                    Directly modify {investor.full_name}'s capital position & update accounts.
                                </SheetDescription>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${
                                adjustmentForm.data.type === 'capital_in'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            }`}>
                                {adjustmentForm.data.type === 'capital_in' ? 'Voucher: CRV (Receipt)' : 'Voucher: CPV (Payment)'}
                            </span>
                        </div>
                    </SheetHeader>

                    <form id="capital-adjustment-form" onSubmit={handleAdjustment} className="flex-1 overflow-y-auto p-5 space-y-5">
                        {/* 1. Transaction Type Toggle */}
                        <div className="grid grid-cols-2 gap-3">
                            <div 
                                className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all text-center select-none ${
                                    adjustmentForm.data.type === 'capital_in' 
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-sm' 
                                    : 'border-border/50 bg-background/50 text-muted-foreground hover:bg-surface-2/50'
                                }`} 
                                onClick={() => adjustmentForm.setData('type', 'capital_in')}
                            >
                                <Plus size={20} className="mx-auto mb-1 text-emerald-500" />
                                <p className="text-[11px] font-black uppercase tracking-wider">Capital In</p>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">Equity Injection (+)</p>
                            </div>

                            <div 
                                className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all text-center select-none ${
                                    adjustmentForm.data.type === 'capital_out' 
                                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 shadow-sm' 
                                    : 'border-border/50 bg-background/50 text-muted-foreground hover:bg-surface-2/50'
                                }`} 
                                onClick={() => adjustmentForm.setData('type', 'capital_out')}
                            >
                                <Minus size={20} className="mx-auto mb-1 text-rose-500" />
                                <p className="text-[11px] font-black uppercase tracking-wider">Capital Out</p>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">Withdrawal / Drawing (-)</p>
                            </div>
                        </div>

                        {/* 2. Amount Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                <span>Amount (PKR) <span className="text-rose-500">*</span></span>
                                {adjustmentForm.data.amount && !isNaN(Number(adjustmentForm.data.amount)) && (
                                    <span className="font-mono text-[9px] text-primary font-bold">
                                        RS {Number(adjustmentForm.data.amount).toLocaleString()}
                                    </span>
                                )}
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground font-mono">
                                    PKR
                                </span>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    step="any"
                                    placeholder="0.00"
                                    className="h-11 pl-14 bg-background/50 border-border/50 text-base font-black tracking-tight font-mono rounded-xl focus:ring-primary/50"
                                    value={adjustmentForm.data.amount}
                                    onChange={e => adjustmentForm.setData('amount', e.target.value)}
                                    required
                                />
                            </div>
                            {adjustmentForm.errors.amount && (
                                <p className="text-[10px] font-bold text-rose-500">{adjustmentForm.errors.amount}</p>
                            )}
                        </div>

                        {/* 3. Account Category Selection (Bank, Cash, Cheque in Hand) */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Payment Account / Treasury Channel <span className="text-rose-500">*</span>
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => selectPaymentCategory('bank')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                                        adjustmentForm.data.payment_category === 'bank'
                                        ? 'border-primary bg-primary/10 text-primary font-black shadow-sm'
                                        : 'border-border/50 bg-background/50 text-muted-foreground hover:bg-surface-2/40'
                                    }`}
                                >
                                    <Landmark size={18} className="mb-1" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Bank</span>
                                    <span className="text-[8px] text-muted-foreground uppercase mt-0.5">Transfer/Cheque</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => selectPaymentCategory('cash')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                                        adjustmentForm.data.payment_category === 'cash'
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-black shadow-sm'
                                        : 'border-border/50 bg-background/50 text-muted-foreground hover:bg-surface-2/40'
                                    }`}
                                >
                                    <Banknote size={18} className="mb-1 text-emerald-600" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Cash in Hand</span>
                                    <span className="text-[8px] text-muted-foreground uppercase mt-0.5">Direct Cash</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => selectPaymentCategory('cheque')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                                        adjustmentForm.data.payment_category === 'cheque'
                                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-black shadow-sm'
                                        : 'border-border/50 bg-background/50 text-muted-foreground hover:bg-surface-2/40'
                                    }`}
                                >
                                    <FileCheck size={18} className="mb-1 text-amber-600" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Cheque in Hand</span>
                                    <span className="text-[8px] text-muted-foreground uppercase mt-0.5">Physical Cheque</span>
                                </button>
                            </div>
                        </div>

                        {/* 4. Specific Account Selector & Details */}
                        <div className="p-4 rounded-xl bg-surface-2/30 border border-border/40 space-y-4">
                            {/* Bank Specific Controls */}
                            {adjustmentForm.data.payment_category === 'bank' && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Select Bank Account <span className="text-rose-500">*</span>
                                        </Label>
                                        <Combobox 
                                            options={bankAccounts.map(b => ({
                                                value: b.id.toString(),
                                                label: b.title
                                            }))}
                                            value={adjustmentForm.data.payment_account_id}
                                            onChange={val => adjustmentForm.setData('payment_account_id', val)}
                                            placeholder="Choose Bank Account..."
                                            searchPlaceholder="Search bank accounts..."
                                            className="h-10 text-xs font-bold bg-background border-border/50 rounded-xl"
                                        />
                                    </div>

                                    {/* Bank Mode (Online vs Cheque) */}
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Transaction Mode
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={adjustmentForm.data.payment_method === 'Online' ? 'default' : 'outline'}
                                                className="h-8 rounded-lg text-[9px] font-black uppercase tracking-wider"
                                                onClick={() => adjustmentForm.setData(d => ({ ...d, payment_method: 'Online', cheque_id: '', cheque_no: '' }))}
                                            >
                                                Online / IBFT
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={adjustmentForm.data.payment_method === 'Cheque' ? 'default' : 'outline'}
                                                className="h-8 rounded-lg text-[9px] font-black uppercase tracking-wider"
                                                onClick={() => adjustmentForm.setData(d => ({ ...d, payment_method: 'Cheque' }))}
                                            >
                                                Bank Cheque
                                            </Button>
                                        </div>
                                    </div>

                                    {/* If Bank Cheque Selected */}
                                    {adjustmentForm.data.payment_method === 'Cheque' && (
                                        <div className="pt-2 border-t border-border/30 space-y-3">
                                            {adjustmentForm.data.type === 'capital_out' && bankCheques.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex justify-between">
                                                        <span>Pick Cheque Leaf from Chequebook</span>
                                                        {loadingBankCheques && <Loader2 size={10} className="animate-spin" />}
                                                    </Label>
                                                    <Combobox 
                                                        options={bankCheques.map(c => ({
                                                            value: c.id.toString(),
                                                            label: c.label || c.value || c.cheque_no || ''
                                                        }))}
                                                        value={adjustmentForm.data.cheque_id}
                                                        onChange={val => {
                                                            const chq = bankCheques.find(c => c.id.toString() === val);
                                                            adjustmentForm.setData(d => ({
                                                                ...d,
                                                                cheque_id: val,
                                                                cheque_no: chq?.cheque_no || chq?.value || ''
                                                            }));
                                                        }}
                                                        placeholder="Select unused cheque leaf..."
                                                        searchPlaceholder="Search cheque number..."
                                                        emptyMessage={loadingBankCheques ? "Loading cheques..." : "No unused cheques found."}
                                                        className="h-9 text-xs font-mono font-bold bg-background border-border/50 rounded-xl"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Cheque Number {adjustmentForm.data.type === 'capital_in' && '(Investor\'s Cheque)'}
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g. 00482910"
                                                        className="h-9 text-xs font-mono bg-background border-border/50 rounded-lg"
                                                        value={adjustmentForm.data.cheque_no}
                                                        onChange={e => adjustmentForm.setData('cheque_no', e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Cheque Date
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        className="h-8 text-[11px] bg-background border-border/50 rounded-lg"
                                                        value={adjustmentForm.data.cheque_date}
                                                        onChange={e => adjustmentForm.setData('cheque_date', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Clear Date
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        className="h-8 text-[11px] bg-background border-border/50 rounded-lg"
                                                        value={adjustmentForm.data.clear_date}
                                                        onChange={e => adjustmentForm.setData('clear_date', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cash Specific Controls */}
                            {adjustmentForm.data.payment_category === 'cash' && (
                                <div className="space-y-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Select Cash Account <span className="text-rose-500">*</span>
                                        </Label>
                                        <Combobox 
                                            options={cashAccounts.map(c => ({
                                                value: c.id.toString(),
                                                label: c.title
                                            }))}
                                            value={adjustmentForm.data.payment_account_id}
                                            onChange={val => adjustmentForm.setData('payment_account_id', val)}
                                            placeholder="Choose Cash Account..."
                                            searchPlaceholder="Search cash accounts..."
                                            className="h-10 text-xs font-bold bg-background border-border/50 rounded-xl"
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground font-semibold italic flex items-center gap-1.5">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        Will immediately credit/debit the physical Cash in Hand ledger.
                                    </p>
                                </div>
                            )}

                            {/* Cheque In Hand Controls */}
                            {adjustmentForm.data.payment_category === 'cheque' && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Cheque In Hand Account <span className="text-rose-500">*</span>
                                        </Label>
                                        <Combobox 
                                            options={chequeInHandAccounts.map(c => ({
                                                value: c.id.toString(),
                                                label: c.title
                                            }))}
                                            value={adjustmentForm.data.payment_account_id}
                                            onChange={val => adjustmentForm.setData('payment_account_id', val)}
                                            placeholder="Choose Cheque Account..."
                                            searchPlaceholder="Search cheque in hand accounts..."
                                            className="h-10 text-xs font-bold bg-background border-border/50 rounded-xl"
                                        />
                                    </div>

                                    {/* If Capital In: Receiving physical cheque into In Hand */}
                                    {adjustmentForm.data.type === 'capital_in' && (
                                        <div className="space-y-2 pt-1">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Cheque No <span className="text-rose-500">*</span>
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g. CHQ-9210"
                                                        className="h-9 text-xs font-mono bg-background border-border/50 rounded-lg"
                                                        value={adjustmentForm.data.cheque_no}
                                                        onChange={e => adjustmentForm.setData('cheque_no', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Cheque Date
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        className="h-9 text-[11px] bg-background border-border/50 rounded-lg"
                                                        value={adjustmentForm.data.cheque_date}
                                                        onChange={e => adjustmentForm.setData('cheque_date', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground font-semibold italic flex items-center gap-1.5">
                                                <CheckCircle2 size={12} className="text-amber-500" />
                                                Cheque will be recorded as active 'In Hand' in your cheque portfolio.
                                            </p>
                                        </div>
                                    )}

                                    {/* If Capital Out: Distributing an in-hand cheque to investor */}
                                    {adjustmentForm.data.type === 'capital_out' && (
                                        <div className="space-y-2 pt-1">
                                            {availableCustomerCheques && availableCustomerCheques.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Select In-Hand Cheque to Transfer <span className="text-rose-500">*</span>
                                                    </Label>
                                                    <Combobox
                                                        options={availableCustomerCheques.map(chk => ({
                                                            value: chk.id.toString(),
                                                            label: `#${chk.cheque_no} — RS ${Number(chk.amount).toLocaleString()} (${chk.account?.title || 'Party'})`
                                                        }))}
                                                        value={adjustmentForm.data.original_cheque_id}
                                                        onChange={val => {
                                                            const chk = availableCustomerCheques.find(c => c.id.toString() === val);
                                                            if (chk) {
                                                                adjustmentForm.setData(d => ({
                                                                    ...d,
                                                                    original_cheque_id: val,
                                                                    amount: chk.amount.toString(),
                                                                    cheque_no: chk.cheque_no || '',
                                                                    cheque_date: chk.cheque_date || '',
                                                                }));
                                                            }
                                                        }}
                                                        placeholder="Select available in-hand cheque..."
                                                        searchPlaceholder="Search by cheque #, amount, party..."
                                                        emptyMessage="No available in-hand cheques."
                                                        className="h-9 text-xs font-mono font-bold bg-background border-border/50 rounded-xl"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Cheque No
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="Cheque No..."
                                                        className="h-9 text-xs font-mono bg-background border-border/50 rounded-lg"
                                                        value={adjustmentForm.data.cheque_no}
                                                        onChange={e => adjustmentForm.setData('cheque_no', e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            <p className="text-[9px] text-muted-foreground font-semibold italic flex items-center gap-1.5">
                                                <AlertCircle size={12} className="text-amber-500" />
                                                Selected cheque will be endorsed to investor and marked 'Distributed'.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 5. Transaction Memo */}
                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Transaction Memo / Notes
                            </Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Explain reason for capital adjustment..."
                                className="bg-background/50 border-border/50 text-xs font-medium rounded-xl min-h-[60px] focus:ring-primary/50"
                                value={adjustmentForm.data.notes}
                                onChange={e => adjustmentForm.setData('notes', e.target.value)}
                            />
                        </div>

                        {/* 6. Live Impact Preview Card */}
                        {adjustmentForm.data.amount && Number(adjustmentForm.data.amount) > 0 && (
                            <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/50 space-y-2 text-[10px]">
                                <p className="font-black uppercase tracking-wider text-muted-foreground">
                                    Impact Summary
                                </p>
                                <div className="grid grid-cols-2 gap-2 font-mono">
                                    <div>
                                        <span className="text-muted-foreground">Voucher Type: </span>
                                        <span className="font-black text-foreground">
                                            {adjustmentForm.data.type === 'capital_in' ? 'CRV (Receipt Voucher)' : 'CPV (Payment Voucher)'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">New Capital: </span>
                                        <span className="font-black text-foreground">
                                            RS {(
                                                adjustmentForm.data.type === 'capital_in'
                                                ? (Number(investor.capital_account?.current_capital || 0) + Number(adjustmentForm.data.amount))
                                                : Math.max(0, Number(investor.capital_account?.current_capital || 0) - Number(adjustmentForm.data.amount))
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* 7. Pinned Drawer Footer */}
                    <SheetFooter className="p-4 bg-surface-2/60 border-t border-border/50 shrink-0 mt-auto">
                        <div className="flex w-full gap-3">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setIsAdjustmentOpen(false)} 
                                className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                form="capital-adjustment-form"
                                className={`flex-1 h-11 rounded-xl font-black uppercase tracking-widest shadow-lg ${
                                    adjustmentForm.data.type === 'capital_in'
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                                    : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'
                                }`}
                                disabled={adjustmentForm.processing || !adjustmentForm.data.amount || !adjustmentForm.data.payment_account_id}
                            >
                                {adjustmentForm.processing ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" /> Processing...
                                    </span>
                                ) : (
                                    adjustmentForm.data.type === 'capital_in' ? 'Process Capital In' : 'Process Capital Out'
                                )}
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Rejection Modal */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent className="bg-surface-1 border-border/50 text-foreground rounded-2xl shadow-2xl p-0 overflow-hidden max-w-sm">
                    <DialogHeader className="p-6 bg-rose-500/5 border-b border-rose-500/10">
                        <DialogTitle className="text-sm font-black uppercase tracking-widest text-rose-500">Decline Request</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={rejectRequest} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejection_note" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rejection Reason</Label>
                            <Textarea 
                                id="rejection_note" 
                                placeholder="Why is this request being declined?"
                                className="bg-background/50 border-border/50 text-xs font-medium rounded-xl min-h-[100px]"
                                value={rejectionForm.data.admin_note}
                                onChange={e => rejectionForm.setData('admin_note', e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsRejectOpen(false)} className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                            <Button 
                                type="submit" 
                                className="flex-1 h-10 rounded-xl bg-rose-500 text-white font-black uppercase tracking-widest hover:bg-rose-600"
                                disabled={rejectionForm.processing}
                            >
                                Decline
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Approval Confirmation Modal */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent className="bg-surface-1 border-border/50 text-foreground rounded-2xl shadow-2xl p-0 overflow-hidden max-w-sm">
                    <DialogHeader className="p-6 bg-emerald-500/5 border-b border-emerald-500/10 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                            <CheckCircle2 size={24} className="text-emerald-500" />
                        </div>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest text-emerald-600">Confirm Approval</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">
                            Are you sure you want to approve this {selectedRequest?.request_type?.replace('_', ' ') || 'request'}? 
                            This action will be recorded and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Amount</span>
                                <span className="text-lg font-black text-foreground tabular-nums tracking-tighter">RS {Number(selectedRequest?.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsApproveOpen(false)} className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                            <Button 
                                onClick={approveRequest}
                                className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                            >
                                Yes, Approve
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
