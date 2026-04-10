// Offer Provisioning Surface - Premium Redesign
import React, { useState, useMemo, useEffect } from "react";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import {
    LayoutGrid,
    ListPlus,
    History,
    Search,
    Box,
    Check,
    Briefcase,
    Layers,
    PercentCircle,
    Save,
    Plus,
    RotateCcw,
    Trash2,
    PackageSearch,
    Workflow,
    CalendarClock,
    UserCircle2,
    Tag,
    Sparkles,
    BadgeInfo,
    ShieldCheck,
    PlusCircle,
    RefreshCw
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ───────────────────────────────────────────
// Breadcrumbs
// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: "Offers", href: "/offer" },
    { title: "Add Offer", href: "/offer-list/create" },
];

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────
interface Item {
    id: number;
    title: string;
    short_name: string;
    company: string;
    trade_price: number;
    retail: number;
    packing_qty: number;
    category: string;
    gst_percent: number;
    retail_tp_diff: number;
    discount: number;
    pt2?: number;
    pt3?: number;
    pt4?: number;
    pt5?: number;
    pt6?: number;
    pt7?: number;
    scheme?: string;
    scheme2?: string;
}

interface Category {
    id: number;
    name: string;
}

interface Account {
    id: number;
    title: string;
    item_category?: string | null;
}

interface RowData {
    id: number;
    item_id: number | null;
    title: string;
    pack_ctn: number;
    loos_ctn: number;
    trade_price: number;
    retail: number;
    category_name: string;
    discount: string;
    scheme: string;
    mrp: number; // Retail Price
    tp6?: number; // T.P. + 6% (or pt7 %)
    pt7?: number; // pt7 percentage
    company?: string;
}

interface MessageLine {
    id: number;
    messageline: string;
}

interface Firm {
    id: number;
    name: string;
    logo?: string;
}

