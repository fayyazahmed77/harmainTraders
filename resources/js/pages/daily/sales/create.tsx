// sales.tsx
import React, { useState, useMemo } from "react";
import ReactSelect from "react-select";
import axios from "axios";
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
import { useAppearance } from '@/hooks/use-appearance';
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Local screenshot path (you uploaded this file).
 * The system will convert this into a URL if needed.
 */


// ───────────────────────────────────────────
// Breadcrumbs
// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Sales", href: "/sales" },
  { title: "New Invoice", href: "/sales/new" },
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
}

interface Saleman {
  id: number;
  name: string;
}

interface Option {
  value: number;
  label: string;
}

export default function SalesPage({ items, accounts, salemans, paymentAccounts = [], nextInvoiceNo }: { items: Item[]; accounts: Account[]; salemans: Saleman[]; paymentAccounts: Account[]; nextInvoiceNo: string }) {
  const { appearance } = useAppearance();
  const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const selectBg = isDark ? '#0a0a0a' : '#ffffff';
  const selectBorder = isDark ? '#262626' : '#e5e7eb';
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
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
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [printOption, setPrintOption] = useState<"big" | "small">("big");

  // Pay Now State
  const [isPayNow, setIsPayNow] = useState<boolean>(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [processing, setProcessing] = useState<boolean>(false);

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

  const [rows, setRows] = useState<RowData[]>([getEmptyRow()]);

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

    updateRow(rowId, { item_id: itemId, rate: baseRate, taxPercent: tax, discPercent: disc, trade_price: tradePrice });

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
    const totalReceivable = net + previousBalance;

    return {
      gross: Number(gross.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discTotal: Number(discTotal.toFixed(2)),
      courier,
      net: Number(net.toFixed(2)),
      totalReceivable: Number(totalReceivable.toFixed(2)),
    };
  }, [rowsWithComputed, items, courier, previousBalance]);

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
      print_format: printOption,

      // Pay Now Data
      is_pay_now: isPayNow,
      payment_account_id: paymentAccountId,
      payment_method: paymentMethod,

      gross_total: totals.gross,
      discount_total: totals.discTotal,
      tax_total: totals.taxTotal,
      courier_charges: totals.courier,
      net_total: totals.net,
      paid_amount: cashReceived,
      remaining_amount: totals.net - cashReceived,

      items: rowsWithComputed.map((r) => {
        const item = items.find(i => i.id === r.item_id);
        const packing = toNumber(item?.packing_full ?? item?.packing_qty ?? 1);

        const totalPCS = (r.full * packing) + r.pcs + (r.bonus_full * packing) + r.bonus_pcs;

        return {
          item_id: r.item_id,
          qty_carton: r.full,
          qty_pcs: r.pcs,
          bonus_qty_carton: r.bonus_full,
          bonus_qty_pcs: r.bonus_pcs,
          total_pcs: totalPCS,
          trade_price: r.trade_price,

          discount: (r.discPercent / 100) * r.amount,
          gst_amount: (r.taxPercent / 100) * r.amount,
          subtotal: r.amount
        };
      })
        .filter(r => r.item_id !== null)
    };
    console.log(payload);
    setProcessing(true);
    router.post("/sales", payload, {
      onSuccess: () => {
        // alert("Sale saved successfully!"); // Removed to prevent blocking and double-triggering
      },
      onError: (errors) => {
        console.error(errors);
        alert("Failed to save sale. Check console for details.");
      },
      onFinish: () => setProcessing(false)
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
          <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-center">
            {/* Date Picker */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-1 flex flex-col gap-3">
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

            {/* Time Picker */}
            <div className="col-span-1 sm:col-span-1 lg:col-span-1 flex flex-col gap-3">
              <Input
                type="time"
                id="time-picker"
                step="1"
                defaultValue={new Date().toLocaleTimeString('en-GB', { hour12: false })}
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>

            {/* Account Select */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
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

                    // Fetch Previous Balance
                    axios.get(`/account/${id}/balance`).then(res => {
                      setPreviousBalance(res.data.balance);
                    }).catch(err => {
                      console.error("Failed to fetch balance", err);
                      setPreviousBalance(0);
                    });
                  } else {
                    // clear if no account
                    setCreditDays(0);
                    setCreditLimit("");
                    setSalesman(null);
                    setPreviousBalance(0);
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
            <div className="col-span-1">
              <Input
                className="col-span-1"
                placeholder="Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {/* Credit Days */}
            <Input
              className="col-span-1"
              placeholder="Credit Days"
              value={creditDays}
              onChange={(e) => setCreditDays(Number(e.target.value))}
            />
            {/* Credit Limit */}
            <Input
              className="col-span-1"
              placeholder="Credit Limit"
              value={creditLimit as any}
              onChange={(e) =>
                setCreditLimit(e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            {/* Invoice # */}
            <Input
              className="col-span-1"
              placeholder="Invoice #"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />

            {/* Salesman */}
            <Input
              className="col-span-1 sm:col-span-1 lg:col-span-1"
              placeholder="Salesman"
              value={salesman ? (salemanMap.get(salesman) || "") : ""}
              readOnly
            />

            {/* Cash/Credit Select */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Select value={cashCredit} onValueChange={setCashCredit}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Cash / Credit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cash / Credit</SelectLabel>
                    <SelectItem value="CREDIT">CREDIT</SelectItem>
                    <SelectItem value="CASH">CASH</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Items # */}
            <Input
              className="col-span-1 sm:col-span-1 lg:col-span-1"
              placeholder="Items #"
              value={rowsWithComputed.length}
              readOnly
            />
            {/* Active Checkbox */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-center gap-3 border p-2.5  rounded-sm">
              <Checkbox id="terms" defaultChecked />
              <Label htmlFor="terms">Active</Label>
            </div>
          </Card>

          {/* Items table + right summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Table area */}
            <div className="col-span-1 lg:col-span-9">
              <Card className="p-0 overflow-hidden gap-0">
                <div className="overflow-x-auto">
                  <div className="min-w-[1200px]">
                    {/* Table Header (sticky) */}
                    <div className="grid grid-cols-12 p-2 text-xs font-semibold border-b sticky top-0 z-10 bg-secondary/50 backdrop-blur-sm">

                      <div className="col-span-2">+ Item Selection</div>
                      <div className="col-span-1 text-center">Full</div>
                      <div className="col-span-1 text-center">Pcs</div>
                      <div className="col-span-1 text-center">B.Full</div>
                      <div className="col-span-1 text-center">B.Pcs</div>
                      <div className="col-span-1 text-center">Rate</div>
                      <div className="col-span-1 text-center">Tax</div>
                      <div className="col-span-1 text-center">Disc %</div>
                      <div className="col-span-1 text-center ">After Disc Rate</div>
                      <div className="col-span-1 text-center font-bold">Sub Total</div>
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
                        <div key={row.id} className={`grid grid-cols-12 gap-1 p-2 border-b items-center text-sm ${row.stockExceeded ? 'bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-900' : ''}`}>


                          <div className="col-span-2 flex items-center justify-center">

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

                          <div className="col-span-1">
                            <Tooltip open={row.isLoss}>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <Input
                                    className={`text-right ${row.isLoss ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                    value={row.rate}
                                    onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })}
                                    onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="bg-red-600 text-white border-red-600 font-semibold"
                                arrowClassName="fill-red-600 bg-red-600"
                              >
                                <p>Hi, you are selling in loss</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <div className="col-span-1">
                            <Input className="text-right" value={row.taxPercent} onChange={(e) => updateRow(row.id, { taxPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                          </div>

                          <div className="col-span-1">
                            <Input className="text-right" value={row.discPercent} onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                          </div>

                          <div className="col-span-1">
                            <Input className="text-right italic bg-secondary/20" value={(row.rate * (1 - row.discPercent / 100)).toFixed(2)} readOnly onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
                          </div>
                          <div className="col-span-1">
                            <Input className="text-right font-bold bg-secondary/40" value={(row.amount * (1 - row.discPercent / 100)).toFixed(2)} readOnly onClick={() => row.item_id && setSelectedItemId(row.item_id)} />
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
                        <div className="text-xs text-muted-foreground">Tax</div>
                        <div className="text-lg font-semibold text-blue-500">{totals.taxTotal.toFixed(2)}</div>
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
              <Card className="py-1 px-4 mt-2 gap-2 border-2 bg-secondary/10 backdrop-blur-sm">
                {selectedItem ? (
                  <>
                    {/* Header */}
                    <div className="mb-1 pb-2 border-b-2 border-border">
                      <h3 className="text-lg font-bold  flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        {selectedItem.title}
                        {selectedItem.short_name && (
                          <span className="text-sm font-normal ">({selectedItem.short_name})</span>
                        )}
                      </h3>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {/* Packing Info */}
                      <div className=" rounded-md p-4 shadow-sm border border-border hover:shadow-md transition-shadow bg-secondary/10">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Packing Qty</div>
                        <div className="text-2xl font-bold ">
                          {toNumber(selectedItem.packing_full || selectedItem.packing_qty)}
                          <span className="text-sm font-normal  ml-1">pcs/full</span>
                        </div>
                      </div>

                      {/* Live Stock Calculation Logic */}
                      {(() => {
                        const packing = toNumber(selectedItem.packing_full || selectedItem.packing_qty || 1);
                        const currentStock = toNumber(selectedItem.stock_1);

                        // Find the row corresponding to this item to subtract entered quantity
                        const activeRow = rows.find(r => r.item_id === selectedItem.id);
                        const enteredQty = activeRow
                          ? (toNumber(activeRow.full) * packing) + toNumber(activeRow.pcs) + (toNumber(activeRow.bonus_full) * packing) + toNumber(activeRow.bonus_pcs)
                          : 0;

                        const remainingStock = currentStock - enteredQty;

                        return (
                          <>
                            {/* Stock Full */}
                            <div className="rounded-md p-4 shadow-sm border border-border hover:shadow-md transition-shadow bg-secondary/10">
                              <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Stock (Full)</div>
                              <div className={`text-2xl font-bold ${remainingStock < 0 ? 'text-red-600' : ''}`}>
                                {Math.floor(remainingStock / packing)}
                                <span className="text-sm font-normal  ml-1">full</span>
                              </div>
                            </div>

                            {/* Stock Pcs */}
                            <div className=" rounded-md p-4 shadow-sm border border-border hover:shadow-md transition-shadow bg-secondary/10">
                              <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Stock (Pieces)</div>
                              <div className={`text-2xl font-bold ${remainingStock < 0 ? 'text-red-600' : ''}`}>
                                {remainingStock % packing}
                                <span className="text-sm font-normal  ml-1">pcs</span>
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
                      <div className=" rounded-md p-4 shadow-sm border border-border hover:shadow-md transition-shadow bg-secondary/10">
                        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Trade Price</div>
                        <div className="text-2xl font-bold ">
                          ₨ {toNumber(selectedItem.trade_price).toFixed(2)}
                        </div>
                      </div>

                      {/* Retail Price */}
                      <div className=" rounded-md p-4 shadow-sm border border-border hover:shadow-md transition-shadow bg-secondary/10">
                        <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Retail Price</div>
                        <div className="text-2xl font-bold ">
                          ₨ {toNumber(selectedItem.retail).toFixed(2)}
                        </div>
                      </div>

                      {/* Average Price */}
                      <div className=" rounded-md p-4 shadow-sm border border-border hover:shadow-md transition-shadow bg-secondary/10">
                        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Average Price</div>
                        <div className="text-2xl font-bold ">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
                      {[2, 3, 4, 5, 6, 7].map((num) => {
                        const priceKey = `pt${num}` as keyof Item;
                        const price = toNumber(selectedItem[priceKey]);
                        if (price === 0) return null;

                        return (
                          <div key={num} className="bg-secondary/30 backdrop-blur-sm rounded-md p-3 shadow-sm border border-border hover:border-primary/50 hover:shadow-md transition-all group">
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">Price Type {num}</div>
                            <div className="text-lg font-bold">
                              ₨ {price.toFixed(2)}
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
            <div className="col-span-1 lg:col-span-3">
              <Card className="p-4 space-y-3 sticky top-[120px] gap-0">
                {isOverLimit && (
                  <div className="p-2 mb-2 bg-red-100 border border-red-400 text-red-700 text-sm font-bold rounded animate-pulse">
                    ⚠️ Exceeds Credit Limit!
                  </div>
                )}


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
                  <Input placeholder="0.00" value={previousBalance.toFixed(2)} readOnly />
                </div>

                <div className="border p-2 rounded  flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="payNow" checked={isPayNow} onCheckedChange={(c) => setIsPayNow(!!c)} />
                    <Label htmlFor="payNow" className="text-sm font-bold">Pay Now</Label>
                  </div>

                  {isPayNow && (
                    <>
                      <div>
                        <div className="text-xs font-semibold mb-1">Payment Account</div>
                        <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Select Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentAccounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id.toString()}>{acc.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="text-xs font-semibold mb-1">Payment Method</div>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Select Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="text-xs font-semibold mb-1">Cash Received</div>
                        <Input
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(toNumber(e.target.value))}
                        />
                      </div>
                    </>
                  )}
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
                  <div className="text-xs font-semibold">Total Receivable</div>
                  <div className="text-xl font-bold">{totals.totalReceivable.toFixed(2)}</div>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSave} disabled={processing}>
                    {processing ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => alert("Cancel")} disabled={processing}>Cancel</Button>
                </div>
              </Card>
            </div>
          </div>
        </div >
      </SidebarInset >
    </SidebarProvider >
  );
}
