import React, { useState, useEffect, useMemo } from "react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePage, router, Head } from "@inertiajs/react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon, RotateCcw, FileText,
  Search, Hash, User as UserIcon,
  ArrowRightLeft, BadgePercent, Calculator, Package, Info, CheckCircle2,
  Navigation, Clock, Scale, CreditCard, Layout
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

const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";

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
  type: string;
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
  const { errors } = usePage().props as any;

  // Sync validation errors
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      Object.values(errors).forEach((err: any) => toast.error(err));
    }
  }, [errors]);

  // Form State
  const [date, setDate] = useState<string>(payment.date);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(payment.account_id.toString());
  const [paymentAccountId, setPaymentAccountId] = useState<string>(payment.payment_account_id?.toString() ?? "");
  const [paymentType, setPaymentType] = useState<"RECEIPT" | "PAYMENT">(payment.type);
  const [amount, setAmount] = useState<number>(toNum(payment.net_amount || payment.amount));
  const [discount, setDiscount] = useState<number>(toNum(payment.discount || 0));
  const [paymentMethod, setPaymentMethod] = useState<string>(payment.payment_method || "Cash");
  const [chequeNo, setChequeNo] = useState<string>(payment.cheque_no || "");
  const [chequeDate, setChequeDate] = useState<string>(payment.cheque_date || "");
  const [clearDate, setClearDate] = useState<string>(payment.clear_date || "");
  const [remarks, setRemarks] = useState<string>(payment.remarks || "");
  const [selectedFirmId, setSelectedFirmId] = useState<string>(payment.firm_id?.toString() ?? "0");
  const [selectedMessageId, setSelectedMessageId] = useState<string>(payment.message_line_id?.toString() ?? "0");
  const [originalChequeId, setOriginalChequeId] = useState<string>(payment.cheque_id?.toString() ?? "");

  // Search Party popup states
  const [accountSearch, setAccountSearch] = useState("");
  const [mobileAccOpen, setMobileAccOpen] = useState(false);
  const [desktopAccOpen, setDesktopAccOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  // Financial HUD States
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [balanceOrientation, setBalanceOrientation] = useState<string>("dr");
  const [advanceBalance, setAdvanceBalance] = useState<number>(0);
  const [useAdvance, setUseAdvance] = useState<boolean>(false);
  const [totalSalesPurchases, setTotalSalesPurchases] = useState<number>(0);
  const [totalReceivedPaid, setTotalReceivedPaid] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);

  // Registry / Unpaid Bills States
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Dynamic Theme Colors
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
    };
  }, [paymentType]);

  // Cheque list from Bank Accounts or Customer Cheques
  const [availableCheques, setAvailableCheques] = useState<Record<string, string[]>>({});
  const [customerCheques, setCustomerCheques] = useState<any[]>([]);
  const [chequeSelectorOpen, setChequeSelectorOpen] = useState(false);
  const [chequeSearch, setChequeSearch] = useState("");

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

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    if (!accountSearch) return accounts;
    return accounts.filter(acc => acc.title.toLowerCase().includes(accountSearch.toLowerCase()));
  }, [accounts, accountSearch]);

  const handleAccountSelect = (id: number) => {
    setSelectedAccountId(id.toString());
    setMobileAccOpen(false);
    setDesktopAccOpen(false);
  };

  // Filtered Customer Cheques
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
    setOriginalChequeId(chq.id.toString());
    setChequeNo(chq.cheque_no);
    setChequeDate(chq.cheque_date);
    setClearDate(chq.clear_date || "");
    setAmount(toNum(chq.amount));
    setChequeSelectorOpen(false);
    setChequeSearch("");
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

  // Handle Payment Method Change
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

  // Fetch available cheques
  useEffect(() => {
    if (paymentAccountId) {
      fetchAvailableCheques(paymentAccountId);
    }
  }, [paymentAccountId]);

  // Handle Bill Selection
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

  // Select All
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

  const appliedFromAdvance = useMemo(() => {
    const netPaid = amount - discount;
    return Math.max(0, totalAllocated - netPaid);
  }, [amount, discount, totalAllocated]);

  const unallocatedAmount = useMemo(() => {
    const netPaid = amount - discount;
    return Math.max(0, netPaid - totalAllocated);
  }, [amount, discount, totalAllocated]);

  const [loading, setLoading] = useState(false);

  // Handle Update
  const handleUpdate = () => {
    if (loading) return;

    if (!selectedAccountId) {
      toast.error("Please select a Ledger Party.");
      return;
    }

    if (!paymentAccountId) {
      toast.error("Please select a Payout Source (Cash/Bank) before confirming.");
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

    const payload = {
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

    setLoading(true);
    router.put(`/payments/${payment.id}`, payload, {
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

        <main className="flex-1 overflow-auto md:overflow-hidden p-3 md:p-6 flex flex-col md:flex-row gap-6 scroll-smooth">

          {/* ── WORKSPACE ── */}
          <div className="flex-1 flex flex-col gap-4 md:gap-6 md:overflow-hidden">

            {/* Mobile Header (Control Deck) */}
            <div className="md:hidden space-y-3">
              <Card className={`p-4 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING} space-y-4 shadow-lg`}>
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
              <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING} grid grid-cols-12 gap-6 items-end relative overflow-hidden`}>
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
                    <Dialog open={desktopAccOpen} onOpenChange={setDesktopAccOpen}>
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
                          <div className="pt-2">
                            <Input placeholder="SEARCH PARTY..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-10 text-xs font-mono uppercase bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
                          </div>
                        </DialogHeader>
                        <div className="max-h-[50vh] overflow-auto py-2 px-2">
                          {filteredAccounts.map(acc => (
                            <button key={acc.id} className={`w-full text-left px-3 py-2 rounded-md mb-1 text-xs font-bold uppercase tracking-widest ${t.bgHover} transition-colors flex flex-col group border border-transparent ${t.borderHoverAlpha}`}
                              onClick={() => handleAccountSelect(acc.id)}>
                              <div className="flex justify-between items-center w-full mb-1 border-b border-zinc-100 dark:border-zinc-800/50 pb-1">
                                <span className="font-mono text-[9px] text-zinc-400 font-bold group-hover:text-zinc-600 transition-colors">Party ID: {acc.id}</span>
                                <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded-full">{acc.type}</span>
                              </div>
                              <span className="truncate group-hover:translate-x-1 transition-transform">{acc.title}</span>
                            </button>
                          ))}
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

            {/* Ledger Manifest */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 min-h-0 flex flex-col md:overflow-hidden">
              <Card className={`flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden ${PREMIUM_ROUNDING}`}>
                {/* Table Header/Toolbar */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 px-4 h-12 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Scale size={14} className="text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Registry Manifest</span>
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
                              <div className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Workspace Vacant</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        unpaidBills.map((bill, idx) => (
                          <tr key={`${bill.type}-${bill.id}`}
                            className={`group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20 transition-colors cursor-default ${selectedBillIds.has(bill.id.toString()) ? t.blob : ''}`}>
                            <td className="p-4 border-b border-zinc-50/50 dark:border-zinc-800/30">
                              <Checkbox checked={selectedBillIds.has(bill.id.toString())} onCheckedChange={() => toggleBill(bill.id, Number(bill.remaining_amount))} className={`border-zinc-300 dark:border-zinc-700 ${t.checkboxChecked}`} />
                            </td>
                            <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30">
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter flex items-center gap-1.5">
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Summary Bar */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-3 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
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
                    {appliedFromAdvance > 0 && (
                      <div className={`px-3 py-1.5 bg-purple-500/5 border border-purple-500/20 ${PREMIUM_ROUNDING_MD} flex items-center gap-3 animate-in fade-in`}>
                        <RotateCcw size={14} className="text-purple-500" />
                        <div className="space-y-0.5">
                          <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Apply Advance</div>
                          <div className="text-xs font-mono font-black text-purple-600 dark:text-purple-400">- {appliedFromAdvance.toLocaleString()}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Effective Payout</div>
                        <div className={`text-xl font-mono font-black ${t.text} tracking-tighter`}>
                          Rs {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className={`w-10 h-10 ${t.gradient} ${PREMIUM_ROUNDING_MD} flex items-center justify-center text-white shadow-lg ${t.gradientShadow}`}>
                        <Calculator size={20} className="opacity-80" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── FINANCIAL HUD (Right Sidebar) ── */}
          <div className="w-full md:w-[380px] space-y-4 md:space-y-6 flex flex-col md:overflow-hidden">

            {/* Account Insight Card */}
            {selectedAccountId && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-shrink-0">
                <Card className={`${CARD_BASE} p-5 ${PREMIUM_ROUNDING_MD} overflow-hidden shadow-lg`}>
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                    <h4 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest leading-none pt-0.5">Financial Auditor</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500 font-bold">
                        {paymentType === 'RECEIPT' ? "Total Sales" : "Total Purchases"}
                      </span>
                      <span className="font-black font-mono text-zinc-800 dark:text-zinc-200">
                        Rs {totalSalesPurchases.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500 font-bold">
                        {paymentType === 'RECEIPT' ? "Total Received" : "Total Paid"}
                      </span>
                      <span className="font-black font-mono text-zinc-800 dark:text-zinc-200">
                        Rs {totalReceivedPaid.toLocaleString()}
                      </span>
                    </div>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                          {paymentType === 'RECEIPT' ? "Receivable" : "Payable"} Balance
                        </span>
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 leading-none">
                          {currentBalance >= 0 ? "Outstanding Ledger" : "Paid in Advance"}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-lg font-mono font-black leading-none", currentBalance >= 0 ? "text-zinc-900 dark:text-white" : t.text)}>
                          PKR {Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                          {currentBalance >= 0 ? balanceOrientation.toUpperCase() : "ADVANCE"}
                        </span>
                      </div>
                    </div>

                    {advanceBalance > 0 && (
                      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5">
                          <Info size={12} className="text-purple-400" /> Use Unallocated Advance
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400">Rs {advanceBalance.toLocaleString()}</span>
                          <Switch checked={useAdvance} onCheckedChange={setUseAdvance} className="scale-75 data-[state=checked]:bg-purple-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Form Payout disbursement Deck */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-shrink-0">
              <Card className={`p-5 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING} relative overflow-hidden shadow-2xl`}>
                <div className={`absolute top-0 right-0 w-32 h-32 ${t.blob} rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none`} />

                <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${t.gradient}`} />
                    <h3 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-[0.2em]">Transaction Setup</h3>
                  </div>
                  <SignalBadge text={paymentType} type={paymentType === 'RECEIPT' ? 'green' : 'red'} />
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-end gap-4">
                    <div className="flex-1">
                      <TechLabel label="Primary Disbursement" icon={ArrowRightLeft}>
                        <div className="relative">
                          <Input type="number" value={amount || ""} onChange={e => setAmount(toNum(e.target.value))}
                            className={`h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-black text-2xl tracking-tighter px-4 ${PREMIUM_ROUNDING_MD} ${t.focusRing} shadow-inner`} />
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
                      <Input value={clearDate} onChange={e => setClearDate(e.target.value)} type="date" className={`h-10 bg-white dark:bg-white/5 border-zinc-200 dark:border-zinc-700 font-mono text-[10px] ${PREMIUM_ROUNDING_MD} p-2`} />
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
                        <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                          <SelectTrigger className={`h-10 w-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold text-xs ${PREMIUM_ROUNDING_MD}`}>
                            <SelectValue placeholder="Select Cash/Bank..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {paymentAccounts.map(acc => (
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
                                      onClick={() => setChequeSelectorOpen(true)}
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
                                <Input value={chequeDate} onChange={e => setChequeDate(e.target.value)} type="date" disabled={paymentAccounts.find(a => a.id.toString() === paymentAccountId)?.account_type?.name === 'CHEQUE IN HAND'} className={`h-9 text-[10px] ${PREMIUM_ROUNDING_MD} p-2`} />
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

                  <div className="pt-4 flex gap-3">
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

        {/* Customer Cheque Selector Modal */}
        <Dialog open={chequeSelectorOpen} onOpenChange={setChequeSelectorOpen}>
          <DialogContent className={`sm:max-w-xl w-full ${PREMIUM_ROUNDING} border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden shadow-2xl`}>
            <DialogHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <DialogTitle className="text-sm font-bold uppercase tracking-widest">Select Cheque In Hand</DialogTitle>
              <DialogDescription className="sr-only">Choose a cheque received from customers that is currently in hand</DialogDescription>
              <div className="pt-2">
                <Input placeholder="SEARCH CHEQUES..." value={chequeSearch} onChange={e => setChequeSearch(e.target.value)} className={`h-10 text-xs font-mono uppercase bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
              </div>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-auto py-2 px-2">
              {filteredCustomerCheques.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 font-black text-[10px] uppercase tracking-widest">No customer cheques in hand</div>
              ) : (
                filteredCustomerCheques.map(chq => (
                  <button key={chq.id} className={`w-full text-left px-3 py-3 rounded-md mb-1 text-xs font-bold uppercase tracking-widest ${t.bgHover} transition-colors flex flex-col group border border-transparent ${t.borderHoverAlpha}`}
                    onClick={() => handleChequeSelect(chq)}>
                    <div className="flex justify-between items-center w-full mb-1 pb-1 border-b border-zinc-100 dark:border-zinc-800/50">
                      <span className="font-mono text-[9px] text-zinc-400 font-bold">Chq No: {chq.cheque_no}</span>
                      <span className="text-[10px] font-mono font-black text-emerald-600">Rs {toNum(chq.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center w-full text-[10px] text-zinc-500">
                      <span className="truncate">From: {chq.customer_name}</span>
                      <span className="font-mono">{fmtDate(chq.cheque_date)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
