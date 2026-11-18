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
    RefreshCw,
    Filter
} from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
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
interface Company {
    id: number;
    title: string;
}

interface Item {
    id: number;
    code?: string;
    title: string;
    short_name: string;
    company: string;
    company_account?: {
        id: number;
        title: string;
    } | null;
    companyAccount?: {
        id: number;
        title: string;
    } | null;
    trade_price: number;
    retail: number;
    packing_qty: number;
    reorder_level?: number;
    category: string;
    gst_percent: number;
    retail_tp_diff: number;
    discount: number;
    stock_1?: number;
    stock_2?: number;
    opening_stock_1?: number;
    opening_stock_2?: number;
    opening_total_pcs?: number;
    available_stock?: number;
    available_full?: number;
    available_pcs?: number;
    total_stock_pcs?: number;
    stock_breakdown?: string;
    is_negative_stock?: boolean;
    purchase_pcs?: number;
    sale_pcs?: number;
    sale_return_pcs?: number;
    purchase_return_pcs?: number;
    net_movement_pcs?: number;
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
    defult?: number | boolean;
    status?: number | boolean;
}

export default function OfferListing({ 
    items, 
    categories, 
    accounts, 
    messageLines, 
    firms,
    companies = []
}: { 
    items: Item[]; 
    categories: Category[]; 
    accounts: Account[]; 
    messageLines?: MessageLine[]; 
    firms: Firm[];
    companies?: Company[];
}) {
    const [date] = useState(new Date().toLocaleDateString('en-GB'));
    const [selectedAccount, setSelectedAccount] = useState<string>("0");
    
    const defaultFirm = useMemo(() => {
        return firms.find(f => f.defult === 1 || f.defult === true);
    }, [firms]);

    const [selectedFirm, setSelectedFirm] = useState<string>(() => {
        return defaultFirm ? defaultFirm.id.toString() : "";
    });
    const [customerCategory, setCustomerCategory] = useState<string | null>(null);
    const defaultMessage = useMemo(() => {
        return messageLines?.find((m: any) => m.is_default || m.defult);
    }, [messageLines]);

    const [selectedMessageId, setSelectedMessageId] = useState<string>(() => {
        return defaultMessage ? defaultMessage.id.toString() : "0";
    });
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    // Offer Types: 1 = One Customer Group, 2 = Market Offer
    const [offerType, setOfferType] = useState<"1" | "2">("1");
    const [cartonPriceTier, setCartonPriceTier] = useState<string>("1");
    const [loosePriceTier, setLoosePriceTier] = useState<string>("2");
    const [marketPriceTier, setMarketPriceTier] = useState<string>("7");

    // Item Registry Dialog State
    const [isRegistryOpen, setIsRegistryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>("all");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
    const [selectedStockFilter, setSelectedStockFilter] = useState<"in_stock" | "all" | "low_stock" | "out_of_stock">("in_stock");

    // Helper: Get real-time ledger stock details (matches /items and /sales/create StockService)
    const getLiveStockMeta = (it: Item) => {
        const packing = Math.max(1, Number(it.packing_qty) || 1);
        const totalPcs =
            it.available_stock !== undefined
                ? Number(it.available_stock)
                : it.total_stock_pcs !== undefined
                ? Number(it.total_stock_pcs)
                : (Number(it.stock_1) || 0) * packing + (Number(it.stock_2) || 0);

        const isNeg = totalPcs < 0;
        const absPcs = Math.abs(totalPcs);
        const full =
            it.available_full !== undefined
                ? Number(it.available_full)
                : (isNeg ? -1 : 1) * Math.floor(absPcs / packing);
        const pcs =
            it.available_pcs !== undefined
                ? Number(it.available_pcs)
                : (isNeg ? -1 : 1) * (absPcs % packing);

        const reorder = Number(it.reorder_level) || 0;
        let status: "OK" | "Low Stock" | "Out of Stock" | "Deficit" = "OK";
        if (totalPcs < 0) status = "Deficit";
        else if (totalPcs === 0) status = "Out of Stock";
        else if (reorder > 0 && totalPcs <= reorder) status = "Low Stock";

        return {
            totalPcs,
            full,
            pcs,
            packing,
            isNeg,
            status,
            formatted: packing > 1 ? `${full}F / ${pcs}P` : `${totalPcs} Units`,
        };
    };

    // Helper: Category and Company name lookups
    const getCategoryName = (catVal: string | number | undefined | null) => {
        if (!catVal) return "Uncategorized";
        const found = categories?.find(c => String(c.id) === String(catVal) || c.name.toLowerCase() === String(catVal).toLowerCase());
        return found ? found.name : String(catVal);
    };

    const getCompanyName = (compVal: string | number | undefined | null) => {
        if (!compVal) return "Unknown";
        const valStr = String(compVal).trim();

        // 1. Find in companies prop
        const foundCompany = companies?.find(c => String(c.id) === valStr || c.title.toLowerCase() === valStr.toLowerCase());
        if (foundCompany) return foundCompany.title;

        // 2. Find in items with company_account
        const itemWithCompany = items.find(it => String(it.company).trim() === valStr && (it.company_account?.title || (it as any).companyAccount?.title));
        if (itemWithCompany) {
            const title = itemWithCompany.company_account?.title || (itemWithCompany as any).companyAccount?.title;
            if (title) return title;
        }

        // 3. Find in accounts prop
        const foundAccount = accounts?.find(a => String(a.id) === valStr || a.title.toLowerCase() === valStr.toLowerCase());
        if (foundAccount) return foundAccount.title;

        return valStr;
    };

    // Build Searchable Company Options with item count: e.g. "Unilever (70)"
    const companyOptions = useMemo(() => {
        const counts: Record<string, number> = {};
        const titleMap: Record<string, string> = {};

        // 1. Populate from companies prop
        if (companies && companies.length > 0) {
            companies.forEach(c => {
                titleMap[String(c.id)] = c.title;
            });
        }

        // 2. Populate from accounts prop
        if (accounts && accounts.length > 0) {
            accounts.forEach(a => {
                if (!titleMap[String(a.id)]) {
                    titleMap[String(a.id)] = a.title;
                }
            });
        }

        // 3. Populate from items (using company_account if attached) and count
        items.forEach(it => {
            const key = String(it.company || "").trim();
            if (key) {
                counts[key] = (counts[key] || 0) + 1;
                const companyTitle = it.company_account?.title || (it as any).companyAccount?.title;
                if (companyTitle && !titleMap[key]) {
                    titleMap[key] = companyTitle;
                }
            }
        });

        const list: { label: string; value: string }[] = [];

        Object.keys(counts).forEach(k => {
            const name = titleMap[k] || getCompanyName(k);
            list.push({
                value: k,
                label: `${name} (${counts[k]})`
            });
        });

        list.sort((a, b) => a.label.localeCompare(b.label));

        return [
            { label: `All Companies (${items.length})`, value: "all" },
            ...list
        ];
    }, [items, companies, accounts]);

    // Build Searchable Category Options with item count: e.g. "Cosmetics (45)"
    const categoryOptions = useMemo(() => {
        const counts: Record<string, number> = {};
        items.forEach(it => {
            const key = String(it.category || "").trim();
            if (key) {
                counts[key] = (counts[key] || 0) + 1;
            }
        });

        const list: { label: string; value: string }[] = [];
        const processedKeys = new Set<string>();

        if (categories && categories.length > 0) {
            categories.forEach(c => {
                const key = String(c.id);
                const count = counts[key] || 0;
                processedKeys.add(key);
                if (count > 0) {
                    list.push({
                        value: key,
                        label: `${c.name} (${count})`
                    });
                }
            });
        }

        Object.keys(counts).forEach(k => {
            if (!processedKeys.has(k) && counts[k] > 0) {
                const name = getCategoryName(k);
                list.push({
                    value: k,
                    label: `${name} (${counts[k]})`
                });
            }
        });

        list.sort((a, b) => a.label.localeCompare(b.label));

        return [
            { label: `All Categories (${items.length})`, value: "all" },
            ...list
        ];
    }, [items, categories]);

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
                loosePrice = tp6Price;
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
        const q = searchQuery.toLowerCase().trim();
        return items.filter(it => {
            const stockMeta = getLiveStockMeta(it);

            // Live Stock Filter
            if (selectedStockFilter === "in_stock" && stockMeta.totalPcs <= 0) return false;
            if (selectedStockFilter === "out_of_stock" && stockMeta.totalPcs > 0) return false;
            if (selectedStockFilter === "low_stock") {
                const reorder = Number(it.reorder_level) || 0;
                if (!(stockMeta.totalPcs > 0 && stockMeta.totalPcs <= reorder)) return false;
            }

            // Company filter
            if (selectedCompanyFilter && selectedCompanyFilter !== "all") {
                const compStr = String(it.company || "").trim();
                if (compStr !== selectedCompanyFilter) return false;
            }

            // Category filter
            if (selectedCategoryFilter && selectedCategoryFilter !== "all") {
                const catStr = String(it.category || "").trim();
                if (catStr !== selectedCategoryFilter) return false;
            }

            if (!q) return true;

            const compName = getCompanyName(it.company).toLowerCase();
            const catName = getCategoryName(it.category).toLowerCase();

            return (
                it.title.toLowerCase().includes(q) || 
                it.short_name?.toLowerCase().includes(q) ||
                it.code?.toLowerCase().includes(q) ||
                compName.includes(q) ||
                catName.includes(q) ||
                String(it.id).includes(q)
            );
        }).sort((a,b) => a.title.localeCompare(b.title));
    }, [searchQuery, items, selectedCompanyFilter, selectedCategoryFilter, selectedStockFilter, companies, categories]);

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
                        loos_ctn: offerType === "1" ? calculatePrice(selected, null, Number(loosePriceTier)) : tp6Price,
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
            message_line_id: selectedMessageId && selectedMessageId !== "0" ? Number(selectedMessageId) : null,
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

                <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full min-w-0">
                    {/* ── Hero Header Section ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div className="absolute -right-12 -top-12 w-56 h-56 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10 space-y-1">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200/70 dark:border-orange-800/70 text-orange-600 dark:text-orange-400 font-black text-[10px] uppercase tracking-widest">
                                <Workflow className="h-3 w-3" />
                                <span>Offer Provisioning Studio</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                                Create Price Offer List
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                                Configure wholesale carton & loose pricing tiers, check real-time warehouse stock, and publish B2B price catalogs.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto relative z-10">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit('/offer-list')}
                                className="flex-1 md:flex-none rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold h-11 px-5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <History className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                            <Button
                                type="button"
                                onClick={storeOffer}
                                className="flex-1 md:flex-none bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white transition-all rounded-xl px-6 h-11 font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save Offer ({rows.filter(r => r.item_id).length})
                            </Button>
                        </div>
                    </motion.div>

                    {/* ── Configuration Control Bar ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 }}
                    >
                        <Card className="p-4 sm:p-6 border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm bg-white dark:bg-zinc-900 relative overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end relative z-10">
                                {/* 1. Offer Type */}
                                <div className="lg:col-span-2 space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        <Layers className="h-3 w-3 text-orange-500" />
                                        Offer Type
                                    </label>
                                    <Select value={offerType} onValueChange={(val: "1" | "2") => setOfferType(val)}>
                                        <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-xs font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                                            <SelectItem value="1" className="text-xs font-bold">1: Customer Group</SelectItem>
                                            <SelectItem value="2" className="text-xs font-bold">2: Market Offer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 2. Date */}
                                <div className="lg:col-span-2 space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        <CalendarClock className="h-3 w-3 text-orange-500" />
                                        Offer Date
                                    </label>
                                    <Input
                                        value={date}
                                        readOnly
                                        className="bg-zinc-100/70 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800 h-10 rounded-xl font-mono font-bold text-xs text-zinc-600 dark:text-zinc-300"
                                    />
                                </div>

                                {/* 3. Price Tiers */}
                                {offerType === "1" ? (
                                    <>
                                        <div className="lg:col-span-2 space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                                <PercentCircle className="h-3 w-3 text-emerald-500" />
                                                Carton Tier
                                            </label>
                                            <Select value={cartonPriceTier} onValueChange={setCartonPriceTier}>
                                                <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-xs font-bold">
                                                    <SelectValue placeholder="Select Tier" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                                                    <SelectItem value="1" className="text-xs font-bold">Trade Price (Base)</SelectItem>
                                                    <SelectItem value="2" className="text-xs font-bold">T.P 2</SelectItem>
                                                    <SelectItem value="3" className="text-xs font-bold">T.P 3</SelectItem>
                                                    <SelectItem value="4" className="text-xs font-bold">T.P 4</SelectItem>
                                                    <SelectItem value="5" className="text-xs font-bold">T.P 5</SelectItem>
                                                    <SelectItem value="6" className="text-xs font-bold">T.P 6</SelectItem>
                                                    <SelectItem value="7" className="text-xs font-bold">T.P 7</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="lg:col-span-2 space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                                <PercentCircle className="h-3 w-3 text-blue-500" />
                                                Loose Ctn Tier
                                            </label>
                                            <Select value={loosePriceTier} onValueChange={setLoosePriceTier}>
                                                <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-xs font-bold">
                                                    <SelectValue placeholder="Select Tier" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                                                    <SelectItem value="1" className="text-xs font-bold">Trade Price (Base)</SelectItem>
                                                    <SelectItem value="2" className="text-xs font-bold">T.P 2</SelectItem>
                                                    <SelectItem value="3" className="text-xs font-bold">T.P 3</SelectItem>
                                                    <SelectItem value="4" className="text-xs font-bold">T.P 4</SelectItem>
                                                    <SelectItem value="5" className="text-xs font-bold">T.P 5</SelectItem>
                                                    <SelectItem value="6" className="text-xs font-bold">T.P 6</SelectItem>
                                                    <SelectItem value="7" className="text-xs font-bold">T.P 7</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="lg:col-span-4 space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                            <PercentCircle className="h-3 w-3 text-orange-500" />
                                            Market Price Tier
                                        </label>
                                        <Select value={marketPriceTier} onValueChange={setMarketPriceTier}>
                                            <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-xs font-bold">
                                                <SelectValue placeholder="Select Tier" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                                                <SelectItem value="1" className="text-xs font-bold">Trade Price (Base)</SelectItem>
                                                <SelectItem value="2" className="text-xs font-bold">T.P 2</SelectItem>
                                                <SelectItem value="3" className="text-xs font-bold">T.P 3</SelectItem>
                                                <SelectItem value="4" className="text-xs font-bold">T.P 4</SelectItem>
                                                <SelectItem value="5" className="text-xs font-bold">T.P 5</SelectItem>
                                                <SelectItem value="6" className="text-xs font-bold">T.P 6</SelectItem>
                                                <SelectItem value="7" className="text-xs font-bold">T.P 7</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* 4. Select Firm */}
                                <div className="lg:col-span-2 space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        <Briefcase className="h-3 w-3 text-orange-500" />
                                        Billing Firm
                                    </label>
                                    <Select value={selectedFirm} onValueChange={setSelectedFirm}>
                                        <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-xs font-bold">
                                            <SelectValue placeholder="Default (Haramain)" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                                            <SelectItem value="0" className="text-xs font-bold">Default (Haramain)</SelectItem>
                                            {firms.map((firm) => (
                                                <SelectItem key={firm.id} value={firm.id.toString()} className="text-xs font-bold">
                                                    {firm.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 5. Select Message Line */}
                                <div className="lg:col-span-2 space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        <Tag className="h-3 w-3 text-orange-500" />
                                        Footer Message Line
                                    </label>
                                    <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                                        <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-xs font-bold">
                                            <SelectValue placeholder="No Message Line" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                                            <SelectItem value="0" className="text-xs font-bold">No Message Line</SelectItem>
                                            {(messageLines || []).map((msg) => (
                                                <SelectItem key={msg.id} value={msg.id.toString()} className="text-xs font-bold">
                                                    {msg.messageline}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* ── Negotiation Manifest Ledger ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="space-y-3"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                                    Offer Items Manifest ({rows.filter((r) => r.item_id).length} Selected)
                                </span>
                                <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline">
                                    • Live stock verified from ERP inventory ledger
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={addMoreItems}
                                    className="flex-1 sm:flex-none h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Browse & Add Items ({items.filter((i) => getLiveStockMeta(i).totalPcs > 0).length} In Stock)
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const inStockItems = items.filter((it) => getLiveStockMeta(it).totalPcs > 0);
                                        if (inStockItems.length === 0) return;
                                        const allItemRows: RowData[] = inStockItems.map((item) => {
                                            const cat = categories.find((c) => String(c.id) === String(item.category));
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
                                                tp6Price = calculatePrice(item, null, Number(marketPriceTier));
                                            } else {
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
                                                company: item.company,
                                            };
                                        });
                                        setRows(allItemRows);
                                    }}
                                    className="h-9 px-3 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                    title="Load all items with positive live stock"
                                >
                                    <ListPlus className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                                    Load All In-Stock
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={resetRows}
                                    title="Clear Manifest"
                                    className="h-9 px-3 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 shrink-0"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <Card className="border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm bg-white dark:bg-zinc-900 overflow-hidden py-0">
                            <div className="overflow-x-auto min-h-[380px]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="hidden md:table-header-group">
                                        <tr className="border-b border-zinc-200 dark:border-zinc-800 h-12 bg-zinc-50/90 dark:bg-zinc-800/70">
                                            <th className="px-4 w-12 text-[10px] font-black uppercase tracking-wider text-zinc-400 text-center">
                                                #
                                            </th>
                                            <th className="px-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                                                <div className="flex items-center gap-2">
                                                    <PackageSearch className="h-3.5 w-3.5 text-orange-500" />
                                                    Product / Quick Select
                                                </div>
                                            </th>
                                            <th className="px-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-center">
                                                Live Stock (Full | Pcs)
                                            </th>
                                            {offerType === "1" ? (
                                                <>
                                                    <th className="px-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-center">
                                                        Carton Price (Rs)
                                                    </th>
                                                    <th className="px-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-center">
                                                        Loose Ctn Price (Rs)
                                                    </th>
                                                </>
                                            ) : (
                                                <th className="px-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-center">
                                                    Market Offer Rate (Rs)
                                                </th>
                                            )}
                                            <th className="px-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-center">
                                                M.R.P (Retail)
                                            </th>
                                            <th className="px-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                                                Promotional Scheme
                                            </th>
                                            <th className="px-4 w-12 text-center text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                                Del
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="flex flex-col md:table-row-group divide-y divide-zinc-100 dark:divide-zinc-800/70">
                                        <AnimatePresence mode="popLayout">
                                            {rows.map((row, idx) => (
                                                <motion.tr
                                                    key={row.id}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.15 }}
                                                    className={cn(
                                                        "hover:bg-orange-50/30 dark:hover:bg-zinc-800/40 transition-colors flex flex-col md:table-row p-3 md:p-0 relative",
                                                        selectedItemId === row.item_id && row.item_id !== null
                                                            ? "bg-orange-50/40 dark:bg-orange-950/20"
                                                            : ""
                                                    )}
                                                    onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                >
                                                    {/* Row # */}
                                                    <td className="px-4 py-3 text-center font-mono text-xs font-bold text-zinc-400 hidden md:table-cell">
                                                        {idx + 1}
                                                    </td>

                                                    {/* Item Column (Supports Direct Selection or Clicking Browse) */}
                                                    <td className="md:px-4 md:py-2.5 md:min-w-[320px] pb-2 md:pb-0 block md:table-cell">
                                                        <div className="flex items-center justify-between gap-2">
                                                            {row.item_id ? (
                                                                <div className="flex flex-col min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                                                                            {row.title}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold mt-0.5">
                                                                        <span>{getCompanyName(row.company)}</span>
                                                                        <span>•</span>
                                                                        <span>{row.category_name}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsRegistryOpen(true)}
                                                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-dashed border-orange-300 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-50 transition-colors text-xs font-bold"
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        <Search className="w-3.5 h-3.5" />
                                                                        Click to select products from Live Inventory...
                                                                    </span>
                                                                    <PlusCircle className="w-4 h-4 shrink-0" />
                                                                </button>
                                                            )}

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-lg hover:bg-rose-500/10 text-rose-500 md:hidden shrink-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeRow(row.id);
                                                                }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>

                                                    {/* Live Stock Column in Manifest */}
                                                    <td className="md:px-4 py-1.5 md:py-2.5 block md:table-cell text-center">
                                                        {(() => {
                                                            const matchedItem = row.item_id
                                                                ? items.find((i) => i.id === row.item_id)
                                                                : null;
                                                            if (!matchedItem) {
                                                                return (
                                                                    <span className="text-[10px] text-zinc-300 dark:text-zinc-600 font-mono">
                                                                        —
                                                                    </span>
                                                                );
                                                            }
                                                            const stockMeta = getLiveStockMeta(matchedItem);
                                                            return (
                                                                <div className="inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/30">
                                                                    <div
                                                                        className={cn(
                                                                            "font-mono text-xs font-black flex items-center gap-1.5",
                                                                            stockMeta.totalPcs > 0
                                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                                : stockMeta.totalPcs < 0
                                                                                ? "text-rose-600 dark:text-rose-400"
                                                                                : "text-zinc-500 dark:text-zinc-400"
                                                                        )}
                                                                    >
                                                                        <span>{stockMeta.formatted}</span>
                                                                        {stockMeta.status === "Deficit" && (
                                                                            <span className="px-1 py-0.2 rounded text-[8px] bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-black uppercase border border-rose-300">
                                                                                Deficit
                                                                            </span>
                                                                        )}
                                                                        {stockMeta.status === "Out of Stock" && (
                                                                            <span className="px-1 py-0.2 rounded text-[8px] bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 font-black uppercase border border-rose-200">
                                                                                0 Stock
                                                                            </span>
                                                                        )}
                                                                        {stockMeta.status === "Low Stock" && (
                                                                            <span className="px-1 py-0.2 rounded text-[8px] bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-black uppercase border border-amber-300">
                                                                                Low
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[9px] font-bold text-zinc-400 font-mono">
                                                                        Total: {stockMeta.totalPcs} Pcs
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>

                                                    {offerType === "1" ? (
                                                        <>
                                                            <td className="md:px-4 py-1 md:py-2.5 block md:table-cell text-center">
                                                                <Input
                                                                    type="number"
                                                                    value={row.pack_ctn || ""}
                                                                    onChange={(e) =>
                                                                        setRows((prev) =>
                                                                            prev.map((r) =>
                                                                                r.id === row.id
                                                                                    ? { ...r, pack_ctn: Number(e.target.value) }
                                                                                    : r
                                                                            )
                                                                        )
                                                                    }
                                                                    className="h-9 text-xs font-mono font-black text-center rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 w-full md:w-28 mx-auto"
                                                                />
                                                            </td>
                                                            <td className="md:px-4 py-1 md:py-2.5 block md:table-cell text-center">
                                                                <Input
                                                                    type="number"
                                                                    value={row.loos_ctn || ""}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        setRows((prev) =>
                                                                            prev.map((r) =>
                                                                                r.id === row.id
                                                                                    ? { ...r, loos_ctn: val, trade_price: val }
                                                                                    : r
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="h-9 text-xs font-mono font-black text-center rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 w-full md:w-28 mx-auto"
                                                                />
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <td className="md:px-4 py-1 md:py-2.5 block md:table-cell text-center">
                                                            <Input
                                                                type="number"
                                                                value={row.tp6 || ""}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value);
                                                                    setRows((prev) =>
                                                                        prev.map((r) =>
                                                                            r.id === row.id
                                                                                ? { ...r, tp6: val, trade_price: val }
                                                                                : r
                                                                        )
                                                                    );
                                                                }}
                                                                className="h-9 text-xs font-mono font-black text-center rounded-lg border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 w-full md:w-32 mx-auto"
                                                            />
                                                        </td>
                                                    )}

                                                    <td className="md:px-4 py-1 md:py-2.5 block md:table-cell text-center">
                                                        <Input
                                                            type="number"
                                                            className="h-9 text-xs font-mono font-bold rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-center w-full md:w-24 mx-auto"
                                                            value={row.mrp || ""}
                                                            onChange={(e) =>
                                                                setRows((prev) =>
                                                                    prev.map((r) =>
                                                                        r.id === row.id
                                                                            ? { ...r, mrp: Number(e.target.value) }
                                                                            : r
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td className="md:px-4 py-1 md:py-2.5 block md:table-cell">
                                                        <Input
                                                            className="h-9 text-xs font-semibold rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 w-full"
                                                            placeholder="e.g. 10+1 Free, Net Rate..."
                                                            value={row.scheme}
                                                            onChange={(e) =>
                                                                setRows((prev) =>
                                                                    prev.map((r) =>
                                                                        r.id === row.id ? { ...r, scheme: e.target.value } : r
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-4 py-2.5 text-center hidden md:table-cell">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg hover:bg-rose-500/10 group transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeRow(row.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-zinc-400 group-hover:text-rose-500" />
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Footer */}
                            <div className="bg-zinc-50/80 dark:bg-zinc-800/50 px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-zinc-500">Selected Offer Items:</span>
                                        <span className="text-sm font-black text-orange-600 dark:text-orange-400 font-mono">
                                            {rows.filter((r) => r.item_id).length}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                    <BadgeInfo className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                    <span>Click any row to inspect its 7-tier Trade Price matrix below.</span>
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

                                    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-7 gap-3">
                                        {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                                            let percentage = 0;
                                            let label = "";

                                            if (num === 1) {
                                                percentage = 0;
                                                label = "Trade Price";
                                            } else {
                                                const priceKey = `pt${num}` as keyof Item;
                                                percentage = Number(selectedItem[priceKey] ?? 0);
                                                label = `Tier ${num}`;
                                            }

                                            // Formula: Trade Price * (1 + Percentage / 100)
                                            const adjustedPrice = calculatePrice(selectedItem, num);
                                            const isActive = String(num) === String(customerCategory);

                                            if (num !== 1 && percentage === 0 && !isActive) return null;

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
                                                        {label} <span className="opacity-60 lowercase font-bold">{num === 1 ? "(BASE)" : `(${percentage}%)`}</span>
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
                    <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl flex flex-col max-h-[90vh] max-h-[90dvh]">
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <DialogTitle className="text-lg sm:text-2xl font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                                        <Box className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 shrink-0" /> Item Registry
                                    </DialogTitle>
                                    <DialogDescription className="text-zinc-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.2em] mt-1">
                                        Selection Portal for Multi-Offer Sequence
                                    </DialogDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                                        {filteredRegistryItems.length} of {items.length} Items
                                    </span>
                                    {(selectedCompanyFilter !== "all" || selectedCategoryFilter !== "all" || selectedStockFilter !== "in_stock" || searchQuery) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedCompanyFilter("all");
                                                setSelectedCategoryFilter("all");
                                                setSelectedStockFilter("in_stock");
                                                setSearchQuery("");
                                            }}
                                            className="h-7 px-2 text-[10px] font-bold text-orange-400 hover:text-white hover:bg-orange-500/20 uppercase tracking-wider"
                                        >
                                            <RotateCcw className="h-3 w-3 mr-1" /> Reset
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Search Query Bar */}
                            <div className="mt-3 relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" size={16} />
                                <Input
                                    placeholder="Query by Title, Code, ID, Company, or Category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 sm:pl-10 h-10 sm:h-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:ring-0 focus:bg-white/10 transition-all rounded-sm border-zinc-700 font-bold text-xs sm:text-sm"
                                    autoFocus
                                />
                            </div>

                            {/* Company, Category & Live Stock Filter Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                        <Briefcase className="h-3 w-3 text-orange-500" />
                                        Company ({companyOptions.length - 1})
                                    </label>
                                    <Combobox
                                        options={companyOptions}
                                        value={selectedCompanyFilter}
                                        onChange={setSelectedCompanyFilter}
                                        placeholder="All Companies"
                                        searchPlaceholder="Search company..."
                                        className="h-10 bg-white/10 dark:bg-white/10 border-white/15 text-white hover:bg-white/15 hover:border-orange-500/50 rounded-md text-xs font-bold justify-between"
                                        popoverClassName="w-[--radix-popover-trigger-width] min-w-[260px] z-[9999]"
                                        modal={false}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                        <Layers className="h-3 w-3 text-orange-500" />
                                        Category ({categoryOptions.length - 1})
                                    </label>
                                    <Combobox
                                        options={categoryOptions}
                                        value={selectedCategoryFilter}
                                        onChange={setSelectedCategoryFilter}
                                        placeholder="All Categories"
                                        searchPlaceholder="Search category..."
                                        className="h-10 bg-white/10 dark:bg-white/10 border-white/15 text-white hover:bg-white/15 hover:border-orange-500/50 rounded-md text-xs font-bold justify-between"
                                        popoverClassName="w-[--radix-popover-trigger-width] min-w-[260px] z-[9999]"
                                        modal={false}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                        <Filter className="h-3 w-3 text-orange-500" />
                                        Live Stock Filter
                                    </label>
                                    <Select
                                        value={selectedStockFilter}
                                        onValueChange={(val: "in_stock" | "all" | "low_stock" | "out_of_stock") =>
                                            setSelectedStockFilter(val)
                                        }
                                    >
                                        <SelectTrigger className="w-full h-10 bg-white/10 border-white/15 text-white hover:bg-white/15 rounded-md text-xs font-bold">
                                            <SelectValue placeholder="In Stock (> 0)" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[9999]">
                                            <SelectItem value="in_stock" className="text-xs font-bold">
                                                In Stock Only (&gt; 0 Pcs)
                                            </SelectItem>
                                            <SelectItem value="all" className="text-xs font-bold">
                                                All Active Items (Include 0 / Deficit)
                                            </SelectItem>
                                            <SelectItem value="low_stock" className="text-xs font-bold">
                                                Low Stock Only
                                            </SelectItem>
                                            <SelectItem value="out_of_stock" className="text-xs font-bold">
                                                Out of Stock / Deficit (&le; 0)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto touch-scroll-x overflow-y-auto custom-scrollbar min-h-0 bg-zinc-50/30 dark:bg-zinc-950/30">
                            <div className="min-w-[760px]">
                                <div className="grid grid-cols-12 bg-zinc-100/80 dark:bg-zinc-900/80 px-4 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="col-span-4 text-[9px] font-black uppercase text-zinc-400 tracking-widest">Item Description</div>
                                    <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-400 tracking-widest">Live Inventory</div>
                                    <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-400 tracking-widest">Carton Price</div>
                                    <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-400 tracking-widest">Loose Price</div>
                                    <div className="col-span-1 text-center text-[9px] font-black uppercase text-zinc-400 tracking-widest">Scheme</div>
                                    <div className="col-span-1 text-right text-[9px] font-black uppercase text-zinc-400 tracking-widest">MRP</div>
                                </div>

                                <div className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                                    {filteredRegistryItems.map((item) => {
                                        const isSelected = rows.some(r => r.item_id === item.id);
                                        const stockMeta = getLiveStockMeta(item);

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
                                                 type="button"
                                                 onClick={() => handleSelectFromRegistry(item)}
                                                 className={`w-full text-left transition-all p-3 sm:p-4 grid grid-cols-12 items-center gap-2 sm:gap-3 group ${
                                                     isSelected 
                                                     ? "bg-orange-500/10 dark:bg-orange-500/5 border-l-4 border-orange-500" 
                                                     : "hover:bg-zinc-100 dark:hover:bg-zinc-900 border-l-4 border-transparent"
                                                 }`}
                                             >
                                                 <div className="col-span-4 flex items-center gap-2 sm:gap-3 min-w-0">
                                                     <div className={`h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                                                         isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-zinc-300 dark:border-zinc-700"
                                                     }`}>
                                                         {isSelected && <Check size={12} strokeWidth={4} />}
                                                     </div>
                                                     <div className="flex flex-col min-w-0">
                                                         <span className={`text-xs sm:text-sm font-black uppercase tracking-tight truncate ${isSelected ? "text-orange-600" : "text-zinc-700 dark:text-zinc-200"}`}>
                                                             {item.title}
                                                         </span>
                                                         <span className="text-[10px] font-bold text-zinc-400 truncate">
                                                             {item.code ? `${item.code} • ` : ""}{getCompanyName(item.company)} | {getCategoryName(item.category)}
                                                         </span>
                                                     </div>
                                                 </div>

                                                 {/* Live Inventory Breakdown (Matches /items & /sales/create) */}
                                                 <div className="col-span-2 text-center">
                                                     <div className="flex flex-col items-center justify-center">
                                                         <div
                                                             className={cn(
                                                                 "font-mono text-xs font-black inline-flex items-center gap-1",
                                                                 stockMeta.totalPcs > 0
                                                                     ? "text-emerald-600 dark:text-emerald-400"
                                                                     : stockMeta.totalPcs < 0
                                                                     ? "text-rose-600 dark:text-rose-400"
                                                                     : "text-zinc-500 dark:text-zinc-400"
                                                             )}
                                                         >
                                                             <span>{stockMeta.formatted}</span>
                                                             {stockMeta.status === "Deficit" && (
                                                                 <span className="px-1 py-0.2 rounded text-[8px] bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-black uppercase border border-rose-300">
                                                                     Deficit
                                                                 </span>
                                                             )}
                                                             {stockMeta.status === "Out of Stock" && (
                                                                 <span className="px-1 py-0.2 rounded text-[8px] bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 font-black uppercase border border-rose-200">
                                                                     0 Stock
                                                                 </span>
                                                             )}
                                                         </div>
                                                         <span className="text-[9px] font-mono font-bold text-zinc-400">
                                                             Total: {stockMeta.totalPcs} Pcs
                                                         </span>
                                                     </div>
                                                 </div>

                                                 <div className="col-span-2 text-center font-black tabular-nums text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Rs {prices.pack.toLocaleString()}</div>
                                                 <div className="col-span-2 text-center font-black tabular-nums text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Rs {prices.loose.toLocaleString()}</div>
                                                 <div className="col-span-1 text-center">
                                                     <span className="px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase tracking-wider border border-blue-500/20 truncate block">
                                                         {(offerType === "2" ? item.scheme2 : item.scheme) || '—'}
                                                     </span>
                                                 </div>
                                                 <div className="col-span-1 text-right font-black tabular-nums text-xs sm:text-sm text-orange-600 dark:text-orange-500">Rs {item.retail.toLocaleString()}</div>
                                             </button>
                                         );
                                     })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-4 shrink-0">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    filteredRegistryItems.forEach(it => {
                                        if (!rows.some(r => r.item_id === it.id)) handleSelectFromRegistry(it);
                                    });
                                }}
                                className="h-10 text-[10px] font-black uppercase tracking-widest border-zinc-300 dark:border-zinc-700 hover:bg-orange-500 hover:text-white rounded-sm w-full sm:w-auto"
                            >
                                Select All
                            </Button>
                            <Button
                                onClick={() => setIsRegistryOpen(false)}
                                className="h-10 px-8 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-orange-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest rounded-sm w-full sm:w-auto"
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
