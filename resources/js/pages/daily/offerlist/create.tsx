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
    Trash2,
    Plus,
    FileText,
    RotateCcw,
    Sparkles,
    Zap,
    Workflow,
    Save,
    CalendarClock,
    UserCircle2,
    Tag,
    ShieldCheck,
    PackageSearch,
    BadgeInfo,
    LayoutGrid,
    ListPlus,
    History
} from "lucide-react";
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
    { title: "Material Control", href: "/offer" },
    { title: "Negotiation Registry", href: "/offer/list" },
    { title: "Node Initialization", href: "/offer-list/create" },
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
    mrp: number;
}

interface MessageLine {
    id: number;
    messageline: string;
}

export default function OfferListing({ items, categories, accounts, messageLines }: { items: Item[]; categories: Category[]; accounts: Account[]; messageLines?: MessageLine[] }) {
    const [date] = useState(new Date().toLocaleDateString('en-GB'));
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [customerCategory, setCustomerCategory] = useState<string | null>(null);
    const [priceType, setPriceType] = useState<"trade" | "retail" | "both">("trade");
    const [selectedMessageId, setSelectedMessageId] = useState<string>("0");
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    // Get the currently selected item details for the info panel
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return items.find((it) => it.id === selectedItemId) ?? null;
    }, [selectedItemId, items]);

    // Helper: Calculate Category-specific Trade Price
    const calculatePrice = (item: Item, cat: string | number | null) => {
        const actualTradePrice = Number(item.trade_price ?? 0);
        const catStr = cat ? String(cat) : null;
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

    // Smart Pricing Alignment: Auto-select Trade Price and Sync manifest when customer changes
    useEffect(() => {
        if (selectedAccount) {
            setPriceType("trade");

            // Bulk Synchronize manifests with new customer pricing protocol
            setRows(prev => prev.map(row => {
                if (!row.item_id) return row;
                const item = items.find(i => i.id === row.item_id);
                if (!item) return row;

                return {
                    ...row,
                    trade_price: calculatePrice(item, customerCategory)
                };
            }));
        }
    }, [selectedAccount, customerCategory]);

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
    });

    const [rows, setRows] = useState<RowData[]>([getEmptyRow()]);

    const addRow = () => {
        setRows((prev) => [getEmptyRow(), ...prev]);
    };

    const loadAllItems = () => {
        const allItemRows: RowData[] = items.map((item) => {
            const cat = categories.find(c => String(c.id) === String(item.category));
            const catName = cat ? cat.name : "Uncategorized";

            return {
                id: Date.now() + item.id + Math.random(),
                item_id: item.id,
                title: item.title,
                pack_ctn: item.packing_qty,
                loos_ctn: item.retail_tp_diff,
                trade_price: calculatePrice(item, customerCategory),
                retail: item.retail,
                category_name: catName,
                discount: item.discount?.toString() ?? "",
                scheme: "",
                mrp: item.retail,
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

        setRows((prev) =>
            prev.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        item_id: itemId,
                        title: selected.title,
                        pack_ctn: selected.packing_qty,
                        loos_ctn: selected.retail_tp_diff,
                        trade_price: calculatePrice(selected, customerCategory),
                        retail: selected.retail,
                        category_name: catName,
                        discount: selected.discount?.toString() ?? "",
                        scheme: "",
                        mrp: selected.retail,
                    }
                    : row
            )
        );
    };

    const storeOffer = () => {
        if (!selectedAccount) {
            alert("Please select a Negotiation Entity (Account) first.");
            return;
        }

        const itemsData = rows
            .filter((r) => r.item_id !== null)
            .map((r) => ({
                item_id: r.item_id,
                pack_ctn: r.pack_ctn,
                loos_ctn: r.loos_ctn,
                price_type: priceType === 'both' ? 'trade-retail' : priceType,
                mrp: r.mrp,
                price: priceType === 'trade' ? r.trade_price : r.retail,
                scheme: r.scheme,
                status: 'active'
            }));

        if (itemsData.length === 0) {
            alert("Provisioning failed: No item nodes detected in current manifest.");
            return;
        }

        const [day, month, year] = date.split('/');
        const formattedDate = `${year}-${month}-${day}`;

        router.post('/offer-list', {
            account_id: selectedAccount,
            date: formattedDate,
            price_type: priceType,
            message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,
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
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-[0.3em]">
                                <Workflow className="h-3 w-3" />
                                <span>Negotiation Protocol</span>
                            </div>
                            <Heading
                                title="Offer List Creation"
                                description="Provisioning new material offers and negotiation dossiers for commercial entities."
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/offer-list')}
                                className="rounded-xl border-zinc-200 dark:border-zinc-800 text-[11px] font-black uppercase tracking-widest h-12 px-6 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <History className="mr-2 h-4 w-4" />
                                Cancel & Return
                            </Button>
                            <Button
                                onClick={storeOffer}
                                className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white transition-all duration-300 rounded-xl px-8 h-12 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-zinc-200 dark:shadow-none bg-orange-500/100"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Synchronize Offer
                            </Button>
                        </motion.div>
                    </div>

                    {/* Control Surface */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="p-8 border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Sparkles className="h-24 w-24 text-orange-500" />
                            </div>

                            <div className="grid grid-cols-12 gap-8 items-start relative z-10">
                                <div className="col-span-12 lg:col-span-2 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <CalendarClock className="h-3 w-3" />
                                        Temporal Node
                                    </div>
                                    <Input
                                        value={date}
                                        readOnly
                                        className="bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 h-11 rounded-sm font-bold tabular-nums text-zinc-500"
                                    />
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <UserCircle2 className="h-3 w-3" />
                                        Select Customer
                                    </div>
                                    <Select value={selectedAccount} onValueChange={(val) => {
                                        setSelectedAccount(val);
                                        const account = accounts.find(a => String(a.id) === val);
                                        setCustomerCategory(account?.item_category ?? null);
                                    }}>
                                        <SelectTrigger className="w-full h-11 rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-xs font-bold">
                                            <SelectValue placeholder="Identify Commercial Profile" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-sm border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                            <SelectGroup>
                                                <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 p-3">Verified Accounts</SelectLabel>
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id.toString()} className="rounded-sm m-1 text-xs font-bold">
                                                        {acc.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-12 lg:col-span-3 space-y-2 text-orange-500">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <Zap className="h-3 w-3" />
                                        Pricing Logic
                                    </div>
                                    <Select value={priceType} onValueChange={(v: any) => setPriceType(v)}>
                                        <SelectTrigger className={cn(
                                            "w-full h-11 rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-xs font-bold transition-all",
                                            selectedAccount && "border-orange-500/50 ring-2 ring-orange-500/10 text-orange-600"
                                        )}>
                                            <SelectValue>
                                                {selectedAccount && priceType === 'trade'
                                                    ? `TP ${customerCategory ?? 'Base'} Protocol`
                                                    : undefined}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                            <SelectItem value="trade" className="text-xs font-bold">
                                                {selectedAccount
                                                    ? `Type ${customerCategory ?? 'Base'} Protocol (Aligned)`
                                                    : "Trade Price Protocol (TP)"}
                                            </SelectItem>
                                            <SelectItem value="retail" className="text-xs font-bold">Retail Price Matrix (RP)</SelectItem>
                                            <SelectItem value="both" className="text-xs font-bold">Dual Sync (TP + RP)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {selectedAccount && (
                                        <div className="text-[9px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                                            <ShieldCheck className="h-2 w-2" />
                                            Active Alignment: Prioritizing TP
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-12 lg:col-span-3 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <Tag className="h-3 w-3" />
                                        Protocol Context
                                    </div>
                                    <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                                        <SelectTrigger className="w-full h-11 rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-xs font-bold">
                                            <SelectValue placeholder="Registry Message" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                            <SelectItem value="0" className="text-xs font-bold">No Custom Header</SelectItem>
                                            {messageLines?.map(msg => (
                                                <SelectItem key={msg.id} value={msg.id.toString()} className="text-xs font-bold truncate max-w-[200px]">
                                                    {msg.messageline}
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
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Negotiation Manifest Ledger</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={addRow}
                                    className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <ListPlus className="mr-2 h-3.5 w-3.5" />
                                    Insert Node
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={loadAllItems}
                                    className="h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20"
                                >
                                    <LayoutGrid className="mr-2 h-3.5 w-3.5" />
                                    Provision Full Matrix
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={resetRows}
                                    className="h-9 w-9 p-0 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all group"
                                >
                                    <RotateCcw className="h-4 w-4 transition-transform group-active:rotate-180" />
                                </Button>
                            </div>
                        </div>

                        <Card className="border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md overflow-hidden">
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-200 dark:border-zinc-800 h-14 bg-zinc-50/50 dark:bg-zinc-950/20">
                                            <th className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                <div className="flex items-center gap-2 italic">
                                                    <PackageSearch className="h-3 w-3 text-orange-500" />
                                                    Material Node
                                                </div>
                                            </th>
                                            <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Configuration</th>
                                            <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Reference M.R.P</th>
                                            <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Scheme Logic</th>
                                            <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Protocol Valuation</th>
                                            <th className="px-6 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence mode="popLayout">
                                            {rows.map((row, idx) => (
                                                <motion.tr
                                                    key={row.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-orange-500/[0.02] dark:hover:bg-orange-500/[0.02] transition-colors h-16 cursor-pointer"
                                                    onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                >
                                                    <td className="px-6 min-w-[300px]">
                                                        <Select
                                                            value={row.item_id?.toString() ?? ""}
                                                            onValueChange={(val) => handleSelectItem(row.id, Number(val))}
                                                        >
                                                            <SelectTrigger className="h-10 rounded-sm w-full border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 text-[11px] font-black">
                                                                <SelectValue placeholder="Identify Item Node..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                                <SelectGroup>
                                                                    <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 p-2">Item Matrix</SelectLabel>
                                                                    {items.map((item) => (
                                                                        <SelectItem key={item.id} value={item.id.toString()} className="rounded-lg m-1 text-xs font-bold">
                                                                            {item.title} ({item.short_name})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="px-4 min-w-[200px]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="space-y-1 flex-1">
                                                                <Label className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none">Full</Label>
                                                                <Input
                                                                    className="h-8 text-[11px] font-bold tabular-nums rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/30 dark:bg-zinc-900/30"
                                                                    value={row.pack_ctn}
                                                                    onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, pack_ctn: Number(e.target.value) } : r))}
                                                                />
                                                            </div>
                                                            <div className="space-y-1 flex-1">
                                                                <Label className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none">Pieces</Label>
                                                                <Input
                                                                    className="h-8 text-[11px] font-bold tabular-nums rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/30 dark:bg-zinc-900/30"
                                                                    value={row.loos_ctn}
                                                                    onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, loos_ctn: Number(e.target.value) } : r))}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 text-center">
                                                        <div className="space-y-1 inline-block">
                                                            <Label className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none">Retail Price</Label>
                                                            <Input
                                                                className="h-8 text-[11px] font-black tabular-nums rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/30 dark:bg-zinc-900/30 text-center w-24"
                                                                value={row.mrp}
                                                                onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, mrp: Number(e.target.value) } : r))}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4">
                                                        <div className="space-y-1">
                                                            <Label className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none">Negotiation Scheme</Label>
                                                            <Input
                                                                className="h-8 text-[10px] font-bold rounded-sm border-zinc-200 dark:border-zinc-700 bg-white/30 dark:bg-zinc-900/30 w-full"
                                                                placeholder="e.g. 10+1 Promo..."
                                                                value={row.scheme}
                                                                onChange={(e) => setRows(prev => prev.map(r => r.id === row.id ? { ...r, scheme: e.target.value } : r))}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[12px] font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                                                                <span className="text-[10px] text-zinc-400 mr-1 italic">V:</span>
                                                                {priceType === 'trade' ? row.trade_price.toLocaleString() :
                                                                    priceType === 'retail' ? row.retail.toLocaleString() :
                                                                        `${row.trade_price.toLocaleString()} | ${row.retail.toLocaleString()}`}
                                                            </span>
                                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-500 opacity-60 mt-0.5">
                                                                {priceType === 'both' ? 'Dual Node' : priceType + ' Logic'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg hover:bg-rose-500/10 group overflow-hidden transition-colors"
                                                            onClick={() => removeRow(row.id)}
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

                            {/* Manifest Summary Footer */}
                            <div className="bg-zinc-950/20 dark:bg-zinc-950/40 p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Total Manifest Nodes</span>
                                        <span className="text-sm font-black text-orange-500 tabular-nums">{rows.filter(r => r.item_id).length} Active</span>
                                    </div>
                                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Pricing Alignment</span>
                                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase italic">
                                            {priceType === 'trade' ? 'Trade Price Protocol' : priceType === 'retail' ? 'Retail Price Matrix' : 'Dual Synchronization'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-zinc-400 italic text-[10px]">
                                    <BadgeInfo className="h-3 w-3" />
                                    All values are normalized based on current server-side Commercial Intelligence.
                                </div>
                            </div>

                            {/* Price Protocol Dashboard (TP2-TP7 Intelligence) */}
                            {selectedItem && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-800 p-6"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Price Protocol Intelligence: {selectedItem.title}</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
            </SidebarInset>
        </SidebarProvider>
    );
}

