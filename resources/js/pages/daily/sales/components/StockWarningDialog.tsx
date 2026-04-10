import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StockWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const StockWarningDialog: React.FC<StockWarningDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-none shadow-2xl bg-white dark:bg-zinc-950 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase text-rose-600 italic tracking-tighter">
            Stock Warning
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            One or more items exceed available stock (negative stock). Do you want to proceed with saving this invoice anyway?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[10px] tracking-widest h-11 px-6 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }} 
            className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
