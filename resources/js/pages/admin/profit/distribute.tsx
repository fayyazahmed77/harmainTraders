import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { 
    Calculator, 
    Calendar, 
    ArrowUpRight, 
    CheckCircle2, 
    Info,
    AlertTriangle,
    AlertCircle,
    Coins,
    TrendingUp,
    History as HistoryIcon,
    Users,
    Percent,
    ArrowDownRight,
    Lock,
    Unlock
} from 'lucide-react';
import { router } from '@inertiajs/react';
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
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Props {
    distributions: any[];
}

export default function Distribute({ distributions }: Props) {
    const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7));
    const [previewData, setPreviewData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const breadcrumbs = [
        { title: 'Admin Panel', href: '#' },
        { title: 'Investor Management', href: '/admin/investors' },
        { title: 'Profit Distribution', href: '/admin/profit/distribute' },
    ];

    const distributionForm = useForm({
        period: '',
        total_profit: 0,
    });

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/admin/profit/distribute/preview', { period });
            setPreviewData(response.data);
            distributionForm.setData({
                period: period,
                total_profit: response.data.total_profit
            });
            toast.success('Distribution preview generated', {
                style: {
                    background: '#111318',
                    color: '#F1F1F1',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }
            });
        } catch (error: any) {
            console.error('Error fetching preview:', error);
            const msg = error.response?.data?.message || 'Failed to fetch profit data';
            toast.error(msg, {
                style: {
                    background: '#111318',
                    color: '#F1F1F1',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }
            });
            setPreviewData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDistribute = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        distributionForm.post('/admin/profit/distribute', {
            onSuccess: () => {
                setPreviewData(null);
                setIsConfirmOpen(false);
                toast.success('Distribution finalized successfully');
            }
        });
    };

    const handleLock = (id: number) => {
        router.post(`/admin/profit/distribute/${id}/lock`, {}, {
            onSuccess: () => toast.success('Period locked successfully'),
        });
    };

    const handleUnlock = (id: number) => {
        router.post(`/admin/profit/distribute/${id}/unlock`, {}, {
            onSuccess: () => toast.success('Period unlocked for edits'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profit Distribution | Admin" />
            <Toaster position="top-right" />

            <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6 space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                            Financial Distribution
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Calculate and allocate periodic business results to capital partners
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Left Sidebar: Controls & History */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* New Allocation Card */}
                        <div className="rounded-2xl border border-border/50 bg-surface-1/50 backdrop-blur-xl shadow-sm p-5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-6">
                                <Calculator size={14} className="text-primary" /> New Allocation
                            </h3>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="period" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Settlement Period</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="period" 
                                            type="month" 
                                            value={period}
                                            onChange={e => setPeriod(e.target.value)}
                                            className="h-11 pl-10 bg-background/50 border-border/50 text-xs font-black uppercase tracking-widest rounded-xl focus:ring-primary/50"
                                        />
                                    </div>
                                </div>

                                <Button 
                                    onClick={fetchPreview}
                                    disabled={loading}
                                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                >
                                    {loading ? 'CALCULATING...' : 'GENERATE PREVIEW'}
                                </Button>
                            </div>
                        </div>

                        {/* Recent History Card */}
                        <div className="rounded-2xl border border-border/50 bg-surface-1/50 backdrop-blur-xl shadow-sm p-5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">
                                <HistoryIcon size={14} /> Allocation History
                            </h3>
                            <div className="space-y-4">
                                {Array.isArray(distributions) && distributions.length > 0 ? (
                                    distributions.slice(0, 5).map((dist) => (
                                        <div key={dist.id} className={cn(
                                            "group p-3 rounded-xl bg-background/30 border border-border/30 hover:border-primary/30 transition-all",
                                            dist.is_locked && "border-primary/50 bg-primary/5 shadow-inner"
                                        )}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{dist.distribution_period}</p>
                                                        {dist.is_locked && <Lock size={10} className="text-primary" />}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase">{new Date(dist.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className={`text-[10px] font-black tabular-nums ${dist.total_business_profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {dist.total_business_profit >= 0 ? '+' : ''}
                                                            {Number(dist.total_business_profit).toLocaleString()}
                                                        </p>
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">Settled</p>
                                                    </div>
                                                    
                                                    {dist.is_locked ? (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleUnlock(dist.id)}
                                                            className="h-7 w-7 p-0 rounded-lg hover:bg-rose-500/10 hover:text-rose-500"
                                                        >
                                                            <Unlock size={12} />
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleLock(dist.id)}
                                                            className="h-7 w-7 p-0 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Lock size={12} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center bg-surface-2/30 rounded-xl border border-border/30 border-dashed">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">No previous history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Preview & Actions */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {previewData ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {/* Preview Stats */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {[
                                            { 
                                                label: 'Net Result', 
                                                value: `PKR ${Math.abs(previewData.total_profit).toLocaleString()}`, 
                                                sub: previewData.total_profit >= 0 ? 'Business Profit' : 'Business Loss',
                                                color: previewData.total_profit >= 0 ? 'text-emerald-500' : 'text-rose-500',
                                                bg: previewData.total_profit >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5',
                                                icon: previewData.total_profit >= 0 ? ArrowUpRight : ArrowDownRight
                                            },
                                            { 
                                                label: 'Active Partners', 
                                                value: `${(previewData?.investors || []).length}`, 
                                                sub: 'Qualified for Distribution',
                                                color: 'text-blue-500',
                                                bg: 'bg-blue-500/5',
                                                icon: Users
                                            },
                                            { 
                                                label: 'Allocation Rate', 
                                                value: '100%', 
                                                sub: 'Pro-rata Distribution',
                                                color: 'text-amber-500',
                                                bg: 'bg-amber-500/5',
                                                icon: Percent
                                            },
                                        ].map((stat, i) => (
                                            <div key={i} className={`rounded-2xl border border-border/50 ${stat.bg} p-6 backdrop-blur-md shadow-sm relative overflow-hidden group`}>
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-primary/5 transition-colors"></div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                                        <h2 className={`mt-2 text-2xl font-black ${stat.color} tracking-tighter tabular-nums`}>{stat.value}</h2>
                                                        <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">{stat.sub}</p>
                                                    </div>
                                                    <div className={`p-2 rounded-lg ${stat.bg} border border-border/20`}>
                                                        <stat.icon size={18} className={stat.color} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Preview Table */}
                                    <div className="rounded-2xl border border-border/50 bg-surface-1/50 backdrop-blur-xl shadow-sm overflow-hidden">
                                        <div className="p-5 border-b border-border/50 bg-surface-2/30">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Detailed Distribution Breakdown</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-surface-2/50">
                                                    <TableRow className="border-border/50 hover:bg-transparent">
                                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Investor Identity</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Weighted Stake</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 text-right">Allocation (PKR)</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {previewData.investors.map((share: any) => (
                                                        <TableRow key={share.investor_id} className="border-border/50 hover:bg-surface-2/30 transition-colors group">
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                                                        {share.name}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-muted-foreground mt-0.5 font-mono uppercase">
                                                                        INV-{share.investor_id.toString().padStart(4, '0')}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-1.5 w-24 rounded-full bg-surface-3 overflow-hidden border border-border/20">
                                                                        <motion.div 
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${share.ownership_percentage}%` }}
                                                                            className={`h-full ${previewData.total_profit >= 0 ? 'bg-primary' : 'bg-rose-500'}`} 
                                                                        />
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-foreground font-mono tabular-nums">
                                                                        {Number(share.ownership_percentage || 0).toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <span className={`text-xs font-black font-mono tabular-nums ${previewData.total_profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {previewData.total_profit >= 0 ? '+' : '-'}
                                                                    {Math.abs(share.profit_share).toLocaleString()}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Action Box */}
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-md"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-xl bg-primary/10 p-3 text-primary border border-primary/20">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Final System Verification</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed mt-2 max-w-2xl">
                                                    finalize this distribution to record PKR {Math.abs(previewData.total_profit).toLocaleString()} as {previewData.total_profit >= 0 ? 'Profit' : 'Loss'} across all ledgers.
                                                    <span className="block mt-1 text-primary/70 font-black italic">! THIS ACTION IS IRREVERSIBLE AND IMPACTS AUDIT LOGS.</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="outline" onClick={() => setPreviewData(null)} className="h-12 rounded-xl border-border/50 bg-background/50 text-[10px] font-black uppercase tracking-widest px-6 hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                                                    Discard
                                                </Button>
                                                <Button 
                                                    onClick={() => setIsConfirmOpen(true)}
                                                    className="h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 px-8 flex items-center gap-2"
                                                    disabled={distributionForm.processing}
                                                >
                                                    <Coins size={16} /> 
                                                    {previewData.total_profit >= 0 ? 'Finalize Profit' : 'Finalize Loss'}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-[600px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/50 bg-surface-1/30 text-center relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                    <div className="relative z-10">
                                        <div className="rounded-full bg-surface-2 p-8 mb-6 border border-border/50 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                            <TrendingUp size={48} className="text-muted-foreground/40 group-hover:text-primary/50 transition-colors" />
                                        </div>
                                        <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Waiting for Period Selection</h2>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-xs mt-3 leading-relaxed">
                                            Select a settlement month on the left and generate a preview to audit the weighted distribution before final ledger commit.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            {/* Confirmation Dialog */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="bg-surface-1 border-border/50 text-foreground rounded-2xl shadow-2xl max-w-md p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-surface-2/50 border-b border-border/50">
                        <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={18} className="text-primary" /> System Verification
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                            Review the financial impact before committing to ledgers.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6 space-y-6">
                        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Distribution Summary</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-foreground">Total Result</span>
                                <span className={`text-lg font-black tabular-nums ${distributionForm.data.total_profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    PKR {Math.abs(distributionForm.data.total_profit).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs font-bold text-foreground">Transaction Type</span>
                                <span className="text-xs font-black uppercase tracking-widest text-primary">
                                    {distributionForm.data.total_profit >= 0 ? 'Profit Credit' : 'Loss Debit'}
                                </span>
                            </div>
                        </div>

                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                            Are you sure you want to proceed? This action will generate individual transaction entries for all { (previewData?.investors || []).length } active partners and update their balances permanently.
                        </p>
                    </div>

                    <DialogFooter className="p-6 bg-surface-2/30 border-t border-border/50 flex gap-3">
                        <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            Review Again
                        </Button>
                        <Button 
                            onClick={() => handleDistribute()}
                            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                            disabled={distributionForm.processing}
                        >
                            Confirm & Commit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
