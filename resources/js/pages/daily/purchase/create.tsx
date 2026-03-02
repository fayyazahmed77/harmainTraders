// sales.tsx
import React, { useState, useMemo, useEffect } from "react";
import ReactSelect from "react-select";
import { router } from "@inertiajs/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { Trash2, Plus, ListRestart, RotateCcw, ChevronDown, ChevronUp, Wallet, Save, ListOrdered, CheckCircle2, Printer, ArrowRight, MoreVertical, AlertTriangle, X, Check, Eye } from "lucide-react";
import { useAppearance } from "@/hooks/use-appearance";
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { ButtonGroup } from "@/components/ui/button-group";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
/**
 * Local screenshot path (you uploaded this file).
 * The system will convert this into a URL if needed.
 */


// ───────────────────────────────────────────
// Breadcrumbs
// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: "Purchase", href: "/purchase" },
    { title: "New Invoice", href: "/purchase/create" },
];

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
    // any other fields you may have
}
interface Account {
    id: number;
    code: number;
    title: string;
    type: string;
    purchase: string;
    ats_type: string;
    ats_percentage: string;
    category: string;
    saleman_id: number;
    opening_balance: number;
    item_category: number;
    aging_days: number;
    credit_limit: number;
    account_category?: {
        id: number;
        name: string;
        percentage: string | number;
    };
}
interface RowData {
    id: number;
    item_id: number | null;
    full: number; // full cartons
    pcs: number; // single pcs
    bonus_full: number;
    bonus_pcs: number;
    rate: number;
    discPercent: number;
    trade_price: number;
    amount: number;
    last_purchase_rate?: number;
}
interface PriceUpdateInfo {
    item_id: number;
    title: string;
    old_trade_price: number;
    new_trade_price: number;
    markup_percent: number;
    markup_amount: number;
    retail_price: number;
}
interface Saleman {
    id: number;
    name?: string;
    shortname?: string;

}
interface MessageLine {
    id: number;
    messageline: string;
}
interface Option {
    value: number;
    label: string;
    code?: string;
}
interface PurchaseProps {
    items: Item[];
    accounts: Account[];
    salemans: Saleman[];
    firms: Firm[];
    nextInvoiceNo: string;
    messageLines?: MessageLine[];
}
interface Firm {
    id: number;
    name: string;
    defult: number;
}
// ───────────────────────────────────────────
// Util helpers
// ───────────────────────────────────────────
const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
};

