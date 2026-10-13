import React, { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    CheckSquare, 
    Square, 
    Calculator, 
    X, 
    ChevronDown, 
    Search,
    Save,
    ArrowRightLeft,
    FileText,
    Check,
    AlertCircle
} from "lucide-react";
import { router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from "framer-motion";
import { route } from 'ziggy-js';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import axios from 'axios';
import { cn, formatSafeDate } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import toast, { Toaster } from 'react-hot-toast';

interface Props {
    receipt: any;
    payment: any;
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
    [key: string]: any;
};

export default function JournalVoucherEdit({ receipt, payment, accounts }: Props) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Initial allocations map from existing voucher
    const initialSourceSelectedMap: Record<number, boolean> = {};
    if (receipt.allocations) {
        receipt.allocations.forEach((alloc: any) => {
            initialSourceSelectedMap[alloc.bill_id] = true;
        });
    }

    const initialDestSelectedMap: Record<number, boolean> = {};
    if (payment.allocations) {
        payment.allocations.forEach((alloc: any) => {
            initialDestSelectedMap[alloc.bill_id] = true;
        });
    }

    const { data, setData, put, processing, errors } = useForm<FormState>({
        date: receipt.date,
        credit_account_id: receipt.account_id,
        debit_account_id: payment.account_id,
        amount: receipt.amount ? receipt.amount.toString() : '',
        remarks: receipt.remarks || '',
        source_allocations: [],
        destination_allocations: []
    });

    const [customError, setCustomError] = useState<string | null>(null);
    const [sourceBills, setSourceBills] = useState<any[]>([]);
    const [destBills, setDestBills] = useState<any[]>([]);

    const [selectedSourceBills, setSelectedSourceBills] = useState<Record<number, boolean>>(initialSourceSelectedMap);
    const [selectedDestBills, setSelectedDestBills] = useState<Record<number, boolean>>(initialDestSelectedMap);

    const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
    const [destDialogOpen, setDestDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch bills when source account changes
    useEffect(() => {
        if (data.credit_account_id) {
            axios.get(route('payment.unpaid-bills'), { 
                params: { 
                    account_id: data.credit_account_id,
                    payment_id: receipt.id 
                } 
            })
            .then(res => {
                setSourceBills(res.data.bills || []);
            })
            .catch(() => {
                setSourceBills([]);
            });
        } else {
            setSourceBills([]);
            setSelectedSourceBills({});
        }
    }, [data.credit_account_id]);

    // Fetch bills when destination account changes
    useEffect(() => {
        if (data.debit_account_id) {
            axios.get(route('payment.unpaid-bills'), { 
                params: { 
                    account_id: data.debit_account_id,
                    payment_id: payment.id 
                } 
            })
            .then(res => {
                setDestBills(res.data.bills || []);
            })
            .catch(() => {
                setDestBills([]);
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

    const totalSourceSelected = sourceBills
        .filter(b => selectedSourceBills[b.id])
        .reduce((sum, b) => sum + parseFloat(b.remaining_amount), 0);

    const totalDestSelected = destBills
        .filter(b => selectedDestBills[b.id])
        .reduce((sum, b) => sum + parseFloat(b.remaining_amount), 0);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCustomError(null);

        if (!data.credit_account_id || !data.debit_account_id) {
            setCustomError('Please select both Source (Credit) and Destination (Debit) accounts.');
            return;
        }

        if (data.credit_account_id === data.debit_account_id) {
            setCustomError('Source and Destination accounts cannot be the same.');
            return;
        }

        if (!data.amount || parseFloat(data.amount) <= 0) {
            setCustomError('Please enter a valid transfer amount greater than 0.');
            return;
        }

        const formData = {
            ...data,
            source_allocations: sAllocations,
            destination_allocations: dAllocations
        };

        router.put(route('journal-vouchers.update', receipt.id), formData, {
            onError: (errs) => {
                if (errs.error) {
                    setCustomError(errs.error);
                }
            }
        });
    };

    const selectedSourceAccount = accounts.find(a => a.id === data.credit_account_id);
    const selectedDestAccount = accounts.find(a => a.id === data.debit_account_id);
    const cleanVoucherNo = receipt.voucher_no ? receipt.voucher_no.replace(/-(A|B)$/, '') : 'JV';

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-slate-50/50 dark:bg-zinc-950 min-w-0">
                <SiteHeader breadcrumbs={[
                    { title: "Dashboard", href: "/" },
                    { title: "Journal Vouchers", href: route('journal-vouchers.index') },
                    { title: cleanVoucherNo, href: route('journal-vouchers.show', receipt.id) },
                    { title: "Edit", href: "#" }
                ]} />

                <div className="w-full px-4 py-4 md:px-6 space-y-4 max-w-7xl mx-auto">
                    
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => router.visit(route('journal-vouchers.index'))} 
                                className="h-9 w-9 rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                                        Edit Journal Voucher
                                    </h1>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                                        {cleanVoucherNo}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                    Update double-entry accounts, amounts, and invoice settlement links
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* TOP FORM CONTROLS BAR */}
                        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                
                                {/* 1. Voucher Date */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                        Voucher Date <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input 
                                        type="date" 
                                        value={data.date} 
                                        onChange={e => setData('date', e.target.value)} 
                                        className="h-9 text-xs bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 rounded-lg focus:bg-white dark:focus:bg-zinc-900"
                                    />
                                    {errors.date && <p className="text-[11px] text-rose-500 font-medium">{errors.date}</p>}
                                </div>

                                {/* 2. Source Account (Credit) */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                                        <span>Source Account (Cr) <span className="text-rose-500">*</span></span>
                                        <span className="text-[10px] text-slate-400 font-normal">Credit side</span>
                                    </Label>
                                    <button 
                                        type="button"
                                        onClick={() => setSourceDialogOpen(true)}
                                        className={cn(
                                            "h-9 w-full flex items-center justify-between px-3 text-xs rounded-lg border transition-colors",
                                            selectedSourceAccount 
                                                ? "bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-medium" 
                                                : "bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 text-slate-400"
                                        )}
                                    >
                                        <span className="truncate">
                                            {selectedSourceAccount 
                                                ? `${selectedSourceAccount.code ? selectedSourceAccount.code + ' - ' : ''}${selectedSourceAccount.title}` 
                                                : "Select Source (Credit)..."}
                                        </span>
                                        {data.credit_account_id ? (
                                            <div 
                                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded text-slate-400"
                                                onClick={(e) => { e.stopPropagation(); setData('credit_account_id', null); }}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </div>
                                        ) : (
                                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                        )}
                                    </button>
                                    {errors.credit_account_id && <p className="text-[11px] text-rose-500 font-medium">{errors.credit_account_id}</p>}
                                </div>

                                {/* 3. Destination Account (Debit) */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                                        <span>Destination Account (Dr) <span className="text-rose-500">*</span></span>
                                        <span className="text-[10px] text-slate-400 font-normal">Debit side</span>
                                    </Label>
                                    <button 
                                        type="button"
                                        onClick={() => setDestDialogOpen(true)}
                                        className={cn(
                                            "h-9 w-full flex items-center justify-between px-3 text-xs rounded-lg border transition-colors",
                                            selectedDestAccount 
                                                ? "bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-medium" 
                                                : "bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 text-slate-400"
                                        )}
                                    >
                                        <span className="truncate">
                                            {selectedDestAccount 
                                                ? `${selectedDestAccount.code ? selectedDestAccount.code + ' - ' : ''}${selectedDestAccount.title}` 
                                                : "Select Destination (Debit)..."}
                                        </span>
                                        {data.debit_account_id ? (
                                            <div 
                                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded text-slate-400"
                                                onClick={(e) => { e.stopPropagation(); setData('debit_account_id', null); }}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </div>
                                        ) : (
                                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                        )}
                                    </button>
                                    {errors.debit_account_id && <p className="text-[11px] text-rose-500 font-medium">{errors.debit_account_id}</p>}
                                </div>

                                {/* 4. Transfer Amount */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                        Transfer Amount (PKR) <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                            <span className="text-[11px] font-bold text-slate-400">Rs</span>
                                        </div>
                                        <Input 
                                            type="number" 
                                            step="0.01"
                                            value={data.amount} 
                                            onChange={e => setData('amount', e.target.value)} 
                                            className="h-9 pl-8 text-xs font-mono font-semibold bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 text-right"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.amount && <p className="text-[11px] text-rose-500 font-medium">{errors.amount}</p>}
                                </div>

                            </div>
                        </div>

                        {/* THREE-COLUMN WORKFLOW SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                            
                            {/* COLUMN 1: Source Bills (Credit Side) */}
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs flex flex-col h-[520px]">
                                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                            Source Bills (Credit)
                                        </h3>
                                        <p className="text-[10px] text-slate-500">Unpaid bills for source party</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100">
                                            Rs {Number(totalSourceSelected).toLocaleString()}
                                        </span>
                                        <div className="text-[10px] text-slate-400 font-medium">Selected</div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                                    {!data.credit_account_id ? (
                                        <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                                            <FileText className="h-6 w-6 stroke-1 text-slate-300 dark:text-zinc-700" />
                                            <span>Select Source Account first</span>
                                        </div>
                                    ) : sourceBills.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                                            <Check className="h-5 w-5 text-emerald-500" />
                                            <span>No unpaid bills found for this account</span>
                                        </div>
                                    ) : (
                                        sourceBills.map(bill => {
                                            const isSelected = selectedSourceBills[bill.id];
                                            const allocation = sAllocations.find(a => a.bill_id === bill.id);
                                            
                                            return (
                                                <div 
                                                    key={bill.id} 
                                                    onClick={() => handleSourceBillToggle(bill)}
                                                    className={cn(
                                                        "flex items-start gap-2.5 p-2.5 rounded-lg border text-xs transition-colors cursor-pointer select-none",
                                                        isSelected 
                                                            ? "bg-slate-100/80 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-600" 
                                                            : "border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800/30"
                                                    )}
                                                >
                                                    <div className="pt-0.5 text-slate-600 dark:text-zinc-300">
                                                        {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                                                {bill.invoice_no || bill.invoice}
                                                            </span>
                                                            <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                                                                Rs {Number(bill.remaining_amount).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                            <span>Dated: {formatSafeDate(bill.date, 'dd MMM yyyy')}</span>
                                                            {allocation && (
                                                                <span className="font-medium text-emerald-700 dark:text-emerald-400 font-mono">
                                                                    Paying: Rs {Number(allocation.amount).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* COLUMN 2: Destination Bills (Debit Side) */}
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs flex flex-col h-[520px]">
                                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                            Destination Bills (Debit)
                                        </h3>
                                        <p className="text-[10px] text-slate-500">Unpaid bills for destination party</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-100">
                                            Rs {Number(totalDestSelected).toLocaleString()}
                                        </span>
                                        <div className="text-[10px] text-slate-400 font-medium">Selected</div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                                    {!data.debit_account_id ? (
                                        <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                                            <FileText className="h-6 w-6 stroke-1 text-slate-300 dark:text-zinc-700" />
                                            <span>Select Destination Account first</span>
                                        </div>
                                    ) : destBills.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                                            <Check className="h-5 w-5 text-emerald-500" />
                                            <span>No unpaid bills found for this account</span>
                                        </div>
                                    ) : (
                                        destBills.map(bill => {
                                            const isSelected = selectedDestBills[bill.id];
                                            const allocation = dAllocations.find(a => a.bill_id === bill.id);

                                            return (
                                                <div 
                                                    key={bill.id} 
                                                    onClick={() => handleDestBillToggle(bill)}
                                                    className={cn(
                                                        "flex items-start gap-2.5 p-2.5 rounded-lg border text-xs transition-colors cursor-pointer select-none",
                                                        isSelected 
                                                            ? "bg-slate-100/80 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-600" 
                                                            : "border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800/30"
                                                    )}
                                                >
                                                    <div className="pt-0.5 text-slate-600 dark:text-zinc-300">
                                                        {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                                                {bill.invoice_no || bill.invoice}
                                                            </span>
                                                            <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                                                                Rs {Number(bill.remaining_amount).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                            <span>Dated: {formatSafeDate(bill.date, 'dd MMM yyyy')}</span>
                                                            {allocation && (
                                                                <span className="font-medium text-emerald-700 dark:text-emerald-400 font-mono">
                                                                    Paying: Rs {Number(allocation.amount).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* COLUMN 3: Live Voucher Summary & Submit */}
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs flex flex-col h-[520px]">
                                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                                        <Calculator className="h-3.5 w-3.5 text-slate-500" /> Voucher Summary
                                    </h3>
                                    <span className="text-[11px] text-slate-400">Dr / Cr Balance</span>
                                </div>

                                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                                    
                                    {/* Double Entry Recap */}
                                    <div className="space-y-2 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 bg-slate-50/50 dark:bg-zinc-800/20 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Debit (Dr):</span>
                                            <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate max-w-[170px]">
                                                {selectedDestAccount ? selectedDestAccount.title : 'Not selected'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Credit (Cr):</span>
                                            <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate max-w-[170px]">
                                                {selectedSourceAccount ? selectedSourceAccount.title : 'Not selected'}
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex justify-between items-center">
                                            <span className="font-semibold text-slate-700 dark:text-zinc-300">Net Amount:</span>
                                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-zinc-100">
                                                Rs {Number(transferAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Allocation Engine Info */}
                                    <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-800/10 text-xs text-slate-600 dark:text-zinc-400">
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200 block mb-0.5">Allocation Mode:</span>
                                        {totalSourceSelected > 0 || totalDestSelected > 0 ? (
                                            <span className="text-slate-600 dark:text-zinc-400">
                                                Manual bill allocation active ({sAllocations.length} source, {dAllocations.length} dest).
                                            </span>
                                        ) : (
                                            <span className="text-slate-500">
                                                Auto-FIFO active: Automatically clears oldest unpaid invoices upon voucher posting.
                                            </span>
                                        )}
                                    </div>

                                    {/* Remarks Textarea */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                            Remarks / Narration
                                        </Label>
                                        <Textarea 
                                            value={data.remarks} 
                                            onChange={e => setData('remarks', e.target.value)} 
                                            className="min-h-[75px] bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 rounded-lg resize-none text-xs"
                                            placeholder="Enter reason for transfer or reference note..."
                                        />
                                        {errors.remarks && <p className="text-[11px] text-rose-500">{errors.remarks}</p>}
                                    </div>

                                    {/* Custom Error Banner */}
                                    {customError && (
                                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{customError}</span>
                                        </div>
                                    )}

                                </div>

                                <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900">
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="w-full h-10 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-lg shadow-xs transition-colors"
                                    >
                                        <Save className="h-3.5 w-3.5 mr-1.5" />
                                        {processing ? 'Updating Voucher...' : 'Update Journal Voucher'}
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </form>

                    {/* ACCOUNT SELECTION MODAL */}
                    <AnimatePresence>
                        {(sourceDialogOpen || destDialogOpen) && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                                    onClick={() => {
                                        setSourceDialogOpen(false);
                                        setDestDialogOpen(false);
                                        setSearchQuery('');
                                    }}
                                />
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: 8 }}
                                    className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
                                >
                                    <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 flex justify-between items-center">
                                        <h2 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                            Select {sourceDialogOpen ? 'Source (Credit)' : 'Destination (Debit)'} Account
                                        </h2>
                                        <button 
                                            onClick={() => {
                                                setSourceDialogOpen(false);
                                                setDestDialogOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded text-slate-400"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="p-3 border-b border-slate-200 dark:border-zinc-800">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input 
                                                autoFocus
                                                placeholder="Search by title, code, or type..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 h-9 text-xs bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-1.5 text-xs">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-800 text-slate-500 text-[11px]">
                                                <tr>
                                                    <th className="py-2 px-3 font-semibold">Code</th>
                                                    <th className="py-2 px-3 font-semibold">Account Title</th>
                                                    <th className="py-2 px-3 font-semibold">Type</th>
                                                    <th className="py-2 px-3 font-semibold text-right">Balance</th>
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
                                                        className="cursor-pointer hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 transition-colors border-b border-slate-100 dark:border-zinc-800/50 last:border-0"
                                                    >
                                                        <td className="py-2 px-3 font-mono text-slate-500">{acc.code || '-'}</td>
                                                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-zinc-200">{acc.title}</td>
                                                        <td className="py-2 px-3 text-slate-500">
                                                            <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                                                                {acc.account_type?.name || acc.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3 font-mono font-semibold text-right text-slate-900 dark:text-zinc-100">
                                                            Rs {Number(acc.current_balance || 0).toLocaleString()}
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
                                                        <td colSpan={4} className="py-6 text-center text-slate-400">
                                                            No accounts match "{searchQuery}"
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
