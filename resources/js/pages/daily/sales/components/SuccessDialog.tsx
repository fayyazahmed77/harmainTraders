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
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [printFormat, setPrintFormat] = React.useState<'small' | 'big'>('small');
  const [countdown, setCountdown] = React.useState(10);
  const timerRef = React.useRef<any>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (iframeRef.current && document.body.contains(iframeRef.current)) {
        document.body.removeChild(iframeRef.current);
      }
    };
  }, []);

  const handleDirectPrint = (format: 'small' | 'big') => {
    if (!saleId) return;

    setIsPrinting(true);
    setPrintFormat(format);
    setCountdown(10);

    // 1. Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.src = `/sales/${saleId}/pdf?format=${format}`;
    
    iframeRef.current = iframe;
    document.body.appendChild(iframe);

    // 2. Trigger print when loaded
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Direct print failed, fallback to new tab:", e);
        window.open(iframe.src, '_blank');
      }
    };

    // 3. Start countdown timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onOpenChange(false);
          setTimeout(() => {
            setIsPrinting(false);
            if (iframeRef.current && document.body.contains(iframeRef.current)) {
              document.body.removeChild(iframeRef.current);
              iframeRef.current = null;
            }
          }, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelPrint = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPrinting(false);
    if (iframeRef.current && document.body.contains(iframeRef.current)) {
      document.body.removeChild(iframeRef.current);
      iframeRef.current = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && isPrinting) {
        handleCancelPrint();
      }
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden border-none shadow-2xl bg-[#0A0B10] rounded-[2rem]">
        {isPrinting ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-6 min-h-[350px] bg-[#0A0B10] text-white">
            <div className="relative flex items-center justify-center mt-4">
              <div className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-[#10B981] opacity-20"></div>
              <div className="relative rounded-full bg-[#10B981]/10 p-6 text-[#10B981] border border-[#10B981]/20">
                <Printer size={40} className="animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">
                Printing Invoice...
              </DialogTitle>
              <p className="text-xs text-zinc-400 font-medium px-4">
                Directing Invoice #{invoiceNo} layout payload to {printFormat === 'big' ? 'A4' : 'thermal'} output stream.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-[280px] bg-zinc-800/80 h-2 rounded-full overflow-hidden relative">
              <div 
                className="bg-[#10B981] h-full rounded-full transition-all duration-1000 ease-linear" 
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>

            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
              Closing automatically in <span className="text-[#10B981] font-black text-sm">{countdown}</span> seconds
            </div>

            <Button 
              variant="outline"
              className="h-10 border-zinc-800 bg-transparent text-zinc-400 font-black rounded-xl hover:bg-zinc-900 hover:text-white transition-all px-6 text-xs uppercase tracking-widest"
              onClick={handleCancelPrint}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
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
                 {type === 'edit' ? 'Sales Updated Successfully!' : 'Sales Created Successfully!'}
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
                    onClick={() => handleDirectPrint('small')}
                    variant="outline" 
                    className="h-14 rounded-2xl border-zinc-800 bg-transparent text-white font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                     <Receipt size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                     Thermal Print
                  </Button>
                  
                  <Button 
                    onClick={() => handleDirectPrint('big')}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
