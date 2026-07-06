import React, { useState, useMemo, useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { Trash2, Plus, CalendarIcon, ListRestart, RotateCcw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Save, Wallet, Search, ArrowRightLeft, CheckCircle2, Info, Calculator, BadgePercent, ArrowDownToLine, Package, Hash, AlertTriangle, Banknote, Box, PackageSearch, CreditCard, Layers, MapPin, CalendarDays, TrendingDown } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ItemRegistryDialog } from "./components/ItemRegistryDialog";
import { CheckoutDialog } from "./components/CheckoutDialog";
import { SuccessDialog } from "./components/SuccessDialog";
import { StockWarningDialog } from "./components/StockWarningDialog";

// ───────────────────────────────────────────
// Breadcrumbs
// ───────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Sales", href: "/sales" },
  { title: "Edit Invoice", href: "" },
];

const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_XS = "rounded-md";
const PREMIUM_ROUNDING_SM = "rounded-lg";
const PREMIUM_ROUNDING_MD = "rounded-md";
const PREMIUM_ROUNDING_LG = "rounded-2xl";
const PREMIUM_ROUNDING_XL = "rounded-3xl";
const PREMIUM_GRADIENT = "bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all duration-300";
const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600";
const CARD_BASE = "bg-white dark:bg-card border border-zinc-200 dark:border-zinc-800 shadow-sm";
const SOFT_GLASS = "bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────
interface InventoryItem {
  id: number;
  code?: string;
  title: string;
  short_name?: string;
  company?: string;
  trade_price?: number;
  retail?: number;
  retail_tp_diff?: number;
  packing_qty?: number;
  packing_full?: number;
  pcs?: number;
  shelf?: string;
  scheme?: string;
  scheme2?: string;
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
  total_stock_pcs?: number;
  price_per_pcs?: number;
  stock_breakdown?: string;
  last_purchase_date?: string;
  last_purchase_full?: number;
  last_purchase_pcs?: number;
  last_purchase_rate?: number;
  last_supplier?: string;
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

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const formatLocalDate = (date: Date | undefined) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  account_type?: { name: string };
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
  value: string;
  label: string;
}

interface SaleItem {
  id: number;
  item_id: number;
  qty_carton: number | string;
  qty_pcs: number | string;
  bonus_qty_carton: number | string;
  bonus_qty_pcs: number | string;
  trade_price: number | string;
  retail_price: number | string;
  discount: number | string;
  subtotal: number | string;
}

