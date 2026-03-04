// purchase_return/create.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import {
    Trash2, Plus, CalendarIcon, RotateCcw, FileText,
    Search, ChevronRight, Hash, User as UserIcon,
    ArrowRightLeft, BadgePercent, Calculator, Package, Info, CheckCircle2,
    ArrowDownToLine, Clock, Banknote, Database, ShieldCheck, History, Tags, ListRestart
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/" },
    { title: "Purchase Return", href: "/purchase-return" },
];

// Style Constants (Professional Modern)
const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const MONO_FONT = "font-mono tracking-tighter";

const SIGNAL_ORANGE = "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20";
const SIGNAL_GREEN = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20";
const SIGNAL_RED = "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20";

// Standardizing gradients and surface colors
const PREMIUM_SURFACE = "bg-white dark:bg-zinc-950/50";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-500 to-rose-500";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-200/50 dark:shadow-none";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────
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
}

interface RowData {
    id: number;
    item_id: number | null;
    item_title: string;
    full: number;
    pcs: number;
    sold_full: number;
    sold_pcs: number;
    rate: number;
    taxPercent: number;
    discPercent: number;
    taxReadOnly?: boolean;
    discReadOnly?: boolean;
    amount: number;
    packing: number;
    // Bonus Fields
    bonus_full: number;
    bonus_pcs: number;
    has_bonus_available?: boolean;
    // Intelligence Fields
    purchase_date?: string;
    purchase_invoice?: string;
    current_stock?: number;
    tp?: number;
    supplier_name?: string;
    salesman?: string;
}

interface Invoice {
    id: number;
    invoice: string;
    date: string;
    net_total: number;
    remaining_amount: number;
    status: string;
}

interface Account {
    id: number;
    title: string;
    aging_days?: number;
    credit_limit?: number | string;
    saleman_id?: number;
}

interface Props {
    items: Item[];
    accounts: Account[];
    salemans: { id: number; name: string }[];
    purchase?: any;
}

const toNum = (v: any) => { const n = Number(v); return isNaN(n) ? 0 : n; };

const fmtDate = (d: string) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ───────────────────────────────────────────
// Shared Components
// ───────────────────────────────────────────

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5">
            {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
            {label}
        </div>
        {children}
    </div>
);

