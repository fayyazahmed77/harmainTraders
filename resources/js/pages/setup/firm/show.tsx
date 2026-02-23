"use client";

import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { type BreadcrumbItem } from "@/types";
import {
  ArrowLeft,
  Pencil,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Activity,
  Briefcase,
  Fingerprint,
  Hash,
  Printer,
  CheckCircle2,
  Calendar as CalendarIcon,
  User,
  Building,
  Eye,
  ShieldAlert,
  Network,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/utils";

const PREMIUM_ROUNDING = "rounded-2xl";

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

interface PageProps {
  firm: Firm;
  auth: { user: any };
}

export default function FirmShow() {
  const { firm } = usePage().props as unknown as PageProps;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Financials", href: "/firms" },
    { title: "Commercial Dossier", href: `/firms/${firm.id}/show` },
  ];

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "—";

  return (
    <>
      <SidebarProvider>
        <Head title={`${firm.name} | Commercial Dossier`} />
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar text-zinc-900 dark:text-zinc-100 pb-20">
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-10">

              {/* Actions & Navigation */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Link href="/firms" className="inline-flex items-center gap-2 group text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <div className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900 transition-all">
                      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit Dossier</span>
                  </Link>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4">
                  <Link href={`/firms/${firm.id}/edit`}>
                    <Button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-zinc-200/50 dark:shadow-none hover:scale-105 transition-transform">
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Modify Parameters
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Header Profile Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(PREMIUM_ROUNDING, "relative border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-3xl p-8 lg:p-12 overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-none")}
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Building2 className="h-64 w-64 text-zinc-400" />
                </div>

                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 relative z-10">
                  {/* Branding Node */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-orange-500 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                    <div className="h-48 w-48 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4 flex items-center justify-center shadow-inner relative overflow-hidden ring-4 ring-white dark:ring-zinc-900">
                      {firm.logo_url ? (
                        <img src={firm.logo_url} className="h-full w-full object-contain" alt={firm.name} />
                      ) : (
                        <Building2 className="h-16 w-16 text-zinc-200 dark:text-zinc-800" />
                      )}
                    </div>
                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/30">
                      {firm.defult ? "Primary Node" : "Standard Node"}
                    </Badge>
                  </div>

                  {/* Identity Details */}
                  <div className="flex-1 text-center lg:text-left space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">MS-ID: {firm.id.toString().padStart(5, '0')}</span>
                      <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-[0.85]">
                        {firm.name}
                      </h1>
                    </div>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                      <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                        <Briefcase className="h-3 w-3 text-orange-500" />
                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{firm.business || "General Commercial"}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                        <Code className="h-3 w-3 text-orange-500" />
                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-mono">CODE: {firm.code || "N/A"}</span>
                      </div>
                      <Badge variant="outline" className={cn(
                        "border-2 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                        firm.status ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-rose-500/20 text-rose-500 bg-rose-500/5"
                      )}>
                        {firm.status ? "Pulse Active" : "Pulse Dormant"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Contact Hub */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 space-y-8")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 border border-orange-500/20">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none">Global</span>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Connectivity Hub</span>
                      </div>
                    </div>
                    <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Primary Voice Node</Label>
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{firm.phone || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Secondary Fax Node</Label>
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{firm.fax || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Digital Mailbox</Label>
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 lowercase">{firm.email || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Public Portal</Label>
                      <p className="text-sm font-black text-orange-600 dark:text-orange-400 underline decoration-orange-500/20 underline-offset-4">{firm.website || "—"}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Geographic & Fiscal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 space-y-8")}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none">Spatial</span>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Regional Deployment</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Primary Base Station</Label>
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed uppercase">{firm.address1 || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Satellite 02</Label>
                        <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase leading-snug">{firm.address2 || "—"}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Satellite 03</Label>
                        <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase leading-snug">{firm.address3 || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Fingerprint className="h-3 w-3 text-zinc-400" />
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none">N.T.N Pulse</Label>
                      </div>
                      <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tighter tabular-nums bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded w-fit">{firm.ntn || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="h-3 w-3 text-zinc-400" />
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none">PSTR/Tax ID</Label>
                      </div>
                      <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tighter tabular-nums bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded w-fit">{firm.saletax || "—"}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Operations & Lineage */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-black p-8 text-white space-y-8")}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg">
                      <Network className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none">Internal</span>
                      <span className="text-xs font-black uppercase tracking-widest text-white">System Protocols</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-1.5 group">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 transition-colors group-hover:border-orange-500/40">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-100 italic">Invoice Generation</span>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Auto-pulse hardcopies</span>
                        </div>
                        <div className={cn(
                          "h-6 w-12 rounded-full border-2 transition-all p-1 relative",
                          firm.printinvoice ? "border-emerald-500/40 bg-emerald-500/10" : "border-zinc-800 bg-zinc-950"
                        )}>
                          <div className={cn(
                            "h-3 w-3 rounded-full transition-all",
                            firm.printinvoice ? "bg-emerald-500 translate-x-6 shadow-[0_0_8px_rgba(16,185,129,1)]" : "bg-zinc-700 translate-x-0"
                          )} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Registry Source</Label>
                        <div className="flex items-center gap-3 pt-2">
                          <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-orange-500 shadow-inner uppercase tracking-tighter italic">
                            {firm.created_by_name?.charAt(0) || "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight text-white">{firm.created_by_name || "System Automated"}</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">{formatDate(firm.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-6 border-t border-zinc-800">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-3 w-3 text-zinc-500" />
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Node Controller</Label>
                      </div>
                      <p className="text-lg font-black uppercase tracking-tight text-orange-500 italic">{firm.owner || "Anonymous Terminal"}</p>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">Authorized Node Supervisor</p>
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col items-center gap-2 opacity-20">
                    <ShieldCheck className="h-8 w-8 text-white" />
                    <span className="text-[8px] font-black uppercase tracking-[0.5em]">Identity Secured</span>
                  </div>
                </motion.div>

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
