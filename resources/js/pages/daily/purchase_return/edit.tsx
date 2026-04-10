// purchase_return/edit.tsx
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
    ArrowDownToLine, Database, Clock, Banknote
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
    { title: "Edit Return", href: "#" },
];

// Style Constants
const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const MONO_FONT = "font-mono tracking-tighter";

const SIGNAL_ORANGE = "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-500 to-rose-500";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";
const PREMIUM_GRADIENT = "bg-gradient-to-r from-orange-500 to-rose-500";
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
    discPercent: number;
    discReadOnly?: boolean;
    amount: number;
    packing: number;
    bonus_full: number;
    bonus_pcs: number;
}

interface Account {
    id: number;
    title: string;
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

interface PurchaseReturn {
    id: number;
    invoice: string;
    date: string;
    original_invoice: string;
    supplier_id: number;
    salesman_id: number;
    gross_total: number;
    discount_total: number;
    net_total: number;
    items: any[];
    remarks?: string;
}

interface Props {
    returnData: PurchaseReturn;
    accounts: Account[];
    salemans: { id: number; name: string }[];
}

const toNum = (v: any) => { const n = Number(v); return isNaN(n) ? 0 : n; };

const fmtDate = (d: string) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
    <div className="space-y-1 relative">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5">
            {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
            {label}
        </div>
        {children}
    </div>
);

// ───────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────
export default function PurchaseReturnEditPage({ returnData, accounts, salemans }: Props) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // ── Header state ──────────────────────────
    const [date, setDate] = useState<Date>(new Date(returnData.date));
    const [calOpen, setCalOpen] = useState(false);
    const [invoiceNo, setInvoiceNo] = useState(returnData.invoice);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(() => accounts.find(a => a.id === returnData.supplier_id) ?? null);
    const [accountSearch, setAccountSearch] = useState("");
    const [remarks, setRemarks] = useState(returnData.remarks || "");
    const [originalInvoiceNo, setOriginalInvoiceNo] = useState(returnData.original_invoice);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [supplierBalance, setSupplierBalance] = useState<number | null>(null);
    const [refundAmount, setRefundAmount] = useState(toNum((returnData as any).paid_amount || 0));

