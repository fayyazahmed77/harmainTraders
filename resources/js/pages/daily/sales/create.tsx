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
import { Trash2, Plus, CalendarIcon, ListRestart, RotateCcw, ChevronDown, ChevronUp, Save, Wallet } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  item_category?: string | null;
}

interface Saleman {
  id: number;
  name: string;
}

interface MessageLine {
  id: number;
  messageline: string;
  category: string;
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

export default function SalesPage({ items, accounts, salemans, paymentAccounts = [], nextInvoiceNo, firms = [], messageLines = [] }: { items: Item[]; accounts: Account[]; salemans: Saleman[]; paymentAccounts: Account[]; nextInvoiceNo: string; firms: { id: number; name: string; defult: boolean }[]; messageLines: MessageLine[] }) {
  const { appearance } = useAppearance();
  const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const selectBg = isDark ? '#0a0a0a' : '#ffffff';
  const selectBorder = isDark ? '#262626' : '#e5e7eb';
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string>("");
  const [party, setParty] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<number | "">("");
  const [creditDays, setCreditDays] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);
  const [invoiceNo, setInvoiceNo] = useState<string>(nextInvoiceNo);
  const [salesman, setSalesman] = useState<number | null>(null);
  const [customerCategory, setCustomerCategory] = useState<string | null>(null);
  const [cashCredit, setCashCredit] = useState<string>("CREDIT");
  const [itemsCount, setItemsCount] = useState<number>(items.length);
  const [accountType, setAccountType] = useState<Option | null>(null);
  const [courier, setCourier] = useState<number>(0);
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [printOption, setPrintOption] = useState<"big" | "small">("big");
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false); // New state for bottom item info panel
  const [showStickyFooter, setShowStickyFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Firm selection state - default to firm marked as default
  const defaultFirm = firms.find(f => f.defult);
  const [selectedFirmId, setSelectedFirmId] = useState<string>(defaultFirm ? defaultFirm.id.toString() : "0");
  const [selectedMessageId, setSelectedMessageId] = useState<string>("0");
  // Track expanded mobile rows for item details
  // expandedRows state removed

  // Show sticky footer on scroll down, hide on scroll up
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - SHOW footer
        setShowStickyFooter(true);
      } else {
        // Scrolling up - HIDE footer
        setShowStickyFooter(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Pay Now State
  const [isPayNow, setIsPayNow] = useState<boolean>(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [processing, setProcessing] = useState<boolean>(false);
  const [showStockWarning, setShowStockWarning] = useState(false);

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

    let baseRate = toNumber(selected.retail ?? selected.trade_price ?? 0); // Use retail price first for sales
    const tax = toNumber(selected.gst_percent ?? 0);
    const disc = toNumber(selected.discount ?? 0);
    const tradePrice = toNumber(selected.retail ?? selected.trade_price ?? baseRate); // Use retail for sales

    // Auto-calculate rate based on customer category (TP2-TP7)
    // Formula: Trade Price * (1 + Percentage / 100)
    // Only apply if we have a valid Trade Price to base it on.
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
        // Calculate rate: Trade Price + (Trade Price * Percentage / 100)
        baseRate = Math.round(actualTradePrice * (1 + percentage / 100));
      }
    }

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
      setShowStockWarning(true);
      return;
    }
    saveInvoice();
  };

  const saveInvoice = (forceSave = false) => {
    const payload = {
      date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      invoice: invoiceNo,
      code: code,
      customer_id: accountType?.value,
      salesman_id: salesman,
      firm_id: selectedFirmId && selectedFirmId !== "0" ? Number(selectedFirmId) : null,
      no_of_items: rowsWithComputed.length,
      print_format: printOption,
      allow_negative_stock: forceSave, // New flag

      // Pay Now Data
      is_pay_now: isPayNow,
      payment_account_id: paymentAccountId,
      payment_method: paymentMethod,
      message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,

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
          trade_price: r.rate,
          retail_price: r.trade_price,

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

        <div className="w-full p-4 space-y-4 pb-32 md:pb-4">



          {/* Mobile Header Section */}
          <div className="block md:hidden space-y-3">
            <Card className="p-3 space-y-3">
              <div className="flex justify-between items-center">
                <div className="font-bold text-lg text-orange-600">#{invoiceNo}</div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="text-xs text-muted-foreground border px-2 py-1 rounded bg-secondary/50">
                    {date ? date.toLocaleDateString() : "No Date"}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">
                    {time}
                  </div>
                </div>
              </div>

              <FieldWrapper label="Select Account" className="w-full">
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
                      setCode(selectedAccount.code ?? "");
                      axios.get(`/account/${id}/balance`).then(res => {
                        setPreviousBalance(res.data.balance);
                      }).catch(err => {
                        console.error("Failed to fetch balance", err);
                        setPreviousBalance(0);
                      });
                      setCustomerCategory(selectedAccount.item_category ? String(selectedAccount.item_category) : null);
                    } else {
                      setCreditDays(0);

                      setCreditLimit("");
                      setSalesman(null);
                      setPreviousBalance(0);
                      setCustomerCategory(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-11 shadow-sm border-gray-200 bg-background">
                    <SelectValue placeholder="Select Customer" />
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

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground flex items-center justify-center gap-1 h-8 hover:bg-transparent border border-gray-200 rounded-lg"
                onClick={() => setShowMobileDetails(!showMobileDetails)}
              >
                {showMobileDetails ? "Hide Details" : "Show More Details"}
                {showMobileDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMobileDetails ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper label="Sale Type">
                      <Select value={cashCredit} onValueChange={setCashCredit}>
                        <SelectTrigger className="w-full h-11 shadow-sm border-gray-200 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT">CREDIT</SelectItem>
                          <SelectItem value="CASH">CASH</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWrapper>

                    <FieldWrapper label="Status">
                      <div className="flex items-center justify-center gap-2 h-11 px-2 border rounded-md bg-emerald-50/20 border-emerald-100 shadow-sm">
                        <Checkbox id="terms-mobile" defaultChecked />
                        <Label htmlFor="terms-mobile" className="text-emerald-700 font-medium text-xs">Active</Label>
                      </div>
                    </FieldWrapper>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldWrapper label="Credit Days">
                      <Input value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value))} className="h-9 text-center" />
                    </FieldWrapper>
                    <FieldWrapper label="Limit">
                      <Input value={creditLimit as any} onChange={(e) => setCreditLimit(e.target.value === "" ? "" : Number(e.target.value))} className="h-9 text-right" />
                    </FieldWrapper>
                    <FieldWrapper label="Salesman">
                      <Select
                        value={salesman?.toString() || ""}
                        onValueChange={(val) => setSalesman(val ? Number(val) : null)}
                      >
                        <SelectTrigger className="h-9 shadow-sm border-gray-200 bg-background text-left">
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
                    <FieldWrapper label="Code">
                      <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-9" />
                    </FieldWrapper>
                  </div>
                </div>
              </div>
            </Card>
          </div>



          {/* Header */}
          <div className="hidden md:block">
            <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-x-3 gap-y-5 items-end">
              {/* Date Picker */}
              <FieldWrapper label="Invoice Date" className="lg:col-span-1">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date-picker"
                      className="w-full justify-between font-normal h-10 px-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors"
                    >
                      <span className="truncate">{date ? date.toLocaleDateString() : "Select date"}</span>
                      <CalendarIcon className="h-4 w-4 shrink-0 opacity-50 text-orange-600" />
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
                  className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none h-10 border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors"
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

                      // Fetch Previous Balance
                      axios.get(`/account/${id}/balance`).then(res => {
                        setPreviousBalance(res.data.balance);
                      }).catch(err => {
                        console.error("Failed to fetch balance", err);
                        setPreviousBalance(0);
                      });
                      setCustomerCategory(selectedAccount.item_category ? String(selectedAccount.item_category) : null);
                    } else {
                      // clear if no account

                      setCreditDays(0);
                      setCreditLimit("");
                      setSalesman(null);
                      setPreviousBalance(0);
                      setCustomerCategory(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-10 border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors">
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

              {/* Area (Displaying Code as placeholder for Area/Subarea if not present, but usually Area is needed) */}
              <FieldWrapper label="Account Code" className="lg:col-span-1">
                <Input
                  placeholder="Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-10 bg-gray-50/50 border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors"
                />
              </FieldWrapper>

              {/* Credit Days */}
              <FieldWrapper label="Credit Days" className="lg:col-span-1">
                <Input
                  placeholder="Days"
                  value={creditDays}
                  onChange={(e) => setCreditDays(Number(e.target.value))}
                  className="h-10 text-center font-mono border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors"
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
                  className="h-10 text-right font-mono border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors"
                />
              </FieldWrapper>

              {/* Invoice # */}
              <FieldWrapper label="Bill No" className="lg:col-span-1 text-orange-600 font-bold">
                <Input
                  placeholder="Invoice #"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="h-10 text-center font-bold border-orange-200 bg-orange-50/20 text-orange-700"
                />
              </FieldWrapper>

              {/* Salesman */}
              <FieldWrapper label="Salesman Name" className="lg:col-span-1">
                <Select
                  value={salesman?.toString() || ""}
                  onValueChange={(val) => setSalesman(val ? Number(val) : null)}
                >
                  <SelectTrigger className="h-10 border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors bg-background">
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
                  <SelectTrigger className="w-full h-10 border-gray-200 hover:border-orange-300 focus:border-orange-500 transition-colors">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="CREDIT">CREDIT</SelectItem>
                      <SelectItem value="CASH">CASH</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldWrapper>

              {/* Items # */}
              <FieldWrapper label="Items" className="lg:col-span-1">
                <Input
                  placeholder="Items #"
                  value={rowsWithComputed.length}
                  readOnly
                  className="h-10 text-center bg-gray-50/50 font-mono"
                />
              </FieldWrapper>

              {/* Active Checkbox */}
              <FieldWrapper label="Status" className="lg:col-span-1">
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-emerald-50/20 border-emerald-100">
                  <Checkbox id="terms" defaultChecked className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                  <Label htmlFor="terms" className="text-emerald-700 font-medium text-xs">Active</Label>
                </div>
              </FieldWrapper>
            </Card>
          </div>

          {/* Mobile "Add Item" Button */}
          <div className="block md:hidden pb-2">
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="font-semibold text-lg flex items-center gap-2"><ListRestart className="text-orange-600" size={18} /> Items List</h3>
              <Button size="sm" onClick={addRow} className="bg-orange-600 hover:bg-orange-700 text-white h-8 shadow-sm">
                <Plus size={16} className="mr-1" /> Add Item
              </Button>
            </div>
          </div>

          {/* Items table + right summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Table area */}
            <div className="col-span-1 lg:col-span-9">
              <Card className="p-0 overflow-hidden gap-0 border-0 md:border shadow-none md:shadow-sm bg-transparent md:bg-card">
                <div className="overflow-visible md:overflow-x-auto">
                  <div className="w-full md:min-w-[1200px]">
                    {/* Table Header (sticky) - Desktop Only */}
                    <div className="hidden md:grid grid-cols-12 p-2 text-xs font-semibold border-b sticky top-0 z-10 bg-secondary/50 backdrop-blur-sm">

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
                            className="h-7 w-7 p-1 bg-gray-500 text-white hover:bg-gray-600 border-gray-600 cursor-pointer"
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
                    <div className="max-h-none md:max-h-[360px] overflow-visible md:overflow-auto space-y-3 md:space-y-0 text-sm"> {/* Changed overflow and spacing for mobile cards */}
                      {rowsWithComputed.map((row) => (
                        <React.Fragment key={row.id}>
                          {/* Mobile Card View */}
                          <div
                            className={`block md:hidden rounded-xl border bg-card dark:bg-card shadow-sm relative overflow-hidden transition-all mb-3 ${row.stockExceeded ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-700 hover:shadow-md'}`}
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
                                  {/* Toggle removed */}
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
                                  isDisabled={!accountType}
                                  value={itemOptions.find((opt) => opt.value === row.item_id) || null}
                                  onChange={(opt) => handleSelectItem(row.id, Number(opt?.value))}
                                  placeholder={!accountType ? "Select Account First" : "Select Item..."}
                                />

                                {/* Details removed */}
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
                                        // Prevent leading zeros
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
                                        // Prevent leading zeros
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
                                  <label className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Rate</label>
                                  <Input
                                    className={`h-7 text-xs px-1 border-gray-200 dark:border-gray-700 text-center ${row.isLoss ? 'text-red-600 font-bold border-red-200 bg-red-50' : ''}`}
                                    value={row.rate}
                                    onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })}
                                    onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                  />
                                </div>

                                <div className="flex flex-col">
                                  <label className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Disc%</label>
                                  <Input
                                    className="h-7 text-xs px-1 border-gray-200 dark:border-gray-700 text-center"
                                    value={row.discPercent}
                                    onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })}
                                    onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                  />
                                </div>

                                <div className="flex flex-col">
                                  <label className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Tax%</label>
                                  <Input
                                    className="h-7 text-xs px-1 border-gray-200 dark:border-gray-700 text-center"
                                    value={row.taxPercent}
                                    onChange={(e) => updateRow(row.id, { taxPercent: toNumber(e.target.value) })}
                                    onClick={() => row.item_id && setSelectedItemId(row.item_id)}
                                  />
                                </div>

                                <div className="flex flex-col items-end justify-end">
                                  <label className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total</label>
                                  <div className="text-base font-black text-orange-600 leading-tight">
                                    {(row.amount * (1 - row.discPercent / 100)).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Row View */}
                          <div className={`hidden md:grid grid-cols-12 gap-1 p-2 border-b items-center text-sm ${row.stockExceeded ? 'bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-900' : ''}`}>


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
                                options={itemOptions.filter(opt => !rows.some(r => r.item_id === opt.value && r.id !== row.id))}
                                 isDisabled={!accountType}
                                 placeholder={!accountType ? "Select Account First" : "Select item"}
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
              <div className="mt-2 md:mt-4">
                {/* Mobile Toggle Button for Item Info */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full md:hidden mb-2 border-gray-700 dark:border-gray-800 dark:bg-gray-900/50 text-orange-500 dark:text-orange-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-orange-400 dark:hover:text-orange-400"
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                >
                  {showInfoPanel ? (
                    <>Hide Item Info <ChevronUp className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>View Item Info <ChevronDown className="ml-2 h-4 w-4" /></>
                  )}
                </Button>

                <div className={`${showInfoPanel ? 'block' : 'hidden'} md:block animate-in slide-in-from-bottom-2`}>
                  <Card className="py-1 px-4 gap-2 border dark:border-gray-800 dark:bg-gray-950 shadow-lg relative overflow-hidden">
                    {/* Decorative background glow */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    {selectedItem ? (
                      <>
                        {/* Header */}
                        <div className="mb-2 pb-2 border-b border-gray-800 pt-2">
                          <h3 className="text-lg font-bold dark:text-gray-100 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                            {selectedItem.title}
                            {selectedItem.short_name && (
                              <span className="text-sm font-normal text-gray-400">({selectedItem.short_name})</span>
                            )}
                          </h3>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {/* Packing Info */}
                          <div className="rounded-lg p-3 border  dark:bg-gray-900/50 hover:border-orange-500/30 transition-colors">
                            <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Packing Qty</div>
                            <div className="text-xl font-bold   ">
                              {toNumber(selectedItem.packing_full || selectedItem.packing_qty)}
                              <span className="text-xs font-normal text-gray-400 ml-1">pcs/full</span>
                            </div>
                          </div>

                          {/* Live Stock Calculation Logic */}
                          {(() => {
                            const packing = toNumber(selectedItem.packing_full || selectedItem.packing_qty) || 1;
                            const currentStock = toNumber(selectedItem.stock_1);

                            // Find the row corresponding to this item to subtract entered quantity
                            const activeRow = rows.find(r => r.item_id === selectedItem.id);
                            const enteredQty = activeRow
                              ? (toNumber(activeRow.full) * packing) + toNumber(activeRow.pcs) + (toNumber(activeRow.bonus_full) * packing) + toNumber(activeRow.bonus_pcs)
                              : 0;

                            const remainingStock = currentStock - enteredQty;
                            const isLowStock = remainingStock < packing * 5; // Alert logic example

                            return (
                              <>
                                {/* Stock Full */}
                                <div className={`rounded-lg p-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-emerald-500/30 transition-colors`}>
                                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Stock (Full)</div>
                                  <div className={`text-xl font-bold ${remainingStock < 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {Math.floor(remainingStock / packing)}
                                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">full</span>
                                  </div>
                                </div>

                                {/* Stock Pcs */}
                                <div className={`rounded-lg p-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-emerald-500/30 transition-colors`}>
                                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Stock (Pieces)</div>
                                  <div className={`text-xl font-bold ${remainingStock < 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {remainingStock % packing}
                                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">pcs</span>
                                  </div>
                                </div>

                                {/* Total Stock */}
                                <div className={`rounded-lg p-3 border ${remainingStock < 0 ? 'border-red-900 bg-red-50 dark:bg-red-950/20' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'} relative overflow-hidden group hover:border-orange-500/50 transition-colors`}>
                                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${remainingStock < 0 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${remainingStock < 0 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-500'}`}>Total Stock</div>
                                  <div className={`text-xl font-bold ${remainingStock < 0 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-500'}`}>
                                    {remainingStock}
                                    <span className={`text-xs font-normal ml-1 ${remainingStock < 0 ? 'text-red-600/70 dark:text-red-400/70' : 'text-gray-500 dark:text-gray-400'}`}>pcs</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}

                          {/* Trade Price */}
                          <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-purple-500/30 transition-colors">
                            <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Trade Price</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              <span className="text-xs text-gray-500 mr-1">Rs</span>
                              {toNumber(selectedItem.trade_price).toFixed(2)}
                            </div>
                          </div>

                          {/* Retail Price */}
                          <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-orange-500/30 transition-colors">
                            <div className="text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider mb-1">Retail Price</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              <span className="text-xs text-gray-500 mr-1">Rs</span>
                              {toNumber(selectedItem.retail).toFixed(2)}
                            </div>
                          </div>

                          {/* Average Price */}
                          <div className="rounded-lg p-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-indigo-500/30 transition-colors">
                            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Average Price</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              <span className="text-xs text-gray-500 mr-1">Rs</span>
                              {((toNumber(selectedItem.trade_price) + toNumber(selectedItem.retail)) / 2).toFixed(2)}
                            </div>
                          </div>

                          {/* Company */}
                          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-3 shadow-md text-white hover:shadow-lg transition-shadow">
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-90">Company</div>
                            <div className="text-lg font-bold truncate" title={selectedItem.company ?? 'N/A'}>
                              {selectedItem.company || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Additional Prices Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2 pb-2">
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
                                  Rs {calculatedPrice.toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-500 text-base font-medium mb-1">
                          Select an item to view details
                        </div>
                        <div className="text-gray-600 text-xs">
                          Click on any item in the list above to verify stock & prices
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
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
                  <div className="text-xs font-semibold">Select Firm</div>
                  <Select value={selectedFirmId} onValueChange={setSelectedFirmId}>
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="No Branding" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Branding</SelectItem>
                      {firms.map((firm) => (
                        <SelectItem key={firm.id} value={firm.id.toString()}>
                          {firm.name} {firm.defult && "(Default)"}
                        </SelectItem>
                      ))}
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
                      {messageLines.map((msg) => (
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

                <div className="hidden md:flex gap-2 mt-2">
                  <Button onClick={handleSave} disabled={processing}>
                    {processing ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => alert("Cancel")} disabled={processing}>Cancel</Button>
                </div>
              </Card>
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
              <Button onClick={handleSave} disabled={processing} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/50 rounded-xl font-bold transition-all active:scale-95">
                {processing ? "Saving..." : <><Save className="mr-2" size={18} /> Save Invoice</>}
              </Button>
            </div>

            {/* Mini Details */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold">Gross</span>
                <span className="text-xs font-semibold text-gray-700">{totals.gross.toFixed(0)}</span>
              </div>
              <div className="flex flex-col items-center border-l border-gray-100">
                <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold">Tax</span>
                <span className="text-xs font-semibold text-gray-700">{totals.taxTotal.toFixed(0)}</span>
              </div>
              <div className="flex flex-col items-center border-l border-gray-100">
                <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold">Disc</span>
                <span className="text-xs font-semibold text-gray-700">{totals.discTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>

        </div >
        <Dialog open={showStockWarning} onOpenChange={setShowStockWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stock Warning</DialogTitle>
              <DialogDescription>
                One or more items exceed available stock (negative stock). Do you want to proceed with saving this invoice anyway?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStockWarning(false)}>Cancel</Button>
              <Button onClick={() => { setShowStockWarning(false); saveInvoice(true); }} className="bg-red-600 hover:bg-red-700 text-white">
                Proceed Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset >
    </SidebarProvider >
  );
}
