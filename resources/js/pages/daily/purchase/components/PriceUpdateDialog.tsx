import React from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Check } from "lucide-react";

interface PriceUpdateInfo {
    item_id: number;
    title: string;
    old_trade_price: number;
    new_trade_price: number;
    markup_percent: number;
    markup_amount: number;
    retail_price: number;
}

interface PriceUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    priceUpdates: PriceUpdateInfo[];
    submitPurchase: (updatePrices: boolean) => void;
}

export const PriceUpdateDialog: React.FC<PriceUpdateDialogProps> = ({
    open,
    onOpenChange,
    priceUpdates,
    submitPurchase,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-white dark:bg-gray-950 shadow-2xl rounded-2xl">
                <div className="bg-orange-600 dark:bg-orange-500 p-6 flex flex-col items-center text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                        <AlertTriangle size={100} />
                    </div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 shadow-inner">
                        <AlertTriangle size={32} className="text-white" />
                    </div>
                    <DialogTitle className="text-xl font-black tracking-tight text-white mb-1 px-4 text-center leading-tight uppercase">Update Item Trade Prices?</DialogTitle>
                    <p className="text-orange-50/80 text-xs font-medium text-center max-w-[80%]">Detected price changes based on new purchase rate and supplier markup. Update items table?</p>
                </div>

                <div className="p-0 max-h-[400px] overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-10">
                            <tr className="text-[10px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400">
                                <th className="py-3 px-4">Item Description</th>
                                <th className="py-3 px-2 text-center">Prev Trade</th>
                                <th className="py-3 px-2 text-center">Markup (%)</th>
                                <th className="py-3 px-2 text-center">New Trade</th>
                                <th className="py-3 px-2 text-center">Retail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                            {priceUpdates.map((upd, idx) => (
                                <tr key={idx} className="hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">{upd.title}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">ID: #{upd.item_id}</div>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <span className="text-xs font-semibold text-gray-500 line-through">Rs {upd.old_trade_price.toFixed(2)}</span>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{upd.markup_percent}%</span>
                                            <span className="text-[9px] text-gray-400">+{upd.markup_amount.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <div className="inline-flex items-center gap-1.5 justify-center bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
                                            <span className="text-xs font-black text-orange-700 dark:text-orange-300">Rs {upd.new_trade_price.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-center font-bold text-xs text-slate-600 dark:text-slate-400">
                                        Rs {upd.retail_price.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            className="w-full h-12 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group shadow-sm"
                            onClick={() => submitPurchase(false)}
                        >
                            <X size={18} className="group-hover:rotate-90 transition-transform" /> No, Only Store Bill
                        </Button>
                        <Button
                            className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            onClick={() => submitPurchase(true)}
                        >
                            <Check size={18} /> Yes, Update Prices
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
