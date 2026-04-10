import React, { useState, useMemo, useEffect } from "react";
import ReactSelect from "react-select";
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
import { Trash2, Plus, CalendarIcon, ListRestart, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Save, Wallet, Search, CheckCircle2, Info, Calculator, BadgePercent, ArrowDownToLine, Package, Hash, AlertTriangle, Banknote, Box, PackageSearch, CreditCard, Truck, ArrowRightLeft } from "lucide-react";
import { useAppearance } from '@/hooks/use-appearance';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ItemRegistryDialog } from "./components/ItemRegistryDialog";
import { CheckoutDialog } from "./components/CheckoutDialog";
import { SuccessDialog } from "./components/SuccessDialog";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MODERN SALES EDIT PAGE - 1:1 UI PARITY WITH CREATE PAGE (REFINED)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Sales", href: "/sales" },
  { title: "Edit Invoice", href: "" },
];

const PREMIUM_ROUNDING_XS = "rounded-md";
const PREMIUM_ROUNDING_SM = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-2xl";
const PREMIUM_ROUNDING_LG = "rounded-[2rem]";
const PREMIUM_ROUNDING_XL = "rounded-[3rem]";

const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600";
const EMERALD_GRADIENT = "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600";
const CARD_BASE = "bg-white dark:bg-card border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300";
const SOFT_GLASS = "bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border border-white/20 dark:border-zinc-800/50 shadow-xl shadow-zinc-200/40";

// ───────────────────────────────────────────
// Types & Components
// ───────────────────────────────────────────
interface Item {
  id: number;
  title: string;
  short_name?: string;
  company?: string;
  category?: string;
  trade_price?: number;
  retail?: number;
  retail_tp_diff?: number;
  packing_qty?: number;
  packing_full?: number;
  gst_percent?: number;
  discount?: number;
  stock_1?: number;
  stock_2?: number;
  pt2?: number; pt3?: number; pt4?: number; pt5?: number; pt6?: number; pt7?: number;
  scheme?: string;
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
  full: number;
  pcs: number;
  bonus_full: number;
  bonus_pcs: number;
  rate: number;
  taxPercent: number;
  discPercent: number;
  trade_price: number;
  amount: number;
}

interface Account {
  id: number;
  title: string;
  code?: string;
  aging_days?: number;
  credit_limit?: number | string;
  item_category?: string | null;
  account_type?: { name: string };
}

interface Sale {
  id: number;
  date: string;
  invoice: string;
  code?: string;
  customer_id?: number;
  salesman_id?: number;
  firm_id?: number;
  message_line_id?: number;
  courier_charges?: number;
  net_total?: number;
  extra_discount?: number;
  paid_amount?: number;
  print_format?: string;
  customer?: Account;
  items?: any[];
  splits?: any[];
}

interface Saleman {
  id: number;
  name: string;
}

interface MessageLine {
  id: number;
  messageline: string;
}

interface Firm {
  id: number;
  name: string;
  defult: boolean;
}

interface Option { value: number; label: string; }

const toNumber = (v: any) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

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

const TechLabel = ({ children, icon: Icon, label, className = "space-y-1.5 flex-1 min-w-0" }: { children: React.ReactNode, icon?: any, label: string, className?: string }) => (
  <div className={cn("flex flex-col", className)}>
    <div className="flex items-center gap-2 px-1 mb-1">
      {Icon && <Icon size={12} className="text-orange-500 shrink-0 opacity-70" />}
      <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-[0.2em] truncate">{label}</span>
    </div>
    {children}
  </div>
);

const FieldWrapper = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">{label}</Label>
    {children}
  </div>
);

