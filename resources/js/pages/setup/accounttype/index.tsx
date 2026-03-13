"use client";

import { useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/accounttype/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, Wand2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import AccountTypeSummary from "./AccountTypeSummary";
import AccountTypeFilters from "./AccountTypeFilters";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Financials", href: "#" },
  { title: "Account Types", href: "/account-types" },
];

interface AccountType {
  id: number;
  name: string;
  description: string;
  created_at: string;
  created_by: number;
  created_by_name?: string;
}

interface IndexProps {
  accountTypes: AccountType[];
  filters: {
    search?: string;
  };
}

export default function Index({ accountTypes, filters }: IndexProps) {
  useToastFromQuery();
  const pageProps = usePage().props as unknown as {
    errors: Record<string, string>;
  };

  const errors = pageProps.errors || {};

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    router.post("/account-types", { name, description }, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setDescription("");
        toast.success("Account type created successfully");
      },
      onFinish: () => setIsSubmitting(false),
    });
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
      <Head title="Account Types | Finance Core" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />

        <div className="mt-6 px-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold mb-1">Account Types</h1>
              <p className="text-sm text-muted-foreground">
                Manage and view your account types.
              </p>
            </div>

            <Button onClick={() => setOpenCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Account Type
            </Button>
          </div>

          <AccountTypeSummary count={accountTypes.length} />

          <AccountTypeFilters filters={filters} />

          {accountTypes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No account types found.
            </div>
          ) : (
            <DataTable data={accountTypes} />
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
                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Add Account Type</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Add a new account type to your system</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="py-6 space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asset, Liability..."
                  className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm"
                />
                {errors?.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description..."
                  className="min-h-[120px] rounded-xl border-zinc-200 dark:border-zinc-800 font-medium focus:ring-orange-500/20 transition-all text-sm resize-none"
                />
                {errors?.description && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.description}</p>}
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
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
