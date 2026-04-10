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
}

const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-500 via-orange-600 to-red-600";
const GLASS_BG = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]";

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
  previousBalance = 0
}) => {
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  const totalPaid = splits.reduce((acc, s) => acc + toNumber(s.amount), 0);
  const totalReceivable = totals.net + previousBalance;
  const remaining = totalReceivable - totalPaid;
  const isFullyPaid = Math.abs(remaining) < 0.01;
  const isOverpaid = remaining < -0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[99vw] md:max-w-[50vw] w-full bg-[#0F111A] border-none shadow-2xl p-0 overflow-hidden rounded-md">
        
        {/* Superior Matrix Header */}
        <div className={cn("p-8 relative overflow-hidden", ACCENT_GRADIENT)}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4 text-white">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 rotate-3 transition-transform hover:rotate-0">
                   <Banknote className="w-7 h-7 text-white" />
                </div>
                Financial Payment
              </DialogTitle>
              <DialogDescription className="text-white/60 font-black uppercase text-[10px] tracking-[0.3em] mt-4 ml-2">
                Verify and complete your payment • {invoiceNo}
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
                {isFullyPaid ? "Payment Complete" : isOverpaid ? "Overpaid" : "Payment Pending"}
              </span>
            </div>
          </div>
          
          {/* Abstract background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Dynamic Balance Tracker */}
        <div className="grid grid-cols-4 divide-x divide-white/5 bg-[#161925] border-b border-white/5">
          <div className="p-6 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2">Invoice</span>
            <span className="text-xl font-black text-white font-mono tracking-tighter">Rs {totals.net.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2">Prev. Balance</span>
            <span className={cn(
              "text-xl font-black font-mono tracking-tighter",
              previousBalance > 0 ? "text-rose-400" : "text-emerald-400"
            )}>Rs {previousBalance.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2">Allocated</span>
            <span className="text-xl font-black text-emerald-400 font-mono tracking-tighter">Rs {totalPaid.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2">Outstanding</span>
            <span className={cn(
              "text-xl font-black font-mono tracking-tighter",
              remaining > 0 ? "text-orange-500" : "text-emerald-400"
            )}>
              Rs {remaining.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Multi-Payment Rows */}
        <div className="p-8 max-h-[400px] overflow-y-auto bg-[#0F111A] space-y-4 custom-scrollbar">
          {splits.map((split, index) => {
            const acc = paymentAccounts.find(a => a.id.toString() === split.payment_account_id);
            const typeLower = (acc?.account_type?.name || acc?.title || '').toLowerCase();
            const isBank = typeLower.includes('bank');
            const isChequeInHand = typeLower.includes('cheque in hand');

            return (
              <div 
                key={split.id} 
                className="group relative p-6 rounded-md bg-[#161925] border border-white/5 hover:border-orange-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                  <div className="grid grid-cols-12 gap-x-4 gap-y-4 items-end">
                    
                    {/* Account Selector */}
                    <div className={cn(
                      "col-span-12 flex flex-col gap-2",
                      isChequeInHand ? "lg:col-span-3" : isBank ? "lg:col-span-4" : "lg:col-span-7"
                    )}>
                      <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">
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
                          "h-15 w-full rounded-sm bg-black/40 border-white/10 text-white font-bold",
                          split.voucher_no && "opacity-60 cursor-not-allowed"
                        )}>
                          <SelectValue placeholder="Select Origin..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#161925]  w-full border-white/10 text-white rounded-xl">
                          {paymentAccounts.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="font-bold p-3">
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount Input */}
                    <div className={cn(
                      "col-span-12 flex flex-col gap-2",
                      isChequeInHand ? "lg:col-span-2" : isBank ? "lg:col-span-3" : "lg:col-span-4"
                    )}>
                      <Label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Amount</Label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30 italic">Rs</span>
                         <Input 
                          type="number"
                          placeholder="0.00"
                          value={split.amount || ""}
                          disabled={!!split.voucher_no}
                          onChange={(e) => updateSplitRow(split.id, 'amount', e.target.value)}
                          className={cn(
                            "h-12 pl-10 pr-4 rounded-sm bg-black/40 border-white/10 text-white font-black text-right focus:border-orange-500/50",
                            split.voucher_no && "opacity-60 cursor-not-allowed"
                          )}
                        />
                      </div>
                    </div>

                    {/* Conditional Logic for Payment Details */}
                    {isBank && (
                      <div className="col-span-12 lg:col-span-4 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                        <Label className="text-[8px] font-black uppercase text-orange-500 tracking-widest">Payment Method</Label>
                        <div className="h-12 flex bg-black/20 px-4 rounded-xl border border-orange-500/20 items-center justify-center">
                          <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.2em] text-center">Online (Direct Transfer)</span>
                        </div>
                      </div>
                    )}

                    {isChequeInHand && (
                      <>
                        <div className="col-span-12 lg:col-span-3 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                          <Label className="text-[8px] font-black uppercase text-orange-500 tracking-widest">Cheque Number</Label>
                          <Input 
                            placeholder="CHQ-XXXXXX"
                            value={split.cheque_no || ""}
                            onChange={(e) => updateSplitRow(split.id, 'cheque_no', e.target.value)}
                            className="h-12 rounded-sm bg-black/50 border-white/10 text-white font-bold italic"
                          />
                        </div>
                        <div className="col-span-12 lg:col-span-3 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                          <Label className="text-[8px] font-black uppercase text-orange-500 tracking-widest">Cheque Date</Label>
                          <Input 
                            type="date"
                            value={split.cheque_date || ""}
                            onChange={(e) => updateSplitRow(split.id, 'cheque_date', e.target.value)}
                            className="h-12 rounded-sm bg-black/50 border-white/10 text-white font-bold"
                          />
                        </div>
                      </>
                    )}

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
            className="w-full h-16 rounded-[2rem] border-dashed border-2 border-white/10 bg-white/5 text-zinc-500 hover:text-orange-500 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex items-center justify-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <Plus size={18} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Add Payment Method</span>
          </Button>
        </div>

        {/* Global Footer */}
        <DialogFooter className="p-8 bg-[#161925] border-t border-white/5 gap-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border-white/10 bg-transparent text-zinc-400 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button 
            onClick={onCommit}
            className={cn(
              "h-14 flex-[2] rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl relative overflow-hidden group",
              ACCENT_GRADIENT
            )}
          >
            <span className="relative z-10 italic">Save & Finalize Invoice</span>
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine" />
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
