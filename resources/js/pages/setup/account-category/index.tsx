import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/accountcategory/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, Wand2, Percent, Tag } from "lucide-react";
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
import AccountCategorySummary from "./AccountCategorySummary";
import AccountCategoryFilters from "./AccountCategoryFilters";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { toast } from "sonner";

interface AccountCategory {
    id: number;
    name: string;
    percentage: number;
}

interface PageProps {
    categories: AccountCategory[];
    filters: {
        search?: string;
    };
    errors: Record<string, string>;
}

export default function AccountCategoryIndex({ categories, filters }: PageProps) {
    const { errors } = usePage().props as unknown as PageProps;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Financials", href: "#" },
        { title: "Account Categories", href: "/account-category" },
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
                    toast.success("Account category created", {
                        description: "New category has been added successfully.",
                    });
                    setOpenCreateDialog(false);
                    setName("");
                    setPercentage("");
                },
                onError: () => toast.error("Failed to create category"),
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 61)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <Head title="Account Categories | Finance Core" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="mt-6 px-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Account Categories</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage and view your account categories.
                            </p>
                        </div>

                        <Button onClick={() => setOpenCreateDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    </div>

                    <AccountCategorySummary count={categories.length} />

                    <AccountCategoryFilters filters={filters} />

                    {categories.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            No categories found.
                        </div>
                    ) : (
                        <DataTable data={categories} />
                    )}
                </div>
            </SidebarInset>

            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                <DialogContent className="max-w-xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
                    <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Wand2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Add Category</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Create a new account category</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="py-6 space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Name</Label>
                                <div className="relative group">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Regular, VIP..."
                                        className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm pl-10"
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Percentage (%)</Label>
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
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
                            >
                                {isSubmitting ? "Creating..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
