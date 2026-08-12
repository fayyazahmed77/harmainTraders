import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Receipt, 
  Layout, 
  FileText, 
  Plus 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import toast from "react-hot-toast";

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    voucherNo?: string;
    partyName?: string;
    amount?: number;
    invoicesCount?: number;
    method?: string;
    discount?: number;
    printId?: number | string;
    paymentType?: "RECEIPT" | "PAYMENT";
  } | null;
  onCreateNew?: () => void;
}

export const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  open,
  onOpenChange,
  data,
  onCreateNew,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    return () => {
      if (iframeRef.current && document.body.contains(iframeRef.current)) {
        document.body.removeChild(iframeRef.current);
      }
    };
  }, []);

  const handleDirectPrint = (format: 'small' | 'big') => {
    const printId = data?.printId;
    if (!printId) {
      toast.error("Voucher ID not found for printing.");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.src = `/payments/${printId}/pdf?format=${format}`;

    if (iframeRef.current && document.body.contains(iframeRef.current)) {
      document.body.removeChild(iframeRef.current);
    }

    iframeRef.current = iframe;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Direct print failed, opening in new tab:", e);
        window.open(iframe.src, '_blank');
      }
    };
  };

  const isReceipt = (data?.paymentType || 'RECEIPT') === 'RECEIPT';

  const theme = isReceipt ? {
    gradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
    gradientShadow: "shadow-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    bgAlpha: "bg-emerald-500/5 border-emerald-500/10",
  } : {
    gradient: "bg-gradient-to-r from-rose-500 to-red-500",
    gradientShadow: "shadow-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    bgAlpha: "bg-rose-500/5 border-rose-500/10",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-[2rem] overflow-hidden z-[99999]">
        <div className={`relative h-56 ${theme.gradient} flex flex-col items-center justify-center text-white p-8 text-center overflow-hidden`}>
          {/* Animated Background Blobs */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex gap-3 mb-4">
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30"
              >
                <CheckCircle2 size={32} className="text-white drop-shadow-md" />
              </motion.div>
            </div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-black tracking-tight mb-1"
            >
              Payment Completed!
            </motion.h2>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 0.8 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-mono font-bold tracking-wider uppercase opacity-90"
            >
              Voucher #: {data?.voucherNo || '---'}
            </motion.p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Ledger Account</span>
              <h3 className="text-base font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter leading-none truncate max-w-[200px]">
                {data?.partyName || "General Party"}
              </h3>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Settlement Amount</span>
              <div className={`text-xl font-mono font-black ${theme.text} items-center flex gap-1 justify-end leading-none`}>
                <span className="text-xs opacity-50 font-bold">Rs</span>
                {(data?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-800 text-center flex flex-col items-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Invoices</span>
              <span className="text-lg font-black text-zinc-800 dark:text-zinc-100 font-mono leading-none">{data?.invoicesCount || 0}</span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-800 text-center flex flex-col items-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Method</span>
              <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase leading-none truncate w-full pt-1">
                {data?.method || "Cash"}
              </span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-800 text-center flex flex-col items-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Adj</span>
              <span className="text-base font-black text-zinc-800 dark:text-zinc-100 font-mono leading-none">{(data?.discount || 0).toLocaleString()}</span>
            </div>
          </div>

          {(data?.discount || 0) > 0 && (
            <div className={`${theme.bgAlpha} border rounded-2xl p-3 flex justify-between items-center`}>
              <span className="text-xs font-black opacity-70 uppercase tracking-widest">Total Discount</span>
              <div className={`text-base font-mono font-black ${theme.text} flex items-center gap-1`}>
                <span className="text-[10px] font-bold">Rs</span>
                {(data?.discount || 0).toLocaleString()}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button 
              onClick={() => handleDirectPrint('small')}
              variant="outline" 
              className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-white font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group"
            >
              <Receipt size={16} className="text-zinc-500 group-hover:scale-110 transition-transform" />
              Thermal Print
            </Button>
            
            <Button 
              onClick={() => handleDirectPrint('big')}
              className={`h-12 rounded-xl ${theme.gradient} text-white font-black uppercase text-[10px] tracking-widest gap-2 hover:opacity-90 shadow-lg ${theme.gradientShadow} active:scale-[0.98] transition-all`}
            >
              <Layout size={16} />
              A4 Print
            </Button>

            <Button 
              onClick={() => {
                const printId = data?.printId;
                if (printId) {
                  window.open(`/payments/${printId}/view`, '_blank');
                } else {
                  toast.error("Voucher ID not found.");
                }
              }}
              variant="outline" 
              className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group"
            >
              <FileText size={16} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              View Voucher
            </Button>

            <Button 
              onClick={() => {
                onOpenChange(false);
                if (onCreateNew) {
                  onCreateNew();
                } else {
                  router.visit('/payment/create');
                }
              }} 
              variant="outline"
              className="h-12 border-orange-200 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-orange-50 dark:hover:bg-orange-500/10"
            >
              <Plus size={16} />
              Create New
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
