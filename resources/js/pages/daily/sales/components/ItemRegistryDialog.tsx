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
import {
    Box,
    Search,
    Plus,
    Check,
    PackageSearch,
    X,
    Layers,
    CalendarDays,
    Banknote,
    MapPin,
    Info,
    ArrowUpRight,
    CheckCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Item {
    id: number;
    code?: string;
    title: string;
    short_name?: string;
    company?: string;
    category?: string;
    trade_price?: number;
    retail?: number;
    packing_qty?: number;
    packing_full?: number;
    pcs?: number;
    shelf?: string;
    scheme?: string;
    scheme2?: string;
    gst_percent?: number;
    discount?: number;
    total_stock_pcs?: number;
    pt2?: number; pt3?: number; pt4?: number; pt5?: number; pt6?: number; pt7?: number;
    last_purchase_date?: string;
    last_purchase_full?: number;
    last_purchase_pcs?: number;
    last_purchase_rate?: number;
    last_supplier?: string;
}

interface ItemRegistryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: Item[];
    customerCategory: string | null;
    currentRows: any[];
    onAddUpdate: (item: Item, data: { full: number; pcs: number; bonus_full: number; bonus_pcs: number; rate: number; discPercent: number }) => void;
}

const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
};

const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600";

export const ItemRegistryDialog: React.FC<ItemRegistryDialogProps> = ({
    open,
    onOpenChange,
    items,
    customerCategory,
    currentRows,
    onAddUpdate,
}) => {
    const [itemSearch, setItemSearch] = useState("");
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
    const addButtonRef = useRef<HTMLButtonElement>(null);

    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const filteredItems = useMemo(() => {
        const q = itemSearch.toLowerCase();
        const filtered = items.filter((it) =>
            it.title.toLowerCase().includes(q) ||
            (it.short_name?.toLowerCase().includes(q)) ||
            (it.category?.toLowerCase().includes(q)) ||
            (it.code?.toLowerCase().includes(q)) ||
            String(it.id).includes(q)
        );
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
    }, [items, itemSearch]);

    // Active item for telemetry display (either quantity tray item or keyboard focused item)
    const activeDisplayItem = selectedItemForQty || filteredItems[selectedIndex] || null;

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

    // Keyboard shortcut to open dialog on F2
    useEffect(() => {
        const handleF2Key = (e: KeyboardEvent) => {
            if (e.key === "F2") {
                e.preventDefault();
                onOpenChange(true);
            }
        };
        window.addEventListener("keydown", handleF2Key);
        return () => window.removeEventListener("keydown", handleF2Key);
    }, [onOpenChange]);

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

        const existing = currentRows.find(r => r.item_id === item.id);

        let tpVal = toNumber(item.trade_price);
        if (customerCategory && customerCategory !== "1") {
            const priceKey = `pt${customerCategory}` as keyof Item;
            const percentage = toNumber(item[priceKey]);
            if (percentage !== 0) tpVal = Math.round(tpVal * (1 + percentage / 100));
        }

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
            setDialogRate(tpVal);
            setDialogDiscount(toNumber(item.discount || 0));
        }
    };

    const handleCommit = () => {
        if (!selectedItemForQty) return;

        onAddUpdate(selectedItemForQty, {
            full: dialogFull,
            pcs: dialogPcs,
            bonus_full: dialogBonusFull,
            bonus_pcs: dialogBonusPcs,
            rate: dialogRate,
            discPercent: dialogDiscount
        });

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

    // Quantity Input Keyboard Traversal Handlers (Tab, Shift+Tab, Enter, Escape)
    const hasLoosePcs = toNumber(selectedItemForQty?.packing_qty || 1) > 1;

    const handleFullKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                addButtonRef.current?.focus();
            } else {
                if (hasLoosePcs && pcsInputRef.current) {
                    pcsInputRef.current.focus();
                    pcsInputRef.current.select();
                } else if (discountInputRef.current) {
                    discountInputRef.current.focus();
                    discountInputRef.current.select();
                }
            }
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
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                fullInputRef.current?.focus();
                fullInputRef.current?.select();
            } else {
                if (discountInputRef.current) {
                    discountInputRef.current.focus();
                    discountInputRef.current.select();
                }
            }
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
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                if (hasLoosePcs && pcsInputRef.current) {
                    pcsInputRef.current.focus();
                    pcsInputRef.current.select();
                } else {
                    fullInputRef.current?.focus();
                    fullInputRef.current?.select();
                }
            } else {
                if (hasLoosePcs && bPcsInputRef.current) {
                    bPcsInputRef.current.focus();
                    bPcsInputRef.current.select();
                } else if (rateInputRef.current) {
                    rateInputRef.current.focus();
                    rateInputRef.current.select();
                }
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
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                bFullInputRef.current?.focus();
                bFullInputRef.current?.select();
            } else {
                rateInputRef.current?.focus();
                rateInputRef.current?.select();
            }
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
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                if (hasLoosePcs && bPcsInputRef.current) {
                    bPcsInputRef.current.focus();
                    bPcsInputRef.current.select();
                } else if (bFullInputRef.current) {
                    bFullInputRef.current.focus();
                    bFullInputRef.current.select();
                }
            } else {
                discountInputRef.current?.focus();
                discountInputRef.current?.select();
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
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                rateInputRef.current?.focus();
                rateInputRef.current?.select();
            } else {
                addButtonRef.current?.focus();
            }
        }
    };

    const handleAddButtonKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSelectedItemForQty(null);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                discountInputRef.current?.focus();
                discountInputRef.current?.select();
            } else {
                fullInputRef.current?.focus();
                fullInputRef.current?.select();
            }
        }
    };

    return (
        <TooltipProvider>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    onKeyDown={handleKeyDown}
                    className={`max-w-[99vw] sm:max-w-none p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl flex flex-col h-[90vh] transition-all duration-300 ${
                        selectedItemForQty ? 'md:max-w-7xl md:w-[1280px]' : 'md:max-w-5xl md:w-[980px]'
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
                                placeholder="Search by Title, ID, Code, or Category..."
                                value={itemSearch}
                                onChange={(e) => {
                                    setItemSearch(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                className="pl-9 pr-8 h-9 bg-white/15 border-white/30 text-white placeholder:text-white/50 focus:ring-0 focus:bg-white/25 transition-all rounded-xl border font-bold text-xs"
                                autoFocus
                            />
                            {itemSearch && (
                                <button
                                    onClick={() => setItemSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Content Split (Left Table + Right Side Telemetry Panel) */}
                    <div className="flex-1 flex overflow-hidden min-h-0 relative bg-zinc-50 dark:bg-zinc-950">
                        
                        {/* Left Column: Items Table */}
                        <div className="flex-1 min-w-0 flex flex-col relative border-r border-zinc-200 dark:border-zinc-800">
                            {/* Table Header */}
                            <div className="hidden md:grid grid-cols-12 bg-zinc-100 dark:bg-zinc-900 px-6 py-2.5 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 shadow-xs text-[9px] font-black uppercase tracking-wider text-zinc-500">
                                <div className="col-span-1">Code</div>
                                <div className="col-span-4">Registry Title</div>
                                <div className="col-span-2 text-center">Trade Price</div>
                                <div className="col-span-2 text-center text-orange-500 font-black">Active Rate</div>
                                <div className="col-span-1 text-center font-mono">Retail</div>
                                <div className="col-span-2 text-right">System Inventory</div>
                            </div>

                            {/* Table Body Rows */}
                            <div className={`flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-100 dark:divide-zinc-800/60 ${selectedItemForQty ? 'pb-20' : ''}`}>
                                {filteredItems.length > 0 ? filteredItems.map((item, idx) => {
                                    const stock = toNumber(item.total_stock_pcs);
                                    const packing = toNumber(item.packing_qty || 1);
                                    const full = Math.floor(stock / packing);
                                    const pcs = stock % packing;
                                    const isSelected = currentRows.some(r => r.item_id === item.id);
                                    const isFocused = idx === selectedIndex;

                                    let tpVal = toNumber(item.trade_price);
                                    if (customerCategory && customerCategory !== "1") {
                                        const p = toNumber(item[`pt${customerCategory}` as keyof Item]);
                                        if (p !== 0) tpVal = Math.round(tpVal * (1 + p / 100));
                                    }

                                    return (
                                        <button
                                            key={item.id}
                                            ref={el => { itemRefs.current[idx] = el; }}
                                            onClick={() => handleItemClick(item)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
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
                                                <div className="col-span-4 flex items-center gap-2 pr-2">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={`font-black uppercase tracking-tight truncate text-xs ${
                                                            isSelected ? 'text-emerald-800 dark:text-emerald-300' : isFocused ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-100'
                                                        }`}>
                                                            {item.title}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-400 font-mono italic truncate">
                                                            {item.short_name || item.category || 'SKU'}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[8px] font-black uppercase tracking-wider shrink-0">
                                                            <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                                            Added
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <div className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                                        <span className="text-[9px] text-zinc-400 mr-1">Rs</span>
                                                        {toNumber(item.trade_price).toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="col-span-2 flex justify-center">
                                                    <div className="px-3 py-1 rounded-md border border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black italic shadow-xs text-xs">
                                                        <span className="text-[9px] opacity-70 not-italic mr-0.5">Rs</span>{tpVal.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="col-span-1 text-center font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                                    {toNumber(item.retail).toFixed(0)}
                                                </div>
                                                <div className="col-span-2 text-right pr-2">
                                                    <div className={cn("font-mono text-xs font-black", stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                                                        {full}F / {pcs}P
                                                    </div>
                                                    <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Total: {stock} Pcs</div>
                                                </div>
                                            </div>

                                            {/* Mobile View Item */}
                                            <div className="md:hidden flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-black uppercase tracking-tight text-sm ${isSelected ? 'text-emerald-700' : isFocused ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-100'}`}>{item.title}</span>
                                                        {isSelected && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">
                                                                <Check className="w-2.5 h-2.5 stroke-[3]" /> Added
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400">#{item.id} | Active Rate: Rs {tpVal.toFixed(2)} | Stock: {stock}</div>
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

                            {/* Bottom Sync Configuration Tray (Scoped strictly to the Left Column) */}
                            <AnimatePresence>
                                {selectedItemForQty && (
                                    <motion.div
                                        initial={{ y: "100%", opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: "100%", opacity: 0 }}
                                        className="absolute inset-x-0 bottom-0 py-3.5 px-6 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-xl border-t-2 border-orange-500 shadow-[0_-20px_50px_rgba(0,0,0,0.25)] flex flex-wrap items-center justify-between gap-4 z-[100]"
                                    >
                                        <div className="flex-1 min-w-0 max-w-[280px]">
                                            <h3 className="text-lg font-black text-zinc-900 dark:text-white truncate leading-tight uppercase tracking-tight italic">
                                                {selectedItemForQty.title}
                                            </h3>
                                        </div>

                                        <div className="flex gap-2.5 p-1 items-end shrink-0">
                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">Full Units</span>
                                                <Input
                                                    ref={fullInputRef}
                                                    type="number"
                                                    value={dialogFull || ""}
                                                    onChange={e => setDialogFull(toNumber(e.target.value))}
                                                    onKeyDown={handleFullKeyDown}
                                                    className="w-20 sm:w-24 h-10 text-center text-base font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-orange-500 focus:ring-2 transition-all font-mono"
                                                />
                                            </div>

                                            {toNumber(selectedItemForQty.packing_qty || 1) > 1 && (
                                                <div className="flex flex-col gap-1 items-center animate-in fade-in slide-in-from-bottom-2">
                                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">Loose Pcs</span>
                                                    <Input
                                                        ref={pcsInputRef}
                                                        type="number"
                                                        value={dialogPcs || ""}
                                                        onChange={e => setDialogPcs(toNumber(e.target.value))}
                                                        onKeyDown={handlePcsKeyDown}
                                                        className="w-20 sm:w-24 h-10 text-center text-base font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-orange-500 focus:ring-2 transition-all font-mono"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">B. Full</span>
                                                <Input
                                                    ref={bFullInputRef}
                                                    type="number"
                                                    value={dialogBonusFull || ""}
                                                    onChange={e => setDialogBonusFull(toNumber(e.target.value))}
                                                    onKeyDown={handleBFullKeyDown}
                                                    className="w-20 sm:w-24 h-10 text-center text-base font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 focus:ring-amber-500 transition-all font-mono"
                                                />
                                            </div>

                                            {toNumber(selectedItemForQty.packing_qty || 1) > 1 && (
                                                <div className="flex flex-col gap-1 items-center animate-in fade-in slide-in-from-bottom-2">
                                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">B. PCS</span>
                                                    <Input
                                                        ref={bPcsInputRef}
                                                        type="number"
                                                        value={dialogBonusPcs || ""}
                                                        onChange={e => setDialogBonusPcs(toNumber(e.target.value))}
                                                        onKeyDown={handleBPcsKeyDown}
                                                        className="w-20 sm:w-24 h-10 text-center text-base font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 focus:ring-amber-500 transition-all font-mono"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">Rate (Rs)</span>
                                                <Input
                                                    ref={rateInputRef}
                                                    type="number"
                                                    value={dialogRate || ""}
                                                    onChange={e => setDialogRate(toNumber(e.target.value))}
                                                    onKeyDown={handleRateKeyDown}
                                                    className="w-20 sm:w-24 h-10 text-center text-base font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-orange-600 focus:ring-orange-500 transition-all font-mono"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">Disc (%)</span>
                                                <Input
                                                    ref={discountInputRef}
                                                    type="number"
                                                    value={dialogDiscount || ""}
                                                    onChange={e => setDialogDiscount(toNumber(e.target.value))}
                                                    onKeyDown={handleDiscountKeyDown}
                                                    className="w-16 sm:w-20 h-10 text-center text-base font-black rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-orange-600 focus:ring-orange-500 transition-all font-mono"
                                                />
                                            </div>

                                            <Button
                                                ref={addButtonRef}
                                                onClick={handleCommit}
                                                onKeyDown={handleAddButtonKeyDown}
                                                className="h-10 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all ml-2"
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right Column: Item Telemetry & Diagnostic Info Panel (Only displayed when item is selected for qty) */}
                        {selectedItemForQty && (
                            <div className="hidden lg:flex w-96 shrink-0 flex-col bg-white dark:bg-zinc-900 overflow-y-auto custom-scrollbar border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right-2 duration-200">
                                <div className="flex flex-col h-full divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {/* 1. Header Identity */}
                                    <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/60 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="p-2 bg-orange-500 rounded-xl text-white shadow-md">
                                                <Box className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                                                #{String(selectedItemForQty.id).padStart(5, '0')}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-snug">
                                                {selectedItemForQty.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                                                <span>{selectedItemForQty.short_name || 'GENERIC SKU'}</span>
                                                <span>•</span>
                                                <span>{selectedItemForQty.company || 'DIRECT OEM'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Inventory Status */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Inventory Status</span>
                                        </div>
                                        {(() => {
                                            const packing = toNumber(selectedItemForQty.packing_qty) || 1;
                                            const totalStock = toNumber(selectedItemForQty.total_stock_pcs);
                                            const fullCtn = Math.floor(totalStock / packing);
                                            const loosePcs = totalStock % packing;

                                            return (
                                                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 space-y-2">
                                                    <div className="flex items-baseline justify-between">
                                                        <span className="text-[9px] font-bold uppercase text-zinc-400">Available Stock</span>
                                                        <span className={cn("text-xl font-black font-mono", totalStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                                                            {totalStock.toLocaleString()} Pcs
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">{fullCtn} CTN</span>
                                                            <span className="text-[8px] font-bold text-zinc-400 uppercase">Full Cartons</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">{loosePcs} PCS</span>
                                                            <span className="text-[8px] font-bold text-zinc-400 uppercase">Loose Pieces</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* 3. Pricing Tiers Matrix */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Pricing Tier Matrix</span>
                                            {customerCategory && (
                                                <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">
                                                    Cat: Tier {customerCategory}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                                                const tradePrice = toNumber(selectedItemForQty.trade_price);
                                                let percentage = 0;
                                                let calculatedPrice = tradePrice;
                                                let label = num === 1 ? "Base TP" : `Tier ${num}`;

                                                if (num !== 1) {
                                                    const priceKey = `pt${num}` as keyof Item;
                                                    percentage = toNumber(selectedItemForQty[priceKey]);
                                                    calculatedPrice = Math.round(tradePrice * (1 + percentage / 100));
                                                }

                                                const isActive = String(num) === (customerCategory || "1");

                                                if (num !== 1 && percentage === 0 && !isActive) return null;

                                                return (
                                                    <div
                                                        key={num}
                                                        className={cn(
                                                            "p-2 rounded-lg border text-left flex flex-col justify-between transition-all",
                                                            isActive
                                                                ? "bg-orange-500 text-white border-orange-500 shadow-md font-bold"
                                                                : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200/60 dark:border-zinc-800"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between text-[8px] uppercase tracking-wider opacity-80">
                                                            <span>{label}</span>
                                                            <span>{num === 1 ? "BASE" : `${percentage}%`}</span>
                                                        </div>
                                                        <div className="text-xs font-black font-mono mt-1">
                                                            <span className="text-[9px] opacity-70 mr-0.5">Rs</span>
                                                            {calculatedPrice.toLocaleString()}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 4. Active Scheme Alert */}
                                    {(selectedItemForQty.scheme || selectedItemForQty.scheme2) && (
                                        <div className="p-4">
                                            <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-700 dark:text-rose-300">
                                                <Info className="w-4 h-4 text-rose-500 shrink-0" />
                                                <div className="flex flex-col text-xs font-bold min-w-0">
                                                    <span className="text-[8px] uppercase font-black text-rose-500 tracking-wider">Active Market Scheme</span>
                                                    <span className="truncate">{selectedItemForQty.scheme || selectedItemForQty.scheme2}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. PRICING & COST ANALYSIS (Trade, Retail & Average Rate) */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="w-4 h-4 text-purple-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Pricing & Cost Breakdown</span>
                                        </div>
                                        <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[9px] font-bold uppercase text-zinc-400">Trade Price</span>
                                                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">Rs {toNumber(selectedItemForQty.trade_price).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                                                <span className="text-[9px] font-bold uppercase text-zinc-400">Retail MSRP</span>
                                                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">Rs {toNumber(selectedItemForQty.retail).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                                                <span className="text-[9px] font-bold uppercase text-zinc-400">Average Rate</span>
                                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    Rs {((toNumber(selectedItemForQty.trade_price) + toNumber(selectedItemForQty.retail)) / 2).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                                                <span className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-orange-500" /> Shelf Location
                                                </span>
                                                <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">{selectedItemForQty.shelf || 'LEDGER'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 6. LAST PURCHASE HISTORY SNAPSHOT */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-orange-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Last Purchase History</span>
                                        </div>
                                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[9px] font-bold uppercase text-zinc-400">Purchase Date</span>
                                                <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedItemForQty.last_purchase_date || 'INITIAL_STOCK'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                                                <span className="text-[9px] font-bold uppercase text-zinc-400">Last Rate</span>
                                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    Rs {toNumber(selectedItemForQty.last_purchase_rate).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                                                <span className="text-[9px] font-bold uppercase text-zinc-400">Batch Qty</span>
                                                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                                    {selectedItemForQty.last_purchase_full || 0} CTN / {selectedItemForQty.last_purchase_pcs || 0} PCS
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                                                <span className="text-[9px] font-bold uppercase text-zinc-400">Last Supplier</span>
                                                <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase truncate max-w-[140px]">{selectedItemForQty.last_supplier || 'MARKET_DIRECT'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
};
