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
import { Trash2, Plus, CalendarIcon, ListRestart, RotateCcw, ChevronDown, ChevronUp, Save, Wallet, Search, ArrowRightLeft, CheckCircle2, Info, Calculator, BadgePercent, ArrowDownToLine, Package, Hash, AlertTriangle, Banknote, Box, PackageSearch, Truck, CreditCard } from "lucide-react";
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
  { title: "Edit Invoice", href: "" },
];

const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-xl";
const PREMIUM_GRADIENT = "bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all duration-300";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-600 to-orange-500";
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

interface Sale {
  id: number;
  date: string;
  time?: string;
  invoice: string;
  code?: string;
  cash_credit?: string;
  customer?: Account;
  account_id?: number;
  customer_id?: number;
  salesman_id?: number;
  firm_id?: number;
  message_line_id?: number;
  courier_charges?: number;
  paid_amount?: number;
  print_format?: string;
  is_pay_now?: number | boolean;
  payment_account_id?: number;
  payment_method?: string;
  active?: number | boolean;
  items?: SalesItem[];
}

interface SalesItem {
  id: number;
  item_id: number;
  qty_carton: number;
  qty_pcs: number;
  bonus_qty_carton: number;
  bonus_qty_pcs: number;
  trade_price: number;
  retail_price: number;
  discount: number;
  gst_amount: number;
  subtotal: number;
  item?: Item;
}

interface Option {
  value: number;
  label: string;
}

const FieldWrapper = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