export default function OfferListing({ items, categories, accounts, messageLines, firms }: { items: Item[]; categories: Category[]; accounts: Account[]; messageLines?: MessageLine[]; firms: Firm[] }) {
    const [date] = useState(new Date().toLocaleDateString('en-GB'));
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [selectedFirm, setSelectedFirm] = useState<string>("");
    const [customerCategory, setCustomerCategory] = useState<string | null>(null);
    const [selectedMessageId, setSelectedMessageId] = useState<string>("0");
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    // Offer Types: 1 = One Customer Group, 2 = Market Offer
    const [offerType, setOfferType] = useState<"1" | "2">("1");
    const [cartonPriceTier, setCartonPriceTier] = useState<string>("1");
    const [loosePriceTier, setLoosePriceTier] = useState<string>("2");
    const [marketPriceTier, setMarketPriceTier] = useState<string>("7");

    // Item Registry Dialog State
    const [isRegistryOpen, setIsRegistryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Get the currently selected item details for the info panel
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return items.find((it) => it.id === selectedItemId) ?? null;
    }, [selectedItemId, items]);

    // Helper: Calculate Category-specific Trade Price
    const calculatePrice = (item: Item, cat: string | number | null, forceTier?: number) => {
        const actualTradePrice = Number(item.trade_price ?? 0);
        const catStr = forceTier ? String(forceTier) : (cat ? String(cat) : null);
        if (!catStr || actualTradePrice <= 0) return actualTradePrice;

        let percentage = 0;
        switch (catStr) {
            case "2": percentage = Number(item.pt2 ?? 0); break;
            case "3": percentage = Number(item.pt3 ?? 0); break;
            case "4": percentage = Number(item.pt4 ?? 0); break;
            case "5": percentage = Number(item.pt5 ?? 0); break;
            case "6": percentage = Number(item.pt6 ?? 0); break;
            case "7": percentage = Number(item.pt7 ?? 0); break;
        }

        return percentage > 0 ? Math.round(actualTradePrice * (1 + percentage / 100)) : actualTradePrice;
    };

    // Smart Pricing Alignment: Auto-select Trade Price and Sync manifest when customer or offer type changes
    useEffect(() => {
        setRows(prev => prev.map(row => {
            if (!row.item_id) return row;
            const item = items.find(i => i.id === row.item_id);
            if (!item) return row;

            const baseTP = Number(item.trade_price ?? 0);
            const packingQty = Number(item.packing_qty) || 1;
            
            let offerPrice = baseTP;
            let packPrice = baseTP;
            let loosePrice = baseTP;
            let tp6Price = baseTP;
            let selectedPercentage = 0;

            if (offerType === "1") {
                packPrice = calculatePrice(item, null, Number(cartonPriceTier));
                loosePrice = calculatePrice(item, null, Number(loosePriceTier));
                offerPrice = loosePrice; 
                selectedPercentage = Number(item[`pt${loosePriceTier}` as keyof Item] ?? 0);
                tp6Price = calculatePrice(item, null, Number(marketPriceTier)); // fallback
            } else if (offerType === "2") {
                tp6Price = calculatePrice(item, null, Number(marketPriceTier));
                offerPrice = tp6Price;
                loosePrice = Math.round(tp6Price / packingQty);
                selectedPercentage = Number(item[`pt${marketPriceTier}` as keyof Item] ?? 0);
                packPrice = 0;
            }

            return {
                ...row,
                trade_price: offerPrice,
                pack_ctn: offerType === "1" ? packPrice : row.pack_ctn,
                loos_ctn: offerType === "1" ? loosePrice : row.loos_ctn,
                tp6: tp6Price,
                pt7: selectedPercentage,
                scheme: (offerType === "2" ? item.scheme2 : item.scheme) ?? ""
            };
        }));
    }, [selectedAccount, customerCategory, offerType, cartonPriceTier, loosePriceTier, marketPriceTier, items]);

    const getEmptyRow = (): RowData => ({
        id: Date.now() + Math.random(),
        item_id: null,
        title: "",
        pack_ctn: 0,
        loos_ctn: 0,
        trade_price: 0,
        retail: 0,
        category_name: "",
        discount: "",
        scheme: "",
        mrp: 0,
        tp6: 0,
        pt7: 0,
        company: ""
    });

    const [rows, setRows] = useState<RowData[]>([getEmptyRow()]);

    const filteredRegistryItems = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return items.filter(it => 
            it.title.toLowerCase().includes(q) || 
            it.short_name?.toLowerCase().includes(q) ||
            it.company?.toLowerCase().includes(q) ||
            it.category?.toLowerCase().includes(q)
        ).sort((a,b) => a.title.localeCompare(b.title));
    }, [searchQuery, items]);

    const handleSelectFromRegistry = (item: Item) => {
        const isSelected = rows.some(r => r.item_id === item.id);
        if (isSelected) {
            setRows(prev => prev.filter(r => r.item_id !== item.id));
            if (rows.length <= 1) setRows([getEmptyRow()]);
        } else {
            const cat = categories.find(c => String(c.id) === String(item.category));
            const catName = cat ? cat.name : "Uncategorized";
            
            const baseTP = Number(item.trade_price ?? 0);
            const packingQty = Number(item.packing_qty) || 1;
            
            let offerPrice = baseTP;
            let packPrice = baseTP;
            let loosePrice = baseTP;
            let tp6Price = baseTP;
            let selectedPercentage = 0;

            if (offerType === "1") {
                packPrice = calculatePrice(item, null, Number(cartonPriceTier));
                loosePrice = calculatePrice(item, null, Number(loosePriceTier));
                offerPrice = loosePrice; 
                selectedPercentage = Number(item[`pt${loosePriceTier}` as keyof Item] ?? 0);
                tp6Price = calculatePrice(item, null, Number(marketPriceTier)); // fallback
            } else if (offerType === "2") {
                tp6Price = calculatePrice(item, null, Number(marketPriceTier));
                offerPrice = tp6Price;
                loosePrice = Math.round(tp6Price / packingQty);
                selectedPercentage = Number(item[`pt${marketPriceTier}` as keyof Item] ?? 0);
                packPrice = 0;
            }

            const newRow: RowData = {
                id: Date.now() + item.id + Math.random(),
                item_id: item.id,
                title: item.title,
                pack_ctn: offerType === "1" ? packPrice : 0,
                loos_ctn: offerType === "1" ? loosePrice : 0,
                trade_price: offerPrice,
                retail: item.retail,
                category_name: catName,
                discount: item.discount?.toString() ?? "",
                scheme: (offerType === "2" ? item.scheme2 : item.scheme) ?? "",
                mrp: item.retail,
                tp6: tp6Price,
                pt7: selectedPercentage,
                company: item.company
            };

            setRows(prev => {
                const emptyIdx = prev.findIndex(r => r.item_id === null);
                if (emptyIdx !== -1) {
                    const newRows = [...prev];
                    newRows[emptyIdx] = newRow;
                    return newRows;
                }
                return [newRow, ...prev];
            });
        }
    };

    const addMoreItems = () => {
        setIsRegistryOpen(true);
    };

    const addRow = () => {
        setRows((prev) => [getEmptyRow(), ...prev]);
    };

    const loadAllItems = () => {
        const allItemRows: RowData[] = items.map((item) => {
            const cat = categories.find(c => String(c.id) === String(item.category));
            const catName = cat ? cat.name : "Uncategorized";

            const baseTP = Number(item.trade_price ?? 0);
            const packingQty = Number(item.packing_qty) || 1;
            
            let offerPrice = baseTP;
            let packPrice = baseTP;
            let loosePrice = baseTP;
            let tp6Price = baseTP;
            let selectedPercentage = 0;

            if (offerType === "1") {
                packPrice = calculatePrice(item, null, Number(cartonPriceTier));
                loosePrice = calculatePrice(item, null, Number(loosePriceTier));
                offerPrice = loosePrice; 
                selectedPercentage = Number(item[`pt${loosePriceTier}` as keyof Item] ?? 0);
                tp6Price = calculatePrice(item, null, Number(marketPriceTier)); // fallback
            } else if (offerType === "2") {
                tp6Price = calculatePrice(item, null, Number(marketPriceTier));
                offerPrice = tp6Price;
                loosePrice = Math.round(tp6Price / packingQty);
                selectedPercentage = Number(item[`pt${marketPriceTier}` as keyof Item] ?? 0);
                packPrice = 0;
            }

            return {
                id: Date.now() + item.id + Math.random(),
                item_id: item.id,
                title: item.title,
                pack_ctn: offerType === "1" ? packPrice : 0,
                loos_ctn: offerType === "1" ? loosePrice : 0,
                trade_price: offerPrice,
                retail: item.retail,
                category_name: catName,
                discount: item.discount?.toString() ?? "",
                scheme: (offerType === "2" ? item.scheme2 : item.scheme) ?? "",
                mrp: item.retail,
                tp6: tp6Price,
                pt7: selectedPercentage,
                company: item.company
            };
        });
        setRows(allItemRows);
    };

    const resetRows = () => {
        setRows([getEmptyRow()]);
    };

    const removeRow = (id: number) => {
        if (rows.length > 1) {
            setRows((prev) => prev.filter((row) => row.id !== id));
        } else {
            resetRows();
        }
    };

    const handleSelectItem = (rowId: number, itemId: number) => {
        const selected = items.find((i) => i.id === itemId);
        if (!selected) return;

        const cat = categories.find(c => String(c.id) === String(selected.category));
        const catName = cat ? cat.name : "Uncategorized";
        
        const packingQty = Number(selected.packing_qty) || 1;
        let offerPrice = Number(selected.trade_price ?? 0);
        let tp6Price = offerPrice;
        let selectedPercentage = 0;

        if (offerType === "1") {
            const loosePrice = calculatePrice(selected, null, Number(loosePriceTier));
            offerPrice = loosePrice;
            selectedPercentage = Number(selected[`pt${loosePriceTier}` as keyof Item] ?? 0);
            tp6Price = calculatePrice(selected, null, Number(marketPriceTier)); // fallback
        } else if (offerType === "2") {
            tp6Price = calculatePrice(selected, null, Number(marketPriceTier));
            offerPrice = tp6Price;
            selectedPercentage = Number(selected[`pt${marketPriceTier}` as keyof Item] ?? 0);
        }

        setRows((prev) =>
            prev.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        item_id: itemId,
                        title: selected.title,
                        pack_ctn: offerType === "1" ? calculatePrice(selected, null, Number(cartonPriceTier)) : 0,
                        loos_ctn: offerType === "1" ? calculatePrice(selected, null, Number(loosePriceTier)) : Math.round(tp6Price / packingQty),
                        trade_price: offerPrice,
                        retail: selected.retail,
                        category_name: catName,
                        discount: selected.discount?.toString() ?? "",
                        scheme: (offerType === "2" ? selected.scheme2 : selected.scheme) ?? "",
                        mrp: selected.retail,
                        tp6: tp6Price,
                        pt7: selectedPercentage,
                        company: selected.company
                    }
                    : row
            )
        );
    };

    const storeOffer = () => {
        const itemsData = rows
            .filter((r) => r.item_id !== null)
            .map((r) => ({
                item_id: r.item_id,
                pack_ctn: r.pack_ctn,
                loos_ctn: r.loos_ctn,
                price_type: offerType,
                mrp: r.mrp,
                price: offerType === "1" ? r.trade_price : r.tp6,
                scheme: r.scheme,
                status: 'active'
            }));

        if (itemsData.length === 0) {
            alert("Failed to save: No items found in the current list.");
            return;
        }

        const [day, month, year] = date.split('/');
        const formattedDate = `${year}-${month}-${day}`;

        router.post('/offer-list', {
            account_id: null,
            firm_id: selectedFirm && selectedFirm !== "0" ? Number(selectedFirm) : null,
            date: formattedDate,
            price_type: offerType, // 1 or 2
            message_line_id: null,
            items: itemsData,
        }, {
            onSuccess: () => resetRows(),
            onError: () => alert('Failed to synchronize offer. Please check data integrity.')
        });
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto w-full">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-[0.3em]">
                                <Workflow className="h-3 w-3" />
                                <span>Offer Details</span>
                            </div>
                            <Heading
                                title="Add Offer"
                                description="Create new price offers for customers."
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 md:gap-3 w-full md:w-auto"
                        >
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/offer-list')}
                                className="flex-1 md:flex-none rounded-xl border-zinc-200 dark:border-zinc-800 text-[11px] font-black uppercase tracking-widest h-12 px-4 md:px-6 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <History className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                onClick={storeOffer}
                                className="flex-1 md:flex-none bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-400 text-white transition-all duration-300 rounded-xl px-4 md:px-8 h-12 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/30"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save Offer
                            </Button>
                        </motion.div>
                    </div>

                    {/* Control Surface */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="p-4 md:p-8 border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
                                <Sparkles className="h-24 w-24 text-orange-500" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-start relative z-10">
                                <div className="col-span-1 md:col-span-12 lg:col-span-2 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <Layers className="h-3 w-3" />
                                        Offer Type
                                    </div>
                                    <Select value={offerType} onValueChange={(val: "1" | "2") => setOfferType(val)}>
                                        <SelectTrigger className="w-full h-11 rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-xs font-bold transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                            <SelectItem value="1" className="text-xs font-bold">1: Customer Group</SelectItem>
                                            <SelectItem value="2" className="text-xs font-bold">2: Market Offer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-1 md:col-span-12 lg:col-span-2 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <CalendarClock className="h-3 w-3" />
                                        Date
                                    </div>
                                    <Input
                                        value={date}
                                        readOnly
                                        className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 h-11 rounded-sm font-bold tabular-nums text-zinc-500"
                                    />
                                </div>

                                {offerType === "1" ? (
                                    <>
                                        <div className="col-span-1 md:col-span-4 lg:col-span-2 space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                                <PercentCircle className="h-3 w-3" />
                                                Carton Tier
                                            </div>
                                            <Select value={cartonPriceTier} onValueChange={setCartonPriceTier}>
                                                <SelectTrigger className="w-full h-11 rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-xs font-bold transition-all">
                                                    <SelectValue placeholder="Select Tier" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-sm border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                    <SelectItem value="1" className="text-xs font-bold">Trade Price</SelectItem>
                                                    <SelectItem value="2" className="text-xs font-bold">Tier 2</SelectItem>
                                                    <SelectItem value="3" className="text-xs font-bold">Tier 3</SelectItem>
                                                    <SelectItem value="4" className="text-xs font-bold">Tier 4</SelectItem>
                                                    <SelectItem value="5" className="text-xs font-bold">Tier 5</SelectItem>
                                                    <SelectItem value="6" className="text-xs font-bold">Tier 6</SelectItem>
                                                    <SelectItem value="7" className="text-xs font-bold">Tier 7</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-1 md:col-span-4 lg:col-span-2 space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                                <PercentCircle className="h-3 w-3" />
                                                Loose Ctn Tier
                                            </div>
                                            <Select value={loosePriceTier} onValueChange={setLoosePriceTier}>
                                                <SelectTrigger className="w-full h-11 rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-xs font-bold transition-all">
                                                    <SelectValue placeholder="Select Tier" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-sm border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                    <SelectItem value="1" className="text-xs font-bold">Trade Price</SelectItem>
                                                    <SelectItem value="2" className="text-xs font-bold">Tier 2</SelectItem>
                                                    <SelectItem value="3" className="text-xs font-bold">Tier 3</SelectItem>
                                                    <SelectItem value="4" className="text-xs font-bold">Tier 4</SelectItem>
                                                    <SelectItem value="5" className="text-xs font-bold">Tier 5</SelectItem>
                                                    <SelectItem value="6" className="text-xs font-bold">Tier 6</SelectItem>
                                                    <SelectItem value="7" className="text-xs font-bold">Tier 7</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-1 md:col-span-6 lg:col-span-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                            <PercentCircle className="h-3 w-3" />
                                            Market Tier
                                        </div>
                                        <Select value={marketPriceTier} onValueChange={setMarketPriceTier}>
                                            <SelectTrigger className="w-full h-11 rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-xs font-bold transition-all">
                                                <SelectValue placeholder="Select Tier" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-sm border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                <SelectItem value="1" className="text-xs font-bold">Trade Price</SelectItem>
                                                <SelectItem value="2" className="text-xs font-bold">Tier 2</SelectItem>
                                                <SelectItem value="3" className="text-xs font-bold">Tier 3</SelectItem>
                                                <SelectItem value="4" className="text-xs font-bold">Tier 4</SelectItem>
                                                <SelectItem value="5" className="text-xs font-bold">Tier 5</SelectItem>
                                                <SelectItem value="6" className="text-xs font-bold">Tier 6</SelectItem>
                                                <SelectItem value="7" className="text-xs font-bold">Tier 7</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="col-span-1 md:col-span-12 lg:col-span-4 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <Briefcase className="h-3 w-3" />
                                        Select Firm
                                    </div>
                                    <Select value={selectedFirm} onValueChange={setSelectedFirm}>
                                        <SelectTrigger className="w-full h-11 rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-xs font-bold transition-all">
                                            <SelectValue placeholder="General / Harmain" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                            <SelectItem value="0" className="text-xs font-bold">Default (Harmain)</SelectItem>
                                            {firms.map((firm) => (
                                                <SelectItem key={firm.id} value={firm.id.toString()} className="text-xs font-bold">
                                                    {firm.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Manifest Surface */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between px-2 md:px-4 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Negotiation Manifest Ledger</span>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Button
                                    size="sm"
                                    onClick={addMoreItems}
                                    className="flex-1 md:flex-none h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20"
                                >
                                    <Plus className="mr-1 md:mr-2 h-3.5 w-3.5" />
                                    Add More
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={resetRows}
                                    className="h-9 w-9 p-0 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all group shrink-0"
                                >
                                    <RotateCcw className="h-4 w-4 transition-transform group-active:rotate-180" />
                                </Button>
                            </div>
                        </div>

                        <Card className="border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md overflow-hidden">
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="hidden md:table-header-group">
                                        <tr className="border-b border-zinc-200 dark:border-zinc-800 h-14 bg-zinc-50/50 dark:bg-zinc-950/20">
                                            <th className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                <div className="flex items-center gap-2 italic">
                                                    <PackageSearch className="h-3 w-3 text-orange-500" />
                                                    Item
                                                </div>
                                            </th>
                                            {offerType === "1" ? (
                                                <>
                                                    <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Carton Price</th>
                                                    <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Loose Ctn Price</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Rate</th>
                                                </>
                                            )}
                                            <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">M.R.P</th>
                                            <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Scheme</th>
                                            {offerType === "2" && <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Price</th>}
                                            <th className="px-6 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="flex flex-col md:table-row-group">
                                        <AnimatePresence mode="popLayout">
                                            {rows.map((row, idx) => (
                                                <motion.tr
                                                    key={row.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-orange-500/[0.02] dark:hover:bg-orange-500/[0.02] transition-colors md:h-16 flex flex-col md:table-row p-3 md:p-0 relative"
                                                    onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                >
                                                    <td className="md:px-6 md:min-w-[300px] pb-2 md:pb-0 block md:table-cell">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{row.title || "No Item Selected"}</span>
                                                            <span className="text-[10px] text-zinc-400 font-medium">{row.category_name}</span>
                                                        </div>
                                                    </td>

                                                    {offerType === "1" ? (
                                                        <>
                                                            <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                                <div className="flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded p-1">
                                                                    <span className="text-[14px] font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                                                                        {row.pack_ctn?.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Carton Price</span>
                                                                </div>
                                                            </td>
                                                            <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                                <div className="flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded p-1">
                                                                    <span className="text-[14px] font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                                                                        {row.loos_ctn?.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Loose Ctn Price</span>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                            <div className="flex flex-col items-center justify-center bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded p-1">
                                                                <span className="text-[14px] font-black tabular-nums text-orange-600 dark:text-orange-400">
                                                                    {row.tp6?.toLocaleString()}
                                                                </span>
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">T.P + {row.pt7}%</span>
                                                            </div>
                                                        </td>
                                                    )}

                                                    <td className="md:px-4 md:text-center py-1 md:py-0 block md:table-cell">
                                                        <div className="space-y-1 block md:inline-block w-full">
                                                            <Label className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none block md:hidden text-left mb-1">Retail Price</Label>
                                                            <Input
                                                                className="h-8 text-[11px] font-black tabular-nums rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/30 dark:bg-zinc-900/30 text-left md:text-center w-full md:w-24"
                                                                value={row.mrp}
                                                                onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, mrp: Number(e.target.value) } : r))}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                        <div className="space-y-1 block md:block">
                                                            <Label className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none block md:hidden mb-1">Scheme</Label>
                                                            <Input
                                                                className="h-8 text-[10px] font-bold rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/30 dark:bg-zinc-900/30 w-full"
                                                                placeholder="e.g. 10+1 Promo..."
                                                                value={row.scheme}
                                                                onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, scheme: e.target.value } : r))}
                                                            />
                                                        </div>
                                                    </td>
                                                    
                                                    {offerType === "2" && (
                                                        <td className="md:px-4 py-2 mt-2 md:mt-0 font-bold border-t border-zinc-100 dark:border-zinc-800 border-dashed md:border-none md:py-0 flex flex-row justify-between items-center md:table-cell text-right">
                                                            <Label className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none md:hidden block">Price</Label>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[14px] md:text-[12px] font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                                                                    <span className="text-[10px] text-zinc-400 mr-1 italic">V:</span>
                                                                    {row.trade_price.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    )}

                                                    <td className="px-6 hidden md:table-cell">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg hover:bg-rose-500/10 group overflow-hidden transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-zinc-300 group-hover:text-rose-500 group-active:scale-90" />
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Footer */}
                            <div className="bg-zinc-950/20 dark:bg-zinc-950/40 p-3 md:p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                                    <div className="flex flex-col flex-1 md:flex-none text-center md:text-left">
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Total Items</span>
                                        <span className="text-sm font-black text-orange-500 tabular-nums">{rows.filter(r => r.item_id).length} Active</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-zinc-400 italic text-[10px] w-full md:w-auto text-center md:text-left justify-center md:justify-start">
                                    <BadgeInfo className="h-3 w-3 shrink-0" />
                                    <span>All values are based on current server-side price info.</span>
                                </div>
                            </div>

                            {/* Price Dashboard */}
                            {selectedItem && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-800 p-6"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Price Details: {selectedItem.title}</span>
                                    </div>

                                    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {[2, 3, 4, 5, 6, 7].map((num) => {
                                            const priceKey = `pt${num}` as keyof Item;
                                            const percentage = Number(selectedItem[priceKey] ?? 0);

                                            // Formula: Trade Price * (1 + Percentage / 100)
                                            const adjustedPrice = calculatePrice(selectedItem, num);
                                            const isActive = String(num) === String(customerCategory);

                                            return (
                                                <div
                                                    key={num}
                                                    className={cn(
                                                        "rounded-xl p-3 border transition-all relative overflow-hidden group",
                                                        isActive
                                                            ? "bg-orange-500/10 border-orange-500 ring-1 ring-orange-500 shadow-lg shadow-orange-500/10"
                                                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-orange-500/30"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider mb-1",
                                                        isActive ? "text-orange-600 dark:text-orange-400" : "text-zinc-400"
                                                    )}>
                                                        Price Type {num} <span className="opacity-60 lowercase font-bold">({percentage}%)</span>
                                                    </div>
                                                    <div className={cn(
                                                        "text-sm font-black tabular-nums",
                                                        isActive ? "text-orange-700 dark:text-orange-300" : "text-zinc-600 dark:text-zinc-300"
                                                    )}>
                                                        Rs {adjustedPrice.toLocaleString()}
                                                    </div>
                                                    {isActive && (
                                                        <div className="absolute top-1 right-1">
                                                            <ShieldCheck className="h-3 w-3 text-orange-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </Card>
                    </motion.div>
                </div>

                <Dialog open={isRegistryOpen} onOpenChange={setIsRegistryOpen}>
                    <DialogContent className="sm:max-w-[60vw] w-[60vw] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-6 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white shrink-0">
                            <DialogTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                                <Box className="w-6 h-6 text-orange-500" /> Item Registry
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                                Selection Portal for Multi-Offer Sequence
                            </DialogDescription>

                            <div className="mt-4 relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                <Input
                                    placeholder="Query by Title, ID, or Category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:ring-0 focus:bg-white/10 transition-all rounded-sm border-zinc-700 font-bold"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto min-h-0 bg-zinc-50/30 dark:bg-zinc-950/30">
                            <div className="grid grid-cols-12 bg-zinc-100/50 dark:bg-zinc-900/50 px-6 py-3 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="col-span-4 text-[9px] font-black uppercase text-zinc-400 tracking-widest">Item Description</div>
                                <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-400 tracking-widest">Carton Price</div>
                                <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-400 tracking-widest">Loose Price</div>
                                <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-400 tracking-widest">Scheme</div>
                                <div className="col-span-2 text-right text-[9px] font-black uppercase text-zinc-400 tracking-widest">MRP (Retail)</div>
                            </div>

                            <div className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                                {filteredRegistryItems.map((item) => {
                                    const isSelected = rows.some(r => r.item_id === item.id);
                                    
                                    const getPrices = () => {
                                        if (offerType === "1") {
                                            const cartonPrice = calculatePrice(item, null, Number(cartonPriceTier));
                                            const loosePrice = calculatePrice(item, null, Number(loosePriceTier));
                                            return { pack: cartonPrice, loose: loosePrice };
                                        }
                                        const marketPrice = calculatePrice(item, null, Number(marketPriceTier));
                                        return { pack: marketPrice, loose: Math.round(marketPrice / (item.packing_qty || 1)) };
                                    };
                                    const prices = getPrices();
                                    
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelectFromRegistry(item)}
                                            className={`w-full text-left transition-all p-4 grid grid-cols-12 items-center gap-4 group ${
                                                isSelected 
                                                ? "bg-orange-500/10 dark:bg-orange-500/5 border-l-4 border-orange-500" 
                                                : "hover:bg-zinc-100 dark:hover:bg-zinc-900 border-l-4 border-transparent"
                                            }`}
                                        >
                                            <div className="col-span-4 flex items-center gap-3">
                                                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                    isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-zinc-300 dark:border-zinc-700"
                                                }`}>
                                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-black uppercase tracking-tight ${isSelected ? "text-orange-600" : "text-zinc-700 dark:text-zinc-200"}`}>
                                                        {item.title}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-zinc-400 truncate">{item.company} | {item.category}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center font-black tabular-nums text-zinc-600 dark:text-zinc-400">Rs {prices.pack.toLocaleString()}</div>
                                            <div className="col-span-2 text-center font-black tabular-nums text-zinc-600 dark:text-zinc-400">Rs {prices.loose.toLocaleString()}</div>
                                            <div className="col-span-2 text-center">
                                                <span className="px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                                    {(offerType === "2" ? item.scheme2 : item.scheme) || 'NO SCHEME'}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-right font-black tabular-nums text-orange-600 dark:text-orange-500">Rs {item.retail.toLocaleString()}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center sm:justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        filteredRegistryItems.forEach(it => {
                                            if (!rows.some(r => r.item_id === it.id)) handleSelectFromRegistry(it);
                                        });
                                    }}
                                    className="h-10 text-[10px] font-black uppercase tracking-widest border-zinc-300 dark:border-zinc-700 hover:bg-orange-500 hover:text-white rounded-sm"
                                >
                                    Select All
                                </Button>
                            </div>
                            <Button
                                onClick={() => setIsRegistryOpen(false)}
                                className="h-10 px-8 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-orange-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest rounded-sm"
                            >
                                Proceed Selections
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
