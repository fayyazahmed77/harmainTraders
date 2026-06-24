import React from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, Eye, Plus } from "lucide-react";
import { router } from "@inertiajs/react";

interface SuccessData {
    supplierName: string;
    totalItems: number;
    totalFull: number;
    totalPcs: number;
    gross: number;
    discount: number;
    net: number;
    purchaseId?: number;
}

interface SuccessSummaryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    successData: SuccessData | null;
    mode?: 'create' | 'edit';
}

export const SuccessSummaryDialog: React.FC<SuccessSummaryDialogProps> = ({
    open,
    onOpenChange,
    successData,
    mode = 'create',
}) => {
    const isEdit = mode === 'edit';
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
        if (!successData?.purchaseId) return;

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
        iframe.src = `/purchase/${successData.purchaseId}/pdf?format=${format}`;
        
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
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-white dark:bg-gray-950 shadow-2xl rounded-2xl">
                {isPrinting ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center space-y-6 min-h-[350px]">
                        <div className="relative flex items-center justify-center mt-4">
                            <div className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-emerald-400 opacity-20"></div>
                            <div className="relative rounded-full bg-emerald-50 dark:bg-emerald-950/50 p-6 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                <Printer size={40} className="animate-pulse" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <DialogTitle className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                Printing Invoice...
                            </DialogTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium px-4">
                                Directing Invoice #{successData?.purchaseId} layout payload to {printFormat === 'big' ? 'A4' : 'thermal'} output stream.
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-[280px] bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden relative">
                            <div 
                                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-linear" 
                                style={{ width: `${(countdown / 10) * 100}%` }}
                            />
                        </div>

                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                            Closing automatically in <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{countdown}</span> seconds
                        </div>

                        <Button 
                            variant="outline"
                            className="h-10 border-gray-200 dark:border-gray-800 font-bold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all px-6 text-xs uppercase tracking-widest"
                            onClick={handleCancelPrint}
                        >
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="bg-emerald-600 dark:bg-emerald-500 p-8 flex flex-col items-center text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <CheckCircle2 size={120} />
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <CheckCircle2 size={40} className="text-white" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white mb-1 px-4 text-center leading-tight">
                                {isEdit ? "Purchase Updated Successfully!" : "Purchase Created Successfully!"}
                            </DialogTitle>
                            <p className="text-emerald-50/80 text-sm font-medium">Invoice record saved with ID: {successData?.purchaseId}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {successData && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Supplier</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{successData.supplierName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Invoice Amount</p>
                                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Rs {successData.net.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Items</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{successData.totalItems}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">FULL</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{successData.totalFull}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">PCS</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{successData.totalPcs}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center px-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30">
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">Total Discount</span>
                                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">Rs {successData.discount.toLocaleString()}</span>
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
                                            if (successData?.purchaseId) {
                                                router.get(`/purchase/${successData.purchaseId}/view`);
                                            }
                                        }}
                                    >
                                        <Eye size={18} className="mr-2" /> View Invoice
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-12 border-orange-200 dark:border-orange-900/30 font-bold rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                                        onClick={() => {
                                            if (isEdit) {
                                                router.get('/purchase');
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
