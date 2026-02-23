"use client";

import * as React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/bank/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, Landmark, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { motion } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/utils";

interface Bank {
  id: number;
  name: string;
  account_no: string;
  account_name: string;
  code: string | null;
  branch: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_by_name: string;
  logo_url: string;
  created_by_avatar?: string | null;
  created_at: string;
}

interface PageProps {
  banks: Bank[];
  auth: {
    user: any;
    permissions: string[];
  };
}

export default function BankIndex() {
  const { banks, auth } = usePage().props as unknown as PageProps;
  const permissions = auth.permissions || [];
  const canCreate = permissions.includes("create banks");

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Financials", href: "#" },
    { title: "Bank Registry", href: "/banks" },
  ];

  useToastFromQuery();

  const PREMIUM_ROUNDING = "rounded-2xl";

  return (
    <>
      <SidebarProvider>
        <Head title="Bank Registry | Finance Core" />
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
                  title="Financial Institution Registry"
                  description="Manage and secure core banking nodes and account accessibility protocols"
                />

                {canCreate && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/banks/create">
                      <Button
                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-zinc-200/50 dark:shadow-none"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Initialize Bank Node
                      </Button>
                    </Link>
                  </motion.div>
                )}
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
                  {banks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <div className="h-20 w-20 rounded-3xl bg-white dark:bg-zinc-950 flex items-center justify-center shadow-xl mb-6">
                        <Landmark className="h-10 w-10 text-zinc-300" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Zero Connectivity</h3>
                      <p className="text-zinc-500 font-bold text-xs uppercase tracking-tighter mt-2">No institution nodes detected in current financial segment</p>

                      {canCreate && (
                        <Link href="/banks/create">
                          <Button
                            variant="outline"
                            className="mt-8 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px]"
                          >
                            Begin Manual Synchronization
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <DataTable data={banks} />
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
    </>
  );
}
