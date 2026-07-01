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
    { title: "Setup", href: "#" },
    { title: "Firms", href: "/firms" },
  ];

  useToastFromQuery();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState("all");

  const PREMIUM_ROUNDING = "rounded-2xl";

  return (
    <>
      <SidebarProvider>
        <Head title="Firms | View All" />
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar text-zinc-900 dark:text-zinc-100">
            <div className="max-w-[1400px] mx-auto p-6 space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Firms List</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage and view all your firms, branding, and business details.
                  </p>
                </div>

                {canCreate && (
                  <Link href="/firms/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Firm
                    </Button>
                  </Link>
                )}
              </div>

              {/* Filtering Command Bar */}
              <div className="p-4 rounded-xl shadow-sm border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, code, business type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-visible:ring-primary text-sm font-semibold"
                  />
                </div>

                <div className="w-[200px]">
                  <ShadSelect value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Filter By" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="text-xs font-semibold">All Firms</SelectItem>
                      <SelectItem value="primary" className="text-xs font-semibold text-orange-600">Primary Only</SelectItem>
                      <SelectItem value="standard" className="text-xs font-semibold">Others</SelectItem>
                    </SelectContent>
                  </ShadSelect>
                </div>

                <div className="flex items-center justify-end gap-6 px-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Total Count</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-orange-500 tabular-nums">{firms.length.toString().padStart(2, '0')}</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Firms</span>
                    </div>
                  </div>
                  <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center border">
                    <Activity className="h-4 w-4 text-zinc-500" />
                  </div>
                </div>
              </div>

              {/* Data Table Section */}
              <div
                className={cn(
                  PREMIUM_ROUNDING,
                  "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
                )}
              >
                <div className="">
                  {firms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <div className="h-20 w-20 rounded-3xl bg-white dark:bg-zinc-950 flex items-center justify-center shadow-xl mb-6">
                        <Building2 className="h-10 w-10 text-zinc-300" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">No Firms Found</h3>
                      <p className="text-zinc-500 font-bold text-xs uppercase tracking-tighter mt-2">There are no firms added yet</p>

                      {canCreate && (
                        <Link href="/firms/create">
                          <Button
                            variant="outline"
                            className="mt-8 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px]"
                          >
                            Add Your First Firm
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
              </div>
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
