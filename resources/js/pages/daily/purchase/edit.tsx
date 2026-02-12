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
import { Trash2, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
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
    { title: "Edit Invoice", href: "" },
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
}
interface RowData {
    id: number;
    item_id: number | null;
    full: number; // full cartons
    pcs: number; // single pcs
    bonus_full: number;
    bonus_pcs: number;
    rate: number;
    taxPercent: number;
    discPercent: number;
    trade_price: number;
    amount: number;
    last_purchase_rate?: number;
}
interface Saleman {
    id: number;
    name?: string;
    shortname?: string;

}
interface Option {
    value: number;
    label: string;
    code?: string;
}

interface PurchaseItem {
    id: number;
    purchase_id: number;
    item_id: number;
    qty_carton: number;
    qty_pcs: number;
    total_pcs: number;
    trade_price: number;
    discount: number;
    gst_amount: number;
    subtotal: number;
}

interface PurchaseData {
    id: number;
    date: string;
    invoice: string;
    code: string | null;
    supplier_id: number;
    salesman_id: number | null;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    courier_charges: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    items: PurchaseItem[];
    supplier?: Account;
    salesman?: Saleman;
}

interface PurchaseProps {
    items: Item[];
    accounts: Account[];
    salemans: Saleman[];
    purchase: PurchaseData;
}

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
// Util helpers
// ───────────────────────────────────────────
const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
};

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
export default function PurchaseEdit({
    items,
    accounts,
    salemans,
    purchase
}: PurchaseProps) {
    // Header / meta fields
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(purchase.date ? new Date(purchase.date) : undefined)
    const [code, setCode] = useState<string>(purchase.code ? String(purchase.code) : "");
    const [party, setParty] = useState<string>("");
    const [creditLimit, setCreditLimit] = useState<number | "">("");
    const [creditDays, setCreditDays] = useState<number>(0);
    const [active, setActive] = useState<boolean>(true);
    const [invoiceNo, setInvoiceNo] = useState<string>(purchase.invoice ? String(purchase.invoice) : "");
    const [salesman, setSalesman] = useState<number | null>(purchase.salesman_id);
    const [cashCredit, setCashCredit] = useState<string>("CREDIT");
    const [itemsCount, setItemsCount] = useState<number>(purchase.no_of_items);
    const [courier, setCourier] = useState<number>(toNumber(purchase.courier_charges));
    const [printOption, setPrintOption] = useState<"big" | "small">("big");

    // Initialize account type based on purchase.supplier_id
    const initialAccount = accounts.find(a => a.id === purchase.supplier_id);
    const [accountType, setAccountType] = useState<Option | null>(
        initialAccount ? { value: initialAccount.id, label: initialAccount.title } : null
    );

    const accountTypeOptions: Option[] = accounts.map((a) => ({
        value: a.id,
        label: a.title,
    }));
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

    // Initialize rows from purchase items
    const initialRows: RowData[] = purchase.items.map((it) => {
        // Calculate percentages back from amounts if needed, or use stored values if available
        // Since we don't store percentages directly on PurchaseItem (based on controller), we might need to infer or just use 0 if not critical,
        // BUT for editing, it's better to calculate them.
        // taxPercent = (gst_amount / subtotal) * 100? No, subtotal includes tax usually? 
        // Let's look at controller store: subtotal is passed directly.
        // In create.tsx: 
        // tax = (taxPercent / 100) * amount
        // disc = (discPercent / 100) * amount
        // subtotal (in controller) seems to be the amount (which is qty * rate). 
        // Wait, controller store says: 'subtotal' => $it['subtotal'].
        // In create.tsx payload: subtotal: r.amount.
        // And r.amount = normalUnits * r.rate.
        // So subtotal is the GROSS amount for that line (before tax/disc).

        // So:
        // gst_amount = (taxPercent / 100) * subtotal
        // => taxPercent = (gst_amount / subtotal) * 100

        const subtotal = toNumber(it.subtotal);
        const taxPercent = subtotal > 0 ? (toNumber(it.gst_amount) / subtotal) * 100 : 0;
        const discPercent = subtotal > 0 ? (toNumber(it.discount) / subtotal) * 100 : 0;

        return {
            id: Date.now() + Math.random(), // unique id
            item_id: it.item_id,
            full: toNumber(it.qty_carton),
            pcs: toNumber(it.qty_pcs),
            bonus_full: 0, // Not stored in DB currently? Controller doesn't show bonus cols in create/store.
            bonus_pcs: 0,
            rate: toNumber(it.trade_price), // Assuming trade_price in DB is the rate used
            taxPercent: taxPercent,
            discPercent: discPercent,
            trade_price: toNumber(it.trade_price),
            amount: subtotal,
        };
    });

    const [rows, setRows] = useState<RowData[]>(initialRows.length ? initialRows : [
        {
            id: Date.now(),
            item_id: null,
            full: 0,
            pcs: 0,
            bonus_full: 0,
            bonus_pcs: 0,
            rate: 0,
            taxPercent: 0,
            discPercent: 0,
            trade_price: 0,
            amount: 0,
        },
    ]);

    // Effect to set initial credit details when component mounts or account changes
    useEffect(() => {
        if (initialAccount) {
            setCreditDays(initialAccount.aging_days ?? 0);
            setCreditLimit(typeof initialAccount.credit_limit === "number" ? initialAccount.credit_limit : (initialAccount.credit_limit ? Number(initialAccount.credit_limit) : ""));
        }
    }, []); // Run once on mount, or rely on the selection handler

    // Track the currently selected item for displaying info
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [lastPurchaseInfo, setLastPurchaseInfo] = useState<any>(null);
    const [loadingPurchaseInfo, setLoadingPurchaseInfo] = useState(false);

    // ───────────────────────────────────────────
    // Row operations
    // ───────────────────────────────────────────
    const addRow = () => {
        setRows((prev) => [
            {
                id: Date.now(),
                item_id: null,
                full: 0,
                pcs: 0,
                bonus_full: 0,
                bonus_pcs: 0,
                rate: 0,
                taxPercent: 0,
                discPercent: 0,
                trade_price: 0,
                amount: 0,
            },
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
        const tax = toNumber(selected.gst_percent ?? 0);
        const disc = toNumber(selected.discount ?? 0);
        const tradePrice = toNumber(selected.trade_price ?? baseRate);

        updateRow(rowId, { item_id: itemId, rate: baseRate, taxPercent: tax, discPercent: disc, trade_price: tradePrice });

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

    // update amounts when rows change
    const rowsWithComputed = useMemo(() => {
        return rows.map((r) => {
            const item = items.find((it) => it.id === r.item_id) ?? undefined;
            const amount = recalcRowAmount(r, item);
            return { ...r, amount };
        });
    }, [rows, items]);

    // Get the currently selected item details
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return items.find((it) => it.id === selectedItemId) ?? null;
    }, [selectedItemId, items]);

    // ───────────────────────────────────────────
    // Totals & Invoice summary
    // ───────────────────────────────────────────
    const totals = useMemo(() => {
        let gross = 0;
        let taxTotal = 0;
        let discTotal = 0;

        rowsWithComputed.forEach((r) => {
            const item = items.find((it) => it.id === r.item_id) ?? undefined;
            const amount = r.amount;
            gross += amount;

            const tax = (toNumber(r.taxPercent) / 100) * amount;
            taxTotal += tax;

            const disc = (toNumber(r.discPercent) / 100) * amount;
            discTotal += disc;
        });

        const previousBalance = 0;
        const cashReceived = 0;

        // Round totals
        const roundedGross = Math.round(gross);
        const roundedTax = Math.round(taxTotal);
        const roundedDisc = Math.round(discTotal);

        const net = roundedGross + roundedTax - roundedDisc + courier;

        return {
            gross: roundedGross,
            taxTotal: roundedTax,
            discTotal: roundedDisc,
            courier,
            net: Math.round(net),
            previousBalance,
            cashReceived,
            totalReceivable: Math.round(net + previousBalance - cashReceived),
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
    const handleSave = async () => {
        const payload = {
            date: date ? date.toISOString().slice(0, 10) : null,
            invoice: invoiceNo,
            code: code,
            supplier_id: accountType?.value,
            salesman_id: salesman,
            no_of_items: rowsWithComputed.length,
            print_format: printOption,

            gross_total: totals.gross,
            discount_total: totals.discTotal,
            tax_total: totals.taxTotal,
            courier_charges: totals.courier,
            net_total: totals.net,
            paid_amount: 0,
            remaining_amount: totals.net,

            items: rowsWithComputed.map((r) => {
                const item = items.find(i => i.id === r.item_id);
                const packing = item?.packing_full ?? item?.packing_qty ?? 1;

                const totalPCS = (r.full * packing) + r.pcs;

                return {
                    item_id: r.item_id,
                    qty_carton: r.full,
                    qty_pcs: r.pcs,
                    total_pcs: totalPCS,
                    trade_price: r.trade_price,
                    discount: (r.discPercent / 100) * r.amount,
                    gst_amount: (r.taxPercent / 100) * r.amount,
                    subtotal: r.amount
                };
            })
                .filter(r => r.item_id !== null)
        };
        router.put(`/purchase/${purchase.id}`, payload, {
            onSuccess: () => {
                // alert("Purchase updated successfully!");
                // Backend redirects to print
            },
            onError: (errors) => {
                console.error(errors);
                alert("Failed to update purchase. Check console for details.");
            }
        });
    };

    return (
        <SidebarProvider
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

                <div className="w-full p-4 space-y-4">


                    {/* Header */}
                    <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-x-3 gap-y-5 items-end">
                        {/* Date Picker */}
                        <FieldWrapper label="Invoice Date" className="lg:col-span-1">
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date-picker"
                                        className="w-full justify-between font-normal h-10 px-2 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors"
                                    >
                                        <span className="truncate">{date ? date.toLocaleDateString() : "Select date"}</span>
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
                        </FieldWrapper>

                        {/* Time Picker */}
                        <FieldWrapper label="Invoice Time" className="lg:col-span-1">
                            <Input
                                type="time"
                                id="time-picker"
                                step="1"
                                defaultValue={new Date().toLocaleTimeString('en-GB', { hour12: false })}
                                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors"
                            />
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
                                        setCode(selectedAccount.code ? String(selectedAccount.code) : "");
                                        const salemanId = selectedAccount.saleman_id ?? null;
                                        setSalesman(salemanId);
                                    } else {
                                        setCreditDays(0);
                                        setCreditLimit("");
                                        setSalesman(null);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors">
                                    <SelectValue placeholder="Select Account" />
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
                        <FieldWrapper label="Account Code" className="lg:col-span-1">
                            <Input
                                placeholder="Code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="h-10 bg-slate-50/50 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors"
                            />
                        </FieldWrapper>
                        {/* Credit Days */}
                        <FieldWrapper label="Credit Days" className="lg:col-span-1">
                            <Input
                                placeholder="Days"
                                value={creditDays}
                                onChange={(e) => setCreditDays(Number(e.target.value))}
                                className="h-10 text-center font-mono border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors"
                            />
                        </FieldWrapper>

                        {/* Credit Limit */}
                        <FieldWrapper label="Credit Limit" className="lg:col-span-1">
                            <Input
                                placeholder="Limit"
                                value={creditLimit as any}
                                onChange={(e) =>
                                    setCreditLimit(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                className="h-10 text-right font-mono border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors"
                            />
                        </FieldWrapper>

                        {/* Invoice # */}
                        <FieldWrapper label="Invoice Bill #" className="lg:col-span-1">
                            <Input
                                placeholder="Invoice #"
                                value={invoiceNo}
                                onChange={(e) => setInvoiceNo(e.target.value)}
                                className="h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors"
                            />
                        </FieldWrapper>

                        {/* Salesman */}
                        <FieldWrapper label="Salesman Name" className="lg:col-span-1">
                            <Input
                                placeholder="Salesman"
                                value={salesman ? (salemanMap.get(salesman) || "") : ""}
                                readOnly
                                className="h-10 bg-slate-50/50 italic text-slate-600 border-slate-200"
                            />
                        </FieldWrapper>

                        {/* Cash/Credit Select */}
                        <FieldWrapper label="Sale Type" className="lg:col-span-1">
                            <Select value={cashCredit} onValueChange={setCashCredit}>
                                <SelectTrigger className="w-full h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Cash / Credit</SelectLabel>
                                        <SelectItem value="CREDIT">CREDIT</SelectItem>
                                        <SelectItem value="CASH">CASH</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        {/* Items # */}
                        <FieldWrapper label="Items #" className="lg:col-span-1">
                            <Input
                                placeholder="Items #"
                                value={rowsWithComputed.length}
                                readOnly
                                className="h-10 bg-slate-50/50 font-bold border-slate-200"
                            />
                        </FieldWrapper>

                        {/* Active Checkbox */}
                        <div className="flex items-center gap-3 border border-slate-200 px-3 h-10 rounded-md lg:col-span-1 bg-white">
                            <Checkbox id="terms" defaultChecked />
                            <Label htmlFor="terms" className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">Active</Label>
                        </div>
                    </Card>


                    {/* Items table + right summary */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* Table area */}
                        <div className="col-span-9">
                            <Card className="p-0 overflow-hidden gap-0">
                                {/* Table Header (sticky) */}
                                <div className="grid grid-cols-12 bg-gray-100 p-2 text-xs font-semibold border-b sticky top-0 z-10">

                                    <div className="col-span-2">+ Item Selection</div>
                                    <div className="col-span-1 text-center">Full</div>
                                    <div className="col-span-1 text-center">Pcs</div>
                                    <div className="col-span-1 text-center">B.Full</div>
                                    <div className="col-span-1 text-center">B.Pcs</div>
                                    <div className="col-span-1 text-right">Rate</div>
                                    <div className="col-span-1 text-right">Tax</div>
                                    <div className="col-span-1 text-right">Disc %</div>
                                    <div className="col-span-1 text-right">After Disc</div>
                                    <div className="col-span-1 text-right">Sub Total</div>
                                    <div className="col-span-1 text-right">Add Or Del</div>

                                </div>

                                {/* Rows (scrollable) */}
                                <div className="max-h-[374px] overflow-auto">
                                    {rowsWithComputed.map((row) => (
                                        <div key={row.id} className="grid grid-cols-12 gap-1 p-2 border-b items-center text-sm">


                                            <div className="col-span-2 flex items-center justify-center">

                                                <ReactSelect
                                                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }), container: (base) => ({ ...base, width: '100%' }) }}
                                                    options={itemOptions}
                                                    value={itemOptions.find((opt) => opt.value === row.item_id) || null}
                                                    onChange={(opt) => handleSelectItem(row.id, Number(opt?.value))}
                                                    placeholder="Select item"
                                                    isClearable
                                                />
                                            </div>

                                            <div className="col-span-1">
                                                <Input value={row.full} onChange={(e) => updateRow(row.id, { full: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1">
                                                <Input value={row.pcs} onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1">
                                                <Input value={row.bonus_full} onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1">
                                                <Input value={row.bonus_pcs} onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1 relative">
                                                <Input
                                                    className={`text-right ${row.last_purchase_rate && row.rate > row.last_purchase_rate ? "border-red-500 bg-red-50 text-red-700" : ""}`}
                                                    value={row.rate}
                                                    onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })}
                                                    onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                />
                                                {row.last_purchase_rate && row.rate > row.last_purchase_rate && (
                                                    <div className="absolute -top-8 left-0 z-50 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                                        High Rate! Last: {row.last_purchase_rate}
                                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-red-600"></div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-span-1">
                                                <Input className="text-right" value={row.taxPercent} onChange={(e) => updateRow(row.id, { taxPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1">
                                                <Input className="text-right" value={row.discPercent} onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1">
                                                <Input className="text-right bg-slate-50" value={(row.rate * (1 - row.discPercent / 100)).toFixed(2)} readOnly onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>
                                            <div className="col-span-1">
                                                <Input className="text-right" value={(row.amount - (row.amount * row.discPercent / 100) + (row.amount * row.taxPercent / 100)).toFixed(2)} readOnly onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>


                                            <div className="col-span-1 flex items-center gap-1 justify-center">
                                                <Button size="icon" variant="outline" className="h-8 w-8 p-1 rounded-sm " onClick={addRow}><Plus size={14} /></Button>
                                                <Button variant="outline" size="icon" className="h-8 w-8 p-1 bg-red-500 rounded-sm  text-white hover:bg-red-300" onClick={() => removeRow(row.id)}>
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer summary for table (quick totals) */}
                                <div className="p-3 border-t grid grid-cols-4 gap-4 bg-gray-100">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Rows</div>
                                        <div className="text-lg font-semibold">{rowsWithComputed.length}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Gross</div>
                                        <div className="text-lg font-semibold text-green-700">{totals.gross}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Tax</div>
                                        <div className="text-lg font-semibold text-blue-500">{totals.taxTotal}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Discount</div>
                                        <div className="text-lg font-semibold text-red-500">{totals.discTotal}</div>
                                    </div>
                                </div>
                            </Card>

                            {/* Bottom fields / stock & supplier info */}
                            <Card className="py-1 px-4 mt-2  bg-gradient-to-br gap-2 from-slate-50 to-blue-50 border-2">
                                {selectedItem ? (
                                    <>
                                        {/* Header */}
                                        <div className="mb-1 pb-2 border-b-2 border-blue-200">
                                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                {selectedItem.title}
                                                {selectedItem.short_name && (
                                                    <span className="text-sm font-normal text-gray-500">({selectedItem.short_name})</span>
                                                )}
                                            </h3>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-4 gap-4">
                                            {/* Packing Qty */}
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Packing Qty</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-slate-700">{toNumber(selectedItem.packing_full || selectedItem.packing_qty)}</span>
                                                    <span className="text-xs font-normal text-gray-400">pcs/full</span>
                                                </div>
                                            </div>

                                            {/* Stock (Cartons) */}
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Stock (Full)</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-slate-700">
                                                        {Math.floor(toNumber(selectedItem.stock_1) / (toNumber(selectedItem.packing_qty) || 1))}
                                                    </span>
                                                    <span className="text-xs font-normal text-gray-400">full</span>
                                                </div>
                                            </div>

                                            {/* Stock (Pieces) */}
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Stock (Pieces)</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-slate-700">
                                                        {toNumber(selectedItem.stock_1) % (toNumber(selectedItem.packing_qty) || 1)}
                                                    </span>
                                                    <span className="text-xs font-normal text-gray-400">pcs</span>
                                                </div>
                                            </div>

                                            {/* Total Stock - FILLED GREEN */}
                                            <div className="bg-[#00B050] rounded-lg p-4 shadow-sm text-white border border-[#009e48]">
                                                <div className="text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1">Total Stock</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-white">{toNumber(selectedItem.stock_1)}</span>
                                                    <span className="text-xs font-normal text-white/80">pcs</span>
                                                </div>
                                            </div>

                                            {/* Trade Price */}
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Trade Price</div>
                                                <div className="text-2xl font-bold text-slate-700">
                                                    <span className="text-lg mr-1">Rs</span>
                                                    {toNumber(selectedItem.trade_price).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Retail Price */}
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Retail Price</div>
                                                <div className="text-2xl font-bold text-slate-700">
                                                    <span className="text-lg mr-1">Rs</span>
                                                    {toNumber(selectedItem.retail).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Average Price */}
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Average Price</div>
                                                <div className="text-2xl font-bold text-slate-700">
                                                    <span className="text-lg mr-1">Rs</span>
                                                    {((toNumber(selectedItem.trade_price) + toNumber(selectedItem.retail)) / 2).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Company - FILLED BLUE/INDIGO */}
                                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 shadow-sm text-white border border-blue-600">
                                                <div className="text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1">Company</div>
                                                <div className="text-lg font-bold text-white truncate" title={selectedItem.company ?? 'N/A'}>
                                                    {selectedItem.company || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Last Purchase History Section */}
                                        {(selectedItem && (lastPurchaseInfo || loadingPurchaseInfo)) && (
                                            <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-md font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                        Last Purchase History
                                                    </h3>
                                                    {lastPurchaseInfo?.last_purchase_date && (
                                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {new Date(lastPurchaseInfo.last_purchase_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                    {loadingPurchaseInfo ? (
                                                        <div className="grid grid-cols-4 gap-4 animate-pulse">
                                                            <div className="h-10 bg-gray-200 rounded"></div>
                                                            <div className="h-10 bg-gray-200 rounded"></div>
                                                            <div className="h-10 bg-gray-200 rounded"></div>
                                                            <div className="h-10 bg-gray-200 rounded"></div>
                                                        </div>
                                                    ) : lastPurchaseInfo ? (
                                                        <div className="grid grid-cols-4 gap-4 divide-x divide-gray-200">
                                                            {/* Last Qty */}
                                                            <div className="px-2">
                                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Previous Qty</div>
                                                                <div className="text-lg font-bold text-slate-700">
                                                                    {toNumber(lastPurchaseInfo.previous_qty_carton)}
                                                                    <span className="text-xs font-normal text-gray-400 ml-1">ctns</span>
                                                                    <span className="text-gray-300 mx-1">|</span>
                                                                    {toNumber(lastPurchaseInfo.previous_qty_pcs)}
                                                                    <span className="text-xs font-normal text-gray-400 ml-1">pcs</span>
                                                                </div>
                                                            </div>

                                                            {/* Last Retail Price */}
                                                            <div className="px-2 pl-4">
                                                                <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Last Retail Price</div>
                                                                <div className="text-lg font-bold text-slate-700">
                                                                    ₨ {toNumber(lastPurchaseInfo.previous_retail_price).toFixed(2)}
                                                                </div>
                                                            </div>

                                                            {/* Average Price */}
                                                            <div className="px-2 pl-4">
                                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Average Price</div>
                                                                <div className="text-lg font-bold text-slate-700">
                                                                    ₨ {toNumber(lastPurchaseInfo.average_price).toFixed(2)}
                                                                </div>
                                                            </div>

                                                            {/* Company */}
                                                            <div className="px-2 pl-4">
                                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Company</div>
                                                                <div className="text-md font-bold text-slate-700 truncate" title={lastPurchaseInfo.company}>
                                                                    {lastPurchaseInfo.company || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-sm text-gray-500 py-2">
                                                            No previous purchase history found.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 text-lg font-medium">
                                            Select an item to view details
                                        </div>
                                        <div className="text-gray-300 text-sm mt-2">
                                            Click on any item in the table above
                                        </div>
                                    </div>
                                )}
                            </Card>
                            {/* Bottom fields / stock & supplier info */}

                        </div>

                        {/* Right summary panel */}
                        <div className="col-span-3">
                            <Card className="p-4 space-y-3 sticky top-[120px] gap-0">
                                {isOverLimit && (
                                    <div className="p-2 mb-2 bg-red-100 border border-red-400 text-red-700 text-sm font-bold rounded animate-pulse">
                                        ⚠️ Exceeds Credit Limit!
                                    </div>
                                )}

                                <div>
                                    <div className="text-xs font-semibold">Delivery Challan</div>
                                    <Input placeholder="" />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="text-xs font-semibold">Invoice Full</div>
                                        <Input placeholder="" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold">Invoice Half</div>
                                        <Input placeholder="" />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="text-xs font-semibold">Gross Amount</div>
                                    <div className="text-xl font-bold">{totals.gross.toFixed(2)}</div>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Courier</div>
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
                                    <div className="text-xs font-semibold">Previous Balance</div>
                                    <Input placeholder="0.00" />
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Cash Received</div>
                                    <Input placeholder="0.00" />
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Ledger</div>
                                    <Select value="">
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Ledger</SelectLabel>
                                                <SelectItem value="ledger-1">Ledger 1</SelectItem>
                                                <SelectItem value="ledger-2">Ledger 2</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Print Option</div>
                                    <Select value={printOption} onValueChange={(v) => setPrintOption(v as "big" | "small")}>
                                        <SelectTrigger className="w-full h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="big">Big (A4)</SelectItem>
                                            <SelectItem value="small">Small (Thermal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Total Receivable</div>
                                    <div className="text-xl font-bold">{totals.totalReceivable.toFixed(2)}</div>
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <Button onClick={handleSave}>Update</Button>
                                    <Button variant="outline" onClick={() => router.get('/purchase')}>Cancel</Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