interface Sale {
  id: number;
  invoice: string;
  code?: string;
  date?: string;
  salesman_id?: number | null;
  customer?: Account | null;
  courier_charges?: number | string;
  extra_discount?: number | string;
  print_format?: string;
  firm_id?: number | null;
  message_line_id?: number | null;
  items?: SaleItem[];
  splits?: any[];
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

const TechLabel = ({ children, icon: Icon, label, className = "space-y-1.5 flex-1 min-w-0" }: { children: React.ReactNode, icon?: any, label: string, className?: string }) => (
  <div className={className}>
    <div className="flex items-center gap-2 px-1">
      {Icon && <Icon size={10} className="text-orange-500 shrink-0" />}
      <span className="text-[10px] font-black uppercase text-zinc-700 dark:text-zinc-300 tracking-widest truncate">{label}</span>
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

export default function SalesEditPage({ sale, items, accounts, salemans, paymentAccounts = [], firms = [], messageLines = [] }: { sale: Sale; items: InventoryItem[]; accounts: Account[]; salemans: Saleman[]; paymentAccounts: Account[]; firms: { id: number; name: string; defult: boolean }[]; messageLines: MessageLine[] }) {
  const { appearance } = useAppearance();
  const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [date, setDate] = useState<Date | undefined>(sale.date ? parseLocalDate(sale.date) : new Date());
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

  const [code, setCode] = useState<string>(sale.code || "");
  const [creditLimit, setCreditLimit] = useState<number | "">(
    typeof sale.customer?.credit_limit === "number"
      ? sale.customer.credit_limit
      : (sale.customer?.credit_limit ? Number(sale.customer.credit_limit) : "")
  );
  const [creditDays, setCreditDays] = useState<number>(sale.customer?.aging_days ?? 0);
  const [invoiceNo, setInvoiceNo] = useState<string>(sale.invoice);
  const [salesman, setSalesman] = useState<number | null>(sale.salesman_id || null);
  const [customerCategory, setCustomerCategory] = useState<string | null>(sale.customer?.item_category ? String(sale.customer.item_category) : null);
  const [cashCredit, setCashCredit] = useState<string>("CREDIT");
  const [accountType, setAccountType] = useState<Option | null>(sale.customer ? { value: String(sale.customer.id), label: sale.customer.title } : null);
  const [courier, setCourier] = useState<number>(toNumber(sale.courier_charges));
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [useAdvance, setUseAdvance] = useState<boolean>(false);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [printOption, setPrintOption] = useState<"big" | "small">(sale.print_format === "small" ? "small" : "big");
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showStickyFooter, setShowStickyFooter] = useState(true);

  // Firm selection state - default to firm marked as default
  const defaultFirm = firms.find(f => f.defult);
  const [selectedFirmId, setSelectedFirmId] = useState<string>(sale.firm_id?.toString() || (defaultFirm ? defaultFirm.id.toString() : "0"));
  const [selectedMessageId, setSelectedMessageId] = useState<string>(sale.message_line_id?.toString() || "0");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Fetch initial balance
  useEffect(() => {
    if (sale.customer?.id) {
      axios.get(`/account/${sale.customer.id}/balance`).then(res => {
        setPreviousBalance(res.data.balance);
      }).catch(err => {
        console.error("Failed to fetch balance", err);
        setPreviousBalance(0);
      });
    }
  }, [sale.customer?.id]);

  // Pay Now State
  const [isPayNow, setIsPayNow] = useState<boolean>(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState<boolean>(false);
  const [extraDiscount, setExtraDiscount] = useState<number>(toNumber(sale.extra_discount));
  const [processing, setProcessing] = useState<boolean>(false);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showBottomDetails, setShowBottomDetails] = useState(true);

  // Split Payments State
  const [isMultiPayment, setIsMultiPayment] = useState<boolean>(true);
  const [splits, setSplits] = useState<any[]>(() => {
    if (!sale.splits?.length) return [{ id: Date.now(), payment_account_id: "", amount: 0, payment_method: "Cash", cheque_no: "", cheque_date: "", clear_date: "" }];
    return sale.splits.map(s => ({ ...s, id: s.id || Date.now() + Math.random() }));
  });

  const addSplitRow = () => {
    setSplits([...splits, { id: Date.now() + Math.random(), payment_account_id: "", amount: 0, payment_method: "Cash", cheque_no: "", cheque_date: "", clear_date: "" }]);
  };

  const removeSplitRow = (id: number | string) => {
    if (splits.length > 1) {
      setSplits(splits.filter(s => s.id !== id));
    }
  };

  const updateSplitRow = (id: number | string, field: string, value: any) => {
    setSplits(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        if (field === 'payment_account_id') {
          const acc = paymentAccounts.find(a => a.id.toString() === value);
          const typeName = acc?.account_type?.name;

          if (typeName === 'Bank') {
            updated.payment_method = 'Online';
          } else if (typeName === 'Cheque in hand') {
            updated.payment_method = 'Cheque';
          } else {
            updated.payment_method = 'Cash';
          }

          if (typeName !== 'Cheque in hand') {
            updated.cheque_no = "";
            updated.cheque_date = "";
          }
        }
        return updated;
      }
      return s;
    }));
  };

  // Item Registry Selected Details
  const [selectedItemForQty, setSelectedItemForQty] = useState<InventoryItem | null>(null);
  const [dialogFull, setDialogFull] = useState<number>(0);
  const [dialogPcs, setDialogPcs] = useState<number>(0);
  const [dialogBonusFull, setDialogBonusFull] = useState<number>(0);
  const [dialogBonusPcs, setDialogBonusPcs] = useState<number>(0);
  const [dialogRate, setDialogRate] = useState<number>(0);

  // Item Selection Dialog State
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [activeRowId, setActiveRowId] = useState<number | null>(null);

  const accountTypeOptions: Option[] = useMemo(() => {
    return accounts.map((acc) => ({
      value: String(acc.id),
      label: `${acc.title}${acc.code ? ` (${acc.code})` : ""}`,
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
    if (!sale.items?.length) return [getEmptyRow()];
    return sale.items.map(si => {
      const subtotal = toNumber(si.subtotal);
      const disc = toNumber(si.discount);
      return {
        id: si.id,
        item_id: si.item_id ? Number(si.item_id) : null,
        full: toNumber(si.qty_carton),
        pcs: toNumber(si.qty_pcs),
        bonus_full: toNumber(si.bonus_qty_carton),
        bonus_pcs: toNumber(si.bonus_qty_pcs),
        rate: toNumber(si.trade_price),
        taxPercent: 0,
        discPercent: subtotal > 0 ? (disc / subtotal) * 100 : 0,
        trade_price: toNumber(si.retail_price),
        amount: subtotal
      };
    });
  });

  // Track the currently selected item for displaying info
  const [selectedItemId, setSelectedItemId] = useState<number | null>(() => {
    if (sale.items?.length && sale.items[0].item_id) {
      return Number(sale.items[0].item_id);
    }
    return null;
  });

  const selectedItem = useMemo<InventoryItem | null>(() => {
    if (!selectedItemId) return null;
    return items.find((it) => Number(it.id) === Number(selectedItemId)) ?? null;
  }, [selectedItemId, items]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    const filtered = items.filter((it) =>
      it.title.toLowerCase().includes(q) ||
      (it.short_name?.toLowerCase().includes(q)) ||
      (it.category?.toLowerCase().includes(q)) ||
      String(it.id).includes(q)
    );
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

  const handleSelectItem = (rowId: number, itemId: number) => {
    const selected = items.find((it) => Number(it.id) === Number(itemId));
    if (!selected) return;

    let baseRate = toNumber(selected.retail ?? selected.trade_price ?? 0);
    const tax = toNumber(selected.gst_percent ?? 0);
    const disc = toNumber(selected.discount ?? 0);
    const tradePrice = toNumber(selected.retail ?? selected.trade_price ?? baseRate);

    const actualTradePrice = toNumber(selected.trade_price ?? 0);
    if (customerCategory && actualTradePrice > 0) {
      if (customerCategory === "1") {
        baseRate = actualTradePrice;
      } else {
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
          baseRate = percentage;
        }
      }
    }

    updateRow(rowId, { item_id: itemId, rate: baseRate, taxPercent: 0, discPercent: disc, trade_price: tradePrice });
    setSelectedItemId(itemId);
  };

  const recalcRowAmount = (row: RowData, item?: InventoryItem) => {
    const packing = Math.max(1, toNumber(item?.packing_qty ?? 1));
    const rate = toNumber(row.rate);
    const amount = (toNumber(row.full) * rate) + (toNumber(row.pcs) * (rate / packing));
    return Math.round(amount);
  };

  const rowsWithComputed = useMemo(() => {
    const itemUsage = new Map<number, number>();
    rows.forEach(r => {
      if (r.item_id) {
        const item = items.find(it => Number(it.id) === Number(r.item_id));
        if (item) {
          const packing = toNumber(item.packing_qty ?? 1);
          const qty = (r.full * packing) + r.pcs + (r.bonus_full * packing) + r.bonus_pcs;
          const current = itemUsage.get(r.item_id) || 0;
          itemUsage.set(r.item_id, current + qty);
        }
      }
    });

    return rows.map((r) => {
      const item = items.find((it) => Number(it.id) === Number(r.item_id)) ?? undefined;
      const amount = recalcRowAmount(r, item);

      let stockExceeded = false;
      if (item) {
        const totalUsage = itemUsage.get(item.id) || 0;
        const availableStock = toNumber(item.total_stock_pcs ?? ((item.stock_1 ?? 0) * (item.packing_qty ?? 1) + (item.stock_2 ?? 0)));
        if (totalUsage > availableStock) {
          stockExceeded = true;
        }
      }

      let isLoss = false;
      if (item) {
        const allRates = [item.retail, item.pt2, item.pt3, item.pt4, item.pt5, item.pt6, item.pt7];
        const validRates = allRates.map(r => toNumber(r)).filter(r => r > 0);
        if (validRates.length > 0) {
          const minPrice = Math.min(...validRates);
          if (toNumber(r.rate) < minPrice) {
            isLoss = true;
          }
        }
      }

      return { ...r, amount, stockExceeded, isLoss };
    });
  }, [rows, items]);

  const totals = useMemo(() => {
    let gross = 0;
    let discTotal = 0;

    rowsWithComputed.forEach((r) => {
      const amount = r.amount;
      gross += amount;
      const disc = (toNumber(r.discPercent) / 100) * amount;
      discTotal += disc;
    });

    const net = Math.round(gross - discTotal + courier);

    let appliedAdvance = 0;
    let netSettlement = net;
    let receivable = net;

    if (previousBalance < 0) {
      const availableAdvance = Math.abs(previousBalance);
      appliedAdvance = useAdvance ? Math.min(net, availableAdvance) : 0;
      netSettlement = Math.max(0, net - appliedAdvance);
      receivable = netSettlement;
    } else {
      receivable = Math.round(net + previousBalance);
      netSettlement = receivable;
    }

    const finalAmount = Math.round(receivable - extraDiscount);

    return {
      gross: Number(gross.toFixed(2)),
      taxTotal: 0,
      discTotal: Number(discTotal.toFixed(2)),
      courier,
      net,
      appliedAdvance,
      netSettlement,
      receivable,
      finalAmount,
    };
  }, [rowsWithComputed, items, courier, previousBalance, extraDiscount, useAdvance]);

  const isOverLimit = useMemo(() => {
    if (typeof creditLimit !== "number") return false;
    if (!totals) return false;
    return totals.net > creditLimit;
  }, [creditLimit, totals]);

  const handleSave = async () => {
    const stockErrors = rowsWithComputed.filter(r => r.stockExceeded);
    if (stockErrors.length > 0) {
      setShowStockWarning(true);
      return;
    }
    saveInvoice();
  };

  const saveInvoice = (forceSave = false) => {
    // Only submit splits with real amounts
    const newSplits = splits.filter(s => toNumber(s.amount) > 0);

    const payload = {
      date: date ? formatLocalDate(date) : formatLocalDate(new Date()),
      invoice: invoiceNo,
      code: code,
      type: cashCredit,
      customer_id: accountType?.value,
      salesman_id: salesman,
      firm_id: selectedFirmId && selectedFirmId !== "0" ? Number(selectedFirmId) : null,
      no_of_items: rowsWithComputed.length,
      print_format: printOption,
      allow_negative_stock: forceSave,

      is_pay_now: isPayNow,
      is_multi: isMultiPayment,
      splits: newSplits,
      message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,

      gross_total: totals.gross,
      discount_total: totals.discTotal,
      extra_discount: extraDiscount,
      tax_total: totals.taxTotal,
      courier_charges: totals.courier,
      net_total: totals.net,
      total_receivable: totals.finalAmount,
      paid_amount: newSplits.reduce((acc, s) => acc + toNumber(s.amount), 0),
      remaining_amount: totals.net - newSplits.reduce((acc, s) => acc + toNumber(s.amount), 0),

      items: rowsWithComputed.map((r) => {
        const item = items.find(i => Number(i.id) === Number(r.item_id));
        const packing = Math.max(1, toNumber(item?.packing_qty ?? 1));
        const totalPCS = ((toNumber(r.full) + toNumber(r.bonus_full || 0)) * packing) + toNumber(r.pcs) + toNumber(r.bonus_pcs || 0);

        return {
          item_id: r.item_id,
          qty_carton: toNumber(r.full),
          qty_pcs: toNumber(r.pcs),
          bonus_qty_carton: toNumber(r.bonus_full),
          bonus_qty_pcs: toNumber(r.bonus_pcs),
          total_pcs: totalPCS,
          trade_price: r.rate,
          retail_price: r.trade_price,
          discount: (r.discPercent / 100) * r.amount,
          gst_amount: 0,
          subtotal: r.amount
        };
      }).filter(r => r.item_id !== null)
    };

    setProcessing(true);
    router.put(`/sales/${sale.id}`, payload, {
      onSuccess: () => {
        setSuccessData({
          customerName: accountType?.label || "Unknown Customer",
          totalAmount: totals.net - extraDiscount,
          itemCount: rowsWithComputed.length,
          totalFull: rowsWithComputed.reduce((acc, r) => acc + toNumber(r.full), 0),
          totalPcs: rowsWithComputed.reduce((acc, r) => acc + toNumber(r.pcs), 0),
          totalDiscount: totals.discTotal + extraDiscount,
          saleId: sale.id
        });
        setShowSuccessDialog(true);
      },
      onError: (errors) => {
        console.error(errors);
        alert("Failed to save sale. Check console for details.");
      },
      onFinish: () => setProcessing(false)
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider
        defaultOpen={false}
        style={{
          "--sidebar-width": "calc(var(--spacing) * 61)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="md:overflow-hidden md:h-screen flex flex-col">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 flex flex-col md:flex-row min-h-0 md:overflow-hidden">
            {/* Main Area (Left) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-2 md:p-4 gap-2">

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
                    <Combobox
                      options={accountTypeOptions}
                      value={accountType?.value || ""}
                      onChange={(val) => {
                        const selectedOption = accountTypeOptions.find((o) => o.value === val) || null;
                        setAccountType(selectedOption);
                        const id = selectedOption ? Number(selectedOption.value) : null;
                        const selectedAccount = id ? accounts.find((a) => Number(a.id) === Number(id)) ?? null : null;

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
                      placeholder="Select Customer..."
                      searchPlaceholder="Search by name or code..."
                      className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    />
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
                    <Combobox
                      options={accountTypeOptions}
                      value={accountType?.value || ""}
                      onChange={(val) => {
                        const selectedOption = accountTypeOptions.find((o) => o.value === val) || null;
                        setAccountType(selectedOption);
                        const id = selectedOption ? Number(selectedOption.value) : null;
                        const selectedAccount = id ? accounts.find((a) => Number(a.id) === Number(id)) ?? null : null;

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
                      placeholder="Identify Customer..."
                      searchPlaceholder="Search by name or code..."
                      className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-9 text-xs font-bold uppercase"
                    />
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
                  <Card className="p-0 overflow-hidden gap-0 border-0 md:border shadow-none md:shadow-sm bg-transparent md:bg-card">
                    <div className="overflow-visible md:overflow-x-auto">
                      <div className="w-full md:min-w-[1200px]">
                        <div className="hidden md:grid grid-cols-12 bg-zinc-50 dark:bg-zinc-900/80 p-3 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-20">
                          <div className="col-span-4 text-[10px] font-black uppercase tracking-widest">Item Identification</div>
                          <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest">Full</div>
                          <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest">Pcs</div>
                          <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest">B.Full</div>
                          <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest">B.Pcs</div>
                          <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest">Rate</div>
                          <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest">Disc %</div>
                          <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest">After</div>
                          <div className="col-span-1 text-right text-[10px] font-black uppercase tracking-widest">Subtotal</div>
                        </div>

                        {/* Rows */}
                        <div className="max-h-none h-auto md:h-[100vh] max-h-[100vh] md:max-h-[100vh] overflow-y-auto custom-scrollbar md:overflow-auto space-y-3 md:space-y-0 text-sm">
                          {rowsWithComputed.map((row) => (
                            <React.Fragment key={row.id}>
                              {/* Mobile Card View */}
                              <div className={`block md:hidden rounded-xl border p-4 bg-white dark:bg-zinc-950 shadow-sm relative overflow-hidden transition-all mb-4 ${row.stockExceeded ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <button
                                    onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                    className="flex flex-col gap-1 text-left"
                                  >
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Item</div>
                                    {row.item_id ? (
                                      <div className="text-sm font-black text-zinc-900 dark:text-white uppercase italic flex items-center gap-1.5">
                                        {items.find(it => Number(it.id) === Number(row.item_id))?.title}
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
                                  {toNumber(items.find(it => Number(it.id) === Number(row.item_id))?.packing_qty) > 1 && (
                                    <TechLabel label="Pieces" className="animate-in zoom-in-95 duration-200">
                                      <Input type="number" placeholder="PIECES" value={row.pcs || ""} onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-10 text-center font-black rounded-lg bg-zinc-50/50" />
                                    </TechLabel>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 border-dashed grid grid-cols-2 gap-2 items-end">
                                  <TechLabel label="Rate">
                                    <Input type="number" value={row.rate || ""} onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-9 text-xs font-bold rounded-lg" />
                                  </TechLabel>
                                  <TechLabel label="Disc%">
                                    <Input type="number" value={row.discPercent || ""} onChange={(e) => updateRow(row.id, { discPercent: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-9 text-xs font-bold rounded-lg" />
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

                              {/* Desktop Row View */}
                              <div className={cn(
                                "hidden md:grid grid-cols-12 gap-2 p-2.5 border-b items-center group transition-colors last:border-0",
                                row.stockExceeded
                                  ? "bg-rose-200 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 shadow-[inset_4px_0_0_0_#f43f5e]"
                                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 border-b-zinc-50 dark:border-b-zinc-900/50"
                              )}>
                                <div className="col-span-4">
                                  {row.item_id ? (
                                    <button
                                      onClick={() => { setActiveRowId(row.id); setItemDialogOpen(true); }}
                                      className="flex flex-col text-left group/item"
                                    >
                                      <span className="text-xs font-black uppercase tracking-tighter truncate dark:text-zinc-100 group-hover/item:text-orange-500 transition-colors">
                                        {items.find(it => Number(it.id) === Number(row.item_id))?.title}
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
                                  {toNumber(items.find(it => Number(it.id) === Number(row.item_id))?.packing_qty) > 1 ? (
                                    <Input type="number" value={row.pcs || ""} onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all" />
                                  ) : (
                                    <div className="h-8 flex items-center justify-center text-[10px] text-zinc-300 font-bold uppercase tracking-tighter">--</div>
                                  )}
                                </div>
                                <div className="col-span-1 border-l border-zinc-100 dark:border-zinc-800">
                                  <Input type="number" value={row.bonus_full || ""} onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all opacity-50 focus:opacity-100" />
                                </div>
                                <div className="col-span-1">
                                  {toNumber(items.find(it => Number(it.id) === Number(row.item_id))?.packing_qty) > 1 ? (
                                    <Input type="number" value={row.bonus_pcs || ""} onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all opacity-50 focus:opacity-100" />
                                  ) : (
                                    <div className="h-8 flex items-center justify-center text-[10px] text-zinc-300 font-bold uppercase tracking-tighter">--</div>
                                  )}
                                </div>
                                <div className="col-span-1">
                                  <Input type="number" value={row.rate || ""} onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-right font-mono text-[10px] border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all" />
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
                    <div className="hidden md:flex bg-zinc-50/80 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 p-3 items-center justify-between">
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!rows.some(r => r.item_id !== null)}
                          onClick={() => {
                            const lastRow = rows[rows.length - 1];
                            setActiveRowId(lastRow?.id || null);
                            setItemDialogOpen(true);
                          }}
                          className={cn(
                            "h-8 px-2 flex items-center gap-2 font-black rounded-md group transition-all",
                            rows.some(r => r.item_id !== null)
                              ? "text-orange-500 border-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 transition-colors group-hover:border-orange-200"
                              : "text-zinc-300 dark:text-zinc-700 border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Plus size={16} className={cn("transition-transform", rows.some(r => r.item_id !== null) && "group-hover:rotate-90")} />
                          <span className="text-[10px] uppercase tracking-widest">Select Product</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Disc Total</span>
                          <span className="text-md font-black text-rose-600"><span className="text-[10px] text-rose-400/70 mr-0.5 font-bold">-</span>{totals.discTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Bottom fields / telemetry */}
                  <div className={cn(
                    "mt-0 flex flex-col transition-all duration-300 relative",
                    showBottomDetails ? "md:mt-1 md:h-[420px]" : "md:h-12 overflow-hidden"
                  )}>
                    {/* Desktop Toggle Button */}
                    <div className="hidden md:flex absolute -top-3 left-1/2 -translate-x-1/2 z-50">
                      <button
                        onClick={() => setShowBottomDetails(!showBottomDetails)}
                        className="w-12 h-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-50 dark:hover:bg-zinc-800 transition-all text-orange-500"
                      >
                        {showBottomDetails ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                    </div>

                    {/* Mobile Toggle Button */}
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

                    <div className={cn(
                      (showInfoPanel || showBottomDetails) ? 'flex' : 'hidden md:hidden',
                      "md:flex flex-col h-full animate-in slide-in-from-bottom-1 duration-300"
                    )}>
                      <Card className={cn("flex-1 p-0 border dark:border-zinc-800 shadow-2xl relative overflow-hidden transition-all duration-300 shadow-zinc-200/40 min-h-[320px]", SOFT_GLASS)}>
                        {selectedItem ? (
                          <div className="flex flex-col h-full">
                            {/* Identity Hub */}
                            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="p-2.5 bg-orange-500 rounded-xl shadow-md ring-2 ring-white dark:ring-zinc-900">
                                    <Box className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border border-white dark:border-zinc-900 rounded-full shadow-sm" />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-none tracking-tight uppercase">
                                      {selectedItem.title}
                                    </h3>
                                    <span className="text-[10px] font-mono font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full tracking-tighter">
                                      {(selectedItem as any).code || 'REG-ID'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2.5 mt-1.5 opacity-80">
                                    <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">{selectedItem.short_name || 'ORIGINAL SPEC'}</span>
                                    <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                    <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">{selectedItem.company || 'DIRECT OEM'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="hidden md:flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Registry ID</span>
                                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">#{(selectedItem.id || 0).toString().padStart(6, '0')}</span>
                                </div>
                                <div className="h-10 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl shadow-md text-[10px] font-bold uppercase tracking-tight transition-transform hover:scale-105">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1.5" />
                                  Live Telemetry
                                </div>
                              </div>
                            </div>

                            {/* Unified Content Grid */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto custom-scrollbar">

                              {/* SECTION A: INVENTORY PULSE */}
                              <div className="md:col-span-3 p-4 border-r border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Inventory Status</span>
                                  </div>

                                  {(() => {
                                    const packing = toNumber(selectedItem.packing_qty) || 1;
                                    const currentTotalStock = toNumber(selectedItem.total_stock_pcs);
                                    const activeRow = rows.find(r => Number(r.item_id) === Number(selectedItem.id));
                                    const enteredQty = activeRow ? (toNumber(activeRow.full) * packing) + toNumber(activeRow.pcs) + (toNumber(activeRow.bonus_full) * packing) + toNumber(activeRow.bonus_pcs) : 0;
                                    const remainingStock = currentTotalStock - enteredQty;
                                    const isNegative = remainingStock < 0;

                                    return (
                                      <div className="space-y-3">
                                        <div className="flex flex-col items-center">
                                          <div className={cn(
                                            "text-3xl font-extrabold tracking-tight transition-colors duration-500",
                                            isNegative ? "text-rose-600" : "text-zinc-900 dark:text-zinc-50"
                                          )}>
                                            {remainingStock.toLocaleString()}
                                          </div>
                                          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">Units Available</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-1">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                              {Math.floor(remainingStock / packing).toLocaleString()}
                                            </span>
                                            <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Full CTN</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                              {(remainingStock % packing).toLocaleString()}
                                            </span>
                                            <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Loose PCS</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="mt-4 relative pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                  <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                                    <span>Total Registry Base</span>
                                    <span>{selectedItem.total_stock_pcs || 0} PCS</span>
                                  </div>
                                </div>
                              </div>

                              {/* SECTION B: PRICING MATRIX */}
                              <div className="md:col-span-6 p-4 border-r border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-900/20 flex flex-col h-full justify-between">
                                <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                                    const tradePrice = toNumber(selectedItem.trade_price);
                                    let percentage = 0;
                                    let calculatedPrice = tradePrice;
                                    let label = "";
                                    let tooltipText = "";

                                    if (num === 1) {
                                      percentage = 0;
                                      calculatedPrice = tradePrice;
                                      label = "Trade Price";
                                      tooltipText = "Base Trade Price";
                                    } else {
                                      const priceKey = `pt${num}` as keyof InventoryItem;
                                      percentage = toNumber(selectedItem[priceKey]);
                                      calculatedPrice = Math.round(tradePrice * (1 + percentage / 100));
                                      label = `Tier ${num}`;
                                      tooltipText = `Trade + ${percentage}%`;
                                    }

                                    const isActive = String(num) === customerCategory;

                                    if (num !== 1 && percentage === 0 && !isActive) return null;

                                    return (
                                      <Tooltip key={num}>
                                        <TooltipTrigger asChild>
                                          <div className={cn(
                                            "flex flex-col p-2.5 rounded border transition-all duration-300 relative overflow-hidden group cursor-pointer",
                                            isActive
                                              ? `${ACCENT_GRADIENT} border-transparent text-white shadow-md ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-zinc-900 scale-[1.02] z-10`
                                              : "bg-white dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60 hover:border-orange-200 dark:hover:border-orange-500/40"
                                          )}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className={cn("text-[8px] font-semibold uppercase tracking-wider", isActive ? "text-orange-100" : "text-zinc-400")}>{label}</span>
                                              <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded", isActive ? "bg-white/20 text-white" : "text-orange-600 bg-orange-500/5")}>
                                                {num === 1 ? "BASE" : `${percentage}%`}
                                              </span>
                                            </div>
                                            <div className={cn("text-md font-bold tracking-tight", isActive ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                                              <span className="text-[10px] opacity-60 mr-0.5 font-bold">Rs</span>
                                              {calculatedPrice.toLocaleString()}
                                            </div>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-zinc-900 text-[9px] font-semibold uppercase tracking-wider px-3 py-1.5">{tooltipText}</TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>

                                {/* Active Market Scheme Alert */}
                                {(selectedItem.scheme || selectedItem.scheme2) && (
                                  <div className="mt-4 flex items-center gap-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 px-4 py-2.5 rounded-xl">
                                    <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center shrink-0 shadow shadow-rose-500/20">
                                      <Info className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                      <span className="text-[9px] font-semibold text-rose-500 uppercase tracking-wider">Active Market Scheme</span>
                                      <span className="text-xs font-bold text-rose-800 dark:text-rose-100 truncate">{selectedItem.scheme || selectedItem.scheme2}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* SECTION C: PRICING INFO */}
                              <div className="md:col-span-3 p-4 flex flex-col justify-between">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-purple-500" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Pricing Info</span>
                                  </div>

                                  <div className="space-y-1.5">
                                    {[
                                      { label: "Trade Price", val: selectedItem.trade_price, color: "text-purple-600 dark:text-purple-400" },
                                      { label: "Retail MSRP", val: selectedItem.retail, color: "text-orange-600 dark:text-orange-400" },
                                      { label: "Avg Cost", val: (toNumber(selectedItem.trade_price) + toNumber(selectedItem.retail)) / 2, color: "text-emerald-600 dark:text-emerald-400" }
                                    ].map((m, i) => (
                                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{m.label}</span>
                                        <span className={cn("text-xs font-mono font-bold", m.color)}>Rs {toNumber(m.val).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-4 space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                  <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Shelf Placement</span>
                                  <div className="flex items-center gap-2.5 bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-xl hover:scale-[1.01] transition-transform">
                                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight truncate">{(selectedItem as any).shelf || 'LEDGER'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Deep Insight Bar */}
                            <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-transparent flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-8">
                                <div className="flex items-center gap-3 group">
                                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/85 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 transition-all">
                                    <CalendarDays className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-semibold text-zinc-400 uppercase tracking-wider leading-none">Last Provider In</span>
                                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 tracking-tight mt-1">{selectedItem.last_purchase_date || 'INITIAL_STOCK'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 group">
                                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/85 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 transition-all">
                                    <PackageSearch className="w-4 h-4 text-zinc-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-semibold text-zinc-400 uppercase tracking-wider leading-none">Batch Snapshot</span>
                                    <div className="flex items-center gap-1.5 mt-1 font-bold text-[11px] tracking-tight">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedItem.last_purchase_full || 0}F</span>
                                      <span className="text-zinc-300">/</span>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedItem.last_purchase_pcs || 0}P</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex items-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 h-8 px-4 rounded-lg shadow-sm">
                                  <span className="text-[9px] font-bold uppercase tracking-wider mr-2.5 opacity-60">Supplier:</span>
                                  <span className="text-[10px] font-bold uppercase truncate max-w-[140px]">{selectedItem.last_supplier || 'MARKET_DIRECT'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                  <Banknote size={14} />
                                  <span className="text-[11px] font-bold font-mono tracking-tight">Rs {toNumber(selectedItem.last_purchase_rate).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-center p-12 relative z-10 w-full animate-in fade-in duration-700">
                            <div className="relative">
                              <Box className="text-zinc-100 dark:text-zinc-800/40 w-24 h-24 mb-6 animate-bounce duration-[2000ms]" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Search className="text-zinc-300 dark:text-zinc-700 w-8 h-8 opacity-50" />
                              </div>
                            </div>
                            <div className="text-zinc-400 dark:text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Registry SKU Telemetry Required</div>
                            <div className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-widest">Select a product to initialize the diagnostic grid</div>
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Floating sidebar toggle */}
                {!showRightSidebar && (
                  <div className="hidden lg:flex fixed top-1/2 right-0 -translate-y-1/2 z-50">
                    <button
                      onClick={() => setShowRightSidebar(true)}
                      className="w-8 h-12 bg-orange-500 rounded-l-xl flex items-center justify-center shadow-2xl hover:w-10 transition-all text-white border-y border-l border-orange-400/30"
                    >
                      <ChevronLeft size={20} className="drop-shadow-sm" />
                    </button>
                  </div>
                )}

                {/* Right Sidebar: Quick Summary & Financials */}
                <div className={cn(
                  "transition-all duration-500 ease-in-out relative flex flex-col",
                  showRightSidebar ? "w-full lg:w-80 opacity-100" : "w-0 lg:w-0 opacity-0 pointer-events-none"
                )}>
                  {/* Toggle Sidebar tab */}
                  <div className="hidden lg:flex absolute top-1/2 -left-4 -translate-y-1/2 z-50 group">
                    <button
                      onClick={() => setShowRightSidebar(!showRightSidebar)}
                      className="w-8 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center shadow-lg group-hover:bg-orange-50 dark:group-hover:bg-zinc-800 transition-all text-orange-500"
                    >
                      {showRightSidebar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                  </div>

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

                        {previousBalance < 0 ? (
                          <div className="space-y-3 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest flex items-center gap-2">
                                <TrendingDown size={12} /> Available Advance
                              </span>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                Rs {Math.abs(previousBalance).toLocaleString()}
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
                              <span className="text-xs font-black text-emerald-600 font-mono">
                                -Rs {totals.appliedAdvance.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-sm border border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Previous Balance</span>
                            <span className={`text-lg font-black ${previousBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {previousBalance.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <TechLabel label={previousBalance < 0 && useAdvance ? "NET SETTLEMENT" : "TOTAL RECEIVABLE"}>
                            <div className="text-2xl font-black text-zinc-500 dark:text-zinc-400 tracking-tight italic line-through opacity-50">
                              {totals.receivable.toLocaleString()}
                            </div>
                          </TechLabel>
                        </div>

                        <div className="pt-2">
                          <TechLabel label="EXTRA DISCOUNT" className="space-y-1">
                            <Input
                              type="number"
                              value={extraDiscount || ""}
                              onChange={(e) => setExtraDiscount(toNumber(e.target.value))}
                              className="h-9 font-black text-rose-600 bg-rose-50/30 border-rose-100 focus:border-rose-300 focus:ring-rose-300 dark:bg-rose-950/10 dark:border-rose-900/30"
                              placeholder="0.00"
                            />
                          </TechLabel>
                        </div>

                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          <TechLabel label="FINAL NET PAYABLE">
                            <div className="text-3xl font-black text-orange-600 dark:text-orange-500 tracking-tight italic">
                              {totals.finalAmount.toLocaleString()}
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
                            if (next) {
                              setCheckoutDialogOpen(true);
                              setCashReceived(Math.round(totals.finalAmount));
                            }
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

                    {/* Final Actions - Hidden on mobile */}
                    <div className="hidden md:flex flex-col gap-2 px-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-card shrink-0">
                      <Button
                        onClick={handleSave}
                        disabled={processing}
                        className={`h-14 w-full ${ACCENT_GRADIENT} text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all`}
                      >
                        {processing ? "Syncing..." : "Finalize Invoice"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-12 border-2 border-zinc-200 dark:border-zinc-800 font-black uppercase tracking-widest text-[10px] rounded-2xl"
                        onClick={() => router.get('/sales')}
                      >
                        ABORT EDITS
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

                <div className="grid grid-cols-3 gap-0 pt-4 border-t border-zinc-800/50">
                  <div className="flex flex-col items-center border-l border-zinc-800">
                    <span className="text-[8px] uppercase text-zinc-500 font-black tracking-widest mb-0.5">Disc</span>
                    <span className="text-xs font-bold text-zinc-400 font-mono tracking-tighter">{totals.discTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Shared Modular Item Registry Dialog */}
            <ItemRegistryDialog
              open={itemDialogOpen}
              onOpenChange={setItemDialogOpen}
              items={items}
              customerCategory={customerCategory}
              currentRows={rows}
              onAddUpdate={(item, data) => {
                const existingRow = rows.find(r => Number(r.item_id) === Number(item.id));
                if (existingRow) {
                  updateRow(existingRow.id, data);
                } else {
                  const newRowId = Date.now() + Math.random();
                  setRows((prev) => {
                    const newItem = {
                      id: newRowId,
                      item_id: item.id,
                      ...data,
                      taxPercent: toNumber(item.gst_percent),
                      discPercent: toNumber(item.discount),
                      trade_price: toNumber(item.trade_price),
                      amount: 0,
                    };
                    if (prev.length === 1 && prev[0].item_id === null) return [newItem];
                    return [...prev, newItem];
                  });
                }
              }}
            />

            <StockWarningDialog
              open={showStockWarning}
              onOpenChange={setShowStockWarning}
              onConfirm={() => saveInvoice(true)}
            />

            <CheckoutDialog
              open={checkoutDialogOpen}
              onOpenChange={setCheckoutDialogOpen}
              totals={totals}
              splits={splits}
              paymentAccounts={paymentAccounts}
              addSplitRow={addSplitRow}
              removeSplitRow={removeSplitRow}
              updateSplitRow={updateSplitRow}
              onCommit={() => {
                setCheckoutDialogOpen(false);
                saveInvoice();
              }}
              invoiceNo={invoiceNo}
              previousBalance={previousBalance}
              extraDiscount={extraDiscount}
            />

            <SuccessDialog
              open={showSuccessDialog}
              onOpenChange={setShowSuccessDialog}
              invoiceNo={invoiceNo}
              saleId={sale.id}
              customerName={successData?.customerName}
              totalAmount={successData?.totalAmount}
              countItems={successData?.itemCount}
              countFull={successData?.totalFull}
              countPcs={successData?.totalPcs}
              totalDiscount={successData?.totalDiscount}
              onReturn={() => router.get('/sales')}
              type="edit"
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
