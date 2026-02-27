// sales_return/edit.tsx
import React, { useState, useMemo, useEffect } from "react";
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
    ArrowDownToLine
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
    { title: "Sales Return", href: "/sales-return" },
    { title: "Edit Return", href: "#" },
];

// Style Constants
const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const MONO_FONT = "font-mono tracking-tighter";

const SIGNAL_ORANGE = "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20";
const SIGNAL_GREEN = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20";
const SIGNAL_RED = "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20";

const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-500 to-rose-500";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────
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
}

interface Account {
    id: number;
    title: string;
    aging_days?: number;
    credit_limit?: number | string;
    saleman_id?: number;
}

interface Invoice {
    id: number;
    invoice: string;
    date: string;
    net_total: number;
    remaining_amount: number;
    status: string;
}

interface SalesReturn {
    id: number;
    invoice: string;
    date: string;
    original_invoice: string;
    customer_id: number;
    salesman_id: number;
    paid_amount: number;
    items: any[];
}

interface Props {
    returnData: SalesReturn;
    accounts: Account[];
    salemans: { id: number; name: string }[];
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

// ───────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────
export default function SalesReturnEditPage({ returnData, accounts, salemans }: Props) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // ── Header state ──────────────────────────
    const [date, setDate] = useState<Date>(new Date(returnData.date));
    const [calOpen, setCalOpen] = useState(false);
    const [invoiceNo, setInvoiceNo] = useState(returnData.invoice);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(() => accounts.find(a => a.id === returnData.customer_id) ?? null);
    const [accountSearch, setAccountSearch] = useState("");
    const [refundAmount, setRefundAmount] = useState(toNum(returnData.paid_amount));
    const [originalInvoiceNo, setOriginalInvoiceNo] = useState(returnData.original_invoice);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // ── Invoice Dialog state ───────────────────
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // ── Mobile specific states ────────────────
    const [showStickyFooter, setShowStickyFooter] = useState(true);
    const lastScrollY = React.useRef(0);
    const [mobileAccOpen, setMobileAccOpen] = useState(false);
    const [desktopAccOpen, setDesktopAccOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ── Method B: Assign Items Dialog state ───
    const [assignItemDialogOpen, setAssignItemDialogOpen] = useState(false);
    const [assignSearch, setAssignSearch] = useState("");
    const [selectedAssignIds, setSelectedAssignIds] = useState<number[]>([]);

    const toggleAssignSelection = (id: number) => {
        setSelectedAssignIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

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
    });

    const [rows, setRows] = useState<RowData[]>([]);
    const [selectedRowItemId, setSelectedRowItemId] = useState<number | null>(null);
    const [customerItems, setCustomerItems] = useState<any[]>([]);

    // Initialize rows from returnData
    useEffect(() => {
        if (returnData.items) {
            const initialRows = returnData.items.map(it => {
                const packing = toNum(it.item?.packing_full ?? 1);

                // Calculate percentages back from amounts for display if possible,
                // otherwise use the strict logic. For Edit, we should probably 
                // trust the stored amounts but percentages are better for the UI.
                const base = (toNum(it.qty_carton) * packing + toNum(it.qty_pcs)) * toNum(it.trade_price);
                const discAmt = toNum(it.discount);
                const taxAmt = toNum(it.gst_amount);

                const taxableBase = base - discAmt;
                const taxVal = (taxAmt > 0 && taxableBase > 0) ? +((taxAmt / taxableBase) * 100).toFixed(2) : 0;
                const discVal = (discAmt > 0 && base > 0) ? +((discAmt / base) * 100).toFixed(2) : 0;

                return {
                    id: it.id,
                    item_id: it.item_id,
                    item_title: it.item?.title ?? "Unknown Item",
                    full: toNum(it.qty_carton),
                    pcs: toNum(it.qty_pcs),
                    sold_full: toNum(it.qty_carton), // For edit, we might need real sold qty from somewhere else if we want to limit it
                    sold_pcs: toNum(it.qty_pcs),
                    rate: toNum(it.trade_price),
                    taxPercent: taxVal,
                    discPercent: discVal,
                    taxReadOnly: true,
                    discReadOnly: true,
                    amount: toNum(it.subtotal),
                    packing: packing,
                };
            });
            setRows(initialRows);
            if (initialRows.length > 0) setSelectedRowItemId(initialRows[0].item_id);
        }
    }, [returnData]);

