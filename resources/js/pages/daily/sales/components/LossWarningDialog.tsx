import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, X, Check } from "lucide-react";

export interface LossWarningItem {
  item_id: number;
  title: string;
  purchase_price: number;
  purchase_source: "Last Purchase" | "Trade Price";
  rate: number;
  disc_percent: number;
  effective_rate: number;
}

interface LossWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lossItems: LossWarningItem[];
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const LossWarningDialog: React.FC<LossWarningDialogProps> = ({
  open,
  onOpenChange,
  lossItems,
  onConfirm,
  isSubmitting = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-2xl">
        <div className="bg-rose-600 dark:bg-rose-600 p-6 flex flex-col items-center text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
            <TrendingDown size={100} />
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 shadow-inner">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-white mb-1 px-4 text-center leading-tight uppercase">
            You are at loss
          </DialogTitle>
          <DialogDescription className="text-rose-100 text-xs font-medium text-center max-w-[85%]">
            {lossItems.length === 1
              ? "This item is being sold at or below its purchase price (after discount)."
              : `${lossItems.length} items are being sold at or below their purchase price (after discount).`}{" "}
            Do you want to proceed with saving this invoice anyway?
          </DialogDescription>
        </div>

        <div className="p-0 max-h-[360px] overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 z-10">
              <tr className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-2 text-center">Purchase Price</th>
                <th className="py-3 px-2 text-center">Sell Rate (After Disc)</th>
                <th className="py-3 px-4 text-right">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {lossItems.map((item, idx) => {
                const diff = item.effective_rate - item.purchase_price;
                const isBreakEven = Math.abs(diff) < 0.005;
                return (
                  <tr
                    key={`${item.item_id}-${idx}`}
                    className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        ID: #{String(item.item_id).padStart(5, "0")}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200">
                        Rs {item.purchase_price.toFixed(2)}
                      </div>
                      <div className="text-[9px] font-bold uppercase text-zinc-400">
                        {item.purchase_source}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex items-center justify-center bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                        <span className="text-xs font-black font-mono text-rose-700 dark:text-rose-300">
                          Rs {item.effective_rate.toFixed(2)}
                        </span>
                      </div>
                      {item.disc_percent > 0 && (
                        <div className="text-[9px] text-zinc-400 font-mono mt-0.5">
                          Rate {item.rate.toFixed(2)} (-{item.disc_percent}%)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
                        {isBreakEven
                          ? "Break-even (Rs 0.00)"
                          : `-Rs ${Math.abs(diff).toFixed(2)}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-zinc-50/60 dark:bg-black/20 border-t border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="w-full h-11 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <X size={16} />
              Cancel & Fix Rate
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[11px] tracking-widest rounded-xl shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Proceed Anyway
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
