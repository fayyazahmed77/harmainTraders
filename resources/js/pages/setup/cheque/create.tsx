"use client";

import React, { useState, useMemo } from "react";
import axios from "axios";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, Building2, Hash, Layers, FileText, CheckCircle2, AlertCircle, Sparkles, Wand2, Terminal, AlertTriangle, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BreadcrumbItem } from "@/types";
import { router, usePage, Head, useForm } from "@inertiajs/react";
import { useNavigationGuard } from "@/hooks/use-navigation-guard";
import { DirtyStateDialog } from "@/components/dirty-state-dialog";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Financials", href: "/cheque" },
  { title: "Add Cheque Book", href: "/cheque/create" },
];

interface Bank {
  id: number;
  name: string;
}

const PREMIUM_ROUNDING = "rounded-2xl";

export default function ChequeGenerationPage() {
  const { banks } = usePage<any>().props as unknown as { banks: Bank[] };

  useToastFromQuery();

  const [open, setOpen] = useState(false);
  const [generatedCheques, setGeneratedCheques] = useState<string[]>([]);
  const [duplicateCheques, setDuplicateCheques] = useState<string[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState<boolean>(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string>("");

  const { data: form, setData: setForm, post, processing: isSubmitting, errors, isDirty } = useForm({
    entry_date: new Date() as Date | undefined,
    bank_id: "",
    voucher_code: "",
    prefix: "",
    cheque_from: "",
    cheque_to: "",
    remarks: "",
    cheques: [] as string[],
  });

  const { showConfirm, confirmNavigation, cancelNavigation } = useNavigationGuard(isDirty);

  // ✅ Check duplicate cheques on bank or prefix change if generated
  const checkDuplicateNumbers = async (bankId: string, cheques: string[], prefixVal: string) => {
    if (!bankId || cheques.length === 0) return;
    setCheckingDuplicates(true);
    try {
      const res = await axios.post('/cheque/check-duplicates', {
        bank_id: bankId,
        cheques: cheques,
        prefix: prefixVal,
      });
      const existing = res.data.existing_cheques || [];
      setDuplicateCheques(existing);
      setDuplicateMessage(res.data.message || "");

      if (res.data.exists) {
        toast.error("Cheque Numbers Already Exist!", {
          description: res.data.message,
          duration: 7000,
        });
      }
      return res.data;
    } catch (err) {
      console.error("Duplicate check failed", err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // ✅ Generate cheque numbers
  const handleGenerate = async () => {
    if (!form.cheque_from || !form.cheque_to)
      return toast.error("Missing Numbers", { description: "Please enter both start and end numbers." });

    const from = parseInt(form.cheque_from);
    const to = parseInt(form.cheque_to);

    if (isNaN(from) || isNaN(to) || from > to) {
      return toast.error("Invalid Numbers", { description: "End number must be greater than start number." });
    }

    if (to - from > 100) {
      return toast.warning("Large Batch", { description: "Adding more than 100 cheques might be slow." });
    }

    const cheques: string[] = [];
    for (let i = from; i <= to; i++) {
      cheques.push(i.toString().padStart(3, "0"));
    }
    setGeneratedCheques(cheques);
    setForm("cheques", cheques);

    if (form.bank_id) {
      const res = await checkDuplicateNumbers(form.bank_id, cheques, form.prefix);
      if (res && !res.exists) {
        toast.success(`${cheques.length} Cheques Previewed — All Available`, { icon: <Sparkles className="h-4 w-4" /> });
      }
    } else {
      toast.success(`${cheques.length} Cheques Previewed`, { icon: <Sparkles className="h-4 w-4" /> });
    }
  };

  // ✅ Handle Bank Selection Change
  const handleBankChange = (bankId: string) => {
    setForm("bank_id", bankId);
    if (generatedCheques.length > 0) {
      checkDuplicateNumbers(bankId, generatedCheques, form.prefix);
    }
  };

  // ✅ Submit data to backend
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bank_id) return toast.error("Please Select a Bank");
    if (generatedCheques.length === 0) return toast.error("No Cheques to Add");
    if (duplicateCheques.length > 0) {
      return toast.error("Cannot Add Cheque Book", {
        description: duplicateMessage || "Cheque book numbers already exist for this bank. Please use a different sequence.",
        duration: 7000,
      });
    }

    post("/cheque", {
      onSuccess: () => toast.success("Cheque Book Added Successfully"),
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error("Failed to Add Cheque Book", {
          description: typeof firstErr === 'string' ? firstErr : "Validation failed.",
          duration: 7000,
        });
      },
    });
  };

  const selectedBankName = useMemo(() => {
    return banks.find(b => b.id.toString() === form.bank_id)?.name || "Not Selected";
  }, [form.bank_id, banks]);

  return (
    <SidebarProvider>
      <Head title="Add Cheque Book" />
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
        <SiteHeader breadcrumbs={breadcrumbs} />

        <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between"
            >
              <Heading
                title="Add Cheque Book"
                description="Add a new cheque book to your system"
              />
              <div className="hidden md:flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Safe Entry</span>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Form Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-8 space-y-6"
              >
                <Card className={cn(PREMIUM_ROUNDING, "border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl overflow-hidden")}>
                  <div className="p-1 bg-gradient-to-r from-orange-500/20 via-transparent to-transparent" />
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-orange-500" />
                      Cheque Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Entry Date */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Date</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-between text-left font-bold rounded-xl h-12 border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all",
                                !form.entry_date && "text-muted-foreground"
                              )}
                            >
                              {form.entry_date
                                ? form.entry_date.toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                                : "Select date"}
                              <CalendarIcon className="h-4 w-4 opacity-40" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-200 dark:border-zinc-800" align="start">
                            <Calendar
                              mode="single"
                              selected={form.entry_date}
                              onSelect={(value) => {
                                setForm("entry_date", value);
                                setOpen(false);
                              }}
                              className="rounded-2xl shadow-2xl"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Bank Identity */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Bank</Label>
                        <Select value={form.bank_id} onValueChange={handleBankChange}>
                          <SelectTrigger className={cn("h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all w-full", errors.bank_id && "border-rose-500 ring-2 ring-rose-500/20")}>
                            <SelectValue placeholder="Select Bank..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id.toString()} className="font-bold rounded-lg m-1">
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.bank_id && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.bank_id}</p>}
                      </div>

                      {/* Voucher No */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Voucher No</Label>
                        <div className="relative">
                          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input
                            value={form.voucher_code}
                            onChange={(e) => setForm("voucher_code", e.target.value)}
                            placeholder="SYS-VOUCH-XXX"
                            className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-mono text-sm uppercase focus:ring-orange-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Asset Prefix */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Cheque Prefix</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input
                            value={form.prefix}
                            onChange={(e) => setForm("prefix", e.target.value)}
                            placeholder="D-"
                            className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-mono text-sm uppercase focus:ring-orange-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Sequence Control */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Start No</Label>
                          <Input
                            value={form.cheque_from}
                            onChange={(e) => setForm("cheque_from", e.target.value)}
                            placeholder="001"
                            className={cn("h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-mono text-sm focus:ring-orange-500/20 transition-all", errors.cheque_from && "border-rose-500 ring-2 ring-rose-500/20")}
                          />
                          {errors.cheque_from && <p className="text-[9px] font-bold text-rose-500 uppercase mt-1 leading-tight">{errors.cheque_from}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">End No</Label>
                          <Input
                            value={form.cheque_to}
                            onChange={(e) => setForm("cheque_to", e.target.value)}
                            placeholder="050"
                            className={cn("h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-mono text-sm focus:ring-orange-500/20 transition-all", errors.cheque_to && "border-rose-500 ring-2 ring-rose-500/20")}
                          />
                          {errors.cheque_to && <p className="text-[9px] font-bold text-rose-500 uppercase mt-1 leading-tight">{errors.cheque_to}</p>}
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Remarks</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input
                            value={form.remarks}
                            onChange={(e) => setForm("remarks", e.target.value)}
                            placeholder="Add any notes here..."
                            className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 text-sm focus:ring-orange-500/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerate}
                        disabled={checkingDuplicates}
                        className="w-full md:w-auto px-8 rounded-xl h-12 border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 group transition-all"
                      >
                        {checkingDuplicates ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                            Checking...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-orange-500 group-hover:rotate-12 transition-transform" />
                            Preview Cheques
                          </div>
                        )}
                      </Button>

                      <Button
                        type="submit"
                        disabled={isSubmitting || duplicateCheques.length > 0}
                        className={cn(
                          "w-full md:w-auto px-12 rounded-xl h-12 text-white font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50",
                          duplicateCheques.length > 0
                            ? "bg-rose-600 hover:bg-rose-700 cursor-not-allowed"
                            : "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:shadow-xl hover:shadow-orange-500/20"
                        )}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 border-2 border-t-transparent border-zinc-500 animate-spin rounded-full" />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Save Cheque Book
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Section */}
                <AnimatePresence>
                  {generatedCheques.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4"
                    >
                      {/* Duplicate Alert Banner */}
                      {duplicateCheques.length > 0 && (
                        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between gap-3 shadow-lg shadow-rose-500/5 animate-shake">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
                            <div>
                              <div className="text-[11px] font-black uppercase tracking-wider">Duplicate Cheques Detected</div>
                              <div className="text-[11px] font-medium opacity-90">{duplicateMessage}</div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest shrink-0">
                            {duplicateCheques.length} DUPLICATE(S)
                          </span>
                        </div>
                      )}

                      <Card className={cn(PREMIUM_ROUNDING, "border-dashed bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl overflow-hidden", duplicateCheques.length > 0 ? "border-rose-500/50" : "border-zinc-200 dark:border-zinc-800")}>
                        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-orange-500" />
                              Cheque Preview ({generatedCheques.length} leaf instruments)
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-3">
                            {duplicateCheques.length > 0 ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase tracking-widest">
                                <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                                Sequence Conflict Found
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                All Instruments Validated
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                          {/* Realistic Cheque Leaf Display Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {generatedCheques.map((num, i) => {
                              const fullNum = (form.prefix || '') + num;
                              const isDup = duplicateCheques.includes(num) || duplicateCheques.includes(fullNum);
                              return (
                                <motion.div
                                  key={num}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                                  className={cn(
                                    "p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-md hover:shadow-xl",
                                    isDup
                                      ? "bg-gradient-to-br from-rose-50/90 via-white to-rose-100/50 dark:from-rose-950/40 dark:to-zinc-900 border-rose-500 ring-2 ring-rose-500/20"
                                      : "bg-gradient-to-br from-amber-500/[0.03] via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 border-zinc-200/80 dark:border-zinc-800 hover:border-orange-500/40"
                                  )}
                                >
                                  {/* Gold Security Line Top Bar */}
                                  <div className={cn("absolute top-0 left-0 right-0 h-1", isDup ? "bg-rose-500" : "bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400")} />

                                  {/* Cheque Header: Bank Logo + Title + Date */}
                                  <div className="flex justify-between items-start gap-2 mb-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black text-xs">
                                        {selectedBankName.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
                                          {selectedBankName}
                                        </div>
                                        <div className="text-[9px] font-mono font-semibold text-zinc-400 mt-0.5">
                                          PARKWAY BRANCH · MAIN ACCOUNT
                                        </div>
                                      </div>
                                    </div>

                                    {/* Date Stamp Field */}
                                    <div className="text-right border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 bg-white/80 dark:bg-zinc-950/80">
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 block leading-tight">DATE</span>
                                      <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                        {form.entry_date ? form.entry_date.toLocaleDateString("en-GB") : "DD/MM/YYYY"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Cheque Body: Pay Line & PKR Amount Box */}
                                  <div className="space-y-2.5 my-3">
                                    <div className="flex items-center gap-2 text-[10px] font-mono">
                                      <span className="font-bold text-zinc-400 uppercase tracking-widest text-[9px]">PAY</span>
                                      <div className="flex-1 border-b border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 italic text-[10px] px-2">
                                        ________________________ OR ORDER
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                                        <span className="font-bold uppercase tracking-widest text-[9px]">RUPEES</span>
                                        <span className="italic text-[10px]">________________________</span>
                                      </div>

                                      {/* Amount Box */}
                                      <div className={cn(
                                        "px-3 py-1.5 rounded-lg border font-mono font-black text-xs shadow-inner flex items-center gap-1 min-w-[120px] justify-center",
                                        isDup
                                          ? "bg-rose-100/50 dark:bg-rose-950/60 border-rose-300 text-rose-600"
                                          : "bg-amber-500/[0.08] dark:bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                                      )}>
                                        <span className="text-[9px] opacity-70">PKR</span>
                                        <span>*** {form.prefix || ''}{num} ***</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Cheque Footer: Signature & Status Stamp */}
                                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-end justify-between">
                                    {/* Status Stamp */}
                                    {isDup ? (
                                      <div className="px-2.5 py-1 rounded-md bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest border border-rose-600 shadow-sm transform -rotate-2">
                                        ❌ DUPLICATE - EXISTS
                                      </div>
                                    ) : (
                                      <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                        ✓ UNUSED / AVAILABLE
                                      </div>
                                    )}

                                    <div className="text-right">
                                      <div className="w-28 border-b border-zinc-300 dark:border-zinc-700 mb-1" />
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 block">AUTHORIZED SIGNATORY</span>
                                    </div>
                                  </div>

                                  {/* Bottom MICR Strip */}
                                  <div className="mt-3 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-center font-mono text-[11px] font-black tracking-[0.25em] text-zinc-500 dark:text-zinc-400 select-none bg-zinc-100/50 dark:bg-zinc-900/50 -mx-5 -mb-5 py-1.5">
                                    ⑈ {form.prefix || ''}{num} ⑈ {form.bank_id ? form.bank_id.padStart(3, '0') : '000'} ⑈ HARMAIN-ERP ⑈
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Sidebar Context / Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-4 space-y-6"
              >
                <Card className={cn(PREMIUM_ROUNDING, "border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white shadow-2xl relative overflow-hidden")}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Quick Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 relative">
                    {[
                      { label: "Selected Bank", value: selectedBankName, icon: Building2 },
                      { label: "Type", value: "CHEQUE-BOOK", icon: Hash },
                      { label: "Total Cheques", value: generatedCheques.length > 0 ? `${generatedCheques.length} CHEQUES` : "EMPTY", icon: Sparkles },
                      { label: "Entry Method", value: "Manual Entry", icon: Terminal },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 transition-colors group-hover:bg-orange-500/20 group-hover:border-orange-500/50">
                          <item.icon className="h-5 w-5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">{item.label}</span>
                          <span className="text-xs font-black tracking-tighter uppercase">{item.value}</span>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 mt-4 border-t border-white/10">
                      <p className="text-[9px] text-zinc-500 italic leading-relaxed uppercase tracking-tighter">
                        "I understand that adding these cheques will register them as 'UNUSED' and they will be available to use immediately."
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(PREMIUM_ROUNDING, "border-orange-500/20 bg-orange-500/5 backdrop-blur-sm")}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Last Checks</h4>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {[
                        "Verify start/end sequence with physical book",
                        "Ensure correct prefix application",
                        "Double-check bank entity assignment"
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-zinc-500 uppercase leading-tight">
                          <span className="text-orange-500">0{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </form>
          </div>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; border: 1px solid transparent; background-clip: padding-box; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
        `}</style>
        <DirtyStateDialog
          isOpen={showConfirm}
          onClose={cancelNavigation}
          onConfirm={confirmNavigation}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