    // Load customer items on mount if account selected
    useEffect(() => {
        if (selectedAccount) {
            fetch(`/sales-return/customer/${selectedAccount.id}/purchased-items`)
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setCustomerItems(data); })
                .catch(console.error);
        }
    }, []);

    // ── Account selection ──────────────────────
    const handleAccountSelect = (accId: number) => {
        const acc = accounts.find(a => a.id === accId) ?? null;
        setSelectedAccount(acc);
        setSelectedInvoice(null);
        setOriginalInvoiceNo("");
        setRows([getEmptyRow()]);
        setInvoices([]);

        if (acc) {
            fetch(`/sales-return/customer/${accId}/purchased-items`)
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setCustomerItems(data); })
                .catch(console.error);
        }
        setMobileAccOpen(false);
        setDesktopAccOpen(false);
    };

    // ── Invoice logic ──────────────────────────
    const openInvoiceDialog = () => {
        if (!selectedAccount) return;
        setInvoiceDialogOpen(true);
        if (invoices.length === 0) {
            setLoadingInvoices(true);
            fetch(`/sales-return/customer/${selectedAccount.id}/invoices`)
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setInvoices(data); })
                .catch(console.error)
                .finally(() => setLoadingInvoices(false));
        }
    };

    const handleSelectInvoice = (inv: Invoice) => {
        setInvoiceDialogOpen(false);
        setSelectedInvoice(inv);
        setOriginalInvoiceNo(inv.invoice);
        fetch(`/sales-return/invoice/${inv.id}/items`)
            .then(r => r.json())
            .then(data => {
                if (data.items && Array.isArray(data.items)) {
                    const loadedRows = data.items.map((si: any) => {
                        const s_full = toNum(si.qty_carton);
                        const s_pcs = toNum(si.qty_pcs);
                        const rate = toNum(si.trade_price);
                        const packing = toNum(si.item?.packing_full ?? 1);
                        const base = (s_full * packing + s_pcs) * rate;
                        const taxAmt = toNum(si.gst_amount || 0);
                        const discAmt = toNum(si.discount || 0);

                        const taxableBase = base - discAmt;
                        const taxVal = (taxAmt > 0 && taxableBase > 0) ? +((taxAmt / taxableBase) * 100).toFixed(2) : 0;
                        const discVal = (discAmt > 0 && base > 0) ? +((discAmt / base) * 100).toFixed(2) : 0;

                        return {
                            id: Math.random(),
                            item_id: si.item_id,
                            item_title: si.item?.title ?? "",
                            full: s_full,
                            pcs: s_pcs,
                            sold_full: s_full,
                            sold_pcs: s_pcs,
                            rate: rate,
                            taxPercent: taxVal,
                            discPercent: discVal,
                            taxReadOnly: true,
                            discReadOnly: true,
                            amount: 0,
                            packing: packing,
                        };
                    });
                    setRows(loadedRows.length > 0 ? loadedRows : [getEmptyRow()]);
                }
            });
    };

    // ── Manual Item selection ──────────────────
    const handleManualItemSelect = (rowId: number, itemId: number) => {
        const found = customerItems.find((ci: any) => ci.item_id === itemId);
        if (!found) return;

        const it = found.item;
        const s_full = toNum(found.qty_carton);
        const s_pcs = toNum(found.qty_pcs);
        const rate = toNum(found.last_trade_price ?? 0);
        const packing = toNum(it?.packing_full ?? 1);
        const base = (s_full * packing + s_pcs) * rate;
        const taxAmt = toNum(found.gst_amount || 0);
        const discAmt = toNum(found.discount || 0);

        const taxableBase = base - discAmt;
        const taxVal = (taxAmt > 0 && taxableBase > 0) ? +((taxAmt / taxableBase) * 100).toFixed(2) : 0;
        const discVal = (discAmt > 0 && base > 0) ? +((discAmt / base) * 100).toFixed(2) : 0;

        setRows(prev => prev.map(r => r.id === rowId ? {
            ...r,
            item_id: itemId,
            item_title: it?.title ?? "",
            full: 0,
            pcs: 0,
            sold_full: s_full,
            sold_pcs: s_pcs,
            rate: rate,
            taxPercent: taxVal,
            discPercent: discVal,
            taxReadOnly: true,
            discReadOnly: true,
            packing: packing,
        } : r));
        setSelectedRowItemId(itemId);
    };

    const handleBulkAddItems = () => {
        const itemsToAdd = customerItems.filter(ci => selectedAssignIds.includes(ci.id));
        const newRows = itemsToAdd.map(ci => {
            const s_full = toNum(ci.qty_carton);
            const s_pcs = toNum(ci.qty_pcs);
            const rate = toNum(ci.last_trade_price ?? 0);
            const it = ci.item;
            const packing = toNum(it?.packing_full ?? 1);
            const base = (s_full * packing + s_pcs) * rate;
            const taxAmt = toNum(ci.gst_amount || 0);
            const discAmt = toNum(ci.discount || 0);

            const taxableBase = base - discAmt;
            const taxVal = (taxAmt > 0 && taxableBase > 0) ? +((taxAmt / taxableBase) * 100).toFixed(2) : 0;
            const discVal = (discAmt > 0 && base > 0) ? +((discAmt / base) * 100).toFixed(2) : 0;

            return {
                id: Math.random(),
                item_id: ci.item_id,
                item_title: it?.title ?? "",
                full: 0,
                pcs: 0,
                sold_full: s_full,
                sold_pcs: s_pcs,
                rate: rate,
                taxPercent: taxVal,
                discPercent: discVal,
                taxReadOnly: true,
                discReadOnly: true,
                amount: 0,
                packing: packing,
            };
        });

        setRows(prev => {
            const existing = prev.filter(r => r.item_id !== null);
            return [...existing, ...newRows];
        });

        setAssignItemDialogOpen(false);
        setSelectedAssignIds([]);
        setAssignSearch("");
    };

    // ── Calculations ───────────────────────────
    const rowsWithAmount = useMemo(() => {
        return rows.map(r => {
            const units = toNum(r.full) * toNum(r.packing) + toNum(r.pcs);
            const baseAmount = units * toNum(r.rate);
            const discAmount = (toNum(r.discPercent) / 100) * baseAmount;
            const taxableAmount = baseAmount - discAmount;
            const taxAmount = (toNum(r.taxPercent) / 100) * taxableAmount;
            return { ...r, amount: +(taxableAmount + taxAmount).toFixed(2) };
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
            gross: +gross.toFixed(2),
            disc: +disc.toFixed(2),
            tax: +tax.toFixed(2),
            net: +(gross - disc + tax).toFixed(2),
        };
    }, [rowsWithAmount]);

    const filteredInvoices = useMemo(() => {
        const q = invoiceSearch.toLowerCase();
        return invoices.filter(inv => inv.invoice.toLowerCase().includes(q) || inv.date.includes(q));
    }, [invoices, invoiceSearch]);

    const filteredAccounts = useMemo(() => {
        const q = accountSearch.toLowerCase();
        return accounts.filter(a => a.title.toLowerCase().includes(q));
    }, [accounts, accountSearch]);

    // ── Save/Update ────────────────────────────
    const handleSave = () => {
        const validRows = rowsWithAmount.filter(r => r.item_id !== null && (r.full > 0 || r.pcs > 0));

        if (!selectedAccount) { alert("Please identify the customer first."); return; }
        if (validRows.length === 0) { alert("Please enter return quantities."); return; }

        setIsSaving(true);
        const payload = {
            date: date.toISOString().split('T')[0],
            invoice: invoiceNo,
            original_invoice: originalInvoiceNo,
            customer_id: selectedAccount.id,
            salesman_id: selectedAccount.saleman_id ?? null,
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
                    discount: +d.toFixed(2),
                    gst_amount: +t.toFixed(2),
                    subtotal: r.amount,
                };
            }),
        };

        router.put(`/sales-return/${returnData.id}`, payload, {
            onSuccess: () => {
                setIsSaving(false);
                router.get("/sales-return");
            },
            onError: (err) => {
                setIsSaving(false);
                console.error(err);
                alert("Critical error during update protocol.");
            },
        });
    };

    return (
        <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "16rem", "--header-height": "3.5rem" } as React.CSSProperties}>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col h-screen">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <main ref={scrollContainerRef} className="flex-1 overflow-auto md:overflow-hidden p-3 md:p-6 flex flex-col md:flex-row gap-6 scroll-smooth text-foreground">

                    {/* ── WORKSPACE ── */}
                    <div className="flex-1 flex flex-col gap-4 md:gap-6 md:overflow-hidden">

                        {/* Control Header (Desktop Only) */}
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="hidden md:block">
                            <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} grid grid-cols-12 gap-6 items-end relative overflow-hidden`}>
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${ACCENT_GRADIENT}`} />

                                <div className="col-span-3">
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

                                <div className="col-span-5">
                                    <TechLabel label="Client Designation" icon={UserIcon}>
                                        <Popover open={desktopAccOpen} onOpenChange={setDesktopAccOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-black text-sm text-left truncate uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500`}>
                                                    {selectedAccount ? selectedAccount.title : "Identify Customer..."}
                                                    <Search size={14} className="text-zinc-400" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0 border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                                                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                                                    <Input placeholder="SEARCH IDENTITY..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-9 text-xs font-mono uppercase border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
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

                                <div className="col-span-4">
                                    <TechLabel label="Verification No" icon={Hash}>
                                        <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className={`h-10 border-zinc-200 dark:border-zinc-700 font-black text-sm tracking-[0.2em] bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 focus-visible:ring-orange-500`} />
                                    </TechLabel>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Transaction Bar */}
                        <AnimatePresence>
                            {selectedAccount && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <Card className={`p-4 ${PREMIUM_GRADIENT} text-zinc-900 dark:text-white ${PREMIUM_ROUNDING_MD} border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between relative gap-4`}>
                                        <div className={`absolute inset-0 opacity-[0.03] dark:opacity-10 ${ACCENT_GRADIENT}`} style={{ mixBlendMode: 'overlay' }} />
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 relative z-10 w-full md:w-auto">
                                            <div className="space-y-0.5 border-b md:border-b-0 border-zinc-100 dark:border-zinc-800 pb-2 md:pb-0">
                                                <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest">Source Document</div>
                                                <Button variant="ghost" className="h-auto p-0 text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-black tracking-tighter text-base flex items-center gap-2 group transition-all" onClick={openInvoiceDialog}>
                                                    {originalInvoiceNo || "SELECT SOURCE INVOICE"}
                                                    <ArrowRightLeft size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                                </Button>
                                            </div>
                                        </div>

                                        <Button onClick={openInvoiceDialog} className={`h-11 px-6 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest relative z-10 w-full md:w-auto ${PREMIUM_ROUNDING_MD}`}>
                                            Replace Reference
                                        </Button>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Item Grid (Desktop Only) */}
                        <div className={`hidden md:flex flex-1 overflow-hidden flex flex-col ${CARD_BASE} ${PREMIUM_ROUNDING_MD}`}>
                            <div className={`grid grid-cols-12 bg-zinc-50 dark:bg-zinc-900/80 p-4 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-20`}>
                                <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Inventory Identification</div>
                                <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-500/5 dark:bg-orange-500/10 -mx-1 py-1">Return Qty</div>
                                <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Unit Val</div>
                                <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Duty %</div>
                                <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Dec %</div>
                                <div className="col-span-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-4 pr-10">Position Net</div>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                                {rowsWithAmount.map((row, idx) => (
                                    <motion.div key={row.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedRowItemId(row.item_id)}
                                        className={`grid grid-cols-12 gap-2 p-3 items-center group transition-colors cursor-pointer border-l-2 ${selectedRowItemId === row.item_id ? 'bg-orange-500/5 border-orange-500' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30 border-transparent'}`}>

                                        <div className="col-span-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-tighter truncate leading-tight dark:text-zinc-100">{row.item_title}</span>
                                                <span className="text-[9px] font-mono text-zinc-400">ITEM_ID: {row.item_id}</span>
                                            </div>
                                        </div>

                                        <div className="col-span-1">
                                            <Input type="number" value={row.full || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, full: toNum(e.target.value) } : r))}
                                                className={`h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD} dark:text-zinc-100`} placeholder="FULL" />
                                        </div>
                                        <div className="col-span-1">
                                            <Input type="number" value={row.pcs || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, pcs: toNum(e.target.value) } : r))}
                                                className={`h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD} dark:text-zinc-100`} placeholder="PCS" />
                                        </div>

                                        <div className="col-span-2">
                                            <Input type="number" value={row.rate || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, rate: toNum(e.target.value) } : r))}
                                                className={`h-8 text-right font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-emerald-500 ${PREMIUM_ROUNDING_MD} dark:text-zinc-100`} />
                                        </div>

                                        <div className="col-span-1">
                                            <Input type="number" value={row.taxPercent || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, taxPercent: toNum(e.target.value) } : r))}
                                                readOnly={row.taxReadOnly} className={`h-8 text-center font-mono text-[10px] font-bold border-zinc-200 dark:border-zinc-700 ${row.taxReadOnly ? 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400' : 'bg-white dark:bg-zinc-800'} ${PREMIUM_ROUNDING_MD}`} />
                                        </div>

                                        <div className="col-span-1">
                                            <Input type="number" value={row.discPercent || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, discPercent: toNum(e.target.value) } : r))}
                                                readOnly={row.discReadOnly} className={`h-8 text-center font-mono text-[10px] font-bold border-zinc-200 dark:border-zinc-700 ${row.discReadOnly ? 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400' : 'bg-white dark:bg-zinc-800'} ${PREMIUM_ROUNDING_MD}`} />
                                        </div>

                                        <div className="col-span-3 flex items-center justify-end gap-2 pr-4">
                                            <div className="text-right font-black text-xs tracking-tighter text-zinc-800 dark:text-zinc-100">Rs {row.amount.toLocaleString()}</div>
                                            <button className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                                                onClick={() => {
                                                    if (confirm("Purge this line item from return protocol?")) {
                                                        setRows(p => p.filter(r => r.id !== row.id));
                                                    }
                                                }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Table Actions */}
                            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Button variant="outline" size="sm" className={`h-8 text-[10px] font-black uppercase ${PREMIUM_ROUNDING_MD} border-zinc-200 dark:border-zinc-700 hover:border-orange-500 dark:text-zinc-200`}
                                    onClick={() => setAssignItemDialogOpen(true)} disabled={!selectedAccount}>
                                    <Package size={14} className="mr-2 text-orange-500" />
                                    Assign Item (Bulk)
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ── COMMAND CENTER ── */}
                    <div className="hidden md:flex w-[320px] md:flex-col md:gap-6">
                        {/* Financial Auditor Panel */}
                        <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                            <Card className={`${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 shadow-md relative overflow-hidden flex flex-col ${PREMIUM_ROUNDING_MD}`}>
                                <div className={`absolute inset-0 opacity-[0.03] dark:opacity-10 ${ACCENT_GRADIENT}`} style={{ mixBlendMode: 'overlay' }} />

                                <div className="p-6 space-y-8 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
                                            Audit Control
                                        </h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Gross Impact</div>
                                            <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-2 leading-none">
                                                <span className="text-zinc-400 dark:text-zinc-600 text-lg">Rs</span>
                                                {totals.gross.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tax Rev.</div>
                                                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-300">+ {totals.tax.toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Disc Rec.</div>
                                                <div className="text-sm font-bold text-rose-600">- {totals.disc.toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <div className={`bg-orange-600/10 border border-orange-500/20 p-5 space-y-1 ${PREMIUM_ROUNDING_MD}`}>
                                            <div className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">Net Credit Change</div>
                                            <div className="text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tighter flex items-center gap-2 leading-none">
                                                <span className="text-orange-600 dark:text-orange-500 text-lg opacity-50 font-mono">Rs</span>
                                                {totals.net.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <TechLabel label="Adjusted Cash Repayment" icon={ArrowRightLeft}>
                                            <div className="relative">
                                                <Input type="number" value={refundAmount || ""} onChange={e => setRefundAmount(toNum(e.target.value))}
                                                    className={`h-12 bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-black text-xl tracking-tighter px-4 ${PREMIUM_ROUNDING_MD} focus-visible:ring-emerald-500`} placeholder="0.00" />
                                            </div>
                                        </TechLabel>
                                    </div>

                                    <div className="pt-2">
                                        <Button className={`w-full h-14 ${ACCENT_GRADIENT} hover:opacity-90 text-white font-black text-lg uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 transition-all ${PREMIUM_ROUNDING}`}
                                            onClick={handleSave} disabled={isSaving}>
                                            {isSaving ? "UPDATING..." : "COMMIT CHANGES"}
                                        </Button>
                                        <Button variant="ghost" className="w-full h-10 mt-3 text-zinc-500 hover:text-zinc-300 font-black uppercase text-[10px] tracking-widest" onClick={() => router.get("/sales-return")}>
                                            Abort Patch
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </main>

                {/* ── DIALOGS (SAME AS CREATE) ── */}
                {/* Simplified Assign Item Dialog for brevity in this implementaion, 
                    but should be full as per create.tsx in production */}
                <Dialog open={assignItemDialogOpen} onOpenChange={setAssignItemDialogOpen}>
                    <DialogContent className="max-w-[95vw] md:max-w-4xl w-full md:w-[900px] bg-zinc-50 dark:bg-zinc-900 p-0 border-zinc-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Purchase History Catalog</h2>
                            <Input placeholder="SEARCH ITEMS..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} className="w-64 h-9 text-xs" />
                        </div>
                        <div className="max-h-[400px] overflow-auto p-4 grid grid-cols-2 gap-3">
                            {customerItems.filter(ci => !assignSearch || ci.item?.title.toLowerCase().includes(assignSearch.toLowerCase())).map(ci => (
                                <div key={ci.id} className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedAssignIds.includes(ci.id) ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-200 dark:border-zinc-800'}`} onClick={() => toggleAssignSelection(ci.id)}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black uppercase">{ci.item?.title}</span>
                                        <Checkbox checked={selectedAssignIds.includes(ci.id)} />
                                    </div>
                                    <div className="text-[10px] font-mono mt-2 opacity-70">INV: {ci.invoice_no} | DATE: {fmtDate(ci.date)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                            <Button variant="ghost" className="text-xs uppercase font-black" onClick={() => setAssignItemDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-orange-500 text-white text-xs uppercase font-black" onClick={handleBulkAddItems}>Add To Manifest</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Source Document Dialog */}
                <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                    <DialogContent className="max-w-4xl bg-zinc-50 dark:bg-zinc-900 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Reference Registry Search</h2>
                        </div>
                        <div className="p-4 max-h-[500px] overflow-auto space-y-3">
                            {loadingInvoices ? (
                                <div className="py-10 text-center animate-pulse text-zinc-400 font-black uppercase text-[10px]">Scanning Archives...</div>
                            ) : invoices.map(inv => (
                                <button key={inv.id} className="w-full text-left p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-orange-500 transition-all flex items-center justify-between group" onClick={() => handleSelectInvoice(inv)}>
                                    <div>
                                        <div className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white uppercase">{inv.invoice}</div>
                                        <div className="text-[10px] font-mono text-zinc-400">DATE: {fmtDate(inv.date)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-orange-600">Rs {toNum(inv.remaining_amount).toLocaleString()}</div>
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase italic">Balance Outstanding</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
                `}</style>
            </SidebarInset>
        </SidebarProvider>
    );
}
