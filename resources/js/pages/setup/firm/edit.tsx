"use client";

import React, { useState, useEffect, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { type BreadcrumbItem } from "@/types";
import {
  Plus,
  ArrowLeft,
  Wand2,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Image as ImageIcon,
  Fingerprint,
  Code,
  Calendar as CalendarIcon,
  Printer,
  CheckCircle2,
  Activity,
  Briefcase,
  Hash,
  Receipt,
  User,
  Building,
  Pencil,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  logo?: string;
}

interface PageProps {
  firm: Firm;
  errors: Record<string, string>;
  auth: { user: any };
  [key: string]: any;
}

export default function FirmEdit({ firm }: { firm: Firm }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { auth, errors } = usePage<any>().props as unknown as PageProps;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Financials", href: "/firms" },
    { title: "Modify Identity", href: `/firms/${firm.id}/edit` },
  ];

  const [date, setDate] = useState<Date | undefined>(firm.date ? new Date(firm.date) : new Date());
  const [openCalendar, setOpenCalendar] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(firm.logo ? `/storage/${firm.logo}` : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: firm.code || "",
    name: firm.name || "",
    business: firm.business || "",
    address1: firm.address1 || "",
    address2: firm.address2 || "",
    address3: firm.address3 || "",
    phone: firm.phone || "",
    fax: firm.fax || "",
    owner: firm.owner || "",
    email: firm.email || "",
    website: firm.website || "",
    saletax: firm.saletax || "",
    ntn: firm.ntn || "",
    printinvoice: !!firm.printinvoice,
    defult: !!firm.defult,
    status: !!firm.status,
    logo: null as File | null,
    _method: "PUT",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm({ ...form, logo: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) {
        if (typeof value === "boolean") {
          formData.append(key, value ? "1" : "0");
        } else {
          formData.append(key, value as any);
        }
      }
    });

    if (date) {
      formData.append("date", date.toISOString().split("T")[0]);
    }

    router.post(`/firms/${firm.id}`, formData, {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Identity Module Updated", { description: "Commercial node parameters have been synchronized." });
      },
      onError: () => toast.error("Sync Failed"),
      onFinish: () => setIsSubmitting(false),
    });
  };

  return (
    <>
      <SidebarProvider>
        <Head title={`Modify ${firm.name} | Finance Core`} />
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar text-zinc-900 dark:text-zinc-100 pb-20">
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-10">

              {/* Back Action */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Link href="/firms" className="inline-flex items-center gap-2 group text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  <div className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900 transition-all">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Abort Modification</span>
                </Link>
              </motion.div>

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Heading
                  title="Modify Commercial Identity"
                  description={`Refining branding and fiscal parameters for ${firm.name}`}
                />
              </motion.div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left: Core & Fiscal */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Part 1: Identity Core */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-8 relative")}
                  >
                    <div className="flex items-center gap-4 mb-10">
                      <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
                        <Pencil className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Node_Segment_01</span>
                        <span className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none mt-1">Identity Core</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Institution Label</Label>
                        <div className="relative group">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. HARMAIN TRADERS GLOBAL"
                            className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-black focus:ring-orange-500/20 transition-all text-sm pl-12 uppercase"
                            required
                          />
                        </div>
                        {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mt-1">{errors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Registry Code</Label>
                        <div className="relative group">
                          <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            placeholder="[ID-ALPHA-4]"
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-xs pl-10 uppercase tracking-widest font-mono"
                          />
                        </div>
                        {errors.code && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mt-1">{errors.code}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Sync Date</Label>
                        <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold text-[10px] uppercase tracking-widest px-10 relative justify-start hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                            >
                              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                              {date ? date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Select Pulse Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl" align="start">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={(val) => { setDate(val); setOpenCalendar(false); }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Business Directive</Label>
                        <div className="relative group">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="business"
                            value={form.business}
                            onChange={handleChange}
                            placeholder="e.g. LOGISTICS & GLOBAL TRADING HUB"
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-xs pl-10 italic"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Operator Designation</Label>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="owner"
                            value={form.owner}
                            onChange={handleChange}
                            placeholder="Director or Primary Stakeholder"
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Part 2: Fiscal Parameters */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn(PREMIUM_ROUNDING, "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-8 relative")}
                  >
                    <div className="flex items-center gap-4 mb-10">
                      <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Node_Segment_02</span>
                        <span className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none mt-1">Fiscal Parameters</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Sales Tax ID (PSTR)</Label>
                        <div className="relative group">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="saletax"
                            value={form.saletax}
                            onChange={handleChange}
                            placeholder="TAX-0000000-0"
                            className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-black focus:ring-orange-500/20 transition-all text-sm pl-12 tabular-nums tracking-widest font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">N.T.N Designation</Label>
                        <div className="relative group">
                          <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="ntn"
                            value={form.ntn}
                            onChange={handleChange}
                            placeholder="NTN-0000000-0"
                            className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-black focus:ring-orange-500/20 transition-all text-sm pl-12 tabular-nums tracking-widest font-mono"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Base Station (Address 1)</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            name="address1"
                            value={form.address1}
                            onChange={handleChange}
                            placeholder="Primary headquarters location"
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Satellite node (Address 2)</Label>
                        <Input
                          name="address2"
                          value={form.address2}
                          onChange={handleChange}
                          placeholder="Secondary branch node"
                          className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-xs pl-4"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 mb-2 block">Satellite node (Address 3)</Label>
                        <Input
                          name="address3"
                          value={form.address3}
                          onChange={handleChange}
                          placeholder="Tertiary storage node"
                          className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-xs pl-4"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right: Assets & Connectivity */}
                <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">

                  {/* Branding Asset */}
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
                  </motion.div>

                  {/* Connectivity & Logic */}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 group">
                          <Label className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 group-focus-within:text-orange-500">Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 transition-colors group-focus-within:text-orange-500" />
                            <Input
                              name="phone"
                              value={form.phone}
                              onChange={handleChange}
                              className="bg-transparent border-none border-b border-zinc-800 rounded-none pl-8 pr-0 text-white text-xs font-bold h-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-all placeholder:text-zinc-800 tabular-nums"
                            />
                          </div>
                        </div>
                        <div className="space-y-2 group">
                          <Label className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 group-focus-within:text-orange-500">Fax Node</Label>
                          <Input
                            name="fax"
                            value={form.fax}
                            onChange={handleChange}
                            className="bg-transparent border-none border-b border-zinc-800 rounded-none pl-0 pr-0 text-white text-xs font-bold h-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-all placeholder:text-zinc-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <Label className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 group-focus-within:text-orange-500">Mailbox</Label>
                        <div className="relative">
                          <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 transition-colors group-focus-within:text-orange-500" />
                          <Input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            className="bg-transparent border-none border-b border-zinc-800 rounded-none pl-8 pr-0 text-white text-sm font-bold h-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-all placeholder:text-zinc-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <Label className="text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 group-focus-within:text-orange-500 transition-colors">Digital Portal</Label>
                        <div className="relative">
                          <Globe className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 transition-colors group-focus-within:text-orange-500" />
                          <Input
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            className="bg-transparent border-none border-b border-zinc-800 rounded-none pl-8 pr-0 text-white text-xs font-bold h-10 focus-visible:ring-0 focus-visible:border-orange-500 transition-all placeholder:text-zinc-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 pt-4 border-t border-zinc-800">
                      <div className="flex items-center justify-between group">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-100 italic">Invoice Protocol</span>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Auto-generate hardcopies</span>
                        </div>
                        <Checkbox
                          checked={form.printinvoice}
                          onCheckedChange={(val) => setForm({ ...form, printinvoice: !!val })}
                          className="h-5 w-5 rounded-lg border-2 border-zinc-800 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </div>
                      <div className="flex items-center justify-between group">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-100 italic">Primary Terminal</span>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Set as main identity node</span>
                        </div>
                        <Checkbox
                          checked={form.defult}
                          onCheckedChange={(val) => setForm({ ...form, defult: !!val })}
                          className="h-5 w-5 rounded-lg border-2 border-zinc-800 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </div>
                      <div className="flex items-center justify-between group">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-100 italic">Active Pulse</span>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">System availability status</span>
                        </div>
                        <Checkbox
                          checked={form.status}
                          onCheckedChange={(val) => setForm({ ...form, status: !!val })}
                          className="h-5 w-5 rounded-lg border-2 border-zinc-800 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="pt-6 flex flex-col gap-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 relative group overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          {isSubmitting ? "COMMITING..." : "UPDATE IDENTITY PARAMETERS"}
                          {!isSubmitting && <Wand2 className="h-4 w-4 group-hover:rotate-12 transition-transform duration-500" />}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </Button>

                      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
                        <span>Auth: Verified</span>
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
