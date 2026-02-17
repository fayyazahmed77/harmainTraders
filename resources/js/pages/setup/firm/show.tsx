"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ✅ Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Firms", href: "/firms" },
  { title: "View", href: "#" },
];

// ✅ Props Interface
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
  created_by_name?: string;
  created_at: string;
  logo_url?: string;
}

export default function FirmShowPage() {
  const { props } = usePage() as any;
  const firm: Firm = props.firm;

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "-";

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />

        <div className="max-w-[1200px] mx-auto pt-8 pb-12 px-6 lg:px-10">
          {/* Header Section */}
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-orange-500/5 blur-3xl -z-10 rounded-full opacity-50" />
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Identity Blueprint</span>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground leading-[0.9] mb-2 uppercase">
                    {firm.name}
                  </h1>
                  <p className="text-muted-foreground text-sm lg:text-base font-medium max-w-lg leading-relaxed">
                    Visualizing registered pulse parameters for the <span className="text-orange-500 font-bold italic">MS-ID: {firm.id.toString().padStart(4, "0")}</span> commercial entity.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="font-bold text-xs uppercase tracking-widest"
                  onClick={() => router.visit("/firms")}
                >
                  Return
                </Button>
                <div className="h-8 w-px bg-border" />
                <Button
                  onClick={() => router.visit(`/firms/${firm.id}/edit`)}
                  className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 transition-all active:scale-95 group"
                >
                  Modify Identity
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Core Identity */}
            <div className="lg:col-span-8 space-y-10">
              <section className="p-8 bg-card border border-border/60 rounded-sm shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
                <div className="flex items-center gap-2 mb-8">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Pulse Metadata</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Identity Code</Label>
                    <p className="mt-2 font-mono text-xl font-black italic tracking-tighter text-orange-600 bg-orange-500/5 px-4 py-2 rounded-sm border border-orange-500/10 inline-block">
                      {firm.code}
                    </p>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Pulse Timestamp</Label>
                    <p className="mt-2 font-black tabular-nums text-lg text-foreground/80 tracking-tight">
                      {formatDate(firm.date)}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Commercial Signature</Label>
                    <p className="mt-2 text-2xl font-black tracking-tighter text-foreground uppercase border-b-2 border-border/40 pb-2">
                      {firm.name}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Business core Objective</Label>
                    <p className="mt-2 text-lg font-bold italic text-foreground tracking-tight opacity-80">
                      {firm.business || "GLOBAL COMMERCIAL OPERATIONS"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="p-8 bg-card border border-border/60 rounded-sm shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-8">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Geographic Coordinates</h2>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Vector {i}</Label>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-tight">
                          {(firm as any)[`address${i}`] || "[NULL]"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/40">
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Direct Voice Node</Label>
                      <p className="mt-1 font-mono font-bold text-lg tracking-tighter text-foreground/90">
                        {firm.phone || "[OFFLINE]"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Legacy Voice Node (Fax)</Label>
                      <p className="mt-1 font-mono font-bold text-lg tracking-tighter text-foreground/90">
                        {firm.fax || "[OFFLINE]"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Identity Operator</Label>
                      <p className="mt-1 font-black text-lg text-foreground/90 uppercase tracking-tight">
                        {firm.owner || "[ANONYMOUS]"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Meta & Assets */}
            <div className="lg:col-span-4 space-y-8">
              <section className="p-8 bg-muted/40 border border-border/60 rounded-sm shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Identity Asset</h2>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-card border border-border/60 rounded-sm shadow-inner min-h-[220px]">
                  {firm.logo_url ? (
                    <div className="relative group w-full h-full p-4 flex items-center justify-center">
                      <img
                        src={firm.logo_url}
                        alt="Identity Asset"
                        className="max-h-[160px] w-auto object-contain drop-shadow-2xl"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground/30">
                      <Building2 className="w-16 h-16 mb-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Asset Null</span>
                    </div>
                  )}
                  <div className="w-full h-px bg-border/60 my-6" />
                  <div className="w-full text-center">
                    <p className="text-[10px] font-black text-foreground/70 uppercase tracking-widest mb-1">Status Access</p>
                    <Badge className={cn(
                      "rounded-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg",
                      firm.status ? "bg-orange-500 shadow-orange-500/10" : "bg-muted text-muted-foreground shadow-none border border-border"
                    )}>
                      {firm.status ? "Pulse Active" : "Pulse Dormant"}
                    </Badge>
                  </div>
                </div>
              </section>

              <section className="p-8 bg-card border border-border/60 rounded-sm shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Digital Connectivity</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Pulse Mailbox</Label>
                    <p className="mt-1 font-bold text-foreground overflow-hidden text-ellipsis lowercase">
                      {firm.email || "[OFFLINE]"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Global Web Node</Label>
                    <p className="mt-1 font-bold text-orange-600 underline decoration-orange-500/30 underline-offset-4 overflow-hidden text-ellipsis">
                      {firm.website || "[OFFLINE]"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-sm border border-border/40">
                      <Label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 block mb-1">Sales Tax</Label>
                      <span className="font-mono text-xs font-black tracking-tighter">{firm.saletax || "[NULL]"}</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-sm border border-border/40">
                      <Label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 block mb-1">NTN Pulse</Label>
                      <span className="font-mono text-xs font-black tracking-tighter">{firm.ntn || "[NULL]"}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="p-8 bg-muted/20 border border-border/60 rounded-sm shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">System Lineage</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                    <span className="text-muted-foreground/60">Primary Terminal</span>
                    <span className={firm.defult ? "text-orange-600" : "text-muted-foreground"}>{firm.defult ? "ACTIVE" : "STANDARD"}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                    <span className="text-muted-foreground/60">Invoice Protocol</span>
                    <span className={firm.printinvoice ? "text-orange-600" : "text-muted-foreground"}>{firm.printinvoice ? "ENABLED" : "BYPASS"}</span>
                  </div>
                  <div className="h-px bg-border/60 my-4" />
                  <div>
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Identity Source</Label>
                    <p className="font-black text-[11px] uppercase tracking-widest text-foreground/80 mt-1">
                      {firm.created_by_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Registry Pulse</Label>
                    <p className="font-bold text-[11px] tabular-nums text-foreground/80 mt-1">
                      {formatDate(firm.created_at)}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
