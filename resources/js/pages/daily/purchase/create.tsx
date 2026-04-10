import React, { useState, useMemo, useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import { router } from "@inertiajs/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { Trash2, Plus, ListRestart, RotateCcw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Wallet, Save, ListOrdered, CheckCircle2, Printer, ArrowRight, MoreVertical, AlertTriangle, X, Check, Eye, Search, Box, PackageSearch, Receipt, TrendingDown } from "lucide-react";
import { ItemSelectionDialog } from "./components/ItemSelectionDialog";
import { PriceUpdateDialog } from "./components/PriceUpdateDialog";
import { SuccessSummaryDialog } from "./components/SuccessSummaryDialog";
import { PurchasePaymentDialog } from "./components/PurchasePaymentDialog";
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
    DialogDescription,
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
import { cn } from "@/lib/utils";
/**
 * Local screenshot path (you uploaded this file).
 * The system will convert this into a URL if needed.
 */


// ───────────────────────────────────────────
// Breadcrumbs
// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: "Purchase", href: "/purchase" },
    { title: "New Purchase", href: "/purchase/create" },
];

const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600";

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
    total_stock_pcs?: number;
    category?: string;
    last_purchase_rate?: number;
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
    current_balance?: number | string;
    account_type?: {
        id: number;
        name: string;
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
interface SplitPayment {
    [key: string]: any;
    id: number | string;
    payment_account_id: string;
    amount: number;
    payment_method: string;
    cheque_no?: string;
    cheque_date?: string;
    clear_date?: string;
    voucher_no?: string;
}

interface PurchaseProps {
    items: Item[];
    accounts: Account[];
    salemans: Saleman[];
    firms: Firm[];
    nextInvoiceNo: string;
    paymentAccounts: Account[];
    messageLines?: MessageLine[];
    customerCheques?: any[];
    availableCheques?: any[];
}
interface Firm {
    id: number;
    name: string;
    defult: number;
}
interface Option {
    value: string;
    label: string;
}

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
    paymentAccounts,
    messageLines,
    customerCheques = [],
    availableCheques = []
}: PurchaseProps) {
    const { appearance } = useAppearance();
    const isDark = appearance === "dark";
    const selectBg = isDark ? '#0a0a0a' : '#ffffff';
    const selectBorder = isDark ? '#262626' : '#e5e7eb';

    // Mobile specific states
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
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

    // Item Selection Dialog State
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [itemSearch, setItemSearch] = useState("");
    const [activeRowId, setActiveRowId] = useState<number | null>(null);

    // Pay Now / Settlement States
    const [isPayNow, setIsPayNow] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentSplits, setPaymentSplits] = useState<SplitPayment[]>([]);
    const [updatePricesAfterPayment, setUpdatePricesAfterPayment] = useState(false);

    const handlePostPriceUpdate = (update: boolean) => {
        setUpdatePricesAfterPayment(update);
        setShowPriceDialog(false);
        if (isPayNow) {
            if (paymentSplits.length === 0) addPaymentSplit();
            setShowPaymentDialog(true);
        } else {
            submitPurchase(update);
        }
    };

    const addPaymentSplit = () => {
        setPaymentSplits((prev) => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                payment_account_id: "",
                amount: 0,
                payment_method: "Cash",
            },
        ]);
    };

    const removePaymentSplit = (id: number | string) => {
        setPaymentSplits((prev) => prev.filter((s) => s.id !== id));
    };

    const updatePaymentSplit = (id: number | string, field: string, value: any) => {
        setPaymentSplits((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    // Sidebar & UI Toggles
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    // Keyboard shortcut for Registry (F2)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "F2") {
                e.preventDefault();
                setItemDialogOpen(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

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

    const [advanceAvailable, setAdvanceAvailable] = useState<number>(0);
    const [useAdvance, setUseAdvance] = useState<boolean>(true);
    const accountTypeOptions: Option[] = useMemo(() => {
        return accounts.map((a) => ({
            value: String(a.id),
            label: `${a.title}${a.code ? ` (${a.code})` : ""}`,
        }));
    }, [accounts]);

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

    const filteredItems = React.useMemo(() => {
        const q = itemSearch.toLowerCase();

        // Filter logic
        const filtered = items.filter((it) =>
            it.title.toLowerCase().includes(q) ||
            (it.short_name?.toLowerCase().includes(q)) ||
            (it.company?.toLowerCase().includes(q)) ||
            (it.category?.toLowerCase().includes(q)) ||
            String(it.id).includes(q)
        );

        // Sort logic: Prioritize startsWidth matches, then alphabetical
        return filtered.sort((a, b) => {
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();

            const aStarts = aTitle.startsWith(q);
            const bStarts = bTitle.startsWith(q);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            return aTitle.localeCompare(bTitle);
        });
    }, [items, itemSearch]);

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

    const handleProductFocus = (itemId: number) => {
        if (selectedItemId === itemId) return;
        
        setSelectedItemId(itemId);
        setLoadingPurchaseInfo(true);
        axios.get(`/api/purchase/last-purchase-info?item_id=${itemId}`)
            .then(res => setLastPurchaseInfo(res.data))
            .catch(err => {
                console.error(err);
                setLastPurchaseInfo(null);
            })
            .finally(() => setLoadingPurchaseInfo(false));
    };

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

        // Initial update with base rate
        updateRow(rowId, { item_id: itemId, rate: baseRate, discPercent: disc, trade_price: tradePrice });

        // Set this item as the selected one to display info below
        setSelectedItemId(itemId);

        // Fetch last purchase info
        setLoadingPurchaseInfo(true);
        try {
            const response = await axios.get(`/api/purchase/last-purchase-info?item_id=${itemId}`);
            setLastPurchaseInfo(response.data);

            // Update row with last purchase rate as the default rate if available
            if (response.data?.previous_retail_price) {
                const lastPrice = toNumber(response.data.previous_retail_price);
                if (lastPrice > 0) {
                    updateRow(rowId, {
                        rate: lastPrice,
                        last_purchase_rate: lastPrice
                    });
                }
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
        const packing = Math.max(1, toNumber(item?.packing_full || item?.packing_qty || 1));
        const rate = toNumber(row.rate);
        const pcPrice = Math.ceil(rate / packing);

        // Amount = (Full Items * Full Rate) + (PCS * PC Price)
        const amount = (toNumber(row.full) * rate) + (toNumber(row.pcs) * pcPrice);
        return isFinite(amount) ? Math.round(amount) : 0;
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

        const net = Math.round(roundedGross - roundedDisc + courier);

        // Advance Logic:
        // In this system, a negative balance for a supplier means they owe us (Advance).
        // e.g. -103,768 means we have 103,768 in advance.
        const absAdvance = Math.max(0, -advanceAvailable);
        const appliedAdvance = useAdvance ? Math.min(net, absAdvance) : 0;
        const netSettlement = Math.max(0, net - appliedAdvance);

        return {
            gross: roundedGross,
            discTotal: roundedDisc,
            courier: courier,
            net: net,
            appliedAdvance,
            netSettlement,
            previousBalance,
            cashReceived,
            totalReceivable: Math.round(net + previousBalance - cashReceived),
            totalFull,
            totalPcs,
            totalItems
        };
    }, [rowsWithComputed, items, courier, advanceAvailable, useAdvance]);
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
            paid_amount: (isPayNow ? paymentSplits.reduce((acc, s) => acc + toNumber(s.amount), 0) : 0),
            remaining_amount: totals.netSettlement - (isPayNow ? paymentSplits.reduce((acc, s) => acc + toNumber(s.amount), 0) : 0),
            applied_advance: totals.appliedAdvance,
            update_prices: updatePrices,
            print_format: printOption,
            message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,

            // Payment Data
            is_pay_now: isPayNow,
            is_multi: true,
            splits: isPayNow ? paymentSplits : [],

            items: rowsWithComputed.filter(r => r.item_id !== null).map((r) => {
                const item = items.find(i => i.id === r.item_id);
                const packing = toNumber(item?.packing_full || item?.packing_qty || 1);

                const totalPCS = ((toNumber(r.full) + toNumber(r.bonus_full || 0)) * packing) + toNumber(r.pcs) + toNumber(r.bonus_pcs || 0);

                return {
                    item_id: r.item_id,
                    qty_carton: toNumber(r.full),
                    qty_pcs: toNumber(r.pcs),
                    total_pcs: totalPCS,
                    trade_price: r.rate,
                    discount: (r.discPercent / 100) * r.amount,
                    gst_amount: 0,
                    subtotal: r.amount
                };
            })
        };

        router.post("/purchase", payload, {
            onSuccess: (page) => {
                // Success data for the dialog
                const newProps = page.props as unknown as PurchaseProps;
                setSuccessData({
                    supplierName: accounts.find(a => a.id === Number(accountType?.value))?.title || "N/A",
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
                
                // Reset Payment
                setIsPayNow(false);
                setPaymentSplits([]);
                setShowPaymentDialog(false);

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
            // Check if Pay Now is enabled but no splits
            if (isPayNow) {
                if (paymentSplits.length === 0) {
                    addPaymentSplit(); // Add one default
                }
                setShowPaymentDialog(true);
            } else {
                submitPurchase(false);
            }
        }
    };
console.log(lastPurchaseInfo);
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
                                    <h2 className="text-xl font-bold tracking-tight dark:text-gray-100 italic">NEW <span className="text-orange-600 dark:text-orange-500 font-black">PURCHASE</span></h2>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        {date ? date.toLocaleDateString() : "New Date"} | Bill: {invoiceNo}
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
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Select Supplier</label>
                                <Combobox
                                    options={accountTypeOptions}
                                    value={accountType?.value || ""}
                                    onChange={(value) => {
                                        const id = Number(value);
                                        const selectedAccount = accounts.find((a) => a.id === id) ?? null;
                                        const selectedOption = accountTypeOptions.find((s) => s.value === value) ?? null;
                                        setAccountType(selectedOption);

                                            if (selectedAccount) {
                                                setCreditDays(selectedAccount.aging_days ?? 0);
                                                setCreditLimit(typeof selectedAccount.credit_limit === "number" ? selectedAccount.credit_limit : (selectedAccount.credit_limit ? Number(selectedAccount.credit_limit) : ""));
                                                const salemanId = selectedAccount.saleman_id ?? null;
                                                setSalesman(salemanId);
                                                
                                                // Set Advance
                                                const balance = toNumber(selectedAccount.current_balance);
                                                setAdvanceAvailable(balance);
                                                setUseAdvance(balance < 0);
                                            } else {
                                                setCreditDays(0);
                                                setCreditLimit("");
                                                setSalesman(null);
                                                setAdvanceAvailable(0);
                                                setUseAdvance(false);
                                            }
                                    }}
                                    placeholder="Select Supplier..."
                                    searchPlaceholder="Search by name or code..."
                                    className="w-full bg-white/50 dark:bg-black/20 text-md font-bold rounded-xl h-11 border-gray-200 dark:border-gray-800"
                                />
                            </div>
                        </div>

                        {/* Expandable Details (Collapsible on mobile) */}
                        <div className={`${showMobileDetails ? 'max-h-[500px] opacity-100 p-4 border-t border-gray-100 dark:border-gray-900' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300 grid grid-cols-2 gap-3 bg-gray-50/50 dark:bg-black/10`}>
                            <FieldWrapper label="Disc %" className="col-span-1">
                                <Input value={markupPercentage} readOnly className="h-9 bg-transparent border-gray-200 dark:border-gray-800 font-mono text-xs" />
                            </FieldWrapper>
                            <FieldWrapper label="Payment Days" className="col-span-1">
                                <Input value={creditDays} readOnly className="h-9 bg-transparent border-gray-200 dark:border-gray-800 font-mono text-center text-xs" />
                            </FieldWrapper>
                            <FieldWrapper label="Company" className="col-span-2">
                                <Select value={selectedFirmId} onValueChange={setSelectedFirmId}>
                                    <SelectTrigger className="w-full h-9 bg-transparent border-gray-200 dark:border-gray-800 text-xs text-left">
                                        <SelectValue placeholder="Select Company" />
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
                    <Card className="hidden md:block overflow-hidden border-x-0 mt-3 border-t-0 shadow-none bg-white dark:bg-[#0a0a0a]">
                       

                        <div className="p-4 grid grid-cols-6  lg:grid-cols-12 gap-x-3 gap-y-5 items-end">
                            {/* Date & Time Picker */}
                            <FieldWrapper label="Purchase Date" className="lg:col-span-3">
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
                            <FieldWrapper label="Select Supplier" className="lg:col-span-2">
                                <Combobox
                                    options={accountTypeOptions}
                                    value={accountType?.value || ""}
                                    onChange={(value) => {
                                        const id = Number(value);
                                        const selectedAccount = accounts.find((a) => a.id === id) ?? null;

                                        const selectedOption = accountTypeOptions.find((s) => s.value === value) ?? null;
                                        setAccountType(selectedOption);

                                        if (selectedAccount) {
                                            setCreditDays(selectedAccount.aging_days ?? 0);
                                            setCreditLimit(typeof selectedAccount.credit_limit === "number" ? selectedAccount.credit_limit : (selectedAccount.credit_limit ? Number(selectedAccount.credit_limit) : ""));
                                            setMarkupPercentage(selectedAccount.account_category?.percentage ?? 0);
                                            const salemanId = selectedAccount.saleman_id ?? null;
                                            setSalesman(salemanId);
                                            
                                            // Set Advance
                                            const balance = toNumber(selectedAccount.current_balance);
                                            setAdvanceAvailable(balance);
                                            setUseAdvance(balance < 0);
                                        } else {
                                            setCreditDays(0);
                                            setCreditLimit("");
                                            setMarkupPercentage(0);
                                            setSalesman(null);
                                            setAdvanceAvailable(0);
                                            setUseAdvance(false);
                                        }
                                    }}
                                    placeholder="Supplier"
                                    searchPlaceholder="Search by name or code..."
                                    className="w-full h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors bg-white dark:bg-zinc-900"
                                />
                            </FieldWrapper>

                            <FieldWrapper label="Disc %" className="lg:col-span-1">
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
                            <FieldWrapper label="Bill No" className="lg:col-span-1">
                                <Input
                                    placeholder="Bill No"
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    className="h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors text-center"
                                />
                            </FieldWrapper>

                            {/* Salesman */}
                            <FieldWrapper label="Employee / Contact" className="lg:col-span-2">
                                <Select
                                    value={salesman?.toString() || ""}
                                    onValueChange={(val) => setSalesman(val ? Number(val) : null)}
                                >
                                    <SelectTrigger className="h-10 w-full border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors bg-background text-left">
                                        <SelectValue placeholder="Select Employee" />
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
                            <FieldWrapper label="Items" className="lg:col-span-1">
                                <Input
                                    placeholder="Items"
                                    value={rowsWithComputed.length}
                                    readOnly
                                    className="h-10 bg-slate-50/50 font-bold border-slate-200 text-center"
                                />
                            </FieldWrapper>
                        </div>
                    </Card>


                    {/* Mobile "Add Item" Button Section */}
                    <div className="block md:hidden pb-2">
                        <div className="flex justify-between items-center mb-2 px-1 text-orange-600">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <ListOrdered size={18} /> Product List
                            </h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setItemDialogOpen(true)} className="border-orange-200 text-orange-600 h-8 shadow-sm">
                                    <Search size={16} className="mr-1" /> Search
                                </Button>
                                <Button size="sm" onClick={addRow} className="bg-orange-600 hover:bg-orange-700 text-white h-10 shadow-sm">
                                    <Plus size={16} className="mr-1" /> Add
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Items table + right summary */}
                    <div className="grid grid-cols-1 2xl:grid-cols-12 gap-4 relative">
                        {/* Right Sidebar Toggle Button - Floating - Centered Vertically */}
                        <div className={`hidden 2xl:block absolute ${showRightSidebar ? 'right-[24.9%]' : 'right-0'} top-[40%] -translate-y-1/2 z-50 transition-all duration-500 ease-in-out`}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRightSidebar(!showRightSidebar)}
                                className={`h-11 w-6 rounded-l-xl p-0 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border-orange-200 dark:border-orange-800 bg-white/95 dark:bg-zinc-950 text-orange-600 hover:bg-orange-50 transition-all hover:scale-110 flex items-center justify-center border-r-0 ${showRightSidebar ? '' : 'rounded-xl border-r w-10 h-10 -right-2 absolute translate-x-1/2'}`}
                            >
                                {showRightSidebar ? <ChevronRight size={20} className="stroke-[3]" /> : <ChevronLeft size={20} className="stroke-[3]" />}
                            </Button>
                        </div>

                        {/* Table area */}
                        <div className={`col-span-1 ${showRightSidebar ? '2xl:col-span-9' : '2xl:col-span-12'} pb-24 md:pb-32 2xl:pb-4 transition-all duration-300`}>
                            <Card className="p-0 overflow-hidden gap-0 border-0 md:border shadow-none md:shadow-sm bg-transparent md:bg-card">
                                <div className="overflow-visible md:overflow-x-auto">
                                    <div className="w-full md:min-w-[1200px]">
                                        {/* Table Header (sticky) - Desktop Only */}
                                        <div className="hidden md:grid grid-cols-12 bg-secondary/50 backdrop-blur-sm p-2 text-xs font-semibold border-b sticky top-0 z-10">
                                            <div className="col-span-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setItemDialogOpen(true)}
                                                    className="h-6 gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 -ml-2"
                                                >
                                                    <Search size={12} />
                                                    <span>Search Product (F2)</span>
                                                </Button>
                                            </div>
                                            <div className="col-span-1 text-center">Full</div>
                                            <div className="col-span-1 text-center flex items-center justify-center gap-1">Pcs</div>
                                            <div className="col-span-1 text-center">B.Full</div>
                                            <div className="col-span-1 text-center">B.Pcs</div>
                                            <div className="col-span-1 text-center">Rate</div>
                                            <div className="col-span-1 text-center">Disc %</div>
                                            <div className="col-span-1 text-center">Net Rate</div>
                                            <div className="col-span-1 text-right">Subtotal</div>
                                            <div className="col-span-1 text-center flex items-center justify-center">
                                                <div className="text-[9px] font-black uppercase text-zinc-400">Action</div>
                                            </div>
                                        </div>

                                        {/* Rows (scrollable) */}
                                        <div className="max-h-none md:max-h-[48vh] md:min-h-[50vh] overflow-visible md:overflow-auto space-y-3 md:space-y-0 text-sm">
                                            {rowsWithComputed.map((row) => (
                                                <React.Fragment key={row.id}>
                                                    {(() => {
                                                        const rowItem = items.find(it => it.id === row.item_id);
                                                        const showLoose = !row.item_id || toNumber(rowItem?.packing_qty || 1) > 1;
                                                        
                                                        return (
                                                            <>
                                                                {/* Mobile Card View */}
                                                                <div
                                                                    className="block md:hidden rounded-xl border bg-card dark:bg-card shadow-sm relative overflow-hidden transition-all mb-3 border-gray-200 dark:border-gray-700 hover:shadow-md"
                                                                >
                                                                    {/* Header Row: Item Name & Delete */}
                                                                    <div className="flex items-start justify-between p-3 pb-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                                                        <div className="w-full pr-10">
                                                                            <button
                                                                                onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                                                                className="flex flex-col text-left group/item w-full py-0.5"
                                                                            >
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <div className="h-5 w-5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                                                                        <Wallet size={12} />
                                                                                    </div>
                                                                                    <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 tracking-[0.1em] uppercase">Product Selection</span>
                                                                                </div>
                                                                                {row.item_id ? (
                                                                                    <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase italic flex items-center gap-1.5">
                                                                                        {rowItem?.title}
                                                                                        <ChevronDown size={14} className="text-orange-500/50" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-sm font-bold text-zinc-300 italic uppercase flex items-center gap-1.5">
                                                                                        Tap to Select SKU
                                                                                        <Plus size={14} className="text-orange-500" />
                                                                                    </div>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="absolute top-2 right-2 h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                                                                            onClick={() => removeRow(row.id)}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </Button>
                                                                    </div>

                                                                    <div className="p-3 space-y-4">
                                                                        {/* Quantity Section */}
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-100 dark:border-gray-700 ${!showLoose ? 'col-span-2' : 'col-span-1'}`}>
                                                                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase block mb-1 text-center">Carton</label>
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
                                                                            {showLoose && (
                                                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-100 dark:border-gray-700 col-span-1">
                                                                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase block mb-1 text-center">Pcs</label>
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
                                                                            )}
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
                                                                                <label className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Subtotal</label>
                                                                                <div className="text-base font-black text-orange-600 leading-tight">
                                                                                    {row.amount.toFixed(0)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Desktop Row View (Hidden on mobile) */}
                                                                <div className="hidden md:grid grid-cols-12 gap-1 p-2 border-b items-center text-sm">
                                                                    <div className="col-span-3 h-8 flex items-center">
                                                                        {row.item_id ? (
                                                                            <button
                                                                                onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                                                                className="flex flex-col text-left group/item w-full transition-all hover:translate-x-1"
                                                                            >
                                                                                <span className="text-xs font-black uppercase tracking-tighter truncate dark:text-zinc-100 group-hover/item:text-orange-500 transition-colors">
                                                                                    {rowItem?.title || "Unknown Item"}
                                                                                </span>
                                                                                <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest leading-none">
                                                                                    ID: {row.item_id.toString().padStart(5, '0')}
                                                                                </span>
                                                                            </button>
                                                                        ) : (
                                                                            <Button
                                                                                variant="ghost"
                                                                                className="w-full h-8 px-2 text-[10px] font-black uppercase justify-start rounded-md border-dashed border-zinc-200 dark:border-zinc-800 hover:border-orange-50 dark:hover:bg-orange-950/20 transition-all group-hover:border-orange-200 text-zinc-400"
                                                                                onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                                                                disabled={!accountType}
                                                                            >
                                                                                <Plus size={12} className="mr-2 text-orange-500" />
                                                                                Add Product
                                                                            </Button>
                                                                        )}
                                                                    </div>

                                                                    <div className="col-span-1">
                                                                        <Input
                                                                            className="h-8 px-1 text-center"
                                                                            value={row.full}
                                                                            onChange={(e) => updateRow(row.id, { full: toNumber(e.target.value) })}
                                                                            onClick={() => row.item_id && handleProductFocus(row.item_id)}
                                                                        />
                                                                    </div>

                                                                    <div className="col-span-1">
                                                                        {showLoose && (
                                                                            <Input
                                                                                className="h-8 px-1 text-center"
                                                                                value={row.pcs}
                                                                                onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })}
                                                                                onClick={() => row.item_id && handleProductFocus(row.item_id)}
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    <div className="col-span-1">
                                                                        <Input
                                                                            className="h-8 px-1 text-center border-orange-200 bg-orange-50/10"
                                                                            value={row.bonus_full}
                                                                            onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })}
                                                                            onClick={() => row.item_id && handleProductFocus(row.item_id)}
                                                                            placeholder="B.Full"
                                                                        />
                                                                    </div>

                                                                    <div className="col-span-1">
                                                                        {showLoose && (
                                                                            <Input
                                                                                className="h-8 px-1 text-center border-orange-200 bg-orange-50/10"
                                                                                value={row.bonus_pcs}
                                                                                onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })}
                                                                                onClick={() => row.item_id && handleProductFocus(row.item_id)}
                                                                                placeholder="B.Pcs"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="col-span-1 relative">
                                                                        <Input
                                                                            className={`h-8 px-1 text-center ${(row.last_purchase_rate ?? 0) > 0 && row.rate > (row.last_purchase_rate ?? 0) ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : ""}`}
                                                                            value={row.rate}
                                                                            onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })}
                                                                            onClick={() => row.item_id && handleProductFocus(row.item_id)}
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
                                                                            onClick={() => row.item_id && handleProductFocus(row.item_id)}
                                                                        />
                                                                    </div>

                                                                    <div className="col-span-1">
                                                                        <Input
                                                                            className="h-8 px-1 text-center bg-secondary/20"
                                                                            value={(row.rate * (1 - row.discPercent / 100)).toFixed(2)}
                                                                            readOnly
                                                                            onClick={() => row.item_id && handleProductFocus(row.item_id)}
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-1">
                                                                        <Input
                                                                            className="h-8 px-1 text-right font-bold text-orange-600 bg-orange-50/10"
                                                                            value={((row.amount - (row.amount * row.discPercent / 100)) || 0).toFixed(2)}
                                                                            readOnly
                                                                            onClick={() => row.item_id && handleProductFocus(row.item_id)}
                                                                        />
                                                                    </div>

                                                                    <div className="col-span-1 text-center flex items-center justify-center">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                                                                            onClick={() => removeRow(row.id)}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        {/* Footer summary for table (quick totals) - Realigned as per Pro layout */}
                                        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 p-2 border-t border-zinc-200 dark:border-zinc-800">
                                            {/* Action Buttons: Moved from Header to Bottom Left */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex bg-white dark:bg-zinc-950 p-1 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={addRow}
                                                        className="h-8 px-3 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold uppercase tracking-[0.15em] text-[10px] gap-2 transition-all active:scale-95"
                                                    >
                                                        <Plus size={14} className="stroke-[3]" /> Add Item
                                                    </Button>
                                                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 self-center mx-1" />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={loadAllItems}
                                                        className="h-8 px-3 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold uppercase tracking-widest text-[10px] gap-2 transition-all active:scale-95"
                                                    >
                                                        <PackageSearch size={14} /> Load All Items
                                                    </Button>
                                                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 self-center mx-1" />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={resetRows}
                                                        className="h-8 px-3 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 font-bold uppercase tracking-widest text-[10px] gap-2 transition-all active:scale-95"
                                                    >
                                                        <RotateCcw size={14} /> Reset
                                                    </Button>
                                                </div>

                                                <div className="hidden sm:flex px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase text-zinc-500 tracking-tighter shadow-inner">
                                                    Rows: <span className="ml-1 text-zinc-900 dark:text-zinc-100">{rowsWithComputed.length}</span>
                                                </div>
                                            </div>

                                            {/* Financial Summary: Moved to Bottom Right */}
                                            <div className="flex items-center gap-8 pr-4">
                                                <div className="hidden xs:flex flex-col items-end">
                                                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Total Amount</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[10px] font-bold text-zinc-400">Rs</span>
                                                        <span className="text-lg font-black text-zinc-800 dark:text-zinc-100 leading-none">
                                                            {totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end border-l border-zinc-200 dark:border-zinc-800 pl-8">
                                                    <span className="text-[9px] font-black uppercase text-red-400 tracking-widest leading-none mb-1">Total Discount</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[10px] font-bold text-red-300">-Rs</span>
                                                        <span className="text-lg font-black text-red-600 dark:text-red-400 leading-none">
                                                            {totals.discTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
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
                                        <>Hide Product Details <ChevronUp className="ml-2 h-3 w-3" /></>
                                    ) : (
                                        <>View Product Details <ChevronDown className="ml-2 h-3 w-3" /></>
                                    )}
                                </Button>

                                <div className={`${showInfoPanel ? 'block' : 'hidden'} md:block animate-in slide-in-from-bottom-2`}>
                                    <Card className="border dark:border-gray-800 dark:bg-gray-950 shadow-sm relative overflow-hidden bg-white/50 backdrop-blur-sm p-0">
                                        {selectedItem ? (
                                            <div className="p-0 flex flex-col">
                                                {/* Item Header Bar - Pro-Level Theme */}
                                                <div className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white border-b border-orange-600 flex flex-wrap items-center justify-between gap-1 shadow-sm">
                                                    <div className="flex items-center gap-2 py-1">
                                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                                        <h3 className="text-sm font-black tracking-widest flex items-center gap-2 uppercase italic leading-none">
                                                            {selectedItem.title}
                                                            {selectedItem.short_name && (
                                                                <span className="text-[10px] font-black text-orange-600 bg-white/95 px-2 py-0.5 rounded leading-none shadow-sm">
                                                                    {selectedItem.short_name}
                                                                </span>
                                                            )}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase tracking-widest font-black text-orange-100/90">Supplier:</span>
                                                        <span className="text-[11px] font-black text-orange-600 bg-white px-3 py-1 rounded shadow-md border border-orange-100">
                                                            {selectedItem.company || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
 
                                                {/* Metrics Grid - Pro High-Density Visuals */}
                                                <div className="p-2 sm:p-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 bg-orange-50/20 dark:bg-orange-950/5">
                                                    {/* Packing */}
                                                    <div className="flex flex-col border-r border-orange-100 dark:border-orange-900/50 px-2 group hover:bg-white dark:hover:bg-zinc-900 transition-all rounded p-1">
                                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Packing</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 italic">{toNumber(selectedItem.packing_full || selectedItem.packing_qty)}</span>
                                                            <span className="text-[10px] text-zinc-500 font-bold">pc/box</span>
                                                        </div>
                                                    </div>
 
                                                    {/* Stock Full */}
                                                    <div className="flex flex-col border-r border-orange-100 dark:border-orange-900/50 px-2 group hover:bg-white dark:hover:bg-zinc-900 transition-all rounded p-1">
                                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1.5 opacity-80">Stock Full</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-xl font-black text-orange-600 dark:text-orange-500 italic">
                                                                {Math.floor(toNumber(selectedItem.total_stock_pcs) / (toNumber(selectedItem.packing_qty) || 1))}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500 font-bold">full</span>
                                                        </div>
                                                    </div>
 
                                                    {/* Stock Pcs */}
                                                    <div className="flex flex-col border-r border-orange-100 dark:border-orange-900/50 px-2 group hover:bg-white dark:hover:bg-zinc-900 transition-all rounded p-1">
                                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1.5 opacity-80">Stock Pcs</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-xl font-black text-orange-600 dark:text-orange-500 italic">
                                                                {toNumber(selectedItem.total_stock_pcs) % (toNumber(selectedItem.packing_qty) || 1)}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500 font-bold">pcs</span>
                                                        </div>
                                                    </div>
 
                                                    {/* Total Stock */}
                                                    <div className="flex flex-col border-r border-orange-100 dark:border-orange-900/50 px-2 group hover:bg-white dark:hover:bg-zinc-900 transition-all rounded p-1 bg-orange-500/5">
                                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1.5">Total Inventory</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-xl font-black text-orange-700 dark:text-orange-400 italic font-mono">{toNumber(selectedItem.total_stock_pcs)}</span>
                                                            <span className="text-[10px] text-zinc-500 font-bold">total</span>
                                                        </div>
                                                    </div>
 
                                                    {/* Trade Price */}
                                                    <div className="flex flex-col border-r border-orange-100 dark:border-orange-900/50 px-2 group hover:bg-white dark:hover:bg-zinc-900 transition-all rounded p-1">
                                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1.5">Trade @</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[10px] font-bold text-orange-600/60 uppercase">Rs</span>
                                                            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tighter">{toNumber(selectedItem.trade_price).toFixed(2)}</span>
                                                        </div>
                                                    </div>
 
                                                    {/* Retail Price */}
                                                    <div className="flex flex-col border-r border-orange-100 dark:border-orange-900/50 px-2 group hover:bg-white dark:hover:bg-zinc-900 transition-all rounded p-1">
                                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1.5">Retail @</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[10px] font-bold text-orange-600/60 uppercase">Rs</span>
                                                            <span className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tighter">{toNumber(selectedItem.retail).toFixed(2)}</span>
                                                        </div>
                                                    </div>
 
                                                    {/* Average Price */}
                                                    <div className="flex flex-col px-2 group hover:bg-white dark:hover:bg-zinc-900 transition-all rounded p-1">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Average</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Rs</span>
                                                            <span className="text-xl font-black text-zinc-800 dark:text-zinc-200 font-mono tracking-tighter">{((toNumber(selectedItem.trade_price) + toNumber(selectedItem.retail)) / 2).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Horizontal History Row - Elegant & Professional */}
                                                <div className="px-6 py-6 bg-orange-50/50 dark:bg-orange-950/20 border-t border-orange-200/50 dark:border-orange-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2 shrink-0 md:w-36">
                                                        <div className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse"></div>
                                                        <span className="text-xs font-black uppercase text-orange-600 dark:text-orange-400 tracking-widest leading-none">Pricing History</span>
                                                    </div>

                                                    <div className="flex-1 flex flex-wrap items-center justify-start md:justify-end gap-3 text-sm">
                                                        {loadingPurchaseInfo ? (
                                                            <div className="w-full flex justify-end gap-3 animate-pulse">
                                                                {[1, 2, 3, 4].map(i => <div key={i} className="h-8 w-24 bg-muted rounded-md"></div>)}
                                                            </div>
                                                        ) : lastPurchaseInfo && Object.keys(lastPurchaseInfo).length > 0 ? (
                                                            <>
                                                                <div className="flex items-baseline gap-1.5 whitespace-nowrap bg-background/60 shadow-sm px-3.5 py-1.5 rounded-md border border-border">
                                                                    <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">Date</span>
                                                                    <span className="font-bold text-foreground">
                                                                        {lastPurchaseInfo.last_purchase_date ? new Date(lastPurchaseInfo.last_purchase_date).toLocaleDateString() : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex items-baseline gap-1.5 whitespace-nowrap bg-background/60 shadow-sm px-3.5 py-1.5 rounded-md border border-border max-w-[200px]">
                                                                    <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">Supplier</span>
                                                                    <span className="font-bold truncate text-sky-600">
                                                                        {lastPurchaseInfo.supplier_name || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex items-baseline gap-1.5 whitespace-nowrap bg-background/60 shadow-sm px-3.5 py-1.5 rounded-md border border-border">
                                                                    <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">Qty</span>
                                                                    <span className="font-bold text-foreground">{toNumber(lastPurchaseInfo.previous_qty_carton)}F / {toNumber(lastPurchaseInfo.previous_qty_pcs)}P</span>
                                                                </div>

                                                                <div className="flex items-baseline gap-1.5 whitespace-nowrap bg-orange-100/50 dark:bg-orange-950/30 shadow-sm px-4 py-1.5 rounded-md border border-orange-200 dark:border-orange-800">
                                                                    <span className="text-orange-600/70 dark:text-orange-400/70 font-bold text-[11px] uppercase tracking-wider">Rate</span>
                                                                    <span className="font-black text-orange-600 dark:text-orange-400 text-base leading-none">Rs {toNumber(lastPurchaseInfo.previous_retail_price).toFixed(2)}</span>
                                                                </div>

                                                                <div className="flex items-baseline gap-1.5 whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/20 shadow-sm px-4 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                                                    <span className="text-emerald-600/70 dark:text-emerald-400/70 font-bold text-[11px] uppercase tracking-wider">Total</span>
                                                                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-base leading-none">Rs {toNumber(lastPurchaseInfo.previous_subtotal).toFixed(2)}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm font-medium text-muted-foreground/60 italic w-full text-center py-1">No previous history available</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 flex flex-col items-center gap-3 bg-white/30 dark:bg-black/10">
                                                <div className="p-3 rounded-full bg-orange-500/10 dark:bg-orange-500/5 border border-orange-200/50 dark:border-orange-800/30">
                                                    <ListOrdered className="w-6 h-6 text-orange-400 flex-shrink-0" />
                                                </div>
                                                <div className="text-zinc-500 dark:text-zinc-400 text-sm font-black uppercase tracking-widest opacity-60">
                                                    Item Intelligence Panel
                                                </div>
                                                <div className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium italic -mt-1">
                                                    Select an item row to unlock real-time metrics & history
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            </div>
                        </div>

                        {/* Right summary panel - Visible ONLY on Large Desktop (2xl+) */}
                        {showRightSidebar && (
                            <div className="hidden 2xl:block 2xl:col-span-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card className="p-0  shadow-2xl shadow-orange-500/5 sticky top-[120px] overflow-hidden  backdrop-blur-sm">
                                    <div className="p-3 border-b">
                                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center justify-between">
                                            <span>Invoice Summary</span>
                                            <Receipt size={14} className="opacity-70" />
                                        </h3>
                                    </div>

                                    <div className="p-4 space-y-5">
                                        {/* Row 1: Item Counts */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Full</span>
                                                <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{totals.totalFull}</div>
                                            </div>
                                            <div className="flex flex-col bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Pieces</span>
                                                <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{totals.totalPcs}</div>
                                            </div>
                                        </div>

                                        {/* Financials List */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-zinc-500">Gross Total</span>
                                                <span className="text-zinc-900 dark:text-zinc-200">Rs {totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-red-500">Disc Amount</span>
                                                <span className="text-red-600 dark:text-red-400">-Rs {totals.discTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 pt-1">
                                                <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                                    <span>Extra Courier</span>
                                                </div>
                                                <Input
                                                    className="h-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold focus:border-blue-300"
                                                    placeholder="0.00"
                                                    value={courier}
                                                    onChange={(e) => setCourier(toNumber(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-zinc-200 dark:bg-zinc-800 border-dashed border-t border-zinc-300 dark:border-zinc-700" />

                                        {/* Advance Information */}
                                        {advanceAvailable < 0 && (
                                            <div className="space-y-3 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest flex items-center gap-2">
                                                        <TrendingDown size={12} /> Available Advance
                                                    </span>
                                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                        Rs {Math.abs(advanceAvailable).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox 
                                                            id="use-advance" 
                                                            checked={useAdvance} 
                                                            onCheckedChange={(v) => setUseAdvance(!!v)}
                                                            className="w-4 h-4 border-emerald-500/50 data-[state=checked]:bg-emerald-600"
                                                        />
                                                        <label htmlFor="use-advance" className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                                            Apply to this bill
                                                        </label>
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-600">
                                                        -Rs {totals.appliedAdvance.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="h-px bg-zinc-200 dark:bg-zinc-800 border-dashed border-t border-zinc-300 dark:border-zinc-700" />

                                        {/* Net Total - Big & Bold */}
                                        <div className={cn(
                                            "flex flex-col p-3 rounded-sm shadow-lg transition-all duration-500",
                                            totals.netSettlement === 0 && totals.appliedAdvance > 0 
                                                ? "bg-emerald-600 dark:bg-emerald-700 shadow-emerald-500/20" 
                                                : "bg-orange-600 dark:bg-orange-700 shadow-orange-500/20"
                                        )}>
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-80 decoration-white/30 decoration-1 flex items-center justify-between">
                                                <span>Net Settlement</span>
                                                {totals.netSettlement === 0 && totals.appliedAdvance > 0 && (
                                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[8px] animate-pulse">AUTO-SETTLED</span>
                                                )}
                                            </span>
                                            <div className="text-3xl font-black leading-none drop-shadow-md text-white">
                                                <span className="text-xs font-bold mr-1 italic">Rs</span>
                                                {totals.netSettlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>

                                        {/* Selects */}
                                        <div className="space-y-3 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-zinc-400">Firm / Company</label>
                                                <Select value={selectedFirmId} onValueChange={setSelectedFirmId}>
                                                    <SelectTrigger className="w-full h-8 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-[10px] font-bold overflow-hidden">
                                                        <SelectValue placeholder="Select Firm" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {firms?.map((f) => (
                                                            <SelectItem key={f.id} value={f.id.toString()} className="text-xs font-bold">
                                                                {f.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-zinc-400">Message Line</label>
                                                <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                                                    <SelectTrigger className="w-full h-8 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-[10px] font-bold">
                                                        <SelectValue placeholder="No Message" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0" className="text-xs font-bold">No Message Line</SelectItem>
                                                        {messageLines?.map((msg) => (
                                                            <SelectItem key={msg.id} value={msg.id.toString()} className="text-xs font-bold">
                                                                {msg.messageline}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-zinc-400">Output Format</label>
                                                <Select value={printOption} onValueChange={(v) => setPrintOption(v as "big" | "small")}>
                                                    <SelectTrigger className="w-full h-8 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-[10px] font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="big" className="text-xs font-bold flex items-center gap-2 italic">A4 Paper Print</SelectItem>
                                                        <SelectItem value="small" className="text-xs font-bold flex items-center gap-2 italic">80mm Thermal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Pay Now Toggle */}
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between p-3 rounded-sm bg-orange-500/5 border border-orange-500/10 transition-all hover:bg-orange-500/10 group cursor-pointer" onClick={() => setIsPayNow(!isPayNow)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-300",
                                                        isPayNow ? "bg-orange-500 shadow-lg shadow-orange-500/30 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                                    )}>
                                                        <Wallet size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Pay From Here</span>
                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter italic">Optional Settlement</span>
                                                    </div>
                                                </div>
                                                <Checkbox 
                                                    checked={isPayNow}
                                                    onCheckedChange={(checked) => setIsPayNow(!!checked)}
                                                    className="w-5 h-5 rounded-md border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 shadow-none border-none bg-zinc-200 dark:bg-zinc-800"
                                                />
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="pt-2">
                                            <Button
                                                onClick={handleSave}
                                                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 active:scale-95 transition-all rounded-sm gap-2"
                                            >
                                                <Save size={18} className="stroke-[2.5]" />
                                                Confirm & Save
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Laptop Sticky Footer (Visible on md and lg, hidden on mobile and 2xl desktop) */}
                    <div className="hidden md:flex 2xl:hidden sticky bottom-0 -mx-6 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-t border-border p-3 px-8 z-40 items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300">
                        <div className="flex gap-10 items-center">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Gross Billing</span>
                                <div className="text-base font-bold text-foreground">Rs {totals.gross.toLocaleString()}</div>
                            </div>

                            <div className="flex flex-col w-32">
                                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 leading-none">Courier Expense</span>
                                <Input
                                    className="h-8 bg-zinc-50 dark:bg-zinc-900 border-orange-200/50 focus:border-orange-500 font-bold text-sm"
                                    value={courier}
                                    onChange={(e) => setCourier(toNumber(e.target.value))}
                                />
                            </div>

                            <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-6">
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Net Settlement</span>
                                <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                                    <span className="text-sm font-bold mr-1 italic">Rs</span>
                                    {totals.netSettlement.toLocaleString()}
                                </div>
                            </div>
                            {totals.appliedAdvance > 0 && (
                                <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-6 animate-in slide-in-from-left-4">
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Paid via Advance</span>
                                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                        Rs {totals.appliedAdvance.toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col w-40">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Print Option</span>
                                <Select value={printOption} onValueChange={(v) => setPrintOption(v as "big" | "small")}>
                                    <SelectTrigger className="h-8 bg-zinc-50 dark:bg-zinc-900/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="big" className="text-xs font-black uppercase">A4 Format</SelectItem>
                                        <SelectItem value="small" className="text-xs font-black uppercase">Thermal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest h-10 px-8 shadow-lg shadow-orange-500/20 active:scale-95 transition-all rounded-xl gap-2">
                                    <Save size={18} />
                                    Process Order
                                </Button>
                                <Button variant="outline" className="h-10 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 hover:bg-red-50 hover:text-red-500 transition-all font-bold uppercase text-[10px]" onClick={() => window.history.back()}>
                                    Exit
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Sticky Footer */}
                    <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/60 dark:border-gray-700/60 p-4 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] transition-transform duration-300 ${showStickyFooter ? 'translate-y-0' : 'translate-y-full'}`}>
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex flex-col">
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                                    {totals.appliedAdvance > 0 ? "Net Settlement" : "Net Total"}
                                </div>
                                <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                                    <span className="text-sm font-semibold mr-1">Rs</span>
                                    {Math.round(totals.netSettlement).toLocaleString()}
                                </div>
                                {totals.appliedAdvance > 0 && (
                                    <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                        <TrendingDown size={10} /> -{Math.round(totals.appliedAdvance).toLocaleString()} Adv.
                                    </div>
                                )}
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

                {/* Item Selection Dialog */}
                <ItemSelectionDialog
                    open={itemDialogOpen}
                    onOpenChange={setItemDialogOpen}
                    itemSearch={itemSearch}
                    setItemSearch={setItemSearch}
                    filteredItems={filteredItems}
                    rows={rows}
                    removeRow={removeRow}
                    addRow={addRow}
                    handleSelectItem={handleSelectItem}
                    setRows={setRows}
                />

                {/* Price Update Confirmation Dialog */}
                <PriceUpdateDialog
                    open={showPriceDialog}
                    onOpenChange={setShowPriceDialog}
                    priceUpdates={priceUpdates}
                    submitPurchase={handlePostPriceUpdate}
                />

                {/* Purchase Payment Dialog */}
                <PurchasePaymentDialog
                    open={showPaymentDialog}
                    onOpenChange={setShowPaymentDialog}
                    totals={totals}
                    splits={paymentSplits}
                    paymentAccounts={paymentAccounts}
                    addSplitRow={addPaymentSplit}
                    removeSplitRow={removePaymentSplit}
                    updateSplitRow={updatePaymentSplit}
                    onCommit={() => {
                        setShowPaymentDialog(false);
                        submitPurchase(updatePricesAfterPayment);
                    }}
                    invoiceNo={invoiceNo}
                    supplierName={accounts.find(a => a.id === Number(accountType?.value))?.title || "N/A"}
                    previousBalance={toNumber(accounts.find(a => a.id === Number(accountType?.value))?.current_balance)}
                    customerCheques={customerCheques}
                    availableCheques={availableCheques}
                />

                {/* Success Summary Dialog */}
                <SuccessSummaryDialog
                    open={showSuccessDialog}
                    onOpenChange={setShowSuccessDialog}
                    successData={successData}
                />
            </SidebarInset >
        </SidebarProvider >
    );
}
