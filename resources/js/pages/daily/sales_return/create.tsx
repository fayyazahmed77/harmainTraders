// sales_return/create.tsx
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

interface Props {
    accounts: Account[];
    salemans: { id: number; name: string }[];
    nextInvoiceNo: string;
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
export default function SalesReturnCreatePage({ accounts, salemans, nextInvoiceNo }: Props) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // ── Header state ──────────────────────────
    const [date, setDate] = useState<Date>(new Date());
    const [calOpen, setCalOpen] = useState(false);
    const [invoiceNo, setInvoiceNo] = useState(nextInvoiceNo);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [accountSearch, setAccountSearch] = useState("");
    const [refundAmount, setRefundAmount] = useState(0);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [originalInvoiceNo, setOriginalInvoiceNo] = useState("");

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

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const currentScrollY = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;

            // Show if near top or bottom
            if (currentScrollY < 10 || currentScrollY + clientHeight >= scrollHeight - 50) {
                setShowStickyFooter(true);
            }
            // Hide on scroll down, show on scroll up
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
    });

    const [rows, setRows] = useState<RowData[]>([getEmptyRow()]);
    const [selectedRowItemId, setSelectedRowItemId] = useState<number | null>(null);
    const [rowSearchMap, setRowSearchMap] = useState<Record<number, string>>({});
    const [rowPopoverOpen, setRowPopoverOpen] = useState<Record<number, boolean>>({});
    const [customerItems, setCustomerItems] = useState<any[]>([]);

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

                        // Derived percentages - strictly from amounts
                        const taxableBase = base - discAmt;
                        const taxVal = (taxAmt > 0 && taxableBase > 0) ? +((taxAmt / taxableBase) * 100).toFixed(2) : 0;
                        const discVal = (discAmt > 0 && base > 0) ? +((discAmt / base) * 100).toFixed(2) : 0;

                        return {
                            id: Math.random(),
                            item_id: si.item_id,
                            item_title: si.item?.title ?? "",
                            full: s_full, // Auto-load qty
                            pcs: s_pcs,   // Auto-load qty
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

    // ── Save ──────────────────────────────────
    const handleSave = () => {
        const rowCount = rows.filter(r => r.item_id !== null).length;
        const validRows = rowsWithAmount.filter(r => r.item_id !== null && (r.full > 0 || r.pcs > 0));

        if (!selectedAccount) { alert("Please identify the customer first."); return; }
        if (rowCount === 0) { alert("Please assign items to the manifest before executing return."); return; }
        if (validRows.length === 0) { alert("Please enter return quantities (Cartons or PCS) for the assigned items."); return; }

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

        router.post("/sales-return", payload, {
            onSuccess: () => {
                setIsSaving(false);
                router.get("/sales-return");
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
                                        <div className="text-sm font-black text-orange-600 font-mono tracking-tighter uppercase">{invoiceNo}</div>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest text-right">Return Date</div>
                                        <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 flex items-center justify-end gap-1.5 leading-none">
                                            <CalendarIcon size={12} className="text-zinc-400" />
                                            {fmtDate(date.toISOString())}
                                        </div>
                                    </div>
                                </div>

                                <TechLabel label="Client Designation" icon={UserIcon}>
                                    <Popover open={mobileAccOpen} onOpenChange={setMobileAccOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-black text-sm text-left uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500 shadow-sm`}>
                                                <span className="truncate">{selectedAccount ? selectedAccount.title : "Identify Customer..."}</span>
                                                <Search size={14} className="text-zinc-400 flex-shrink-0 ml-2" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[calc(100vw-48px)] p-0 shadow-2xl border-zinc-300 dark:border-zinc-700" align="center" sideOffset={8}>
                                            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                                                <Input placeholder="SEARCH IDENTITY..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-10 text-xs font-mono uppercase border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
                                            </div>
                                            <div className="max-h-[60vh] overflow-auto py-1">
                                                {filteredAccounts.map(acc => (
                                                    <button key={acc.id} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-orange-500"
                                                        onClick={() => { handleAccountSelect(acc.id); setAccountSearch(""); }}>
                                                        <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-orange-500 flex-shrink-0" />
                                                        <span className="truncate">{acc.title}</span>
                                                    </button>
                                                ))}
                                                {filteredAccounts.length === 0 && (
                                                    <div className="py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No Identities Found</div>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TechLabel>

                                <TechLabel label="Return Authorization" icon={Hash}>
                                    <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className={`h-10 border-zinc-200 dark:border-zinc-700 font-black text-sm tracking-[0.2em] bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 focus-visible:ring-orange-500 shadow-sm`} />
                                </TechLabel>
                            </Card>
                        </div>

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
                                                    {selectedInvoice ? selectedInvoice.invoice : "SELECT SOURCE INVOICE"}
                                                    <ArrowRightLeft size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                                </Button>
                                            </div>

                                            {selectedInvoice && (
                                                <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8">
                                                    <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
                                                    <div className="space-y-0.5">
                                                        <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest">Doc Date</div>
                                                        <div className="text-zinc-600 dark:text-zinc-300 font-mono text-xs">{fmtDate(selectedInvoice.date)}</div>
                                                    </div>
                                                    <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
                                                    <div className="space-y-0.5">
                                                        <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest">Outstanding</div>
                                                        <div className="text-orange-600 dark:text-orange-500 font-black">Rs {toNum(selectedInvoice.remaining_amount).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Button onClick={openInvoiceDialog} className={`h-11 px-6 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest relative z-10 w-full md:w-auto ${PREMIUM_ROUNDING_MD}`}>
                                            Search Registry
                                        </Button>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Item Grid (Desktop Only) */}
                        <div className={`hidden md:flex flex-1 overflow-hidden flex flex-col ${CARD_BASE} ${PREMIUM_ROUNDING_MD}`}>
                            <div className={`grid grid-cols-12 bg-zinc-50 dark:bg-zinc-900/80 p-4 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-20`}>
                                <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Inventory Identification</div>
                                <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-100/30 dark:bg-zinc-950/50 -mx-1 py-1">Manifest Qty</div>
                                <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-500/5 dark:bg-orange-500/10 -mx-1 py-1">Return Qty</div>
                                <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Unit Val</div>
                                <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Duty %</div>
                                <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Dec %</div>
                                <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Position Net</div>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                                {rowsWithAmount.map((row, idx) => (
                                    <motion.div key={row.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.05 }}
                                        className="grid grid-cols-12 gap-2 p-3 items-center group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">

                                        {/* Item Select */}
                                        <div className="col-span-3 relative">
                                            {row.item_id && row.item_title ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase tracking-tighter truncate leading-tight dark:text-zinc-100">{row.item_title}</span>
                                                    <span className="text-[9px] font-mono text-zinc-400">ID: {row.item_id.toString().padStart(5, '0')}</span>
                                                </div>
                                            ) : (
                                                <Button variant="outline" className={`w-full h-8 text-[10px] font-black uppercase justify-start ${PREMIUM_ROUNDING_MD} border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500`}
                                                    onClick={() => setAssignItemDialogOpen(true)} disabled={!selectedAccount}>
                                                    <Plus size={12} className="mr-2 text-orange-500" />
                                                    Assign Item
                                                </Button>
                                            )}
                                        </div>

                                        {/* Manifest Qty (Sold) */}
                                        <div className="col-span-1">
                                            <div className="text-center font-mono text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-1 border border-zinc-100 dark:border-zinc-800">{row.sold_full}<span className="text-[8px] ml-0.5 opacity-50 font-normal">full</span></div>
                                        </div>
                                        <div className="col-span-1">
                                            <div className="text-center font-mono text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-1 border border-zinc-100 dark:border-zinc-800">{row.sold_pcs}<span className="text-[8px] ml-0.5 opacity-50 font-normal">pcs</span></div>
                                        </div>

                                        {/* Return Qty */}
                                        <div className="col-span-1">
                                            <Input type="number" value={row.full || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, full: toNum(e.target.value) } : r))}
                                                className={`h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD} dark:text-zinc-100`} placeholder="FULL" />
                                        </div>
                                        <div className="col-span-1">
                                            <Input type="number" value={row.pcs || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, pcs: toNum(e.target.value) } : r))}
                                                className={`h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD} dark:text-zinc-100`} placeholder="PCS" />
                                        </div>

                                        {/* Rate */}
                                        <div className="col-span-1">
                                            <Input type="number" value={row.rate || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, rate: toNum(e.target.value) } : r))}
                                                className={`h-8 text-right font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-emerald-500 ${PREMIUM_ROUNDING_MD} dark:text-zinc-100`} />
                                        </div>

                                        {/* Duty / Tax % */}
                                        <div className="col-span-1">
                                            <Input type="number" value={row.taxPercent || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, taxPercent: toNum(e.target.value) } : r))}
                                                readOnly={row.taxReadOnly} tabIndex={row.taxReadOnly ? -1 : 0}
                                                className={`h-8 text-center font-mono text-[10px] font-bold border-zinc-200 dark:border-zinc-700 ${row.taxReadOnly ? 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400' : 'bg-white dark:bg-zinc-800'} ${PREMIUM_ROUNDING_MD}`} />
                                        </div>

                                        {/* Dec % (Discount) */}
                                        <div className="col-span-1">
                                            <Input type="number" value={row.discPercent || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, discPercent: toNum(e.target.value) } : r))}
                                                readOnly={row.discReadOnly} tabIndex={row.discReadOnly ? -1 : 0}
                                                className={`h-8 text-center font-mono text-[10px] font-bold border-zinc-200 dark:border-zinc-700 ${row.discReadOnly ? 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400' : 'bg-white dark:bg-zinc-800'} ${PREMIUM_ROUNDING_MD}`} />
                                        </div>

                                        {/* Total Position */}
                                        <div className="col-span-2 flex items-center justify-end gap-2 group-hover:pr-1 transition-all">
                                            <div className="text-right font-black text-xs tracking-tighter text-zinc-800 dark:text-zinc-100">Rs {row.amount.toLocaleString()}</div>
                                            <button className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                                                onClick={() => setRows(p => p.filter(r => r.id !== row.id))}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Table Actions */}
                            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Button variant="outline" size="sm" className={`h-8 text-[10px] font-black uppercase ${PREMIUM_ROUNDING_MD} border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 dark:text-zinc-200`}
                                    onClick={() => setRows(p => [getEmptyRow(), ...p])}>
                                    <Plus size={14} className="mr-2 text-orange-500" />
                                    Initialize Item Position
                                </Button>
                                <Button variant="outline" size="sm" className={`h-8 text-[10px] font-black uppercase ${PREMIUM_ROUNDING_MD} border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 dark:text-zinc-200`}
                                    onClick={() => setAssignItemDialogOpen(true)} disabled={!selectedAccount}>
                                    <Package size={14} className="mr-2 text-orange-500" />
                                    Assign Item (Bulk)
                                </Button>
                                <Button variant="outline" size="sm" className={`h-8 text-[10px] font-black uppercase ${PREMIUM_ROUNDING_MD} border-zinc-200 dark:border-zinc-700 hover:border-zinc-800 dark:hover:border-zinc-300 dark:text-zinc-200`}
                                    onClick={() => setRows([getEmptyRow()])}>
                                    <RotateCcw size={14} className="mr-2 text-zinc-400" />
                                    Purge Workspace
                                </Button>
                            </div>
                        </div>

                        {/* Item Cards (Mobile Only) */}
                        <div className="md:hidden space-y-4 pb-24">

                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Package size={14} /> Item Registry
                                </h3>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setRows(p => [getEmptyRow(), ...p])} className="h-8 rounded-full border-zinc-200 dark:border-zinc-800 text-zinc-500 bg-zinc-50 dark:bg-zinc-900 font-bold text-[9px] uppercase">
                                        <Plus size={12} className="mr-1 opacity-50" /> Add Row
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setAssignItemDialogOpen(true)} disabled={!selectedAccount} className="h-8 rounded-full border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-500/10 font-bold text-[9px] uppercase">
                                        <Package size={12} className="mr-1" /> Assign Items
                                    </Button>
                                </div>
                            </div>

                            {rows.map((row, idx) => (
                                <Card key={row.id} className={`${CARD_BASE} ${PREMIUM_ROUNDING_MD} p-4 space-y-3 relative overflow-hidden`}>
                                    {row.item_id ? (
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black uppercase tracking-tight leading-none mb-1">{row.item_title}</span>
                                                <span className="text-[10px] font-mono text-zinc-400"># {row.item_id.toString().padStart(5, '0')}</span>
                                            </div>
                                            <button onClick={() => setRows(p => p.filter(r => r.id !== row.id))} className="text-zinc-300 hover:text-rose-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <Button variant="outline" className={`h-10 text-xs font-black uppercase flex-1 ${PREMIUM_ROUNDING_MD} border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500`}
                                                onClick={() => setAssignItemDialogOpen(true)} disabled={!selectedAccount}>
                                                <Plus size={14} className="mr-2 text-orange-500" />
                                                Assign Item to Position
                                            </Button>
                                            <button onClick={() => setRows(p => p.filter(r => r.id !== row.id))} className="ml-3 text-zinc-300 hover:text-rose-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase text-zinc-400">Cartons / PCS</div>
                                            <div className="flex items-center gap-1">
                                                <Input type="number" placeholder="Full" value={row.full || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, full: toNum(e.target.value) } : r))} className="h-9 text-xs font-black text-center" />
                                                <Input type="number" placeholder="Pcs" value={row.pcs || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, pcs: toNum(e.target.value) } : r))} className="h-9 text-xs font-black text-center" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase text-zinc-400">Return Rate</div>
                                            <Input type="number" value={row.rate || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, rate: toNum(e.target.value) } : r))} className="h-9 text-xs font-black text-right border-emerald-500/30" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pb-1">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase text-zinc-400">Duty %</div>
                                            <Input type="number" value={row.taxPercent || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, taxPercent: toNum(e.target.value) } : r))}
                                                readOnly={row.taxReadOnly} className={`h-9 text-xs font-bold text-center ${row.taxReadOnly ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 opacity-70' : ''}`} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase text-zinc-400">Dec %</div>
                                            <Input type="number" value={row.discPercent || ""} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, discPercent: toNum(e.target.value) } : r))}
                                                readOnly={row.discReadOnly} className={`h-9 text-xs font-bold text-center ${row.discReadOnly ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 opacity-70' : ''}`} />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1 border-t border-zinc-50 dark:border-zinc-800/50">
                                        <div className="text-[9px] font-black uppercase text-zinc-400">Position Net</div>
                                        <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 italic">Rs {row.amount.toLocaleString()}</div>
                                    </div>
                                </Card>
                            ))}

                            {/* Mobile Audit Summary (Moved to Bottom) */}
                            <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                                <Card className={`p-4 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} space-y-3 shadow-lg`}>
                                    <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                        <div className="text-[10px] uppercase font-black text-zinc-400 tracking-widest flex items-center gap-2">
                                            <Calculator size={14} /> Audit Summary
                                        </div>
                                        <div className="text-xs font-black text-zinc-800 dark:text-zinc-100">
                                            ITEMS: {rowsWithAmount.filter(r => r.item_id).length}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-0.5">
                                            <div className="text-[9px] uppercase font-bold text-zinc-500">Position Net</div>
                                            <div className="text-lg font-black italic">Rs {totals.gross.toLocaleString()}</div>
                                        </div>
                                        <div className="text-right space-y-0.5">
                                            <div className="text-[9px] uppercase font-bold text-zinc-500 text-orange-600 dark:text-orange-400">Net Refund</div>
                                            <div className="text-lg font-black text-orange-600 dark:text-orange-400 italic">Rs {totals.net.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black uppercase text-zinc-400">Cash Refund</div>
                                            <Input type="number" value={refundAmount || ""} onChange={e => setRefundAmount(toNum(e.target.value))} className="h-10 text-xs font-black text-right bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700" />
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="text-[9px] font-black uppercase text-zinc-400">Tax Impact</div>
                                            <div className="text-xs font-bold text-rose-500">Rs {totals.tax.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    </div>

                    {/* ── COMMAND CENTER (Desktop Only) ── */}
                    <div className="hidden md:flex w-[320px] md:flex-col md:gap-6">

                        {/* Financial Auditor Panel */}
                        <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                            <Card className={`${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 shadow-md relative overflow-hidden flex flex-col ${PREMIUM_ROUNDING_MD}`}>
                                <div className={`absolute inset-0 opacity-[0.03] dark:opacity-10 ${ACCENT_GRADIENT}`} style={{ mixBlendMode: 'overlay' }} />
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-5">
                                    <Calculator size={120} className="text-zinc-900 dark:text-white" strokeWidth={1} />
                                </div>

                                <div className="p-6 space-y-8 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Calculator size={10} className="text-orange-500" />
                                            Financial Audit
                                        </h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-1 group">
                                            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex justify-between">
                                                Gross Position
                                                <Info size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-2 leading-none">
                                                <span className="text-zinc-400 dark:text-zinc-600 text-lg">Rs</span>
                                                {totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>

                                        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                                                    <BadgePercent size={10} />
                                                    Tax Impact
                                                </div>
                                                <div className="text-base font-bold text-zinc-800 dark:text-zinc-100 font-mono tracking-tighter">
                                                    + {totals.tax.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex justify-end items-center gap-1.5 pt-1">
                                                    <ArrowDownToLine size={10} className="text-rose-500" />
                                                    Disc. Total
                                                </div>
                                                <div className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tighter">
                                                    - {totals.disc.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 p-5 space-y-1 relative ${PREMIUM_ROUNDING_MD}`}>
                                            <div className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest flex justify-between">
                                                Net Disbursement
                                                <Calculator size={10} className="opacity-50" />
                                            </div>
                                            <div className="text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tighter flex items-center gap-2 leading-none">
                                                <span className="text-orange-600 dark:text-orange-500 text-lg opacity-50 font-mono font-normal">Rs</span>
                                                {totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <TechLabel label="Immediate Cash Refund" icon={ArrowRightLeft}>
                                            <div className="relative">
                                                <Input type="number" value={refundAmount || ""} onChange={e => setRefundAmount(toNum(e.target.value))}
                                                    className={`h-12 bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-black text-xl tracking-tighter px-4 ${PREMIUM_ROUNDING_MD} focus-visible:ring-orange-500`} placeholder="0.00" />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 text-xs font-mono">PKR</div>
                                            </div>
                                        </TechLabel>

                                        <div className={`bg-zinc-50 dark:bg-zinc-800/50 p-3 flex justify-between items-center ${PREMIUM_ROUNDING_MD} border border-zinc-100 dark:border-zinc-800`}>
                                            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Adjust Balance</div>
                                            <div className="text-sm font-mono font-black text-orange-600 dark:text-orange-500">Rs {(totals.net - refundAmount).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button className={`w-full h-14 ${ACCENT_GRADIENT} hover:opacity-90 text-white font-black text-lg uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] ${PREMIUM_ROUNDING}`}
                                            onClick={handleSave} disabled={isSaving}>
                                            <motion.div className="flex items-center justify-center gap-2 relative z-10" animate={isSaving ? { opacity: 0.5 } : {}}>
                                                {isSaving ? <RotateCcw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                {isSaving ? "PROCESSING..." : "EXECUTE RETURN"}
                                            </motion.div>
                                        </Button>
                                        <Button variant="ghost" className="w-full h-10 mt-3 text-zinc-500 hover:text-zinc-300 font-black uppercase text-[10px] tracking-widest" onClick={() => router.get("/sales-return")}>
                                            Terminate Session
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Inventory Context */}
                        <AnimatePresence>
                            {selectedRowItemId && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
                                    <Card className={`${CARD_BASE} p-5 ${PREMIUM_ROUNDING_MD} overflow-hidden relative`}>
                                        <div className="absolute top-1 right-1 opacity-[0.03]">
                                            <Package size={80} className="text-black dark:text-white" strokeWidth={1} />
                                        </div>
                                        <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                            <div className={`w-2 h-2 rounded-full ${ACCENT_GRADIENT}`} />
                                            <h4 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">Inventory Context</h4>
                                        </div>

                                        {(() => {
                                            const details = customerItems.find(ci => ci.item_id === selectedRowItemId);
                                            if (!details) return <div className="text-[10px] font-bold text-zinc-400 uppercase italic">Awaiting selection...</div>;
                                            return (
                                                <div className="space-y-5">
                                                    <div>
                                                        <div className="text-lg font-black tracking-tighter leading-tight uppercase text-zinc-900 truncate">{details.item?.title}</div>
                                                        <div className="text-[9px] font-mono font-bold text-zinc-400">SKU REGISTRY: {details.item_id.toString().padStart(6, '0')}</div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Unit Config</div>
                                                            <div className="text-sm font-bold tracking-tighter text-zinc-800">1 x {toNum(details.item?.packing_full || 1)} PCS</div>
                                                        </div>
                                                        <div className="space-y-1 text-right">
                                                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Shelf Stock</div>
                                                            <div className="text-sm font-bold tracking-tighter text-emerald-600">{toNum(details.item?.stock_1).toLocaleString()} <span className="text-[10px] opacity-70">PCS</span></div>
                                                        </div>
                                                    </div>

                                                    <div className={`bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3 flex justify-between items-center ${PREMIUM_ROUNDING_MD}`}>
                                                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Historical Price</div>
                                                        <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 font-mono">Rs {toNum(details.last_trade_price).toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {/* Mobile Sticky Footer */}
                <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-4 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.1)] transition-transform duration-300 ${showStickyFooter ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex flex-col">
                            <div className="text-[10px] text-zinc-500 uppercase font-black tracking-wider mb-0.5">Net Disbursement</div>
                            <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                                <span className="text-sm font-bold mr-1">Rs</span>
                                {totals.net.toLocaleString()}
                            </div>
                        </div>
                        <Button onClick={handleSave} className="h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 rounded-xl font-black text-sm uppercase tracking-wider transition-all active:scale-95" disabled={isSaving}>
                            {isSaving ? <RotateCcw size={16} className="mr-2 animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />}
                            {isSaving ? "PROCESSING..." : "EXECUTE RETURN"}
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] uppercase text-zinc-400 font-bold">Items Count</span>
                            <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{rows.filter(r => r.item_id).length} Pos</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-zinc-100 dark:border-zinc-800">
                            <span className="text-[9px] uppercase text-zinc-400 font-bold">Tax Impact</span>
                            <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">Rs {totals.tax.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* ── ASSIGN ITEM DIALOG (Method B) ── */}
                <Dialog open={assignItemDialogOpen} onOpenChange={setAssignItemDialogOpen}>
                    <DialogContent className={`max-w-[95vw] md:max-w-4xl w-full md:w-[900px] border-none bg-transparent shadow-none p-0`}>
                        <DialogTitle className="hidden">Bulk Item Assignment</DialogTitle>
                        <DialogDescription className="hidden">Select multiple items to add to the return manifest from the customer's purchase history.</DialogDescription>
                        <Card className={`${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 shadow-2xl p-0 overflow-hidden ${PREMIUM_ROUNDING}`}>
                            <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row md:justify-between md:items-center relative z-10 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.4em]">Inventory Catalog</div>
                                    <h2 className="text-sm md:text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">PURCHASED BY: {selectedAccount?.title}</h2>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                                    <Input placeholder="SEARCH CATALOG..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                                        className={`h-10 bg-white dark:bg-white/5 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-[10px] tracking-widest pl-10 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD}`} />
                                </div>
                            </div>

                            <div className="max-h-[450px] overflow-auto p-4 custom-scrollbar relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {customerItems.filter(ci => !assignSearch || ci.item?.title.toLowerCase().includes(assignSearch.toLowerCase()) || ci.invoice_no?.toLowerCase().includes(assignSearch.toLowerCase())).map((ci, idx) => (
                                    <motion.div key={ci.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                                        className={`flex items-center gap-4 p-3 border ${selectedAssignIds.includes(ci.id) ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-white/5'} ${PREMIUM_ROUNDING_MD} transition-all cursor-pointer group`}
                                        onClick={() => toggleAssignSelection(ci.id)}>
                                        <Checkbox checked={selectedAssignIds.includes(ci.id)} onCheckedChange={() => toggleAssignSelection(ci.id)} className="border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-orange-500" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="text-[11px] font-black text-zinc-900 dark:text-white uppercase truncate tracking-tighter">{ci.item?.title}</div>
                                                <div className="text-[9px] font-mono font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">{ci.invoice_no}</div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-zinc-600">
                                                <span>Sold: Rs {toNum(ci.last_trade_price).toLocaleString()}</span>
                                                <span className="w-px h-2 bg-zinc-200 dark:bg-zinc-800" />
                                                <span>Qty: {toNum(ci.qty_carton)}ctn {toNum(ci.qty_pcs)}pcs</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-zinc-600/100 mt-1 uppercase">Purchased: <span className="text-zinc-600 dark:text-zinc-300 font-bold">{fmtDate(ci.date)}</span></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center relative z-10">
                                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                    {selectedAssignIds.length} Items Selected for Identification
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

                {/* ── SOURCE DOCUMENT SELECTION ── */}
                <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                    <DialogContent className={`max-w-[95vw] md:max-w-4xl w-full md:w-[900px] border-none bg-transparent shadow-none p-0`}>
                        <DialogTitle className="hidden">Source Document Registry</DialogTitle>
                        <DialogDescription className="hidden">Search and select previous sales invoices to populate the return manifest.</DialogDescription>
                        <Card className={`${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 shadow-[0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(0,0,0,0.5)] p-0 overflow-hidden ${PREMIUM_ROUNDING}`}>
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                            <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row md:justify-between md:items-center relative z-10 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.4em]">Registry Search</div>
                                    <h2 className="text-sm md:text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-tight">DOCUMENT SOURCE: <br className="md:hidden" /> {selectedAccount?.title}</h2>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                                    <Input autoFocus placeholder="SEARCH BY ID OR DATE..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)}
                                        className={`h-10 bg-white dark:bg-white/5 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-[10px] tracking-widest pl-10 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD}`} />
                                </div>
                            </div>

                            <div className="max-h-[500px] overflow-auto p-4 custom-scrollbar relative z-10">
                                {loadingInvoices ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className={`w-8 h-8 border-4 border-orange-500 border-t-transparent animate-spin ${PREMIUM_ROUNDING}`} />
                                        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">Scanning Cloud Repository...</div>
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
                                                <div className="text-lg md:text-xl font-black text-orange-600 dark:text-orange-500 leading-none tracking-tighter">Rs {toNum(inv.remaining_amount).toLocaleString()}</div>
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-300 dark:text-zinc-700 group-hover:text-orange-500 transition-colors hidden md:block" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </Card>
                    </DialogContent>
                </Dialog>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
                `}</style>

            </SidebarInset>
        </SidebarProvider>
    );
}
