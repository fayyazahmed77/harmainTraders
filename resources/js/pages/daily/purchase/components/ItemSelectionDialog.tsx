import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Box, Search, Plus, Check, PackageSearch, X, Layers, History, Calendar, Building2, TrendingUp, ShieldCheck } from "lucide-react";

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
    last_purchase_date?: string;
    last_supplier_name?: string;
    last_purchase_qty_full?: number;
    last_purchase_qty_pcs?: number;
    last_purchase_total?: number;
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
    // Keyboard Navigation & Focus States
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [selectedItemForQty, setSelectedItemForQty] = useState<Item | null>(null);

    const [dialogFull, setDialogFull] = useState<number>(0);
    const [dialogPcs, setDialogPcs] = useState<number>(0);
    const [dialogBonusFull, setDialogBonusFull] = useState<number>(0);
    const [dialogBonusPcs, setDialogBonusPcs] = useState<number>(0);
    const [dialogRate, setDialogRate] = useState<number>(0);
    const [dialogDiscount, setDialogDiscount] = useState<number>(0);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const fullInputRef = useRef<HTMLInputElement>(null);
    const pcsInputRef = useRef<HTMLInputElement>(null);
    const bFullInputRef = useRef<HTMLInputElement>(null);
    const bPcsInputRef = useRef<HTMLInputElement>(null);
    const rateInputRef = useRef<HTMLInputElement>(null);
    const discountInputRef = useRef<HTMLInputElement>(null);
    const syncButtonRef = useRef<HTMLButtonElement>(null);

    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Reset keyboard selection index when items or open state changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [itemSearch, open]);

    // Auto-scroll focused item into view
    useEffect(() => {
        if (itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex]);

    // Auto-focus quantity input when tray opens
    useEffect(() => {
        if (selectedItemForQty) {
            setTimeout(() => {
                fullInputRef.current?.focus();
                fullInputRef.current?.select();
            }, 50);
        } else {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [selectedItemForQty]);

    const handleItemClick = (item: Item) => {
        setSelectedItemForQty(item);

        const existing = rows.find(r => r.item_id === item.id);
        if (existing) {
            setDialogFull(toNumber(existing.full));
            setDialogPcs(toNumber(existing.pcs));
            setDialogBonusFull(toNumber(existing.bonus_full));
            setDialogBonusPcs(toNumber(existing.bonus_pcs));
            setDialogRate(toNumber(existing.rate));
            setDialogDiscount(toNumber(existing.discPercent));
        } else {
            setDialogFull(0);
            setDialogPcs(0);
            setDialogBonusFull(0);
            setDialogBonusPcs(0);
            setDialogDiscount(toNumber(item.discount || 0));
            
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

        const effectiveLastRate = toNumber(selectedItemForQty.last_purchase_rate) > 0
            ? toNumber(selectedItemForQty.last_purchase_rate)
            : toNumber(selectedItemForQty.trade_price);

        if (existingRow) {
            setRows(prev => prev.map(r => r.id === existingRow.id ? {
                ...r,
                full: dialogFull,
                pcs: dialogPcs,
                bonus_full: dialogBonusFull,
                bonus_pcs: dialogBonusPcs,
                rate: dialogRate,
                discPercent: dialogDiscount,
                amount: 0,
                last_purchase_rate: effectiveLastRate
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
                    discPercent: dialogDiscount,
                    trade_price: toNumber(selectedItemForQty.trade_price),
                    amount: 0,
                    last_purchase_rate: effectiveLastRate
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
                        discPercent: dialogDiscount,
                        trade_price: toNumber(selectedItemForQty.trade_price),
                        amount: 0,
                        last_purchase_rate: effectiveLastRate
                    }
                ]);
            }
        }
        setSelectedItemForQty(null);
        setItemSearch("");
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (selectedItemForQty) {
            if (e.key === 'Escape') {
                e.preventDefault();
                setSelectedItemForQty(null);
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems.length > 0 && selectedIndex >= 0 && selectedIndex < filteredItems.length) {
                handleItemClick(filteredItems[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onOpenChange(false);
        }
    };

    // Quantity Input Tab & Key Handlers
    const handleFullKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            discountInputRef.current?.focus();
            discountInputRef.current?.select();
        }
    };

    const handlePcsKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            fullInputRef.current?.focus();
            fullInputRef.current?.select();
        }
    };

    const handleBFullKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            if (pcsInputRef.current) {
                pcsInputRef.current.focus();
                pcsInputRef.current.select();
            } else {
                fullInputRef.current?.focus();
                fullInputRef.current?.select();
            }
        }
    };

    const handleBPcsKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            bFullInputRef.current?.focus();
            bFullInputRef.current?.select();
        }
    };

    const handleRateKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            if (bPcsInputRef.current) {
                bPcsInputRef.current.focus();
                bPcsInputRef.current.select();
            } else {
                bFullInputRef.current?.focus();
                bFullInputRef.current?.select();
            }
        }
    };

    const handleDiscountKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            syncButtonRef.current?.focus();
        } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            rateInputRef.current?.focus();
            rateInputRef.current?.select();
        }
    };

    const handleSyncButtonKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            discountInputRef.current?.focus();
            discountInputRef.current?.select();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                onKeyDown={handleKeyDown}
                className={`max-w-[99vw] sm:max-w-none p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl flex flex-col h-[90vh] transition-all duration-300 ${
                    selectedItemForQty ? 'md:max-w-7xl md:w-[1250px]' : 'md:max-w-5xl md:w-[980px]'
                }`}
            >
                {/* Header with Title & Search Inline */}
                <div className={`px-6 py-3.5 pr-16 ${ACCENT_GRADIENT} text-white shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 relative border-b border-orange-600/30`}>
                    <div>
                        <DialogTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2.5">
                            <Box className="w-5 h-5" /> Item Registry
                        </DialogTitle>
                        <DialogDescription className="text-orange-100/80 font-bold uppercase text-[9px] tracking-widest mt-0.5">
                            Select an active SKU to assign to row sequence
                        </DialogDescription>
                    </div>

                    <div className="relative group w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-white transition-colors" size={16} />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search by Title, ID, or Category..."
                            value={itemSearch}
                            onChange={(e) => {
                                setItemSearch(e.target.value);
                                setSelectedIndex(0);
                            }}
                            className="pl-9 h-9 bg-white/15 border-white/30 text-white placeholder:text-white/50 focus:ring-0 focus:bg-white/25 transition-all rounded-xl border font-bold text-xs"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Main Content Split (Left Table + Right Side Info Panel) */}
                <div className="flex-1 flex overflow-hidden min-h-0 relative bg-zinc-50 dark:bg-zinc-950">
                    {/* Left Column: Table & Bottom Controls */}
                    <div className="flex-1 min-w-0 flex flex-col relative">
                        {/* Table Header & Rows */}
                        <div className="flex-1 overflow-auto min-h-0 relative">
                            <div className="hidden md:grid grid-cols-12 bg-zinc-100 dark:bg-zinc-900 px-6 py-2.5 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 shadow-xs">
                                <div className="col-span-1 text-[9px] font-black uppercase tracking-wider text-zinc-500">Code</div>
                                <div className="col-span-5 text-[9px] font-black uppercase tracking-wider text-zinc-500">Registry Title</div>
                                <div className="col-span-2 text-center text-[9px] font-black uppercase tracking-wider text-zinc-500">Trade Price</div>
                                <div className="col-span-2 text-center text-[9px] font-black uppercase tracking-wider text-zinc-500">Avg Price</div>
                                <div className="col-span-2 text-right text-[9px] font-black uppercase tracking-wider text-zinc-500">System Inventory</div>
                            </div>

                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {filteredItems.length > 0 ? filteredItems.map((item, idx) => {
                                    const tradePrice = toNumber(item.trade_price);
                                    const avgPrice = (toNumber(item.trade_price) + toNumber(item.retail)) / 2;
                                    const isSelected = rows.some(r => r.item_id === item.id);
                                    const isFocused = idx === selectedIndex;

                                    return (
                                        <button
                                            key={item.id}
                                            ref={el => { itemRefs.current[idx] = el; }}
                                            onClick={() => handleItemClick(item)}
                                            className={`w-full text-left transition-all px-4 py-2.5 group border-l-4 ${
                                                isSelected
                                                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-500"
                                                    : isFocused
                                                        ? "bg-orange-100/80 dark:bg-orange-950/40 border-orange-400 ring-1 ring-orange-400/50"
                                                        : "bg-transparent hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 border-transparent hover:border-orange-300"
                                                }`}
                                        >
                                            <div className="hidden md:grid grid-cols-12 items-center py-0.5">
                                                <div className="col-span-1 pl-1">
                                                    <span className={`font-mono font-black text-xs ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : isFocused ? 'text-orange-600' : 'text-zinc-400'}`}>
                                                        #{String(item.id).padStart(4, '0')}
                                                    </span>
                                                </div>
                                                <div className="col-span-5 flex items-center gap-2">
                                                    <span className={`font-black uppercase tracking-tight truncate text-sm ${
                                                        isSelected ? 'text-emerald-800 dark:text-emerald-300' : isFocused ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-100'
                                                    }`}>
                                                        {item.title}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[9px] font-black uppercase tracking-wider shadow-2xs shrink-0">
                                                            <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                                            Synced
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <div className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                                                        <span className="text-[9px] text-zinc-400 mr-1 font-semibold">Rs</span>
                                                        {tradePrice.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-center font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                                    {avgPrice.toFixed(0)}
                                                </div>
                                                <div className="col-span-2 text-right pr-2 font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                    {item.stock_1 ? `${item.stock_1} units` : '0 units'}
                                                </div>
                                            </div>

                                            {/* Mobile View Item */}
                                            <div className="md:hidden flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-black uppercase tracking-tight text-sm ${isSelected ? 'text-emerald-700' : isFocused ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-100'}`}>{item.title}</span>
                                                        {isSelected && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">
                                                                <Check className="w-2.5 h-2.5 stroke-[3]" /> Synced
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400">#{item.id} | TP: {tradePrice}</div>
                                                </div>
                                                <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-200 text-zinc-300'}`}>
                                                    {isSelected ? <Check size={14} /> : <Plus size={14} />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }) : (
                                    <div className="p-12 text-center flex flex-col items-center gap-3">
                                        <PackageSearch className="w-12 h-12 text-zinc-200 dark:text-zinc-700" />
                                        <div className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Matches Found</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Dock: Either Sync Node Bar OR Footer Status Bar (Displayed One At A Time) */}
                        {selectedItemForQty ? (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="p-3 bg-white dark:bg-zinc-900 border-t-2 border-orange-500 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0 z-20"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                                    <span className="text-xs font-black uppercase tracking-wide truncate max-w-[180px]">
                                        {selectedItemForQty.title}
                                    </span>
                                </div>

                                <div className="flex gap-2 items-end overflow-x-auto no-scrollbar">
                                    <div className="flex flex-col gap-0.5 items-center">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Full</span>
                                        <Input
                                            ref={fullInputRef}
                                            type="number"
                                            value={dialogFull || ""}
                                            onChange={e => setDialogFull(toNumber(e.target.value))}
                                            onKeyDown={handleFullKeyDown}
                                            className="w-16 h-8 text-center text-sm font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-orange-500 transition-all"
                                        />
                                    </div>

                                    {toNumber(selectedItemForQty.packing_qty || 1) > 1 && (
                                        <div className="flex flex-col gap-0.5 items-center">
                                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Pcs</span>
                                            <Input
                                                ref={pcsInputRef}
                                                type="number"
                                                value={dialogPcs || ""}
                                                onChange={e => setDialogPcs(toNumber(e.target.value))}
                                                onKeyDown={handlePcsKeyDown}
                                                className="w-16 h-8 text-center text-sm font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-orange-500 transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-0.5 items-center">
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">B.Full</span>
                                        <Input
                                            ref={bFullInputRef}
                                            type="number"
                                            value={dialogBonusFull || ""}
                                            onChange={e => setDialogBonusFull(toNumber(e.target.value))}
                                            onKeyDown={handleBFullKeyDown}
                                            className="w-16 h-8 text-center text-sm font-black rounded-lg border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10 text-amber-600 focus:ring-amber-500 transition-all"
                                        />
                                    </div>

                                    {toNumber(selectedItemForQty.packing_qty || 1) > 1 && (
                                        <div className="flex flex-col gap-0.5 items-center">
                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">B.Pcs</span>
                                            <Input
                                                ref={bPcsInputRef}
                                                type="number"
                                                value={dialogBonusPcs || ""}
                                                onChange={e => setDialogBonusPcs(toNumber(e.target.value))}
                                                onKeyDown={handleBPcsKeyDown}
                                                className="w-16 h-8 text-center text-sm font-black rounded-lg border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10 text-amber-600 focus:ring-amber-500 transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-0.5 items-center">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Rate (Rs)</span>
                                        <Input
                                            ref={rateInputRef}
                                            type="number"
                                            value={dialogRate || ""}
                                            onChange={e => setDialogRate(toNumber(e.target.value))}
                                            onKeyDown={handleRateKeyDown}
                                            className="w-20 h-8 text-center text-sm font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-orange-600 focus:ring-orange-500 transition-all"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-0.5 items-center">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Disc (%)</span>
                                        <Input
                                            ref={discountInputRef}
                                            type="number"
                                            value={dialogDiscount || ""}
                                            onChange={e => setDialogDiscount(toNumber(e.target.value))}
                                            onKeyDown={handleDiscountKeyDown}
                                            className="w-16 h-8 text-center text-sm font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-orange-600 focus:ring-orange-500 transition-all"
                                        />
                                    </div>

                                    <Button
                                        ref={syncButtonRef}
                                        onClick={handleCommit}
                                        onKeyDown={handleSyncButtonKeyDown}
                                        className="h-8 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-md active:scale-95 transition-all ml-1"
                                    >
                                        Sync Node
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedItemForQty(null);
                                            setTimeout(() => searchInputRef.current?.focus(), 50);
                                        }}
                                        className="h-8 px-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                        title="Cancel Selection"
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            /* Default Footer Status Bar */
                            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest shrink-0">
                                <span>Showing {filteredItems.length} entries (Use ↑ ↓ Enter)</span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 px-4 font-black text-[10px] uppercase tracking-widest rounded-lg">Cancel</Button>
                                    <Button size="sm" onClick={() => onOpenChange(false)} className={`${ACCENT_GRADIENT} text-white font-black text-[10px] uppercase tracking-widest rounded-lg px-6`}>OK</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Redesigned Dual-Theme ERP Right Panel */}
                    <AnimatePresence>
                        {selectedItemForQty && (
                            <motion.div
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 300, opacity: 0 }}
                                transition={{ type: "spring", damping: 26, stiffness: 260 }}
                                className="w-full lg:w-[320px] xl:w-[340px] shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 flex flex-col p-3.5 gap-3 overflow-y-auto z-20 shadow-xl relative"
                            >
                                {/* Header Card */}
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-zinc-800 dark:to-zinc-900 border border-orange-600/30 dark:border-zinc-700/80 rounded-xl shadow-md flex flex-col gap-2 relative overflow-hidden text-white">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 bg-white/20 dark:bg-orange-500/20 text-white dark:text-orange-400 border border-white/30 dark:border-orange-500/30 rounded font-mono font-black text-[10px]">
                                            #{String(selectedItemForQty.id).padStart(4, '0')}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 dark:bg-emerald-500/10 text-white dark:text-emerald-400 border border-white/30 dark:border-emerald-500/20 rounded-full text-[9px] font-black uppercase">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-emerald-400 animate-pulse" />
                                            {selectedItemForQty.stock_1 ? `${selectedItemForQty.stock_1} In Stock` : '0 Stock'}
                                        </span>
                                    </div>
                                    <h3 className="font-black uppercase text-sm tracking-tight leading-snug text-white line-clamp-2 mt-0.5">
                                        {selectedItemForQty.title}
                                    </h3>
                                    <div className="flex items-center justify-between pt-2 border-t border-orange-400/30 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-orange-100/90 dark:text-zinc-400">
                                        <span>VEND / SUPPLIER</span>
                                        <span className="px-2 py-0.5 bg-white text-orange-600 dark:bg-zinc-800 dark:text-zinc-200 rounded font-mono font-black text-xs border border-orange-200 dark:border-zinc-700 shadow-2xs">
                                            {selectedItemForQty.company || selectedItemForQty.category || '64'}
                                        </span>
                                    </div>
                                </div>

                                {/* Stock & Pricing Details Section */}
                                <div className="flex flex-col gap-2 bg-zinc-50 dark:bg-zinc-950/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5 text-orange-500" /> Stock & Pricing Metrics
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-2xs">
                                            <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">PACKING</span>
                                            <div className="mt-1 flex items-baseline gap-1">
                                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono">{selectedItemForQty.packing_qty || 1}</span>
                                                <span className="text-[9px] text-zinc-400 font-bold">pc/box</span>
                                            </div>
                                        </div>

                                        <div className="p-2 bg-orange-50/50 dark:bg-zinc-900 rounded-lg border border-orange-200/80 dark:border-orange-900/40 flex flex-col justify-between shadow-2xs">
                                            <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">STOCK FULL</span>
                                            <div className="mt-1 flex items-baseline gap-1">
                                                <span className="text-sm font-black text-orange-600 dark:text-orange-400 font-mono">{selectedItemForQty.stock_1 || 0}</span>
                                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">full</span>
                                            </div>
                                        </div>

                                        <div className="p-2 bg-orange-50/50 dark:bg-zinc-900 rounded-lg border border-orange-200/80 dark:border-orange-900/40 flex flex-col justify-between shadow-2xs">
                                            <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">STOCK PCS</span>
                                            <div className="mt-1 flex items-baseline gap-1">
                                                <span className="text-sm font-black text-orange-600 dark:text-orange-400 font-mono">{selectedItemForQty.stock_2 || 0}</span>
                                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">pcs</span>
                                            </div>
                                        </div>

                                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-2xs">
                                            <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">TRADE RATE</span>
                                            <div className="mt-1 flex items-baseline gap-0.5">
                                                <span className="text-[9px] text-zinc-400 font-bold">Rs</span>
                                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono">{toNumber(selectedItemForQty.trade_price).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-2xs">
                                            <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">RETAIL RATE</span>
                                            <div className="mt-1 flex items-baseline gap-0.5">
                                                <span className="text-[9px] text-zinc-400 font-bold">Rs</span>
                                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono">{toNumber(selectedItemForQty.retail).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-2xs">
                                            <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">AVERAGE</span>
                                            <div className="mt-1 flex items-baseline gap-0.5">
                                                <span className="text-[9px] text-zinc-400 font-bold">Rs</span>
                                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono">{((toNumber(selectedItemForQty.trade_price) + toNumber(selectedItemForQty.retail)) / 2).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing History Log Table Card */}
                                <div className="flex flex-col gap-2 bg-zinc-50 dark:bg-zinc-950/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <History className="w-3.5 h-3.5 text-orange-500" /> Audit Pricing History
                                        </span>
                                    </div>

                                    <div className="flex flex-col divide-y divide-zinc-200/80 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900/90 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                                        <div className="flex items-center justify-between p-2">
                                            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase flex items-center gap-1">
                                                <Calendar size={12} /> Date
                                            </span>
                                            <span className="text-zinc-800 dark:text-zinc-200 font-mono font-black">{selectedItemForQty.last_purchase_date || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2">
                                            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase flex items-center gap-1">
                                                <Building2 size={12} /> Supplier
                                            </span>
                                            <span className="text-orange-600 dark:text-orange-400 font-black">{selectedItemForQty.last_supplier_name || selectedItemForQty.company || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2">
                                            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase flex items-center gap-1">
                                                <Layers size={12} /> Last Qty
                                            </span>
                                            <span className="text-zinc-800 dark:text-zinc-200 font-mono font-black">{selectedItemForQty.last_purchase_qty_full || 0} Full / {selectedItemForQty.last_purchase_qty_pcs || 0} Pcs</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                            <span className="text-amber-600 dark:text-amber-400/80 text-[10px] font-black uppercase flex items-center gap-1">
                                                <TrendingUp size={12} /> Last Rate
                                            </span>
                                            <span className="font-mono font-black">Rs {toNumber(selectedItemForQty.last_purchase_rate || selectedItemForQty.trade_price).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                            <span className="text-emerald-600 dark:text-emerald-400/80 text-[10px] font-black uppercase flex items-center gap-1">
                                                <ShieldCheck size={12} /> Total Spend
                                            </span>
                                            <span className="font-mono font-black">Rs {toNumber(selectedItemForQty.last_purchase_total || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
};