// ───────────────────────────────────────────
// Shared Components (Premium)
// ───────────────────────────────────────────
const TechLabel = ({ label, children, icon: Icon, className = "" }: { label: string; children: React.ReactNode; icon?: any; className?: string }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <div className="flex items-center gap-1.5 ml-1">
      {Icon && <Icon size={10} className="text-orange-500" />}
      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
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

export default function SalesPage({ sale, items, accounts, salemans, paymentAccounts = [], firms = [], messageLines = [] }: { sale: Sale; items: Item[]; accounts: Account[]; salemans: Saleman[]; paymentAccounts: Account[]; firms: { id: number; name: string; defult: boolean }[]; messageLines: MessageLine[] }) {
  const { appearance } = useAppearance();
  const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const selectBg = isDark ? '#0a0a0a' : '#ffffff';
  const selectBorder = isDark ? '#262626' : '#e5e7eb';

  // Initializations from sale
  const [date, setDate] = useState<Date | undefined>(sale.date ? new Date(sale.date) : new Date());
  const [time, setTime] = useState<string>(sale.time || new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [isTimeLive, setIsTimeLive] = useState(!sale.time);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isTimeLive) return;
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimeLive]);

  useEffect(() => {
    if (sale.customer_id) {
      axios.get(`/account/${sale.customer_id}/balance`).then(res => {
        setPreviousBalance(res.data.balance);
      }).catch(err => {
        console.error("Failed to fetch initial balance", err);
      });
    }
  }, [sale.customer_id]);

  const [code, setCode] = useState<string>(sale.code || "");
  const [party, setParty] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<number | "">(sale.customer?.credit_limit ? Number(sale.customer.credit_limit) : "");
  const [creditDays, setCreditDays] = useState<number>(sale.customer?.aging_days || 0);
  const [active, setActive] = useState<boolean>(sale.active === 1 || sale.active === true);
  const [invoiceNo, setInvoiceNo] = useState<string>(sale.invoice || "");
  const [salesman, setSalesman] = useState<number | null>(sale.salesman_id || null);
  const [customerCategory, setCustomerCategory] = useState<string | null>(sale.customer?.item_category ? String(sale.customer.item_category) : null);
  const [cashCredit, setCashCredit] = useState<string>(sale.cash_credit || "CREDIT");
  const [itemsCount, setItemsCount] = useState<number>(items.length);
  const [accountType, setAccountType] = useState<Option | null>(sale.customer ? { value: sale.customer.id, label: sale.customer.title } : null);
  const [courier, setCourier] = useState<number>(toNumber(sale.courier_charges));
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(toNumber(sale.paid_amount));
  const [printOption, setPrintOption] = useState<"big" | "small">(sale.print_format === "small" ? "small" : "big");
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false); // New state for bottom item info panel
  const [showStickyFooter, setShowStickyFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Firm selection state - default or from sale
  const [selectedFirmId, setSelectedFirmId] = useState<string>(sale.firm_id ? sale.firm_id.toString() : (firms.find(f => f.defult)?.id.toString() || "0"));
  const [selectedMessageId, setSelectedMessageId] = useState<string>(sale.message_line_id ? sale.message_line_id.toString() : "0");

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

  // Initial balance fetch
  React.useEffect(() => {
    if (sale.customer?.id) {
      axios.get(`/account/${sale.customer.id}/balance`).then(res => {
        setPreviousBalance(res.data.balance);
      }).catch(err => {
        console.error("Failed to fetch initial balance", err);
      });
    }
  }, [sale.customer?.id]);

  // Pay Now State
  const [isPayNow, setIsPayNow] = useState<boolean>(sale.is_pay_now === 1 || sale.is_pay_now === true);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState<boolean>(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string>(sale.payment_account_id ? sale.payment_account_id.toString() : "");
  const [paymentMethod, setPaymentMethod] = useState<string>(sale.payment_method || "Cash");
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

  const [rows, setRows] = useState<RowData[]>(
    sale.items && sale.items.length > 0
      ? sale.items.map(d => {
        const item = items.find(it => it.id === d.item_id);
        const packing = toNumber(item?.packing_full ?? item?.packing_qty ?? 1);
        return {
          id: Date.now() + Math.random() + d.id,
          item_id: d.item_id,
          full: toNumber(d.qty_carton),
          pcs: toNumber(d.qty_pcs),
          bonus_full: toNumber(d.bonus_qty_carton),
          bonus_pcs: toNumber(d.bonus_qty_pcs),
          rate: toNumber(d.trade_price),
          taxPercent: toNumber(d.subtotal) > 0 ? (toNumber(d.gst_amount) / toNumber(d.subtotal)) * 100 : 0,
          discPercent: toNumber(d.subtotal) > 0 ? (toNumber(d.discount) / toNumber(d.subtotal)) * 100 : 0,
          trade_price: toNumber(d.retail_price),
          amount: toNumber(d.subtotal)
        };
      })
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

  // Helper to calculate rate based on item and customer category
  const calculateRate = (item: Item, category: string | null): number => {
    let baseRate = toNumber(item.retail ?? item.trade_price ?? 0);
    const actualTradePrice = toNumber(item.trade_price ?? 0);

    if (category && actualTradePrice > 0) {
      let percentage = 0;
      switch (category) {
        case "2": percentage = toNumber(item.pt2); break;
        case "3": percentage = toNumber(item.pt3); break;
        case "4": percentage = toNumber(item.pt4); break;
        case "5": percentage = toNumber(item.pt5); break;
        case "6": percentage = toNumber(item.pt6); break;
        case "7": percentage = toNumber(item.pt7); break;
      }
      if (percentage > 0) {
        baseRate = Math.round(actualTradePrice * (1 + percentage / 100));
      }
    }
    return baseRate;
  };

  // Update all row rates when category changes
  const updateAllRowRates = (newCategory: string | null) => {
    setRows((prev) =>
      prev.map((r) => {
        if (!r.item_id) return r;
        const item = items.find((it) => it.id === r.item_id);
        if (!item) return r;
        const newRate = calculateRate(item, newCategory);
        return { ...r, rate: newRate };
      })
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
    baseRate = calculateRate(selected, customerCategory);

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

    const net = gross + taxTotal - discTotal + courier;
    const totalReceivable = net + previousBalance;

    return {
      gross: Number(gross.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discTotal: Number(discTotal.toFixed(2)),
      courier,
      net: Math.round(net),
      totalReceivable: Math.round(totalReceivable),
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
    setProcessing(true);
    router.put(`/sales/${sale.id}`, payload, {
      onSuccess: () => {
        setProcessing(false);
      },
      onError: (err) => {
        setProcessing(false);
        console.error(err);
      }
    });
  };

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const search = itemSearch.toLowerCase();
      return (
        it.title.toLowerCase().includes(search) ||
        it.short_name?.toLowerCase().includes(search) ||
        it.category?.toLowerCase().includes(search) ||
        String(it.id).includes(search)
      );
    });
  }, [items, itemSearch]);

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
                      const newCategory = selectedAccount.item_category ? String(selectedAccount.item_category) : null;
                      setCustomerCategory(newCategory);
                      updateAllRowRates(newCategory);
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
                      const newCategory = selectedAccount.item_category ? String(selectedAccount.item_category) : null;
                      setCustomerCategory(newCategory);
                      updateAllRowRates(newCategory);
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

          <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-4 overflow-hidden mt-3">
            {/* Main Area (Left) */}
            <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
              {/* Items Workspace */}
              <div className="flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Desktop Table Header */}
                <div className="hidden md:grid grid-cols-12 bg-zinc-100 dark:bg-zinc-800/50 p-3 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20">
                  <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center">Item Identification</div>
                  <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center">Full</div>
                  <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center">Pcs</div>
                  <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center">B.Full</div>
                  <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center">B.Pcs</div>
                  <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center">Rate</div>
                  <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center">Tax %</div>
                  <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center">Disc %</div>
                  <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center">Net Rate</div>
                  <div className="col-span-1 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-end">Subtotal</div>
                </div>

                {/* Scrollable Item Rows */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-2 md:p-0 max-h-none h-[47vh] md:max-h-[47vh]">
                  <div className="space-y-2 md:space-y-0">
                    {rows.map((row, index) => {
                      const item = items.find((it) => it.id === row.item_id);
                      const isSelected = activeRowId === row.id;
                      const computed = rowsWithComputed.find(r => r.id === row.id);

                      return (
                        <div
                          key={row.id}
                          className={`group transition-all duration-200 ${isSelected ? 'bg-orange-50/30 dark:bg-orange-950/10' : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30'}`}
                          onClick={() => setActiveRowId(row.id)}
                        >
                          {/* Desktop Row Grid */}
                          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50 items-center h-12">
                            {/* Product Info */}
                            <div className="col-span-3 flex items-center gap-2">
                              {item ? (
                                <button
                                  onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                  className="flex flex-col text-left group/item"
                                >
                                  <span className="text-xs font-black uppercase tracking-tighter truncate dark:text-zinc-100 group-hover/item:text-orange-500 transition-colors">
                                    {item.title}
                                  </span>
                                  <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest leading-none">ID: {item.id.toString().padStart(5, '0')}</span>
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

                            {/* Quantities */}
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={row.full || ""}
                                onChange={(e) => updateRow(row.id, { full: toNumber(e.target.value) })}
                                className="h-8 text-center text-xs font-mono border-zinc-200 dark:border-zinc-800 bg-transparent focus:bg-white dark:focus:bg-zinc-950 px-1"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={row.pcs || ""}
                                onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })}
                                className="h-8 text-center text-xs font-mono border-zinc-200 dark:border-zinc-800 bg-transparent focus:bg-white dark:focus:bg-zinc-950 px-1"
                              />
                            </div>

                            {/* Bonus */}
                            <div className="col-span-1 border-l border-zinc-200/50 dark:border-zinc-800/50 pl-1">
                              <Input
                                type="number"
                                value={row.bonus_full || ""}
                                onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })}
                                className="h-8 text-center text-xs font-mono border-zinc-200 dark:border-zinc-800 bg-transparent focus:bg-white dark:focus:bg-zinc-950 px-1 opacity-60 focus:opacity-100"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={row.bonus_pcs || ""}
                                onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })}
                                className="h-8 text-center text-xs font-mono border-zinc-200 dark:border-zinc-800 bg-transparent focus:bg-white dark:focus:bg-zinc-950 px-1 opacity-60 focus:opacity-100"
                              />
                            </div>

                            {/* Financials */}
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={row.rate || ""}
                                onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })}
                                className={`h-8 text-right pr-2 text-xs font-black bg-transparent focus:bg-white dark:focus:bg-zinc-950 ${computed?.isLoss ? 'text-red-500 border-red-200' : 'text-orange-600 border-zinc-200 dark:border-zinc-800'}`}
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={row.taxPercent || ""}
                                onChange={(e) => updateRow(row.id, { taxPercent: toNumber(e.target.value) })}
                                className="h-8 text-center text-xs font-mono border-zinc-200 dark:border-zinc-800 bg-transparent focus:bg-white dark:focus:bg-zinc-950 px-1"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                value={row.discPercent || ""}
                                onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })}
                                className="h-8 text-center text-xs font-mono border-zinc-200 dark:border-zinc-800 bg-transparent focus:bg-white dark:focus:bg-zinc-950 px-1"
                              />
                            </div>

                            {/* Net Rate & Subtotal */}
                            <div className="col-span-1 text-[10px] font-mono text-zinc-400 text-right bg-zinc-50/50 dark:bg-zinc-900/30 rounded h-8 flex items-center justify-end px-1 border border-zinc-100 dark:border-zinc-800">
                              {(toNumber(row.rate) * (1 - toNumber(row.discPercent) / 100)).toFixed(2)}
                            </div>

                            <div className="col-span-1 flex items-center justify-end gap-2 pr-2">
                              <div className="text-right font-black text-[11px] tracking-tighter text-zinc-900 dark:text-zinc-100 italic">
                                {computed?.amount.toLocaleString()}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                                onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>

                          {/* Mobile Item Card */}
                          <div className="md:hidden">
                            <Card className={`p-4 ${isSelected ? 'border-orange-400 ring-1 ring-orange-400/20' : 'border-zinc-200 dark:border-zinc-800'} relative overflow-hidden mb-2`}>
                              {computed?.isLoss && (
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-tighter rounded-bl-lg">
                                  Loss Warning
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1 min-w-0">
                                  <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Product</div>
                                  <Button
                                    variant="ghost"
                                    className={`p-0 h-auto text-[13px] font-bold text-left hover:bg-transparent ${item ? 'text-zinc-900 dark:text-zinc-100' : 'text-orange-500 italic'}`}
                                    onClick={() => {
                                      setActiveRowId(row.id);
                                      setItemDialogOpen(true);
                                    }}
                                  >
                                    {item ? item.title : "Identify Product..."}
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400"
                                  onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <TechLabel label="Full Cartons">
                                  <Input
                                    type="number"
                                    value={row.full || ""}
                                    onChange={(e) => updateRow(row.id, { full: toNumber(e.target.value) })}
                                    className="h-10 text-center font-bold border-zinc-200 dark:border-zinc-800"
                                  />
                                </TechLabel>
                                <TechLabel label="Single Pieces">
                                  <Input
                                    type="number"
                                    value={row.pcs || ""}
                                    onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })}
                                    className="h-10 text-center font-bold border-zinc-200 dark:border-zinc-800"
                                  />
                                </TechLabel>
                              </div>

                              {isSelected && (
                                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="grid grid-cols-2 gap-4">
                                    <TechLabel label="Bonus (CTN)">
                                      <Input
                                        type="number"
                                        value={row.bonus_full || ""}
                                        onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })}
                                        className="h-10 text-center border-zinc-200 dark:border-zinc-800"
                                      />
                                    </TechLabel>
                                    <TechLabel label="Bonus (PCS)">
                                      <Input
                                        type="number"
                                        value={row.bonus_pcs || ""}
                                        onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })}
                                        className="h-10 text-center border-zinc-200 dark:border-zinc-800"
                                      />
                                    </TechLabel>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <TechLabel label="Rate">
                                      <Input
                                        type="number"
                                        value={row.rate || ""}
                                        onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })}
                                        className="h-10 text-center font-bold text-orange-600 border-orange-200"
                                      />
                                    </TechLabel>
                                    <TechLabel label="Tax %">
                                      <Input
                                        type="number"
                                        value={row.taxPercent || ""}
                                        onChange={(e) => updateRow(row.id, { taxPercent: toNumber(e.target.value) })}
                                        className="h-10 text-center border-zinc-200 dark:border-zinc-800"
                                      />
                                    </TechLabel>
                                    <TechLabel label="Disc %">
                                      <Input
                                        type="number"
                                        value={row.discPercent || ""}
                                        onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })}
                                        className="h-10 text-center border-zinc-200 dark:border-zinc-800"
                                      />
                                    </TechLabel>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                                <div className="text-[10px] font-black uppercase text-zinc-400">Line Subtotal</div>
                                <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                                  PKR {computed?.amount.toLocaleString()}
                                </div>
                              </div>
                            </Card>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Items Table Summary Footer */}
                <div className="hidden md:flex bg-zinc-100/90 dark:bg-zinc-800/90 border-t border-zinc-200 dark:border-zinc-800 p-2 items-center justify-between h-11 ring-1 ring-inset ring-white/5">
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addRow}
                      className="h-7 px-3 bg-zinc-800 hover:bg-zinc-700 text-white hover:text-orange-400 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-300 flex items-center gap-2"
                    >
                      <Plus size={12} className="text-orange-400" />
                      Append New Line
                    </Button>

                    <div className="flex items-center gap-6 border-l border-zinc-300 dark:border-zinc-700 pl-6 h-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Gross Total:</span>
                        <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 tracking-tighter">PKR {totals.gross.toLocaleString()}</span>
                      </div>
                      <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Tax (Sum):</span>
                        <span className="text-[11px] font-black text-emerald-600 tracking-tighter">+{totals.taxTotal.toLocaleString()}</span>
                      </div>
                      <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Disc (Sum):</span>
                        <span className="text-[11px] font-black text-rose-500 tracking-tighter">-{totals.discTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-black text-orange-600 italic tracking-tighter pr-2">
                    PKR {Math.round(totals.gross + totals.taxTotal - totals.discTotal).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Mobile Add Row (Floating/Sticky part) */}
              <div className="md:hidden pt-2">
                <Button
                  onClick={addRow}
                  className={`w-full h-12 shadow-lg shadow-orange-500/20 ${ACCENT_GRADIENT} text-white font-bold rounded-xl`}
                >
                  <Plus size={18} className="mr-2" /> Add Next Product
                </Button>
              </div>

              {/* Selected Item Info Panel */}
              <div className="mt-2 flex flex-col md:h-[206px]">
                <div className="flex-1 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm relative transition-all duration-300">
                  {activeRowId && rows.find(r => r.id === activeRowId)?.item_id ? (
                    (() => {
                      const row = rows.find(r => r.id === activeRowId)!;
                      const selectedItem = items.find(it => it.id === row.item_id)!;
                      const packing = toNumber(selectedItem.packing_full || selectedItem.packing_qty) || 1;
                      const currentStock = toNumber(selectedItem.stock_1);
                      const enteredQty = (toNumber(row.full) * packing) + toNumber(row.pcs) + (toNumber(row.bonus_full) * packing) + toNumber(row.bonus_pcs);
                      const remainingStock = currentStock - enteredQty;

                      return (
                        <div className="flex flex-col h-full animate-in slide-in-from-bottom-2 duration-300">
                          {/* Top Header */}
                          <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/10">
                            <h3 className="text-sm font-black dark:text-zinc-100 flex items-center gap-2 tracking-tight uppercase">
                              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                              {selectedItem.title}
                              <span className="text-[10px] font-semibold text-zinc-400 normal-case ml-1 tracking-tighter">({selectedItem.short_name || "N/A"})</span>
                            </h3>
                            <div className="bg-blue-600 px-3 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-wider shadow-sm">
                              {selectedItem.company || 'N/A'}
                            </div>
                          </div>

                          {/* Content Grid */}
                          <div className="flex-1 flex flex-col md:flex-row p-3 gap-4 overflow-hidden">
                            {/* Left: Inventory & Price Tiers */}
                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                              {/* Stock Metrics Row */}
                              <div className="grid grid-cols-4 gap-2">
                                <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                                  <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Packing Qty</div>
                                  <div className="text-lg font-black text-zinc-800 dark:text-zinc-100 leading-none tracking-tighter">
                                    {packing} <span className="text-[9px] text-zinc-400 uppercase">PCS/F</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                                  <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Stock (Full)</div>
                                  <div className="text-lg font-black text-zinc-800 dark:text-zinc-100 leading-none tracking-tighter">
                                    {Math.floor(remainingStock / packing)} <span className="text-[9px] text-zinc-400 uppercase">F</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                                  <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Stock (Pieces)</div>
                                  <div className="text-lg font-black text-zinc-800 dark:text-zinc-100 leading-none tracking-tighter">
                                    {remainingStock % packing} <span className="text-[9px] text-zinc-400 uppercase">P</span>
                                  </div>
                                </div>
                                <div className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border ${remainingStock < 0 ? 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10' : 'border-orange-200 bg-orange-50/80 dark:border-orange-900/30 dark:bg-orange-900/10'}`}>
                                  <div className={`text-[8px] font-black uppercase tracking-widest mb-1 leading-none ${remainingStock < 0 ? 'text-rose-500' : 'text-orange-500'}`}>Total Stock</div>
                                  <div className={`text-lg font-black leading-none tracking-tighter ${remainingStock < 0 ? 'text-rose-600' : 'text-orange-600'}`}>
                                    {remainingStock} <span className="text-[9px] opacity-60">PCS</span>
                                  </div>
                                </div>
                              </div>

                              {/* Price Tiers Grid */}
                              <div className="grid grid-cols-6 gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 overflow-x-auto custom-scrollbar">
                                {[2, 3, 4, 5, 6, 7].map((num) => {
                                  const priceKey = `pt${num}` as keyof Item;
                                  const percentage = toNumber(selectedItem[priceKey]);
                                  if (percentage === 0 && String(num) !== customerCategory) return null;

                                  const tradePriceValue = toNumber(selectedItem.trade_price);
                                  const calculatedPrice = Math.round(tradePriceValue * (1 + percentage / 100));
                                  const isActive = String(num) === customerCategory;

                                  return (
                                    <div key={num} className={`rounded-md px-1.5 py-1.5 flex flex-col justify-center text-center transition-all min-w-[70px] ${isActive ? 'bg-orange-600 text-white shadow-md' : 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500'}`}>
                                      <div className="flex items-center justify-between gap-1 w-full scale-90">
                                        <span className={`text-[7px] font-black uppercase ${isActive ? 'text-orange-100' : 'text-zinc-400'}`}>PT-{num}</span>
                                        <span className={`text-[7px] font-black ${isActive ? 'text-orange-100' : 'text-zinc-400'}`}>{percentage}%</span>
                                      </div>
                                      <div className={`text-[10px] font-black tracking-tight mt-0.5 ${isActive ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        {calculatedPrice.toLocaleString()}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right Side: Primary Pricing */}
                            <div className="w-full md:w-56 flex flex-col justify-center gap-2 pl-0 md:pl-4 border-l-0 md:border-l border-zinc-100 dark:border-zinc-800/60 pt-3 md:pt-0">
                              <div className="flex items-center justify-between group">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Trade Price</span>
                                <span className="text-sm font-black text-blue-600 leading-none"><span className="text-[8px] text-zinc-400 mr-1 italic">PKR</span>{toNumber(selectedItem.trade_price).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between group">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Retail Price</span>
                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-none"><span className="text-[8px] text-zinc-400 mr-1 italic">PKR</span>{toNumber(selectedItem.retail).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between group">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-emerald-600">Average Price</span>
                                <span className="text-sm font-black text-emerald-600 leading-none"><span className="text-[8px] text-zinc-400 mr-1 italic">PKR</span>{((toNumber(selectedItem.trade_price) + toNumber(selectedItem.retail)) / 2).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-800">
                      <PackageSearch size={32} strokeWidth={1} className="mb-2 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No Product Selected for Analytics</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar (Financial Summary) */}
            <div className="w-full md:w-[320px]  pr-2 flex flex-col gap-3">
              <Card className="flex-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col gap-6 shadow-xl shadow-zinc-200/20 dark:shadow-none overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
                {/* Visual Summary */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Gross Total</span>
                    <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100 flex items-baseline gap-1">
                      <span className="text-sm font-semibold">PKR</span>
                      {totals.gross.toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-emerald-600">Tax (+)</span>
                      <div className="text-sm font-black text-zinc-700 dark:text-zinc-300">
                        {totals.taxTotal.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-rose-500">Disc (-)</span>
                      <div className="text-sm font-black text-zinc-700 dark:text-zinc-300">
                        {totals.discTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <TechLabel label="Courier Service" icon={Truck}>
                      <div className="relative group/courier">
                        <Input
                          type="number"
                          value={courier || ""}
                          onChange={(e) => setCourier(toNumber(e.target.value))}
                          className="h-10 pl-8 font-black text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        />
                        <Truck size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within/courier:text-orange-500 transition-colors" />
                      </div>
                    </TechLabel>
                  </div>
                </div>

                {/* Net Total Highlight */}
                <div className={`p-4 rounded-xl ${ACCENT_GRADIENT} shadow-lg shadow-orange-500/20 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-2 opacity-20"><CreditCard size={40} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-100 block mb-1">Net Payable Total</span>
                  <div className="text-3xl font-black flex items-baseline gap-1">
                    <span className="text-base font-semibold">PKR</span>
                    {totals.net.toLocaleString()}
                  </div>
                </div>

                {/* Account Balances */}
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest italic">{accountType ? accountType.label : "UNASSIGNED"}</span>
                        <span className="text-[11px] font-black text-zinc-500">PREV BALANCE</span>
                      </div>
                      <div className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                        PKR {previousBalance.toLocaleString()}
                      </div>
                    </div>


                  </div>
                </div>

                {/* Checkout & Printing Config */}
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
              </Card>

              {/* Final Actions */}
              <div className="flex flex-col gap-0 pt-2 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                <Button
                  onClick={handleSave}
                  disabled={processing}
                  className={`h-14 w-full ${ACCENT_GRADIENT} text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all`}
                >
                  {processing ? "Syncing..." : "Finalize Invoice"}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Sticky Footer */}
          <div className={`md:hidden fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/60 dark:border-gray-700/60 p-4 z-50 shadow-2xl transition-transform duration-300 ${showStickyFooter ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex flex-col">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-0.5">Net Total</div>
                <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                  <span className="text-sm font-semibold mr-1">PKR</span>
                  {Math.round(totals.net).toLocaleString()}
                </div>
              </div>
              <Button onClick={handleSave} disabled={processing} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/50 rounded-xl font-bold transition-all active:scale-95">
                {processing ? "Saving..." : <><Save className="mr-2" size={18} /> Update Invoice</>}
              </Button>
            </div>

            {/* Mini Details */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold">Gross</span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{totals.gross.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center border-l border-zinc-100 dark:border-zinc-800">
                <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold text-emerald-600">Tax</span>
                <span className="text-xs font-semibold text-emerald-600">+{totals.taxTotal.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center border-l border-zinc-100 dark:border-zinc-800">
                <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold text-rose-500">Disc</span>
                <span className="text-xs font-semibold text-rose-500">-{totals.discTotal.toLocaleString()}</span>
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
                              <span className="text-[10px] text-zinc-400 mr-1 font-semibold">PKR</span>
                              {tradePrice.toFixed(2)}
                            </div>
                          </div>

                          {/* Active Price Type (T>P) */}
                          <div className={`col-span-2 text-center flex flex-col items-center justify-center rounded border p-1 ${isSelected ? 'bg-orange-500 text-white border-orange-600 shadow-sm' : 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/30 dark:border-orange-900/50'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest leading-none mb-0.5 ${isSelected ? 'text-orange-100' : 'text-orange-500'}`}>T{`>`}P</div>
                            <div className="text-base md:text-lg font-black leading-none">
                              <span className="text-[10px] font-semibold mr-0.5">PKR</span>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
