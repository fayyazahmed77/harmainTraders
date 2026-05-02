import React, { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, Send, CheckSquare, Square, Calculator, X, ChevronDown, Search } from "lucide-react";
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from "framer-motion";
import { route } from 'ziggy-js';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import axios from 'axios';
import { formatSafeDate } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import toast, { Toaster } from 'react-hot-toast';

interface Props {
    accounts: any[];
}

type FormState = {
    date: string;
    credit_account_id: number | null;
    debit_account_id: number | null;
    amount: string;
    remarks: string;
    source_allocations: any[];
    destination_allocations: any[];
    [key: string]: any; // Add index signature to help with TS deep recursion in useForm overloads
};

export default function JournalVoucherCreate({ accounts }: Props) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const { data, setData, post, processing, errors } = useForm<FormState>({
        date: new Date().toISOString().split('T')[0],
        credit_account_id: null,
        debit_account_id: null,
        amount: '',
        remarks: '',
        source_allocations: [],
        destination_allocations: []
    });

    const [customError, setCustomError] = useState<string | null>(null);
    const [sourceBills, setSourceBills] = useState<any[]>([]);
    const [destBills, setDestBills] = useState<any[]>([]);

    const [selectedSourceBills, setSelectedSourceBills] = useState<Record<number, boolean>>({});
    const [selectedDestBills, setSelectedDestBills] = useState<Record<number, boolean>>({});

    const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
    const [destDialogOpen, setDestDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const accountOptions = accounts.map(acc => ({
        value: acc.id,
        label: `${acc.code ? acc.code + ' - ' : ''}${acc.title}`
    }));

    // Fetch bills when source account changes
    useEffect(() => {
        if (data.credit_account_id) {
            axios.get(route('payment.unpaid-bills'), { params: { account_id: data.credit_account_id } })
                .then(res => {
                    setSourceBills(res.data.bills || []);
                    setSelectedSourceBills({});
                });
        } else {
            setSourceBills([]);
            setSelectedSourceBills({});
        }
    }, [data.credit_account_id]);

    // Fetch bills when destination account changes
    useEffect(() => {
        if (data.debit_account_id) {
            axios.get(route('payment.unpaid-bills'), { params: { account_id: data.debit_account_id } })
                .then(res => {
                    setDestBills(res.data.bills || []);
                    setSelectedDestBills({});
                });
        } else {
            setDestBills([]);
            setSelectedDestBills({});
        }
    }, [data.debit_account_id]);

    const handleSourceBillToggle = (bill: any) => {
        setSelectedSourceBills(prev => ({
            ...prev,
            [bill.id]: !prev[bill.id]
        }));
    };

    const handleDestBillToggle = (bill: any) => {
        setSelectedDestBills(prev => ({
            ...prev,
            [bill.id]: !prev[bill.id]
        }));
    };

    const totalSourceSelected = sourceBills.filter(b => selectedSourceBills[b.id]).reduce((sum, b) => sum + parseFloat(b.remaining_amount), 0);
    const totalDestSelected = destBills.filter(b => selectedDestBills[b.id]).reduce((sum, b) => sum + parseFloat(b.remaining_amount), 0);

    // Auto-update transfer amount if user selects bills
    useEffect(() => {
        if (totalSourceSelected > 0 && totalDestSelected > 0) {
            setData('amount', Math.min(totalSourceSelected, totalDestSelected).toString());
        } else if (totalSourceSelected > 0 && totalDestSelected === 0) {
            setData('amount', totalSourceSelected.toString());
        } else if (totalDestSelected > 0 && totalSourceSelected === 0) {
            setData('amount', totalDestSelected.toString());
        }
    }, [totalSourceSelected, totalDestSelected]);

    // Distribute transferAmount across selected source bills
    const transferAmount = parseFloat(data.amount) || 0;
    
    let sRemaining = transferAmount;
    const sAllocations: any[] = [];
    const sourceBillsToAllocate = sourceBills.filter(b => selectedSourceBills[b.id]);
    for (const bill of sourceBillsToAllocate) {
        if (sRemaining <= 0) break;
        const allocate = Math.min(parseFloat(bill.remaining_amount), sRemaining);
        sAllocations.push({ bill_id: bill.id, type: bill.type, amount: allocate });
        sRemaining -= allocate;
    }
    const finalSourceAllocated = sAllocations.reduce((sum, a) => sum + a.amount, 0);

    // Distribute transferAmount across selected dest bills
    let dRemaining = transferAmount;
    const dAllocations: any[] = [];
    const destBillsToAllocate = destBills.filter(b => selectedDestBills[b.id]);
    for (const bill of destBillsToAllocate) {
        if (dRemaining <= 0) break;
        const allocate = Math.min(parseFloat(bill.remaining_amount), dRemaining);
        dAllocations.push({ bill_id: bill.id, type: bill.type, amount: allocate });
        dRemaining -= allocate;
    }
    const finalDestAllocated = dAllocations.reduce((sum, a) => sum + a.amount, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCustomError(null);

        if (!data.credit_account_id || !data.debit_account_id) {
            setCustomError('Please select both Source and Destination accounts.');
            return;
        }

        if (data.credit_account_id === data.debit_account_id) {
            setCustomError('Source and Destination accounts cannot be the same.');
            return;
        }

        if (!data.amount || parseFloat(data.amount) <= 0) {
            setCustomError('Please enter a valid transfer amount.');
            return;
        }

        const formData = {
            ...data,
            source_allocations: sAllocations,
            destination_allocations: dAllocations
        };

        router.post(route('journal-vouchers.store'), formData, {
            onSuccess: () => {
                // Success message is handled by flash in controller + redirect
            },
            onError: (errs) => {
                if (errs.error) {
                    setCustomError(errs.error);
                }
            }
        });
    };

    const selectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            minHeight: '44px',
            borderRadius: '0.5rem',
            borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
            boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
            '&:hover': {
                borderColor: '#6366f1'
            }
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#e0e7ff' : 'white',
            color: state.isSelected ? 'white' : '#1e293b',
            fontSize: '12px',
            fontWeight: '500'
        }),
        menu: (base: any) => ({ ...base, zIndex: 50 })
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-background">
                <SiteHeader breadcrumbs={[{ title: "Dashboard", href: "/" }, { title: "Journal Vouchers", href: route('journal-vouchers.index') }, { title: "Create", href: "#" }]} />

                <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6 space-y-4">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <Button variant="outline" size="icon" onClick={() => router.visit(route('journal-vouchers.index'))} className="h-10 w-10 rounded-xl">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                                    Create Journal Voucher
                                </h1>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                    Direct Account to Account Transfer
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        
                        {/* TOP BAR: Inputs */}
                        <Card className="rounded-2xl border-border/50 shadow-sm p-4 bg-surface-1/50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Voucher Date</Label>
                                    <Input 
                                        type="date" 
                                        value={data.date} 
                                        onChange={e => setData('date', e.target.value)} 
                                        className="h-11 bg-card border-border/50 rounded-xl"
                                    />
                                    {errors.date && <p className="text-[10px] text-rose-500 font-bold">{errors.date}</p>}
                                </div>
                                <div className="space-y-1.5 relative">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-rose-600">Source Account</Label>
                                    <button 
                                        type="button"
                                        onClick={() => setSourceDialogOpen(true)}
                                        className="h-11 w-full flex items-center justify-between px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:border-indigo-500 transition-colors"
                                    >
                                        <span className={data.credit_account_id ? "text-slate-800" : "text-slate-400"}>
                                            {data.credit_account_id ? accounts.find(a => a.id === data.credit_account_id)?.title : "Select source..."}
                                        </span>
                                        {data.credit_account_id ? (
                                            <div 
                                                className="p-1 hover:bg-slate-100 rounded"
                                                onClick={(e) => { e.stopPropagation(); setData('credit_account_id', null); }}
                                            >
                                                <X className="h-4 w-4 text-slate-400" />
                                            </div>
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                        )}
                                    </button>
                                    {errors.credit_account_id && <p className="text-[10px] text-rose-500 font-bold">{errors.credit_account_id}</p>}
                                </div>
                                <div className="space-y-1.5 relative">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Destination Account</Label>
                                    <button 
                                        type="button"
                                        onClick={() => setDestDialogOpen(true)}
                                        className="h-11 w-full flex items-center justify-between px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:border-indigo-500 transition-colors"
                                    >
                                        <span className={data.debit_account_id ? "text-slate-800" : "text-slate-400"}>
                                            {data.debit_account_id ? accounts.find(a => a.id === data.debit_account_id)?.title : "Select destination..."}
                                        </span>
                                        {data.debit_account_id ? (
                                            <div 
                                                className="p-1 hover:bg-slate-100 rounded"
                                                onClick={(e) => { e.stopPropagation(); setData('debit_account_id', null); }}
                                            >
                                                <X className="h-4 w-4 text-slate-400" />
                                            </div>
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                        )}
                                    </button>
                                    {errors.debit_account_id && <p className="text-[10px] text-rose-500 font-bold">{errors.debit_account_id}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Transfer Amount</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-xs font-bold text-muted-foreground">RS</span>
                                        </div>
                                        <Input 
                                            type="number" 
                                            step="0.01"
                                            value={data.amount} 
                                            onChange={e => setData('amount', e.target.value)} 
                                            className="h-11 pl-9 bg-card border-indigo-500/20 focus-visible:ring-indigo-500/50 rounded-xl font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.amount && <p className="text-[10px] text-rose-500 font-bold">{errors.amount}</p>}
                                </div>
                            </div>
                        </Card>

                        {/* BOTTOM PANELS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-5">
                            
                            {/* Panel 1: Source Bills */}
                            <Card className="rounded-2xl border-rose-500/20 shadow-sm overflow-hidden flex flex-col h-[600px] bg-card p-0 gap-0">
                                <div className="bg-rose-500/10 px-4 py-3 border-b border-rose-500/10 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-rose-600">Source Bills</h3>
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Select bills to allocate</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-rose-600">{Number(totalSourceSelected).toLocaleString()}</p>
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Selected</p>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {!data.credit_account_id ? (
                                        <div className="h-full flex items-center justify-center text-xs font-medium text-muted-foreground">Select Source Account</div>
                                    ) : sourceBills.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-xs font-medium text-muted-foreground">No unpaid bills found.</div>
                                    ) : (
                                        sourceBills.map(bill => {
                                            const isSelected = selectedSourceBills[bill.id];
                                            const allocation = sAllocations.find(a => a.bill_id === bill.id);
                                            
                                            return (
                                                <div 
                                                    key={bill.id} 
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-rose-500/5 border-rose-500/30 shadow-sm' : 'border-border/50 hover:border-rose-500/30 hover:bg-rose-500/5'}`}
                                                    onClick={() => handleSourceBillToggle(bill)}
                                                >
                                                    <div className="text-rose-500">
                                                        {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[11px] font-black text-text-primary">
                                                                {bill.invoice_no} <span className="text-text-muted font-medium ml-1">({bill.bill_type_label})</span>
                                                            </span>
                                                            <span className="text-[11px] font-black text-rose-600">
                                                                RS {Number(bill.remaining_amount).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <div className="text-[9px] text-muted-foreground font-bold uppercase">
                                                                Dated: {formatSafeDate(bill.date, 'dd MMM yyyy')}
                                                            </div>
                                                            {allocation && (
                                                                <div className="text-[10px] font-black text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded uppercase">
                                                                    Paying: {Number(allocation.amount).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>

                            {/* Panel 2: Destination Bills */}
                            <Card className="rounded-2xl border-emerald-500/20 shadow-sm overflow-hidden flex flex-col h-[600px] bg-card p-0 gap-0">
                                <div className="bg-emerald-500/10 px-4 py-3 border-b border-emerald-500/10 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Destination Bills</h3>
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Select bills to allocate</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-emerald-600">{Number(totalDestSelected).toLocaleString()}</p>
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Selected</p>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {!data.debit_account_id ? (
                                        <div className="h-full flex items-center justify-center text-xs font-medium text-muted-foreground">Select Destination Account</div>
                                    ) : destBills.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-xs font-medium text-muted-foreground">No unpaid bills found.</div>
                                    ) : (
                                        destBills.map(bill => {
                                            const isSelected = selectedDestBills[bill.id];
                                            const allocation = dAllocations.find(a => a.bill_id === bill.id);

                                            return (
                                                <div 
                                                    key={bill.id} 
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm' : 'border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5'}`}
                                                    onClick={() => handleDestBillToggle(bill)}
                                                >
                                                    <div className="text-emerald-500">
                                                        {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[11px] font-black text-text-primary">
                                                                {bill.invoice_no} <span className="text-text-muted font-medium ml-1">({bill.bill_type_label})</span>
                                                            </span>
                                                            <span className="text-[11px] font-black text-emerald-600">
                                                                RS {Number(bill.remaining_amount).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <div className="text-[9px] text-muted-foreground font-bold uppercase">
                                                                Dated: {formatSafeDate(bill.date, 'dd MMM yyyy')}
                                                            </div>
                                                            {allocation && (
                                                                <div className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                                                                    Paying: {Number(allocation.amount).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>

                            {/* Panel 3: Summary */}
                            <Card className="rounded-2xl border-indigo-500/20 shadow-sm flex flex-col h-[600px] bg-card relative overflow-hidden p-0 gap-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                
                                <div className="px-5 py-4 border-b border-indigo-500/10 flex items-center gap-3 relative z-10">
                                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                        <Calculator className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600">Summary & Submit</h3>
                                </div>

                                <div className="p-5 space-y-6 flex-1 relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-surface-1 rounded-xl">
                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Source Selected</span>
                                            <span className="text-sm font-black text-rose-600 tabular-nums">RS {Number(totalSourceSelected).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-surface-1 rounded-xl">
                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Dest Selected</span>
                                            <span className="text-sm font-black text-emerald-600 tabular-nums">RS {Number(totalDestSelected).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                                            <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">Total Transfer</span>
                                            <span className="text-base font-black text-indigo-600 tabular-nums">RS {Number(transferAmount).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Remarks / Description</Label>
                                        <Textarea 
                                            value={data.remarks} 
                                            onChange={e => setData('remarks', e.target.value)} 
                                            className="min-h-[80px] bg-surface-1 border-border/50 rounded-xl resize-none text-xs"
                                            placeholder="Enter reason for transfer..."
                                        />
                                        {errors.remarks && <p className="text-[10px] text-rose-500 font-bold">{errors.remarks}</p>}
                                    </div>

                                    {customError && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                            <p className="text-[11px] font-bold text-rose-600">{customError}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 border-t border-indigo-500/10 bg-indigo-500/5 relative z-10">
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="w-full h-14 text-sm font-black bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 border-none transition-all tracking-widest uppercase"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {processing ? 'Processing...' : 'Pay Now'}
                                    </Button>
                                </div>
                            </Card>

                        </div>
                    </form>

                    {/* Account Selection Dialogs */}
                    <AnimatePresence>
                        {(sourceDialogOpen || destDialogOpen) && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    onClick={() => {
                                        setSourceDialogOpen(false);
                                        setDestDialogOpen(false);
                                        setSearchQuery('');
                                    }}
                                />
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                                >
                                    <div className="p-4 border-b border-border/50 bg-surface-1/50 flex justify-between items-center">
                                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                                            Select {sourceDialogOpen ? 'Source' : 'Destination'} Account
                                        </h2>
                                        <button 
                                            onClick={() => {
                                                setSourceDialogOpen(false);
                                                setDestDialogOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="p-4 border-b border-border/50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                autoFocus
                                                placeholder="Search by name, code, or type..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 h-11 bg-surface-1 border-border/50 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-2">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-card z-10">
                                                <tr>
                                                    <th className="py-3 px-4 text-[10px] font-black uppercase text-muted-foreground tracking-wider border-b border-border/50">Code</th>
                                                    <th className="py-3 px-4 text-[10px] font-black uppercase text-muted-foreground tracking-wider border-b border-border/50">Name</th>
                                                    <th className="py-3 px-4 text-[10px] font-black uppercase text-muted-foreground tracking-wider border-b border-border/50">Type</th>
                                                    <th className="py-3 px-4 text-[10px] font-black uppercase text-muted-foreground tracking-wider text-right border-b border-border/50">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.filter(acc => 
                                                    !searchQuery || 
                                                    acc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                    (acc.code && acc.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                                    (acc.account_type && acc.account_type.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                ).map(acc => (
                                                    <tr 
                                                        key={acc.id}
                                                        onClick={() => {
                                                            if (sourceDialogOpen) {
                                                                setData('credit_account_id', acc.id);
                                                                setSourceDialogOpen(false);
                                                            } else {
                                                                setData('debit_account_id', acc.id);
                                                                setDestDialogOpen(false);
                                                            }
                                                            setSearchQuery('');
                                                        }}
                                                        className="cursor-pointer hover:bg-indigo-500/5 transition-colors border-b border-border/20 last:border-0"
                                                    >
                                                        <td className="py-3 px-4 text-xs font-bold text-muted-foreground">{acc.code || '-'}</td>
                                                        <td className="py-3 px-4 text-sm font-bold text-foreground">{acc.title}</td>
                                                        <td className="py-3 px-4 text-xs font-bold text-muted-foreground">
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                                {acc.account_type?.name || acc.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm font-black text-right text-foreground">
                                                            RS {Number(acc.current_balance || 0).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {accounts.filter(acc => 
                                                    !searchQuery || 
                                                    acc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                    (acc.code && acc.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                                    (acc.account_type && acc.account_type.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                ).length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-sm font-medium text-muted-foreground">
                                                            No accounts found matching "{searchQuery}"
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