    // ── Invoice Dialog state ───────────────────
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // ── State flags ──────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [desktopAccOpen, setDesktopAccOpen] = useState(false);

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
        discPercent: 0,
        discReadOnly: false,
        amount: 0,
        packing: 1,
        bonus_full: 0,
        bonus_pcs: 0,
    });

    const [rows, setRows] = useState<RowData[]>([]);
    const [selectedRowItemId, setSelectedRowItemId] = useState<number | null>(null);
    const [supplierItems, setSupplierItems] = useState<any[]>([]);

    const [assignItemDialogOpen, setAssignItemDialogOpen] = useState(false);
    const [assignSearch, setAssignSearch] = useState("");
    const [selectedAssignIds, setSelectedAssignIds] = useState<number[]>([]);

    useEffect(() => {
        if (returnData.items) {
            const initialRows = returnData.items.map(it => {
                const packing = toNum(it.item?.packing_full ?? 1);
                const base = (toNum(it.qty_carton) * packing + toNum(it.qty_pcs)) * toNum(it.trade_price);
                const discAmt = toNum(it.discount);
                const discVal = (discAmt > 0 && base > 0) ? +((discAmt / base) * 100).toFixed(2) : 0;

                return {
                    id: it.id,
                    item_id: it.item_id,
                    item_title: it.item?.title ?? "Unknown Item",
                    full: toNum(it.qty_carton),
                    pcs: toNum(it.qty_pcs),
                    sold_full: toNum(it.qty_carton), // simplified for edit
                    sold_pcs: toNum(it.qty_pcs),
                    rate: toNum(it.trade_price),
                    discPercent: discVal,
                    discReadOnly: true,
                    amount: toNum(it.subtotal),
                    packing: packing,
                    bonus_full: toNum(it.bonus_qty_carton || 0),
                    bonus_pcs: toNum(it.bonus_qty_pcs || 0),
                };
            });
            setRows(initialRows);
            if (initialRows.length > 0) setSelectedRowItemId(initialRows[0].item_id);
        }
    }, [returnData]);

    useEffect(() => {
        if (selectedAccount) {
            fetch(`/account/balance/${selectedAccount.id}`)
                .then(r => r.json())
                .then(data => setSupplierBalance(toNum(data.balance)))
                .catch(console.error);

            fetch(`/purchase-return/supplier/${selectedAccount.id}/purchased-items`)
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) setSupplierItems(data); })
                .catch(console.error);
        }
    }, [selectedAccount]);

    // ── Handlers ──────────────────────────────
    const handleAccountSelect = (accId: number) => {
        const acc = accounts.find(a => a.id === accId) ?? null;
        setSelectedAccount(acc);
        setSelectedInvoice(null);
        setOriginalInvoiceNo("");
        setRows([getEmptyRow()]);
        setInvoices([]);
        setDesktopAccOpen(false);
    };

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
                        const packing = toNum(it?.packing_full ?? 1);
                        const base = (s_full * packing + s_pcs) * rate;
                        const discAmt = toNum(pi.discount || 0);
                        const discVal = (discAmt > 0 && base > 0) ? +((discAmt / base) * 100).toFixed(2) : 0;

                        return {
                            id: Math.random(),
                            item_id: pi.item_id,
                            item_title: it?.title ?? "",
                            full: 0, 
                            pcs: 0,
                            sold_full: s_full,
                            sold_pcs: s_pcs,
                            rate: rate,
                            discPercent: discVal,
                            discReadOnly: true,
                            amount: 0,
                            packing: packing,
                            bonus_full: 0,
                            bonus_pcs: 0
                        };
                    });
                    setRows(loadedRows.length > 0 ? loadedRows : [getEmptyRow()]);
                }
            });
    };

    const handleBulkAddItems = () => {
        const itemsToAdd = supplierItems.filter(ci => selectedAssignIds.includes(ci.id));
        const newRows = itemsToAdd.map(pi => {
            const s_full = toNum(pi.qty_carton);
            const s_pcs = toNum(pi.qty_pcs);
            const rate = toNum(pi.last_trade_price ?? 0);
            const it = pi.item;
            const packing = toNum(it?.packing_full ?? 1);
            const base = (s_full * packing + s_pcs) * rate;
            const discAmt = toNum(pi.discount || 0);
            const discVal = (discAmt > 0 && base > 0) ? +((discAmt / base) * 100).toFixed(2) : 0;

            return {
                id: Math.random(),
                item_id: pi.item_id,
                item_title: it?.title ?? "",
                full: 0,
                pcs: 0,
                sold_full: s_full,
                sold_pcs: s_pcs,
                rate: rate,
                discPercent: discVal,
                discReadOnly: true,
                amount: 0,
                packing: packing,
                bonus_full: 0,
                bonus_pcs: 0
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
            const packing = toNum(r.packing || 1);
            const rate = toNum(r.rate);
            const baseAmount = (toNum(r.full) * rate) + (toNum(r.pcs) * (rate / packing));
            const discAmount = (toNum(r.discPercent) / 100) * baseAmount;
            return { ...r, amount: Math.round(baseAmount - discAmount) };
        });
    }, [rows]);

    const totals = useMemo(() => {
        let gross = 0, disc = 0, total_full = 0, total_pcs = 0;
        rowsWithAmount.forEach(r => {
            const packing = toNum(r.packing || 1);
            const rate = toNum(r.rate);
            const base = (toNum(r.full) * rate) + (toNum(r.pcs) * (rate / packing));
            const d = (toNum(r.discPercent) / 100) * base;
            gross += base;
            disc += d;
            total_full += toNum(r.full);
            total_pcs += toNum(r.pcs);
        });
        return {
            gross: Math.round(gross),
            disc: Math.round(disc),
            net: Math.round(gross - disc),
            total_full,
            total_pcs
        };
    }, [rowsWithAmount]);

    const filteredAccounts = useMemo(() => {
        const q = accountSearch.toLowerCase();
        return accounts.filter(a => a.title.toLowerCase().includes(q));
    }, [accounts, accountSearch]);

    const updateRow = (id: number, field: keyof RowData, value: any) => {
        setRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };
            
            if (field === 'full' || field === 'pcs') {
                const packing = toNum(r.packing || 1);
                const maxTotalPcs = toNum(r.sold_full) * packing + toNum(r.sold_pcs);
                const currentTotalPcs = toNum(updated.full) * packing + toNum(updated.pcs);

                if (maxTotalPcs > 0 && currentTotalPcs > maxTotalPcs) {
                    if (field === 'full') {
                        updated.full = Math.floor(maxTotalPcs / packing);
                        updated.pcs = maxTotalPcs % packing;
                    } else {
                        updated.pcs = maxTotalPcs - (toNum(updated.full) * packing);
                    }
                }
            }
            return updated;
        }));
    };

    const handleSave = () => {
        const validRows = rowsWithAmount.filter(r => r.item_id !== null && (r.full > 0 || r.pcs > 0 || r.bonus_full > 0 || r.bonus_pcs > 0));

        if (!selectedAccount) { alert("Please identify the supplier first."); return; }
        if (validRows.length === 0) { alert("Please enter return quantities."); return; }

        setIsSaving(true);
        const payload = {
            date: date.toISOString().split('T')[0],
            invoice: invoiceNo,
            original_invoice: originalInvoiceNo,
            supplier_id: selectedAccount.id,
            salesman_id: selectedAccount.saleman_id ?? null,
            no_of_items: validRows.length,
            gross_total: totals.gross,
            discount_total: totals.disc,
            net_total: totals.net,
            remarks: remarks,
            items: validRows.map(r => {
                const packing = toNum(r.packing || 1);
                const rate = toNum(r.rate);
                const base = (toNum(r.full) * rate) + (toNum(r.pcs) * (rate / packing));
                const d = (toNum(r.discPercent) / 100) * base;
                return {
                    item_id: r.item_id,
                    qty_carton: r.full,
                    qty_pcs: r.pcs,
                    total_pcs: (toNum(r.full) * packing) + toNum(r.pcs),
                    bonus_qty_carton: r.bonus_full,
                    bonus_qty_pcs: r.bonus_pcs,
                    trade_price: r.rate,
                    discount: Math.round(d),
                    subtotal: Math.round(base - d),
                };
            }),
            paid_amount: refundAmount,
            remaining_amount: totals.net - refundAmount,
        };

        router.put(`/purchase-return/${returnData.id}`, payload, {
            onSuccess: () => {
                setIsSaving(false);
                router.get("/purchase-return");
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

                <main ref={scrollContainerRef} className="flex-1 overflow-auto p-3 md:p-6 flex flex-col md:flex-row gap-6 scroll-smooth text-foreground">
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Control Deck */}
                        <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} grid grid-cols-12 gap-6 items-end relative overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-1.5 h-full bg-orange-500`} />
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
                                                <Input placeholder="SEARCH IDENTITY..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-9 text-xs font-mono uppercase border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
                                            </div>
                                            <div className="max-h-64 overflow-auto py-1">
                                                {filteredAccounts.map(acc => (
                                                    <button key={acc.id} className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors flex items-center gap-2 group border-l-2 border-transparent hover:border-orange-500"
                                                        onClick={() => handleAccountSelect(acc.id)}>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-orange-500" />
                                                        {acc.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    {supplierBalance !== null && (
                                        <div className="absolute -top-1.5 -right-1.5 flex flex-col items-end pointer-events-none">
                                            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[8px] font-black px-2 py-0.5 rounded shadow-xl flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                                                <span className="text-zinc-500">BAL:</span>
                                                <span className={toNum(supplierBalance) >= 0 ? "text-emerald-500" : "text-rose-500"}>
                                                    Rs {toNum(supplierBalance).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </TechLabel>
                            </div>

                            <div className="col-span-4">
                                <TechLabel label="Verification No" icon={Hash}>
                                    <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className={`h-10 border-zinc-200 dark:border-zinc-700 font-black text-sm tracking-[0.2em] bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 focus-visible:ring-orange-500`} />
                                </TechLabel>
                            </div>
                        </Card>

                        {/* Transaction Bar */}
                        {selectedAccount && (
                            <Card className={`p-4 bg-zinc-900 dark:bg-zinc-900 text-white ${PREMIUM_ROUNDING_MD} border border-zinc-800 flex items-center justify-between gap-4 shadow-xl`}>
                                <div className="space-y-0.5">
                                    <div className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Source Document</div>
                                    <Button variant="ghost" className="h-auto p-0 text-orange-400 hover:text-orange-300 font-black tracking-tighter text-base flex items-center gap-2" onClick={openInvoiceDialog}>
                                        {originalInvoiceNo || "SELECT SOURCE INVOICE"}
                                        <ArrowRightLeft size={14} />
                                    </Button>
                                </div>
                                <Button onClick={openInvoiceDialog} className={`h-10 px-6 bg-white text-black hover:bg-zinc-200 transition-all font-black text-[10px] uppercase tracking-widest ${PREMIUM_ROUNDING_MD}`}>
                                    Replace Reference
                                </Button>
                            </Card>
                        )}

                        {/* Item Manifest */}
                        <div className={`flex-1 flex flex-col ${CARD_BASE} ${PREMIUM_ROUNDING_MD} overflow-hidden`}>
                            <div className={`grid grid-cols-12 bg-zinc-50 dark:bg-zinc-900 p-4 border-b border-zinc-100 dark:border-zinc-800 font-black text-[10px] uppercase tracking-widest text-zinc-500`}>
                                <div className="col-span-3">Inventory Identification</div>
                                <div className="col-span-3 text-center text-orange-600">Return Qty</div>
                                <div className="col-span-2 text-center">Unit Val</div>
                                <div className="col-span-1 text-center">Dec %</div>
                                <div className="col-span-3 text-right pr-6">Position Net</div>
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                                {rowsWithAmount.map((row) => (
                                    <div key={row.id} onClick={() => setSelectedRowItemId(row.item_id)}
                                        className={`grid grid-cols-12 gap-3 p-3 items-center group cursor-pointer border-l-2 ${selectedRowItemId === row.item_id ? 'bg-orange-500/5 border-orange-500' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30 border-transparent'}`}>
                                        <div className="col-span-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase truncate leading-tight">{row.item_title}</span>
                                                <span className="text-[9px] font-mono text-zinc-400">ID: {row.item_id}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-3 grid grid-cols-4 gap-1">
                                            <Input type="number" value={row.full || ""} onChange={e => updateRow(row.id, 'full', toNum(e.target.value))}
                                                className={`h-8 text-center font-mono text-[10px] font-black ${PREMIUM_ROUNDING_MD}`} placeholder="F" title="Full cartons" />
                                            <Input type="number" value={row.pcs || ""} onChange={e => updateRow(row.id, 'pcs', toNum(e.target.value))}
                                                className={`h-8 text-center font-mono text-[10px] font-black ${PREMIUM_ROUNDING_MD}`} placeholder="P" title="Loose pieces" />
                                            <Input type="number" value={row.bonus_full || ""} onChange={e => updateRow(row.id, 'bonus_full', toNum(e.target.value))}
                                                className={`h-8 text-center font-mono text-[10px] font-black text-emerald-600 ${PREMIUM_ROUNDING_MD}`} placeholder="BF" title="Bonus cartons" />
                                            <Input type="number" value={row.bonus_pcs || ""} onChange={e => updateRow(row.id, 'bonus_pcs', toNum(e.target.value))}
                                                className={`h-8 text-center font-mono text-[10px] font-black text-emerald-600 ${PREMIUM_ROUNDING_MD}`} placeholder="BP" title="Bonus pieces" />
                                        </div>
                                        <div className="col-span-2">
                                            <Input type="number" value={row.rate || ""} onChange={e => updateRow(row.id, 'rate', toNum(e.target.value))}
                                                className={`h-8 text-right font-mono text-[10px] font-black ${PREMIUM_ROUNDING_MD}`} />
                                        </div>
                                        <div className="col-span-1">
                                            <Input type="number" value={row.discPercent || ""} onChange={e => updateRow(row.id, 'discPercent', toNum(e.target.value))}
                                                className={`h-8 text-center font-mono text-[10px] font-bold ${PREMIUM_ROUNDING_MD}`} />
                                        </div>
                                        <div className="col-span-3 flex items-center justify-end gap-2 pr-4 text-xs font-black">
                                            Rs {row.amount.toLocaleString()}
                                            <button className="opacity-0 group-hover:opacity-100 text-rose-500 p-1" onClick={() => setRows(p => p.filter(r => r.id !== row.id))}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase" onClick={() => setAssignItemDialogOpen(true)}>
                                    <Plus size={14} className="mr-2" /> Assign Bulk
                                </Button>
                            </div>
                        </div>
                    </div>

                    <aside className="w-[320px] flex flex-col gap-6">
                        <Card className={`p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl ${PREMIUM_ROUNDING_MD} space-y-6`}>
                            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Financial Summary</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] font-black text-zinc-400 uppercase">Gross Impact</div>
                                    <div className="text-2xl font-black tracking-tighter">Rs {totals.gross.toLocaleString()}</div>
                                </div>
                                {supplierBalance !== null && (
                                    <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                        <div className="text-[10px] font-black text-zinc-500 uppercase">Supplier Ledger Bal</div>
                                        <div className={`text-sm font-bold ${toNum(supplierBalance) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                            Rs {toNum(supplierBalance).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                    <div className="text-[10px] font-black text-zinc-500 uppercase">Total Boxes</div>
                                    <div className="text-sm font-bold">{totals.total_full}</div>
                                </div>
                                <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                    <div className="text-[10px] font-black text-zinc-500 uppercase">Total Pieces</div>
                                    <div className="text-sm font-bold">{totals.total_pcs}</div>
                                </div>
                                <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                    <div className="text-[10px] font-black text-rose-500 uppercase">Discount</div>
                                    <div className="text-sm font-bold text-rose-600">- {totals.disc.toLocaleString()}</div>
                                </div>
                                <div className="bg-orange-600 text-white p-4 rounded-xl space-y-1">
                                    <div className="text-[9px] font-black uppercase opacity-60">Net Debit Entry</div>
                                    <div className="text-2xl font-black tracking-tighter">Rs {totals.net.toLocaleString()}</div>
                                </div>
                                <TechLabel label="Refund Liquidation (Paid)" icon={Banknote}>
                                    <div className="relative">
                                        <Input type="number" value={refundAmount || ""} onChange={e => setRefundAmount(toNum(e.target.value))}
                                            className={`h-11 font-mono font-black text-xl tracking-tighter pl-12 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 transition-all focus:ring-2 focus:ring-orange-500/20`} placeholder="0.00" />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                            <ArrowDownToLine size={20} />
                                        </div>
                                    </div>
                                </TechLabel>
                            </div>
                            <div className="space-y-4 pt-2">
                                <TechLabel label="Admin Remarks" icon={Info}>
                                    <Input value={remarks} onChange={e => setRemarks(e.target.value)} className="h-10 text-xs" placeholder="Memo..." />
                                </TechLabel>
                                <Button className="w-full h-12 bg-zinc-900 text-white dark:bg-white dark:text-black font-black uppercase tracking-widest shadow-lg" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "UPDATING..." : "COMMIT CHANGES"}
                                </Button>
                                <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-zinc-400" onClick={() => router.get("/purchase-return")}>
                                    Discard Changes
                                </Button>
                            </div>
                        </Card>
                    </aside>
                </main>

                <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                    <DialogContent className="max-w-3xl bg-white dark:bg-zinc-900 p-0 overflow-hidden">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 font-black text-xl uppercase tracking-tighter">Purchase Registry</div>
                        <div className="p-4 max-h-[500px] overflow-auto space-y-2">
                            {loadingInvoices ? <div className="text-center py-10 opacity-50 font-black">SCANNING...</div> : invoices.map(inv => (
                                <button key={inv.id} className="w-full text-left p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-orange-500 transition-all flex justify-between items-center group" onClick={() => handleSelectInvoice(inv)}>
                                    <div>
                                        <div className="font-black text-lg uppercase tracking-tight">{inv.invoice}</div>
                                        <div className="text-[10px] font-mono text-zinc-400">{fmtDate(inv.date)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-orange-600">Rs {toNum(inv.remaining_amount).toLocaleString()}</div>
                                        <div className="text-[9px] font-bold opacity-40 uppercase">Outstanding</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={assignItemDialogOpen} onOpenChange={setAssignItemDialogOpen}>
                    <DialogContent className="max-w-4xl bg-white dark:bg-zinc-900 p-0 overflow-hidden">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Inventory Access</h2>
                            <Input placeholder="FILTER ITEMS..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} className="w-64 h-9 text-xs" />
                        </div>
                        <div className="max-h-[500px] overflow-auto p-4 grid grid-cols-2 gap-3">
                            {supplierItems.filter(ci => !assignSearch || ci.item?.title.toLowerCase().includes(assignSearch.toLowerCase())).map(ci => (
                                <div key={ci.id} className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedAssignIds.includes(ci.id) ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-100 dark:border-zinc-800'}`} onClick={() => {
                                    setSelectedAssignIds(prev => prev.includes(ci.id) ? prev.filter(x => x !== ci.id) : [...prev, ci.id]);
                                }}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black uppercase">{ci.item?.title}</span>
                                        <Checkbox checked={selectedAssignIds.includes(ci.id)} />
                                    </div>
                                    <div className="text-[9px] font-mono mt-2 opacity-50 uppercase tracking-widest">{ci.invoice_no} | {fmtDate(ci.date)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                            <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={() => setAssignItemDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-orange-500 text-white text-[10px] font-black uppercase" onClick={handleBulkAddItems}>Add to Protocol</Button>
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
