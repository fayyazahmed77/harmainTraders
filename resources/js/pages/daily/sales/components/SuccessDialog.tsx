import React from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  X, 
  Printer, 
  FileText, 
  Eye, 
  Plus, 
  Layout, 
  Receipt 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNo: string;
  saleId: number | string;
  onReturn: () => void;
  customerName?: string;
  totalAmount?: number;
  countItems?: number;
  countFull?: number;
  countPcs?: number;
  totalDiscount?: number;
  type?: 'create' | 'edit';
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  open,
  onOpenChange,
  invoiceNo,
  saleId,
  onReturn,
  customerName = "Ali Khan",
  totalAmount = 0,
  countItems = 0,
  countFull = 0,
  countPcs = 0,
  totalDiscount = 0,
  type = 'create'
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden border-none shadow-2xl bg-[#0A0B10] rounded-[2rem]">
        
        {/* Header Section (1:1 with Screenshot) */}
        <div className="bg-[#10B981] p-8 text-center relative">
          <button 
             onClick={() => onOpenChange(false)}
             className="absolute top-4 right-4 text-white/60 hover:text-white transition-all outline-none"
          >
            <X size={20} strokeWidth={3} />
          </button>
          
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/30 shadow-lg">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Check size={28} className="text-[#10B981]" strokeWidth={4} />
             </div>
          </div>
          
          <DialogTitle className="text-2xl font-black text-white m-0 leading-tight">
             {type === 'edit' ? 'Purchase Updated Successfully!' : 'Purchase Created Successfully!'}
          </DialogTitle>
          <p className="text-white/80 text-[11px] font-bold mt-2 font-mono uppercase tracking-wider">
             Invoice record saved with ID: {invoiceNo}
          </p>
        </div>

        {/* Transaction Overview Body */}
        <div className="p-8 space-y-6">
           {/* Contact & Amount Row */}
           <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Supplier</span>
                 <span className="text-xl font-black text-white uppercase tracking-tight">{customerName}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Invoice Amount</span>
                 <span className="text-3xl font-black text-[#10B981] tracking-tighter italic">
                    <span className="text-base not-italic mr-1">Rs</span>{totalAmount.toLocaleString()}
                 </span>
              </div>
           </div>

           <div className="h-px bg-zinc-800/50 w-full" />

           {/* Stats Row */}
           <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#161821] p-4 rounded-2xl flex flex-col items-center gap-2 border border-zinc-800/50">
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Items</span>
                 <span className="text-2xl font-black text-white">{countItems}</span>
              </div>
              <div className="bg-[#161821] p-4 rounded-2xl flex flex-col items-center gap-2 border border-zinc-800/50">
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Full</span>
                 <span className="text-2xl font-black text-white">{countFull}</span>
              </div>
              <div className="bg-[#161821] p-4 rounded-2xl flex flex-col items-center gap-2 border border-zinc-800/50">
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Pcs</span>
                 <span className="text-2xl font-black text-white">{countPcs}</span>
              </div>
           </div>

           {/* Discount Box */}
           <div className="bg-[#10B981]/5 border border-[#10B981]/30 p-5 rounded-2xl flex justify-between items-center group hover:bg-[#10B981]/10 transition-all">
              <span className="text-xs font-black text-[#10B981] uppercase tracking-widest leading-none">Total Discount</span>
              <span className="text-xl font-black text-[#10B981] tracking-tighter">
                 <span className="text-sm mr-1">Rs</span>{totalDiscount.toLocaleString()}
              </span>
           </div>

           {/* Action Buttons Grid (2x2) */}
           <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                onClick={() => window.open(`/sales/${saleId}/pdf?format=small`, '_blank')}
                variant="outline" 
                className="h-14 rounded-2xl border-zinc-800 bg-transparent text-white font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
              >
                 <Receipt size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                 Thermal Print
              </Button>
              
              <Button 
                onClick={() => window.open(`/sales/${saleId}/pdf?format=big`, '_blank')}
                className="h-14 rounded-2xl bg-[#10B981] text-white font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-[#059669] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                 <Layout size={18} />
                 A4 Print
              </Button>

              <Button 
                onClick={() => window.open(`/sales/${saleId}/view`, '_blank')}
                variant="outline" 
                className="h-14 rounded-2xl border-zinc-800 bg-transparent text-zinc-400 font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-zinc-800 hover:text-white transition-all group"
              >
                 <Eye size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
                 View Invoice
              </Button>

              <Button 
                onClick={onReturn}
                className="h-14 rounded-2xl border border-orange-500/30 bg-transparent text-orange-500 font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-orange-500/10 hover:border-orange-500 transition-all group"
              >
                 <Plus size={18} className="text-orange-500 animate-pulse" />
                 Create New
              </Button>
           </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