const SignalBadge = ({ text, type = 'blue' }: { text: string, type?: 'green' | 'red' | 'orange' | 'blue' }) => {
    const colors = {
        green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        red: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
    return (
        <span className={`px-2 py-0.5 ${PREMIUM_ROUNDING_MD} text-[10px] font-black uppercase tracking-tighter border ${colors[type]}`}>
            {text}
        </span>
    );
};

const ItemDetailCard = ({ row }: { row: RowData }) => {
    const mainReturnPcs = (row.full || 0) * (row.packing || 1) + (row.pcs || 0);
    const bonusReturnPcs = (row.bonus_full || 0) * (row.packing || 1) + (row.bonus_pcs || 0);
    const totalReturnPcs = mainReturnPcs + bonusReturnPcs;
    const updatedStock = (row.current_stock || 0) - totalReturnPcs; // For Purchase Return, stock decreases

    return (
        <Card className={`p-0 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} overflow-hidden relative group hover:border-orange-500/50 transition-all border-l-4 border-l-orange-500 w-full shadow-lg shadow-black/5`}>
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800">
                {/* Sec 1: Identity & Traceability */}
                <div className="p-4 flex-1 min-w-[260px] relative overflow-hidden group/id">
                    <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.07] group-hover/id:scale-110 transition-transform duration-700">
                        <ShieldCheck size={96} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5 text-zinc-400">
                                <Hash size={10} className="text-orange-500 shadow-sm" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Registry Identity</span>
                            </div>
                            <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight block truncate">
                                {row.item_title}
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase flex items-center w-fit gap-1 shadow-sm">
                                <History size={10} />
                                INV: {row.purchase_invoice}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sec 2: Historical Context */}
                <div className="p-4 flex-1 min-w-[220px] bg-zinc-50/30 dark:bg-zinc-900/10">
                    <div className="flex flex-col h-full justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <CalendarIcon size={10} />
                                <div className="text-[9px] font-black uppercase tracking-widest">Transaction Date</div>
                            </div>
                            <div className="text-sm font-black text-zinc-800 dark:text-zinc-200 font-mono italic">
                                {fmtDate(row.purchase_date || "")}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <UserIcon size={10} />
                                <div className="text-[9px] font-black uppercase tracking-widest">Supplier</div>
                            </div>
                            <div className="text-xs font-black text-zinc-700 dark:text-zinc-300 truncate tracking-tight uppercase">
                                {row.supplier_name}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sec 3: Tactical Delta */}
                <div className="p-4 flex-1 min-w-[220px]">
                    <div className="flex flex-col h-full justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Package size={10} />
                                <div className="text-[9px] font-black uppercase tracking-widest">Purchased Qty</div>
                            </div>
                            <div className="text-sm font-black text-zinc-600 dark:text-zinc-400 font-mono">
                                {row.sold_full}F <span className="text-[10px] opacity-40">&bull;</span> {row.sold_pcs}P
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-orange-500/50">
                                <ArrowRightLeft size={10} className="text-orange-500" />
                                <div className="text-[9px] font-black uppercase tracking-widest text-orange-600">Return Qty</div>
                            </div>
                            <div className="text-sm font-black text-orange-600 font-mono">
                                {row.full}F <span className="text-[10px] opacity-40">&bull;</span> {row.pcs}P
                                {bonusReturnPcs > 0 && (
                                    <span className="ml-2 text-emerald-600 text-[10px]">
                                        (+{row.bonus_full}F {row.bonus_pcs}P Bonus)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sec 4: Asset Intelligence */}
                <div className="p-4 flex-1 min-w-[260px] bg-zinc-50/30 dark:bg-zinc-900/10">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <div className="flex flex-col justify-between truncate">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                    <Banknote size={10} />
                                    <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Purch Price</div>
                                </div>
                                <div className="text-sm font-black text-zinc-900 dark:text-white font-mono tracking-tighter">Rs {row.rate}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-zinc-400 opacity-60">
                                    <Tags size={10} />
                                    <div className="text-[8px] font-black uppercase tracking-widest ">Cost T.P</div>
                                </div>
                                <div className="text-xs font-bold text-zinc-500 font-mono tracking-tighter">Rs {row.tp}</div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end items-end h-full">
                            <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-live-pulse" />
                                Live Stock
                            </div>
                            <div className="flex flex-col items-end">
                                {totalReturnPcs > 0 && (
                                    <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                        className="text-[10px] font-black text-rose-500 flex items-center gap-1 mb-1">
                                        <Plus size={8} /> -{totalReturnPcs} PCS
                                    </motion.div>
                                )}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-emerald-600 tracking-tighter leading-none">{updatedStock}</span>
                                    <span className="text-[9px] font-black text-emerald-600/50 uppercase">Pcs</span>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <Database size={12} className="text-zinc-300 dark:text-zinc-700" />
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em]">{row.packing} PCS/PK</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default function PurchaseReturnCreatePage({ items, accounts, salemans, purchase }: Props) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // ── Header state ──────────────────────────
    const [date, setDate] = useState<Date>(new Date());
    const [calOpen, setCalOpen] = useState(false);
    const [invoiceNo, setInvoiceNo] = useState("");
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [salesman, setSalesman] = useState<number | null>(null);
    const [accountSearch, setAccountSearch] = useState("");
    const [refundAmount, setRefundAmount] = useState(0);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [originalInvoiceNo, setOriginalInvoiceNo] = useState("");

    // ── Invoice Dialog state ───────────────────
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // ── Bulk Assignment state ────────────────
    const [assignItemDialogOpen, setAssignItemDialogOpen] = useState(false);
    const [assignSearch, setAssignSearch] = useState("");
    const [selectedAssignIds, setSelectedAssignIds] = useState<number[]>([]);
    const [supplierItems, setSupplierItems] = useState<any[]>([]);

    // ── Mobile specific states ────────────────
    const [showStickyFooter, setShowStickyFooter] = useState(true);
    const lastScrollY = React.useRef(0);
    const [mobileAccOpen, setMobileAccOpen] = useState(false);
    const [desktopAccOpen, setDesktopAccOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const currentScrollY = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;

            if (currentScrollY < 10 || currentScrollY + clientHeight >= scrollHeight - 50) {
                setShowStickyFooter(true);
            }
            else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setShowStickyFooter(false);
            } else if (currentScrollY < lastScrollY.current) {
                setShowStickyFooter(true);
            }

            lastScrollY.current = currentScrollY;
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // ── Item rows ─────────────────────────────
    const getEmptyRow = (): RowData => ({
        id: Date.now() + Math.random(),
        item_id: null,
        item_title: "",
        full: 0,
        pcs: 0,
        sold_full: 0,
        sold_pcs: 0,
        rate: 0,
        taxPercent: 0,
        discPercent: 0,
        taxReadOnly: false,
        discReadOnly: false,
        amount: 0,
        packing: 1,
        bonus_full: 0,
        bonus_pcs: 0,
        has_bonus_available: false,
        purchase_date: "",
        purchase_invoice: "",
        current_stock: 0,
        tp: 0,
        supplier_name: "",
    });

    const [rows, setRows] = useState<RowData[]>([getEmptyRow()]);
    const [selectedRowItemId, setSelectedRowItemId] = useState<number | null>(null);
    const [focusedRowId, setFocusedRowId] = useState<number | null>(null);
    const manifestRef = useRef<HTMLDivElement>(null);

    // Initial state from purchase if present
    useEffect(() => {
        if (purchase) {
            setOriginalInvoiceNo(purchase.invoice);
            const acc = accounts.find(a => a.id === purchase.supplier_id) || null;
            setSelectedAccount(acc);

            if (purchase.items) {
                const loadedRows = purchase.items.map((pi: any) => {
                    const it = pi.item;
                    const packing = toNum(it?.packing_full ?? it?.packing_qty ?? 1);
                    return {
                        id: Math.random(),
                        item_id: pi.item_id,
                        item_title: it?.title ?? "",
                        full: 0,
                        pcs: 0,
                        sold_full: toNum(pi.qty_carton),
                        sold_pcs: toNum(pi.qty_pcs),
                        rate: toNum(pi.trade_price),
                        taxPercent: toNum(it?.gst_percent ?? 0),
                        discPercent: toNum(it?.discount ?? 0),
                        taxReadOnly: true,
                        discReadOnly: true,
                        amount: 0,
                        packing: packing,
                        bonus_full: 0,
                        bonus_pcs: 0,
                        has_bonus_available: true,
                        purchase_date: purchase.date,
                        purchase_invoice: purchase.invoice,
                        current_stock: toNum(it?.stock_1),
                        tp: toNum(it?.trade_price),
                        supplier_name: acc?.title ?? "N/A",
                    };
                });
                setRows(loadedRows.length > 0 ? loadedRows : [getEmptyRow()]);
            }
        }
    }, [purchase, accounts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (manifestRef.current && !manifestRef.current.contains(event.target as Node)) {
                setFocusedRowId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── Supplier selection ──────────────────────
    const handleAccountSelect = (accId: number) => {
        const acc = accounts.find(a => a.id === accId) ?? null;
        setSelectedAccount(acc);
        setSelectedInvoice(null);
        setOriginalInvoiceNo("");
        setRows([getEmptyRow()]);
        setInvoices([]);

        if (acc) {
            setSalesman(acc.saleman_id ?? null);
            fetch(`/purchase-return/supplier/${accId}/purchased-items`)
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setSupplierItems(data); })
                .catch(console.error);
        }
        setMobileAccOpen(false);
        setDesktopAccOpen(false);
    };

    // ── Invoice logic ──────────────────────────
    const openInvoiceDialog = () => {
        if (!selectedAccount) return;
        setInvoiceDialogOpen(true);
        setLoadingInvoices(true);
        fetch(`/purchase-return/supplier/${selectedAccount.id}/invoices`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setInvoices(data); })
            .catch(console.error)
            .finally(() => setLoadingInvoices(false));
    };

    const handleSelectInvoice = (inv: Invoice) => {
        setInvoiceDialogOpen(false);
        setSelectedInvoice(inv);
        setOriginalInvoiceNo(inv.invoice);
        fetch(`/purchase-return/invoice/${inv.id}/items`)
            .then(r => r.json())
            .then(data => {
                const items = data.items || data;
                if (Array.isArray(items)) {
                    const loadedRows = items.map((pi: any) => {
                        const s_full = toNum(pi.qty_carton);
                        const s_pcs = toNum(pi.qty_pcs);
                        const rate = toNum(pi.trade_price);
                        const it = pi.item;
                        const packing = toNum(it?.packing_full ?? it?.packing_qty ?? 1);

                        const discVal = toNum(pi.discount);
                        const taxVal = toNum(pi.gst_amount);
                        const totalUnits = s_full * packing + s_pcs;
                        const baseAmountForCalc = totalUnits * rate;
                        const discPercent = baseAmountForCalc > 0 ? (discVal / baseAmountForCalc * 100) : 0;
                        const taxableAmountForCalc = baseAmountForCalc - discVal;
                        const taxPercent = taxableAmountForCalc > 0 ? (taxVal / taxableAmountForCalc * 100) : 0;

                        return {
                            id: Math.random(),
                            item_id: pi.item_id,
                            item_title: it?.title ?? "",
                            full: s_full,
                            pcs: s_pcs,
                            sold_full: s_full,
                            sold_pcs: s_pcs,
                            rate: rate,
                            taxPercent: toNum(pi.tax_percent ?? taxPercent),
                            discPercent: toNum(pi.discount_percent ?? discPercent),
                            taxReadOnly: true,
                            discReadOnly: true,
                            amount: 0,
                            packing: packing,
                            bonus_full: 0,
                            bonus_pcs: 0,
                            has_bonus_available: true,
                            purchase_date: inv.date,
                            purchase_invoice: inv.invoice,
                            current_stock: toNum(it?.stock_1),
                            tp: toNum(it?.trade_price),
                            supplier_name: selectedAccount?.title ?? "N/A",
                            salesman: pi.salesman_name ?? pi.salesman?.name ?? "N/A",
                        };
                    });
                    setRows(loadedRows.length > 0 ? loadedRows : [getEmptyRow()]);
                    if (loadedRows.length > 0) setFocusedRowId(loadedRows[0].id);
                }
            });
    };

    // ── Manual Item selection ──────────────────
    const handleManualItemSelect = (rowId: number, itemId: number) => {
        const found = supplierItems.find((ci: any) => ci.item_id === itemId);
        if (!found) return;

        const it = found.item;
        const packing = toNum(it?.packing_full ?? it?.packing_qty ?? 1);

        setRows(prev => prev.map(r => r.id === rowId ? {
            ...r,
            item_id: itemId,
            item_title: it?.title ?? "",
            full: 0,
            pcs: 0,
            sold_full: toNum(found.qty_carton),
            sold_pcs: toNum(found.qty_pcs),
            rate: toNum(found.last_trade_price ?? it?.trade_price ?? 0),
            taxPercent: toNum(it?.gst_percent ?? 0),
            discPercent: toNum(it?.discount ?? 0),
            taxReadOnly: true,
            discReadOnly: true,
            packing: packing,
            purchase_date: found.date,
            purchase_invoice: found.invoice_no,
            current_stock: toNum(it?.stock_1),
            tp: toNum(it?.trade_price),
            bonus_full: 0,
            bonus_pcs: 0,
            has_bonus_available: true,
            supplier_name: selectedAccount?.title ?? "N/A",
            salesman: found.salesman_name ?? found.salesman?.name ?? "N/A",
        } : r));
        setFocusedRowId(rowId);
    };

    const toggleAssignSelection = (id: number) => {
        setSelectedAssignIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkAddItems = () => {
        const itemsToAdd = supplierItems.filter(ci => selectedAssignIds.includes(ci.id));
        const newRows = itemsToAdd.map(pi => {
            const it = pi.item;
            const packing = toNum(it?.packing_full ?? it?.packing_qty ?? 1);
            return {
                id: Math.random(),
                item_id: pi.item_id,
                item_title: it?.title ?? "",
                full: 0,
                pcs: 0,
                sold_full: toNum(pi.qty_carton),
                sold_pcs: toNum(pi.qty_pcs),
                rate: toNum(pi.last_trade_price ?? it?.trade_price ?? 0),
                taxPercent: toNum(it?.gst_percent ?? 0),
                discPercent: toNum(it?.discount ?? 0),
                taxReadOnly: true,
                discReadOnly: true,
                amount: 0,
                packing: packing,
                bonus_full: 0,
                bonus_pcs: 0,
                has_bonus_available: true,
                purchase_date: pi.date,
                purchase_invoice: pi.invoice_no,
                current_stock: toNum(it?.stock_1),
                tp: toNum(it?.trade_price),
                supplier_name: selectedAccount?.title ?? "N/A",
                salesman: pi.salesman_name ?? pi.salesman?.name ?? "N/A",
            };
        });

        setRows(p => {
            const cleanRows = p.filter(r => r.item_id);
            const combined = [...newRows, ...cleanRows];
            return combined.length > 0 ? combined : [getEmptyRow()];
        });

        setAssignItemDialogOpen(false);
        setSelectedAssignIds([]);
        setAssignSearch("");
    };

    const initializeWorkspace = () => setRows([getEmptyRow()]);
    const purgeWorkspace = () => setRows([getEmptyRow()]);

    // ── Filtering logic ────────────────────────
    const filteredInvoices = useMemo(() => {
        const q = invoiceSearch.toLowerCase();
        return invoices.filter(inv =>
            inv.invoice.toLowerCase().includes(q) ||
            inv.date.toLowerCase().includes(q) ||
            inv.net_total.toString().includes(q)
        );
    }, [invoices, invoiceSearch]);

    const filteredSupplierItems = useMemo(() => {
        const sorted = [...supplierItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted.filter(ci =>
            !assignSearch ||
            ci.item?.title.toLowerCase().includes(assignSearch.toLowerCase()) ||
            ci.invoice_no?.toLowerCase().includes(assignSearch.toLowerCase())
        );
    }, [supplierItems, assignSearch]);

    // ── Calculations ───────────────────────────
    const rowsWithAmount = useMemo(() => {
        return rows.map(r => {
            const units = toNum(r.full) * toNum(r.packing) + toNum(r.pcs);
            const baseAmount = units * toNum(r.rate);
            const discAmount = (toNum(r.discPercent) / 100) * baseAmount;
            const taxableAmount = baseAmount - discAmount;
            const taxAmount = (toNum(r.taxPercent) / 100) * taxableAmount;
            return { ...r, amount: Math.round(taxableAmount + taxAmount) };
        });
    }, [rows]);

    const totals = useMemo(() => {
        let gross = 0, tax = 0, disc = 0;
        rowsWithAmount.forEach(r => {
            const units = toNum(r.full) * toNum(r.packing) + toNum(r.pcs);
            const base = units * toNum(r.rate);
            const d = (toNum(r.discPercent) / 100) * base;
            const t = (toNum(r.taxPercent) / 100) * (base - d);
            gross += base;
            disc += d;
            tax += t;
        });
        return {
            gross: Math.round(gross),
            disc: Math.round(disc),
            tax: Math.round(tax),
            net: Math.round(gross - disc + tax),
        };
    }, [rowsWithAmount]);

    const filteredAccounts = useMemo(() => {
        const q = accountSearch.toLowerCase();
        return accounts.filter(a => a.title.toLowerCase().includes(q));
    }, [accounts, accountSearch]);

    // ── Save ──────────────────────────────────
    const handleSave = () => {
        const rowCount = rows.filter(r => r.item_id !== null).length;
        const validRows = rowsWithAmount.filter(r => r.item_id !== null && (r.full > 0 || r.pcs > 0));

        if (!selectedAccount) { alert("Please identify the supplier first."); return; }
        if (rowCount === 0) { alert("Please assign items to the manifest before executing return."); return; }
        if (validRows.length === 0) { alert("Please enter return quantities for the assigned items."); return; }

        setIsSaving(true);
        const payload = {
            date: date.toISOString().split('T')[0],
            invoice: invoiceNo,
            original_invoice: originalInvoiceNo,
            supplier_id: selectedAccount.id,
            saleman_id: salesman,
            no_of_items: validRows.length,
            gross_total: totals.gross,
            discount_total: totals.disc,
            tax_total: totals.tax,
            net_total: totals.net,
            paid_amount: refundAmount,
            remaining_amount: totals.net - refundAmount,
            items: validRows.map(r => {
                const base = (r.full * r.packing + r.pcs) * r.rate;
                const d = (toNum(r.discPercent) / 100) * base;
                const t = (toNum(r.taxPercent) / 100) * (base - d);
                return {
                    item_id: r.item_id,
                    qty_carton: r.full,
                    qty_pcs: r.pcs,
                    total_pcs: r.full * r.packing + r.pcs,
                    trade_price: r.rate,
                    discount: Math.round(d),
                    gst_amount: Math.round(t),
                    subtotal: r.amount,
                };
            }),
        };

        router.post("/purchase-return", payload, {
            onSuccess: () => {
                setIsSaving(false);
                router.get("/purchase-return");
            },
            onError: () => setIsSaving(false),
        });
    };

    return (
        <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "16rem", "--header-height": "3.5rem" } as React.CSSProperties}>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col h-screen">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <main ref={scrollContainerRef} className="flex-1 overflow-auto md:overflow-hidden p-3 md:p-6 flex flex-col md:flex-row gap-6 scroll-smooth">

                    {/* ── WORKSPACE ── */}
                    <div className="flex-1 flex flex-col gap-4 md:gap-6 md:overflow-hidden">

                        {/* Mobile Header (Control Deck) */}
                        <div className="md:hidden space-y-3">
                            <Card className={`p-4 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} space-y-4 shadow-lg shadow-zinc-200/50 dark:shadow-none`}>
                                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                    <div className="space-y-0.5">
                                        <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest">Registry ID</div>
                                        <div className="text-sm font-black text-orange-600 font-mono tracking-tighter uppercase">{invoiceNo || "AUTO-GEN"}</div>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest text-right">Return Date</div>
                                        <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 flex items-center justify-end gap-1.5 leading-none">
                                            <CalendarIcon size={12} className="text-zinc-400" />
                                            {fmtDate(date.toISOString())}
                                        </div>
                                    </div>
                                </div>

                                <TechLabel label="Supplier Designation" icon={UserIcon}>
                                    <Popover open={mobileAccOpen} onOpenChange={setMobileAccOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-black text-sm text-left uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500 shadow-sm`}>
                                                <span className="truncate">{selectedAccount ? selectedAccount.title : "Identify Supplier..."}</span>
                                                <Search size={14} className="text-zinc-400 flex-shrink-0 ml-2" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[calc(100vw-48px)] p-0 shadow-2xl border-zinc-300 dark:border-zinc-700" align="center" sideOffset={8}>
                                            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                                                <Input placeholder="SEARCH SUPPLIER..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-10 text-xs font-mono uppercase border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
                                            </div>
                                            <div className="max-h-[60vh] overflow-auto py-1">
                                                {filteredAccounts.map(acc => (
                                                    <button key={acc.id} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-orange-500"
                                                        onClick={() => { handleAccountSelect(acc.id); setAccountSearch(""); }}>
                                                        <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-orange-500 flex-shrink-0" />
                                                        <span className="truncate">{acc.title}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TechLabel>

                                <div className="grid grid-cols-2 gap-3">
                                    <TechLabel label="Registry No" icon={Hash}>
                                        <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className={`h-10 border-zinc-200 dark:border-zinc-700 font-black text-sm tracking-[0.2em] bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 focus-visible:ring-orange-500 shadow-sm`} />
                                    </TechLabel>
                                    <TechLabel label="Ref Invoice" icon={FileText}>
                                        <Input value={originalInvoiceNo} onChange={e => setOriginalInvoiceNo(e.target.value)} className={`h-10 border-zinc-200 dark:border-zinc-700 font-bold text-xs bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} focus-visible:ring-zinc-500 shadow-sm`} />
                                    </TechLabel>
                                </div>
                            </Card>
                        </div>

                        {/* Control Header (Desktop Only) */}
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="hidden md:block">
                            <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} grid grid-cols-12 gap-5 items-end relative overflow-hidden`}>
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${ACCENT_GRADIENT}`} />

                                <div className="col-span-2">
                                    <TechLabel label="Return Date" icon={CalendarIcon}>
                                        <Popover open={calOpen} onOpenChange={setCalOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500`}>
                                                    {fmtDate(date.toISOString())}
                                                    <CalendarIcon size={14} className="text-zinc-400" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                                                <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { setDate(d); setCalOpen(false); } }} />
                                            </PopoverContent>
                                        </Popover>
                                    </TechLabel>
                                </div>

                                <div className="col-span-3">
                                    <TechLabel label="Supplier Designation" icon={UserIcon}>
                                        <Popover open={desktopAccOpen} onOpenChange={setDesktopAccOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-black text-sm text-left truncate uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500`}>
                                                    {selectedAccount ? selectedAccount.title : "Identify Supplier..."}
                                                    <Search size={14} className="text-zinc-400" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0 border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                                                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                                                    <Input placeholder="SEARCH SUPPLIER..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-9 text-xs font-mono uppercase border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
                                                </div>
                                                <div className="max-h-64 overflow-auto py-1">
                                                    {filteredAccounts.map(acc => (
                                                        <button key={acc.id} className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors flex items-center gap-2 group border-l-2 border-transparent hover:border-orange-500"
                                                            onClick={() => { handleAccountSelect(acc.id); setAccountSearch(""); }}>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-orange-500" />
                                                            {acc.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TechLabel>
                                </div>

                                <div className="col-span-2">
                                    <TechLabel label="Ref Invoice" icon={FileText}>
                                        <Input value={originalInvoiceNo} onChange={e => setOriginalInvoiceNo(e.target.value)} className={`h-10 border-zinc-200 dark:border-zinc-700 font-bold text-xs bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} focus-visible:ring-zinc-500`} />
                                    </TechLabel>
                                </div>

                                <div className="col-span-2">
                                    <TechLabel label="Salesman" icon={Clock}>
                                        <Input value={salesman ?? ""} onChange={e => setSalesman(toNum(e.target.value) || null)} className={`h-10 border-zinc-200 dark:border-zinc-700 font-bold text-xs bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} focus-visible:ring-zinc-500`} />
                                    </TechLabel>
                                </div>

                                <div className="col-span-3">
                                    <TechLabel label="Registry No" icon={Hash}>
                                        <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className={`h-10 border-zinc-200 dark:border-zinc-700 font-black text-sm tracking-[0.2em] bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 focus-visible:ring-orange-500`} />
                                    </TechLabel>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Transaction Bar / Action Deck */}
                        <AnimatePresence>
                            {selectedAccount && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="pb-0">
                                        <Card className={`p-0 ${PREMIUM_GRADIENT} ${PREMIUM_ROUNDING_MD} border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative group`}>
                                            <div className={`absolute inset-0 opacity-[0.03] dark:opacity-10 ${ACCENT_GRADIENT}`} style={{ mixBlendMode: 'overlay' }} />
                                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800 relative z-10 font-mono">
                                                <div className="flex-1 flex items-center p-4">
                                                    <button onClick={openInvoiceDialog} className={`flex items-center gap-3 px-4 py-2 border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} bg-zinc-50 dark:bg-zinc-800 hover:border-orange-500 transition-all group`}>
                                                        <div className="flex flex-col items-start leading-none uppercase">
                                                            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 group-hover:text-orange-500 transition-colors tracking-widest leading-none mb-1">Source Document</span>
                                                            <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                                {selectedInvoice ? selectedInvoice.invoice : "SELECT SOURCE INVOICE"}
                                                                <ArrowRightLeft size={10} className="text-orange-500" />
                                                            </span>
                                                        </div>
                                                    </button>
                                                </div>

                                                {selectedInvoice && (
                                                    <>
                                                        <div className="p-4 px-6 flex flex-col justify-center">
                                                            <div className="text-[9px] uppercase font-black text-zinc-400 tracking-widest mb-1">Registry Date</div>
                                                            <div className="text-xs font-black text-zinc-800 dark:text-zinc-200 italic">{fmtDate(selectedInvoice.date)}</div>
                                                        </div>
                                                        <div className="p-4 px-6 flex flex-col justify-center bg-zinc-50/50 dark:bg-zinc-900/50">
                                                            <div className="text-[9px] uppercase font-black text-zinc-400 tracking-widest mb-1">Net Exposure</div>
                                                            <div className="text-xs font-black text-orange-600">Rs {toNum(selectedInvoice.net_total).toLocaleString()}</div>
                                                        </div>
                                                    </>
                                                )}

                                                <div className="flex items-center gap-3 px-4 py-3 md:py-0">
                                                    <Button onClick={openInvoiceDialog} className="h-10 px-6 bg-zinc-900 hover:bg-black text-white rounded-md font-black text-[10px] uppercase tracking-widest transition-all">
                                                        Search Registry
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Item Manifest */}
                        <Card className={`flex-1 flex flex-col ${CARD_BASE} ${PREMIUM_ROUNDING_MD} overflow-hidden shadow-2xl shadow-black/5 min-h-[400px] p-0`}>
                            <div className="hidden md:grid grid-cols-12 gap-2 bg-zinc-900 dark:bg-black text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 px-2 py-3 items-center border-b border-zinc-800">
                                <div className="col-span-3 flex items-center gap-2">
                                    <Database size={12} className="text-orange-500" />
                                    Entity Designation
                                </div>
                                <div className="col-span-1 text-center bg-zinc-800/50 py-1 rounded">Full</div>
                                <div className="col-span-1 text-center bg-zinc-800/50 py-1 rounded">Pcs</div>
                                <div className="col-span-1 text-center bg-emerald-950/30 text-emerald-500 py-1 rounded">B.Full</div>
                                <div className="col-span-1 text-center bg-emerald-950/30 text-emerald-500 py-1 rounded">B.Pcs</div>
                                <div className="col-span-1 text-right pr-2">Rate</div>
                                <div className="col-span-1 text-right pr-2 flex items-center justify-end gap-1">
                                    Tax% <BadgePercent size={8} />
                                </div>
                                <div className="col-span-1 text-right pr-2">Disc%</div>
                                <div className="col-span-2 text-right pr-4 flex items-center justify-end gap-2 text-white">
                                    Sub Total
                                    <Plus size={14} className="cursor-pointer hover:text-orange-500" onClick={() => setRows(p => [getEmptyRow(), ...p])} />
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto bg-white/50 dark:bg-transparent" ref={manifestRef}>
                                <AnimatePresence initial={false}>
                                    {rows.map((row, idx) => {
                                        const rowAmount = rowsWithAmount.find(r => r.id === row.id) || { amount: 0 };
                                        return (
                                            <motion.div key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                                className={`grid grid-cols-1 md:grid-cols-12 gap-2 px-2 py-3 border-b border-zinc-100 dark:border-zinc-800/50 items-center group transition-colors relative ${focusedRowId === row.id ? 'bg-orange-50/50 dark:bg-orange-500/5' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'}`}
                                                onClick={() => setFocusedRowId(row.id)}>

                                                {focusedRowId === row.id && <div className="absolute left-0 top-0 w-0.5 h-full bg-orange-500" />}

                                                {/* Entity Selection */}
                                                <div className="md:col-span-3 pr-2">
                                                    {!row.item_id ? (
                                                        <Button variant="ghost" className={`h-8 w-full justify-start text-[10px] font-black uppercase tracking-tighter border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 hover:bg-orange-500/5 ${PREMIUM_ROUNDING_MD}`}
                                                            onClick={() => setAssignItemDialogOpen(true)} disabled={!selectedAccount}>
                                                            <Plus size={12} className="mr-2 text-orange-500" />
                                                            Assign Item to Position
                                                        </Button>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono text-zinc-400 w-4">{idx + 1}.</span>
                                                            <div className="flex-1">
                                                                <Input value={row.item_title} readOnly placeholder="Identify Entity..."
                                                                    className={`h-8 text-xs font-black uppercase tracking-tight bg-transparent border-transparent group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-800 transition-all ${row.item_id ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Quantities */}
                                                <div className="grid grid-cols-4 md:col-span-4 gap-1.5 md:gap-1 px-1">
                                                    <div className="flex flex-col md:block">
                                                        <label className="md:hidden text-[8px] font-black uppercase text-zinc-500 mb-1">Full</label>
                                                        <Input type="number" value={row.full || ""} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, full: toNum(e.target.value) } : r))}
                                                            className="h-8 text-center font-mono font-bold text-xs border-gray-200 dark:border-gray-700 focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
                                                    </div>
                                                    <div className="flex flex-col md:block">
                                                        <label className="md:hidden text-[8px] font-black uppercase text-zinc-500 mb-1">Pcs</label>
                                                        <Input type="number" value={row.pcs || ""} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, pcs: toNum(e.target.value) } : r))}
                                                            className="h-8 text-center font-mono font-bold text-xs border-gray-200 dark:border-gray-700 focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800" />
                                                    </div>
                                                    <div className="flex flex-col md:block">
                                                        <label className="md:hidden text-[8px] font-black uppercase text-emerald-600 mb-1">B.Full</label>
                                                        <Input type="number" value={row.bonus_full || ""} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, bonus_full: toNum(e.target.value) } : r))}
                                                            className="h-8 text-center font-mono font-bold text-xs text-emerald-600 border-gray-200 dark:border-gray-700 focus:border-emerald-500/30" />
                                                    </div>
                                                    <div className="flex flex-col md:block">
                                                        <label className="md:hidden text-[8px] font-black uppercase text-emerald-600 mb-1">B.Pcs</label>
                                                        <Input type="number" value={row.bonus_pcs || ""} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, bonus_pcs: toNum(e.target.value) } : r))}
                                                            className="h-8 text-center font-mono font-bold text-xs text-emerald-600 border-gray-200 dark:border-gray-700 focus:border-emerald-500/30" />
                                                    </div>
                                                </div>

                                                {/* Financials */}
                                                <div className="md:col-span-1 px-1">
                                                    <label className="md:hidden text-[8px] font-black uppercase text-zinc-500 mb-1 text-right block">Rate</label>
                                                    <Input type="number" value={row.rate || ""} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, rate: toNum(e.target.value) } : r))}
                                                        className="h-8 text-right font-mono font-bold text-xs bg-transparent border-gray-200 dark:border-gray-700 focus:border-zinc-300 dark:focus:border-zinc-700" />
                                                </div>
                                                <div className="md:col-span-1 px-1">
                                                    <label className="md:hidden text-[8px] font-black uppercase text-zinc-500 mb-1 text-right block">Tax%</label>
                                                    <Input type="number" value={row.taxPercent || ""} readOnly={row.taxReadOnly} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, taxPercent: toNum(e.target.value) } : r))}
                                                        className={`h-8 text-right font-mono font-bold text-xs bg-transparent border-gray-200 dark:border-gray-700 ${row.taxReadOnly ? 'opacity-50 cursor-not-allowed' : 'focus:border-zinc-300 dark:focus:border-zinc-700'}`} />
                                                </div>
                                                <div className="md:col-span-1 px-1">
                                                    <label className="md:hidden text-[8px] font-black uppercase text-zinc-500 mb-1 text-right block">Disc%</label>
                                                    <Input type="number" value={row.discPercent || ""} readOnly={row.discReadOnly} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, discPercent: toNum(e.target.value) } : r))}
                                                        className={`h-8 text-right font-mono font-bold text-xs bg-transparent border-gray-200 dark:border-gray-700 ${row.discReadOnly ? 'opacity-50 cursor-not-allowed' : 'focus:border-zinc-300 dark:focus:border-zinc-700'}`} />
                                                </div>

                                                {/* Subtotal & Action */}
                                                <div className="col-span-2 flex items-center justify-end gap-3 pr-4">
                                                    <div className="text-right">
                                                        <span className={`text-[11px] font-black font-mono transition-all duration-300 ${rowAmount.amount > 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-300 dark:text-zinc-700'}`}>
                                                            {rowAmount.amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-full opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => { e.stopPropagation(); setRows(p => p.filter(r => r.id !== row.id).length === 0 ? [getEmptyRow()] : p.filter(r => r.id !== row.id)); }}>
                                                        <Trash2 size={12} />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                {rows.length === 0 && (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="bg-zinc-100 dark:bg-zinc-900 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
                                            <Calculator size={24} />
                                        </div>
                                        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">Manifest Empty</div>
                                    </div>
                                )}
                            </div>

                            {/* Workspace Controls */}
                            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center gap-3">
                                <Button variant="outline" size="sm" onClick={initializeWorkspace} className={`h-8 text-[9px] font-black uppercase tracking-widest ${PREMIUM_ROUNDING_MD} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800`}>
                                    <Plus size={12} className="mr-2 text-orange-500" />
                                    Initialize Item Position
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setAssignItemDialogOpen(true)} disabled={!selectedAccount} className={`h-8 text-[9px] font-black uppercase tracking-widest ${PREMIUM_ROUNDING_MD} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800`}>
                                    <Package size={12} className="mr-2 text-orange-500" />
                                    Assign Item (Bulk)
                                </Button>
                                <Button variant="outline" size="sm" onClick={purgeWorkspace} className={`h-8 text-[9px] font-black uppercase tracking-widest ${PREMIUM_ROUNDING_MD} bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-rose-500 hover:bg-rose-50 hover:text-rose-600`}>
                                    <RotateCcw size={12} className="mr-2" />
                                    Purge Workspace
                                </Button>
                            </div>
                        </Card>

                        {/* Item Intelligence Panel */}
                        <AnimatePresence>
                            {focusedRowId && rows.find(r => r.id === focusedRowId)?.item_id && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="hidden md:block">
                                    <ItemDetailCard row={rowsWithAmount.find(r => r.id === focusedRowId)!} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── FINANCIAL AUDITOR (Sidebar) ── */}
                    <div className="w-full md:w-80 space-y-6 md:h-full md:flex md:flex-col">
                        <Card className={`p-6 ${PREMIUM_GRADIENT} ${PREMIUM_ROUNDING_MD} border-zinc-200 dark:border-zinc-800 shadow-md flex-1 flex flex-col justify-between relative overflow-hidden group/auditor`}>
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-zinc-900 dark:text-white group-hover/auditor:scale-110 transition-transform duration-700">
                                <Calculator size={120} />
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-500 mb-4 flex items-center gap-2">
                                        <Calculator size={12} className="text-orange-500" />
                                        Valuation Protocol
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] uppercase font-bold text-zinc-400">Gross Total</span>
                                            <span className="text-lg font-black font-mono tracking-tighter text-zinc-900 dark:text-white">
                                                {totals.gross.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] uppercase font-bold text-zinc-400">Tax Payload</span>
                                            <span className="text-sm font-black font-mono tracking-tighter text-emerald-600">
                                                +{totals.tax.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] uppercase font-bold text-zinc-400">Discount Delta</span>
                                            <span className="text-sm font-black font-mono tracking-tighter text-rose-600">
                                                -{totals.disc.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-zinc-900 dark:bg-black p-5 rounded-xl border border-zinc-800 shadow-inner group/net">
                                        <div className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.2em] mb-1 group-hover/net:text-orange-500 transition-colors">Net Settlement</div>
                                        <div className="text-4xl font-black text-white font-mono tracking-tighter flex items-baseline gap-1">
                                            <span className="text-lg opacity-30 font-sans">Rs</span>
                                            {totals.net.toLocaleString()}
                                        </div>
                                    </div>

                                    <TechLabel label="Refund Liquidation (Paid)" icon={Banknote}>
                                        <div className="relative group/refund">
                                            <Input type="number" value={refundAmount || ""} onChange={e => setRefundAmount(toNum(e.target.value))}
                                                className={`h-11 font-mono font-black text-xl tracking-tighter pl-12 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 transition-all focus:ring-2 focus:ring-orange-500/20`} placeholder="0.00" />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within/refund:text-orange-500 transition-colors">
                                                <ArrowDownToLine size={20} />
                                            </div>
                                        </div>
                                    </TechLabel>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3 relative z-10">
                                <Button className={`w-full h-14 ${SIGNAL_ORANGE} ${PREMIUM_ROUNDING_MD} font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 group/save overflow-hidden relative shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
                                    onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? (
                                        <RotateCcw className="animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} className="group-hover:scale-120 transition-transform" />
                                            Commit Registry
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover/save:opacity-10 transition-opacity" />
                                </Button>

                                <Button variant="outline" className={`w-full h-11 ${PREMIUM_ROUNDING_MD} font-black uppercase tracking-widest text-[10px] text-zinc-500 border-zinc-200 dark:border-zinc-800 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800`}
                                    onClick={() => router.get("/purchase-return")}>
                                    Decline Logic
                                </Button>
                            </div>
                        </Card>
                    </div>
                </main>

                {/* Mobile Sticky Command Bar */}
                <AnimatePresence>
                    {showStickyFooter && (
                        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
                                <div className="space-y-0.5">
                                    <div className="text-[8px] uppercase font-black text-zinc-400 tracking-widest">Net Settlement</div>
                                    <div className="text-xl font-black text-zinc-900 dark:text-white font-mono tracking-tighter">
                                        Rs {totals.net.toLocaleString()}
                                    </div>
                                </div>
                                <Button className={`h-12 px-8 ${SIGNAL_ORANGE} ${PREMIUM_ROUNDING_MD} font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all`}
                                    onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <RotateCcw size={16} className="animate-spin" /> : "Commit"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── SOURCE DOCUMENT SELECTION ── */}
                <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                    <DialogContent className={`max-w-[95vw] md:max-w-4xl w-full md:w-[900px] border-none bg-transparent shadow-none p-0`}>
                        <DialogTitle className="hidden">Source Document Registry</DialogTitle>
                        <DialogDescription className="hidden">Search and select previous purchase invoices to populate the return manifest.</DialogDescription>
                        <Card className={`${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 shadow-[0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(0,0,0,0.5)] p-0 overflow-hidden ${PREMIUM_ROUNDING}`}>
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                            <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row md:justify-between md:items-center relative z-10 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.4em]">Registry Search</div>
                                    <h2 className="text-sm md:text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-tight">DOCUMENT SOURCE: <br className="md:hidden" /> {selectedAccount?.title}</h2>
                                </div>
                                <div className="relative w-full md:w-96 mr-8">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                                    <Input autoFocus placeholder="SEARCH BY ID, DATE, OR VALUE..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)}
                                        className={`h-10 bg-white dark:bg-white/5 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-[10px] tracking-widest pl-10 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD}`} />
                                </div>
                            </div>

                            <div className="max-h-[500px] overflow-auto p-4 custom-scrollbar relative z-10">
                                {loadingInvoices ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className={`w-8 h-8 border-4 border-orange-500 border-t-transparent animate-spin ${PREMIUM_ROUNDING}`} />
                                        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">Scanning Registry...</div>
                                    </div>
                                ) : filteredInvoices.map((inv, idx) => (
                                    <motion.button key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                        className={`w-full text-left p-4 mb-3 flex flex-col md:flex-row md:items-center justify-between group bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-zinc-800 hover:border-orange-500 transition-all active:scale-[0.99] ${PREMIUM_ROUNDING_MD} gap-4 md:gap-0`}
                                        onClick={() => handleSelectInvoice(inv)}>
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                            <div className="flex justify-between md:block items-center">
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">ID#</div>
                                                    <div className="text-lg font-black text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors tracking-tighter">{inv.invoice}</div>
                                                </div>
                                                <div className="md:hidden">
                                                    <SignalBadge text={inv.status} type={inv.status === 'Completed' ? 'green' : 'orange'} />
                                                </div>
                                            </div>
                                            <div className="w-full md:w-px h-px md:h-8 bg-zinc-200 dark:bg-zinc-800" />
                                            <div className="flex justify-between md:block items-center">
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Registry Date</div>
                                                    <div className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300">{fmtDate(inv.date)}</div>
                                                </div>
                                                <div className="hidden md:block">
                                                    <SignalBadge text={inv.status} type={inv.status === 'Completed' ? 'green' : 'orange'} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-0 md:gap-8 md:pr-4 bg-orange-500/5 md:bg-transparent -mx-4 -mb-4 md:mx-0 md:mb-0 p-4 md:p-0 border-t md:border-t-0 border-orange-500/10 md:border-transparent">
                                            <div className="space-y-1 text-left md:text-right">
                                                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Net Value</div>
                                                <div className="text-sm md:text-base font-black text-zinc-900 dark:text-white leading-none">Rs {toNum(inv.net_total).toLocaleString()}</div>
                                            </div>
                                            <div className="space-y-1 text-right min-w-[100px] md:min-w-[120px]">
                                                <div className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest leading-none">Outstanding</div>
                                                <div className="text-lg md:text-xl font-black text-orange-600 dark:text-orange-400 leading-none tracking-tighter">Rs {toNum(inv.remaining_amount).toLocaleString()}</div>
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-300 dark:text-zinc-700 group-hover:text-orange-500 transition-colors hidden md:block" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </Card>
                    </DialogContent>
                </Dialog>

                {/* ── BULK ASSIGN ITEM DIALOG ── */}
                <Dialog open={assignItemDialogOpen} onOpenChange={setAssignItemDialogOpen}>
                    <DialogContent className={`max-w-[95vw] md:max-w-4xl w-full md:w-[900px] border-none bg-transparent shadow-none p-0`}>
                        <DialogTitle className="hidden">Bulk Item Assignment</DialogTitle>
                        <DialogDescription className="hidden">Select multiple items to add to the return manifest from the supplier's purchase history.</DialogDescription>
                        <Card className={`${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 shadow-2xl p-0 overflow-hidden ${PREMIUM_ROUNDING}`}>
                            <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row md:justify-between md:items-center relative z-10 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.4em]">Inventory Catalog</div>
                                    <h2 className="text-sm md:text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">SUPPLIER: {selectedAccount?.title}</h2>
                                </div>
                                <div className="relative w-full md:w-96 mr-8">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                                    <Input placeholder="SEARCH CATALOG..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                                        className={`h-10 bg-white dark:bg-white/5 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-[10px] tracking-widest pl-10 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD}`} />
                                </div>
                            </div>

                            <div className="max-h-[450px] overflow-auto p-4 custom-scrollbar relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredSupplierItems.map((pi, idx) => (
                                    <motion.div key={pi.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                                        className={`flex items-center gap-4 p-3 border ${selectedAssignIds.includes(pi.id) ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-white/5'} ${PREMIUM_ROUNDING_MD} transition-all cursor-pointer group`}
                                        onClick={() => toggleAssignSelection(pi.id)}>
                                        <Checkbox checked={selectedAssignIds.includes(pi.id)} onCheckedChange={() => toggleAssignSelection(pi.id)} className="border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-orange-500" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="text-[11px] font-black text-zinc-900 dark:text-white uppercase truncate tracking-tighter">{pi.item?.title}</div>
                                                <div className="text-[9px] font-mono font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">{pi.invoice_no}</div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-zinc-600">
                                                <span>Rate: Rs {toNum(pi.last_trade_price ?? pi.item?.trade_price).toLocaleString()}</span>
                                                <span className="w-px h-2 bg-zinc-200 dark:bg-zinc-800" />
                                                <span>Inv: {toNum(pi.qty_carton)}F {toNum(pi.qty_pcs)}P</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-zinc-600/100 mt-1 uppercase">Purchased: <span className="text-zinc-600 dark:text-zinc-300 font-bold">{fmtDate(pi.date)}</span></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center relative z-10">
                                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                    {selectedAssignIds.length} Items Selected for Manifest
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" className="h-9 text-[10px] font-black uppercase text-zinc-500" onClick={() => { setAssignItemDialogOpen(false); setSelectedAssignIds([]); }}>
                                        Cancel
                                    </Button>
                                    <Button className={`${ACCENT_GRADIENT} h-9 px-6 text-[10px] font-black uppercase text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all`}
                                        onClick={handleBulkAddItems} disabled={selectedAssignIds.length === 0}>
                                        <CheckCircle2 size={12} className="mr-2" />
                                        Add Selected to Manifest
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </DialogContent>
                </Dialog>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }

                    @keyframes live-pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.2); opacity: 0.5; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .animate-live-pulse {
                        animation: live-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                `}</style>
            </SidebarInset>
        </SidebarProvider>
    );
}
