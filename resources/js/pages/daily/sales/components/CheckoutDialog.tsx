import React from "react";
import { 
  Banknote,
  Plus,
  Trash2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Fingerprint
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
}

interface CheckoutDialogProps {
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
  previousBalance?: number;
  extraDiscount?: number;
}

const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-500 via-orange-600 to-red-600";

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
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
  previousBalance = 0,
  extraDiscount = 0
}) => {
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  const totalPaid = splits.reduce((acc, s) => acc + toNumber(s.amount), 0);
  
  const isAdvance = previousBalance < 0;
  const appliedAdv = totals.appliedAdvance || 0;
  
  // Outstanding Base is finalAmount (net + previousBalance - extraDiscount)
  const netPayable = totals.finalAmount; 

  const prevBalanceDisplay = isAdvance
    ? (appliedAdv > 0 ? -appliedAdv : 0)
    : previousBalance;

  const remaining = netPayable - totalPaid;
  const isFullyPaid = Math.abs(remaining) < 0.01;
  const isOverpaid = remaining < -0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[65vw] lg:max-w-[55vw] w-full bg-background border border-border shadow-2xl p-0 overflow-hidden rounded-2xl transition-all duration-300">
        
        {/* Superior Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-6 text-white relative overflow-hidden shrink-0">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                 <Banknote className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold uppercase tracking-tight text-white m-0">
                  Financial Payment
                </DialogTitle>
                <DialogDescription className="text-white/80 font-medium text-[9px] tracking-wider mt-0.5">
                  Verify and complete payment for Invoice: <span className="font-mono font-bold text-white">{invoiceNo}</span>
                </DialogDescription>
              </div>
            </div>
            
            {/* Real-time Status */}
            <div className={cn(
              "px-3 py-1.5 rounded-lg flex items-center gap-2 border backdrop-blur-sm transition-all duration-500 text-[10px] font-black uppercase tracking-widest",
              isFullyPaid 
                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200" 
                : isOverpaid 
                  ? "bg-blue-500/20 border-blue-400/40 text-blue-200"
                  : "bg-amber-500/20 border-amber-400/40 text-amber-200"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isFullyPaid ? "bg-emerald-400" : isOverpaid ? "bg-blue-400" : "bg-amber-400")} />
              <span>
                {isFullyPaid ? "Fully Paid" : isOverpaid ? "Overpaid" : "Pending"}
              </span>
            </div>
          </div>
          
          {/* Subtle backgrounds */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Dynamic Balance Tracker */}
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border bg-muted/40 dark:bg-zinc-900/30 border-b border-border select-none">
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Invoice Net</span>
            <span className="text-sm font-extrabold text-foreground font-mono">Rs {totals.net.toLocaleString()}</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-wider mb-1">
              {isAdvance && appliedAdv > 0 ? "Applied Adv." : "Prev. Balance"}
            </span>
            <span className={cn(
              "text-sm font-extrabold font-mono",
              prevBalanceDisplay > 0 ? "text-destructive" : (prevBalanceDisplay < 0 ? "text-emerald-500" : "text-muted-foreground")
            )}>Rs {prevBalanceDisplay.toLocaleString()}</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Extra Discount</span>
            <span className="text-sm font-extrabold text-orange-500 font-mono">Rs {extraDiscount.toLocaleString()}</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Allocated (Paid)</span>
            <span className="text-sm font-extrabold text-emerald-500 font-mono">Rs {totalPaid.toLocaleString()}</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center col-span-2 md:col-span-1 text-center">
            <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Outstanding</span>
            <span className={cn(
              "text-sm font-extrabold font-mono",
              remaining > 0 ? "text-orange-500" : "text-emerald-500"
            )}>
              Rs {remaining.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Multi-Payment Rows */}
        <div className="p-6 max-h-[350px] overflow-y-auto space-y-4 bg-background/50 custom-scrollbar">
          {splits.map((split, index) => {
            const acc = paymentAccounts.find(a => a.id.toString() === split.payment_account_id);
            const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
            const isBank = typeLower.includes('bank');
            const isChequeInHand = typeLower.includes('cheque in hand');

            return (
              <div 
                key={split.id} 
                className="group relative p-4 rounded-xl bg-card border border-border/80 hover:border-orange-500/30 dark:hover:border-orange-500/20 transition-all duration-200 shadow-sm animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                  <div className="grid grid-cols-12 gap-3 items-end">
                    
                    {/* Account Selector */}
                    <div className={cn(
                      "col-span-12 flex flex-col gap-1.5",
                      isChequeInHand ? "lg:col-span-3" : isBank ? "lg:col-span-4" : "lg:col-span-7"
                    )}>
                      <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider ml-0.5">
                        Payment From {split.voucher_no && <span className="text-orange-500/50">({split.voucher_no})</span>}
                      </Label>
                      <Select 
                        value={split.payment_account_id} 
                        disabled={!!split.voucher_no}
                        onValueChange={(val) => {
                          updateSplitRow(split.id, 'payment_account_id', val);
                          const acc = paymentAccounts.find(a => a.id.toString() === val);
                          const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
                          const isBank = typeLower.includes('bank');
                          if (isBank) {
                            updateSplitRow(split.id, 'payment_method', 'Online');
                          } else if (typeLower.includes('cheque in hand')) {
                            updateSplitRow(split.id, 'payment_method', 'Cheque');
                          }
                        }}
                      >
                        <SelectTrigger className={cn(
                          "h-10 w-full rounded-lg bg-background border-border text-foreground font-bold text-xs",
                          split.voucher_no && "opacity-60 cursor-not-allowed"
                        )}>
                          <SelectValue placeholder="Select Origin..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground rounded-lg">
                          {paymentAccounts.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="font-bold text-xs p-2.5">
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount Input */}
                    <div className={cn(
                      "col-span-12 flex flex-col gap-1.5",
                      isChequeInHand ? "lg:col-span-2" : isBank ? "lg:col-span-3" : "lg:col-span-4"
                    )}>
                      <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider ml-0.5">Amount</Label>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground/60 italic">Rs</span>
                         <Input 
                          type="number"
                          placeholder="0.00"
                          value={split.amount || ""}
                          disabled={!!split.voucher_no}
                          onChange={(e) => updateSplitRow(split.id, 'amount', e.target.value)}
                          className={cn(
                            "h-10 pl-8 pr-3 rounded-lg bg-background border-border text-foreground font-bold text-xs text-right focus-visible:ring-orange-500",
                            split.voucher_no && "opacity-60 cursor-not-allowed"
                          )}
                        />
                      </div>
                    </div>

                    {/* Conditional Payment Method */}
                    {isBank && (
                      <div className="col-span-12 lg:col-span-4 flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
                        <Label className="text-[9px] font-black uppercase text-orange-500 tracking-wider">Method</Label>
                        <div className="h-10 flex bg-orange-500/5 dark:bg-orange-500/10 px-3 rounded-lg border border-orange-500/20 items-center justify-center">
                          <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest text-center">Online (Direct Transfer)</span>
                        </div>
                      </div>
                    )}

                    {isChequeInHand && (
                      <>
                        <div className="col-span-12 lg:col-span-3 flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
                          <Label className="text-[9px] font-black uppercase text-orange-500 tracking-wider">Cheque No.</Label>
                          <Input 
                            placeholder="CHQ-XXXXXX"
                            value={split.cheque_no || ""}
                            onChange={(e) => updateSplitRow(split.id, 'cheque_no', e.target.value)}
                            className="h-10 rounded-lg bg-background border-border text-foreground text-xs font-bold font-mono"
                          />
                        </div>
                        <div className="col-span-12 lg:col-span-3 flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
                          <Label className="text-[9px] font-black uppercase text-orange-500 tracking-wider">Cheque Date</Label>
                          <Input 
                            type="date"
                            value={split.cheque_date || ""}
                            onChange={(e) => updateSplitRow(split.id, 'cheque_date', e.target.value)}
                            className="h-10 rounded-lg bg-background border-border text-foreground text-xs font-bold"
                          />
                        </div>
                      </>
                    )}

                    {/* Remove Button */}
                    <div className="col-span-12 lg:col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => removeSplitRow(split.id)}
                        disabled={!!split.voucher_no}
                        className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            onClick={addSplitRow}
            className="w-full h-12 rounded-xl border-dashed border-2 border-border bg-muted/20 text-muted-foreground hover:text-orange-500 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex items-center justify-center gap-2 group"
          >
            <Plus size={14} className="group-hover:scale-110 transition-transform" />
            <span className="font-extrabold uppercase tracking-wider text-[9px]">Add Payment Method</span>
          </Button>
        </div>

        {/* Global Footer */}
        <DialogFooter className="p-6 bg-muted/30 border-t border-border flex flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="h-11 flex-1 rounded-xl font-bold uppercase text-[9px] tracking-wider border-border bg-transparent text-muted-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button 
            onClick={onCommit}
            className="h-11 flex-[2] rounded-xl font-extrabold uppercase text-[9px] tracking-wider bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md shadow-orange-500/10 active:scale-[0.98] transition-all"
          >
            Save & Finalize Invoice
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
