import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    CheckCircle2,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Package,
    Scale,
    Sparkles,
    Loader2,
} from "lucide-react";
import axios from "axios";

export interface ReconcileItem {
    id: number;
    code: string;
    title: string;
    company?: string;
    company_account?: { id: number; title: string };
    category?: { id: number; name: string };
    packing_qty: string | number;
    trade_price: string;
    stock_1: string | number;
    stock_2: string | number;
    opening_stock_1?: number;
    opening_stock_2?: number;
    opening_total_pcs?: number;
    available_stock?: number;
    available_full?: number;
    available_pcs?: number;
    stock_breakdown?: string;
    purchase_pcs?: number;
    sale_pcs?: number;
    sale_return_pcs?: number;
    purchase_return_pcs?: number;
    net_movement_pcs?: number;
}

interface Props {
    item: ReconcileItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updatedItem: ReconcileItem) => void;
}

export function OpeningStockReconciliationDialog({
    item,
    open,
    onOpenChange,
    onSuccess,
}: Props) {
    if (!item) return null;

    const packing = Math.max(1, Number(item.packing_qty) || 1);

    // Initial values taken from opening stock baseline
    const initialFull = item.opening_stock_1 !== undefined
        ? Number(item.opening_stock_1)
        : Number(item.stock_1) || 0;
    const initialLoose = item.opening_stock_2 !== undefined
        ? Number(item.opening_stock_2)
        : Number(item.stock_2) || 0;

    const [stock1, setStock1] = useState<number | string>(initialFull);
    const [stock2, setStock2] = useState<number | string>(initialLoose);
    const [saving, setSaving] = useState<boolean>(false);

    // Sync state whenever selected item changes
    useEffect(() => {
        if (item) {
            const f = item.opening_stock_1 !== undefined ? Number(item.opening_stock_1) : Number(item.stock_1) || 0;
            const l = item.opening_stock_2 !== undefined ? Number(item.opening_stock_2) : Number(item.stock_2) || 0;
            setStock1(f);
            setStock2(l);
        }
    }, [item]);

    // Handle input change: automatically replace leading zeros (e.g. typing "7" over "0" becomes "7", not "07")
    const handleStock1Change = (val: string) => {
        if (val === "") {
            setStock1("");
            return;
        }
        const cleaned = val.replace(/^0+(?=\d)/, "");
        const num = Math.max(0, parseInt(cleaned, 10));
        setStock1(isNaN(num) ? "" : num);
    };

    const handleStock2Change = (val: string) => {
        if (val === "") {
            setStock2("");
            return;
        }
        const cleaned = val.replace(/^0+(?=\d)/, "");
        const num = Math.max(0, parseInt(cleaned, 10));
        setStock2(isNaN(num) ? "" : num);
    };

    // Ledger movements
    const purchasePcs = Number(item.purchase_pcs || 0);
    const saleReturnPcs = Number(item.sale_return_pcs || 0);
    const totalInflow = purchasePcs + saleReturnPcs;

    const salePcs = Number(item.sale_pcs || 0);
    const purchaseReturnPcs = Number(item.purchase_return_pcs || 0);
    const totalOutflow = salePcs + purchaseReturnPcs;

    const netMovement = totalInflow - totalOutflow;

    // Parsed numerical values for calculation
    const parsedStock1 = stock1 === "" ? 0 : Number(stock1);
    const parsedStock2 = stock2 === "" ? 0 : Number(stock2);

    // Live calculations based on current inputs
    const totalOpeningPcs = (Math.max(0, parsedStock1) * packing) + Math.max(0, parsedStock2);
    const liveAvailablePcs = totalOpeningPcs + netMovement;

    // Available carton breakdown
    const isNegative = liveAvailablePcs < 0;
    const absAvail = Math.abs(liveAvailablePcs);
    const availFull = Math.floor(absAvail / packing) * (isNegative ? -1 : 1);
    const availLoose = (absAvail % packing) * (isNegative ? -1 : 1);

    const isReconciled = liveAvailablePcs >= 0;

    // Auto-calculate minimum opening stock needed to break even (0 available)
    const handleAutoFillBreakEven = () => {
        if (netMovement >= 0) {
            setStock1(0);
            setStock2(0);
            return;
        }
        const neededPcs = Math.abs(netMovement);
        const neededFull = Math.floor(neededPcs / packing);
        const neededLoose = neededPcs % packing;
        setStock1(neededFull);
        setStock2(neededLoose);
        toast.info(`Adjusted opening stock to break-even baseline: ${neededFull} Full, ${neededLoose} Pcs.`);
    };

    const handleSave = async () => {
        const finalStock1 = stock1 === "" ? 0 : Number(stock1);
        const finalStock2 = stock2 === "" ? 0 : Number(stock2);

        if (finalStock1 < 0 || finalStock2 < 0) {
            toast.error("Opening stock cannot be negative.");
            return;
        }

        setSaving(true);
        try {
            const response = await axios.patch(`/items/${item.id}/opening-stock`, {
                stock_1: finalStock1,
                stock_2: finalStock2,
            });

            if (response.data && response.data.success) {
                toast.success(
                    isReconciled
                        ? `Opening stock saved! Item is 100% Reconciled.`
                        : `Opening stock saved successfully.`
                );
                onSuccess(response.data.item);
                onOpenChange(false);
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || "Failed to update opening stock.";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-2xl">
                {/* Header with Title and Tags */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-zinc-900 dark:to-zinc-900 p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                {item.code || "ITEM"}
                            </span>
                            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                                {item.title}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                Reconcile baseline opening stock against ledger transaction history.
                            </DialogDescription>
                        </div>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 shrink-0 font-medium text-xs">
                            Packing: {packing} Pcs / Carton
                        </Badge>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* 1. Transaction Ledger Summary */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                Ledger Transaction History
                            </span>
                            <span className="text-[11px] text-zinc-400">Since inception</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {/* Inflow */}
                            <div className="p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/40">
                                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-1">
                                    <ArrowDownRight className="w-3.5 h-3.5" /> Total Inflow
                                </div>
                                <div className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                                    +{totalInflow.toLocaleString()}{" "}
                                    <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">pcs</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Pur: {purchasePcs} | Ret: {saleReturnPcs}
                                </div>
                            </div>

                            {/* Outflow */}
                            <div className="p-3 rounded-lg border border-rose-200/80 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-800/40">
                                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-xs font-medium mb-1">
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Total Outflow
                                </div>
                                <div className="text-base font-bold text-rose-900 dark:text-rose-200">
                                    -{totalOutflow.toLocaleString()}{" "}
                                    <span className="text-[11px] font-normal text-rose-600 dark:text-rose-400">pcs</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Sales: {salePcs} | Ret: {purchaseReturnPcs}
                                </div>
                            </div>

                            {/* Net Movement */}
                            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
                                <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 text-xs font-medium mb-1">
                                    <Scale className="w-3.5 h-3.5" /> Net Impact
                                </div>
                                <div className={`text-base font-bold ${netMovement >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                    {netMovement > 0 ? `+${netMovement.toLocaleString()}` : netMovement.toLocaleString()}{" "}
                                    <span className="text-[11px] font-normal text-zinc-500">pcs</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Movement balance
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Opening Stock Input Section */}
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-amber-500" />
                                Opening Stock Baseline
                            </Label>
                            {netMovement < 0 && !isReconciled && (
                                <button
                                    type="button"
                                    onClick={handleAutoFillBreakEven}
                                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 transition-colors"
                                >
                                    <Sparkles className="w-3 h-3" /> Auto-fill break even
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="stock1" className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Full Cartons ({packing} pcs/carton)
                                </Label>
                                <Input
                                    id="stock1"
                                    type="number"
                                    min={0}
                                    value={stock1}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleStock1Change(e.target.value)}
                                    className="mt-1 font-semibold text-base"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label htmlFor="stock2" className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Loose Pieces
                                </Label>
                                <Input
                                    id="stock2"
                                    type="number"
                                    min={0}
                                    value={stock2}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleStock2Change(e.target.value)}
                                    className="mt-1 font-semibold text-base"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                            <span>Total Opening Units:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                ({parsedStock1} × {packing}) + {parsedStock2} = <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{totalOpeningPcs.toLocaleString()}</span> pcs
                            </span>
                        </div>
                    </div>

                    {/* 3. Live Reconciliation Banner */}
                    <div className={`p-4 rounded-xl border transition-all ${
                        isReconciled
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60"
                            : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60"
                    }`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                                {isReconciled ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${
                                            isReconciled ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"
                                        }`}>
                                            {isReconciled ? "100% Reconciled" : "Stock Deficit"}
                                        </span>
                                        <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${
                                            isReconciled
                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                : "bg-rose-600 text-white hover:bg-rose-700"
                                        }`}>
                                            {isReconciled ? "Balanced" : "Negative Balance"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                        {isReconciled
                                            ? "Opening stock baseline successfully backs all historical transaction activity."
                                            : `Total sales exceed available inventory by ${Math.abs(liveAvailablePcs)} pieces. Increase opening stock.`}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <div className="text-[10px] uppercase font-bold text-zinc-500">Live Available</div>
                                <div className={`text-lg font-mono font-extrabold ${
                                    isReconciled ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                                }`}>
                                    {availFull}F | {availLoose}P
                                </div>
                                <div className="text-[10px] text-zinc-500 font-medium">
                                    Total: {liveAvailablePcs.toLocaleString()} pcs
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={`font-semibold ${
                            isReconciled
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-amber-600 hover:bg-amber-700 text-white"
                        }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                {isReconciled ? "Confirm & Save (100% Reconciled)" : "Save Opening Stock"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

