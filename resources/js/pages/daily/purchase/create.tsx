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
import { Trash2, Plus, ListRestart, RotateCcw } from "lucide-react";
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
    nextInvoiceNo: string;
    messageLines?: MessageLine[];
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
    nextInvoiceNo,
    messageLines,
}: PurchaseProps) {
    const { appearance } = useAppearance();
    const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const selectBg = isDark ? '#0a0a0a' : '#ffffff';
    const selectBorder = isDark ? '#262626' : '#e5e7eb';

    // Header / meta fields
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [code, setCode] = useState<string>("");
    const [party, setParty] = useState<string>("");
    const [creditLimit, setCreditLimit] = useState<number | "">("");
    const [creditDays, setCreditDays] = useState<number>(0);
    const [active, setActive] = useState<boolean>(true);
    const [invoiceNo, setInvoiceNo] = useState<string>(nextInvoiceNo);
    const [salesman, setSalesman] = useState<number | null>(null);
    const [cashCredit, setCashCredit] = useState<string>("CREDIT");
    const [itemsCount, setItemsCount] = useState<number>(items.length);
    const [accountType, setAccountType] = useState<Option | null>(null);
    const [courier, setCourier] = useState<number>(0);
    const [printOption, setPrintOption] = useState<"big" | "small">("big");
    const [selectedMessageId, setSelectedMessageId] = useState<string>("0");
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
        taxPercent: 0,
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
                taxPercent: 0,
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

        updateRow(rowId, { item_id: itemId, rate: baseRate, taxPercent: 0, discPercent: disc, trade_price: tradePrice });

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

        rowsWithComputed.forEach((r) => {
            const item = items.find((it) => it.id === r.item_id) ?? undefined;
            const amount = r.amount;
            gross += amount;

            const disc = (toNumber(r.discPercent) / 100) * amount;
            discTotal += disc;
        });

        const previousBalance = 0;
        const cashReceived = 0;

        // Round totals
        const roundedGross = Math.round(gross);
        const roundedDisc = Math.round(discTotal);

        const net = roundedGross - roundedDisc + courier;

        return {
            gross: roundedGross,
            taxTotal: 0,
            discTotal: roundedDisc,
            courier: courier,
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

            gross_total: totals.gross,
            discount_total: totals.discTotal,
            tax_total: totals.taxTotal,
            courier_charges: totals.courier,
            net_total: totals.net,
            paid_amount: 0,
            remaining_amount: totals.net,
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
                    trade_price: r.trade_price,
                    discount: (r.discPercent / 100) * r.amount,
                    gst_amount: 0,
                    subtotal: r.amount
                };
            })
                .filter(r => r.item_id !== null)
        };
        console.log(payload);
        router.post("/purchase", payload, {
            onSuccess: () => {
                alert("Purchase saved successfully!");
                // Optional: reset form or redirect
            },
            onError: (errors) => {
                console.error(errors);
                alert("Failed to save purchase. Check console for details.");
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Table area */}
                        <div className="col-span-1 lg:col-span-9">
                            <Card className="p-0 overflow-hidden gap-0">
                                <div className="overflow-x-auto">
                                    <div className="min-w-[1000px]">
                                        {/* Table Header (sticky) */}
                                        <div className="grid grid-cols-12 bg-secondary/50 backdrop-blur-sm p-2 text-xs font-semibold border-b sticky top-0 z-10">

                                            <div className="col-span-3">+ Item Selection</div>
                                            <div className="col-span-1 text-center">Full</div>
                                            <div className="col-span-1 text-center">Pcs</div>
                                            <div className="col-span-1 text-center">B.Full</div>
                                            <div className="col-span-1 text-center">B.Pcs</div>
                                            <div className="col-span-1 text-right">Rate</div>
                                            <div className="col-span-1 text-right">Disc %</div>
                                            <div className="col-span-1 text-right">After Disc</div>
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
                                        <div className="max-h-[374px] overflow-auto">
                                            {rowsWithComputed.map((row) => (
                                                <div key={row.id} className="grid grid-cols-12 gap-1 p-2 border-b items-center text-sm">


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
                                                            options={itemOptions}
                                                            value={itemOptions.find((opt) => opt.value === row.item_id) || null}
                                                            onChange={(opt) => handleSelectItem(row.id, Number(opt?.value))}
                                                            placeholder="Select item"
                                                            isClearable
                                                        />
                                                    </div>

                                                    <div className="col-span-1">
                                                        <Input
                                                            value={row.full}
                                                            onChange={(e) => updateRow(row.id, { full: toNumber(e.target.value) })}
                                                            onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                        />
                                                    </div>

                                                    <div className="col-span-1">
                                                        <Input
                                                            value={row.pcs}
                                                            onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })}
                                                            onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                        />
                                                    </div>

                                                    <div className="col-span-1">
                                                        <Input
                                                            value={row.bonus_full}
                                                            onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })}
                                                            onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                        />
                                                    </div>

                                                    <div className="col-span-1">
                                                        <Input
                                                            value={row.bonus_pcs}
                                                            onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })}
                                                            onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                        />
                                                    </div>

                                                    <div className="col-span-1 relative">
                                                        <Input
                                                            className={`text-right ${(row.last_purchase_rate ?? 0) > 0 && row.rate > (row.last_purchase_rate ?? 0) ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : ""}`}
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
                                                            className="text-right"
                                                            value={row.discPercent}
                                                            onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })}
                                                            onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                        />
                                                    </div>

                                                    <div className="col-span-1">
                                                        <Input
                                                            className="text-right bg-secondary/20"
                                                            value={(row.rate * (1 - row.discPercent / 100)).toFixed(2)}
                                                            readOnly
                                                            onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                                        />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <Input
                                                            className="text-right"
                                                            value={(row.amount - (row.amount * row.discPercent / 100) + (row.amount * row.taxPercent / 100)).toFixed(2)}
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
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer summary for table (quick totals) */}
                                    <div className="p-3 border-t grid grid-cols-3 gap-4 bg-secondary/20">
                                        <div>
                                            <div className="text-xs text-muted-foreground">Rows</div>
                                            <div className="text-lg font-semibold">{rowsWithComputed.length}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Gross</div>
                                            <div className="text-lg font-semibold text-green-700">{totals.gross}</div>
                                        </div>
                                        {totals.discTotal > 0 && (
                                            <div>
                                                <div className="text-xs text-muted-foreground">Discount</div>
                                                <div className="text-lg font-semibold text-red-500">{totals.discTotal}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Bottom fields / stock & supplier info */}
                            <Card className="py-1 px-4 mt-2 bg-secondary/10 backdrop-blur-sm gap-2 border-2">
                                {selectedItem ? (
                                    <>
                                        {/* Header */}
                                        <div className="mb-1 pb-2 border-b-2 border-border">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                {selectedItem.title}
                                                {selectedItem.short_name && (
                                                    <span className="text-sm font-normal text-muted-foreground">({selectedItem.short_name})</span>
                                                )}
                                            </h3>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            {/* Packing Qty */}
                                            <div className="bg-secondary/20 rounded-lg p-4 border border-border">
                                                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Packing Qty</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold">{toNumber(selectedItem.packing_full || selectedItem.packing_qty)}</span>
                                                    <span className="text-xs font-normal text-muted-foreground">pcs/full</span>
                                                </div>
                                            </div>

                                            {/* Stock (Cartons) */}
                                            <div className="bg-secondary/20 rounded-lg p-4 border border-border">
                                                <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Stock (Full)</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold">
                                                        {Math.floor(toNumber(selectedItem.stock_1) / (toNumber(selectedItem.packing_qty) || 1))}
                                                    </span>
                                                    <span className="text-xs font-normal text-muted-foreground">full</span>
                                                </div>
                                            </div>

                                            {/* Stock (Pieces) */}
                                            <div className="bg-secondary/20 rounded-lg p-4 border border-border">
                                                <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Stock (Pieces)</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold">
                                                        {toNumber(selectedItem.stock_1) % (toNumber(selectedItem.packing_qty) || 1)}
                                                    </span>
                                                    <span className="text-xs font-normal text-muted-foreground">pcs</span>
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
                                            <div className="bg-secondary/20 rounded-lg p-4 border border-border">
                                                <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Trade Price</div>
                                                <div className="text-2xl font-bold">
                                                    <span className="text-lg mr-1">Rs</span>
                                                    {toNumber(selectedItem.trade_price).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Retail Price */}
                                            <div className="bg-secondary/20 rounded-lg p-4 border border-border">
                                                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Retail Price</div>
                                                <div className="text-2xl font-bold">
                                                    <span className="text-lg mr-1">Rs</span>
                                                    {toNumber(selectedItem.retail).toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Average Price */}
                                            <div className="bg-secondary/20 rounded-lg p-4 border border-border">
                                                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Average Price</div>
                                                <div className="text-2xl font-bold">
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

                                        {/* Last Purchase History Section - Separate Professional Box */}
                                        {(selectedItem && (lastPurchaseInfo || loadingPurchaseInfo)) && (
                                            <div className="mt-4 pt-4 border-t-2 border-dashed border-border">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-md font-bold uppercase tracking-wide flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                        Last Purchase History
                                                    </h3>
                                                    {lastPurchaseInfo?.last_purchase_date && (
                                                        <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                                            {new Date(lastPurchaseInfo.last_purchase_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="bg-secondary/10 rounded-lg p-4 border border-border">
                                                    {loadingPurchaseInfo ? (
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                                                            <div className="h-10 bg-muted/50 rounded"></div>
                                                            <div className="h-10 bg-muted/50 rounded"></div>
                                                            <div className="h-10 bg-muted/50 rounded"></div>
                                                            <div className="h-10 bg-muted/50 rounded"></div>
                                                        </div>
                                                    ) : lastPurchaseInfo ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border">

                                                            {/* Last Qty */}
                                                            <div className="px-2">
                                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Previous Qty</div>
                                                                <div className="text-lg font-bold">
                                                                    {toNumber(lastPurchaseInfo.previous_qty_carton)}
                                                                    <span className="text-xs font-normal text-muted-foreground ml-1">full</span>
                                                                    <span className="text-muted-foreground/30 mx-1">|</span>
                                                                    {toNumber(lastPurchaseInfo.previous_qty_pcs)}
                                                                    <span className="text-xs font-normal text-muted-foreground ml-1">pcs</span>
                                                                </div>
                                                            </div>

                                                            {/* Last Retail Price */}
                                                            <div className="px-2 pl-4">
                                                                <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Last Retail Price</div>
                                                                <div className="text-lg font-bold">
                                                                    ₨ {toNumber(lastPurchaseInfo.previous_retail_price).toFixed(2)}
                                                                </div>
                                                            </div>

                                                            {/* Average Price */}
                                                            <div className="px-2 pl-4">
                                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Average Price</div>
                                                                <div className="text-lg font-bold">
                                                                    ₨ {toNumber(lastPurchaseInfo.average_price).toFixed(2)}
                                                                </div>
                                                            </div>

                                                            {/* Company */}
                                                            <div className="px-2 pl-4">
                                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Company</div>
                                                                <div className="text-md font-bold truncate" title={lastPurchaseInfo.company}>
                                                                    {lastPurchaseInfo.company || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-sm text-muted-foreground py-2">
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
                        </div>

                        {/* Right summary panel */}
                        <div className="col-span-1 lg:col-span-3">
                            <Card className="p-4 space-y-3 sticky lg:top-[120px] gap-0">


                                <div className="pt-2">
                                    <div className="text-xs font-semibold">Gross Amount</div>
                                    <div className="text-xl font-bold">{totals.gross}</div>
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
                                    <div className="text-xl font-bold">{totals.net}</div>
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
                                {/* Message Line Select */}
                                <div className="pt-2">
<FieldWrapper label="Select Message Line" className="lg:col-span-2">
                                    <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                                        <SelectTrigger className="w-full h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors bg-sky-50/30">
                                            <SelectValue placeholder="No Message Line (Optional)" />
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
                                </FieldWrapper>
                                </div>
                                

                                <div>
                                    <div className="text-xs font-semibold">Total Receivable</div>
                                    <div className="text-xl font-bold">{totals.totalReceivable}</div>
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <Button onClick={handleSave}>Save</Button>
                                    <Button variant="outline" onClick={() => alert("Cancel")}>Cancel</Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset >
        </SidebarProvider >
    );
}
