"use client";

import React, { useState, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { type BreadcrumbItem } from "@/types";
import {
  Plus,
  ArrowLeft,
  Wand2,
  Landmark,
  CreditCard,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Image as ImageIcon,
  Fingerprint,
  Building2,
  Code,
  Hash,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PREMIUM_ROUNDING = "rounded-2xl";

interface PageProps {
  errors: Record<string, string>;
  auth: { user: any };
  [key: string]: any;
}

export default function BankCreate() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { auth, errors } = usePage<any>().props as unknown as PageProps;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Financials", href: "/banks" },
    { title: "Initialize Node", href: "/banks/create" },
  ];

  const [form, setForm] = useState({
    name: "",
    account_no: "",
    account_name: "",
    code: "",
    branch: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: null as File | null,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm({ ...form, logo: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) formData.append(key, value as any);
    });

    router.post("/banks", formData, {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Registry Entry Initialized", { description: "New bank node has been committed." });
      },
      onError: () => toast.error("Initialization Failed"),
      onFinish: () => setIsSubmitting(false),
    });
  };

  return (
    <>
      <SidebarProvider>
        <Head title="Initialize Bank Node | Finance Core" />
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar text-zinc-900 dark:text-zinc-100 pb-20">
            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">

              {/* Back Action */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Link href="/banks" className="inline-flex items-center gap-2 group text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  <div className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900 transition-all">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Abort Provisioning</span>
                </Link>
              </motion.div>

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Heading
                  title="Initialize Bank Node"
                  description="Provision a new financial institution entry with secure account connectivity"
                />
              </motion.div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left: Core Identity */}
                <div className="lg:col-span-7 space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-8 relative overflow-hidden")}
                  >
                    <div className="absolute right-0 top-0 p-8 opacity-5">
                      <Building2 className="h-32 w-32 text-zinc-400" />
                    </div>

                    <div className="flex items-center gap-4 mb-10">
                      <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Node_Segment_01</span>
                        <span className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none mt-1">Institutional Core</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Institution Label</Label>
                        <div className="relative group">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Allied Bank Limited"
                            className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm pl-12"
                            required
                          />
                        </div>
                        {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mt-1">{errors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Routing Code</Label>
                        <div className="relative group">
                          <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            placeholder="SWIFT/ABA"
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-xs pl-10 uppercase tracking-widest"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Branch Node</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="branch"
                            value={form.branch}
                            onChange={handleChange}
                            placeholder="Main City Branch"
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-xs pl-10"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 h-[1px] bg-zinc-100 dark:bg-zinc-800 my-4" />

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Global Address Spec</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-4 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Full headquarters or branch address"
                            className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm pl-12"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-8")}
                  >
                    <div className="flex items-center gap-4 mb-10">
                      <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Node_Segment_02</span>
                        <span className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none mt-1">Asset Access Parameters</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Account Serial</Label>
                        <div className="relative group">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="account_no"
                            value={form.account_no}
                            onChange={handleChange}
                            placeholder="000-0000000-0"
                            className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-black focus:ring-orange-500/20 transition-all text-sm pl-12 tabular-nums tracking-widest font-mono"
                          />
                        </div>
                        {errors.account_no && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mt-1">{errors.account_no}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Account Designation</Label>
                        <div className="relative group">
                          <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="account_name"
                            value={form.account_name}
                            onChange={handleChange}
                            placeholder="Official Account Title"
                            className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm pl-12"
                          />
                        </div>
                        {errors.account_name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mt-1">{errors.account_name}</p>}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right: Identity & Contact */}
                <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">

                  {/* Logo Upload Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-8 flex flex-col items-center justify-center text-center space-y-6")}
                  >
                    <div className="w-full flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Identity Badge</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-0 bg-orange-500 rounded-3xl blur-2xl opacity-0 group-hover:opacity-10 transition-opacity" />
                      <div className="h-40 w-40 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden transition-all group-hover:border-orange-500/50">
                        {logoPreview ? (
                          <img src={logoPreview} className="h-full w-full object-cover" alt="Preview" />
                        ) : (
                          <>
                            <ImageIcon className="h-10 w-10 text-zinc-200 dark:text-zinc-800 mb-2" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 px-4">Awaiting Index</span>
                          </>
                        )}
                        <input
                          type="file"
                          name="logo"
                          accept="image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-900 dark:text-zinc-100">Synchronize Institution Brand</p>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Only SVG, PNG or JPEG nodes accepted</p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl border border-zinc-100 dark:border-zinc-800 font-bold uppercase tracking-widest text-[9px] h-10 px-6 relative overflow-hidden group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse File Segments
                    </Button>
                    {errors.logo && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.logo}</p>}
                  </motion.div>

                  {/* Contact Info Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-black p-8 space-y-8 shadow-2xl")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Registry Communications</span>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2 group">
                        <Label className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 group-focus-within:text-orange-500 transition-colors">Direct Protocol (Phone)</Label>
                        <div className="relative">
                          <Phone className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 transition-colors group-focus-within:text-orange-500" />
                          <Input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+00 000 0000000"
                            className="bg-transparent border-none border-b border-zinc-800 rounded-none pl-8 pr-0 text-white text-sm font-bold h-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-all placeholder:text-zinc-800 tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <Label className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 group-focus-within:text-orange-500 transition-colors">Digital Node (Email)</Label>
                        <div className="relative">
                          <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 transition-colors group-focus-within:text-orange-500" />
                          <Input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="office@bank.com"
                            className="bg-transparent border-none border-b border-zinc-800 rounded-none pl-8 pr-0 text-white text-sm font-bold h-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-all placeholder:text-zinc-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <Label className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 group-focus-within:text-orange-500 transition-colors">Data Portal (Website)</Label>
                        <div className="relative">
                          <Globe className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 transition-colors group-focus-within:text-orange-500" />
                          <Input
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            placeholder="https://www.bank.com"
                            className="bg-transparent border-none border-b border-zinc-800 rounded-none pl-8 pr-0 text-white text-sm font-bold h-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-all placeholder:text-zinc-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 flex flex-col gap-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 relative group overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          {isSubmitting ? "COMMITING..." : "INITIALIZE REGISTRY ENTRY"}
                          {!isSubmitting && <Wand2 className="h-4 w-4 group-hover:rotate-12 transition-transform duration-500" />}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </Button>

                      <div className="flex items-center gap-4 px-2">
                        <div className="h-[1px] flex-1 bg-zinc-800" />
                        <Activity className="h-3 w-3 text-zinc-800" />
                        <div className="h-[1px] flex-1 bg-zinc-800" />
                      </div>

                      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
                        <span>System Auth: Active</span>
                        <span>Integrity: 100%</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </form>
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
