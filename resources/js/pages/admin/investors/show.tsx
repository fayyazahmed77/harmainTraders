import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
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

    const approveRequest = (id: number) => {
        if (confirm('Are you sure you want to approve this request?')) {
            useForm({}).post(`/admin/requests/${id}/approve`);
        }
    };

    const rejectRequest = (e: React.FormEvent) => {
        e.preventDefault();
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

            <div className="flex flex-col gap-6 p-6">
                {/* Profile Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex gap-4">
                        <div className="h-16 w-16 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] border border-[#C9A84C]/20">
                            <Wallet size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#F1F1F1]">{investor.full_name}</h1>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-[#6B7280]">{investor.phone}</span>
                                <span className="h-1 w-1 rounded-full bg-[#374151]" />
                                <span className="text-sm text-[#6B7280]">CNIC: {investor.cnic}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <a href={`/admin/investors/${investor.id}/export-pdf`} target="_blank">
                            <Button variant="outline" className="border-white/5 bg-[#181C23] text-[#F1F1F1] hover:bg-[#22272e]">
                                <FileText className="mr-2 h-4 w-4" /> Export PDF
                            </Button>
                        </a>
                        <Button 
                            onClick={() => setIsAdjustmentOpen(true)}
                            variant="outline" 
                            className="border-white/5 bg-[#181C23] text-[#F1F1F1] hover:bg-[#22272e]"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Manual Adjustment
                        </Button>
                    </div>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {[
                        { label: 'Current Capital', value: `PKR ${investor.capital_account.current_capital.toLocaleString()}`, color: 'text-[#C9A84C]' },
                        { label: 'Ownership Share', value: `${investor.capital_account.ownership_percentage.toFixed(2)}%`, color: 'text-[#3B82F6]' },
                        { label: 'Available Profit', value: `PKR ${available_balance.toLocaleString()}`, color: 'text-[#22C55E]' },
                        { label: 'Total Requests', value: investor.transactions.length, color: 'text-[#F1F1F1]' },
                    ].map((stat, i) => (
                        <div key={i} className="rounded-lg border border-white/5 bg-[#111318] p-4">
                            <p className="text-[10px] uppercase tracking-wider text-[#6B7280]">{stat.label}</p>
                            <h2 className={`mt-1 text-lg font-bold ${stat.color}`}>{stat.value}</h2>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left: Ledger / History */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-lg border border-white/5 bg-[#111318] overflow-hidden">
                            <div className="border-b border-white/5 p-4 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-[#F1F1F1] flex items-center gap-2">
                                    <HistoryIcon size={16} className="text-[#C9A84C]" /> Transaction Ledger
                                </h3>
                            </div>
                            <Table>
                                <TableHeader className="bg-[#181C23]/30">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-[#6B7280] text-xs">Date</TableHead>
                                        <TableHead className="text-[#6B7280] text-xs">Description</TableHead>
                                        <TableHead className="text-[#6B7280] text-xs text-right">Amount</TableHead>
                                        <TableHead className="text-[#6B7280] text-xs text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {investor.transactions.map((tx: any) => (
                                        <TableRow key={tx.id} className="border-white/5 hover:bg-[#181C23]/20">
                                            <TableCell className="text-[12px] text-[#F1F1F1]">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] text-[#F1F1F1] font-medium">{tx.description}</span>
                                                    <span className="text-[10px] text-[#374151]">{tx.transaction_type.toUpperCase()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={`text-right text-[13px] font-mono ${
                                                ['capital_in', 'profit_credit'].includes(tx.transaction_type) ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {['capital_in', 'profit_credit'].includes(tx.transaction_type) ? '+' : '-'}
                                                {tx.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-[13px] text-[#F1F1F1] font-mono">
                                                {tx.balance_after.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Right: Pending Requests */}
                    <div className="space-y-6">
                        <div className="rounded-lg border border-white/5 bg-[#111318] p-5">
                            <h3 className="text-sm font-bold text-[#F1F1F1] flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-[#3B82F6]" /> Pending Approval
                            </h3>
                            <div className="space-y-3">
                                {pending_requests.length > 0 ? (
                                    pending_requests.map((req) => (
                                        <motion.div 
                                            key={req.id}
                                            layoutId={`req-${req.id}`}
                                            className="rounded-lg bg-[#181C23] border border-white/5 p-4"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] uppercase text-[#6B7280] tracking-tight">{req.request_type.replace('_', ' ')}</p>
                                                    <p className="text-lg font-bold text-[#F1F1F1]">PKR {req.amount.toLocaleString()}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[10px] text-[#374151]">{new Date(req.requested_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <Button 
                                                    onClick={() => approveRequest(req.id)}
                                                    size="sm" 
                                                    className="flex-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                                                >
                                                    <CheckCircle2 size={14} className="mr-2" /> Approve
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setIsRejectOpen(true);
                                                    }}
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="flex-1 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                                >
                                                    <XCircle size={14} className="mr-2" /> Reject
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="rounded-full bg-[#181C23] p-3 mb-3">
                                            <CheckCircle2 size={24} className="text-[#374151]" />
                                        </div>
                                        <p className="text-xs text-[#374151]">All requests processed</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ownership Snapshot */}
                        <div className="rounded-lg border border-white/5 bg-[#111318] p-5">
                            <h3 className="text-sm font-bold text-[#F1F1F1] flex items-center gap-2 mb-4">
                                <AlertCircle size={16} className="text-[#C9A84C]" /> Capital Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <p className="text-xs text-[#6B7280]">Ownership Percentage</p>
                                    <p className="text-lg font-bold text-[#F1F1F1]">{investor.capital_account.ownership_percentage.toFixed(2)}%</p>
                                </div>
                                <div className="h-2 w-full bg-[#181C23] rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${investor.capital_account.ownership_percentage}%` }}
                                        className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E5C368]" 
                                    />
                                </div>
                                <p className="text-[10px] text-[#374151] italic leading-tight">
                                    * Ownership is recalculated automatically upon every capital addition or withdrawal approval.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Adjustment Modal */}
            <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
                <DialogContent className="bg-[#111318] border-white/10 text-[#F1F1F1]">
                    <DialogHeader>
                        <DialogTitle>Manual Capital Adjustment</DialogTitle>
                        <DialogDescription className="text-[#6B7280]">
                            Directly inject or withdraw capital from {investor.full_name}'s account.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdjustment} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`cursor-pointer rounded-lg border p-4 transition-all ${
                                adjustmentForm.data.type === 'capital_in' 
                                ? 'border-[#C9A84C] bg-[#C9A84C]/5 text-[#C9A84C]' 
                                : 'border-white/5 bg-[#181C23] text-[#6B7280]'
                            }`} onClick={() => adjustmentForm.setData('type', 'capital_in')}>
                                <Plus size={20} className="mb-2" />
                                <p className="text-sm font-bold">Capital In</p>
                                <p className="text-[10px] opacity-70">Deposit new funds</p>
                            </div>
                            <div className={`cursor-pointer rounded-lg border p-4 transition-all ${
                                adjustmentForm.data.type === 'capital_out' 
                                ? 'border-red-500 bg-red-500/5 text-red-500' 
                                : 'border-white/5 bg-[#181C23] text-[#6B7280]'
                            }`} onClick={() => adjustmentForm.setData('type', 'capital_out')}>
                                <Minus size={20} className="mb-2" />
                                <p className="text-sm font-bold">Capital Out</p>
                                <p className="text-[10px] opacity-70">Withdrawal of funds</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (PKR)</Label>
                            <Input 
                                id="amount" 
                                type="number" 
                                placeholder="0.00"
                                className="bg-[#181C23] border-white/5 text-[#F1F1F1]"
                                value={adjustmentForm.data.amount}
                                onChange={e => adjustmentForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Adjustment Reason / Notes</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Details about this manual entry..."
                                className="bg-[#181C23] border-white/5 text-[#F1F1F1] min-h-[100px]"
                                value={adjustmentForm.data.notes}
                                onChange={e => adjustmentForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsAdjustmentOpen(false)}>Cancel</Button>
                            <Button 
                                type="submit" 
                                className="bg-[#C9A84C] text-[#0A0C10] hover:bg-[#C9A84C]/90"
                                disabled={adjustmentForm.processing}
                            >
                                Process Adjustment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Rejection Modal */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent className="bg-[#111318] border-white/10 text-[#F1F1F1]">
                    <DialogHeader>
                        <DialogTitle className="text-red-500">Reject Request</DialogTitle>
                        <DialogDescription className="text-[#6B7280]">
                            Please provide a reason for rejecting this request. This will be visible to the investor.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={rejectRequest} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejection_note">Rejection Note</Label>
                            <Textarea 
                                id="rejection_note" 
                                placeholder="Explain why this request is being rejected..."
                                className="bg-[#181C23] border-white/5 text-[#F1F1F1] min-h-[120px]"
                                value={rejectionForm.data.admin_note}
                                onChange={e => rejectionForm.setData('admin_note', e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                            <Button 
                                type="submit" 
                                className="bg-red-500 text-white hover:bg-red-600"
                                disabled={rejectionForm.processing}
                            >
                                Confirm Rejection
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
