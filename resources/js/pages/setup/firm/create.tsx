"use client";

import * as React from "react";
import { useState } from "react";
import { router, usePage } from "@inertiajs/react"; // ✅ FIX: use router for form submission
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Firm", href: "/firm" },
  { title: "Create", href: "/firm/create" },
];

export default function FirmCreatePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const { errors } = usePage().props as any;

  // ✅ FIX: Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    business: "",
    address1: "",
    address2: "",
    address3: "",
    phone: "",
    fax: "",
    owner: "",
    email: "",
    website: "",
    saletax: "",
    ntn: "",
    printinvoice: false,
    defult: false,
    status: true,
    logo: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setFormData({ ...formData, logo: file });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Send to Laravel via Inertia
    router.post("/firms", {
      ...formData,
      date: date
        ? date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "",
    });
  };

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
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Identity Generation</span>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground leading-[0.9] mb-2">
                    Create <span className="text-orange-500">Firm</span>
                  </h1>
                  <p className="text-muted-foreground text-sm lg:text-base font-medium max-w-lg leading-relaxed">
                    Initialize a new commercial entity into the central identity bank with multi-pulse verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="font-bold text-xs uppercase tracking-widest"
                  onClick={() => router.visit("/firms")}
                >
                  Abort
                </Button>
                <div className="h-8 w-px bg-border" />
                <Button
                  onClick={handleSubmit}
                  className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 transition-all active:scale-95 group"
                >
                  Commit Pulse
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Core Identity */}
            <div className="lg:col-span-8 space-y-10">
              <section className="p-8 bg-card border border-border/60 rounded-sm shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
                <div className="flex items-center gap-2 mb-8">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Primary Pulse Fields</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Pulse Timestamp</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-between text-left font-mono italic tracking-tighter bg-muted/20 border-border/40 rounded-sm hover:border-orange-500/40 transition-colors",
                            !date && "text-muted-foreground"
                          )}
                        >
                          {date ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "EXEC-TIME"}
                          <CalendarIcon className="h-4 w-4 opacity-40 text-orange-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-sm" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(value) => { if (value) setDate(value); setOpen(false); }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Firm Access Code</Label>
                    <Input
                      name="code"
                      placeholder="[CODE-ALPHA-4]"
                      value={formData.code}
                      onChange={handleChange}
                      className="h-12 bg-muted/20 border-border/40 font-mono italic tracking-tighter rounded-sm focus:ring-1 focus:ring-orange-500/50"
                    />
                    {errors.code && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-widest italic animate-pulse">{errors.code}</p>}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Commercial Identity Title</Label>
                    <Input
                      name="name"
                      placeholder="ENTER FULL LEGAL ENTITY NAME"
                      value={formData.name}
                      onChange={handleChange}
                      className="h-14 bg-muted/20 border-border/40 font-black tracking-tight text-lg rounded-sm focus:ring-1 focus:ring-orange-500/50 uppercase"
                    />
                    {errors.name && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-widest italic animate-pulse">{errors.name}</p>}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Business Core Directive</Label>
                    <Input
                      name="business"
                      placeholder="e.g. TEXTILE LOGISTICS / GLOBAL TRADE"
                      value={formData.business}
                      onChange={handleChange}
                      className="h-12 bg-muted/20 border-border/40 font-bold tracking-tight rounded-sm focus:ring-1 focus:ring-orange-500/50 italic opacity-80"
                    />
                  </div>
                </div>
              </section>

              <section className="p-8 bg-card border border-border/60 rounded-sm shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-8">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Geographic & Pulse Auth</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {["address1", "address2", "address3"].map((addr, i) => (
                    <div key={addr} className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Location Vector {i + 1}</Label>
                      <Input
                        name={addr}
                        placeholder={`VECTOR-COORDINATE-${i + 1}`}
                        value={(formData as any)[addr]}
                        onChange={handleChange}
                        className="h-11 bg-muted/10 border-border/40 font-medium rounded-sm focus:ring-1 focus:ring-orange-500/50"
                      />
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Owner/Operator Pulse</Label>
                    <Input
                      name="owner"
                      placeholder="HEAD PULSE NAME"
                      value={formData.owner}
                      onChange={handleChange}
                      className="h-11 bg-muted/10 border-border/40 font-bold uppercase rounded-sm focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Pulse Telephone</Label>
                    <Input
                      name="phone"
                      placeholder="+XX XXX XXXXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className="h-11 bg-muted/10 border-border/40 font-mono tracking-tighter rounded-sm focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Meta & Assets */}
            <div className="lg:col-span-4 space-y-8">
              <section className="p-8 bg-muted/40 border border-border/60 rounded-sm shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Brand Identity Asset</h2>
                </div>

                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-sm transition-all duration-300 bg-card",
                    isDragging ? "border-orange-500 bg-orange-500/5 scale-[1.02]" : "border-border/60 hover:border-orange-500/40 shadow-inner",
                    formData.logo && "border-solid border-orange-500/20"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {formData.logo ? (
                    <div className="relative group w-32 h-32 overflow-hidden rounded-sm border-2 border-orange-500/20 shadow-2xl">
                      <img
                        src={URL.createObjectURL(formData.logo)}
                        alt="Logo preview"
                        className="w-full h-full object-contain bg-white p-2"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeLogo}
                          className="rounded-sm font-black uppercase tracking-widest text-[10px]"
                        >
                          Purge Asset
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center">
                      <Upload className={cn("w-8 h-8 mb-4 transition-all", isDragging ? "text-orange-500 translate-y-[-4px]" : "text-muted-foreground/30")} />
                      <p className="text-[11px] font-black text-foreground uppercase tracking-widest">
                        Upload Identity Asset
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 mt-2 uppercase tracking-tight leading-relaxed">
                        Drag identity logo or click to select.<br />SVGs preferred for pulse precision.
                      </p>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </section>

              <section className="p-8 bg-card border border-border/60 rounded-sm shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-4 bg-orange-500 rounded-full" />
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Network Parameters</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Digital Mailbox</Label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="operator@firm.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-muted/10 border-border/40 font-medium rounded-sm focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Global Web Node</Label>
                    <Input
                      name="website"
                      placeholder="https://firm.com"
                      value={formData.website}
                      onChange={handleChange}
                      className="bg-muted/10 border-border/40 font-medium rounded-sm focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Sales Tax Pulse</Label>
                      <Input
                        name="saletax"
                        placeholder="TAX-ID"
                        value={formData.saletax}
                        onChange={handleChange}
                        className="h-10 bg-muted/10 border-border/40 font-mono text-xs rounded-sm focus:ring-1 focus:ring-orange-500/50 tracking-tighter"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">N.T.N Pulse</Label>
                      <Input
                        name="ntn"
                        placeholder="NTN-ID"
                        value={formData.ntn}
                        onChange={handleChange}
                        className="h-10 bg-muted/10 border-border/40 font-mono text-xs rounded-sm focus:ring-1 focus:ring-orange-500/50 tracking-tighter"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="p-8 bg-card border border-border/60 rounded-sm shadow-sm space-y-8">
                <div className="space-y-6">
                  {[
                    { id: "invoice", name: "printinvoice", label: "Invoice Protocol", sub: "Auto-generate hardcopies" },
                    { id: "default", name: "defult", label: "Primary Terminal", sub: "Set as main identity" },
                    { id: "status", name: "status", label: "Active Pulse", sub: "System availability status" }
                  ].map((item) => (
                    <div key={item.id} className="flex items-start justify-between group">
                      <div className="space-y-1">
                        <Label htmlFor={item.id} className="text-xs font-black uppercase tracking-widest text-foreground/90 leading-none">
                          {item.label}
                        </Label>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{item.sub}</p>
                      </div>
                      <Checkbox
                        id={item.id}
                        name={item.name}
                        checked={(formData as any)[item.name]}
                        onCheckedChange={(checked) => setFormData({ ...formData, [item.name]: !!checked })}
                        className="h-5 w-5 rounded-sm border-2 border-border/60 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
