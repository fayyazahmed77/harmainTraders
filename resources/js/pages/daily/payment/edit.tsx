import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePage, router, Head } from "@inertiajs/react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Plus, CalendarIcon, RotateCcw, FileText,
  Search, ChevronRight, Hash, User as UserIcon,
  ArrowRightLeft, BadgePercent, Calculator, Package, Info, CheckCircle2,
  Navigation, Clock, Terminal, Scale, Hash as HashIcon, ArrowUpRight, ArrowDownLeft,
  CreditCard, ClipboardList, Printer, Receipt, Layout, ArrowLeft
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// ───────────────────────────────────────────
// Style Constants (Perfect UI Aesthetic)
// ───────────────────────────────────────────
const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const MONO_FONT = "font-mono tracking-tighter";

const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";
const PREMIUM_TRANSITION = "transition-all duration-300 ease-in-out";

// ───────────────────────────────────────────
// Shared Components
// ───────────────────────────────────────────

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5">
      {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
      {label}
    </div>
    {children}
  </div>
);

const SignalBadge = ({ text, type = 'blue' }: { text: string, type?: 'green' | 'red' | 'orange' | 'blue' }) => {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    red: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  };
  return (
    <span className={`px-2 py-0.5 ${PREMIUM_ROUNDING_MD} text-[10px] font-black uppercase tracking-tighter border ${colors[type]}`}>
      {text}
    </span>
  );
};

interface Account {
  id: number;
  title: string;
  type: string;
  account_type?: {
    name: string;
  };
}
interface PaymentAccount {
  id: number;
  title: string;
  type: string;
  account_type?: {
    name: string;
  };
}

interface Bill {
  id: number;
  type: string; // Model class name
  invoice_no: string;
  date: string;
  net_total: number;
  discount_total?: number;
  return_amount?: number;
  remaining_amount: number;
  bill_type_label: string;
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

interface PaymentAllocation {
  id: number;
  payment_id: number;
  bill_id: number;
  bill_type: string;
  amount: number;
}

interface PaymentProps {
  payment: {
    id: number;
    date: string;
    voucher_no: string;
    account_id: number;
    payment_account_id: number | null;
    amount: number;
    discount: number;
    net_amount: number;
    type: "RECEIPT" | "PAYMENT";
    cheque_no?: string;
    cheque_date?: string;
    clear_date?: string;
    remarks?: string;
    payment_method: string;
    cheque_id?: number | null;
    group_id?: number | null;
    cheque_status?: string;
    message_line_id?: number | null;
    firm_id?: number | null;
    is_multi?: boolean;
    splits?: any[];
    allocations: PaymentAllocation[];
  };
  accounts: Account[];
  paymentAccounts: PaymentAccount[];
  messageLines?: MessageLine[];
  firms?: Firm[];
}

const toNum = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

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

const fmtDate = (d: string) => {
  if (!d) return "N/A";
  return parseLocalDate(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PaymentEdit({ payment, accounts, paymentAccounts, messageLines = [], firms = [] }: PaymentProps) {
  const { flash, errors } = usePage().props as any;

  // Sync validation errors
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      Object.values(errors).forEach((err: any) => toast.error(err));
    }
  }, [errors]);

  // Form State
  const [date, setDate] = useState<string>(payment.date || formatLocalDate(new Date()));
  const [selectedAccountId, setSelectedAccountId] = useState<string>(payment.account_id ? payment.account_id.toString() : "");
  const selectedAccount = useMemo(() => {
    return accounts.find(a => a.id.toString() === selectedAccountId);
  }, [accounts, selectedAccountId]);

  const isBankAccountSelected = useMemo(() => {
    return selectedAccount?.account_type?.name?.toLowerCase() === 'bank';
  }, [selectedAccount]);

  const [accountSearch, setAccountSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [mobileAccOpen, setMobileAccOpen] = useState(false);
  const [desktopAccOpen, setDesktopAccOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [clearDateOpen, setClearDateOpen] = useState(false);
  const [chequeDateOpen, setChequeDateOpen] = useState(false);

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    return () => {
      if (iframeRef.current && document.body.contains(iframeRef.current)) {
        document.body.removeChild(iframeRef.current);
      }
    };
  }, []);

