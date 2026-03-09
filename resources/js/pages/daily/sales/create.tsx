// sales.tsx
import React, { useState, useMemo, useEffect } from "react";
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
import { Trash2, Plus, CalendarIcon, ListRestart, RotateCcw, ChevronDown, ChevronUp, Save, Wallet, Search, ArrowRightLeft, CheckCircle2, Info, Calculator, BadgePercent, ArrowDownToLine, Package, Hash, AlertTriangle, Banknote, Box, PackageSearch } from "lucide-react";
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

const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const PREMIUM_GRADIENT = "bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all duration-300";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-500 to-orange-600";
const CARD_BASE = "bg-white dark:bg-card border border-zinc-200 dark:border-zinc-800 shadow-sm";

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
  category?: string;
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

// ───────────────────────────────────────────
// Shared Components (Premium)
// ───────────────────────────────────────────
const TechLabel = ({ children, icon: Icon, label, className = "space-y-1.5 flex-1 min-w-0" }: { children: React.ReactNode, icon?: any, label: string, className?: string }) => (
  <div className={className}>
    <div className="flex items-center gap-2 px-1">
      {Icon && <Icon size={10} className="text-orange-500 shrink-0" />}
      <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest truncate">{label}</span>
    </div>
    {children}
  </div>
);

const SignalBadge = ({ text, type = 'blue' }: { text: string, type?: 'green' | 'red' | 'orange' | 'blue' }) => {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    red: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colors[type]}`}>
      {text}
    </span>
  );
};

export default function SalesPage({ items, accounts, salemans, paymentAccounts = [], nextInvoiceNo, firms = [], messageLines = [] }: { items: Item[]; accounts: Account[]; salemans: Saleman[]; paymentAccounts: Account[]; nextInvoiceNo: string; firms: { id: number; name: string; defult: boolean }[]; messageLines: MessageLine[] }) {
  const { appearance } = useAppearance();
  const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const selectBg = isDark ? '#0a0a0a' : '#ffffff';
  const selectBorder = isDark ? '#262626' : '#e5e7eb';
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [isTimeLive, setIsTimeLive] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isTimeLive) return;
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimeLive]);
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

  // Firm selection state - default to firm marked as default
  const defaultFirm = firms.find(f => f.defult);
  const [selectedFirmId, setSelectedFirmId] = useState<string>(defaultFirm ? defaultFirm.id.toString() : "0");
  const [selectedMessageId, setSelectedMessageId] = useState<string>("0");
  // Track expanded mobile rows for item details
  // expandedRows state removed

  // Persistent sticky footer logic removed scroll dependency

  // Pay Now State
  const [isPayNow, setIsPayNow] = useState<boolean>(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState<boolean>(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [processing, setProcessing] = useState<boolean>(false);
  const [showStockWarning, setShowStockWarning] = useState(false);

  // Item Selection Dialog State
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [activeRowId, setActiveRowId] = useState<number | null>(null);

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

  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return items.filter((it) =>
      it.title.toLowerCase().includes(q) ||
      (it.short_name?.toLowerCase().includes(q))
      // Add other filters if needed (category, etc.)
    );
  }, [items, itemSearch]);

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
      <SidebarInset className="md:overflow-hidden md:h-screen flex flex-col">
        <SiteHeader breadcrumbs={breadcrumbs} />

        <div className="flex-1 flex flex-col md:flex-row min-h-0 md:overflow-hidden">
          {/* Main Area (Left) */}
          <div className="flex-1 flex flex-col min-h-0 pt-1 md:pt-4 px-4 pb-0 space-y-3 md:overflow-hidden">



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



            {/* Desktop Control Deck - Inline Layout */}
            <div className="hidden md:block">
              <Card className={`px-4 py-3 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} flex flex-row flex-nowrap items-end justify-between gap-4 relative overflow-hidden overflow-x-auto custom-scrollbar`}>
                <div className={`absolute top-0 left-0 w-full h-0.5 ${ACCENT_GRADIENT}`} />

                <TechLabel label="Invoice Date" icon={CalendarIcon} className="space-y-1.5 shrink-0">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date-picker"
                        className={`w-36 justify-between font-bold text-xs h-9 ${PREMIUM_ROUNDING_MD} border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all hover:border-orange-500`}
                      >
                        <span className="truncate">{date ? date.toLocaleDateString() : "Select date"}</span>
                        <CalendarIcon className="h-3.5 w-3.5 opacity-50 text-orange-600" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => {
                          setDate(date);
                          setOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </TechLabel>

                <TechLabel label="Invoice Time" className="space-y-1.5 shrink-0">
                  <Input
                    type="time"
                    step="1"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      setIsTimeLive(false);
                    }}
                    className={`w-37 h-9 text-xs font-mono border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 ${PREMIUM_ROUNDING_MD} text-orange-600 font-bold`}
                  />
                </TechLabel>

                <TechLabel label="Select Account" icon={Search} className="space-y-1.5 flex-1 min-w-[200px]">
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
                        setSalesman(selectedAccount.saleman_id ?? null);
                        setCode(selectedAccount.code ?? "");
                        axios.get(`/account/${id}/balance`).then(res => setPreviousBalance(res.data.balance)).catch(() => setPreviousBalance(0));
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
                    <SelectTrigger className={`w-full h-9 text-xs font-bold uppercase tracking-tighter border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 ${PREMIUM_ROUNDING_MD}`}>
                      <SelectValue placeholder="Identify Customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypeOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value.toString()} className="text-[10px] font-bold uppercase tracking-widest">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TechLabel>

                <TechLabel label="Account Code" className="space-y-1.5 shrink-0 hidden lg:block">
                  <Input
                    value={code}
                    readOnly
                    className={`w-24 h-9 text-xs font-mono text-center bg-zinc-100/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 ${PREMIUM_ROUNDING_MD}`}
                  />
                </TechLabel>

                <TechLabel label="Days" className="space-y-1.5 shrink-0 hidden xl:block">
                  <Input
                    value={creditDays}
                    onChange={(e) => setCreditDays(Number(e.target.value))}
                    className={`w-14 h-9 text-xs text-center font-mono border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD}`}
                  />
                </TechLabel>

                <TechLabel label="Limit" className="space-y-1.5 shrink-0 hidden 2xl:block">
                  <Input
                    value={creditLimit as any}
                    onChange={(e) => setCreditLimit(e.target.value === "" ? "" : Number(e.target.value))}
                    className={`w-24 h-9 text-xs text-right font-mono border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD}`}
                  />
                </TechLabel>

                <TechLabel label="Bill No" icon={Hash} className="space-y-1.5 shrink-0">
                  <Input
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className={`w-28 h-9 text-xs font-black text-center border-orange-200 bg-orange-50/20 text-orange-600 ${PREMIUM_ROUNDING_MD}`}
                  />
                </TechLabel>

                <TechLabel label="Salesman" className="space-y-1.5 shrink-0">
                  <Select
                    value={salesman?.toString() || ""}
                    onValueChange={(val) => setSalesman(val ? Number(val) : null)}
                  >
                    <SelectTrigger className={`w-36 h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 ${PREMIUM_ROUNDING_MD}`}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {salemans.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()} className="text-[10px] font-bold uppercase tracking-widest">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TechLabel>

                <TechLabel label="Sale Type" className="space-y-1.5 shrink-0">
                  <Select value={cashCredit} onValueChange={setCashCredit}>
                    <SelectTrigger className={`w-24 h-9 text-xs border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 ${PREMIUM_ROUNDING_MD}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT" className="text-[10px] font-bold uppercase">CREDIT</SelectItem>
                      <SelectItem value="CASH" className="text-[10px] font-bold uppercase">CASH</SelectItem>
                    </SelectContent>
                  </Select>
                </TechLabel>

                <TechLabel label="Items" className="space-y-1.5 shrink-0">
                  <div className="w-14 h-9 flex items-center justify-center font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md">
                    {rowsWithComputed.length}
                  </div>
                </TechLabel>

                <TechLabel label="Status" className="space-y-1.5 shrink-0">
                  <div className="flex items-center gap-1.5 h-9 px-3 border rounded-md bg-emerald-500/5 border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Active</span>
                  </div>
                </TechLabel>
              </Card>
            </div>

            <div className="block md:hidden pb-0">
              <div className="flex justify-between items-center mb-1 px-1">
                <h3 className="font-semibold text-lg flex items-center gap-2"><ListRestart className="text-orange-600" size={18} /> Items List</h3>
                <Button size="sm" onClick={addRow} className="bg-orange-600 hover:bg-orange-700 text-white h-8 shadow-sm">
                  <Plus size={16} className="mr-1" /> Add Item
                </Button>
              </div>
            </div>

            {/* Main Items Workspace & Sidebar */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 mb-0">

              {/* Left Area: Items Registry */}
              <div className="flex-1 flex flex-col">
                <Card className="p-0 overflow-hidden gap-0  border-0 md:border shadow-none md:shadow-sm bg-transparent md:bg-card">
                  <div className="overflow-visible md:overflow-x-auto">
                    <div className="w-full md:min-w-[1200px]">
                      <div className="hidden md:grid grid-cols-12 bg-zinc-50 dark:bg-zinc-900/80 p-3 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-20">
                        <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Item Identification</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Full</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Pcs</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">B.Full</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">B.Pcs</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Rate</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Tax</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Disc %</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">After</div>
                        <div className="col-span-1 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Subtotal</div>
                      </div>

                      {/* Rows (scrollable) */}
                      <div className="max-h-none h-auto md:h-[47vh] max-h-[50vh] md:max-h-[47vh] overflow-y-auto custom-scrollbar md:overflow-auto space-y-3 md:space-y-0 text-sm">
                        {rowsWithComputed.map((row) => (
                          <React.Fragment key={row.id}>
                            {/* Mobile Card View (Visible only on < md) */}
                            <div className={`block md:hidden rounded-xl border p-4 bg-white dark:bg-zinc-950 shadow-sm relative overflow-hidden transition-all mb-4 ${row.stockExceeded ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-zinc-200 dark:border-zinc-800'}`}>
                              <div className="flex justify-between items-start mb-3">
                                <button
                                  onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                  className="flex flex-col gap-1 text-left"
                                >
                                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Item</div>
                                  {row.item_id ? (
                                    <div className="text-sm font-black text-zinc-900 dark:text-white uppercase italic flex items-center gap-1.5">
                                      {items.find(it => it.id === row.item_id)?.title}
                                      <ChevronDown size={14} className="text-zinc-400" />
                                    </div>
                                  ) : (
                                    <div className="text-sm font-bold text-zinc-300 italic uppercase flex items-center gap-1.5">
                                      Select Product
                                      <Plus size={14} className="text-orange-500" />
                                    </div>
                                  )}
                                </button>
                                <button onClick={() => removeRow(row.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <TechLabel label="Full Qty">
                                  <Input type="number" placeholder="FULL" value={row.full || ""} onChange={(e) => updateRow(row.id, { full: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-10 text-center font-black rounded-lg bg-zinc-50/50" />
                                </TechLabel>
                                <TechLabel label="Pieces">
                                  <Input type="number" placeholder="PIECES" value={row.pcs || ""} onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-10 text-center font-black rounded-lg bg-zinc-50/50" />
                                </TechLabel>
                              </div>

                              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 border-dashed grid grid-cols-3 gap-2 items-end">
                                <TechLabel label="Rate">
                                  <Input type="number" value={row.rate || ""} onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-9 text-xs font-bold rounded-lg" />
                                </TechLabel>
                                <TechLabel label="Disc%">
                                  <Input type="number" value={row.discPercent || ""} onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-9 text-xs font-bold rounded-lg" />
                                </TechLabel>
                                <TechLabel label="Tax%">
                                  <Input type="number" value={row.taxPercent || ""} onChange={(e) => updateRow(row.id, { taxPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-9 text-xs font-bold rounded-lg" />
                                </TechLabel>
                              </div>

                              <div className="mt-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <span className="text-[10px] font-black uppercase text-zinc-400">Total</span>
                                <div className="font-black text-lg text-zinc-900 dark:text-zinc-100 italic tracking-tighter">
                                  <span className="text-xs font-semibold mr-1">Rs</span>
                                  {((row.amount * (1 - row.discPercent / 100)) || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {/* Desktop Row View (Visible only on >= md) */}
                            <div className="hidden md:grid grid-cols-12 gap-2 p-2.5 border-b border-zinc-200 dark:border-zinc-800 items-center group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-50 dark:border-zinc-900/50 last:border-0">
                              <div className="col-span-3">
                                {row.item_id ? (
                                  <button
                                    onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                    className="flex flex-col text-left group/item"
                                  >
                                    <span className="text-xs font-black uppercase tracking-tighter truncate dark:text-zinc-100 group-hover/item:text-orange-500 transition-colors">
                                      {items.find(it => it.id === row.item_id)?.title}
                                    </span>
                                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest">ID: {row.item_id.toString().padStart(5, '0')}</span>
                                  </button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className={`w-full h-8 text-[10px] font-black uppercase justify-start ${PREMIUM_ROUNDING_MD} border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 transition-colors group-hover:border-orange-200`}
                                    onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                    disabled={!accountType}
                                  >
                                    <Plus size={12} className="mr-2 text-orange-500 group-hover:rotate-90 transition-transform" />
                                    Assign Registry SKU
                                  </Button>
                                )}
                              </div>

                              <div className="col-span-1">
                                <Input type="number" value={row.full || ""} onChange={(e) => updateRow(row.id, { full: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all" />
                              </div>
                              <div className="col-span-1">
                                <Input type="number" value={row.pcs || ""} onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all" />
                              </div>
                              <div className="col-span-1 border-l border-zinc-100 dark:border-zinc-800">
                                <Input type="number" value={row.bonus_full || ""} onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all opacity-50 focus:opacity-100" />
                              </div>
                              <div className="col-span-1">
                                <Input type="number" value={row.bonus_pcs || ""} onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all opacity-50 focus:opacity-100" />
                              </div>
                              <div className="col-span-1">
                                <Input type="number" value={row.rate || ""} onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-right font-mono text-[10px] border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all" />
                              </div>
                              <div className="col-span-1 bg-blue-50/10 dark:bg-blue-900/5 rounded px-1">
                                <Input type="number" value={row.taxPercent || ""} onChange={(e) => updateRow(row.id, { taxPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 border-none bg-transparent text-center font-mono text-[10px]" />
                              </div>
                              <div className="col-span-1 bg-rose-50/10 dark:bg-rose-900/5 rounded px-1">
                                <Input type="number" value={row.discPercent || ""} onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 border-none bg-transparent text-center font-mono text-[10px]" />
                              </div>
                              <div className="col-span-1">
                                <div className="text-right font-mono text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 h-8 flex items-center justify-end px-1 border border-zinc-100 dark:border-zinc-800 rounded">
                                  {(row.rate * (1 - row.discPercent / 100)).toFixed(2)}
                                </div>
                              </div>
                              <div className="col-span-1 flex items-center justify-end gap-2 pr-2">
                                <div className="text-right font-black text-[11px] tracking-tighter text-zinc-900 dark:text-zinc-100 italic">
                                  {((row.amount * (1 - row.discPercent / 100)) || 0).toLocaleString()}
                                </div>
                                <button onClick={() => removeRow(row.id)} className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded transition-all">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Table Footer: Totals */}
                  <div className="hidden md:flex bg-zinc-50/80 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 p-3 items-center justify-end gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Gross Amount</span>
                      <span className="text-md font-black text-zinc-700 dark:text-zinc-300"><span className="text-[10px] text-zinc-400 mr-1 italic font-semibold">Rs</span>{totals.gross.toLocaleString()}</span>
                    </div>

                    <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700"></div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Tax Total</span>
                      <span className="text-md font-black text-blue-600"><span className="text-[10px] text-blue-400/70 mr-0.5 font-bold">+</span>{totals.taxTotal.toLocaleString()}</span>
                    </div>

                    <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700"></div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Disc Total</span>
                      <span className="text-md font-black text-rose-600"><span className="text-[10px] text-rose-400/70 mr-0.5 font-bold">-</span>{totals.discTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>

                {/* Bottom fields / stock & supplier info */}
                {/* Bottom fields / stock & supplier info */}
                <div className="mt-0 md:mt-3 flex flex-col md:h-[206px]">
                  {/* Mobile Toggle Button for Item Info */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full md:hidden mb-2 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50 text-orange-500 dark:text-orange-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400 h-8 font-bold text-xs"
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                  >
                    {showInfoPanel ? (
                      <>Hide Item Info <ChevronUp className="ml-1.5 h-3.5 w-3.5" /></>
                    ) : (
                      <>View Item Info <ChevronDown className="ml-1.5 h-3.5 w-3.5" /></>
                    )}
                  </Button>

                  <div className={`${showInfoPanel ? 'flex' : 'hidden'} md:flex flex-col h-full animate-in slide-in-from-bottom-1 duration-300`}>
                    <Card className="flex-1 p-3 md:p-5 border dark:border-zinc-800 dark:bg-zinc-950 shadow-sm relative overflow-hidden transition-all duration-300 bg-white shadow-zinc-200/40">
                      {selectedItem ? (
                        <div className="flex flex-col h-full relative z-10">
                          {/* Top Header */}
                          <div className="pb-0 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80">
                            <h3 className="text-sm md:text-lg font-black dark:text-zinc-100 flex items-center gap-2 tracking-tight uppercase">
                              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(249,115,22,0.6)]"></span>
                              {selectedItem.title}
                              {selectedItem.short_name && (
                                <span className="text-[10px] md:text-xs font-semibold text-zinc-400 normal-case ml-1 tracking-tighter">({selectedItem.short_name})</span>
                              )}
                            </h3>
                            <div className="bg-blue-600 px-3 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
                              {selectedItem.company || 'N/A'}
                            </div>
                          </div>

                          {/* Data Sections */}
                          <div className="flex-1 flex flex-col md:flex-row mt-4 gap-6">

                            {/* Left Side: Inventory & Pricing Models */}
                            <div className="flex-1 flex flex-col justify-between">
                              {/* Primary Inventory Metrics */}
                              <div className="grid grid-cols-4 gap-3">
                                {/* Packing */}
                                <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                                  <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 leading-none">Packing</div>
                                  <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100 leading-none tracking-tighter">
                                    {toNumber(selectedItem.packing_full || selectedItem.packing_qty)}
                                    <span className="text-[10px] font-bold text-zinc-400 ml-1 uppercase">PCS/F</span>
                                  </div>
                                </div>

                                {/* Stock Calculators */}
                                {(() => {
                                  const packing = toNumber(selectedItem.packing_full || selectedItem.packing_qty) || 1;
                                  const currentStock = toNumber(selectedItem.stock_1);
                                  const activeRow = rows.find(r => r.item_id === selectedItem.id);
                                  const enteredQty = activeRow ? (toNumber(activeRow.full) * packing) + toNumber(activeRow.pcs) + (toNumber(activeRow.bonus_full) * packing) + toNumber(activeRow.bonus_pcs) : 0;
                                  const remainingStock = currentStock - enteredQty;

                                  return (
                                    <>
                                      <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 leading-none">Stock Full</div>
                                        <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100 leading-none tracking-tighter">
                                          {Math.floor(remainingStock / packing)}
                                          <span className="text-[10px] font-bold text-zinc-400 ml-1 uppercase">F</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 leading-none">Pieces</div>
                                        <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100 leading-none tracking-tighter">
                                          {remainingStock % packing}
                                          <span className="text-[10px] font-bold text-zinc-400 ml-1 uppercase">P</span>
                                        </div>
                                      </div>
                                      <div className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border ${remainingStock < 0 ? 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10' : 'border-orange-200 bg-orange-50/80 dark:border-orange-900/30 dark:bg-orange-900/10'}`}>
                                        <div className={`text-[9px] font-black uppercase tracking-widest mb-1.5 leading-none ${remainingStock < 0 ? 'text-rose-500' : 'text-orange-500'}`}>Active Stock</div>
                                        <div className={`text-2xl font-black leading-none tracking-tighter ${remainingStock < 0 ? 'text-rose-600' : 'text-orange-600'}`}>
                                          {remainingStock}
                                          <span className="text-[10px] font-bold ml-1 uppercase opacity-60">PCS</span>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>

                              {/* Price Tiers (Minimal Sub-row) */}
                              <div className="grid grid-cols-6 gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 h-[50px]">
                                {[2, 3, 4, 5, 6, 7].map((num) => {
                                  const priceKey = `pt${num}` as keyof Item;
                                  const percentage = toNumber(selectedItem[priceKey as keyof Item]);
                                  if (percentage === 0) return null;

                                  const tradePrice = toNumber(selectedItem.trade_price);
                                  const calculatedPrice = Math.round(tradePrice * (1 + percentage / 100));
                                  const isActive = String(num) === customerCategory;

                                  return (
                                    <div key={num} className={`rounded-md px-2 py-1 flex flex-col justify-center text-center transition-all ${isActive ? 'bg-orange-500 text-white shadow-md' : 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500'}`}>
                                      <div className="flex items-center justify-between gap-1 w-full">
                                        <span className={`text-[8px] font-black uppercase ${isActive ? 'text-orange-100' : 'text-zinc-400'}`}>Price Type-{num}</span>
                                        <span className={`text-[8px] font-black ${isActive ? 'text-orange-100' : 'text-zinc-400'}`}>{percentage}%</span>
                                      </div>
                                      <div className={`text-[11px] font-black tracking-tight ${isActive ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        RS {calculatedPrice.toFixed(0)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right Side: Core Financials */}
                            <div className="w-full md:w-64 flex flex-col justify-center gap-3 pl-0 md:pl-6 border-l-0 md:border-l border-zinc-100 dark:border-zinc-800/60 pt-4 md:pt-0">
                              <div className="flex items-center justify-between group">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 transition-colors">Trade Price</span>
                                <span className="text-[15px] font-black text-purple-600 leading-none"><span className="text-[10px] text-zinc-400 mr-1 italic">Rs</span>{toNumber(selectedItem.trade_price).toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between group">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 transition-colors">Retail Price</span>
                                <span className="text-[15px] font-black text-orange-600 leading-none"><span className="text-[10px] text-zinc-400 mr-1 italic">Rs</span>{toNumber(selectedItem.retail).toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between group">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 transition-colors">Average Cost</span>
                                <span className="text-[15px] font-black text-emerald-600 leading-none"><span className="text-[10px] text-zinc-400 mr-1 italic">Rs</span>{((toNumber(selectedItem.trade_price) + toNumber(selectedItem.retail)) / 2).toFixed(2)}</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-6 relative z-10 w-full">
                          <Box className="text-zinc-200 dark:text-zinc-800 w-12 h-12 mb-3" />
                          <div className="text-zinc-400 dark:text-zinc-600 text-[11px] font-black uppercase tracking-widest">
                            Item Telemetry Off
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Quick Summary & Financials */}
              <div className="w-full lg:w-80 flex flex-col min-h-0">
                <Card className={`${CARD_BASE} flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none max-h-full min-h-0 overflow-hidden`}>

                  <div className="overflow-y-auto min-h-0 custom-scrollbar p-4 pb-32 md:pb-4 flex flex-col gap-4">
                    {/* Header Section */}
                    <div className="flex flex-col gap-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Net Payable</span>
                        <SignalBadge type="green" text="READY" />
                      </div>
                      <div className="text-2xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100 italic">
                        <span className="text-sm font-normal mr-1 tracking-normal">Rs</span>
                        {totals.net.toLocaleString()}
                      </div>
                    </div>

                    {/* Credit Limit Alert */}
                    {isOverLimit && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-3 animate-pulse">
                        <AlertTriangle className="text-rose-600 shrink-0" size={18} />
                        <div className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400">Credit Limit Exceeded!</div>
                      </div>
                    )}

                    {/* Financial Fields */}
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <TechLabel label="Courier Service">
                        <Input
                          placeholder="0.00"
                          value={courier || ""}
                          onChange={(e) => setCourier(toNumber(e.target.value))}
                          className="h-10 text-lg font-black bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-0 focus:border-orange-500 transition-all font-mono"
                        />
                      </TechLabel>

                      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-sm border border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Previous Balance</span>
                        <span className={`text-lg font-black ${previousBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {previousBalance.toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <TechLabel label="TOTAL RECEIVABLE">
                          <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight italic">
                            {totals.totalReceivable.toLocaleString()}
                          </div>
                        </TechLabel>
                      </div>
                    </div>

                    {/* Checkout Options */}
                    <div className="flex flex-col gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 group cursor-pointer" onClick={() => {
                          const next = !isPayNow;
                          setIsPayNow(next);
                          if (next) setCheckoutDialogOpen(true);
                        }}>
                          <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${isPayNow ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-300'}`}>
                              {isPayNow && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-[11px] font-black uppercase text-zinc-600 dark:text-zinc-400">Instant Checkout</span>
                          </div>
                          <Banknote className={`w-4 h-4 transition-colors ${isPayNow ? 'text-orange-500' : 'text-zinc-300'}`} />
                        </div>

                        {isPayNow && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCheckoutDialogOpen(true)}
                            className="h-8 w-full text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50/50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20"
                          >
                            Edit Payment Details
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 pb-2">
                        <Select value={printOption} onValueChange={(v) => setPrintOption(v as "big" | "small")}>
                          <SelectTrigger className="h-9 w-full border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="big">Big Print (A4)</SelectItem>
                            <SelectItem value="small">Small Print (Thermal)</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={selectedFirmId} onValueChange={setSelectedFirmId}>
                          <SelectTrigger className="h-9 w-full border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                            <SelectValue placeholder="Branding" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No Branding</SelectItem>
                            {firms.map((firm) => (
                              <SelectItem key={firm.id} value={firm.id.toString()}>{firm.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                          <SelectTrigger className="h-9 w-full border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                            <SelectValue placeholder="Select Message Line..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0" className="text-zinc-400 italic">No Message Line</SelectItem>
                            {messageLines.map((msg) => (
                              <SelectItem key={msg.id} value={msg.id.toString()}>
                                {msg.messageline}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Final Actions - Hidden on mobile as we have sticky footer */}
                  <div className="hidden md:flex flex-col gap-0 px-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-card shrink-0">
                    <Button
                      onClick={handleSave}
                      disabled={processing}
                      className={`h-14 w-full ${ACCENT_GRADIENT} text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all`}
                    >
                      {processing ? "Syncing..." : "Finalize Invoice"}
                    </Button>
                  </div>

                </Card>
              </div>
            </div>
            {/* Mobile Sticky Footer */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 p-4 pb-6 z-50 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] transition-transform duration-300 ${showStickyFooter ? 'translate-y-0' : 'translate-y-full'}`}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex flex-col">
                  <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-1">Net Total</div>
                  <div className="text-2xl font-black text-orange-500 leading-none italic tracking-tighter">
                    <span className="text-xs font-semibold mr-1 not-italic text-zinc-500">Rs</span>
                    {Math.round(totals.net).toLocaleString()}
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={processing}
                  className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 rounded-xl font-black uppercase tracking-widest text-xs gap-2 transition-all active:scale-95 border-b-4 border-emerald-800"
                >
                  {processing ? "Saving..." : <><Save size={18} /> Save Invoice</>}
                </Button>
              </div>

              {/* Detail Statistics Bar */}
              <div className="grid grid-cols-3 gap-0 pt-4 border-t border-zinc-800/50">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] uppercase text-zinc-500 font-black tracking-widest mb-0.5">Gross</span>
                  <span className="text-xs font-bold text-zinc-400 font-mono tracking-tighter">{totals.gross.toFixed(0)}</span>
                </div>
                <div className="flex flex-col items-center border-l border-zinc-800">
                  <span className="text-[8px] uppercase text-zinc-500 font-black tracking-widest mb-0.5">Tax</span>
                  <span className="text-xs font-bold text-zinc-400 font-mono tracking-tighter">{totals.taxTotal.toFixed(0)}</span>
                </div>
                <div className="flex flex-col items-center border-l border-zinc-800">
                  <span className="text-[8px] uppercase text-zinc-500 font-black tracking-widest mb-0.5">Disc</span>
                  <span className="text-xs font-bold text-zinc-400 font-mono tracking-tighter">{totals.discTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>

          </div>

          <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
            <DialogContent className="max-w-[99vw] md:max-w-5xl w-full md:w-[1000px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl">
              <div className={`p-6 ${ACCENT_GRADIENT} text-white`}>
                <DialogTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Box className="w-6 h-6" /> Item Registry
                </DialogTitle>
                <DialogDescription className="text-orange-100/70 font-bold uppercase text-[10px] tracking-widest mt-1">
                  Select an active SKU to assign to row sequence
                </DialogDescription>

                <div className="mt-4 relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" size={18} />
                  <Input
                    placeholder="Query by Title, ID, or Category..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-0 focus:bg-white/20 transition-all rounded-xl border-2 font-bold"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[500px] overflow-auto">
                <div className="grid grid-cols-12 bg-zinc-100 dark:bg-zinc-900 px-6 py-3 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="col-span-1 text-[9px] font-black uppercase text-zinc-500">Code</div>
                  <div className="col-span-3 text-[9px] font-black uppercase text-zinc-500">Registry Title</div>
                  <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-500">Trade Price</div>
                  <div className="col-span-2 text-center text-[9px] font-black uppercase text-zinc-500 flex flex-col justify-center">
                    <span className="leading-none">After Disc Price</span>
                    <span className="text-[7px] text-orange-500 mt-0.5">ACTIVE PRICE TYPE</span>
                  </div>
                  <div className="col-span-1 text-center text-[9px] font-black uppercase text-zinc-500">Avg</div>
                  <div className="col-span-1 text-center text-[9px] font-black uppercase text-zinc-500">Retail</div>
                  <div className="col-span-2 text-right text-[9px] font-black uppercase text-zinc-500">System Inventory</div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredItems.length > 0 ? filteredItems.map((item) => {
                    const packing = toNumber(item.packing_full || item.packing_qty) || 1;
                    const stock = toNumber(item.stock_1);
                    const full = Math.floor(stock / packing);
                    const pcs = stock % packing;

                    const tradePrice = toNumber(item.trade_price);
                    let activePriceTypeVal = tradePrice; // Default to trade price if no category or category 1
                    if (customerCategory && customerCategory !== "1") {
                      const priceKey = `pt${customerCategory}` as keyof Item;
                      const percentage = toNumber(item[priceKey as keyof Item]);
                      if (percentage !== 0) {
                        activePriceTypeVal = Math.round(tradePrice * (1 + percentage / 100));
                      }
                    }

                    const avgPrice = (toNumber(item.trade_price) + toNumber(item.retail)) / 2;
                    const isSelected = rows.some(r => r.item_id === item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          const existingRow = rows.find(r => r.item_id === item.id);
                          if (existingRow) {
                            removeRow(existingRow.id);
                            if (rows.length <= 1) addRow();
                          } else {
                            const emptyRow = rows.find(r => r.item_id === null);
                            if (emptyRow) {
                              handleSelectItem(emptyRow.id, item.id);
                            } else {
                              const newRowId = Date.now() + Math.random();
                              setRows((prev) => [
                                ...prev,
                                {
                                  id: newRowId,
                                  item_id: item.id,
                                  full: 0,
                                  pcs: 0,
                                  bonus_full: 0,
                                  bonus_pcs: 0,
                                  rate: activePriceTypeVal,
                                  taxPercent: toNumber(item.gst_percent),
                                  discPercent: toNumber(item.discount),
                                  trade_price: tradePrice,
                                  amount: 0,
                                },
                              ]);
                            }
                          }
                        }}
                        className={`w-full text-left transition-colors p-3 group border-l-4 ${isSelected
                          ? "bg-orange-50/50 dark:bg-orange-900/20 border-orange-500"
                          : "bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent hover:border-orange-300"
                          }`}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center py-1">
                          <div className="col-span-1 pl-2">
                            <span className={`font-mono font-black text-xs ${isSelected ? 'text-orange-600' : 'text-zinc-400'}`}>
                              #{String(item.id).padStart(4, '0')}
                            </span>
                          </div>
                          <div className="col-span-3 flex flex-col justify-center">
                            <div className={`font-black uppercase tracking-tight truncate text-base md:text-lg ${isSelected ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-100'}`}>
                              {item.title}
                            </div>
                            <div className="text-[11px] flex items-center gap-2 mt-0.5">
                              <span className="text-zinc-500 dark:text-zinc-400 font-mono tracking-tighter truncate">{item.short_name || 'Generic SKU'}</span>
                              {item.category && <span className="px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider">{item.category}</span>}
                            </div>
                          </div>

                          {/* Trade Price (TP) */}
                          <div className="col-span-2 text-center flex flex-col items-center justify-center">
                            <div className="text-sm md:text-base font-black text-zinc-800 dark:text-zinc-200">
                              <span className="text-[10px] text-zinc-400 mr-1 font-semibold">Rs</span>
                              {tradePrice.toFixed(2)}
                            </div>
                          </div>

                          {/* Active Price Type (T>P) */}
                          <div className={`col-span-2 text-center flex flex-col items-center justify-center rounded border p-1 ${isSelected ? 'bg-orange-500 text-white border-orange-600 shadow-sm' : 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/30 dark:border-orange-900/50'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest leading-none mb-0.5 ${isSelected ? 'text-orange-100' : 'text-orange-500'}`}>T{`>`}P</div>
                            <div className="text-base md:text-lg font-black leading-none">
                              <span className="text-[10px] font-semibold mr-0.5">Rs</span>
                              {activePriceTypeVal.toFixed(2)}
                            </div>
                          </div>

                          {/* Avg Price */}
                          <div className="col-span-1 text-center font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {avgPrice.toFixed(0)}
                          </div>

                          {/* Retail Price */}
                          <div className="col-span-1 text-center font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {toNumber(item.retail).toFixed(0)}
                          </div>

                          <div className="col-span-2 flex justify-end">
                            <div className="flex flex-col items-end pr-4">
                              <div className="flex gap-3">
                                <div className="flex flex-col items-end">
                                  <span className={`text-sm font-black ${stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{full}</span>
                                  <span className="text-[8px] uppercase font-bold text-zinc-400 tracking-tighter">Full</span>
                                </div>
                                <div className="flex flex-col items-end border-l border-zinc-200 dark:border-zinc-700 pl-3">
                                  <span className={`text-sm font-black ${stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{pcs}</span>
                                  <span className="text-[8px] uppercase font-bold text-zinc-400 tracking-tighter">Pcs</span>
                                </div>
                              </div>
                              <div className="text-[10px] font-mono mt-1 text-zinc-400">Total: {stock} units</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  }) : (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                      <PackageSearch className="w-12 h-12 text-zinc-200" />
                      <div className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Matches Found</div>
                      <Button variant="ghost" size="sm" onClick={() => setItemSearch('')} className="text-[10px] font-bold">Clear Filters</Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                <span>Showing {filteredItems.length} registry entries</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Enabled
                </span>
              </div>
            </DialogContent>
          </Dialog>

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
          <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
            <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-none shadow-2xl p-0 overflow-hidden">
              <div className={`p-6 ${ACCENT_GRADIENT} text-white`}>
                <DialogTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Banknote className="w-6 h-6" /> Checkout
                </DialogTitle>
                <DialogDescription className="text-orange-100/70 font-bold uppercase text-[10px] tracking-widest mt-1">
                  Enter instant payment details
                </DialogDescription>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Select Account</Label>
                  <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                    <SelectTrigger className="h-11 w-full font-bold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>{acc.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Amount Received</Label>
                  <Input
                    placeholder="Amount Received"
                    value={cashReceived || ""}
                    onChange={(e) => setCashReceived(toNumber(e.target.value))}
                    className="h-12 text-xl text-right font-black bg-emerald-50 text-emerald-700 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400"
                  />
                </div>
              </div>
              <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)} className="font-bold border-zinc-300 dark:border-zinc-700">Done</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset >
    </SidebarProvider >
  );
}
