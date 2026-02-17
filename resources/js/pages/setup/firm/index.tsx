"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { DataTable } from "@/components/setup/firm/DataTable";
import { Link, usePage } from "@inertiajs/react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useToastFromQuery from "@/hooks/useToastFromQuery";

// ✅ Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Setup", href: "/setup" },
  { title: "Firm", href: "/firm" },
  { title: "List", href: "/firm" },
];

// ✅ Firm Interface
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
}

// ✅ Main Page Component
export default function FirmPage() {
  // ✅ Inertia Props
  const { firms, auth, errors } = usePage().props as unknown as {
    firms: Firm[];
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  // ✅ Toast for success/error feedback
  useToastFromQuery();

  // ✅ Permissions
  const permissions = auth?.permissions || [];
  const canCreate = permissions.includes("create firms");

  function route(name: string): string {
    if (name === "firms.create") return "/firms/create";
    if (name === "firms.index") return "/firms";
    return "#";
  }

  // ✅ Filter States
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState("all");

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />

        <div className="max-w-[1600px] mx-auto pt-8 pb-12 px-6 lg:px-10">
          {/* Command Bar Section */}
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-orange-500/5 blur-3xl -z-10 rounded-full opacity-50" />
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Setup Console</span>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground leading-[0.9] mb-2">
                    Firm <span className="text-orange-500">Directory</span>
                  </h1>
                  <p className="text-muted-foreground text-sm lg:text-base font-medium max-w-lg leading-relaxed">
                    Manage, edit, and orchestrate all registered commercial identities with high-precision parameters.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-12 w-px bg-border hidden lg:block mx-4" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Total Identities</span>
                  <span className="text-3xl font-black tabular-nums leading-none">{firms.length}</span>
                </div>
                {canCreate && (
                  <Link href={route("firms.create")}>
                    <Button
                      size="lg"
                      className="ml-4 bg-foreground text-background hover:bg-foreground/90 h-14 px-8 rounded-sm shadow-2xl shadow-foreground/10 transition-all active:scale-95 group"
                    >
                      <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="font-bold tracking-tight">Generate Identity</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Asymmetric Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column - Meta & Filters (Placeholder/Context) */}
            <div className="lg:col-span-3 space-y-8">
              <div className="p-6 bg-card border border-border/60 rounded-sm shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Directory Core</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-sm border border-border/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Global Reach</p>
                    <p className="text-xl font-black italic tracking-tighter">Unified System</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    All commercial entities listed here carry legal and transaction weight across the entire Harmain Traders ecosystem.
                  </p>
                </div>
              </div>

              {/* ✅ Search & Filters */}
              <div className="p-8 bg-card border border-border/60 rounded-sm shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                  <Search className="w-16 h-16" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pulse Filters</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Identity Search</span>
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        placeholder="Search Identity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 bg-muted/20 border-border/40 font-bold tracking-tight rounded-sm focus:ring-1 focus:ring-orange-500/50 transition-all uppercase text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Authority Level</span>
                    <ShadSelect value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="h-12 bg-muted/20 border-border/40 font-bold tracking-tight rounded-sm focus:ring-1 focus:ring-orange-500/50 uppercase text-xs">
                        <SelectValue placeholder="All Authorities" />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm border-border/60">
                        <SelectItem value="all" className="text-xs font-bold uppercase">All Authorities</SelectItem>
                        <SelectItem value="primary" className="text-xs font-bold uppercase text-orange-600">Primary Only</SelectItem>
                        <SelectItem value="standard" className="text-xs font-bold uppercase">Standard Only</SelectItem>
                      </SelectContent>
                    </ShadSelect>
                  </div>

                  <button
                    onClick={() => { setSearchTerm(""); setFilterType("all"); }}
                    className="w-full py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-orange-500 transition-colors border border-dashed border-border/60 rounded-sm mt-2"
                  >
                    Reset Parameters
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Main Table Area */}
            <div className="lg:col-span-9">
              {firms.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/10 rounded-sm bg-muted/5">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Plus className="w-8 h-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="font-bold text-foreground mb-1">Null State Detected</p>
                  <p className="text-sm text-muted-foreground mb-6">No registered firms found in the directory.</p>
                  {canCreate && (
                    <Link href={route("firms.create")}>
                      <Button
                        variant="outline"
                        className="rounded-sm border-foreground text-foreground hover:bg-foreground hover:text-background font-bold px-8"
                      >
                        Initiate First Identity
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-sm border border-border/60 shadow-2xl shadow-black/5 overflow-hidden">
                  <DataTable
                    data={firms}
                    searchTerm={searchTerm}
                    filterType={filterType}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