  const handleDirectPrint = (format: 'small' | 'big') => {
    const printId = flash?.print_id || flash?.saved_payments?.[0]?.id || successData?.printId || payment.id;
    if (!printId) {
      toast.error("Voucher ID not found. Please check reports.");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.src = `/payments/${printId}/pdf?format=${format}`;

    if (iframeRef.current && document.body.contains(iframeRef.current)) {
      document.body.removeChild(iframeRef.current);
    }

    iframeRef.current = iframe;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Direct print failed, fallback to new tab:", e);
        window.open(iframe.src, '_blank');
      }
    };
  };

  useEffect(() => {
    if (flash?.success) {
      setSuccessData({
        partyName: accounts.find(a => a.id.toString() === selectedAccountId)?.title || "General Party",
        amount: (amount || 0) - (discount || 0),
        invoicesCount: selectedBillIds.size,
        method: isMultiPayment ? "Multi" : (paymentMethod || "Cash"),
        discount: discount,
        voucherNo: payment.voucher_no || '---',
        printId: payment.id
      });
      setSuccessDialogOpen(true);
    }
  }, [flash?.success]);

  const [paymentType, setPaymentType] = useState<"RECEIPT" | "PAYMENT">(payment.type || "RECEIPT");
  const [paymentAccountId, setPaymentAccountId] = useState<string>(payment.payment_account_id?.toString() ?? "");

  const t = useMemo(() => {
    return paymentType === 'RECEIPT' ? {
      text: "text-emerald-600 dark:text-emerald-500",
      textLight: "text-emerald-500",
      textDark: "text-emerald-600",
      bgHover: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
      bgHoverRow: "hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5",
      bgSelectedRow: "bg-emerald-500/5",
      borderHover: "hover:border-emerald-500",
      borderHoverAlpha: "hover:border-emerald-500/30",
      border: "border-emerald-500",
      groupHoverBg: "group-hover:bg-emerald-500",
      gradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
      gradientShadow: "shadow-emerald-500/20",
      checkboxChecked: "data-[state=checked]:bg-emerald-500",
      focusRing: "focus-visible:ring-emerald-500",
      blob: "bg-emerald-500/5",
      alphaBox: "bg-emerald-500/5 border border-emerald-500/10",
      borderAlpha: "border-emerald-500/30",
      borderLight: "border-emerald-200 dark:border-emerald-500/20",
      btnBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20",
      badgeBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
      groupHoverBorder: "border-emerald-500/20 group-hover:border-emerald-500",
      scrollbarHover: "#10b981",
    } : {
      text: "text-rose-600 dark:text-rose-500",
      textLight: "text-rose-500",
      textDark: "text-rose-600",
      bgHover: "hover:bg-rose-50 dark:hover:bg-rose-500/10",
      bgHoverRow: "hover:bg-rose-50/30 dark:hover:bg-rose-500/5",
      bgSelectedRow: "bg-rose-500/5",
      borderHover: "hover:border-rose-500",
      borderHoverAlpha: "hover:border-rose-500/30",
      border: "border-rose-500",
      groupHoverBg: "group-hover:bg-rose-500",
      gradient: "bg-gradient-to-r from-rose-500 to-red-500",
      gradientShadow: "shadow-rose-500/20",
      checkboxChecked: "data-[state=checked]:bg-rose-500",
      focusRing: "focus-visible:ring-rose-500",
      blob: "bg-rose-500/5",
      alphaBox: "bg-rose-500/5 border border-rose-500/10",
      borderAlpha: "border-rose-500/30",
      borderLight: "border-rose-200 dark:border-rose-500/20",
      btnBg: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20",
      badgeBox: "bg-rose-500/10 text-rose-600 dark:text-rose-500",
      groupHoverBorder: "border-rose-500/20 group-hover:border-rose-500",
      scrollbarHover: "#f43f5e",
    };
  }, [paymentType]);

  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [balanceOrientation, setBalanceOrientation] = useState<string>("dr");
  const [advanceBalance, setAdvanceBalance] = useState<number>(0);
  const [useAdvance, setUseAdvance] = useState<boolean>(false);
  const [totalSalesPurchases, setTotalSalesPurchases] = useState<number>(0);
  const [totalReceivedPaid, setTotalReceivedPaid] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [totalDiscountParty, setTotalDiscountParty] = useState<number>(0);
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const [amount, setAmount] = useState<number>(toNum(payment.amount));
  const [discount, setDiscount] = useState<number>(toNum(payment.discount || 0));
  const [chequeNo, setChequeNo] = useState<string>(payment.cheque_no || "");
  const [chequeDate, setChequeDate] = useState<string>(payment.cheque_date || "");
  const [clearDate, setClearDate] = useState<string>(payment.clear_date || "");
  const [remarks, setRemarks] = useState<string>(payment.remarks || "");

  const [paymentMethod, setPaymentMethod] = useState<string>(payment.payment_method || "Cash");
  const [selectedFirmId, setSelectedFirmId] = useState<string>(payment.firm_id?.toString() ?? "0");
  const [selectedMessageId, setSelectedMessageId] = useState<string>(payment.message_line_id?.toString() ?? "0");
  
  const initialIsMulti = Boolean(payment.is_multi || (payment.splits && payment.splits.length > 1));
  const [isMultiPayment, setIsMultiPayment] = useState<boolean>(initialIsMulti);

  const initialSplits = useMemo(() => {
    if (payment.splits && payment.splits.length > 0) {
      return payment.splits.map((s: any, idx: number) => ({
        id: Date.now() + idx,
        payment_account_id: s.payment_account_id ? s.payment_account_id.toString() : "",
        amount: toNum(s.amount),
        cheque_no: s.cheque_no || "",
        cheque_date: s.cheque_date || "",
        clear_date: s.clear_date || "",
        payment_method: s.payment_method || "Cash",
        original_cheque_id: s.cheque_id ? s.cheque_id.toString() : ""
      }));
    }
    return [{
      id: Date.now(),
      payment_account_id: payment.payment_account_id ? payment.payment_account_id.toString() : "",
      amount: toNum(payment.amount),
      cheque_no: payment.cheque_no || "",
      cheque_date: payment.cheque_date || "",
      clear_date: payment.clear_date || "",
      payment_method: payment.payment_method || "Cash",
      original_cheque_id: payment.cheque_id ? payment.cheque_id.toString() : ""
    }];
  }, [payment]);

  const [splitPayments, setSplitPayments] = useState<any[]>(initialSplits);

  useEffect(() => {
    if (paymentAccountId) {
      setSplitPayments(prev => {
        if (prev.length === 1 && (!prev[0].payment_account_id || prev[0].payment_account_id !== paymentAccountId)) {
          return [{ ...prev[0], payment_account_id: paymentAccountId }];
        }
        return prev;
      });
    }
  }, [paymentAccountId]);

  useEffect(() => {
    if (isMultiPayment && paymentAccountId) {
      setSplitPayments(prev => {
        if (prev.length > 0 && !prev[0].payment_account_id) {
          return prev.map((p, idx) => idx === 0 ? { ...p, payment_account_id: paymentAccountId, amount: amount || p.amount } : p);
        }
        return prev;
      });
    }
  }, [isMultiPayment, paymentAccountId, amount]);

  const [customerCheques, setCustomerCheques] = useState<any[]>([]);
  const [originalChequeId, setOriginalChequeId] = useState<string>(payment.cheque_id?.toString() ?? "");
  const [chequeSelectorOpen, setChequeSelectorOpen] = useState(false);
  const [chequeSearch, setChequeSearch] = useState("");
  const [chequeSelectorTarget, setChequeSelectorTarget] = useState<'single' | number | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<Bill | null>(null);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [billDetailLoading, setBillDetailLoading] = useState(false);
  const [availableCheques, setAvailableCheques] = useState<Record<string, string[]>>({});

  const fetchAvailableCheques = async (bankId: string) => {
    if (!bankId || availableCheques[bankId]) return;
    try {
      const res = await axios.get(`/payment/available-cheques?account_id=${bankId}`);
      setAvailableCheques(prev => ({ ...prev, [bankId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomerCheques = async () => {
    try {
      const res = await axios.get(`/payment/available-customer-cheques`);
      setCustomerCheques(res.data);
    } catch (err) {
      console.error("Failed to fetch customer cheques", err);
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch = !accountSearch || acc.title.toLowerCase().includes(accountSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedCategory === "ALL") return true;

      const typeName = acc.account_type?.name?.toLowerCase() || "";
      if (selectedCategory === "CUSTOMERS") return typeName.includes("customer");
      if (selectedCategory === "SUPPLIERS") return typeName.includes("supplier");
      if (selectedCategory === "BANKS") return typeName.includes("bank");
      if (selectedCategory === "OTHERS") return !typeName.includes("customer") && !typeName.includes("supplier") && !typeName.includes("bank");

      return true;
    });
  }, [accounts, accountSearch, selectedCategory]);

  const handleAccountSelect = (id: number) => {
    setSelectedAccountId(id.toString());
    setMobileAccOpen(false);
    setDesktopAccOpen(false);
  };

  const fetchBillDetail = (bill: Bill) => {
    setSelectedBillForDetail(bill);
    setDetailDialogOpen(true);
    setBillDetailLoading(true);
    axios.get(`/payment/bill-items?bill_id=${bill.id}&bill_type=${bill.type}`)
      .then(res => setBillItems(res.data))
      .catch(console.error)
      .finally(() => setBillDetailLoading(false));
  };

  const filteredCustomerCheques = useMemo(() => {
    if (!chequeSearch) return customerCheques;
    const searchLow = chequeSearch.toLowerCase();
    return customerCheques.filter(chq => 
      chq.cheque_no?.toLowerCase().includes(searchLow) ||
      chq.customer_name?.toLowerCase().includes(searchLow) ||
      toNum(chq.amount).toString().includes(searchLow)
    );
  }, [customerCheques, chequeSearch]);

  const handleChequeSelect = (chq: any) => {
    if (chequeSelectorTarget === 'single') {
      setOriginalChequeId(chq.id.toString());
      setChequeNo(chq.cheque_no);
      setChequeDate(chq.cheque_date);
      setClearDate(chq.clear_date || "");
      setAmount(toNum(chq.amount));
    } else if (typeof chequeSelectorTarget === 'number') {
      setSplitPayments(prev => prev.map(p => p.id === chequeSelectorTarget ? {
        ...p,
        original_cheque_id: chq.id.toString(),
        cheque_no: chq.cheque_no,
        cheque_date: chq.cheque_date,
        clear_date: chq.clear_date || "",
        amount: toNum(chq.amount)
      } : p));
    }
    setChequeSelectorOpen(false);
    setChequeSearch("");
    setChequeSelectorTarget(null);
  };

  // Fetch unpaid bills when account changes
  useEffect(() => {
    if (selectedAccountId) {
      const isInitial = selectedAccountId === payment.account_id.toString();
      if (!isInitial) {
        const selectedAccount = accounts.find(acc => acc.id.toString() === selectedAccountId);
        if (selectedAccount) {
          const accountTypeName = (selectedAccount as any).account_type?.name;
          if (accountTypeName === 'Customers') {
            setPaymentType('RECEIPT');
          } else if (accountTypeName === 'Supplier') {
            setPaymentType('PAYMENT');
          }
        }
      }

      axios.get(`/payment/unpaid-bills?account_id=${selectedAccountId}&payment_id=${payment.id}`)
        .then(res => {
          setUnpaidBills(res.data.bills || []);
          setCurrentBalance(res.data.current_balance || 0);
          setBalanceOrientation(res.data.orientation || "dr");
          setAdvanceBalance(res.data.advance_amount || 0);
          setUseAdvance(false);
          setTotalSalesPurchases(res.data.total_sales_purchases || 0);
          setTotalReceivedPaid(res.data.total_received_paid || 0);
          setTotalDiscountParty(res.data.total_discount || 0);
          setTotalBalance(res.data.total_balance || 0);
          setAdvancePaid(res.data.advance_paid || 0);

          if (isInitial && payment.allocations) {
            const initialAllocations: Record<string, number> = {};
            const initialSelectedIds = new Set<string>();
            payment.allocations.forEach((a: any) => {
              initialAllocations[a.bill_id.toString()] = Number(a.amount);
              initialSelectedIds.add(a.bill_id.toString());
            });
            setAllocations(initialAllocations);
            setSelectedBillIds(initialSelectedIds);
          } else {
            setSelectedBillIds(new Set());
            setAllocations({});
            setAmount(0);
          }
        })
        .catch(err => console.error("Failed to fetch bills", err));
    } else {
      setUnpaidBills([]);
      setTotalSalesPurchases(0);
      setTotalReceivedPaid(0);
      setTotalDiscountParty(0);
      setTotalBalance(0);
      setAdvancePaid(0);
    }
  }, [selectedAccountId, accounts]);

  // Handle Payment Account Change
  useEffect(() => {
    if (paymentAccountId) {
      const account = paymentAccounts.find(a => a.id.toString() === paymentAccountId);
      const isChequeInHand = account?.account_type?.name === 'Cheque in hand';

      if (account && account.account_type?.name === 'Bank') {
        setPaymentMethod("");
        setChequeNo("");
        setChequeDate("");
      } else if (isChequeInHand) {
        setPaymentMethod("Cheque");
        if (paymentType === 'PAYMENT') {
          fetchCustomerCheques();
        }
      } else {
        setPaymentMethod("Cash");
        setChequeNo("");
        setChequeDate("");
      }
    } else {
      setPaymentMethod("Cash");
      setChequeNo("");
      setChequeDate("");
    }
  }, [paymentAccountId, paymentType]);

  useEffect(() => {
    if (paymentMethod === 'Cheque' && paymentAccountId) {
      if (paymentType === 'RECEIPT') {
        setChequeNo('');
      } else {
        if (availableCheques[paymentAccountId] && availableCheques[paymentAccountId].length > 0 && !chequeNo) {
          setChequeNo(availableCheques[paymentAccountId][0]);
        }
      }
    } else {
      setChequeNo('');
      setChequeDate('');
    }
  }, [paymentMethod, paymentAccountId, paymentType, availableCheques]);

  useEffect(() => {
    if (paymentAccountId) {
      fetchAvailableCheques(paymentAccountId);
    }
  }, [paymentAccountId]);

  const toggleBill = (billId: number, billAmount: number) => {
    const idStr = billId.toString();
    const newSet = new Set(selectedBillIds);
    const newAllocations = { ...allocations };

    if (newSet.has(idStr)) {
      newSet.delete(idStr);
      delete newAllocations[idStr];
    } else {
      newSet.add(idStr);
      newAllocations[idStr] = Number(billAmount.toFixed(2));
    }

    setSelectedBillIds(newSet);
    setAllocations(newAllocations);

    const newAllocTotal = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);
    const finalAmount = useAdvance ? Math.max(0, newAllocTotal - advanceBalance) : newAllocTotal;
    setAmount(Number(finalAmount.toFixed(2)));
  };

  const toggleAll = () => {
    if (selectedBillIds.size === unpaidBills.length) {
      setSelectedBillIds(new Set());
      setAllocations({});
      setAmount(0);
    } else {
      const newSet = new Set<string>();
      const newAllocations: Record<string, number> = {};
      let total = 0;
      unpaidBills.forEach(b => {
        newSet.add(b.id.toString());
        newAllocations[b.id.toString()] = Number(b.remaining_amount);
        total += Number(b.remaining_amount);
      });
      setSelectedBillIds(newSet);
      setAllocations(newAllocations);
      const finalAmount = useAdvance ? Math.max(0, total - advanceBalance) : total;
      setAmount(Number(finalAmount.toFixed(2)));
    }
  };

  const handleAllocationChange = (billId: string, value: string) => {
    const amountVal = Number(value);
    const bill = unpaidBills.find(b => b.id.toString() === billId);
    if (!bill) return;

    const clampedAmount = Math.min(amountVal, bill.remaining_amount);
    const newAllocations = { ...allocations, [billId]: clampedAmount };
    setAllocations(newAllocations);
  };

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0);
  }, [allocations]);

  const basePayoutRequired = useMemo(() => {
    const targetGross = selectedBillIds.size > 0 ? totalAllocated : (currentBalance > 0 ? currentBalance : 0);
    return Math.max(0, targetGross - discount);
  }, [selectedBillIds.size, totalAllocated, currentBalance, discount]);

  const balanceRequired = useMemo(() => {
    const splitsSum = splitPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    return basePayoutRequired - splitsSum;
  }, [basePayoutRequired, splitPayments]);

  const appliedFromAdvance = useMemo(() => {
    const netPaid = amount - discount;
    return Math.max(0, totalAllocated - netPaid);
  }, [amount, discount, totalAllocated]);

  const addSplitRow = () => {
    setSplitPayments(prev => [
      ...prev,
      { id: Date.now(), payment_account_id: "", amount: 0, cheque_no: "", cheque_date: "", clear_date: "", payment_method: "", original_cheque_id: "" }
    ]);
  };

  const removeSplitRow = (id: number) => {
    if (splitPayments.length <= 1) {
      toast.error("At least one payout method is required.");
      return;
    }
    setSplitPayments(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    if (isMultiPayment) {
      const splitsSum = splitPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      setAmount(splitsSum);
    }
  }, [isMultiPayment, splitPayments]);

  const updateSplitRow = (id: number, field: string, value: any) => {
    setSplitPayments(prevSplits => {
      let updated = prevSplits.map(p => p.id === id ? { ...p, [field]: value } : p);

      if (field === 'payment_account_id' && value) {
        const account = paymentAccounts.find(a => a.id.toString() === value);
        if (account?.account_type?.name === 'Cheque in hand') {
          updated = updated.map(p => p.id === id ? { ...p, payment_method: 'Cheque', cheque_no: '', cheque_date: '', clear_date: '', original_cheque_id: '' } : p);
        } else if (account?.account_type?.name === 'Bank') {
          updated = updated.map(p => p.id === id ? { ...p, payment_method: '', cheque_no: '', cheque_date: '', clear_date: '', original_cheque_id: '' } : p);
        } else if (account?.account_type?.name === 'Cash') {
          updated = updated.map(p => p.id === id ? { ...p, payment_method: 'Cash', cheque_no: '', cheque_date: '', clear_date: '', original_cheque_id: '' } : p);
        }
      }

      if (field === 'payment_method' && value !== 'Cheque') {
        updated = updated.map(p => p.id === id ? { ...p, cheque_no: '', cheque_date: '', clear_date: '', original_cheque_id: '' } : p);
      }

      return updated;
    });

    if (field === 'payment_account_id' && value) {
      const account = paymentAccounts.find(a => a.id.toString() === value);
      if (account?.account_type?.name === 'Bank') {
        fetchAvailableCheques(value);
      } else if (account?.account_type?.name === 'Cheque in hand') {
        fetchCustomerCheques();
      }
    }
  };

  const [loading, setLoading] = useState(false);

  // Handle Update
  const handleUpdate = () => {
    if (loading) return;

    if (!selectedAccountId) {
      toast.error("Please select a Ledger Party.");
      return;
    }

    const allocationPayload = unpaidBills
      .filter(b => selectedBillIds.has(b.id.toString()))
      .map(b => ({
        bill_id: b.id,
        bill_type: b.type,
        amount: allocations[b.id.toString()] || 0
      }))
      .filter(a => a.amount > 0);

    let finalPayload: any;

    if (isMultiPayment) {
      let isValid = true;
      const cleanedSplits = splitPayments.map((p, idx) => {
        if (!p.payment_account_id) {
          toast.error(`Row ${idx + 1}: Missing Ledger Account.`);
          isValid = false;
        }
        if (p.amount <= 0) {
          toast.error(`Row ${idx + 1}: Amount must be greater than 0.`);
          isValid = false;
        }

        const isCashAccount = paymentAccounts.find(a => a.id.toString() === p.payment_account_id)?.account_type?.name === 'Cash';
        let method = p.payment_method;

        if (isCashAccount) {
          method = 'Cash';
        } else {
          if (!method || method === 'Cash') {
            toast.error(`Row ${idx + 1}: Please select a valid Bank Method (e.g. Cheque, Online Transfer).`);
            isValid = false;
          }
        }

        if (method === 'Cheque' && !p.cheque_no && paymentType === 'PAYMENT') {
          toast.error(`Row ${idx + 1}: Missing Cheque Number.`);
          isValid = false;
        }

        return { ...p, payment_method: method };
      });

      if (!isValid) return;

      const splitsTotal = cleanedSplits.reduce((s, p) => s + Number(p.amount), 0);

      finalPayload = {
        is_multi: true,
        date,
        account_id: Number(selectedAccountId),
        type: paymentType,
        remarks: remarks || null,
        message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,
        firm_id: selectedFirmId !== "0" ? Number(selectedFirmId) : null,
        allocations: allocationPayload,
        splits: cleanedSplits,
        amount: splitsTotal,
        discount: discount
      };
    } else {
      if (!paymentAccountId) {
        toast.error("Please select a Payout Source (Cash/Bank) before confirming.");
        return;
      }

      let finalMethod = paymentMethod;
      const isCashAccount = paymentAccounts.find(a => a.id.toString() === paymentAccountId)?.account_type?.name === 'Cash';

      if (isCashAccount) {
        finalMethod = 'Cash';
      } else {
        if (!finalMethod || finalMethod === 'Cash') {
          toast.error("Please select a Bank Method (e.g. Cheque, Online Transfer).");
          return;
        }
        if (finalMethod === 'Cheque' && !chequeNo && paymentType === 'PAYMENT') {
          toast.error("Please select a Cheque Number before saving.");
          return;
        }
      }

      finalPayload = {
        is_multi: false,
        date,
        account_id: Number(selectedAccountId),
        payment_account_id: Number(paymentAccountId),
        amount,
        discount,
        type: paymentType,
        payment_method: finalMethod,
        cheque_no: chequeNo || null,
        cheque_date: chequeDate || null,
        clear_date: clearDate || null,
        remarks: remarks || null,
        message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,
        firm_id: selectedFirmId !== "0" ? Number(selectedFirmId) : null,
        allocations: allocationPayload,
        original_cheque_id: originalChequeId || null
      };
    }

    setLoading(true);
    router.put(`/payments/${payment.id}`, finalPayload, {
      onFinish: () => setLoading(false)
    });
  };

  return (
    <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "16rem", "--header-height": "3.5rem" } as React.CSSProperties}>
      <Head title={`Payments | Edit ${payment.voucher_no}`} />
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col h-screen">
        <SiteHeader breadcrumbs={[
          { title: "Payments", href: "/payment" },
          { title: `Edit ${payment.voucher_no}`, href: `/payment/${payment.id}/edit` }
        ]} />

        <main className="flex-1 overflow-auto md:overflow-hidden p-3 md:py-4 md:px-6 flex flex-col md:flex-row gap-5 scroll-smooth">

          {/* ── WORKSPACE ── */}
          <div className="flex-1 flex flex-col gap-4 md:gap-4 md:overflow-hidden">

            {/* Mobile Header (Control Deck) */}
            <div className="md:hidden space-y-3">
              <Card className={`p-4 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} space-y-4 shadow-lg shadow-zinc-200/50 dark:shadow-none`}>
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="space-y-0.5">
                    <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest">Entry Date</div>
                    <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 leading-none">
                      <CalendarIcon size={12} className="text-zinc-400" />
                      {fmtDate(date)}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest">Voucher</div>
                    <div className={`text-sm font-black ${t.textDark} font-mono tracking-tighter uppercase`}>{payment.voucher_no}</div>
                  </div>
                </div>

                <TechLabel label="Ledger Party" icon={UserIcon}>
                  <Popover open={mobileAccOpen} onOpenChange={setMobileAccOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-black text-sm text-left uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all ${t.borderHover} shadow-sm`}>
                        <span className="truncate">{selectedAccountId ? accounts.find(a => a.id.toString() === selectedAccountId)?.title : "Select Party..."}</span>
                        <Search size={14} className="text-zinc-400 flex-shrink-0 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-48px)] p-0 shadow-2xl border-zinc-300 dark:border-zinc-700" align="center" sideOffset={8}>
                      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <Input placeholder="SEARCH PARTY..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-10 text-xs font-mono uppercase border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
                      </div>
                      <div className="max-h-[60vh] overflow-auto py-1">
                        {filteredAccounts.map(acc => (
                          <button key={acc.id} className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest ${t.bgHover} transition-colors flex items-center gap-3 group border-l-2 border-transparent ${t.borderHover}`}
                            onClick={() => handleAccountSelect(acc.id)}>
                            <div className={`w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 ${t.groupHoverBg} flex-shrink-0`} />
                            <span className="truncate">{acc.title}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TechLabel>
              </Card>
            </div>

            {/* Control Header (Desktop Only) */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="hidden md:block">
              <Card className={`p-4 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} grid grid-cols-12 gap-4 items-end relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full ${t.gradient}`} />

                <div className="col-span-3">
                  <TechLabel label="Entry Date" icon={CalendarIcon}>
                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all ${t.borderHover}`}>
                          {fmtDate(date)}
                          <CalendarIcon size={14} className="text-zinc-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                        <Calendar mode="single" selected={parseLocalDate(date)} onSelect={(d) => { if (d) { setDate(formatLocalDate(d)); setCalOpen(false); } }} />
                      </PopoverContent>
                    </Popover>
                  </TechLabel>
                </div>

                <div className="col-span-5">
                  <TechLabel label="Ledger Party" icon={UserIcon}>
                    <Dialog open={desktopAccOpen} onOpenChange={setDesktopAccOpen} >
                      <DialogTrigger asChild>
                        <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-black text-sm text-left truncate uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all ${t.borderHover}`}>
                          {selectedAccountId ? accounts.find(a => a.id.toString() === selectedAccountId)?.title : "Select Party Account..."}
                          <Search size={14} className="text-zinc-400" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xl p-0 border-zinc-300 dark:border-zinc-700 shadow-2xl">
                        <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-t-lg">
                          <DialogTitle className="text-sm font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-100">Select Party Account</DialogTitle>
                          <DialogDescription className="sr-only">Search and select a party account from the list</DialogDescription>
                          
                          {/* Category Filter Pills */}
                          <div className="flex items-center gap-1.5 pt-3 pb-1 overflow-x-auto custom-scrollbar">
                            {["ALL", "CUSTOMERS", "SUPPLIERS", "BANKS", "OTHERS"].map((cat) => (
                              <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                  "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all border",
                                  selectedCategory === cat
                                    ? `${t.btnBg} text-white shadow-sm border-transparent`
                                    : "bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                )}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>

                          <div className="pt-2">
                            <Input placeholder="SEARCH PARTY..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-10 text-xs font-mono uppercase bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
                          </div>
                        </DialogHeader>
                        <div className="max-h-[50vh] overflow-auto py-2 px-2">
                          {filteredAccounts.map(acc => (
                            <button key={acc.id} className={`w-full text-left px-3 py-2 rounded-md mb-1 text-xs font-bold uppercase tracking-widest ${t.bgHover} transition-colors flex flex-col group border border-transparent ${t.borderHoverAlpha}`}
                              onClick={() => handleAccountSelect(acc.id)}>
                              <div className="flex justify-between items-center w-full mb-1 border-b border-zinc-100 dark:border-zinc-800/50 pb-1">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 ${t.groupHoverBg}`} />
                                  <span className="text-zinc-800 dark:text-zinc-200 truncate">{acc.title}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 block tracking-tighter">Balance</span>
                                  <span className={`text-xs font-black tracking-tighter ${typeof (acc as any).current_balance !== 'undefined' ? ((acc as any).current_balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400') : 'text-zinc-500'}`}>
                                    {typeof (acc as any).current_balance !== 'undefined' ? Math.abs((acc as any).current_balance).toLocaleString('en-US', {minimumFractionDigits: 2}) + ((acc as any).current_balance < 0 ? ' CR' : ' DR') : "---"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-start pl-3.5">
                                <div
                                  className={cn(
                                    "text-[9px] lowercase font-bold tracking-tight px-1.5 py-0.5 rounded-sm transition-colors",
                                    (() => {
                                      const name = acc.account_type?.name?.toLowerCase() || "";
                                      if (name.includes("customer")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                                      if (name.includes("supplier")) return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
                                      if (name.includes("bank")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black";
                                      return "text-zinc-400 dark:text-zinc-500 opacity-40";
                                    })()
                                  )}
                                >
                                  {acc.account_type?.name || "---"}
                                </div>
                              </div>
                            </button>
                          ))}
                          {filteredAccounts.length === 0 && (
                            <div className="p-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                              No accounts found matching "{accountSearch}"
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TechLabel>
                </div>

                <div className="col-span-4 flex items-end gap-3">
                  <div className="flex-1">
                    <TechLabel label="Payout Routing" icon={Navigation}>
                      <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                        <SelectTrigger className={cn(
                          `h-10 ${PREMIUM_ROUNDING_MD} bg-zinc-50 dark:bg-zinc-800 w-full font-bold text-xs border-2 transition-all duration-300`,
                          paymentType === 'RECEIPT' 
                            ? "border-emerald-500/50 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                            : "border-rose-500/50 dark:border-rose-500/30 text-rose-600 dark:text-rose-400"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="RECEIPT" className="text-emerald-600 font-bold">RECEIPT (IN/CR)</SelectItem>
                          <SelectItem value="PAYMENT" className="text-rose-600 font-bold">PAYMENT (OUT/DR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TechLabel>
                  </div>
                  <div className="w-24">
                    <TechLabel label="Voucher No" icon={Hash}>
                      <div className="h-10 flex items-center justify-center font-mono text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md uppercase border border-zinc-200 dark:border-zinc-700">{payment.voucher_no}</div>
                    </TechLabel>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Ledger Manifest / Multi-Method Switch */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 min-h-0 flex flex-col md:overflow-hidden">
              <AnimatePresence mode="wait">
                {!isMultiPayment ? (
                  <motion.div key="unpaid-bills-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-h-0 flex flex-col">
                    <Card className={`flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden ${PREMIUM_ROUNDING_MD} py-0`}>
                      {/* Table Header/Toolbar */}
                      <div className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 px-4 h-12 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Scale size={14} className="text-zinc-400" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Unpaid Bills & Settlements</span>
                          <span className={`text-[10px] font-black ${t.text} uppercase tracking-widest px-2 py-0.5 bg-zinc-200/50 dark:bg-zinc-800 rounded-md ml-2`}>
                            {selectedAccountId ? `${accounts.find(a => a.id.toString() === selectedAccountId)?.title} (${accounts.find(a => a.id.toString() === selectedAccountId)?.account_type?.name})` : "No Party Selected"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-zinc-400">
                          <span className="flex items-center gap-1.5"><Hash size={12} /> ENTRIES: {unpaidBills.length}</span>
                          <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                          <span className="flex items-center gap-1.5"><BadgePercent size={12} /> DISC: {discount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Table Content */}
                      <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full border-separate border-spacing-0">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
                              <th className="p-4 text-left border-b border-zinc-100 dark:border-zinc-800 w-10">
                                <Checkbox checked={unpaidBills.length > 0 && selectedBillIds.size === unpaidBills.length} onCheckedChange={toggleAll} className="border-zinc-300 dark:border-zinc-700" />
                              </th>
                              <th className="px-4 py-3 text-left border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400">Invoice No</th>
                              <th className="px-4 py-3 text-left border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400">Type</th>
                              <th className="px-4 py-3 text-left border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</th>
                              <th className="px-4 py-3 text-right border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-rose-500">Discount</th>
                              <th className="px-4 py-3 text-right border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-rose-500">Returns</th>
                              <th className="px-4 py-3 text-right border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400">Remaining</th>
                              <th className="px-4 py-3 text-right border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-40">Allocation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {unpaidBills.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-24 text-center">
                                  <div className="flex flex-col items-center gap-3 opacity-20">
                                    <Package size={48} className="text-zinc-400" />
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">No Unpaid Invoices Found</div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              unpaidBills.map((bill) => (
                                <motion.tr key={`${bill.type}-${bill.id}`}
                                  className={`group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20 transition-colors cursor-default ${selectedBillIds.has(bill.id.toString()) ? t.blob : ''}`}>
                                  <td className="p-4 border-b border-zinc-50/50 dark:border-zinc-800/30">
                                    <Checkbox checked={selectedBillIds.has(bill.id.toString())} onCheckedChange={() => toggleBill(bill.id, Number(bill.remaining_amount))} className={`border-zinc-300 dark:border-zinc-700 ${t.checkboxChecked}`} />
                                  </td>
                                  <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30">
                                    <span 
                                      onClick={() => fetchBillDetail(bill)}
                                      className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter flex items-center gap-1.5 cursor-pointer hover:underline hover:text-blue-500 transition-colors"
                                    >
                                      <FileText size={12} className="opacity-50" />
                                      {bill.invoice_no}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30">
                                    <SignalBadge text={bill.bill_type_label} type={bill.bill_type_label === 'Sale' ? 'blue' : 'orange'} />
                                  </td>
                                  <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30 text-[11px] font-mono text-zinc-500 font-bold uppercase tracking-tighter">
                                    {fmtDate(bill.date)}
                                  </td>
                                  <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30 text-right text-rose-500">
                                    <div className="text-[11px] font-mono font-bold">{toNum(bill.discount_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  </td>
                                  <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30 text-right text-rose-500">
                                    <div className="text-[11px] font-mono font-bold">{toNum(bill.return_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  </td>
                                  <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30 text-right">
                                    <div className="text-[11px] font-mono font-black text-zinc-900 dark:text-zinc-100">{toNum(bill.remaining_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  </td>
                                  <td className="px-4 py-2 border-b border-zinc-50/50 dark:border-zinc-800/30 text-right">
                                    <AnimatePresence mode="wait">
                                      {selectedBillIds.has(bill.id.toString()) ? (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                          <Input
                                            type="number"
                                            value={allocations[bill.id.toString()] || ""}
                                            onChange={(e) => handleAllocationChange(bill.id.toString(), e.target.value)}
                                            className={`h-8 text-right font-mono font-black text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-2 focus-visible:ring-1 ${t.focusRing} ${PREMIUM_ROUNDING_MD}`}
                                            placeholder="0.00"
                                          />
                                        </motion.div>
                                      ) : (
                                        <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 italic">--/--</div>
                                      )}
                                    </AnimatePresence>
                                  </td>
                                </motion.tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Footer / Summary Bar */}
                      <div className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800 p-3 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
                        <div className="flex gap-4">
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Selected Entries</div>
                            <div className="text-xs font-mono font-black text-zinc-800 dark:text-zinc-200">{selectedBillIds.size} / {unpaidBills.length}</div>
                          </div>
                          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 self-center" />
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Billed Outstanding</div>
                            <div className="text-xs font-mono font-black text-zinc-500">Rs {unpaidBills.reduce((s, b) => s + toNum(b.remaining_amount), 0).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {discount > 0 ? (
                            <div className={`px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 ${PREMIUM_ROUNDING_MD} flex items-center gap-3 animate-in fade-in slide-in-from-right-2`}>
                              <BadgePercent size={14} className="text-amber-500" />
                              <div className="space-y-0.5">
                                <div className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Discount (Adj)</div>
                                <div className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">- {discount.toLocaleString()}</div>
                              </div>
                            </div>
                          ) : appliedFromAdvance > 0 ? (
                            <div className={`px-3 py-1.5 bg-purple-500/5 border border-purple-500/20 ${PREMIUM_ROUNDING_MD} flex items-center gap-3 animate-in fade-in slide-in-from-right-2`}>
                              <RotateCcw size={14} className="text-purple-500" />
                              <div className="space-y-0.5">
                                <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Apply Advance</div>
                                <div className="text-xs font-mono font-black text-purple-600 dark:text-purple-400">- {appliedFromAdvance.toLocaleString()}</div>
                              </div>
                            </div>
                          ) : null}

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Effective Payout</div>
                              <div className={`text-lg font-mono font-black ${t.text} tracking-tighter`}>
                                Rs {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div className={`w-8 h-8 ${t.gradient} ${PREMIUM_ROUNDING_MD} flex items-center justify-center text-white shadow-lg ${t.gradientShadow}`}>
                              <Calculator size={20} className="opacity-80" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div key="multi-method-details" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="flex-1 min-h-0 flex flex-col">
                    <Card className={`flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden ${PREMIUM_ROUNDING} py-0`}>
                      {/* Table Header/Toolbar */}
                      <div className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 px-4 h-12 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <ClipboardList size={16} className={`${t.textDark}`} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Multi-Method Payment Details</span>
                          <span className={`text-[10px] font-black ${t.text} uppercase tracking-widest px-2 py-0.5 bg-orange-500/10 rounded-md ml-2`}>
                            {selectedAccountId ? `${accounts.find(a => a.id.toString() === selectedAccountId)?.title} (${accounts.find(a => a.id.toString() === selectedAccountId)?.account_type?.name})` : "No Party Selected"}
                          </span>
                        </div>
                        <Button onClick={addSplitRow} size="sm" className={`${t.gradient} text-white font-bold text-[10px] uppercase h-8 px-3`}>
                          <Plus size={14} className="mr-1.5" /> Add Split Method
                        </Button>
                      </div>

                      {/* Split Rows Content */}
                      <div className="flex-1 overflow-auto custom-scrollbar p-3">
                        <table className="w-full border-separate border-spacing-y-2">
                          <thead>
                            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                              <th className="px-3 text-left w-1/4">Ledger Account</th>
                              <th className="px-3 text-left w-40">Method</th>
                              <th className="px-3 text-left w-40">Cheque #</th>
                              <th className="px-3 text-left w-40">Chq Date</th>
                              <th className="px-3 text-left w-40">Clear Date</th>
                              <th className="px-3 text-right w-40">Amount</th>
                              <th className="px-3 text-center w-12"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {splitPayments.map((row) => (
                              <tr key={row.id} className="bg-zinc-50 dark:bg-zinc-900/30 rounded-lg group shadow-sm">
                                <td className={`p-2 border-l-4 border-orange-500/20 group-${t.borderHover} transition-all rounded-l-xl bg-white dark:bg-zinc-900 shadow-sm`}>
                                  <Select value={row.payment_account_id ? row.payment_account_id.toString() : ""} onValueChange={v => updateSplitRow(row.id, 'payment_account_id', v)}>
                                    <SelectTrigger className="h-10 w-full bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-xs font-bold font-mono uppercase">
                                      <SelectValue placeholder="Account..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {paymentAccounts
                                        .filter(acc => {
                                          if (acc.id.toString() === selectedAccountId?.toString()) return false;
                                          if (acc.id.toString() === row.payment_account_id?.toString()) return true;
                                          return !splitPayments.some(p => p.id !== row.id && p.payment_account_id?.toString() === acc.id.toString());
                                        })
                                        .map(acc => (
                                          <SelectItem key={acc.id} value={acc.id.toString()} className="text-xs font-bold uppercase">{acc.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-2 bg-white dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800 shadow-sm">
                                  <Select value={row.payment_method} onValueChange={v => updateSplitRow(row.id, 'payment_method', v)}>
                                    <SelectTrigger className="h-10 w-full bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase">
                                      <SelectValue placeholder="Method..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {paymentAccounts.find(a => a.id.toString() === row.payment_account_id)?.account_type?.name === 'Cash' ? (
                                        <SelectItem value="Cash" className="text-xs font-bold">Cash</SelectItem>
                                      ) : paymentAccounts.find(a => a.id.toString() === row.payment_account_id)?.account_type?.name === 'Bank' ? (
                                        <>
                                          <SelectItem value="Online Transfer" className="text-xs font-bold">Online Transfer</SelectItem>
                                          {paymentType === 'PAYMENT' && (
                                            <SelectItem value="Cheque" className="text-xs font-bold">Cheque</SelectItem>
                                          )}
                                        </>
                                      ) : paymentAccounts.find(a => a.id.toString() === row.payment_account_id)?.account_type?.name === 'Cheque in hand' ? (
                                        <SelectItem value="Cheque" className="text-xs font-bold">Cheque</SelectItem>
                                      ) : (
                                        <>
                                          <SelectItem value="Cash" className="text-xs font-bold">Cash</SelectItem>
                                          <SelectItem value="Online Transfer" className="text-xs font-bold">Online Transfer</SelectItem>
                                          <SelectItem value="Cheque" className="text-xs font-bold">Cheque</SelectItem>
                                        </>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-2 bg-white dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800 shadow-sm">
                                  {paymentType === 'PAYMENT' && row.payment_method === 'Cheque' ? (
                                    paymentAccounts.find(a => a.id.toString() === row.payment_account_id)?.account_type?.name === 'Cheque in hand' ? (
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setChequeSelectorTarget(row.id);
                                          setChequeSelectorOpen(true);
                                        }}
                                        className={`h-10 w-full justify-between bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-xs uppercase font-mono ${!row.original_cheque_id && t.border}`}
                                      >
                                        <span className="truncate">{row.original_cheque_id ? customerCheques.find(c => c.id.toString() === row.original_cheque_id)?.cheque_no : "Select In Hand..."}</span>
                                        <Search size={12} className="text-zinc-400 ml-1" />
                                      </Button>
                                    ) : (
                                      <Select value={row.cheque_no} onValueChange={v => updateSplitRow(row.id, 'cheque_no', v)}>
                                        <SelectTrigger disabled={!row.payment_account_id} className={`h-10 w-full bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-xs uppercase font-mono ${!row.cheque_no && t.border}`}>
                                          <SelectValue placeholder="Select Cheque..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableCheques[row.payment_account_id] && availableCheques[row.payment_account_id].length > 0 ? (
                                            availableCheques[row.payment_account_id].map((chq: string) => (
                                              <SelectItem key={chq} value={chq} className="text-xs font-mono">{chq}</SelectItem>
                                            ))
                                          ) : (
                                            <SelectItem value="none" disabled className="text-xs italic text-rose-500 py-1">no cheque found generate cheque book first</SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    )
                                  ) : (
                                    <Input value={row.cheque_no} onChange={e => updateSplitRow(row.id, 'cheque_no', e.target.value)} disabled={row.payment_method !== 'Cheque'} className="h-10 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-xs uppercase font-mono tracking-widest" placeholder="CHQ#" />
                                  )}
                                </td>
                                <td className="p-2 bg-white dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800 shadow-sm">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className="h-10 w-full justify-between bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 font-bold text-xs">
                                        {row.cheque_date ? fmtDate(row.cheque_date) : <span className="text-zinc-400 font-normal text-[10px]">Pick date...</span>}
                                        <CalendarIcon size={12} className="text-zinc-400" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                                      <Calendar mode="single" selected={row.cheque_date ? parseLocalDate(row.cheque_date) : undefined} onSelect={(d) => { if (d) updateSplitRow(row.id, 'cheque_date', formatLocalDate(d)); }} />
                                    </PopoverContent>
                                  </Popover>
                                </td>
                                <td className="p-2 bg-white dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800 shadow-sm">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className="h-10 w-full justify-between bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 font-bold text-xs">
                                        {row.clear_date ? fmtDate(row.clear_date) : <span className="text-zinc-400 font-normal text-[10px]">Pick date...</span>}
                                        <CalendarIcon size={12} className="text-zinc-400" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                                      <Calendar mode="single" selected={row.clear_date ? parseLocalDate(row.clear_date) : undefined} onSelect={(d) => { if (d) updateSplitRow(row.id, 'clear_date', formatLocalDate(d)); }} />
                                    </PopoverContent>
                                  </Popover>
                                </td>
                                <td className="p-2 bg-white dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800 shadow-sm">
                                  <Input type="number" value={row.amount || ""} onChange={e => updateSplitRow(row.id, 'amount', toNum(e.target.value))} className={`h-10 bg-zinc-50 dark:bg-zinc-800/50 ${t.borderAlpha} text-right font-mono text-xs font-black`} placeholder="0.00" />
                                </td>
                                <td className="p-2 text-center rounded-r-xl bg-white dark:bg-zinc-900 shadow-sm">
                                  <Button variant="ghost" size="icon" onClick={() => removeSplitRow(row.id)} className="h-8 w-8 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                    <Trash2 size={16} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Footer / Summary Bar */}
                      <div className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800 p-3 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
                        <div className="flex gap-6 items-center">
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Base Payout Required</div>
                            <div className="text-xs font-mono font-black text-zinc-500">Rs {basePayoutRequired.toLocaleString()}</div>
                          </div>
                          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 self-center" />
                          <div className="space-y-0.5">
                            <div className={`text-[9px] font-black ${t.textLight} uppercase tracking-widest`}>Aggregate Split Total</div>
                            <div className={`text-sm font-black font-mono tracking-tighter ${Math.abs(splitPayments.reduce((s, p) => s + Number(p.amount), 0) - basePayoutRequired) < 1 ? 'text-emerald-600' : 'text-zinc-700 dark:text-zinc-200'}`}>
                              Rs {splitPayments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 self-center" />
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Balance Required</div>
                            <div className={`text-sm font-black font-mono tracking-tighter ${Math.abs(balanceRequired) < 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              Rs {balanceRequired.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── FINANCIAL HUD (Right Sidebar) ── */}
          <div className="w-full md:w-[380px] space-y-4 md:space-y-4 flex flex-col md:overflow-hidden">

            {/* Account Insight Card */}
            {selectedAccountId && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-shrink-0">
                <Card className={`${CARD_BASE} p-5 ${PREMIUM_ROUNDING_MD} overflow-hidden shadow-lg shadow-zinc-200/50 dark:shadow-none`}>
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                    <h4 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest leading-none pt-0.5">Financial Auditor</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500 font-bold">
                        {isBankAccountSelected ? "Total In" : (paymentType === 'RECEIPT' ? "Total Sales" : "Total Purchases")}
                      </span>
                      <span className="font-black font-mono text-zinc-800 dark:text-zinc-200">
                        Rs {totalSalesPurchases.toLocaleString()}
                      </span>
                    </div>
                    {((totalDiscountParty > 0) || (discount > 0)) && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500 font-bold">Discount (Adj)</span>
                        <span className="font-black font-mono text-amber-600 dark:text-amber-400">
                          Rs {(totalDiscountParty + (discount || 0)).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500 font-bold">
                        {isBankAccountSelected ? "Total Out" : (paymentType === 'RECEIPT' ? "Total Received" : "Total Paid")}
                      </span>
                      <span className="font-black font-mono text-zinc-800 dark:text-zinc-200">
                        Rs {totalReceivedPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500 font-bold">
                        {isBankAccountSelected ? "Total Available" : "Total Balance"}
                      </span>
                      <span className={cn("font-black font-mono", isBankAccountSelected ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                        Rs {totalBalance.toLocaleString()}
                      </span>
                    </div>
                    {!isBankAccountSelected && advancePaid > 0 && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500 font-bold">Advance Paid</span>
                        <span className="font-black font-mono text-emerald-600">
                          Rs {advancePaid.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Executive Summary Card */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 min-h-0 flex flex-col">
              <Card className={`p-5 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING} relative overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-none flex-1 flex flex-col min-h-0`}>
                <div className={`absolute top-0 right-0 w-32 h-32 ${t.blob} rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none`} />

                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1 relative z-10 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${t.gradient}`} />
                    <h3 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-[0.2em]">
                      {isBankAccountSelected ? "BANK TRANSACTION" : "EDIT PAYMENT"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Multi-Method</span>
                      <Switch checked={isMultiPayment} onCheckedChange={setIsMultiPayment} className="scale-75" />
                    </div>
                    <SignalBadge text={isBankAccountSelected ? (paymentType === 'RECEIPT' ? 'WITHDRAWAL' : 'DEPOSIT') : paymentType} type={paymentType === 'RECEIPT' ? 'green' : 'red'} />
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col relative z-10">
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-3 custom-scrollbar">
                    <div className="flex justify-between items-end gap-4">
                      <div className="flex-1">
                        <TechLabel label="Primary Disbursement" icon={ArrowRightLeft}>
                          <div className="relative">
                            <Input type="number" value={amount || ""} onChange={e => setAmount(toNum(e.target.value))}
                              disabled={isMultiPayment}
                              className={`h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-black text-2xl tracking-tighter px-4 ${PREMIUM_ROUNDING_MD} ${t.focusRing} shadow-inner ${isMultiPayment ? 'opacity-90 bg-zinc-100 dark:bg-zinc-800/80 cursor-not-allowed' : ''}`} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-[10px]">PKR</div>
                          </div>
                        </TechLabel>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <TechLabel label="Discount (Adj)" icon={BadgePercent}>
                        <Input value={discount || ""} onChange={e => setDiscount(toNum(e.target.value))} className={`h-10 bg-white dark:bg-white/5 border-zinc-200 dark:border-zinc-700 font-mono text-xs font-bold ${PREMIUM_ROUNDING_MD}`} />
                      </TechLabel>
                      <TechLabel label="Clear Date" icon={Clock}>
                        <Popover open={clearDateOpen} onOpenChange={setClearDateOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all ${t.borderHover}`}>
                              {clearDate ? fmtDate(clearDate) : <span className="text-zinc-400 font-normal text-xs">Pick date...</span>}
                              <CalendarIcon size={14} className="text-zinc-400" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                            <Calendar mode="single" selected={clearDate ? parseLocalDate(clearDate) : undefined} onSelect={(d) => { if (d) { setClearDate(formatLocalDate(d)); setClearDateOpen(false); } }} />
                          </PopoverContent>
                        </Popover>
                      </TechLabel>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 ${PREMIUM_ROUNDING_MD} border border-zinc-100 dark:border-zinc-800">
                        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Net Settlement</div>
                        <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-500">
                          Rs {(amount - discount).toLocaleString()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <TechLabel label="Payout Source" icon={CreditCard}>
                          <Select value={paymentAccountId} onValueChange={setPaymentAccountId} disabled={isMultiPayment}>
                            <SelectTrigger disabled={isMultiPayment} className={`h-10 w-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold text-xs ${PREMIUM_ROUNDING_MD} ${isMultiPayment ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/80' : ''}`}>
                              <SelectValue placeholder="Select Cash/Bank..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {paymentAccounts
                                .filter(acc => acc.id.toString() !== selectedAccountId)
                                .map(acc => (
                                  <SelectItem key={acc.id} value={acc.id.toString()}>{acc.title}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TechLabel>

                        {paymentAccountId && ['Bank', 'Cheque in hand'].includes(paymentAccounts.find(a => a.id.toString() === paymentAccountId)?.account_type?.name || "") && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2 pt-2">
                            {paymentAccounts.find(a => a.id.toString() === paymentAccountId)?.account_type?.name !== 'Cheque in hand' && (
                              <TechLabel label="Bank Method" icon={Navigation}>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                  <SelectTrigger className={`h-9 w-full bg-white dark:bg-zinc-800 ${t.borderLight} font-bold text-[10px] ${PREMIUM_ROUNDING_MD}`}>
                                    <SelectValue placeholder="Select Method..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl text-xs">
                                    {paymentType === 'RECEIPT' ? (
                                      <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                                    ) : (
                                      <>
                                        <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                                        <SelectItem value="Cheque">Cheque Release</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </TechLabel>
                            )}
                            {paymentMethod === 'Cheque' && (
                              <div className="grid grid-cols-2 gap-2 pt-1 animate-in slide-in-from-top-2">
                                <TechLabel label="Cheque No">
                                  {paymentType === 'PAYMENT' ? (
                                    paymentAccounts.find(a => a.id.toString() === paymentAccountId)?.account_type?.name === 'Cheque in hand' ? (
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setChequeSelectorTarget('single');
                                          setChequeSelectorOpen(true);
                                        }}
                                        className={`h-9 w-full justify-between font-mono text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD} ${!originalChequeId && t.border}`}
                                      >
                                        <span className="truncate">{originalChequeId ? customerCheques.find(c => c.id.toString() === originalChequeId)?.cheque_no : "Select In Hand..."}</span>
                                        <Search size={12} className="text-zinc-400 ml-2" />
                                      </Button>
                                    ) : (
                                      <Select value={chequeNo} onValueChange={setChequeNo}>
                                        <SelectTrigger className={`h-9 font-mono text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD} ${!chequeNo && t.border}`}>
                                          <SelectValue placeholder="Select Cheque..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableCheques[paymentAccountId] && availableCheques[paymentAccountId].length > 0 ? (
                                            availableCheques[paymentAccountId].map((chq: string) => (
                                              <SelectItem key={chq} value={chq} className="text-xs font-mono">{chq}</SelectItem>
                                            ))
                                          ) : (
                                            <SelectItem value="none" disabled className="text-xs italic text-rose-500">no cheque found generate cheque book first</SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    )
                                  ) : (
                                    <Input value={chequeNo} onChange={e => setChequeNo(e.target.value)} className={`h-9 font-mono text-xs ${PREMIUM_ROUNDING_MD}`} placeholder="CHQ#" />
                                  )}
                                </TechLabel>
                                <TechLabel label="Chq Date">
                                  <Popover open={chequeDateOpen} onOpenChange={setChequeDateOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        disabled={paymentAccounts.find(a => a.id.toString() === paymentAccountId)?.account_type?.name === 'CHEQUE IN HAND'}
                                        className={`w-full justify-between h-9 ${PREMIUM_ROUNDING_MD} font-bold text-[10px] bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all ${t.borderHover}`}
                                      >
                                        {chequeDate ? fmtDate(chequeDate) : <span className="text-zinc-400 font-normal text-xs">Pick date...</span>}
                                        <CalendarIcon size={12} className="text-zinc-400" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl z-[100]" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={chequeDate ? parseLocalDate(chequeDate) : undefined}
                                        onSelect={(d) => {
                                          if (d) {
                                            setChequeDate(formatLocalDate(d));
                                            setChequeDateOpen(false);
                                          }
                                        }}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </TechLabel>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>

                      <TechLabel label="Firm / Entity" icon={Layout}>
                        <Select value={selectedFirmId} onValueChange={setSelectedFirmId}>
                          <SelectTrigger className={`h-10 w-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold text-[10px] ${PREMIUM_ROUNDING_MD}`}>
                            <SelectValue placeholder="Select Firm..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="0">--- No Firm ---</SelectItem>
                            {firms?.map(firm => (
                              <SelectItem key={firm.id} value={firm.id.toString()} className="text-xs">{firm.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TechLabel>

                      <TechLabel label="Communication" icon={Info}>
                        <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                          <SelectTrigger className={`h-10 w-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold text-[10px] ${PREMIUM_ROUNDING_MD}`}>
                            <SelectValue placeholder="Standard Remark..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="0">--- No Remark ---</SelectItem>
                            {messageLines?.map(msg => (
                              <SelectItem key={msg.id} value={msg.id.toString()} className="text-xs">{msg.messageline}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TechLabel>
                    </div>

                    <div className="pt-2">
                      <TechLabel label="Remarks / Narration">
                        <Input value={remarks} onChange={e => setRemarks(e.target.value)} className={`h-10 bg-white dark:bg-white/5 border-zinc-200 dark:border-zinc-700 text-xs ${PREMIUM_ROUNDING_MD}`} placeholder="Optional details..." />
                      </TechLabel>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 flex-shrink-0">
                    <Button variant="outline" onClick={() => window.history.back()} className={`flex-1 h-12 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest ${PREMIUM_ROUNDING_MD}`}>
                      Cancel
                    </Button>
                    <Button className={`flex-[2] h-12 ${t.gradient} hover:opacity-90 text-white font-black text-xs uppercase tracking-widest shadow-lg ${t.gradientShadow} transition-all active:scale-[0.98] ${PREMIUM_ROUNDING_MD}`}
                      onClick={handleUpdate} disabled={loading}>
                      <div className="flex items-center justify-center gap-2 relative z-10">
                        {loading ? <RotateCcw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        {loading ? "SAVING..." : "UPDATE VOUCHER"}
                      </div>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </main>

        {/* Invoice Item Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-2xl p-0 border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="flex justify-between items-center pr-6">
                <div>
                  <DialogTitle className="text-sm font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-500" />
                    Invoice #{selectedBillForDetail?.invoice_no}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    Date: {selectedBillForDetail ? fmtDate(selectedBillForDetail.date) : ''} | Type: {selectedBillForDetail?.bill_type_label}
                  </DialogDescription>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black text-zinc-400 uppercase">Net Amount</div>
                  <div className="text-sm font-mono font-black text-emerald-600">Rs {toNum(selectedBillForDetail?.net_total).toLocaleString()}</div>
                </div>
              </div>
            </DialogHeader>

            <div className="max-h-[50vh] overflow-auto p-4 custom-scrollbar">
              {billDetailLoading ? (
                <div className="py-12 text-center text-zinc-400 font-bold text-xs flex items-center justify-center gap-2">
                  <RotateCcw size={16} className="animate-spin" /> Loading Invoice Items...
                </div>
              ) : billItems.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No Line Items Found</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                      <th className="pb-2 text-left">Item Name</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Rate</th>
                      <th className="pb-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {billItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="py-2.5 font-bold text-zinc-800 dark:text-zinc-200">{item.item_name || item.description || '---'}</td>
                        <td className="py-2.5 text-center font-mono font-black">{item.qty || item.quantity || 1}</td>
                        <td className="py-2.5 text-right font-mono">Rs {toNum(item.rate || item.unit_price).toLocaleString()}</td>
                        <td className="py-2.5 text-right font-mono font-black text-emerald-600">Rs {toNum(item.subtotal || item.total || (item.qty * item.rate)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Customer Cheque Selector Modal */}
        <Dialog open={chequeSelectorOpen} onOpenChange={setChequeSelectorOpen}>
          <DialogContent className="sm:max-w-2xl p-0 border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <DialogTitle className="text-sm font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-100">Select Cheque In Hand</DialogTitle>
              <DialogDescription className="sr-only">Choose a cheque received from customers that is currently in hand</DialogDescription>
              <div className="pt-2">
                <Input placeholder="SEARCH CHEQUE NO OR CUSTOMER..." value={chequeSearch} onChange={e => setChequeSearch(e.target.value)} className={`h-10 text-xs font-mono uppercase bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
              </div>
            </DialogHeader>

            <div className="max-h-[50vh] overflow-auto p-2 custom-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Cheque #</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-center">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {filteredCustomerCheques.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-zinc-400 font-bold text-[10px] uppercase tracking-widest italic">No matching cheques found</td>
                    </tr>
                  ) : (
                    filteredCustomerCheques.map((chq: any) => (
                      <tr 
                        key={chq.id} 
                        onClick={() => handleChequeSelect(chq)}
                        className={`group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all rounded-lg overflow-hidden ${originalChequeId === chq.id.toString() || splitPayments.some(p => p.original_cheque_id === chq.id.toString()) ? 'bg-zinc-50 dark:bg-zinc-900' : ''}`}
                      >
                        <td className="px-4 py-3 text-[11px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:pl-5 transition-all">{chq.customer_name}</td>
                        <td className="px-4 py-3 text-[11px] font-mono font-black text-zinc-500">{chq.cheque_no}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-[11px] font-mono font-black ${t.text}`}>Rs {toNum(chq.amount).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-[10px] font-mono text-zinc-400 font-bold uppercase">{fmtDate(chq.cheque_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center text-[9px] font-black uppercase text-zinc-400 tracking-widest">
              <span>Total Available: {customerCheques.length}</span>
              <span>Matched: {filteredCustomerCheques.length}</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── PREMIUM SUCCESS DIALOG ON UPDATE ── */}
        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent className="sm:max-w-[450px] p-0 border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-[2rem] overflow-hidden">
            <div className={`relative h-56 ${t.gradient} flex flex-col items-center justify-center text-white p-8 text-center overflow-hidden`}>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
              />
              <motion.div 
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
              />

              <div className="relative z-10 flex flex-col items-center">
                <div className="flex gap-3 mb-6">
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                    className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30"
                  >
                    <CheckCircle2 size={32} className="text-white drop-shadow-md" />
                  </motion.div>
                </div>
                
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-black tracking-tight mb-2"
                >
                  Voucher Updated Successfully!
                </motion.h2>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.8 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-medium tracking-wide uppercase opacity-80"
                >
                  Voucher No: {successData?.voucherNo || payment.voucher_no || '---'}
                </motion.p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Ledger Account</span>
                  <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter leading-none">
                    {successData?.partyName || "General Party"}
                  </h3>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Settlement Amount</span>
                  <div className={`text-2xl font-mono font-black ${t.text} items-center flex gap-1 justify-end leading-none`}>
                    <span className="text-xs opacity-50 font-bold">Rs</span>
                    {successData?.amount?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 text-center flex flex-col items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Invoices</span>
                  <span className="text-xl font-black text-zinc-800 dark:text-zinc-100 font-mono leading-none">{successData?.invoicesCount || 0}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 text-center flex flex-col items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Method</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase leading-none truncate w-full pt-1">
                    {successData?.method || "Cash"}
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 text-center flex flex-col items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Total Adj</span>
                  <span className="text-lg font-black text-zinc-800 dark:text-zinc-100 font-mono leading-none">{successData?.discount?.toLocaleString() || '0'}</span>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-xs font-black text-emerald-600/60 uppercase tracking-widest">Total Discount</span>
                <div className="text-lg font-mono font-black text-emerald-600 flex items-center gap-1">
                  <span className="text-[10px] font-bold">Rs</span>
                  {successData?.discount?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button 
                  onClick={() => handleDirectPrint('small')}
                  variant="outline" 
                  className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-white font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group"
                >
                  <Receipt size={18} className="text-zinc-500 group-hover:scale-110 transition-transform" />
                  Thermal Print
                </Button>
                
                <Button 
                  onClick={() => handleDirectPrint('big')}
                  className={`h-14 rounded-2xl ${t.gradient} text-white font-black uppercase text-[10px] tracking-widest gap-2 hover:opacity-90 shadow-xl ${t.gradientShadow} active:scale-[0.98] transition-all`}
                >
                  <Layout size={18} />
                  A4 Print
                </Button>

                <Button 
                  onClick={() => {
                    const printId = successData?.printId || payment.id;
                    if (printId) {
                      window.open(`/payments/${printId}/view`, '_blank');
                    } else {
                      toast.error("Voucher ID not found. Please check reports.");
                    }
                  }}
                  variant="outline" 
                  className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group"
                >
                  <FileText size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                  View Voucher
                </Button>

                <Button 
                  onClick={() => {
                     setSuccessDialogOpen(false);
                     router.visit('/payment');
                  }} 
                  variant="outline"
                  className="h-14 border-orange-200 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-orange-50 dark:hover:bg-orange-500/10"
                >
                  <ArrowLeft size={18} />
                  Back To List
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${t.scrollbarHover}; }
        `}</style>
      </SidebarInset>
    </SidebarProvider>
  );
}