const FieldWrapper = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
    <div className={`relative ${className}`}>
        <label className="absolute -top-2 left-3 px-2 bg-white dark:bg-[#0a0a0a] text-[11px] font-medium text-gray-600 z-10 leading-none">
            {label}
        </label>
        <div>
            {children}
        </div>
    </div>
);

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
export default function Purchase({
    items,
    accounts,
    salemans,
    firms,
    nextInvoiceNo,
    messageLines,
}: PurchaseProps) {
    const { appearance } = useAppearance();
    const isDark = appearance === "dark";
    const selectBg = isDark ? '#0a0a0a' : '#ffffff';
    const selectBorder = isDark ? '#262626' : '#e5e7eb';

    // Mobile specific states
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [showStickyFooter, setShowStickyFooter] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Success Dialog State
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successData, setSuccessData] = useState<{
        supplierName: string;
        totalItems: number;
        totalFull: number;
        totalPcs: number;
        gross: number;
        discount: number;
        net: number;
        purchaseId?: number;
    } | null>(null);

    // Price Update Confirmation Dialog State
    const [showPriceDialog, setShowPriceDialog] = useState(false);
    const [priceUpdates, setPriceUpdates] = useState<PriceUpdateInfo[]>([]);

    // Filter scroll for sticky footer visibility
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            // Scroll down: Show, Scroll up: Hide
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowStickyFooter(true);
            } else if (currentScrollY < lastScrollY) {
                setShowStickyFooter(false);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    // Header / meta fields
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [markupPercentage, setMarkupPercentage] = useState<string | number>(0);
    const [creditLimit, setCreditLimit] = useState<number | "">("");
    const [creditDays, setCreditDays] = useState<number>(0);
    const [invoiceNo, setInvoiceNo] = useState<string>(nextInvoiceNo);
    const [salesman, setSalesman] = useState<number | null>(null);
    const [cashCredit, setCashCredit] = useState<string>("CREDIT");
    const [accountType, setAccountType] = useState<Option | null>(null);
    const [courier, setCourier] = useState<number>(0);
    const [printOption, setPrintOption] = useState<"big" | "small">("big");
    const [selectedMessageId, setSelectedMessageId] = useState<string>("0");
    const [selectedFirmId, setSelectedFirmId] = useState<string>(() => {
        const defaultFirm = firms?.find(f => f.defult === 1);
        return defaultFirm ? defaultFirm.id.toString() : "";
    });
    const accountTypeOptions: Option[] = accounts.map((a) => ({
        value: a.id,
        label: a.title,
    }));

    // Check if over credit limit


    const salemanMap = React.useMemo(() => {
        const m = new Map<number, string>();
        salemans?.forEach((s) => {
            const name = s.name ?? s.shortname ?? String(s.id);
            m.set(s.id, name);
        });
        return m;
    }, [salemans]);

    const itemOptions = React.useMemo(() => {
        return items.map((it) => ({
            value: it.id,
            label: `${it.title} ${it.short_name ? `(${it.short_name})` : ""}`,
        }));
    }, [items]);

    // Start with one empty row instead of loading all items
    const getEmptyRow = (): RowData => ({
        id: Date.now() + Math.random(),
        item_id: null,
        full: 0,
        pcs: 0,
        bonus_full: 0,
        bonus_pcs: 0,
        rate: 0,
        discPercent: 0,
        trade_price: 0,
        amount: 0,
        last_purchase_rate: 0, // Store last purchase rate for warning
    });

    const [rows, setRows] = useState<RowData[]>([getEmptyRow()]);

    // Function to load all items
    const loadAllItems = () => {
        const allItemRows: RowData[] = items.map((it) => {
            const baseRate = toNumber(it.trade_price ?? it.retail ?? 0);
            const packing = toNumber(it.packing_full ?? it.packing_qty ?? 1);
            const amount = 0; // Starts at 0

            return {
                id: Date.now() + it.id + Math.random(),
                item_id: it.id,
                full: 0,
                pcs: 0,
                bonus_full: 0,
                bonus_pcs: 0,
                rate: baseRate,
                discPercent: toNumber(it.discount ?? 0),
                trade_price: toNumber(it.trade_price ?? baseRate),
                amount: amount,
            };
        });
        setRows(allItemRows);
    };

    // Function to reset to one empty row
    const resetRows = () => {
        setRows([getEmptyRow()]);
        setSelectedItemId(null);
    };

    // Track the currently selected item for displaying info
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [lastPurchaseInfo, setLastPurchaseInfo] = useState<any>(null);
    const [loadingPurchaseInfo, setLoadingPurchaseInfo] = useState(false);

    // ───────────────────────────────────────────
    // Row operations
    // ───────────────────────────────────────────
    const addRow = () => {
        setRows((prev) => [
            getEmptyRow(),
            ...prev,
        ]);
    };

    const removeRow = (id: number) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateRow = (id: number, patch: Partial<RowData>) => {
        setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
        );
    };

    // When an item selected, auto-fill its rate, trade_price, tax, disc
    const handleSelectItem = async (rowId: number, itemId: number) => {
        const selected = items.find((it) => it.id === itemId);
        if (!selected) return;

        const baseRate = toNumber(selected.trade_price ?? selected.retail ?? 0);
        const disc = toNumber(selected.discount ?? 0);
        const tradePrice = toNumber(selected.trade_price ?? baseRate);

        updateRow(rowId, { item_id: itemId, rate: baseRate, discPercent: disc, trade_price: tradePrice });

        // Set this item as the selected one to display info below
        setSelectedItemId(itemId);

        // Fetch last purchase info
        setLoadingPurchaseInfo(true);
        try {
            const response = await axios.get(`/api/purchase/last-purchase-info?item_id=${itemId}`);
            setLastPurchaseInfo(response.data);

            // Update row with last purchase rate for warning comparison
            if (response.data?.previous_retail_price) {
                updateRow(rowId, { last_purchase_rate: Number(response.data.previous_retail_price) });
            }
        } catch (error) {
            console.error('Failed to fetch last purchase info:', error);
            setLastPurchaseInfo(null);
        } finally {
            setLoadingPurchaseInfo(false);
        }
    };

    // Recalculate a row amount whenever rate/full/pcs/bonus changes
    const recalcRowAmount = (row: RowData, item?: Item) => {
        const packing = toNumber(item?.packing_full ?? item?.packing_qty ?? 1);
        const totalUnits = toNumber(row.full) * packing + toNumber(row.pcs) + toNumber(row.bonus_full) * packing + toNumber(row.bonus_pcs);
        // Here amount uses rate * normal units (excluding bonus if you want)
        // Commonly bonus is free, adjust logic if you want to exclude/add differently.
        const normalUnits = toNumber(row.full) * packing + toNumber(row.pcs);
        const amount = normalUnits * toNumber(row.rate);
        return Math.round(amount);
    };

    // Get the currently selected item details
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return items.find((it) => it.id === selectedItemId) ?? null;
    }, [selectedItemId, items]);

    // update amounts when rows change
    const rowsWithComputed = useMemo(() => {
        return rows.map((r) => {
            const item = items.find((it) => it.id === r.item_id) ?? undefined;
            const amount = recalcRowAmount(r, item);
            return { ...r, amount };
        });
    }, [rows, items]);

    // ───────────────────────────────────────────
    // Totals & Invoice summary
    // ───────────────────────────────────────────
    const totals = useMemo(() => {
        let gross = 0;
        let discTotal = 0;
        let totalFull = 0;
        let totalPcs = 0;
        let totalItems = 0;

        rowsWithComputed.forEach((r) => {
            const amount = r.amount;
            gross += amount;

            const disc = (toNumber(r.discPercent) / 100) * amount;
            discTotal += disc;

            if (r.item_id) {
                totalItems++;
                totalFull += toNumber(r.full);
                totalPcs += toNumber(r.pcs);
            }
        });

        const previousBalance = 0;
        const cashReceived = 0;

        const roundedGross = Math.round(gross);
        const roundedDisc = Math.round(discTotal);

        const net = roundedGross - roundedDisc + courier;

        return {
            gross: roundedGross,
            discTotal: roundedDisc,
            courier: courier,
            net: Math.round(net),
            previousBalance,
            cashReceived,
            totalReceivable: Math.round(net + previousBalance - cashReceived),
            totalFull,
            totalPcs,
            totalItems
        };
    }, [rowsWithComputed, items, courier]);
    // Check if over credit limit
    const isOverLimit = useMemo(() => {
        if (typeof creditLimit !== "number") return false;
        if (!totals) return false;
        return totals.net > creditLimit;
    }, [creditLimit, totals]);

    // ───────────────────────────────────────────
    // Simple renderer / layout
    // ───────────────────────────────────────────
    const submitPurchase = (updatePrices: boolean) => {
        const payload = {
            date: date ? date.toISOString().slice(0, 10) : null,
            invoice: invoiceNo,

            supplier_id: accountType?.value,
            salesman_id: salesman,
            firm_id: selectedFirmId ? Number(selectedFirmId) : null,
            no_of_items: rowsWithComputed.length,

            gross_total: totals.gross,
            discount_total: totals.discTotal,
            courier_charges: totals.courier,
            net_total: totals.net,
            paid_amount: 0,
            remaining_amount: totals.net,
            update_prices: updatePrices,
            print_format: printOption,
            message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,

            items: rowsWithComputed.map((r) => {
                const item = items.find(i => i.id === r.item_id);
                const packing = toNumber(item?.packing_full ?? item?.packing_qty ?? 1);

                const totalPCS = (r.full * packing) + r.pcs;

                return {
                    item_id: r.item_id,
                    qty_carton: r.full,
                    qty_pcs: r.pcs,
                    total_pcs: totalPCS,
                    trade_price: r.rate,
                    discount: (r.discPercent / 100) * r.amount,
                    gst_amount: 0,
                    subtotal: r.amount
                };
            })
                .filter(r => r.item_id !== null)
        };

        router.post("/purchase", payload, {
            onSuccess: (page) => {
                // Success data for the dialog
                const newProps = page.props as unknown as PurchaseProps;
                setSuccessData({
                    supplierName: accounts.find(a => a.id === accountType?.value)?.title || "N/A",
                    totalItems: totals.totalItems,
                    totalFull: totals.totalFull,
                    totalPcs: totals.totalPcs,
                    gross: totals.gross,
                    discount: totals.discTotal,
                    net: totals.net,
                    purchaseId: (page.props as any).flash?.id // Assuming ID is flashed or in props
                });

                // Reset Form
                resetRows();
                setInvoiceNo(newProps.nextInvoiceNo); // Update with new invoice number from server
                setAccountType(null);
                setSalesman(null);
                setSelectedFirmId(firms?.find(f => f.defult === 1)?.id.toString() || "");
                setCreditLimit("");
                setCreditDays(0);
                setMarkupPercentage(0);
                setCourier(0);
                setDate(new Date());
                setSelectedMessageId("0");

                setShowSuccessDialog(true);
                setShowPriceDialog(false); // Close price dialog if open
            },
            onError: (errors) => {
                console.error(errors);
                alert("Failed to save purchase. Check console for details.");
            }
        });
    };

    const handleSave = async () => {
        const updates: PriceUpdateInfo[] = [];

        rowsWithComputed.forEach(r => {
            if (!r.item_id) return;
            const item = items.find(it => it.id === r.item_id);
            if (!item) return;

            const mPercent = toNumber(markupPercentage);
            const mAmount = r.rate * (mPercent / 100);
            const newTP = r.rate + mAmount;
            const currentTP = toNumber(item.trade_price);

            // If calculated TP differs from current item TP (handle float diff)
            if (Math.abs(newTP - currentTP) > 0.01) {
                updates.push({
                    item_id: r.item_id,
                    title: item.title,
                    old_trade_price: currentTP,
                    new_trade_price: newTP,
                    markup_percent: mPercent,
                    markup_amount: mAmount,
                    retail_price: toNumber(item.retail)
                });
            }
        });

        if (updates.length > 0) {
            setPriceUpdates(updates);
            setShowPriceDialog(true);
        } else {
            submitPurchase(false);
        }
    };

    return (
        <SidebarProvider
            defaultOpen={false}
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 61)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="w-full pt-0 p-2 md:p-6 md:pt-0 flex flex-col gap-1.5 pb-20 md:pb-4">
                    {/* Mobile Header Card (Visible only on mobile) */}
                    <Card className="block md:hidden p-0 overflow-hidden border-none shadow-md bg-white dark:bg-[#0a0a0a]">
                        <div className="p-4 bg-gradient-to-r from-orange-500/10 to-transparent dark:from-orange-500/5">
                            <div className="flex justify-between items-start mb-1">
                                <div className="space-y-0.5">
                                    <h2 className="text-xl font-bold tracking-tight dark:text-gray-100 italic">PURCHASE <span className="text-orange-600 dark:text-orange-500 font-black">INVOICE</span></h2>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        {date ? date.toLocaleDateString() : "New Date"} | Inv: {invoiceNo}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMobileDetails(!showMobileDetails)}
                                    className="h-8 w-8 p-0 rounded-full border-gray-200 dark:border-gray-800"
                                >
                                    {showMobileDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </Button>
                            </div>

                            {/* Essential Main Info (Always visible on mobile) */}
                            <div className="mt-3">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Supplier Party</label>
                                <Select
                                    value={accountType?.value?.toString() ?? ""}
                                    onValueChange={(value) => {
                                        const id = Number(value);
                                        const selectedAccount = accounts.find((a) => a.id === id) ?? null;
                                        const selectedOption = accountTypeOptions.find((s) => s.value === id) ?? null;
                                        setAccountType(selectedOption);

                                        if (selectedAccount) {
                                            setCreditDays(selectedAccount.aging_days ?? 0);
                                            setCreditLimit(typeof selectedAccount.credit_limit === "number" ? selectedAccount.credit_limit : (selectedAccount.credit_limit ? Number(selectedAccount.credit_limit) : ""));
                                            const salemanId = selectedAccount.saleman_id ?? null;
                                            setSalesman(salemanId);
                                        } else {
                                            setCreditDays(0);
                                            setCreditLimit("");
                                            setSalesman(null);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full h-11 border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 text-md font-bold rounded-xl focus:ring-orange-500">
                                        <SelectValue placeholder="Tap to Select Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accountTypeOptions.map((s) => (
                                            <SelectItem key={s.value} value={s.value.toString()}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Expandable Details (Collapsible on mobile) */}
                        <div className={`${showMobileDetails ? 'max-h-[500px] opacity-100 p-4 border-t border-gray-100 dark:border-gray-900' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300 grid grid-cols-2 gap-3 bg-gray-50/50 dark:bg-black/10`}>
                            <FieldWrapper label="Supplier %" className="col-span-1">
                                <Input value={markupPercentage} readOnly className="h-9 bg-transparent border-gray-200 dark:border-gray-800 font-mono text-xs" />
                            </FieldWrapper>
                            <FieldWrapper label="Credit Days" className="col-span-1">
                                <Input value={creditDays} readOnly className="h-9 bg-transparent border-gray-200 dark:border-gray-800 font-mono text-center text-xs" />
                            </FieldWrapper>
                            <FieldWrapper label="Firm" className="col-span-2">
                                <Select value={selectedFirmId} onValueChange={setSelectedFirmId}>
                                    <SelectTrigger className="w-full h-9 bg-transparent border-gray-200 dark:border-gray-800 text-xs text-left">
                                        <SelectValue placeholder="Select Firm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {firms?.map((f) => (
                                            <SelectItem key={f.id} value={f.id.toString()}>
                                                {f.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FieldWrapper>
                        </div>
                    </Card>

                    {/* Desktop Header card (Hidden on mobile) */}
                    <Card className="hidden md:block overflow-hidden border-x-0 border-t-0 shadow-none bg-white dark:bg-[#0a0a0a]">
                        <div className="py-3 px-3 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-b border-gray-100 dark:border-gray-900 flex justify-between items-center">
                            <h2 className="text-lg font-bold tracking-tight dark:text-gray-100">PURCHASE <span className="text-orange-600 dark:text-orange-500 font-black"> INVOICE</span></h2>
                            <div className="flex items-center gap-4 text-xs font-semibold">
                                <span className="text-gray-400 uppercase tracking-widest">Entry Mode</span>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 text-orange-600 rounded-md border border-orange-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse"></div>
                                    DESKTOP VIEW
                                </div>
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-6 lg:grid-cols-12 gap-x-3 gap-y-5 items-end">
                            {/* Date & Time Picker */}
                            <FieldWrapper label="Date & Time" className="lg:col-span-3">
                                <div className="flex gap-1">
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                id="date-picker"
                                                className="w-[140px] justify-between font-normal h-10 px-2 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors"
                                            >
                                                <span className="truncate">{date ? date.toLocaleDateString() : "Date"}</span>
                                                <CalendarIcon className="h-4 w-4 shrink-0 opacity-50 text-sky-600" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                captionLayout="dropdown"
                                                onSelect={(date) => {
                                                    setDate(date);
                                                    setOpen(false);
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        id="time-picker"
                                        step="1"
                                        defaultValue={new Date().toLocaleTimeString('en-GB', { hour12: false })}
                                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors flex-1"
                                    />
                                </div>
                            </FieldWrapper>

                            {/* Account Select */}
                            <FieldWrapper label="Select Account" className="lg:col-span-2">
                                <Select
                                    value={accountType?.value?.toString() ?? ""}
                                    onValueChange={(value) => {
                                        const id = Number(value);
                                        const selectedAccount = accounts.find((a) => a.id === id) ?? null;

                                        const selectedOption = accountTypeOptions.find((s) => s.value === id) ?? null;
                                        setAccountType(selectedOption);

                                        if (selectedAccount) {
                                            setCreditDays(selectedAccount.aging_days ?? 0);
                                            setCreditLimit(typeof selectedAccount.credit_limit === "number" ? selectedAccount.credit_limit : (selectedAccount.credit_limit ? Number(selectedAccount.credit_limit) : ""));
                                            setMarkupPercentage(selectedAccount.account_category?.percentage ?? 0);
                                            const salemanId = selectedAccount.saleman_id ?? null;
                                            setSalesman(salemanId);
                                        } else {
                                            setCreditDays(0);
                                            setCreditLimit("");
                                            setMarkupPercentage(0);
                                            setSalesman(null);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors">
                                        <SelectValue placeholder="Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accountTypeOptions.map((s) => (
                                            <SelectItem key={s.value} value={s.value.toString()}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FieldWrapper>

                            <FieldWrapper label="Supplier %" className="lg:col-span-1">
                                <Input
                                    placeholder="%"
                                    value={markupPercentage}
                                    readOnly
                                    className="h-10 bg-slate-50/50 border-slate-200 text-center font-bold text-orange-600"
                                />
                            </FieldWrapper>

                            {/* Credit Days */}
                            <FieldWrapper label="Days" className="lg:col-span-1">
                                <Input
                                    placeholder="Days"
                                    value={creditDays}
                                    readOnly
                                    className="h-10 text-center font-mono border-slate-200 bg-slate-50/50"
                                />
                            </FieldWrapper>

                            {/* Invoice # */}
                            <FieldWrapper label="Bill #" className="lg:col-span-1">
                                <Input
                                    placeholder="Invoice #"
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    className="h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors text-center"
                                />
                            </FieldWrapper>

                            {/* Salesman */}
                            <FieldWrapper label="Salesman" className="lg:col-span-2">
                                <Select
                                    value={salesman?.toString() || ""}
                                    onValueChange={(val) => setSalesman(val ? Number(val) : null)}
                                >
                                    <SelectTrigger className="h-10 w-full border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors bg-background text-left">
                                        <SelectValue placeholder="Select Salesman" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salemans.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FieldWrapper>

                            {/* Items # */}
                            <FieldWrapper label="Qty" className="lg:col-span-1">
                                <Input
                                    placeholder="Qty"
                                    value={rowsWithComputed.length}
                                    readOnly
                                    className="h-10 bg-slate-50/50 font-bold border-slate-200 text-center"
                                />
                            </FieldWrapper>
                        </div>
                    </Card>


                    {/* Mobile "Add Item" Button Section */}
                    <div className="block md:hidden pb-2">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <ListOrdered className="text-orange-600" size={18} /> Items List
                            </h3>
                            <Button size="sm" onClick={addRow} className="bg-orange-600 hover:bg-orange-700 text-white h-8 shadow-sm">
                                <Plus size={16} className="mr-1" /> Add Item
                            </Button>
                        </div>
                    </div>

                    {/* Items table + right summary */}
                    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-4">
                        {/* Table area */}
                        <div className="col-span-1 2xl:col-span-9 pb-24 md:pb-32 2xl:pb-4">
                            <Card className="p-0 overflow-hidden gap-0 border-0 md:border shadow-none md:shadow-sm bg-transparent md:bg-card">
                                <div className="overflow-visible md:overflow-x-auto">
                                    <div className="w-full md:min-w-[1200px]">
                                        {/* Table Header (sticky) - Desktop Only */}
                                        <div className="hidden md:grid grid-cols-12 bg-secondary/50 backdrop-blur-sm p-2 text-xs font-semibold border-b sticky top-0 z-10">

                                            <div className="col-span-3">+ Item Selection</div>
                                            <div className="col-span-1 text-center">Full</div>
                                            <div className="col-span-1 text-center flex items-center justify-center gap-1">Pcs</div>
                                            <div className="col-span-1 text-center">B.Full</div>
                                            <div className="col-span-1 text-center">B.Pcs</div>
                                            <div className="col-span-1 text-center">Rate</div>
                                            <div className="col-span-1 text-center">Disc %</div>
                                            <div className="col-span-1 text-center">After Disc</div>
                                            <div className="col-span-1 text-right">Sub Total</div>
                                            <div className="col-span-1 text-center flex items-center justify-center">
                                                <ButtonGroup>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-7 w-7 p-1 bg-green-500 text-white hover:bg-green-600 border-green-600 cursor-pointer"
                                                        onClick={addRow}
                                                        title="Add New Row"
                                                    >
                                                        <Plus size={14} />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-7 w-7 p-1 bg-blue-500 text-white hover:bg-blue-600 border-blue-600 cursor-pointer"
                                                        onClick={loadAllItems}
                                                        title="Load All Items"
                                                    >
                                                        <ListRestart size={14} />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-7 w-7 p-1 bg-orange-500 text-white hover:bg-orange-600 border-orange-600 cursor-pointer"
                                                        onClick={resetRows}
                                                        title="Reset"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </Button>
                                                </ButtonGroup>
                                            </div>

                                        </div>

                                        {/* Rows (scrollable) */}
                                        <div className="max-h-none md:max-h-[360px] overflow-visible md:overflow-auto space-y-3 md:space-y-0 text-sm">
                                            {rowsWithComputed.map((row) => (
                                                <React.Fragment key={row.id}>
                                                    {/* Mobile Card View */}
                                                    <div
                                                        className={`block md:hidden rounded-xl border bg-card dark:bg-card shadow-sm relative overflow-hidden transition-all mb-3 border-gray-200 dark:border-gray-700 hover:shadow-md`}
                                                    >
                                                        {/* Header Row: Item Name & Delete */}
                                                        <div className="flex items-start justify-between p-3 pb-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                                            <div className="w-full pr-8">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-6 w-6 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                                                            <Wallet size={14} />
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">ITEM</span>
                                                                    </div>
                                                                </div>
                                                                <ReactSelect
                                                                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                                    styles={{
                                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                        container: (base) => ({ ...base, width: '100%' }),
                                                                        control: (base) => ({
                                                                            ...base,
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            boxShadow: 'none',
                                                                            minHeight: 'auto',
                                                                            height: 'auto',
                                                                            padding: 0,
                                                                            fontWeight: 600,
                                                                            fontSize: '0.95rem'
                                                                        }),
                                                                        valueContainer: (base) => ({ ...base, padding: 0 }),
                                                                        dropdownIndicator: (base) => ({ ...base, padding: 0, color: '#94a3b8' }),
                                                                        indicatorSeparator: () => ({ display: 'none' }),
                                                                        placeholder: (base) => ({ ...base, color: '#cbd5e1', fontWeight: 400 }),
                                                                        singleValue: (base) => ({ ...base, color: isDark ? '#e2e8f0' : '#0f172a' }),
                                                                        input: (base) => ({ ...base, color: isDark ? '#e2e8f0' : '#0f172a' }),
                                                                        menu: (base) => ({ ...base, backgroundColor: isDark ? '#1e293b' : '#ffffff' }),
                                                                        option: (base, state) => ({
                                                                            ...base,
                                                                            backgroundColor: state.isFocused ? (isDark ? '#334155' : '#f1f5f9') : 'transparent',
                                                                            color: isDark ? '#e2e8f0' : '#0f172a',
                                                                        })
                                                                    }}
                                                                    options={itemOptions.filter(opt =>
                                                                        !rows.some(r => r.item_id === opt.value && r.id !== row.id)
                                                                    )}
                                                                    value={itemOptions.find((opt) => opt.value === row.item_id) || null}
                                                                    onChange={(opt) => handleSelectItem(row.id, Number(opt?.value))}
                                                                    isDisabled={!accountType}
                                                                    placeholder={!accountType ? "Select Account First" : "Select Item..."}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                                onClick={() => removeRow(row.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>

                                                        <div className="p-3 space-y-4">
                                                            {/* Quantity Section */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-100 dark:border-gray-700">
                                                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase block mb-1 text-center">Full</label>
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 w-full bg-transparent border-none text-center font-bold text-lg p-0 focus-visible:ring-0 shadow-none"
                                                                            value={row.full || ""}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                const num = val === "" ? 0 : parseInt(val, 10) || 0;
                                                                                updateRow(row.id, { full: num });
                                                                            }}
                                                                            onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                                        />
                                                                        {row.bonus_full > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">+{row.bonus_full}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-100 dark:border-gray-700">
                                                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase block mb-1 text-center">Pieces</label>
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 w-full bg-transparent border-none text-center font-bold text-lg p-0 focus-visible:ring-0 shadow-none"
                                                                            value={row.pcs || ""}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                const num = val === "" ? 0 : parseInt(val, 10) || 0;
                                                                                updateRow(row.id, { pcs: num });
                                                                            }}
                                                                            onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                                        />
                                                                        {row.bonus_pcs > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">+{row.bonus_pcs}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Financials Section */}
                                                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                                                <div className="flex flex-col">
                                                                    <label className="text-[10px] text-gray-400 dark:text-gray-500 font-medium text-center">Rate</label>
                                                                    <Input
                                                                        className={`h-7 text-xs px-1 border-gray-200 dark:border-gray-700 text-center ${row.last_purchase_rate && row.rate > row.last_purchase_rate ? "text-red-600 font-bold border-red-200 bg-red-50" : ""}`}
                                                                        value={row.rate}
                                                                        onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })}
                                                                        onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                                    />
                                                                </div>

                                                                <div className="flex flex-col">
                                                                    <label className="text-[10px] text-gray-400 dark:text-gray-500 font-medium text-center">Disc%</label>
                                                                    <Input
                                                                        className="h-7 text-xs px-1 border-gray-200 dark:border-gray-700 text-center"
                                                                        value={row.discPercent}
                                                                        onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })}
                                                                        onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                                    />
                                                                </div>

                                                                <div className="flex flex-col items-end justify-end col-span-2">
                                                                    <label className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">SubTotal</label>
                                                                    <div className="text-base font-black text-orange-600 leading-tight">
                                                                        {row.amount.toFixed(0)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Desktop Row View (Hidden on mobile) */}
                                                    <div className="hidden md:grid grid-cols-12 gap-1 p-2 border-b items-center text-sm">


                                                        <div className="col-span-3 flex items-center justify-center">

                                                            <ReactSelect
                                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                                styles={{
                                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                    container: (base) => ({ ...base, width: '100%' }),
                                                                    control: (base) => ({
                                                                        ...base,
                                                                        backgroundColor: 'transparent',
                                                                        borderColor: 'var(--border)',
                                                                        color: 'inherit',
                                                                        minHeight: '2rem',
                                                                        height: '2rem',
                                                                        '&:hover': {
                                                                            borderColor: 'var(--input)'
                                                                        }
                                                                    }),
                                                                    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                                                                    dropdownIndicator: (base) => ({ ...base, padding: '4px' }),
                                                                    indicatorSeparator: () => ({ display: 'none' }),
                                                                    menu: (base) => ({
                                                                        ...base,
                                                                        backgroundColor: selectBg,
                                                                        border: `1px solid ${selectBorder}`,
                                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                                                        zIndex: 9999,
                                                                    }),
                                                                    menuList: (base) => ({
                                                                        ...base,
                                                                        backgroundColor: selectBg,
                                                                        padding: 0,
                                                                    }),
                                                                    option: (base, state) => ({
                                                                        ...base,
                                                                        backgroundColor: state.isSelected
                                                                            ? 'var(--primary)'
                                                                            : state.isFocused
                                                                                ? 'var(--accent)'
                                                                                : selectBg,
                                                                        color: state.isSelected
                                                                            ? 'var(--primary-foreground)'
                                                                            : 'inherit',
                                                                        fontSize: '0.875rem',
                                                                        cursor: 'pointer'
                                                                    }),
                                                                    singleValue: (base) => ({
                                                                        ...base,
                                                                        color: 'inherit',
                                                                    }),
                                                                    input: (base) => ({
                                                                        ...base,
                                                                        color: 'inherit',
                                                                    }),
                                                                }}
                                                                options={itemOptions.filter(opt => !rows.some(r => r.item_id === opt.value && r.id !== row.id))} isDisabled={!accountType}
                                                                value={itemOptions.find((opt) => opt.value === row.item_id) || null}
                                                                onChange={(opt) => handleSelectItem(row.id, Number(opt?.value))}
                                                                placeholder={!accountType ? "Select Account First" : "Select item"}
                                                                isClearable
                                                            />
                                                        </div>

                                                        <div className="col-span-1">
                                                            <Input
                                                                className="h-8 px-1 text-center"
                                                                value={row.full}
                                                                onChange={(e) => updateRow(row.id, { full: toNumber(e.target.value) })}
                                                                onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                            />
                                                        </div>

                                                        <div className="col-span-1">
                                                            <Input
                                                                className="h-8 px-1 text-center"
                                                                value={row.pcs}
                                                                onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })}
                                                                onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                            />
                                                        </div>


                                                        <div className="col-span-1">
                                                            <Input
                                                                className="h-8 px-1 text-center border-orange-200 bg-orange-50/10"
                                                                value={row.bonus_full}
                                                                onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })}
                                                                onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                                placeholder="B.Full"
                                                            />
                                                        </div>

                                                        <div className="col-span-1">
                                                            <Input
                                                                className="h-8 px-1 text-center border-orange-200 bg-orange-50/10"
                                                                value={row.bonus_pcs}
                                                                onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })}
                                                                onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                                placeholder="B.Pcs"
                                                            />
                                                        </div>
                                                        <div className="col-span-1 relative">
                                                            <Input
                                                                className={`h-8 px-1 text-center ${(row.last_purchase_rate ?? 0) > 0 && row.rate > (row.last_purchase_rate ?? 0) ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : ""}`}
                                                                value={row.rate}
                                                                onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })}
                                                                onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                            />
                                                            {(row.last_purchase_rate ?? 0) > 0 && row.rate > (row.last_purchase_rate ?? 0) && (
                                                                <div className="absolute -top-8 left-0 z-50 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                                                    High Rate! Last: {row.last_purchase_rate}
                                                                    <div className="absolute top-full left-4 border-4 border-transparent border-t-red-600"></div>
                                                                </div>
                                                            )}
                                                        </div>


                                                        <div className="col-span-1">
                                                            <Input
                                                                className="h-8 px-1 text-center"
                                                                value={row.discPercent}
                                                                onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })}
                                                                onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                            />
                                                        </div>

                                                        <div className="col-span-1">
                                                            <Input
                                                                className="h-8 px-1 text-center bg-secondary/20"
                                                                value={(row.rate * (1 - row.discPercent / 100)).toFixed(2)}
                                                                readOnly
                                                                onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                            />
                                                        </div>
                                                        <div className="col-span-1">
                                                            <Input
                                                                className="h-8 px-1 text-right font-bold text-orange-600 bg-orange-50/10"
                                                                value={(row.amount - (row.amount * row.discPercent / 100)).toFixed(2)}
                                                                readOnly
                                                                onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                            />
                                                        </div>


                                                        <div className="col-span-1 flex items-center gap-1 justify-center">

                                                            <Button variant="outline" size="icon" className="h-8 w-8 p-1 bg-red-500 rounded-sm  text-white hover:bg-red-300" onClick={() => removeRow(row.id)}>
                                                                <Trash2 />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        {/* Footer summary for table (quick totals) */}
                                        <div className="p-3 border-t grid grid-cols-4 gap-4 bg-secondary/20">
                                            <div>
                                                <div className="text-xs text-muted-foreground">Rows</div>
                                                <div className="text-lg font-semibold">{rowsWithComputed.length}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">Gross</div>
                                                <div className="text-lg font-semibold text-green-700">{totals.gross.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">Discount</div>
                                                <div className="text-lg font-semibold text-red-500">{totals.discTotal.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Bottom fields / stock & supplier info */}
                            <div className="mt-1 md:mt-2">
                                {/* Mobile Toggle Button for Item Info */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full md:hidden mb-0.5 border-gray-700 dark:border-gray-800 dark:bg-gray-950 text-orange-500 dark:text-orange-400 hover:bg-gray-800 py-1 h-auto text-[11px]"
                                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                                >
                                    {showInfoPanel ? (
                                        <>Hide Info <ChevronUp className="ml-2 h-3 w-3" /></>
                                    ) : (
                                        <>View Info <ChevronDown className="ml-2 h-3 w-3" /></>
                                    )}
                                </Button>

                                <div className={`${showInfoPanel ? 'block' : 'hidden'} md:block animate-in slide-in-from-bottom-2`}>
                                    <Card className="border dark:border-gray-800 dark:bg-gray-950 shadow-sm relative overflow-hidden bg-white/50 backdrop-blur-sm p-0">
                                        {selectedItem ? (
                                            <div className="p-0 flex flex-col">
                                                {/* Item Header Bar - Compact */}
                                                <div className="px-3 py-1 bg-gradient-to-r from-orange-600/5 to-transparent border-b border-border flex flex-wrap items-center justify-between gap-1">
                                                    <div className="flex items-center gap-2 py-2">
                                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                                        <h3 className="text-xs font-bold tracking-tight flex items-center gap-2">
                                                            {selectedItem.title}
                                                            {selectedItem.short_name && (
                                                                <span className="text-[10px] font-medium text-muted-foreground bg-secondary/50 px-1 py-0.5 rounded leading-none">
                                                                    {selectedItem.short_name}
                                                                </span>
                                                            )}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">Company:</span>
                                                        <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                                                            {selectedItem.company || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Metrics Grid - More Compact */}
                                                <div className="p-1 sm:p-1.5 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2 text-orange-600 dark:text-orange-400">
                                                    {/* Packing */}
                                                    <div className="flex flex-col border-r border-border/50 px-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Packing</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-base font-black text-gray-700 dark:text-gray-200">{toNumber(selectedItem.packing_full || selectedItem.packing_qty)}</span>
                                                            <span className="text-[9px] text-muted-foreground font-medium">pc/box</span>
                                                        </div>
                                                    </div>

                                                    {/* Stock Full */}
                                                    <div className="flex flex-col border-r border-border/50 px-1">
                                                        <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-tighter">Stock Full</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-base font-black">
                                                                {Math.floor(toNumber(selectedItem.stock_1) / (toNumber(selectedItem.packing_qty) || 1))}
                                                            </span>
                                                            <span className="text-[9px] text-muted-foreground font-medium">full</span>
                                                        </div>
                                                    </div>

                                                    {/* Stock Pcs */}
                                                    <div className="flex flex-col border-r border-border/50 px-1">
                                                        <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-tighter">Stock Pcs</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-base font-black">
                                                                {toNumber(selectedItem.stock_1) % (toNumber(selectedItem.packing_qty) || 1)}
                                                            </span>
                                                            <span className="text-[9px] text-muted-foreground font-medium">pcs</span>
                                                        </div>
                                                    </div>

                                                    {/* Total Stock - Professional Visual */}
                                                    <div className="flex flex-col border-r border-border/50 px-1">
                                                        <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-tighter">Total Stock</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-base font-black">{toNumber(selectedItem.stock_1)}</span>
                                                            <span className="text-[9px] text-muted-foreground font-medium">pcs</span>
                                                        </div>
                                                    </div>

                                                    {/* Trade Price */}
                                                    <div className="flex flex-col border-r border-border/50 px-1">
                                                        <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-tighter">Trade @</span>
                                                        <div className="flex items-baseline gap-0.5">
                                                            <span className="text-[10px] font-bold text-orange-600/60">Rs</span>
                                                            <span className="text-base font-black">{toNumber(selectedItem.trade_price).toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Retail Price */}
                                                    <div className="flex flex-col border-r border-border/50 px-1">
                                                        <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-tighter">Retail @</span>
                                                        <div className="flex items-baseline gap-0.5">
                                                            <span className="text-[10px] font-bold text-orange-600/60">Rs</span>
                                                            <span className="text-base font-black">{toNumber(selectedItem.retail).toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Average Price */}
                                                    <div className="flex flex-col px-1">
                                                        <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-tighter">Average</span>
                                                        <div className="flex items-baseline gap-0.5">
                                                            <span className="text-[10px] font-bold text-orange-600/60">Rs</span>
                                                            <span className="text-base font-black">{((toNumber(selectedItem.trade_price) + toNumber(selectedItem.retail)) / 2).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Horizontal History Row - Elegant & Subtle */}
                                                {(lastPurchaseInfo || loadingPurchaseInfo) && (
                                                    <div className="px-4 py-2 bg-secondary/30 border-t border-border flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">History</span>
                                                        </div>

                                                        <div className="flex-1 flex flex-wrap items-center justify-start md:justify-around gap-x-4 gap-y-1 text-[10px] sm:text-[11px]">
                                                            {loadingPurchaseInfo ? (
                                                                <div className="w-full flex justify-around animate-pulse">
                                                                    {[1, 2, 3].map(i => <div key={i} className="h-4 w-16 bg-muted rounded"></div>)}
                                                                </div>
                                                            ) : lastPurchaseInfo ? (
                                                                <>
                                                                    <div className="flex gap-1.5 whitespace-nowrap">
                                                                        <span className="text-muted-foreground font-medium">Prev Qty:</span>
                                                                        <span className="font-bold">{toNumber(lastPurchaseInfo.previous_qty_carton)}F / {toNumber(lastPurchaseInfo.previous_qty_pcs)}P</span>
                                                                    </div>
                                                                    <div className="hidden md:block h-3 w-[1px] bg-border mx-1"></div>
                                                                    <div className="flex gap-1.5 whitespace-nowrap">
                                                                        <span className="text-muted-foreground font-medium">Last Price:</span>
                                                                        <span className="font-bold text-orange-600">Rs {toNumber(lastPurchaseInfo.previous_retail_price).toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="hidden md:block h-3 w-[1px] bg-border mx-1"></div>
                                                                    <div className="flex gap-1.5 whitespace-nowrap">
                                                                        <span className="text-muted-foreground font-medium">Last Date:</span>
                                                                        <span className="font-bold underline decoration-dotted decoration-orange-300">
                                                                            {lastPurchaseInfo.last_purchase_date ? new Date(lastPurchaseInfo.last_purchase_date).toLocaleDateString() : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground/60 italic">No previous history available</span>
                                                            )}
                                                        </div>

                                                        {lastPurchaseInfo?.company && (
                                                            <div className="shrink-0 flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded text-[10px]">
                                                                <span className="text-muted-foreground">Comp:</span>
                                                                <span className="font-bold truncate max-w-[80px]">{lastPurchaseInfo.company}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 flex flex-col items-center gap-2">
                                                <div className="p-2 rounded-full bg-secondary/50">
                                                    <ListOrdered className="w-5 h-5 text-muted-foreground/50" />
                                                </div>
                                                <div className="text-muted-foreground text-sm font-medium italic">
                                                    Select an item above to view real-time metrics & history
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            </div>
                        </div>

                        {/* Right summary panel - Visible ONLY on Large Desktop (2xl+) */}
                        <div className="hidden 2xl:block 2xl:col-span-3">
                            <Card className="p-4 space-y-3 sticky top-[120px] gap-0">



                                <div className="pt-2">
                                    <div className="text-xs font-semibold">Gross Amount</div>
                                    <div className="text-xl font-bold">{totals.gross.toFixed(2)}</div>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Courier Charges</div>
                                    <Input
                                        placeholder="0.00"
                                        value={courier}
                                        onChange={(e) => setCourier(toNumber(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Net Amount</div>
                                    <div className="text-xl font-bold">{totals.net.toFixed(2)}</div>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Print Option</div>
                                    <Select value={printOption} onValueChange={(v) => setPrintOption(v as "big" | "small")}>
                                        <SelectTrigger className="w-full h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="big">Print (A4)</SelectItem>
                                            <SelectItem value="small">Print (Thermal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold uppercase text-sky-600 dark:text-sky-400 mb-1">Select Message Line</div>
                                    <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                                        <SelectTrigger className="w-full h-9 border-sky-200 dark:border-sky-900/50 bg-sky-50/30 dark:bg-sky-950/20">
                                            <SelectValue placeholder="No Message Line" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">No Message Line (Optional)</SelectItem>
                                            {messageLines?.map((msg) => (
                                                <SelectItem key={msg.id} value={msg.id.toString()}>
                                                    {msg.messageline}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold uppercase text-sky-600 dark:text-sky-400 mb-1">Firm</div>
                                    <Select value={selectedFirmId} onValueChange={setSelectedFirmId}>
                                        <SelectTrigger className="w-full h-9 border-sky-200 dark:border-sky-900/50 bg-sky-50/30 dark:bg-sky-950/20">
                                            <SelectValue placeholder="Select Firm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {firms?.map((f) => (
                                                <SelectItem key={f.id} value={f.id.toString()}>
                                                    {f.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div>
                                    <div className="text-xs font-semibold">Total Receivable</div>
                                    <div className="text-xl font-bold">{totals.totalReceivable}</div>
                                </div>

                                <div className="hidden md:flex gap-2 mt-2">
                                    <Button onClick={handleSave}>Save</Button>
                                    <Button variant="outline" onClick={() => alert("Cancel")}>Cancel</Button>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Laptop Sticky Footer (Visible on md and lg, hidden on mobile and 2xl desktop) */}
                    <div className="hidden md:flex 2xl:hidden sticky bottom-0 -mx-2 md:-mx-6 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-t border-border p-3 px-8 z-40 items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300">
                        <div className="flex gap-8 items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gross Amount</span>
                                <div className="text-base font-bold text-foreground">Rs {totals.gross.toFixed(2)}</div>
                            </div>

                            <div className="flex flex-col w-28">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Courier</span>
                                <Input
                                    className="h-8 bg-secondary/30 border-orange-200/50 focus:border-orange-500 font-bold"
                                    value={courier}
                                    onChange={(e) => setCourier(toNumber(e.target.value))}
                                />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Net Total</span>
                                <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                                    <span className="text-sm font-bold mr-1 italic">Rs</span>
                                    {totals.net.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex flex-col w-40">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Print Option</span>
                                <Select value={printOption} onValueChange={(v) => setPrintOption(v as "big" | "small")}>
                                    <SelectTrigger className="h-8 bg-secondary/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="big">A4 Paper</SelectItem>
                                        <SelectItem value="small">Thermal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 px-8 shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                                    <Save className="mr-2 h-4 w-4" /> Save Invoice
                                </Button>
                                <Button variant="outline" className="h-10 border-gray-300" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Sticky Footer */}
                    <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/60 dark:border-gray-700/60 p-4 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] transition-transform duration-300 ${showStickyFooter ? 'translate-y-0' : 'translate-y-full'}`}>
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex flex-col">
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-0.5">Net Total</div>
                                <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                                    <span className="text-sm font-semibold mr-1">Rs</span>
                                    {Math.round(totals.net).toFixed(2)}
                                </div>
                            </div>
                            <Button onClick={handleSave} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/50 rounded-xl font-bold transition-all active:scale-95">
                                <Save className="mr-2" size={18} /> Save Invoice
                            </Button>
                        </div>

                        {/* Mini Details */}
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold">Gross</span>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{totals.gross.toFixed(0)}</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-800">
                                <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold">Disc</span>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{totals.discTotal.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Update Confirmation Dialog */}
                <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                    <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-white dark:bg-gray-950 shadow-2xl rounded-2xl">
                        <div className="bg-orange-600 dark:bg-orange-500 p-6 flex flex-col items-center text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                                <AlertTriangle size={100} />
                            </div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 shadow-inner">
                                <AlertTriangle size={32} className="text-white" />
                            </div>
                            <DialogTitle className="text-xl font-black tracking-tight text-white mb-1 px-4 text-center leading-tight uppercase">Update Item Trade Prices?</DialogTitle>
                            <p className="text-orange-50/80 text-xs font-medium text-center max-w-[80%]">Detected price changes based on new purchase rate and supplier markup. Update items table?</p>
                        </div>

                        <div className="p-0 max-h-[400px] overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-10">
                                    <tr className="text-[10px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400">
                                        <th className="py-3 px-4">Item Description</th>
                                        <th className="py-3 px-2 text-center">Prev Trade</th>
                                        <th className="py-3 px-2 text-center">Markup (%)</th>
                                        <th className="py-3 px-2 text-center">New Trade</th>
                                        <th className="py-3 px-2 text-center">Retail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                                    {priceUpdates.map((upd, idx) => (
                                        <tr key={idx} className="hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">{upd.title}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">ID: #{upd.item_id}</div>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span className="text-xs font-semibold text-gray-500 line-through">Rs {upd.old_trade_price.toFixed(2)}</span>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{upd.markup_percent}%</span>
                                                    <span className="text-[9px] text-gray-400">+{upd.markup_amount.toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <div className="inline-flex items-center gap-1.5 justify-center bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
                                                    <span className="text-xs font-black text-orange-700 dark:text-orange-300">Rs {upd.new_trade_price.toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-center font-bold text-xs text-slate-600 dark:text-slate-400">
                                                Rs {upd.retail_price.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    className="w-full h-12 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group shadow-sm"
                                    onClick={() => submitPurchase(false)}
                                >
                                    <X size={18} className="group-hover:rotate-90 transition-transform" /> No, Only Store Bill
                                </Button>
                                <Button
                                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                    onClick={() => submitPurchase(true)}
                                >
                                    <Check size={18} className="animate-bounce-short" /> Yes, Update Prices
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Summary Dialog */}
                <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                    <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-white dark:bg-gray-950 shadow-2xl rounded-2xl">
                        <div className="bg-emerald-600 dark:bg-emerald-500 p-8 flex flex-col items-center text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <CheckCircle2 size={120} />
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <CheckCircle2 size={40} className="text-white" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white mb-1 px-4 text-center leading-tight">Purchase Created Successfully!</DialogTitle>
                            <p className="text-emerald-50/80 text-sm font-medium">Invoice record saved with ID: {successData?.purchaseId}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {successData && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Supplier</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{successData.supplierName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Invoice Amount</p>
                                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Rs {successData.net.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Items</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{successData.totalItems}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">FULL</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{successData.totalFull}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">PCS</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{successData.totalPcs}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center px-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30">
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">Total Discount</span>
                                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">Rs {successData.discount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        className="h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg shadow-gray-200 dark:shadow-gray-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        onClick={() => {
                                            if (successData?.purchaseId) {
                                                const url = `/purchase/${successData.purchaseId}/pdf?format=small`;
                                                window.open(url, '_blank');
                                            }
                                        }}
                                    >
                                        <Printer size={18} className="mr-2" /> Thermal Print
                                    </Button>
                                    <Button
                                        className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        onClick={() => {
                                            if (successData?.purchaseId) {
                                                const url = `/purchase/${successData.purchaseId}/pdf?format=big`;
                                                window.open(url, '_blank');
                                            }
                                        }}
                                    >
                                        <Printer size={18} className="mr-2" /> A4 Print
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-12 border-gray-200 dark:border-gray-800 font-bold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                                        onClick={() => {
                                            if (successData?.purchaseId) {
                                                router.get(`/purchase/${successData.purchaseId}/view`);
                                            }
                                        }}
                                    >
                                        <Eye size={18} className="mr-2" /> View Invoice
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-12 border-orange-200 dark:border-orange-900/30 font-bold rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                                        onClick={() => setShowSuccessDialog(false)}
                                    >
                                        <Plus size={18} className="mr-2" /> Create New
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </SidebarInset >
        </SidebarProvider >
    );
}
