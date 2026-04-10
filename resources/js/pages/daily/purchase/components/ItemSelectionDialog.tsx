import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Box, Search, Plus, Check, PackageSearch, X } from "lucide-react";

interface Item {
    id: number;
    title: string;
    short_name?: string;
    company?: string;
    trade_price?: number;
    retail?: number;
    retail_tp_diff?: number;
    packing_qty?: number;
    packing_full?: number;
    pcs?: number;
    gst_percent?: number;
    discount?: number;
    stock_1?: number;
    stock_2?: number;
    total_stock_pcs?: number;
    category?: string;
    last_purchase_rate?: number;
}

interface RowData {
    id: number;
    item_id: number | null;
    full: number;
    pcs: number;
    bonus_full: number;
    bonus_pcs: number;
    rate: number;
    discPercent: number;
    trade_price: number;
    amount: number;
    last_purchase_rate?: number;
}

interface ItemSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemSearch: string;
    setItemSearch: (search: string) => void;
    filteredItems: Item[];
    rows: RowData[];
    removeRow: (id: number) => void;
    addRow: () => void;
    handleSelectItem: (rowId: number, itemId: number) => void;
    setRows: React.Dispatch<React.SetStateAction<RowData[]>>;
}

const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
};

const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600";

export const ItemSelectionDialog: React.FC<ItemSelectionDialogProps> = ({
    open,
    onOpenChange,
    itemSearch,
    setItemSearch,
    filteredItems,
    rows,
    removeRow,
    addRow,
    handleSelectItem,
    setRows,
}) => {
    // Quantity Settings Tray State
    const [selectedItemForQty, setSelectedItemForQty] = useState<Item | null>(null);
    const [dialogFull, setDialogFull] = useState<number>(0);
    const [dialogPcs, setDialogPcs] = useState<number>(0);
    const [dialogBonusFull, setDialogBonusFull] = useState<number>(0);
    const [dialogBonusPcs, setDialogBonusPcs] = useState<number>(0);
    const [dialogRate, setDialogRate] = useState<number>(0);

    const handleItemClick = (item: Item) => {
        setSelectedItemForQty(item);

        const existing = rows.find(r => r.item_id === item.id);
        if (existing) {
            setDialogFull(toNumber(existing.full));
            setDialogPcs(toNumber(existing.pcs));
            setDialogBonusFull(toNumber(existing.bonus_full));
            setDialogBonusPcs(toNumber(existing.bonus_pcs));
            setDialogRate(toNumber(existing.rate));
        } else {
            setDialogFull(0);
            setDialogPcs(0);
            setDialogBonusFull(0);
            setDialogBonusPcs(0);
            
            // Priority: item.last_purchase_rate > item.trade_price
            const defaultRate = toNumber(item.last_purchase_rate) > 0 
                ? toNumber(item.last_purchase_rate) 
                : toNumber(item.trade_price);
            setDialogRate(defaultRate);
        }
    };

    const handleCommit = () => {
        if (!selectedItemForQty) return;

        const itemId = selectedItemForQty.id;
        const existingRow = rows.find(r => r.item_id === itemId);

        if (existingRow) {
            setRows(prev => prev.map(r => r.id === existingRow.id ? {
                ...r,
                full: dialogFull,
                pcs: dialogPcs,
                bonus_full: dialogBonusFull,
                bonus_pcs: dialogBonusPcs,
                rate: dialogRate,
                amount: 0 // Will be recalculated by parent
            } : r));
        } else {
            const emptyRow = rows.find(r => r.item_id === null);
            if (emptyRow) {
                setRows(prev => prev.map(r => r.id === emptyRow.id ? {
                    ...r,
                    item_id: itemId,
                    full: dialogFull,
                    pcs: dialogPcs,
                    bonus_full: dialogBonusFull,
                    bonus_pcs: dialogBonusPcs,
                    rate: dialogRate,
                    discPercent: toNumber(selectedItemForQty.discount),
                    trade_price: toNumber(selectedItemForQty.trade_price),
                    amount: 0
                } : r));
            } else {
                setRows(prev => [
                    ...prev,
                    {
                        id: Date.now() + Math.random(),
                        item_id: itemId,
                        full: dialogFull,
                        pcs: dialogPcs,
                        bonus_full: dialogBonusFull,
                        bonus_pcs: dialogBonusPcs,
                        rate: dialogRate,
                        discPercent: toNumber(selectedItemForQty.discount),
                        trade_price: toNumber(selectedItemForQty.trade_price),
                        amount: 0,
                        last_purchase_rate: 0
                    }
                ]);
            }
        }
        setSelectedItemForQty(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[99vw] md:max-w-5xl w-full md:w-[1000px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl flex flex-col max-h-[90vh]">
                <div className={`p-6 ${ACCENT_GRADIENT} text-white shrink-0`}>
                    <DialogTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                        <Box className="w-6 h-6" /> Item Registry
                    </DialogTitle>
                    <DialogDescription className="text-orange-100/70 font-bold uppercase text-[10px] tracking-widest mt-1">
                        Select an active SKU to assign to row sequence
                    </DialogDescription>

                    <div className="mt-4 relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" size={18} />
                        <Input
                            placeholder="Search by Title, ID, or Category..."
                            value={itemSearch}
                            onChange={(e) => setItemSearch(e.target.value)}
                            className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-0 focus:bg-white/20 transition-all rounded-xl border-2 font-bold"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto min-h-0 relative">
                    <div className="hidden md:grid grid-cols-12 bg-zinc-100 dark:bg-zinc-900 px-6 py-3 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="col-span-1 text-[9px] font-black uppercase text-zinc-500">Code</div>
                        <div className="col-span-5 text-[9px] font-black uppercase text-zinc-500">Registry Title</div>
                        <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-500">Trade Price</div>
                        <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-500">Avg Price</div>
                        <div className="col-span-2 text-right text-[9px] font-black uppercase text-zinc-500">System Inventory</div>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filteredItems.length > 0 ? filteredItems.map((item) => {
                            const tradePrice = toNumber(item.trade_price);
                            const avgPrice = (toNumber(item.trade_price) + toNumber(item.retail)) / 2;
                            const isSelected = rows.some(r => r.item_id === item.id);

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`w-full text-left transition-colors p-2 group border-l-4 ${isSelected
                                        ? "bg-orange-50/50 dark:bg-orange-900/20 border-orange-500"
                                        : "bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent hover:border-orange-300"
                                        }`}
                                >
                                    <div className="hidden md:grid grid-cols-12 items-center py-1">
                                        <div className="col-span-1 pl-2">
                                            <span className={`font-mono font-black text-xs ${isSelected ? 'text-orange-600' : 'text-zinc-400'}`}>
                                                #{String(item.id).padStart(4, '0')}
                                            </span>
                                        </div>
                                        <div className="col-span-5 flex flex-col justify-center">
                                            <div className={`font-black uppercase tracking-tight truncate text-base ${isSelected ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-100'}`}>
                                                {item.title}
                                            </div>
                                            <div className="text-[11px] flex items-center gap-2 mt-0.5">
                                                <span className="text-zinc-500 dark:text-zinc-400 font-mono tracking-tighter truncate">{item.short_name || 'Generic SKU'}</span>
                                                {item.category && <span className="px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider">{item.category}</span>}
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <div className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                                                <span className="text-[10px] text-zinc-400 mr-1 font-semibold">Rs</span>
                                                {tradePrice.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                            {avgPrice.toFixed(0)}
                                        </div>
                                        <div className="col-span-2 text-right pr-4 font-mono text-xs font-black text-emerald-600">
                                            {item.stock_1 ? `${item.stock_1} units` : '0 units'}
                                        </div>
                                    </div>

                                    {/* Mobile View Item */}
                                    <div className="md:hidden flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <div className={`font-black uppercase tracking-tight text-sm ${isSelected ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-100'}`}>{item.title}</div>
                                            <div className="text-[10px] text-zinc-400">#{item.id} | TP: {tradePrice}</div>
                                        </div>
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isSelected ? 'bg-orange-600 border-orange-600 shadow-lg text-white' : 'border-zinc-200 text-zinc-300'}`}>
                                            {isSelected ? <Check size={16} /> : <Plus size={16} />}
                                        </div>
                                    </div>
                                </button>
                            );
                        }) : (
                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                <PackageSearch className="w-12 h-12 text-zinc-200" />
                                <div className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Matches Found</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest shrink-0">
                    <span>Showing {filteredItems.length} entries</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 px-4 font-black text-[10px] uppercase tracking-widest rounded-lg">Cancel</Button>
                        <Button size="sm" onClick={() => onOpenChange(false)} className={`${ACCENT_GRADIENT} text-white font-black text-[10px] uppercase tracking-widest rounded-lg px-6`}>OK</Button>
                    </div>
                </div>

                {/* Quantity Settings Tray */}
                <AnimatePresence>
                    {selectedItemForQty && (
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            className="absolute inset-x-0 bottom-0 p-8 bg-white dark:bg-zinc-950 backdrop-blur-xl border-t-2 border-orange-500 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] flex items-center gap-10 z-[100]"
                        >
                            <button
                                onClick={() => setSelectedItemForQty(null)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-all outline-none"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>

                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-1 block">Configuring Row</span>
                                <h3 className="text-3xl font-black text-zinc-900 dark:text-white truncate leading-tight uppercase tracking-tighter italic">
                                    {selectedItemForQty.title}
                                </h3>
                                <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-400 uppercase tracking-[0.1em]">
                                    Node ID: #{String(selectedItemForQty.id).padStart(4, '0')} | P: {selectedItemForQty.packing_qty || 1}
                                </div>
                            </div>

                            <div className="flex gap-3 items-end overflow-x-auto no-scrollbar pb-2">
                                <div className="flex flex-col gap-1 items-center">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Full</span>
                                    <Input
                                        type="number"
                                        value={dialogFull || ""}
                                        onChange={e => setDialogFull(toNumber(e.target.value))}
                                        className="w-16 h-12 text-center text-xl font-black rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-orange-500 transition-all shadow-inner"
                                        autoFocus
                                    />
                                </div>

                                {toNumber(selectedItemForQty.packing_qty || 1) > 1 && (
                                    <div className="flex flex-col gap-1 items-center animate-in fade-in slide-in-from-bottom-2">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Pcs</span>
                                        <Input
                                            type="number"
                                            value={dialogPcs || ""}
                                            onChange={e => setDialogPcs(toNumber(e.target.value))}
                                            className="w-16 h-12 text-center text-xl font-black rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-orange-500 transition-all shadow-inner"
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col gap-1 items-center">
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">B.Full</span>
                                    <Input
                                        type="number"
                                        value={dialogBonusFull || ""}
                                        onChange={e => setDialogBonusFull(toNumber(e.target.value))}
                                        className="w-16 h-12 text-center text-xl font-black rounded-xl border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10 text-amber-600 focus:ring-amber-500 transition-all shadow-inner"
                                    />
                                </div>

                                {toNumber(selectedItemForQty.packing_qty || 1) > 1 && (
                                    <div className="flex flex-col gap-1 items-center animate-in fade-in slide-in-from-bottom-2">
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">B.Pcs</span>
                                        <Input
                                            type="number"
                                            value={dialogBonusPcs || ""}
                                            onChange={e => setDialogBonusPcs(toNumber(e.target.value))}
                                            className="w-16 h-12 text-center text-xl font-black rounded-xl border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10 text-amber-600 focus:ring-amber-500 transition-all shadow-inner"
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col gap-1 items-center">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Rate (Rs)</span>
                                    <Input
                                        type="number"
                                        value={dialogRate || ""}
                                        onChange={e => setDialogRate(toNumber(e.target.value))}
                                        className="w-28 h-12 text-center text-xl font-black rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-orange-600 focus:ring-orange-500 transition-all shadow-inner"
                                    />
                                </div>

                                <Button
                                    onClick={handleCommit}
                                    className="h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all ml-2"
                                >
                                    Sync Node
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};
