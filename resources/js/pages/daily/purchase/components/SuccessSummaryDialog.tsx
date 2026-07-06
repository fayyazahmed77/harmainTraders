import React from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Printer, Eye, Plus } from "lucide-react";
import { router } from "@inertiajs/react";
import { motion } from "framer-motion";

interface SuccessSummaryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplierName?: string;
    totalItems?: number;
    totalFull?: number;
    totalPcs?: number;
    gross?: number;
    discount?: number;
    net?: number;
    purchaseId?: number | string;
    mode?: 'create' | 'edit';
    onReturn?: () => void;
}

export const SuccessSummaryDialog: React.FC<SuccessSummaryDialogProps> = ({
    open,
    onOpenChange,
    supplierName = "N/A",
    totalItems = 0,
    totalFull = 0,
    totalPcs = 0,
    gross = 0,
    discount = 0,
    net = 0,
    purchaseId,
    mode = 'create',
    onReturn,
}) => {
    const isEdit = mode === 'edit';
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

    React.useEffect(() => {
        return () => {
            if (iframeRef.current && document.body.contains(iframeRef.current)) {
                document.body.removeChild(iframeRef.current);
            }
        };
    }, []);

    const handleDirectPrint = (format: 'small' | 'big') => {
        if (!purchaseId) return;

        // Create a hidden iframe
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        iframe.style.opacity = "0";
        iframe.src = `/purchase/${purchaseId}/pdf?format=${format}`;
        
        if (iframeRef.current && document.body.contains(iframeRef.current)) {
            document.body.removeChild(iframeRef.current);
        }
        
        iframeRef.current = iframe;
        document.body.appendChild(iframe);

        // Trigger print when loaded
        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error("Direct print failed, fallback to new tab:", e);
                window.open(iframe.src, '_blank');
            }
        };
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-white dark:bg-gray-950 shadow-2xl rounded-2xl">
                <div className="relative h-48 bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white p-8 text-center overflow-hidden">
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
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 mb-4"
                        >
                            <Check size={24} className="text-white" />
                        </motion.div>
                        
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl font-black tracking-tight mb-1"
                        >
                            {isEdit ? 'Purchase Updated Successfully!' : 'Purchase Created Successfully!'}
                        </motion.h2>
                        {purchaseId && (
                            <motion.p
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 0.8 }}
                                transition={{ delay: 0.4 }}
                                className="text-xs font-mono uppercase tracking-widest opacity-80"
                            >
                                Invoice ID: {purchaseId}
                            </motion.p>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Supplier</span>
                                <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                                    {supplierName}
                                </h3>
                            </div>
                            <div className="text-right space-y-1">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Invoice Amount</span>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                    Rs {net.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 text-center flex flex-col items-center">
                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Items</span>
                                <span className="text-base font-black text-gray-800 dark:text-gray-100 font-mono leading-none">{totalItems}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 text-center flex flex-col items-center">
                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Full Packs</span>
                                <span className="text-base font-black text-gray-800 dark:text-gray-100 font-mono leading-none">{totalFull}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 text-center flex flex-col items-center">
                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Pcs</span>
                                <span className="text-base font-black text-gray-800 dark:text-gray-100 font-mono leading-none">{totalPcs}</span>
                            </div>
                        </div>

                        {discount > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30">
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">Total Discount</span>
                                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">Rs {discount.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    className="h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg shadow-gray-200 dark:shadow-gray-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => handleDirectPrint('small')}
                                >
                                    <Printer size={18} className="mr-2" /> Thermal Print
                                </Button>
                                <Button
                                    className="h-12 bg-emerald-600 hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => handleDirectPrint('big')}
                                >
                                    <Printer size={18} className="mr-2" /> A4 Print
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-12 border-gray-200 dark:border-gray-800 font-bold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                                    onClick={() => {
                                        if (purchaseId) {
                                            router.get(`/purchase/${purchaseId}/view`);
                                        }
                                    }}
                                >
                                    <Eye size={18} className="mr-2" /> View Invoice
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 border-orange-200 dark:border-orange-900/30 font-bold rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                                    onClick={() => {
                                        if (onReturn) {
                                            onReturn();
                                        } else {
                                            onOpenChange(false);
                                        }
                                    }}
                                >
                                    <Plus size={18} className="mr-2" /> {isEdit ? "Back to List" : "Create New"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
