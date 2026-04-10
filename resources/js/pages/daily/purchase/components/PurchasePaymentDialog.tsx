import React from "react";
import { 
  Banknote,
  Plus,
  Trash2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Fingerprint,
  Wallet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
}

const ACCENT_GRADIENT = "bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700";
const GLASS_BG = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]";

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
  availableCheques = []
}) => {
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  const totalPaid = splits.reduce((acc, s) => acc + toNumber(s.amount), 0);
  const totalPayable = totals.net + previousBalance;
  const remaining = totalPayable - totalPaid;
  const isFullyPaid = Math.abs(remaining) < 0.01;
  const isOverpaid = remaining < -0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[99vw] md:max-w-[85vw] w-full bg-white dark:bg-[#0B0D15] border-zinc-200 dark:border-white/10 shadow-2xl p-0 overflow-hidden rounded-md transition-colors duration-500">
        
        {/* Superior Matrix Header */}
        <div className={cn("p-8 relative overflow-hidden", ACCENT_GRADIENT)}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4 text-white">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 rotate-3 transition-transform hover:rotate-0">
                   <Wallet className="w-7 h-7 text-white" />
                </div>
                Supplier Settlement
              </DialogTitle>
              <DialogDescription className="text-white/60 font-black uppercase text-[10px] tracking-[0.3em] mt-4 ml-2">
                Disburse payment to {supplierName} • {invoiceNo}
              </DialogDescription>
            </div>
            
            {/* Real-time Status Glyph */}
            <div className={cn(
              "px-6 py-3 rounded-2xl flex items-center gap-3 border backdrop-blur-md transition-all duration-500",
              isFullyPaid 
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                : isOverpaid 
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : "bg-orange-500/20 border-orange-500/40 text-orange-400"
            )}>
              <Fingerprint className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">
                {isFullyPaid ? "Fully Settled" : isOverpaid ? "Surplus Payment" : "Partial Payment"}
              </span>
            </div>
          </div>
          
          {/* Abstract background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Dynamic Balance Tracker */}
        <div className="grid grid-cols-4 divide-x divide-zinc-200 dark:divide-white/5 bg-zinc-50 dark:bg-[#161925] border-b border-zinc-200 dark:border-white/5">
          <div className="p-6 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 font-mono">Invoice</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white font-mono tracking-tighter">Rs {totals.net.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center border-l-0">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 font-mono">Prev. Balance</span>
            <span className={cn(
              "text-xl font-black font-mono tracking-tighter",
              previousBalance > 0 ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}>Rs {previousBalance.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 font-mono">Paying</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tighter">Rs {totalPaid.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 font-mono">Remaining</span>
            <span className={cn(
              "text-xl font-black font-mono tracking-tighter",
              remaining > 0 ? "text-orange-600 dark:text-orange-500" : "text-emerald-600 dark:text-emerald-400"
            )}>
              Rs {remaining.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Multi-Payment Rows */}
        <div className="p-8 max-h-[500px] overflow-y-auto bg-zinc-100/30 dark:bg-[#0F111A] space-y-4 custom-scrollbar">
          {splits.map((split, index) => {
            const acc = paymentAccounts.find(a => a.id.toString() === split.payment_account_id);
            const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
            const isBank = typeLower.includes('bank');

            return (
              <div 
                key={split.id} 
                className="group relative p-5 rounded-xl bg-white dark:bg-[#161925] border border-zinc-200 dark:border-white/5 hover:border-indigo-500/30 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                  <div className="grid grid-cols-12 gap-x-4 gap-y-4 items-end">
                    
                    {/* Account Selector */}
                    <div className={cn(
                      "col-span-12 flex flex-col gap-2",
                      "lg:col-span-2"
                    )}>
                      <Label className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest ml-1">
                        Source Account {split.voucher_no && <span className="text-indigo-500/50">({split.voucher_no})</span>}
                      </Label>
                      <Select 
                        value={split.payment_account_id} 
                        disabled={!!split.voucher_no}
                        onValueChange={(val) => {
                          updateSplitRow(split.id, 'payment_account_id', val);
                          const acc = paymentAccounts.find(a => a.id.toString() === val);
                          const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
                          const isBank = typeLower.includes('bank');
                          const isCIH = typeLower.includes('cheque in hand');
                          
                          if (isBank) {
                            updateSplitRow(split.id, 'payment_method', 'Online');
                          } else if (isCIH) {
                            updateSplitRow(split.id, 'payment_method', 'Cheque');
                          } else {
                            updateSplitRow(split.id, 'payment_method', 'Cash');
                          }
                          
                          // Reset specialized fields
                          updateSplitRow(split.id, 'customer_cheque_id', '');
                          updateSplitRow(split.id, 'cheque_id', '');
                        }}
                      >
                        <SelectTrigger className={cn(
                          "h-12 w-full rounded-sm bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-bold",
                          split.voucher_no && "opacity-60 cursor-not-allowed"
                        )}>
                          <SelectValue placeholder="Select Source Account..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#161925] w-full border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl">
                          {paymentAccounts.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="font-bold p-3">
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Specialized Selectors for CIH/Bank */}
                    {(() => {
                      const acc = paymentAccounts.find(a => a.id.toString() === split.payment_account_id);
                      const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
                      const isCIH = typeLower.includes('cheque in hand');
                      const isBank = typeLower.includes('bank');

                      if (isCIH) {
                        return (
                          <div className="col-span-12 lg:col-span-4 flex flex-col gap-2 animate-in slide-in-from-right-4">
                            <Label className="text-[9px] font-black uppercase text-amber-600 tracking-widest ml-1">Available Customer Cheques</Label>
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
                              <SelectTrigger className="h-12 w-full rounded-sm bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-amber-500/30 text-zinc-900 dark:text-white font-bold">
                                <SelectValue placeholder="Pick a cheque..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#161925] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl">
                                {customerCheques.map((c) => (
                                  <SelectItem key={c.id} value={c.id.toString()} className="font-bold p-3">
                                    #{c.cheque_no} - Rs {Number(c.amount).toLocaleString()} ({c.cheque_date})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }

                      if (isBank) {
                        return (
                          <div className="col-span-12 lg:col-span-2 flex flex-col gap-2 animate-in slide-in-from-right-4">
                            <Label className="text-[9px] font-black uppercase text-indigo-500 tracking-widest ml-1">Mode</Label>
                            <Select 
                              value={split.payment_method}
                              onValueChange={(val) => {
                                updateSplitRow(split.id, 'payment_method', val);
                                if (val === 'Online') updateSplitRow(split.id, 'cheque_id', '');
                              }}
                            >
                              <SelectTrigger className="h-12 w-full rounded-sm bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-indigo-500/30 text-zinc-900 dark:text-white font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#161925] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl">
                                <SelectItem value="Online" className="font-bold p-3 italic">Online Transfer</SelectItem>
                                <SelectItem value="Cheque" className="font-bold p-3 italic">Bank Cheque</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Amount Input */}
                    <div className={cn(
                      "col-span-12 flex flex-col gap-2",
                      (() => {
                        const acc = paymentAccounts.find(a => a.id.toString() === split.payment_account_id);
                        const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
                        if (typeLower.includes('bank')) {
                           return split.payment_method === 'Cheque' ? "lg:col-span-3" : "lg:col-span-7";
                        }
                        if (typeLower.includes('cheque in hand')) return "lg:col-span-4";
                        return "lg:col-span-9";
                      })()
                    )}>
                      <Label className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest ml-1">Amount</Label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 dark:text-white/30 italic">Rs</span>
                         <Input 
                          type="number"
                          placeholder="0.00"
                          value={split.amount || ""}
                          disabled={!!split.voucher_no || !!split.customer_cheque_id}
                          onChange={(e) => updateSplitRow(split.id, 'amount', e.target.value)}
                          className={cn(
                            "h-12 pl-10 pr-4 rounded-sm bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-black text-right focus:border-indigo-500/50 transition-all",
                            (split.voucher_no || split.customer_cheque_id) && "opacity-60 cursor-not-allowed"
                          )}
                        />
                      </div>
                    </div>

                    {/* Conditional Logic for Payment Details */}
                    {(() => {
                      const acc = paymentAccounts.find(a => a.id.toString() === split.payment_account_id);
                      const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
                      const isBank = typeLower.includes('bank');
                      const isCIH = typeLower.includes('cheque in hand');

                      if (isBank && split.payment_method === 'Cheque') {
                        const bankCheques = availableCheques.filter(c => c.bank_id.toString() === split.payment_account_id);
                        return (
                          <>
                            <div className="col-span-12 lg:col-span-2 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                              <Label className="text-[8px] font-black uppercase text-indigo-500 tracking-widest">Cheque No</Label>
                              <Select 
                                value={split.cheque_id}
                                onValueChange={(val) => {
                                  const chk = bankCheques.find(c => c.id.toString() === val);
                                  updateSplitRow(split.id, 'cheque_id', val);
                                  if (chk) updateSplitRow(split.id, 'cheque_no', chk.cheque_no);
                                }}
                              >
                                <SelectTrigger className="h-12 w-full bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-indigo-500/20 text-zinc-900 dark:text-white font-bold">
                                  <SelectValue placeholder="No..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#161925] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl">
                                  {bankCheques.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.cheque_no}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-12 lg:col-span-2 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                              <Label className="text-[8px] font-black uppercase text-indigo-500 tracking-widest">Date</Label>
                              <Input 
                                type="date"
                                value={split.cheque_date || ""}
                                onChange={(e) => updateSplitRow(split.id, 'cheque_date', e.target.value)}
                                className="h-12 bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-indigo-500/20 text-zinc-900 dark:text-white font-bold"
                              />
                            </div>
                          </>
                        );
                      }

                      if (isCIH && split.customer_cheque_id) {
                        return (
                          <div className="col-span-12 lg:col-span-1 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                             <Label className="text-[8px] font-black uppercase text-amber-600 tracking-widest">Date</Label>
                             <div className="h-12 flex bg-zinc-100 dark:bg-black/20 px-2 rounded border border-zinc-200 dark:border-amber-500/20 items-center justify-center">
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">{split.cheque_date}</span>
                             </div>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Remove Button */}
                    <div className="col-span-12 lg:col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => removeSplitRow(split.id)}
                        className="h-12 w-12 rounded-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all active:scale-95"
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>

                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            onClick={addSplitRow}
            className="w-full h-16 rounded-[2rem] border-dashed border-2 border-white/10 bg-white/5 text-zinc-500 hover:text-indigo-500 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <Plus size={18} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Add Source Account</span>
          </Button>
        </div>

        {/* Global Footer */}
        <DialogFooter className="p-8 bg-zinc-50 dark:bg-[#161925] border-t border-zinc-200 dark:border-white/5 gap-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border-zinc-200 dark:border-white/10 bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
          >
            Cancel
          </Button>
          <Button 
            onClick={onCommit}
            className={cn(
              "h-14 flex-[2] rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl relative overflow-hidden group border-none",
              ACCENT_GRADIENT
            )}
          >
            <span className="relative z-10 italic text-white">Process Disbursement</span>
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine" />
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
