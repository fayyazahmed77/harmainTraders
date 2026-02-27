"use client";

import * as React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/firm/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, Search, Building2, Activity, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { motion } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/utils";

interface Firm {
  id: number;
  name: string;
  code: string;
  date?: string;
  business?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  phone?: string;
  fax?: string;
  owner?: string;
  email?: string;
  website?: string;
  saletax?: string;
  ntn?: string;
  printinvoice?: boolean;
  defult?: boolean;
  status?: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  logo_url?: string;
}

interface PageProps {
  firms: Firm[];
  auth: {
    user: any;
    permissions: string[];
  };
}

export default function FirmIndex() {
  const { firms, auth } = usePage().props as unknown as PageProps;
  const permissions = auth.permissions || [];
  const canCreate = permissions.includes("create firms");

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Financials", href: "#" },
    { title: "Commercial Identities", href: "/firms" },
  ];

  useToastFromQuery();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState("all");

  const PREMIUM_ROUNDING = "rounded-2xl";

  return (
    <>
      <SidebarProvider>
        <Head title="Firm Directory | Business Core" />
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
                  title="Firm Directory"
                  description="Govern institutional branding, fiscal parameters, and global commercial node signatures"
                />

                {canCreate && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/firms/create">
                      <Button
                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-zinc-200/50 dark:shadow-none"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Generate Identity Node
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </motion.div>

              {/* Filtering Command Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                <div className="md:col-span-4 relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    placeholder="Search Identity Signature..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-orange-500/20 transition-all text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-3">
                  <ShadSelect value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-12 bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-orange-500/20 transition-all text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-zinc-400" />
                        <SelectValue placeholder="Protocol Rank" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                      <SelectItem value="all" className="text-xs font-bold uppercase">All Authorities</SelectItem>
                      <SelectItem value="primary" className="text-xs font-bold uppercase text-orange-600">Primary Node Only</SelectItem>
                      <SelectItem value="standard" className="text-xs font-bold uppercase">Standard Segments</SelectItem>
                    </SelectContent>
                  </ShadSelect>
                </div>

                <div className="md:col-span-5 flex items-center justify-end gap-6 px-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Registry Density</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-orange-500 tabular-nums">{firms.length.toString().padStart(2, '0')}</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Verified Identities</span>
                    </div>
                  </div>
                  <div className="h-10 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-10 w-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-lg">
                    <Activity className="h-5 w-5 text-white dark:text-zinc-900" />
                  </div>
                </div>
              </motion.div>

              {/* Data Table Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  PREMIUM_ROUNDING,
                  "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-2xl shadow-zinc-200/50 dark:shadow-none overflow-hidden"
                )}
              >
                <div className="p-6 md:p-8">
                  {firms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <div className="h-20 w-20 rounded-3xl bg-white dark:bg-zinc-950 flex items-center justify-center shadow-xl mb-6">
                        <Building2 className="h-10 w-10 text-zinc-300" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Null State Detected</h3>
                      <p className="text-zinc-500 font-bold text-xs uppercase tracking-tighter mt-2">No registered commercial segments found in primary directory</p>

                      {canCreate && (
                        <Link href="/firms/create">
                          <Button
                            variant="outline"
                            className="mt-8 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px]"
                          >
                            Initiate First Identity
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <DataTable
                      data={firms}
                      searchTerm={searchTerm}
                      filterType={filterType}
                    />
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
