// sales_return/create.tsx
import React, { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { Trash2, Plus, CalendarIcon, ListRestart, RotateCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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

// ───────────────────────────────────────────
// Breadcrumbs
// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: "Sales Return", href: "/sales-return" },
    { title: "New Return", href: "/sales-return/create" },
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
}

interface RowData {
    id: number;
    item_id: number | null;
    full: number; // full cartons
    pcs: number; // single pcs
    bonus_full: number;
    bonus_pcs: number;
    sold_full?: number; // Original sold full
    sold_pcs?: number; // Original sold pcs
    rate: number;
    taxPercent: number;
    discPercent: number;
    trade_price: number;
    amount: number;
}

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
interface Account {
    id: number;
    title: string;
    aging_days?: number;
    credit_limit?: number | string;
    saleman_id?: number;
}

interface Saleman {
    id: number;
    name: string;
}

interface Option {
    value: number;
    label: string;
}

export default function SalesReturnCreatePage({ items, accounts, salemans, sale }: { items: Item[]; accounts: Account[]; salemans: Saleman[]; sale?: any }) {
    // Header / meta fields
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState<string>("");
    const [originalInvoice, setOriginalInvoice] = useState<string>("");
    const [creditLimit, setCreditLimit] = useState<number | "">("");
    const [creditDays, setCreditDays] = useState<number>(0);
    const [invoiceNo, setInvoiceNo] = useState<string>("");
    const [salesman, setSalesman] = useState<number | null>(null);
    const [cashCredit, setCashCredit] = useState<string>("CREDIT");
    const [itemsCount, setItemsCount] = useState<number>(items.length);
    const [refundAmount, setRefundAmount] = useState<number>(0);
    const [accountType, setAccountType] = useState<Option | null>(null);

    // Create account options
    const accountTypeOptions: Option[] = useMemo(() => {
        return accounts.map((acc) => ({
            value: acc.id,
            label: acc.title,
        }));
    }, [accounts]);

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
    });

    const [rows, setRows] = useState<RowData[]>(() => {
        if (sale && sale.items) {
            return sale.items.map((saleItem: any) => {
                const item = saleItem.item;
                const baseRate = toNumber(item.retail ?? item.trade_price ?? 0);
                // Pre-fill with 0 return quantity, but show original price/tax/disc
                return {
                    id: Date.now() + item.id + Math.random(),
                    item_id: item.id,
                    full: 0,
                    pcs: 0,
                    bonus_full: 0,
                    bonus_pcs: 0,
                    sold_full: toNumber(saleItem.qty_carton),
                    sold_pcs: toNumber(saleItem.qty_pcs),
                    rate: toNumber(saleItem.trade_price), // Use price from sale
                    taxPercent: toNumber(item.gst_percent ?? 0),
                    discPercent: toNumber(item.discount ?? 0), // Or calculate from saleItem?
                    trade_price: toNumber(saleItem.trade_price),
                    amount: 0,
                };
            });
        }
        return [getEmptyRow()];
    });

    // Initialize state from sale if present
    React.useEffect(() => {
        if (sale) {
            setOriginalInvoice(sale.invoice);
            setSalesman(sale.salesman_id);

            // Find account option
            const accountOption = accountTypeOptions.find(opt => opt.value === sale.customer_id);
            if (accountOption) {
                setAccountType(accountOption);
                const selectedAccount = accounts.find((a) => a.id === sale.customer_id);
                if (selectedAccount) {
                    setCreditDays(selectedAccount.aging_days ?? 0);
                    setCreditLimit(typeof selectedAccount.credit_limit === "number" ? selectedAccount.credit_limit : (selectedAccount.credit_limit ? Number(selectedAccount.credit_limit) : ""));
                }
            }
        }
    }, [sale, accountTypeOptions, accounts]);

    // Track the currently selected item for displaying info
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    // Get the currently selected item details
    const selectedItem = useMemo(() => {
        if (!selectedItemId) return null;
        return items.find((it) => it.id === selectedItemId) ?? null;
    }, [selectedItemId, items]);

    // Function to load all items
    const loadAllItems = () => {
        const allItemRows: RowData[] = items.map((it) => {
            const baseRate = toNumber(it.retail ?? it.trade_price ?? 0);
            const packing = toNumber(it.packing_full ?? it.packing_qty ?? 1);
            const defaultFull = 0;
            const defaultPcs = 0;
            const totalUnits = defaultFull * packing + defaultPcs;
            const amount = totalUnits * baseRate;

            return {
                id: Date.now() + it.id + Math.random(),
                item_id: it.id,
                full: defaultFull,
                pcs: defaultPcs,
                bonus_full: 0,
                bonus_pcs: 0,
                rate: baseRate,
                taxPercent: toNumber(it.gst_percent ?? 0),
                discPercent: toNumber(it.discount ?? 0),
                trade_price: toNumber(it.retail ?? it.trade_price ?? baseRate),
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
    const handleSelectItem = (rowId: number, itemId: number) => {
        const selected = items.find((it) => it.id === itemId);
        if (!selected) return;

        const baseRate = toNumber(selected.retail ?? selected.trade_price ?? 0);
        const tax = toNumber(selected.gst_percent ?? 0);
        const disc = toNumber(selected.discount ?? 0);
        const tradePrice = toNumber(selected.retail ?? selected.trade_price ?? baseRate);

        updateRow(rowId, { item_id: itemId, rate: baseRate, taxPercent: tax, discPercent: disc, trade_price: tradePrice });
        setSelectedItemId(itemId);
    };

    // Recalculate a row amount whenever rate/full/pcs/bonus changes
    const recalcRowAmount = (row: RowData, item?: Item) => {
        const packing = toNumber(item?.packing_full ?? item?.packing_qty ?? 1);
        const normalUnits = toNumber(row.full) * packing + toNumber(row.pcs);
        const amount = normalUnits * toNumber(row.rate);
        return amount;
    };

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
        let taxTotal = 0;
        let discTotal = 0;

        rowsWithComputed.forEach((r) => {
            const amount = r.amount;
            gross += amount;

            const tax = (toNumber(r.taxPercent) / 100) * amount;
            taxTotal += tax;

            const disc = (toNumber(r.discPercent) / 100) * amount;
            discTotal += disc;
        });

        const net = gross + taxTotal - discTotal;

        return {
            gross: Number(gross.toFixed(2)),
            taxTotal: Number(taxTotal.toFixed(2)),
            discTotal: Number(discTotal.toFixed(2)),
            net: Number(net.toFixed(2)),
        };
    }, [rowsWithComputed]);

    // ───────────────────────────────────────────
    // Simple renderer / layout
    // ───────────────────────────────────────────
    const handleSave = async () => {
        const payload = {
            date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            invoice: invoiceNo,
            original_invoice: originalInvoice,
            customer_id: accountType?.value,
            salesman_id: salesman,
            no_of_items: rowsWithComputed.length,

            gross_total: totals.gross,
            discount_total: totals.discTotal,
            tax_total: totals.taxTotal,
            net_total: totals.net,

            paid_amount: refundAmount, // Send refund amount
            remaining_amount: totals.net - refundAmount,

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
                    gst_amount: (r.taxPercent / 100) * r.amount,
                    subtotal: r.amount
                };
            })
                .filter(r => r.item_id !== null)
        };

        router.post("/sales-return", payload, {
            onSuccess: () => {
                alert("Sales Return saved successfully!");
            },
            onError: (errors) => {
                console.error(errors);
                alert("Failed to save sales return. Check console for details.");
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
                    <Card className="p-4 grid grid-cols-12 gap-3 items-center">
                        {/* Date Picker */}
                        <div className="col-span-1 flex flex-col gap-3">
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date-picker"
                                        className="w-full justify-between font-normal"
                                    >
                                        {date ? date.toLocaleDateString() : "Select date"}
                                        <CalendarIcon />
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
                        </div>

                        {/* Account Select */}
                        <div className="col-span-2">
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

                                        // Fetch customer's purchased items
                                        fetch(`/sales-return/customer/${id}/purchased-items`)
                                            .then(res => res.json())
                                            .then(data => {
                                                if (data && Array.isArray(data)) {
                                                    // Create rows from purchased items
                                                    const purchasedRows: RowData[] = data.map((purchasedItem: any) => {
                                                        const item = purchasedItem.item;
                                                        const baseRate = toNumber(item.retail ?? item.trade_price ?? 0);

                                                        return {
                                                            id: Date.now() + item.id + Math.random(),
                                                            item_id: item.id,
                                                            full: 0, // User will enter return quantity
                                                            pcs: 0,
                                                            bonus_full: 0,
                                                            bonus_pcs: 0,
                                                            rate: baseRate,
                                                            taxPercent: toNumber(item.gst_percent ?? 0),
                                                            discPercent: toNumber(item.discount ?? 0),
                                                            trade_price: toNumber(purchasedItem.last_trade_price ?? item.retail ?? item.trade_price ?? baseRate),
                                                            amount: 0,
                                                        };
                                                    });

                                                    if (purchasedRows.length > 0) {
                                                        setRows(purchasedRows);
                                                    }
                                                }
                                            })
                                            .catch(err => {
                                                console.error('Error fetching customer items:', err);
                                            });
                                    } else {
                                        setCreditDays(0);
                                        setCreditLimit("");
                                        setSalesman(null);
                                        setRows([getEmptyRow()]);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
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
                        </div>

                        {/* Original Invoice # */}
                        <Input
                            className="col-span-1"
                            placeholder="Orig. Inv #"
                            value={originalInvoice}
                            onChange={(e) => setOriginalInvoice(e.target.value)}
                        />

                        {/* Salesman */}
                        <Input
                            className="col-span-1"
                            placeholder="Salesman"
                            value={salesman ?? ""}
                            onChange={(e) => setSalesman(e.target.value ? Number(e.target.value) : null)}
                        />

                        {/* Return Invoice # */}
                        <Input
                            className="col-span-1"
                            placeholder="Return Inv #"
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                        />

                        {/* Items # */}
                        <Input
                            className="col-span-1"
                            placeholder="Items #"
                            value={itemsCount}
                            onChange={(e) => setItemsCount(Number(e.target.value))}
                        />
                    </Card>

                    {/* Items table + right summary */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* Table area */}
                        <div className="col-span-9">
                            <Card className="p-0 overflow-hidden gap-0">
                                {/* Table Header (sticky) */}
                                <div className="grid grid-cols-12 bg-gray-100 p-2 text-xs font-semibold border-b sticky top-0 z-10">
                                    <div className="col-span-2">+ Item Selection</div>
                                    <div className="col-span-1 text-center bg-yellow-100">Sold Ctn</div>
                                    <div className="col-span-1 text-center bg-yellow-100">Sold Pcs</div>
                                    <div className="col-span-1 text-center">Full</div>
                                    <div className="col-span-1 text-center">Pcs</div>
                                    <div className="col-span-1 text-center">B.Full</div>
                                    <div className="col-span-1 text-center">B.Pcs</div>
                                    <div className="col-span-1 text-center">Rate</div>
                                    <div className="col-span-1 text-center">Tax</div>
                                    <div className="col-span-1 text-center">Total</div>
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
                                <div className="max-h-[360px] overflow-auto">
                                    {rowsWithComputed.map((row) => (
                                        <div key={row.id} className="grid grid-cols-12 gap-1 p-2 border-b items-center text-sm">
                                            <div className="col-span-2 flex items-center justify-center">
                                                <Select
                                                    value={row.item_id?.toString() ?? ""}
                                                    onValueChange={(val) => handleSelectItem(row.id, Number(val))}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Items</SelectLabel>
                                                            {items.map((it) => (
                                                                <SelectItem key={it.id} value={it.id.toString()}>
                                                                    {it.title} {it.short_name ? `(${it.short_name})` : ""}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-1">
                                                <Input className="bg-yellow-50 text-center" value={row.sold_full ?? 0} readOnly />
                                            </div>
                                            <div className="col-span-1">
                                                <Input className="bg-yellow-50 text-center" value={row.sold_pcs ?? 0} readOnly />
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

                                            <div className="col-span-1">
                                                <Input className="text-right" value={row.rate} onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1">
                                                <Input className="text-right" value={row.taxPercent} onChange={(e) => updateRow(row.id, { taxPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1">
                                                <Input className="text-right" value={row.amount.toFixed(2)} readOnly onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                                            </div>

                                            <div className="col-span-1 flex items-center gap-1 justify-center">
                                                <Button variant="outline" size="icon" className="h-7 w-7 p-1 bg-red-500 rounded-sm  text-white hover:bg-red-300 cursor-pointer" onClick={() => removeRow(row.id)}>
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
                                        <div className="text-lg font-semibold text-green-700">{totals.gross.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Tax</div>
                                        <div className="text-lg font-semibold text-blue-500">{totals.taxTotal.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Discount</div>
                                        <div className="text-lg font-semibold text-red-500">{totals.discTotal.toFixed(2)}</div>
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
                                        <div className="grid grid-cols-4 gap-2">
                                            {/* Packing Info */}
                                            <div className="bg-white rounded-md p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                                                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Packing Qty</div>
                                                <div className="text-2xl font-bold text-gray-800">
                                                    {toNumber(selectedItem.packing_full || selectedItem.packing_qty)}
                                                    <span className="text-sm font-normal text-gray-500 ml-1">pcs/ctn</span>
                                                </div>
                                            </div>

                                            {/* Live Stock Calculation Logic */}
                                            {(() => {
                                                const packing = toNumber(selectedItem.packing_full || selectedItem.packing_qty || 1);
                                                const currentStock = toNumber(selectedItem.stock_1);

                                                // Find the row corresponding to this item to subtract entered quantity
                                                const activeRow = rows.find(r => r.item_id === selectedItem.id);
                                                const enteredQty = activeRow
                                                    ? (toNumber(activeRow.full) * packing) + toNumber(activeRow.pcs)
                                                    : 0;

                                                // For Return, we are ADDING to stock, so remaining stock increases?
                                                // Or should we show current stock + return qty?
                                                // Let's show current stock, and maybe "New Stock"
                                                const newStock = currentStock + enteredQty;

                                                return (
                                                    <>
                                                        {/* Stock Full */}
                                                        <div className="bg-white rounded-md p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                                                            <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Current Stock</div>
                                                            <div className="text-2xl font-bold text-gray-800">
                                                                {Math.floor(currentStock / packing)}
                                                                <span className="text-sm font-normal text-gray-500 ml-1">ctns</span>
                                                            </div>
                                                        </div>

                                                        {/* Stock Pcs */}
                                                        <div className="bg-white rounded-md p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                                                            <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Current Stock (Pcs)</div>
                                                            <div className="text-2xl font-bold text-gray-800">
                                                                {currentStock % packing}
                                                                <span className="text-sm font-normal text-gray-500 ml-1">pcs</span>
                                                            </div>
                                                        </div>

                                                        {/* Total Stock */}
                                                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-md p-4 shadow-md text-white hover:shadow-lg transition-shadow">
                                                            <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-90">Projected Stock</div>
                                                            <div className="text-2xl font-bold">
                                                                {newStock}
                                                                <span className="text-sm font-normal opacity-90 ml-1">pcs</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}

                                            {/* Trade Price */}
                                            <div className="bg-white rounded-md p-4 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                                                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Trade Price</div>
                                                <div className="text-2xl font-bold text-gray-800">
                                                    ₨ {toNumber(selectedItem.trade_price).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
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
                        <div className="col-span-3">
                            <Card className="p-4 space-y-3 sticky top-[120px] gap-0">
                                <div className="pt-2">
                                    <div className="text-xs font-semibold">Gross Amount</div>
                                    <div className="text-xl font-bold">{totals.gross.toFixed(2)}</div>
                                </div>

                                {sale && (
                                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                        <div className="text-xs font-semibold text-yellow-800">Original Invoice Total</div>
                                        <div className="text-lg font-bold text-yellow-900">{toNumber(sale.net_total).toFixed(2)}</div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-xs font-semibold">Net Amount</div>
                                    <div className="text-xl font-bold">{totals.net.toFixed(2)}</div>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold">Refund Amount (Cash)</div>
                                    <Input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                                        className="font-bold text-red-600"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <Button onClick={handleSave}>Save Return</Button>
                                    <Button variant="outline" onClick={() => alert("Cancel")}>Cancel</Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
