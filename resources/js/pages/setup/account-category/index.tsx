"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem } from "@/types";
import { useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Percent, Tag, Activity, ArrowRight, Layers, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Account", href: "/account" },
    { title: "Supplier Category", href: "/account-category" },
];

interface AccountCategory {
    id: number;
    name: string;
    percentage: number;
}

interface IndexProps {
    categories: AccountCategory[];
}

export default function Index({ categories }: IndexProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: "",
        percentage: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/account-category/${editingId}`, {
                onSuccess: () => {
                    toast.success("Record Synchronized");
                    setEditingId(null);
                    reset();
                },
            });
        } else {
            post("/account-category", {
                onSuccess: () => {
                    toast.success("New entry committed");
                    reset();
                },
            });
        }
    };

    const startEdit = (cat: AccountCategory) => {
        setEditingId(cat.id);
        setData({
            name: cat.name,
            percentage: String(cat.percentage),
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        reset();
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
    };

    const executeDelete = () => {
        if (!deleteId) return;
        destroy(`/account-category/${deleteId}`, {
            onSuccess: () => {
                toast.success("Record Purged");
                setDeleteId(null);
            },
        });
    };

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 61)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />

                {/* Dual-Adaptive Surface */}
                <div className="flex flex-1 flex-col p-6 sm:p-10 space-y-12 bg-slate-50 dark:bg-[#080808] min-h-screen transition-colors duration-500">

                    {/* Pro Header Sub-System */}
                    <div className="flex flex-col space-y-3 relative">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-[3px] bg-[#FF4D00]" />
                            <span className="text-[10px] font-mono text-slate-500 dark:text-[#FF4D00]/60 tracking-[0.4em] uppercase font-black">
                                Core // Pricing_Matrix_v4
                            </span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                Category <span className="font-light italic text-slate-400 dark:text-white/20">Vault</span>
                            </h1>
                            <span className="hidden sm:inline-block h-[1px] flex-1 bg-slate-200 dark:bg-white/5" />
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-1 w-1 bg-[#FF4D00] rounded-full opacity-30 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                        {/* High-Resolution Data Grid (List) */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="flex justify-between items-center px-2 mb-2">
                                <span className="text-[9px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Activity className="h-3 w-3 text-[#FF4D00]/80" /> ACTIVE_NODES: {categories.length.toString().padStart(2, '0')}
                                </span>
                                <div className="bg-slate-200 dark:bg-white/5 h-[1px] w-20" />
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <AnimatePresence mode="popLayout">
                                    {categories.map((cat, index) => (
                                        <motion.div
                                            key={cat.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{
                                                delay: index * 0.03,
                                                duration: 0.5,
                                                ease: [0.16, 1, 0.3, 1]
                                            }}
                                            className={cn(
                                                "group relative overflow-hidden transition-all duration-500",
                                                "bg-white dark:bg-[#0F0F0F] border-[0.5px] border-slate-200 dark:border-white/5 hover:border-[#FF4D00]/30",
                                                "hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]",
                                                "p-6 flex items-center justify-between rounded-sm"
                                            )}
                                        >
                                            {/* Interactive Accent */}
                                            <div className="absolute left-0 top-0 w-[3px] h-full bg-[#FF4D00] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />

                                            <div className="flex items-center gap-10 relative z-10">
                                                <div className="flex flex-col min-w-[80px]">
                                                    <div className="flex items-baseline">
                                                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                                            {cat.percentage}
                                                        </span>
                                                        <span className="text-xs font-bold text-[#FF4D00] ml-0.5">%</span>
                                                    </div>
                                                    <span className="text-[8px] font-mono text-slate-400 dark:text-white/20 uppercase tracking-[0.25em] mt-1 font-bold">
                                                        Differential
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5 border-l border-slate-100 dark:border-white/5 pl-10">
                                                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight group-hover:text-[#FF4D00] transition-colors duration-300">
                                                        {cat.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-mono text-slate-400 dark:text-white/20 uppercase tracking-[0.1em] bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                                            UID_{cat.id.toString().padStart(4, '0')}
                                                        </span>
                                                        <div className="h-1 w-1 bg-slate-300 dark:bg-white/10 rounded-full" />
                                                        <span className="text-[9px] font-mono text-slate-400 dark:text-white/20 uppercase tracking-[0.1em]">
                                                            Status: Verified
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <button
                                                        onClick={() => startEdit(cat)}
                                                        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:text-white/30 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all rounded-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(cat.id)}
                                                        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-red-600 dark:text-white/30 dark:hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all rounded-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-slate-100 dark:text-white/5 group-hover:text-[#FF4D00] transition-colors" />
                                            </div>

                                            {/* Micro-Topography Background */}
                                            <div className="absolute right-0 top-0 text-[60px] font-black text-slate-50 dark:text-white/[0.02] -translate-y-1/2 translate-x-1/2 pointer-events-none select-none italic tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                                {cat.percentage}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {categories.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-32 border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center space-y-8 rounded-sm"
                                    >
                                        <div className="relative">
                                            <Layers className="h-12 w-12 text-slate-200 dark:text-white/5" />
                                            <div className="absolute inset-0 animate-ping opacity-20">
                                                <Layers className="h-12 w-12 text-[#FF4D00]" />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-[10px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-[0.4em] font-black">
                                                Handshake protocol initiated...
                                            </p>
                                            <p className="text-[8px] font-mono text-slate-300 dark:text-white/10 uppercase tracking-[0.2em]">
                                                Awaiting primary data injection
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Precision Console (Form) */}
                        <div className="lg:col-span-5 sticky top-10">
                            <Card className="bg-white dark:bg-[#0A0A0A] border-[0.5px] border-slate-200 dark:border-white/10 rounded-sm shadow-2xl overflow-hidden relative">

                                {/* Visual Depth Accents */}
                                <div className="absolute top-0 right-0 p-4 opacity-5 flex items-center gap-2">
                                    <Sparkles className="h-20 w-20 text-[#FF4D00]" />
                                </div>

                                <div className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 px-8 py-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-[#FF4D00] animate-pulse" />
                                        <span className="text-[10px] font-mono text-slate-600 dark:text-white/60 tracking-[0.25em] uppercase font-black">
                                            Operational_Panel
                                        </span>
                                    </div>
                                    {editingId && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-[2px] w-4 bg-[#FF4D00]" />
                                            <span className="text-[9px] text-[#FF4D00] font-mono font-black uppercase tracking-widest">STATE: SYNC</span>
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-10">
                                    <form onSubmit={handleSubmit} className="space-y-12">
                                        <div className="space-y-10">
                                            {/* Name Input */}
                                            <div className="space-y-4 group">
                                                <Label className="text-[9px] font-mono uppercase tracking-[0.4em] text-slate-400 dark:text-white/30 font-black group-focus-within:text-[#FF4D00] transition-colors">
                                                    Category_ID_Label
                                                </Label>
                                                <div className="relative">
                                                    <Tag className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 dark:text-white/10 transition-colors group-focus-within:text-[#FF4D00]" />
                                                    <Input
                                                        placeholder="INPUT_LABEL_HERE"
                                                        className="bg-transparent border-none border-b border-slate-200 dark:border-white/10 rounded-none pl-10 pr-0 text-slate-900 dark:text-white text-xl font-black tracking-tight h-12 focus-visible:ring-0 focus-visible:border-[#FF4D00] transition-all placeholder:text-slate-200 dark:placeholder:text-white/5"
                                                        value={data.name}
                                                        onChange={(e) => setData("name", e.target.value)}
                                                    />
                                                </div>
                                                {errors.name && <p className="text-[9px] font-mono uppercase text-red-500 tracking-[0.2em] font-bold">ERR_LABEL_INVALID</p>}
                                            </div>

                                            {/* Percentage Input */}
                                            <div className="space-y-4 group">
                                                <Label className="text-[9px] font-mono uppercase tracking-[0.4em] text-slate-400 dark:text-white/30 font-black group-focus-within:text-[#FF4D00] transition-colors">
                                                    Delta_Correction_Factor
                                                </Label>
                                                <div className="relative">
                                                    <Percent className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 dark:text-white/10 transition-colors group-focus-within:text-[#FF4D00]" />
                                                    <Input
                                                        type="number"
                                                        placeholder="00.00"
                                                        step="0.01"
                                                        max="100"
                                                        min="0"
                                                        className="bg-transparent border-none border-b border-slate-200 dark:border-white/10 rounded-none pl-12 pr-0 text-slate-900 dark:text-white text-6xl font-black tracking-tighter h-24 focus-visible:ring-0 focus-visible:border-[#FF4D00] transition-all placeholder:text-slate-100 dark:placeholder:text-white/5 tabular-nums"
                                                        value={data.percentage}
                                                        onChange={(e) => setData("percentage", e.target.value)}
                                                    />
                                                </div>
                                                {errors.percentage && <p className="text-[9px] font-mono uppercase text-red-500 tracking-[0.2em] font-bold">ERR_DELTA_EXCEEDED</p>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6 pt-10">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className={cn(
                                                    "w-full transition-all duration-700 relative group overflow-hidden h-16 rounded-sm",
                                                    "bg-slate-900 dark:bg-white text-white dark:text-black",
                                                    "hover:bg-[#FF4D00] dark:hover:bg-[#FF4D00] hover:text-white",
                                                    "font-black uppercase tracking-[0.3em] text-xs shadow-2xl"
                                                )}
                                            >
                                                <span className="relative z-10 flex items-center justify-center gap-3">
                                                    {processing ? "COMMITTING_DATA..." : editingId ? "SYNCHRONIZE_SYSTEM" : "INITIALIZE_INDEX"}
                                                    {!processing && <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-500" />}
                                                </span>
                                                {/* Button Gloss */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            </Button>

                                            {editingId && (
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    className="w-full text-slate-400 dark:text-white/20 hover:text-slate-900 dark:hover:text-white text-[9px] font-mono uppercase tracking-[0.4em] py-2 transition-colors flex items-center justify-center gap-2 group"
                                                >
                                                    <div className="h-[1px] w-4 bg-slate-200 dark:bg-white/10 group-hover:bg-[#FF4D00] transition-colors" />
                                                    Abort Operation
                                                    <div className="h-[1px] w-4 bg-slate-200 dark:bg-white/10 group-hover:bg-[#FF4D00] transition-colors" />
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </CardContent>

                                {/* Decorative Footer Detail */}
                                <div className="h-1 w-full bg-gradient-to-r from-[#FF4D00] via-slate-900 to-[#FF4D00] dark:via-white opacity-20" />
                            </Card>

                            {/* Advanced System Telemetry Footer */}
                            <div className="mt-12 space-y-4 px-2">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <div className="text-[7px] font-mono text-slate-400 dark:text-white/10 uppercase tracking-widest font-bold">Kernel_Core</div>
                                        <div className="text-[10px] font-mono text-slate-600 dark:text-white/40 font-black tracking-tight">STABLE_PRICING_V4.2.0</div>
                                    </div>
                                    <div className="text-right space-y-1 font-mono">
                                        <div className="text-[7px] text-slate-400 dark:text-white/10 uppercase tracking-widest font-bold">Connection</div>
                                        <div className="text-[10px] text-[#FF4D00] font-black tracking-tight flex items-center justify-end gap-2 px-3 py-1 bg-[#FF4D00]/5 rounded-sm">
                                            <div className="h-1 w-1 bg-[#FF4D00] animate-pulse" /> ENCRYPTED_SSL_ACTIVE
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[0.5px] w-full bg-slate-200 dark:bg-white/5" />
                                <div className="text-[8px] font-mono text-slate-300 dark:text-white/5 uppercase tracking-[0.5em] text-center">
                                    Harmain Systems © 2026 // Integrated Management Interface
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* High-Precision De-Index Confirmation Dialog */}
                <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <DialogContent className="sm:max-w-[440px] bg-white dark:bg-[#0D0D0D] border-[0.5px] border-slate-200 dark:border-white/10 rounded-sm p-0 shadow-3xl overflow-hidden">
                        <div className="h-1 w-full bg-red-600" />
                        <div className="p-8 space-y-8">
                            <DialogHeader className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-sm bg-red-50 dark:bg-red-950/20 flex items-center justify-center border border-red-100 dark:border-red-900/30">
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            Security Handshake
                                        </DialogTitle>
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-white/20 uppercase tracking-widest">
                                            <ShieldCheck className="h-3 w-3" /> Integrity_Check_Pending
                                        </div>
                                    </div>
                                </div>
                                <DialogDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium pt-2">
                                    You are about to execute a <span className="text-red-600 font-bold uppercase tracking-tight">permanent de-indexing</span> operation on this category node. This modification is irreversible and will purge all linked differential metadata from the primary vault.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 border-y border-slate-100 dark:border-white/5 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-wider">
                                    <span>Target Node ID</span>
                                    <span className="text-slate-900 dark:text-white font-black">CAT_REF_00{deleteId}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-wider">
                                    <span>Operation Type</span>
                                    <span className="text-red-500 font-black underline underline-offset-4">DESTRUCTIVE_PURGE</span>
                                </div>
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px] h-12 rounded-none transition-all"
                                >
                                    Abort Operation
                                </Button>
                                <Button
                                    onClick={executeDelete}
                                    disabled={processing}
                                    className="flex-1 bg-red-600 text-white hover:bg-black dark:hover:bg-white dark:hover:text-black font-black uppercase tracking-[0.2em] text-[10px] h-12 rounded-none shadow-2xl transition-all"
                                >
                                    {processing ? "PURGING..." : "EXECUTE PURGE"}
                                </Button>
                            </DialogFooter>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 px-8 py-3 flex justify-between items-center">
                            <span className="text-[7px] font-mono text-slate-400 dark:text-white/20 uppercase tracking-[0.4em]">Audit_Log_Authorized</span>
                            <div className="flex gap-1">
                                <div className="h-1 w-4 bg-red-600/30" />
                                <div className="h-1 w-2 bg-slate-300 dark:bg-white/10" />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </SidebarInset>
        </SidebarProvider>
    );
}