// ───────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────
export default function SalesEditPage({ sale, items, accounts, salemans, paymentAccounts = [], firms = [], messageLines = [] }: { sale: Sale; items: Item[]; accounts: Account[]; salemans: Saleman[]; paymentAccounts: Account[]; firms: Firm[]; messageLines: MessageLine[] }) {
  const { appearance } = useAppearance();

  // ───────────────────────────────────────────
  // Primary States
  // ───────────────────────────────────────────
  const [date, setDate] = useState<Date | undefined>(sale.date ? new Date(sale.date) : new Date());
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [isTimeLive, setIsTimeLive] = useState(true);

  useEffect(() => {
    if (!isTimeLive) return;
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimeLive]);

  const [invoiceNo, setInvoiceNo] = useState<string>(sale.invoice);
  const [code, setCode] = useState<string>(sale.code || "");
  const [salesman, setSalesman] = useState<number | null>(sale.salesman_id || null);
  const [accountType, setAccountType] = useState<Option | null>(sale.customer ? { value: sale.customer.id, label: sale.customer.title } : null);
  const [customerCategory, setCustomerCategory] = useState<string | null>(sale.customer?.item_category ? String(sale.customer.item_category) : null);
  const [courier, setCourier] = useState<number>(toNumber(sale.courier_charges));
  const [extraDiscount, setExtraDiscount] = useState<number>(toNumber(sale.extra_discount));
  const [printOption, setPrintOption] = useState<"big" | "small">(sale.print_format === "small" ? "small" : "big");
  const [selectedFirmId, setSelectedFirmId] = useState<string>(sale.firm_id?.toString() || "0");
  const [selectedMessageId, setSelectedMessageId] = useState<string>(sale.message_line_id?.toString() || "0");
  const [previousBalance, setPreviousBalance] = useState<number>(0);

  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState<boolean>(false);
  const [itemDialogOpen, setItemDialogOpen] = useState<boolean>(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [itemSearch, setItemSearch] = useState<string>("");
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
  const [selectedItemForQty, setSelectedItemForQty] = useState<Item | null>(null);

  const [dialogBonusPcs, setDialogBonusPcs] = useState<number>(0);
  const [dialogRate, setDialogRate] = useState<number>(0);

  // UI States
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showBottomDetails, setShowBottomDetails] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activeRowId, setActiveRowId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [cashCredit, setCashCredit] = useState<string>("CREDIT");
  const [isPayNow, setIsPayNow] = useState(false);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [creditDays, setCreditDays] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number | string>("");

  const selectedItem = useMemo(() => items.find(it => it.id === selectedItemId), [items, selectedItemId]);

  // Rows & Splits
  const [rows, setRows] = useState<RowData[]>(() => {
    if (!sale.items?.length) return [{ id: Date.now(), item_id: null, full: 0, pcs: 0, bonus_full: 0, bonus_pcs: 0, rate: 0, taxPercent: 0, discPercent: 0, trade_price: 0, amount: 0 }];
    return sale.items.map(si => {
      const subtotal = toNumber(si.subtotal);
      const disc = toNumber(si.discount);
      return {
        id: si.id,
        item_id: si.item_id,
        full: toNumber(si.qty_carton),
        pcs: toNumber(si.qty_pcs),
        bonus_full: toNumber(si.bonus_qty_carton),
        bonus_pcs: toNumber(si.bonus_qty_pcs),
        rate: toNumber(si.trade_price),
        taxPercent: 0,
        discPercent: subtotal > 0 ? (disc / subtotal) * 100 : 0,
        trade_price: toNumber(si.retail_price),
        amount: subtotal
      }
    });
  });

  const [splits, setSplits] = useState<any[]>(() => {
    if (!sale.splits?.length) return [{ id: Date.now(), payment_account_id: "", amount: 0, payment_method: "Cash", cheque_no: "", cheque_date: "" }];
    return sale.splits.map(s => ({ ...s, id: s.id || Date.now() + Math.random() }));
  });

  // Helpers
  const addSplitRow = () => setSplits(prev => [...prev, { id: Date.now() + Math.random(), payment_account_id: "", amount: 0, payment_method: "Cash", cheque_no: "", cheque_date: "" }]);
  const removeSplitRow = (id: number | string) => setSplits(prev => prev.filter(s => s.id !== id));
  const updateSplitRow = (id: number | string, field: string, val: any) => {
    setSplits(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: val };
        if (field === 'payment_account_id') {
          const acc = paymentAccounts.find(a => a.id.toString() === val);
          const typeName = acc?.account_type?.name;
          if (typeName === 'Bank') updated.payment_method = 'Online';
          else if (typeName === 'Cheque in hand') updated.payment_method = 'Cheque';
          else updated.payment_method = 'Cash';
        }
        return updated;
      }
      return s;
    }));
  };

  // ───────────────────────────────────────────
  // Memoized Logic
  // ───────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    return items.filter(it =>
      it.title.toLowerCase().includes(q) ||
      it.short_name?.toLowerCase().includes(q) ||
      it.category?.toLowerCase().includes(q) ||
      String(it.id).includes(q)
    ).sort((a, b) => a.title.localeCompare(b.title));
  }, [items, itemSearch]);

  const rowsWithComputed = useMemo(() => {
    return rows.map(r => {
      const item = items.find(it => it.id === r.item_id);
      const packing = Math.max(1, toNumber(item?.packing_qty ?? 1));
      const amount = Math.round((toNumber(r.full) * toNumber(r.rate)) + (toNumber(r.pcs) * (toNumber(r.rate) / packing)));

      const currentTotalStock = toNumber(item?.total_stock_pcs);
      const enteredQty = (toNumber(r.full) * packing) + toNumber(r.pcs) + (toNumber(r.bonus_full) * packing) + toNumber(r.bonus_pcs);
      const stockExceeded = item ? enteredQty > currentTotalStock : false;

      let isLoss = false;
      if (item) {
        const validRates = [item.retail, item.pt2, item.pt3, item.pt4, item.pt5, item.pt6, item.pt7].map(pr => toNumber(pr)).filter(pr => pr > 0);
        if (validRates.length > 0) {
          const minPrice = Math.min(...validRates);
          if (toNumber(r.rate) < minPrice) isLoss = true;
        }
      }

      return { ...r, amount, isLoss, stockExceeded };
    });
  }, [rows, items, customerCategory]);

  const totals = useMemo(() => {
    let gross = 0;
    let discTotal = 0;
    rowsWithComputed.forEach(r => {
      gross += r.amount;
      discTotal += (toNumber(r.discPercent || 0) / 100) * r.amount;
    });
    const net = Math.round(gross - discTotal + courier);
    const receivable = Math.round(net + previousBalance);
    const finalAmount = Math.round(receivable - extraDiscount);
    const totalPaid = splits.reduce((acc, s) => acc + toNumber(s.amount), 0);
    const remaining = Math.max(0, finalAmount - totalPaid);

    return { gross, discTotal, net, receivable, finalAmount, totalPaid, remaining };
  }, [rowsWithComputed, courier, extraDiscount, previousBalance, splits]);

  const isOverLimit = useMemo(() => {
    if (cashCredit === "CASH") return false;
    const limit = typeof creditLimit === "number" ? creditLimit : (creditLimit === "" ? 0 : Number(creditLimit));
    if (limit === 0) return false;
    return totals.finalAmount > limit;
  }, [cashCredit, creditLimit, totals.finalAmount]);

  // ───────────────────────────────────────────
  // Row Operations
  // ───────────────────────────────────────────
  const updateRow = (id: number, patch: Partial<RowData>) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));
  const addRow = () => setRows(prev => [{ id: Date.now() + Math.random(), item_id: null, full: 0, pcs: 0, bonus_full: 0, bonus_pcs: 0, rate: 0, taxPercent: 0, discPercent: 0, trade_price: 0, amount: 0 }, ...prev]);

  const handleSave = () => {
    // Audit: Only send NEW split payments to the backend to prevent duplicate Payment records
    const newSplits = splits.filter(s => !s.voucher_no && toNumber(s.amount) > 0);

    const payload = {
      date: date?.toISOString().split('T')[0],
      invoice: invoiceNo,
      code,
      customer_id: accountType?.value,
      salesman_id: salesman,
      firm_id: selectedFirmId !== "0" ? Number(selectedFirmId) : null,
      message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,
      no_of_items: rowsWithComputed.length,

      gross_total: totals.gross,
      discount_total: totals.discTotal,
      tax_total: 0,
      courier_charges: courier,
      extra_discount: extraDiscount,
      net_total: totals.net,
      total_receivable: totals.receivable,
      paid_amount: newSplits.reduce((acc, s) => acc + toNumber(s.amount), 0),
      remaining_amount: totals.remaining,

      is_pay_now: Boolean(newSplits.length > 0),
      is_multi: Boolean(newSplits.length > 0),
      splits: newSplits,

      items: rowsWithComputed.filter(r => r.item_id !== null).map(r => {
        const item = items.find(it => it.id === r.item_id);
        const packing = Math.max(1, toNumber(item?.packing_qty ?? 1));
        return {
          item_id: r.item_id,
          qty_carton: toNumber(r.full),
          qty_pcs: toNumber(r.pcs),
          bonus_qty_carton: toNumber(r.bonus_full),
          bonus_qty_pcs: toNumber(r.bonus_pcs),
          total_pcs: ((toNumber(r.full) + toNumber(r.bonus_full || 0)) * packing) + toNumber(r.pcs) + toNumber(r.bonus_pcs || 0),
          trade_price: r.rate,
          retail_price: r.trade_price,
          discount: (toNumber(r.discPercent || 0) / 100) * r.amount,
          gst_amount: 0,
          subtotal: r.amount
        };
      })
    };

    router.put(`/sales/${sale.id}`, payload, {
      onSuccess: () => {
        setSuccessData({
          customerName: accountType?.label || "Unknown Customer",
          totalAmount: totals.finalAmount,
          countItems: rowsWithComputed.length,
          countFull: rowsWithComputed.reduce((acc, r) => acc + toNumber(r.full), 0),
          countPcs: rowsWithComputed.reduce((acc, r) => acc + toNumber(r.pcs), 0),
          totalDiscount: totals.discTotal + extraDiscount
        });
        setShowSuccessDialog(true);
      }
    });
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-zinc-50 dark:bg-[#050505] flex flex-col h-screen overflow-hidden">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden relative">

            {/* Refined Desktop Control Deck - Inline Layout */}
            <div className="hidden md:block">
              <Card className={`px-4 py-3 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} flex flex-row flex-nowrap items-end justify-between gap-4 relative overflow-hidden overflow-x-auto custom-scrollbar`}>
                <div className={`absolute top-0 left-0 w-full h-0.5 ${ACCENT_GRADIENT}`} />

                <TechLabel label="Invoice Date" icon={CalendarIcon} className="space-y-1.5 shrink-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
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
                    readOnly={isTimeLive}
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
                      const acc = accounts.find((a) => a.id === id);
                      if (acc) {
                        setAccountType({ value: acc.id, label: acc.title });
                        setCreditDays(acc.aging_days ?? 0);
                        setCreditLimit(typeof acc.credit_limit === "number" ? acc.credit_limit : (acc.credit_limit ? Number(acc.credit_limit) : ""));
                        setSalesman(toNumber(sale.salesman_id) || null);
                        setCode(acc.code ?? "");
                        setCustomerCategory(acc.item_category ? String(acc.item_category) : null);
                        axios.get(`/account/${id}/balance`).then(res => setPreviousBalance(res.data.balance)).catch(() => setPreviousBalance(0));
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full h-9 text-xs font-bold uppercase tracking-tighter border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 ${PREMIUM_ROUNDING_MD}`}>
                      <SelectValue placeholder="Identify Customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()} className="text-[10px] font-bold uppercase tracking-widest">
                          {a.title}
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
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Edit Mode</span>
                  </div>
                </TechLabel>
              </Card>
            </div>

            {/* Main Items Workspace & Sidebar */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 mb-0">

              {/* Left Area: Items Registry */}
              <div className="flex-1 flex flex-col">
                <Card className="p-0 overflow-hidden gap-0 border-0 md:border shadow-none md:shadow-sm bg-transparent md:bg-card">
                  <div className="overflow-visible md:overflow-x-auto">
                    <div className="w-full md:min-w-[1200px]">
                      <div className="hidden md:grid grid-cols-12 bg-zinc-50 dark:bg-zinc-900/80 p-3 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-20">
                        <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Item Identification</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Full</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Pcs</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">B.Full</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">B.Pcs</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Rate</div>
                        <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Disc %</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">After</div>
                        <div className="col-span-1 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Subtotal</div>
                      </div>

                      <div className="h-auto md:h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar space-y-3 md:space-y-0 text-sm">
                        {rowsWithComputed.map((row) => (
                          <div key={row.id} className={cn(
                            "hidden md:grid grid-cols-12 gap-2 p-2.5 border-b items-center group transition-colors last:border-0",
                            row.stockExceeded
                              ? "bg-rose-200 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 shadow-[inset_4px_0_0_0_#f43f5e]"
                              : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                          )}>
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
                              {toNumber(items.find(it => it.id === row.item_id)?.packing_qty) > 1 ? (
                                <Input type="number" value={row.pcs || ""} onChange={(e) => updateRow(row.id, { pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all" />
                              ) : (
                                <div className="h-8 flex items-center justify-center text-[10px] text-zinc-300 font-bold uppercase tracking-tighter">--</div>
                              )}
                            </div>
                            <div className="col-span-1 border-l border-zinc-100 dark:border-zinc-800">
                              <Input type="number" value={row.bonus_full || ""} onChange={(e) => updateRow(row.id, { bonus_full: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all opacity-50 focus:opacity-100" />
                            </div>
                            <div className="col-span-1">
                              {toNumber(items.find(it => it.id === row.item_id)?.packing_qty) > 1 ? (
                                <Input type="number" value={row.bonus_pcs || ""} onChange={(e) => updateRow(row.id, { bonus_pcs: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-center font-mono text-[10px] font-black border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all opacity-50 focus:opacity-100" />
                              ) : (
                                <div className="h-8 flex items-center justify-center text-[10px] text-zinc-300 font-bold uppercase tracking-tighter">--</div>
                              )}
                            </div>
                            <div className="col-span-1">
                              <Input type="number" value={row.rate || ""} onChange={(e) => updateRow(row.id, { rate: toNumber(e.target.value) })} onClick={() => row.item_id && setSelectedItemId(row.item_id)} className="h-8 text-right font-mono text-[10px] border-zinc-200 dark:border-zinc-700 focus:border-orange-500 transition-all" />
                            </div>
                            <div className="col-span-2 bg-rose-50/10 dark:bg-rose-900/5 rounded px-1">
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
                        onClick={addRow}
                        className="h-8 px-2 flex items-center gap-2 font-black text-orange-500 border-orange-500 hover:text-orange-600 hover:bg-orange-50"
                      >
                        <Plus size={16} />
                        <span className="text-[10px] uppercase tracking-widest">Add New Row</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Disc Total</span>
                        <span className="text-md font-black text-rose-600"><span className="text-[10px] text-rose-400/70 mr-0.5 font-bold">-</span>{totals.discTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Item Telemetry */}
                  <div className={cn(
                    "mt-0 flex flex-col transition-all duration-300 relative",
                    showBottomDetails ? "md:mt-1 md:h-[320px]" : "md:h-12 overflow-hidden"
                  )}>
                    <div className="hidden md:flex absolute -top-3 left-1/2 -translate-x-1/2 z-50">
                      <button
                        onClick={() => setShowBottomDetails(!showBottomDetails)}
                        className="w-12 h-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-50 transition-all text-orange-500"
                      >
                        {showBottomDetails ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                    </div>

                    <div className="md:flex flex-col h-full animate-in slide-in-from-bottom-1">
                      <Card className={cn("flex-1 p-4 border dark:border-zinc-800 shadow-sm relative overflow-hidden", SOFT_GLASS)}>
                        {selectedItem ? (
                          <div className="flex flex-col h-full">
                            <div className="pb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80">
                              <h3 className="text-xl font-black dark:text-zinc-100 uppercase italic flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                                {selectedItem.title}
                              </h3>
                              <div className="flex gap-2">
                                <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 px-3 py-1 rounded-lg text-[10px] font-black text-zinc-500">ID: {selectedItem.id}</div>
                                <div className={`${ACCENT_GRADIENT} px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest`}>ITEM TELEMETRY ON</div>
                              </div>
                            </div>

                            <div className="flex-1 flex mt-4 gap-4">
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div className="flex flex-col items-center justify-center border rounded-xl bg-white dark:bg-zinc-900/40 p-4">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase mb-2">Packing</span>
                                  <span className="text-3xl font-black">{selectedItem.packing_full || selectedItem.packing_qty}<span className="text-xs ml-1 opacity-50">PCS</span></span>
                                </div>
                                <div className="flex flex-col items-center justify-center border rounded-xl bg-white dark:bg-zinc-900/40 p-4">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase mb-2">Stock Full</span>
                                  <span className="text-3xl font-black text-emerald-600">{Math.floor(toNumber(selectedItem.total_stock_pcs) / (toNumber(selectedItem.packing_qty) || 1))}<span className="text-xs ml-1 opacity-50">F</span></span>
                                </div>
                                <div className="flex flex-col items-center justify-center border rounded-xl bg-white dark:bg-zinc-900/40 p-4">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase mb-2">Pcs</span>
                                  <span className="text-3xl font-black text-emerald-600">{toNumber(selectedItem.total_stock_pcs) % (toNumber(selectedItem.packing_qty) || 1)}<span className="text-xs ml-1 opacity-50">P</span></span>
                                </div>
                                <div className="flex flex-col items-center justify-center border rounded-xl bg-white dark:bg-zinc-900/40 p-4 border-orange-500/30 bg-orange-50/20">
                                  <span className="text-[10px] font-black text-orange-500 uppercase mb-2 animate-pulse">Total SKU Stock</span>
                                  <span className="text-3xl font-black text-orange-600">{selectedItem.total_stock_pcs}<span className="text-xs ml-1 opacity-50">PCS</span></span>
                                </div>
                              </div>

                              <div className="w-72 flex flex-col justify-center gap-2 border-l pl-8">
                                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-400 uppercase">Trade Price</span><span className="text-xl font-black text-purple-600">Rs.{toNumber(selectedItem.trade_price).toLocaleString()}</span></div>
                                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-zinc-400 uppercase">Retail Price</span><span className="text-xl font-black text-orange-600">Rs.{toNumber(selectedItem.retail).toLocaleString()}</span></div>
                                <div className="flex justify-between items-center pt-2 border-t border-dashed"><span className="text-[10px] font-black text-zinc-400 uppercase">Profit Margin</span><span className="text-xl font-black text-emerald-600">{(((toNumber(selectedItem.retail) - toNumber(selectedItem.trade_price)) / (toNumber(selectedItem.trade_price) || 1)) * 100).toFixed(1)}%</span></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-300 font-black uppercase tracking-[0.3em] italic">Item Telemetry Off</div>
                        )}
                      </Card>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Sidebar: Quick Summary & Financials */}
              <div className={cn(
                "transition-all duration-500 ease-in-out relative flex flex-col",
                showRightSidebar ? "w-full lg:w-80 opacity-100" : "w-0 lg:w-0 opacity-0 pointer-events-none"
              )}>
                {/* Sidebar toggle tab */}
                <div className="hidden lg:flex absolute top-1/2 -left-4 -translate-y-1/2 z-50">
                  <button
                    onClick={() => setShowRightSidebar(!showRightSidebar)}
                    className="w-8 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center shadow-lg text-orange-500"
                  >
                    {showRightSidebar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  </button>
                </div>

                <Card className={`${CARD_BASE} flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-xl max-h-full min-h-0 overflow-hidden`}>
                  <div className="overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1 pb-2 border-b">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Net Payable</span>
                        <SignalBadge type="green" text="READY" />
                      </div>
                      <div className="text-2xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100 italic">Rs.{totals.net.toLocaleString()}</div>
                    </div>

                    {isOverLimit && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 animate-bounce">
                        <AlertTriangle className="text-rose-600" size={18} />
                        <div className="text-[10px] font-black uppercase text-rose-700">Credit Limit Exceeded!</div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 mt-2">
                      <TechLabel label="Courier Service"><Input placeholder="0.00" value={courier || ""} onChange={e => setCourier(toNumber(e.target.value))} className="h-10 text-lg font-black bg-zinc-50 border-zinc-200 font-mono" /></TechLabel>

                      <div className="flex justify-between items-center bg-zinc-50 p-2 rounded-sm border">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Previous Balance</span>
                        <span className={`text-lg font-black ${previousBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{previousBalance.toLocaleString()}</span>
                      </div>

                      <div className="pt-2 border-t">
                        <TechLabel label="TOTAL RECEIVABLE"><div className="text-2xl font-black text-zinc-400 italic line-through opacity-50">{totals.receivable.toLocaleString()}</div></TechLabel>
                      </div>

                      <div className="pt-2">
                        <TechLabel label="EXTRA DISCOUNT"><Input type="number" value={extraDiscount || ""} onChange={e => setExtraDiscount(toNumber(e.target.value))} className="h-9 font-black text-rose-600 bg-rose-50 border-rose-100" placeholder="0.00" /></TechLabel>
                      </div>

                      <div className="pt-2 border-t border-zinc-300">
                        <TechLabel label="FINAL NET PAYABLE"><div className="text-4xl font-black text-orange-600 tracking-tighter italic">Rs.{totals.finalAmount.toLocaleString()}</div></TechLabel>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4 border-t">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border group cursor-pointer" onClick={() => {
                          const next = !isPayNow;
                          setIsPayNow(next);
                          if (next) { setCheckoutDialogOpen(true); setCashReceived(Math.round(totals.finalAmount)); }
                        }}>
                          <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isPayNow ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-300'}`}>{isPayNow && <div className="h-1.5 w-1.5 rounded-full bg-white" />}</div>
                            <span className="text-[11px] font-black uppercase text-zinc-600">Instant Checkout</span>
                          </div>
                          <Banknote className={`w-4 h-4 ${isPayNow ? 'text-orange-500' : 'text-zinc-300'}`} />
                        </div>
                      </div>

                      <Select value={printOption} onValueChange={(v) => setPrintOption(v as "big" | "small")}><SelectTrigger className="h-9 w-full bg-zinc-50/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="big">Big Print (A4)</SelectItem><SelectItem value="small">Small Print (Thermal)</SelectItem></SelectContent></Select>
                      <Select value={selectedFirmId} onValueChange={setSelectedFirmId}><SelectTrigger className="h-9 w-full bg-zinc-50/50"><SelectValue placeholder="Firm branding" /></SelectTrigger><SelectContent>{firms.map(f => (<SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>))}</SelectContent></Select>
                      <Select value={selectedMessageId} onValueChange={setSelectedMessageId}><SelectTrigger className="h-9 w-full bg-zinc-50/50"><SelectValue placeholder="Message line" /></SelectTrigger><SelectContent>{messageLines.map(m => (<SelectItem key={m.id} value={m.id.toString()}>{m.messageline}</SelectItem>))}</SelectContent></Select>

                      <Button onClick={() => setCheckoutDialogOpen(true)} className={`w-full h-16 ${ACCENT_GRADIENT} text-white font-black uppercase tracking-[0.2em] shadow-xl text-lg italic rounded-2xl active:scale-95 shadow-orange-500/20`}><Save className="mr-3" /> FINALIZE INVOICE</Button>
                      <Button variant="outline" className="w-full h-12 border-2 border-zinc-200 font-black uppercase tracking-widest text-[10px] rounded-2xl" onClick={() => router.get('/sales')}>ABORT EDITS</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {!showRightSidebar && (
              <div className="hidden lg:flex fixed top-1/2 right-0 -translate-y-1/2 z-50">
                <button onClick={() => setShowRightSidebar(true)} className="w-8 h-12 bg-orange-500 rounded-l-xl flex items-center justify-center text-white"><ChevronLeft size={20} /></button>
              </div>
            )}

            {/* Shared Modular Dialogs */}
            <ItemRegistryDialog
              open={itemDialogOpen}
              onOpenChange={setItemDialogOpen}
              items={items}
              customerCategory={customerCategory}
              currentRows={rows}
              onAddUpdate={(item, data) => {
                const existingRow = rows.find(r => r.item_id === item.id);
                if (existingRow) {
                  updateRow(existingRow.id, data);
                } else {
                  const targetId = activeRowId;
                  if (targetId) {
                    updateRow(targetId, {
                      item_id: item.id,
                      ...data,
                      taxPercent: 0,
                      discPercent: toNumber(item.discount),
                      trade_price: toNumber(item.retail || item.trade_price),
                    });
                  }
                }
                setSelectedItemId(item.id);
              }}
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
                handleSave();
              }}
              invoiceNo={invoiceNo}
              previousBalance={previousBalance}
            />

            <SuccessDialog
              open={showSuccessDialog}
              onOpenChange={setShowSuccessDialog}
              invoiceNo={invoiceNo}
              saleId={sale.id}
              onReturn={() => router.get('/sales')}
              type="edit"
            />

          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
