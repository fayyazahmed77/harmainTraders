import React from "react";
import { 
  Plus,
  Trash2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Account {
  id: number;
  title: string;
  account_type?: { name: string };
}

interface SplitPayment {
  id: number | string;
  payment_account_id: string;
  amount: number;
  payment_method: string;
  cheque_no?: string;
  cheque_date?: string;
  clear_date?: string;
  voucher_no?: string;
  cheque_id?: string;
  customer_cheque_id?: string;
}

interface PurchasePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totals: {
    net: number;
    appliedAdvance?: number;
    [key: string]: any;
  };
  splits: SplitPayment[];
  paymentAccounts: Account[];
  addSplitRow: () => void;
  removeSplitRow: (id: number | string) => void;
  updateSplitRow: (id: number | string, field: string, value: any) => void;
  onCommit: () => void;
  invoiceNo: string;
  supplierName: string;
  previousBalance?: number;
  customerCheques?: any[];
  availableCheques?: any[];
  extraDiscount?: number;
}

export const PurchasePaymentDialog: React.FC<PurchasePaymentDialogProps> = ({
  open,
  onOpenChange,
  totals,
  splits,
  paymentAccounts,
  addSplitRow,
  removeSplitRow,
  updateSplitRow,
  onCommit,
  invoiceNo,
  supplierName,
  previousBalance = 0,
  customerCheques = [],
  availableCheques = [],
  extraDiscount = 0
}) => {
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  const totalPaid = splits.reduce((acc, s) => acc + toNumber(s.amount), 0);
  const appliedAdvance = toNumber(totals.appliedAdvance);
  const netSettlement = Math.max(0, totals.net - extraDiscount - appliedAdvance);
  const totalPayable = netSettlement + Math.max(0, previousBalance);
  const remaining = totalPayable - totalPaid;
  const isFullyPaid = Math.abs(remaining) < 0.01;
  const isOverpaid = remaining < -0.01;

  const statusConfig = isFullyPaid
    ? { label: "Fully Settled", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", dot: "bg-emerald-500" }
    : isOverpaid
    ? { label: "Overpaid", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10", border: "border-sky-200 dark:border-sky-500/20", dot: "bg-sky-500" }
    : { label: "Pending", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", dot: "bg-amber-500" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] md:max-w-[80vw] lg:max-w-[70vw] w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-0 overflow-hidden rounded-xl">

        {/* Compact Header */}
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-5 overflow-hidden">
          {/* Subtle orange accent line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-500 via-orange-400 to-red-500" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-black uppercase tracking-wider text-white leading-none">
                  Supplier Settlement
                </DialogTitle>
                <DialogDescription className="text-[10px] text-zinc-400 font-medium mt-0.5 leading-none">
                  {supplierName} &nbsp;·&nbsp; <span className="font-mono text-zinc-300">{invoiceNo}</span>
                </DialogDescription>
              </div>
            </div>

            {/* Status Badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
              statusConfig.bg, statusConfig.border, statusConfig.color
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusConfig.dot)} />
              {statusConfig.label}
            </div>
          </div>

          {/* Decorative glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Balance Tracker — compact 5-col strip */}
        <div className="grid grid-cols-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 select-none">
          {[
            { label: "Invoice Net", value: `Rs ${totals.net.toLocaleString()}`, color: "text-zinc-700 dark:text-zinc-200" },
            { label: "Advance Used", value: `-Rs ${appliedAdvance.toLocaleString()}`, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Extra Discount", value: `Rs ${extraDiscount.toLocaleString()}`, color: "text-orange-500" },
            { label: "Paying Now", value: `Rs ${totalPaid.toLocaleString()}`, color: "text-sky-600 dark:text-sky-400" },
            {
              label: "Remaining",
              value: `Rs ${remaining.toLocaleString()}`,
              color: remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
            },
          ].map((stat, i) => (
            <div key={i} className={cn("py-3 px-2 flex flex-col items-center justify-center text-center", i < 4 && "border-r border-zinc-100 dark:border-zinc-800")}>
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 leading-none">{stat.label}</span>
              <span className={cn("text-xs font-black font-mono leading-none", stat.color)}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Payment Rows */}
        <div className="px-5 py-4 max-h-[360px] overflow-y-auto space-y-3 bg-white dark:bg-zinc-950 custom-scrollbar">
          {splits.map((split, index) => {
            const acc = paymentAccounts.find(a => a.id.toString() === split.payment_account_id);
            const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
            const isBank = typeLower.includes('bank');
            const isCIH = typeLower.includes('cheque in hand');

            return (
              <div
                key={split.id}
                className="group relative rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-600/40 transition-all duration-200 p-3 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Row index badge */}
                <div className="absolute -top-2 left-3 px-1.5 py-0.5 bg-orange-500 rounded text-[8px] font-black text-white tracking-widest">
                  #{index + 1}
                </div>

                <div className="grid grid-cols-12 gap-2 items-end pt-1">
                  
                  {/* Source Account */}
                  <div className={cn("col-span-12 flex flex-col gap-1", isCIH ? "lg:col-span-3" : isBank ? "lg:col-span-3" : "lg:col-span-7")}>
                    <Label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest">
                      Source Account {split.voucher_no && <span className="text-orange-400/60">({split.voucher_no})</span>}
                    </Label>
                    <Select
                      value={split.payment_account_id}
                      disabled={!!split.voucher_no}
                      onValueChange={(val) => {
                        updateSplitRow(split.id, 'payment_account_id', val);
                        const a = paymentAccounts.find(a => a.id.toString() === val);
                        const tl = (a?.account_type?.name || a?.title || '').toLowerCase();
                        if (tl.includes('bank')) updateSplitRow(split.id, 'payment_method', 'Online');
                        else if (tl.includes('cheque in hand')) updateSplitRow(split.id, 'payment_method', 'Cheque');
                        else updateSplitRow(split.id, 'payment_method', 'Cash');
                        updateSplitRow(split.id, 'customer_cheque_id', '');
                        updateSplitRow(split.id, 'cheque_id', '');
                      }}
                    >
                      <SelectTrigger className={cn(
                        "h-8 text-xs font-bold bg-white dark:bg-zinc-800 w-full border-zinc-200 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-orange-400/30 focus:border-orange-400",
                        split.voucher_no && "opacity-50 cursor-not-allowed"
                      )}>
                        <SelectValue placeholder="Select account…" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-lg">
                        {paymentAccounts.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()} className="text-xs font-semibold py-2">
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CIH: Customer Cheque Selector */}
                  {isCIH && (
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-1 animate-in slide-in-from-right-2">
                      <Label className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Customer Cheque</Label>
                      <Select
                        value={split.customer_cheque_id}
                        onValueChange={(val) => {
                          const chk = customerCheques.find(c => c.id.toString() === val);
                          if (chk) {
                            updateSplitRow(split.id, 'customer_cheque_id', val);
                            updateSplitRow(split.id, 'amount', chk.amount);
                            updateSplitRow(split.id, 'cheque_no', chk.cheque_no);
                            updateSplitRow(split.id, 'cheque_date', chk.cheque_date);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs font-bold bg-white dark:bg-zinc-800 border-amber-200 dark:border-amber-500/30 rounded-md focus:ring-1 focus:ring-amber-400/30">
                          <SelectValue placeholder="Pick a cheque…" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-lg">
                          {customerCheques.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()} className="text-xs font-semibold py-2">
                              #{c.cheque_no} — Rs {Number(c.amount).toLocaleString()} ({c.cheque_date})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Bank: Mode Selector */}
                  {isBank && (
                    <div className="col-span-12 lg:col-span-2 flex flex-col gap-1 animate-in slide-in-from-right-2">
                      <Label className="text-[8px] font-black uppercase text-sky-500 tracking-widest">Mode</Label>
                      <Select
                        value={split.payment_method}
                        onValueChange={(val) => {
                          updateSplitRow(split.id, 'payment_method', val);
                          if (val === 'Online') updateSplitRow(split.id, 'cheque_id', '');
                        }}
                      >
                        <SelectTrigger className="h-8 w-full text-xs font-bold bg-white dark:bg-zinc-800 border-sky-200 dark:border-sky-500/30 rounded-md focus:ring-1 focus:ring-sky-400/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <SelectItem value="Online" className="text-xs font-semibold py-2">Online Transfer</SelectItem>
                          <SelectItem value="Cheque" className="text-xs font-semibold py-2">Bank Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Amount */}
                  <div className={cn(
                    "col-span-12 flex flex-col gap-1",
                    (() => {
                      if (isBank) return split.payment_method === 'Cheque' ? "lg:col-span-2" : "lg:col-span-6";
                      if (isCIH) return "lg:col-span-3";
                      return "lg:col-span-4";
                    })()
                  )}>
                    <Label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400 italic pointer-events-none">Rs</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={split.amount || ""}
                        disabled={!!split.voucher_no || !!split.customer_cheque_id}
                        onChange={(e) => updateSplitRow(split.id, 'amount', e.target.value)}
                        className={cn(
                          "h-8 pl-8 pr-3 text-xs font-black text-right bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-orange-400/30 focus:border-orange-400 font-mono",
                          (split.voucher_no || split.customer_cheque_id) && "opacity-50 cursor-not-allowed"
                        )}
                      />
                    </div>
                  </div>

                  {/* Bank Cheque details */}
                  {isBank && split.payment_method === 'Cheque' && (() => {
                    const bankCheques = availableCheques.filter(c => c.bank_id.toString() === split.payment_account_id);
                    return (
                      <>
                        <div className="col-span-12 lg:col-span-2 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                          <Label className="text-[8px] font-black uppercase text-sky-500 tracking-widest">Cheque No</Label>
                          <Select
                            value={split.cheque_id}
                            onValueChange={(val) => {
                              const chk = bankCheques.find(c => c.id.toString() === val);
                              updateSplitRow(split.id, 'cheque_id', val);
                              if (chk) updateSplitRow(split.id, 'cheque_no', chk.cheque_no);
                            }}
                          >
                            <SelectTrigger className="h-8 w-full text-xs font-bold bg-white dark:bg-zinc-800 border-sky-200 dark:border-sky-500/20 rounded-md">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-lg">
                              {bankCheques.map(c => (
                                <SelectItem key={c.id} value={c.id.toString()} className="text-xs font-semibold py-2">{c.cheque_no}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-12 lg:col-span-2 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                          <Label className="text-[8px] font-black uppercase text-sky-500 tracking-widest">Date</Label>
                          <Input
                            type="date"
                            value={split.cheque_date || ""}
                            onChange={(e) => updateSplitRow(split.id, 'cheque_date', e.target.value)}
                            className="h-8 text-xs font-bold bg-white dark:bg-zinc-800 border-sky-200 dark:border-sky-500/20 rounded-md"
                          />
                        </div>
                      </>
                    );
                  })()}

                  {/* CIH Cheque Date Display */}
                  {isCIH && split.customer_cheque_id && (
                    <div className="col-span-12 lg:col-span-1 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                      <Label className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Date</Label>
                      <div className="h-8 flex bg-amber-50 dark:bg-amber-500/10 px-2 rounded-md border border-amber-200 dark:border-amber-500/20 items-center justify-center">
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 font-mono">{split.cheque_date}</span>
                      </div>
                    </div>
                  )}

                  {/* Delete */}
                  <div className="col-span-12 lg:col-span-1 flex justify-end items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSplitRow(split.id)}
                      disabled={!!split.voucher_no}
                      className="h-8 w-8 p-0 rounded-md bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-100 dark:border-red-500/20 transition-all active:scale-95 disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Row Button */}
          <button
            type="button"
            onClick={addSplitRow}
            className="w-full h-9 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-400 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-600/50 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-all flex items-center justify-center gap-2 group"
          >
            <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={9} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Add Payment Source</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800">
          
          {/* Remaining summary pill */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold mr-auto",
            isFullyPaid
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400"
          )}>
            {isFullyPaid
              ? <><CheckCircle2 size={11} /><span>Rs {totalPaid.toLocaleString()} · All settled</span></>
              : <><AlertCircle size={11} /><span>Remaining: Rs {remaining.toLocaleString()}</span></>
            }
          </div>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
          >
            Cancel
          </Button>

          <Button
            onClick={onCommit}
            className="h-9 px-6 text-[10px] font-black uppercase tracking-wider bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md shadow-orange-500/20 active:scale-[0.97] transition-all flex items-center gap-2 border-none"
          >
            Process Disbursement
            <ArrowRight size={13} strokeWidth={2.5} />
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
