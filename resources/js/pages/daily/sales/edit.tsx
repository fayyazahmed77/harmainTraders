// sales.tsx
import React, { useState, useMemo } from "react";
import ReactSelect from "react-select";
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

/**
 * Local screenshot path (you uploaded this file).
 * The system will convert this into a URL if needed.
 */


// ───────────────────────────────────────────
// Breadcrumbs
// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Sales", href: "/sales" },
  { title: "Edit Invoice", href: "#" },
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
  pt2?: number;
  pt3?: number;
  pt4?: number;
  pt5?: number;
  pt6?: number;
  pt7?: number;
  // any other fields you may have
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
  code?: string;
  aging_days?: number;
  credit_limit?: number | string;
  saleman_id?: number;
  item_category?: string | null;
}

interface Saleman {
  id: number;
  name: string;
}

interface MessageLine {
  id: number;
  messageline: string;
}

interface Option {
  value: number;
  label: string;
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

export default function SalesEditPage({ items, accounts, salemans, sale, messageLines = [] }: { items: Item[]; accounts: Account[]; salemans: Saleman[]; sale: any; messageLines?: MessageLine[] }) {
  // Header / meta fields
  const [date, setDate] = useState<Date | undefined>(sale ? new Date(sale.date) : new Date());
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string>(sale?.code ?? "");
  const [party, setParty] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<number | "">(sale?.customer?.credit_limit ? Number(sale.customer.credit_limit) : "");
  const [creditDays, setCreditDays] = useState<number>(sale?.customer?.aging_days ?? 0);
  const [active, setActive] = useState<boolean>(true);
  const [invoiceNo, setInvoiceNo] = useState<string>(sale?.invoice ?? "");
  const [salesman, setSalesman] = useState<number | null>(sale?.salesman_id ?? null);
  const [cashCredit, setCashCredit] = useState<string>("CREDIT");
  const [itemsCount, setItemsCount] = useState<number>(items.length);
  const [accountType, setAccountType] = useState<Option | null>(
    sale?.customer ? { value: sale.customer.id, label: sale.customer.title } : null
  );
  const [courier, setCourier] = useState<number>(toNumber(sale?.courier_charges));
  const [printOption, setPrintOption] = useState<"big" | "small">("big");
  const [customerCategory, setCustomerCategory] = useState<string | null>(
    sale?.customer?.item_category ? String(sale.customer.item_category) : null
  );
  const [selectedMessageId, setSelectedMessageId] = useState<string>(sale?.message_line_id ? sale.message_line_id.toString() : "0");

  // Create account options
  const accountTypeOptions: Option[] = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.id,
      label: acc.title,
    }));
  }, [accounts]);

  const salemanMap = useMemo(() => {
    const m = new Map<number, string>();
    salemans.forEach(s => m.set(s.id, s.name));
    return m;
  }, [salemans]);

  const itemOptions = useMemo(() => {
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
  });

  const [rows, setRows] = useState<RowData[]>(
    sale?.items?.length > 0
      ? sale.items.map((it: any) => ({
        id: it.id,
        item_id: it.item_id,
        full: it.qty_carton,
        pcs: it.qty_pcs,
        bonus_full: it.bonus_full ?? 0,
        bonus_pcs: it.bonus_pcs ?? 0,
        rate: it.trade_price,
        taxPercent: it.subtotal > 0 ? (it.gst_amount / it.subtotal) * 100 : 0,
        discPercent: it.subtotal > 0 ? (it.discount / it.subtotal) * 100 : 0,
        trade_price: it.trade_price,
        amount: it.subtotal,
      }))
      : [getEmptyRow()]
  );

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
      const baseRate = toNumber(it.retail ?? it.trade_price ?? 0); // Use retail price first for sales
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
        trade_price: toNumber(it.retail ?? it.trade_price ?? baseRate), // Use retail for sales
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

    const baseRate = toNumber(selected.retail ?? selected.trade_price ?? 0); // Use retail price first for sales
    const tax = toNumber(selected.gst_percent ?? 0);
    const disc = toNumber(selected.discount ?? 0);
    const tradePrice = toNumber(selected.retail ?? selected.trade_price ?? baseRate); // Use retail for sales

    let finalRate = baseRate;
    // Auto-calculate rate based on customer category (TP2-TP7)
    const actualTradePrice = toNumber(selected.trade_price ?? 0);
    if (customerCategory && actualTradePrice > 0) {
      let percentage = 0;
      switch (customerCategory) {
        case "2": percentage = toNumber(selected.pt2); break;
        case "3": percentage = toNumber(selected.pt3); break;
        case "4": percentage = toNumber(selected.pt4); break;
        case "5": percentage = toNumber(selected.pt5); break;
        case "6": percentage = toNumber(selected.pt6); break;
        case "7": percentage = toNumber(selected.pt7); break;
      }

      if (percentage > 0) {
        finalRate = Math.round(actualTradePrice * (1 + percentage / 100));
      }
    }

    updateRow(rowId, { item_id: itemId, rate: finalRate, taxPercent: tax, discPercent: disc, trade_price: tradePrice });

    // Set this item as the selected one to display info below
    setSelectedItemId(itemId);
  };

  // Recalculate a row amount whenever rate/full/pcs/bonus changes
  const recalcRowAmount = (row: RowData, item?: Item) => {
    const packing = toNumber(item?.packing_full ?? item?.packing_qty ?? 1);
    const totalUnits = toNumber(row.full) * packing + toNumber(row.pcs) + toNumber(row.bonus_full) * packing + toNumber(row.bonus_pcs);
    // Here amount uses rate * normal units (excluding bonus if you want)
    // Commonly bonus is free, adjust logic if you want to exclude/add differently.
    const normalUnits = toNumber(row.full) * packing + toNumber(row.pcs);
    const amount = normalUnits * toNumber(row.rate);
    return amount;
  };

  // update amounts when rows change
  const rowsWithComputed = useMemo(() => {
    // Calculate total usage per item across all rows to handle multiple rows for same item
    const itemUsage = new Map<number, number>();
    rows.forEach(r => {
      if (r.item_id) {
        const item = items.find(it => it.id === r.item_id);
        if (item) {
          const packing = toNumber(item.packing_full ?? item.packing_qty ?? 1);
          const qty = (r.full * packing) + r.pcs + (r.bonus_full * packing) + r.bonus_pcs;
          const current = itemUsage.get(r.item_id) || 0;
          itemUsage.set(r.item_id, current + qty);
        }
      }
    });

    return rows.map((r) => {
      const item = items.find((it) => it.id === r.item_id) ?? undefined;
      const amount = recalcRowAmount(r, item);

      let stockExceeded = false;
      if (item) {
        const totalUsage = itemUsage.get(item.id) || 0;
        if (totalUsage > (item.stock_1 ?? 0)) {
          stockExceeded = true;
        }
      }

      // Loss warning logic: check if rate is less than the minimum of defined prices (Retail, PT2-PT7)
      let isLoss = false;
      if (item) {
        // Collect all potential price points
        const allRates = [item.retail, item.pt2, item.pt3, item.pt4, item.pt5, item.pt6, item.pt7];
        // Filter out undefined/null/zero
        const validRates = allRates
          .map(r => toNumber(r))
          .filter(r => r > 0);

        if (validRates.length > 0) {
          const minPrice = Math.min(...validRates);
          // If user rate is strictly less than the lowest marked price
          if (toNumber(r.rate) < minPrice) {
            isLoss = true;
          }
        }
      }

      return { ...r, amount, stockExceeded, isLoss };
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
    const net = gross + taxTotal - discTotal + courier;

    return {
      gross: Number(gross.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discTotal: Number(discTotal.toFixed(2)),
      courier,
      net: Number(net.toFixed(2)),
      previousBalance,
      cashReceived,
      totalReceivable: Number((net + previousBalance - cashReceived).toFixed(2)),
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
    // Validation: Check for stock availability
    const stockErrors = rowsWithComputed.filter(r => r.stockExceeded);
    if (stockErrors.length > 0) {
      alert("Cannot save: One or more items exceed available stock. Please check highlighted rows.");
      return;
    }

    const payload = {
      date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      invoice: invoiceNo,
      code: code,
      customer_id: accountType?.value,
      salesman_id: salesman,
      no_of_items: rowsWithComputed.length,

      gross_total: totals.gross,
      discount_total: totals.discTotal,
      tax_total: totals.taxTotal,
      courier_charges: totals.courier,
      net_total: totals.net,
      message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,
      paid_amount: sale?.paid_amount ?? 0,
      remaining_amount: totals.net - (sale?.paid_amount ?? 0),

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
          retail_price: r.trade_price,
          discount: (r.discPercent / 100) * r.amount,
          gst_amount: (r.taxPercent / 100) * r.amount,
          subtotal: r.amount
        };
      })
        .filter(r => r.item_id !== null),

      print_format: printOption
    };
    console.log(payload);
    router.put(`/sales/${sale.id}`, payload, {
      onSuccess: () => {
        // alert("Sale updated successfully!");
        // The backend handles redirection to print now
      },
      onError: (errors) => {
        console.error(errors);
        alert("Failed to update sale. Check console for details.");
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

                  // set the Option object as before (keeps UI state)
                  const selectedOption = accountTypeOptions.find((s) => s.value === id) ?? null;
                  setAccountType(selectedOption);

                  // autofill credit days / credit limit / salesman from account
                  if (selectedAccount) {
                    setCreditDays(selectedAccount.aging_days ?? 0);
                    setCreditLimit(typeof selectedAccount.credit_limit === "number" ? selectedAccount.credit_limit : (selectedAccount.credit_limit ? Number(selectedAccount.credit_limit) : ""));

                    // lookup salesman name by saleman_id (if available)
                    const salemanId = selectedAccount.saleman_id ?? null;
                    setSalesman(salemanId);
                    setCode(selectedAccount.code ?? "");
                    setCustomerCategory(selectedAccount.item_category ? String(selectedAccount.item_category) : null);
                  } else {
                    // clear if no account
                    setCreditDays(0);
                    setCreditLimit("");
                    setSalesman(null);
                    setCustomerCategory(null);
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
              <Select
                value={salesman?.toString() || ""}
                onValueChange={(val) => setSalesman(val ? Number(val) : null)}
              >
                <SelectTrigger className="h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors bg-background">
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
                  <div className="col-span-1 text-center">Rate</div>
                  <div className="col-span-1 text-center">Tax</div>
                  <div className="col-span-1 text-center">Disc %</div>
                  <div className="col-span-1 text-center italic">After Disc Rate</div>
                  <div className="col-span-1 text-center font-bold">Total Disc</div>
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
                    <div key={row.id} className={`grid grid-cols-12 gap-1 p-2 border-b items-center text-sm ${row.stockExceeded ? 'bg-red-100 border-red-300' : ''}`}>


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
                        {row.isLoss && (
                          <span className="text-[10px] text-red-500 font-bold ml-1 animate-pulse absolute -bottom-4 bg-white/80 px-1 rounded z-20">
                            ⚠️ your in lost
                          </span>
                        )}
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
                        <Input className="text-right" value={row.discPercent} onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                      </div>

                      <div className="col-span-1">
                        <Input className="text-right italic bg-slate-50" value={(row.rate * (1 - row.discPercent / 100)).toFixed(2)} readOnly onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                      </div>
                      <div className="col-span-1">
                        <Input className="text-right font-bold bg-slate-100" value={(row.amount * (1 - row.discPercent / 100)).toFixed(2)} readOnly onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
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
                          <span className="text-sm font-normal text-gray-500 ml-1">pcs/full</span>
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

                        const remainingStock = currentStock - enteredQty;

                        return (
                          <>
                            {/* Stock Full */}
                            <div className="bg-white rounded-md p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                              <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Stock (Full)</div>
                              <div className={`text-2xl font-bold ${remainingStock < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                {Math.floor(remainingStock / packing)}
                                <span className="text-sm font-normal text-gray-500 ml-1">full</span>
                              </div>
                            </div>

                            {/* Stock Pcs */}
                            <div className="bg-white rounded-md p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                              <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Stock (Pieces)</div>
                              <div className={`text-2xl font-bold ${remainingStock < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                {remainingStock % packing}
                                <span className="text-sm font-normal text-gray-500 ml-1">pcs</span>
                              </div>
                            </div>

                            {/* Total Stock */}
                            <div className={`bg-gradient-to-br ${remainingStock < 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-emerald-600'} rounded-md p-4 shadow-md text-white hover:shadow-lg transition-shadow`}>
                              <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-90">Total Stock</div>
                              <div className="text-2xl font-bold">
                                {remainingStock}
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

                      {/* Retail Price */}
                      <div className="bg-white rounded-md p-4 shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                        <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Retail Price</div>
                        <div className="text-2xl font-bold text-gray-800">
                          ₨ {toNumber(selectedItem.retail).toFixed(2)}
                        </div>
                      </div>

                      {/* Average Price */}
                      <div className="bg-white rounded-md p-4 shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
                        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Average Price</div>
                        <div className="text-2xl font-bold text-gray-800">
                          ₨ {((toNumber(selectedItem.trade_price) + toNumber(selectedItem.retail)) / 2).toFixed(2)}
                        </div>
                      </div>

                      {/* Company */}
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md p-4 shadow-md text-white hover:shadow-lg transition-shadow">
                        <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-90">Company</div>
                        <div className="text-lg font-bold truncate" title={selectedItem.company ?? 'N/A'}>
                          {selectedItem.company || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Additional Prices Grid */}
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {[2, 3, 4, 5, 6, 7].map((num) => {
                        const priceKey = `pt${num}` as keyof Item;
                        const percentage = toNumber(selectedItem[priceKey]);
                        if (percentage === 0) return null;

                        const tradePrice = toNumber(selectedItem.trade_price);
                        const calculatedPrice = Math.round(tradePrice * (1 + percentage / 100));
                        const isActive = String(num) === customerCategory;

                        return (
                          <div key={num} className={`backdrop-blur-sm rounded-lg p-3 shadow-sm border transition-all group ${isActive ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 ring-1 ring-orange-500 shadow-md' : 'bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-orange-500/50 hover:shadow-md'}`}>
                            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors ${isActive ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-500'}`}>Price Type {num} <span className={`text-[9px] normal-case ml-1 ${isActive ? 'text-orange-600/70' : 'text-gray-400'}`}>({percentage}%)</span></div>
                            <div className={`text-lg font-bold ${isActive ? 'text-orange-700 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'}`}>
                              ₨ {calculatedPrice.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
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
                {isOverLimit && (
                  <div className="p-2 mb-2 bg-red-100 border border-red-400 text-red-700 text-sm font-bold rounded animate-pulse">
                    ⚠️ Exceeds Credit Limit!
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold">Detail L</div>
                  <Input placeholder="" />
                </div>


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
                  <Select value={printOption} onValueChange={(v: any) => setPrintOption(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Print Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="big">Big (A4)</SelectItem>
                      <SelectItem value="small">Small (Thermal)</SelectItem>
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
                      {messageLines && messageLines.map((msg) => (
                        <SelectItem key={msg.id} value={msg.id.toString()}>
                          {msg.messageline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-xs font-semibold">Total Receivable</div>
                  <div className="text-xl font-bold">{totals.totalReceivable.toFixed(2)}</div>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSave}>Update Invoice</Button>
                  <Button variant="outline" onClick={() => alert("Cancel")}>Cancel</Button>
                </div>
              </Card>
            </div>
          </div>
        </div >
      </SidebarInset >
    </SidebarProvider >
  );
}
