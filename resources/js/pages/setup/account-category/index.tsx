"use client";

import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/accountcategory/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, Terminal, Wand2, Percent, Tag, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PREMIUM_ROUNDING = "rounded-2xl";

interface AccountCategory {
    id: number;
    name: string;
    percentage: number;
}

interface PageProps {
    categories: AccountCategory[];
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
}

export default function AccountCategoryIndex() {
    const { categories, errors } = usePage().props as unknown as PageProps;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Financials", href: "#" },
        { title: "Supplier Categories", href: "/account-category" },
    ];

    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [name, setName] = useState("");
    const [percentage, setPercentage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useToastFromQuery();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            "/account-category",
            {
                name,
                percentage,
            },
            {
                onSuccess: () => {
                    toast.success("Registry Entry Initialized", {
                        description: "New category classification node has been committed.",
                    });
                    setOpenCreateDialog(false);
                    setName("");
                    setPercentage("");
                },
                onError: () => toast.error("Initialization Failed"),
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    return (
        <>
            <SidebarProvider>
                <Head title="Supplier Category Registry | Finance Core" />
                <AppSidebar variant="inset" />
                <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                    <SiteHeader breadcrumbs={breadcrumbs} />

                    <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar text-zinc-900 dark:text-zinc-100">
                        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
                            {/* Header Section */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <Heading
                                    title="Pricing Category Registry"
                                    description="Manage differential percentage modules for supplier account classifications"
                                />
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => setOpenCreateDialog(true)}
                                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-zinc-200/50 dark:shadow-none"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Initialize Category
                                    </Button>
                                </motion.div>
                            </motion.div>

                            {/* Data Table Section */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className={cn(
                                    PREMIUM_ROUNDING,
                                    "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-2xl shadow-zinc-200/50 dark:shadow-none overflow-hidden"
                                )}
                            >
                                <div className="p-6 md:p-8">
                                    {categories.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                            <div className="h-20 w-20 rounded-3xl bg-white dark:bg-zinc-950 flex items-center justify-center shadow-xl mb-6">
                                                <Terminal className="h-10 w-10 text-zinc-300" />
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Zero Indices</h3>
                                            <p className="text-zinc-500 font-bold text-xs uppercase tracking-tighter mt-2">No category classification nodes detected in registry</p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setOpenCreateDialog(true)}
                                                className="mt-8 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px]"
                                            >
                                                Begin Manual Indexing
                                            </Button>
                                        </div>
                                    ) : (
                                        <DataTable data={categories} />
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    <style dangerouslySetInnerHTML={{
                        __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { 
              background: #e4e4e7; 
              border-radius: 10px;
            }
            .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
          `}} />
                </SidebarInset>
            </SidebarProvider>

            {/* Create Dialog */}
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                <DialogContent className="max-w-xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
                    <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Wand2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Initialize Category</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Configure pricing differential parameters for node</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="py-6 space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Classification Label</Label>
                                <div className="relative group">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Regular, Priority, VIP..."
                                        className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm pl-10"
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Differential Offset (%)</Label>
                                <div className="relative group">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={percentage}
                                        onChange={(e) => setPercentage(e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm pl-10 tabular-nums"
                                    />
                                </div>
                                {errors.percentage && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.percentage}</p>}
                            </div>
                        </div>

                        <DialogFooter className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setOpenCreateDialog(false)}
                                className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
                            >
                                Cancel Protocol
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
                            >
                                {isSubmitting ? "Indexing..." : "Initialize Node"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
