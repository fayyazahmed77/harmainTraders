"use client";

import React, { useState, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, Building2, Hash, Layers, FileText, CheckCircle2, AlertCircle, Sparkles, Wand2, Terminal } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BreadcrumbItem } from "@/types";
import { router, usePage, Head } from "@inertiajs/react";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Financials", href: "/cheque" },
  { title: "Provisioning", href: "/cheque/create" },
];

interface Bank {
  id: number;
  name: string;
}

const PREMIUM_ROUNDING = "rounded-2xl";

export default function ChequeGenerationPage() {
  // ✅ Page props from Laravel
  const { banks } = usePage().props as unknown as { banks: Bank[] };

  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: {
      user: any;
      permissions: string[];
    };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth?.permissions || [];
  const errors = pageProps.errors || {};

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [bankId, setBankId] = useState("");
  const [chequeFrom, setChequeFrom] = useState("");
  const [voucherno, setVoucherno] = useState("");
  const [prefix, setPrefix] = useState("");
  const [chequeTo, setChequeTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [generatedCheques, setGeneratedCheques] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Generate cheque numbers
  const handleGenerate = () => {
    if (!chequeFrom || !chequeTo)
      return toast.error("Missing Sequence Parameters", { description: "Both start and end values are required." });

    const from = parseInt(chequeFrom);
    const to = parseInt(chequeTo);

    if (isNaN(from) || isNaN(to) || from > to) {
      return toast.error("Invalid Sequence Detected", { description: "End value must be greater than start value." });
    }

    if (to - from > 100) {
      return toast.warning("Large Batch Detected", { description: "Generating more than 100 cheques might affect performance." });
    }

    const cheques: string[] = [];
    for (let i = from; i <= to; i++) {
      cheques.push(i.toString().padStart(3, "0"));
    }
    setGeneratedCheques(cheques);
    toast.success(`${cheques.length} Assets Previewed`, { icon: <Sparkles className="h-4 w-4" /> });
  };

  // ✅ Submit data to backend
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankId) return toast.error("Bank Identity Required");
    if (generatedCheques.length === 0) return toast.error("Provisioning List Empty");

    setIsProcessing(true);
    router.post("/cheque", {
      bank_id: bankId,
      entry_date: date,
      remarks,
      voucher_code: voucherno,
      prefix,
      cheques: generatedCheques,
    }, {
      onFinish: () => setIsProcessing(false),
      onSuccess: () => toast.success("Assets Successfully Inducted"),
      onError: () => toast.error("Provisioning Protocol Failed")
    });
  };

  const selectedBankName = useMemo(() => {
    return banks.find(b => b.id.toString() === bankId)?.name || "Not Selected";
  }, [bankId, banks]);

  return (
    <SidebarProvider>
      <Head title="Asset Provisioning | Cheque Induction" />
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
                title="Asset Provisioning"
                description="Initialize new financial instruments into the secure system registry"
              />
              <div className="hidden md:flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Secure Induction Protocol</span>
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
                      Configuration Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Entry Date */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Entry Timestamp</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-between text-left font-bold rounded-xl h-12 border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all",
                                !date && "text-muted-foreground"
                              )}
                            >
                              {date
                                ? date.toLocaleDateString("en-GB", {
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
                              selected={date}
                              onSelect={(value) => {
                                setDate(value);
                                setOpen(false);
                              }}
                              className="rounded-2xl shadow-2xl"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Bank Identity */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Bank Entity</Label>
                        <Select value={bankId} onValueChange={setBankId}>
                          <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all w-full">
                            <SelectValue placeholder="Identify Bank..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id.toString()} className="font-bold rounded-lg m-1">
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.bank_id && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.bank_id}</p>}
                      </div>

                      {/* Voucher Signature */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Voucher Signature</Label>
                        <div className="relative">
                          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input
                            value={voucherno}
                            onChange={(e) => setVoucherno(e.target.value)}
                            placeholder="SYS-VOUCH-XXX"
                            className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-mono text-sm uppercase focus:ring-orange-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Asset Prefix */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Serial Prefix</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            placeholder="D-"
                            className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-mono text-sm uppercase focus:ring-orange-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Sequence Control */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Start Sequence</Label>
                          <Input
                            value={chequeFrom}
                            onChange={(e) => setChequeFrom(e.target.value)}
                            placeholder="001"
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-mono text-sm focus:ring-orange-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">End Sequence</Label>
                          <Input
                            value={chequeTo}
                            onChange={(e) => setChequeTo(e.target.value)}
                            placeholder="050"
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-mono text-sm focus:ring-orange-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Remarks / Metadata */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Operational Metadata</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Asset induction justification..."
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
                        className="w-full md:w-auto px-8 rounded-xl h-12 border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 group transition-all"
                      >
                        <Wand2 className="mr-2 h-4 w-4 text-orange-500 group-hover:rotate-12 transition-transform" />
                        Review Sequence
                      </Button>

                      <Button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full md:w-auto px-12 rounded-xl h-12 bg-zinc-900 border-orange-500/20 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 border-2 border-t-transparent border-zinc-500 animate-spin rounded-full" />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Activate Induction
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
                      className="overflow-hidden"
                    >
                      <Card className={cn(PREMIUM_ROUNDING, "border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl")}>
                        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                              Sequence Visualization ({generatedCheques.length} nodes)
                            </CardTitle>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                              Validated
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2">
                            {generatedCheques.map((num, i) => (
                              <motion.div
                                key={num}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: Math.min(i * 0.01, 0.5) }}
                                className="aspect-video flex items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-[10px] font-mono font-black text-zinc-400 hover:border-orange-500/30 hover:text-orange-500 transition-all cursor-crosshair group shadow-sm"
                              >
                                <span className="opacity-40 group-hover:opacity-100">{prefix}</span>
                                <span className="text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500">{num}</span>
                              </motion.div>
                            ))}
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
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Summary Manifest</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 relative">
                    {[
                      { label: "Target Entity", value: selectedBankName, icon: Building2 },
                      { label: "Provision Type", value: "CHEQUE-BOOK", icon: Hash },
                      { label: "Asset Volume", value: generatedCheques.length > 0 ? `${generatedCheques.length} INSTRUMENTS` : "EMPTY", icon: Sparkles },
                      { label: "Protocol", value: "MANUAL-INDUCTION", icon: Terminal },
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
                        "I understand that generating these cheque assets will register them as 'UNUSED' in the central financial database and they will be available for payment allocation immediately."
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(PREMIUM_ROUNDING, "border-orange-500/20 bg-orange-500/5 backdrop-blur-sm")}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Compliance Protocol</h4>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
