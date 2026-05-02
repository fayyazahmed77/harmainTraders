import React, { useState } from 'react';
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
    AlertCircle
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
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
    investor: any;
    pending_requests: any[];
    available_balance: number;
}

export default function Show({ investor, pending_requests, available_balance }: Props) {
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isApproveOpen, setIsApproveOpen] = useState(false);

    const breadcrumbs = [
        { title: 'Investor Management', href: '/admin/investors' },
        { title: investor.full_name, href: `/admin/investors/${investor.id}` },
    ];

    const adjustmentForm = useForm({
        amount: '',
        type: 'capital_in',
        notes: '',
    });

    const rejectionForm = useForm({
        admin_note: '',
    });

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
                            onClick={() => setIsAdjustmentOpen(true)}
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

                                                    {txs.map((tx: any) => (
                                                        <div key={tx.id} className="relative pl-10 group">
                                                            <div className={`absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-background z-10 transition-all duration-300 group-hover:scale-125 ${
                                                                ['capital_in', 'profit_credit', 'reinvestment'].includes(tx.transaction_type) 
                                                                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                                                : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                                            }`} />
                                                            
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-2/20 border border-border/40 hover:border-primary/30 hover:bg-surface-2/40 transition-all duration-300 shadow-sm">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`p-2.5 rounded-xl ${
                                                                        ['capital_in', 'profit_credit', 'reinvestment'].includes(tx.transaction_type) 
                                                                        ? 'bg-emerald-500/5 text-emerald-500' 
                                                                        : 'bg-rose-500/5 text-rose-500'
                                                                    }`}>
                                                                        {tx.transaction_type === 'profit_credit' && <CheckCircle2 size={18} />}
                                                                        {tx.transaction_type === 'capital_in' && <Wallet size={18} />}
                                                                        {tx.transaction_type === 'profit_withdrawal' && <ExternalLink size={18} />}
                                                                        {['capital_out', 'withdrawal'].includes(tx.transaction_type) && <Minus size={18} />}
                                                                        {tx.transaction_type === 'reinvestment' && <HistoryIcon size={18} />}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-black text-foreground uppercase tracking-tight">{tx.description || 'System Transaction'}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1.5">
                                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                                                                ['capital_in', 'profit_credit', 'reinvestment'].includes(tx.transaction_type) 
                                                                                ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' 
                                                                                : 'bg-rose-500/5 text-rose-500 border-rose-500/10'
                                                                            }`}>
                                                                                {(tx.transaction_type || '').replace('_', ' ')}
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
                                                                            ['capital_in', 'profit_credit', 'reinvestment'].includes(tx.transaction_type) ? 'text-emerald-500' : 'text-rose-500'
                                                                        }`}>
                                                                            {['capital_in', 'profit_credit', 'reinvestment'].includes(tx.transaction_type) ? '+' : '-'}
                                                                            {tx.amount.toLocaleString()}
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
                                                    ))}
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

            {/* Adjustment Modal */}
            <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
                <DialogContent className="bg-surface-1 border-border/50 text-foreground rounded-2xl shadow-2xl max-w-md p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-surface-2/50 border-b border-border/50">
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">Manual Capital Entry</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                            Directly modify {investor.full_name}'s capital position.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdjustment} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`cursor-pointer rounded-xl border-2 p-4 transition-all text-center ${
                                adjustmentForm.data.type === 'capital_in' 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-border/50 bg-background/50 text-muted-foreground'
                            }`} onClick={() => adjustmentForm.setData('type', 'capital_in')}>
                                <Plus size={24} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Capital In</p>
                            </div>
                            <div className={`cursor-pointer rounded-xl border-2 p-4 transition-all text-center ${
                                adjustmentForm.data.type === 'capital_out' 
                                ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
                                : 'border-border/50 bg-background/50 text-muted-foreground'
                            }`} onClick={() => adjustmentForm.setData('type', 'capital_out')}>
                                <Minus size={24} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Capital Out</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (PKR)</Label>
                            <Input 
                                id="amount" 
                                type="number" 
                                placeholder="0.00"
                                className="h-12 bg-background/50 border-border/50 text-lg font-black tracking-tighter font-mono rounded-xl focus:ring-primary/50"
                                value={adjustmentForm.data.amount}
                                onChange={e => adjustmentForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transaction Memo</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Explain the reason for this adjustment..."
                                className="bg-background/50 border-border/50 text-xs font-medium rounded-xl min-h-[80px] focus:ring-primary/50"
                                value={adjustmentForm.data.notes}
                                onChange={e => adjustmentForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsAdjustmentOpen(false)} className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                            <Button 
                                type="submit" 
                                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                disabled={adjustmentForm.processing}
                            >
                                Process Entry
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

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
