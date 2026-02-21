import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { router } from "@inertiajs/react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Plus, CalendarIcon, RotateCcw, FileText,
  Search, ChevronRight, Hash, User as UserIcon,
  ArrowRightLeft, BadgePercent, Calculator, Package, Info, CheckCircle2,
  Navigation, Clock, Terminal, Scale, Hash as HashIcon, ArrowUpRight, ArrowDownLeft,
  CreditCard
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ───────────────────────────────────────────
// Style Constants (Perfect UI Aesthetic)
// ───────────────────────────────────────────
const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const MONO_FONT = "font-mono tracking-tighter";

const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-500 to-rose-500";
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
  remaining_amount: number;
  bill_type_label: string;
}

interface MessageLine {
  id: number;
  messageline: string;
}

interface Props {
  accounts: Account[];
  paymentAccounts: PaymentAccount[];
  messageLines?: MessageLine[];
}

const toNum = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

const fmtDate = (d: string) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PaymentVoucher({ accounts, paymentAccounts, messageLines }: Props) {
  // State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accountSearch, setAccountSearch] = useState("");
  const [mobileAccOpen, setMobileAccOpen] = useState(false);
  const [desktopAccOpen, setDesktopAccOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const [paymentAccountId, setPaymentAccountId] = useState<string>(""); // Cash/Bank
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [balanceOrientation, setBalanceOrientation] = useState<string>("dr");
  const [advanceBalance, setAdvanceBalance] = useState<number>(0);
  const [useAdvance, setUseAdvance] = useState<boolean>(false);
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [allocations, setAllocations] = useState<Record<string, number>>({}); // {billId: amount}

  const [amount, setAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [chequeNo, setChequeNo] = useState<string>("");
  const [chequeDate, setChequeDate] = useState<string>("");
  const [clearDate, setClearDate] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"RECEIPT" | "PAYMENT">("RECEIPT");
  const [paymentMethod, setPaymentMethod] = useState<string>(""); // Online Transfer, Card, Cheque
  const [selectedMessageId, setSelectedMessageId] = useState<string>("0");

  // Bill Detail Modal State
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<Bill | null>(null);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [billDetailLoading, setBillDetailLoading] = useState(false);

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

  const fetchBillDetail = (bill: Bill) => {
    setSelectedBillForDetail(bill);
    setDetailDialogOpen(true);
    setBillDetailLoading(true);
    axios.get(`/payment/bill-items?bill_id=${bill.id}&bill_type=${bill.type}`)
      .then(res => setBillItems(res.data))
      .catch(console.error)
      .finally(() => setBillDetailLoading(false));
  };

  // Fetch unpaid bills when account changes
  useEffect(() => {
    if (selectedAccountId) {
      // Auto-select payment type based on account type
      const selectedAccount = accounts.find(acc => acc.id.toString() === selectedAccountId);
      if (selectedAccount) {
        // If account type is 'Customers', set to RECEIPT (IN)
        // If account type is 'Supplier', set to PAYMENT (OUT)
        const accountTypeName = (selectedAccount as any).account_type?.name;
        if (accountTypeName === 'Customers') {
          setPaymentType('RECEIPT');
        } else if (accountTypeName === 'Supplier') {
          setPaymentType('PAYMENT');
        }
      }

      axios.get(`/payment/unpaid-bills?account_id=${selectedAccountId}`)
        .then(res => {
          setUnpaidBills(res.data.bills || []);
          setCurrentBalance(res.data.current_balance || 0);
          setBalanceOrientation(res.data.orientation || "dr");
          setAdvanceBalance(res.data.advance_amount || 0);
          setUseAdvance(false);
          setSelectedBillIds(new Set()); // Reset selection
          setAllocations({}); // Reset allocations
          setAmount(0); // Reset amount
        })
        .catch(err => console.error("Failed to fetch bills", err));
    } else {
      setUnpaidBills([]);
    }
  }, [selectedAccountId, accounts]);

  // Handle Payment Account Change
  useEffect(() => {
    if (paymentAccountId) {
      const account = paymentAccounts.find(a => a.id.toString() === paymentAccountId);

      if (account && account.account_type?.name === 'Bank') {
        // It's a bank, wait for user to select payment method
        setPaymentMethod("");
        setChequeNo("");
        setChequeDate("");
      } else {
        // Cash or other
        setPaymentMethod("");
        setChequeNo("");
        setChequeDate("");
      }
    } else {
      setPaymentMethod("");
      setChequeNo("");
      setChequeDate("");
    }
  }, [paymentAccountId]);

  // Handle Payment Method Change
  useEffect(() => {
    if (paymentMethod === 'Cheque' && paymentAccountId) {
      axios.get(`/payment/next-cheque?account_id=${paymentAccountId}`)
        .then(res => {
          if (res.data) {
            const { prefix, cheque_no } = res.data;
            setChequeNo(prefix ? `${prefix}-${cheque_no}` : cheque_no);
          } else {
            setChequeNo('');
          }
        })
        .catch(err => console.error("Failed to fetch cheque", err));
    } else {
      setChequeNo('');
      setChequeDate('');
    }
  }, [paymentMethod, paymentAccountId]);

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

    // Auto-update total amount
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

  const handleUseAdvanceToggle = (checked: boolean) => {
    setUseAdvance(checked);
    if (checked) {
      setAmount(prev => Math.max(0, prev - advanceBalance));
    } else {
      setAmount(prev => prev + advanceBalance);
    }
  };

  const handleAllocationChange = (billId: string, value: string) => {
    const amountVal = Number(value);
    const bill = unpaidBills.find(b => b.id.toString() === billId);
    if (!bill) return;

    // Optional: Clamp to remaining amount? User might want to pay more (overpayment), 
    // but usually allocations are restricted to the bill's balance.
    const clampedAmount = Math.min(amountVal, bill.remaining_amount);

    const newAllocations = { ...allocations, [billId]: clampedAmount };
    setAllocations(newAllocations);

    // We don't automatically update the master 'amount' (Total Paid) here 
    // because the user might be trying to fit allocations into a pre-entered total.
    // But for better UX, maybe we should update if they haven't explicitly set a total?
    // Let's keep Total Paid and Total Allocated separate for flexibility.
  };

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0);
  }, [allocations]);

  const appliedFromAdvance = useMemo(() => {
    const netPaid = amount - discount;
    // If allocations > netPaid, the difference is coming from existing advance
    return Math.max(0, totalAllocated - netPaid);
  }, [amount, discount, totalAllocated]);

  const unallocatedAmount = useMemo(() => {
    const netPaid = amount - discount;
    // If netPaid > allocations, the surplus becomes new advance
    return Math.max(0, netPaid - totalAllocated);
  }, [amount, discount, totalAllocated]);

  const [loading, setLoading] = useState(false);

  // Handle Save
  const handleSave = () => {
    if (loading) return;
    setLoading(true);

    // Prepare allocations
    const allocationPayload = unpaidBills
      .filter(b => selectedBillIds.has(b.id.toString()))
      .map(b => ({
        bill_id: b.id,
        bill_type: b.type,
        amount: allocations[b.id.toString()] || 0
      }))
      .filter(a => a.amount > 0);

    const payload = {
      date,
      account_id: selectedAccountId,
      payment_account_id: paymentAccountId,
      amount,
      discount,
      net_amount: amount - discount, // Logic can be adjusted
      type: paymentType,
      cheque_no: chequeNo,
      cheque_date: chequeDate,
      clear_date: clearDate,
      remarks,
      payment_method: paymentMethod,
      message_line_id: selectedMessageId !== "0" ? Number(selectedMessageId) : null,
      allocations: allocationPayload
    };

    router.post('/payment/store', payload, {
      onFinish: () => setLoading(false)
    });
  };

  return (
    <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "16rem", "--header-height": "3.5rem" } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col h-screen">
        <SiteHeader breadcrumbs={[{ title: "Payment Ledger", href: "/payment/create" }]} />

        <main className="flex-1 overflow-auto md:overflow-hidden p-3 md:p-6 flex flex-col md:flex-row gap-6 scroll-smooth">

          {/* ── WORKSPACE ── */}
          <div className="flex-1 flex flex-col gap-4 md:gap-6 md:overflow-hidden">

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
                    <div className="text-[9px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest">Ref Code</div>
                    <div className="text-sm font-black text-orange-600 font-mono tracking-tighter uppercase">#{selectedAccountId || '---'}</div>
                  </div>
                </div>

                <TechLabel label="Ledger Party" icon={UserIcon}>
                  <Popover open={mobileAccOpen} onOpenChange={setMobileAccOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-black text-sm text-left uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500 shadow-sm`}>
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
                          <button key={acc.id} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-orange-500"
                            onClick={() => handleAccountSelect(acc.id)}>
                            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-orange-500 flex-shrink-0" />
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
                <div className={`absolute top-0 left-0 w-1.5 h-full ${ACCENT_GRADIENT}`} />

                <div className="col-span-3">
                  <TechLabel label="Entry Date" icon={CalendarIcon}>
                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500`}>
                          {fmtDate(date)}
                          <CalendarIcon size={14} className="text-zinc-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                        <Calendar mode="single" selected={new Date(date)} onSelect={(d) => { if (d) { setDate(d.toISOString().split('T')[0]); setCalOpen(false); } }} />
                      </PopoverContent>
                    </Popover>
                  </TechLabel>
                </div>

                <div className="col-span-5">
                  <TechLabel label="Ledger Party" icon={UserIcon}>
                    <Popover open={desktopAccOpen} onOpenChange={setDesktopAccOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-black text-sm text-left truncate uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500`}>
                          {selectedAccountId ? accounts.find(a => a.id.toString() === selectedAccountId)?.title : "Select Party Account..."}
                          <Search size={14} className="text-zinc-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0 border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                          <Input placeholder="SEARCH PARTY..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className={`h-9 text-xs font-mono uppercase border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`} />
                        </div>
                        <div className="max-h-64 overflow-auto py-1">
                          {filteredAccounts.map(acc => (
                            <button key={acc.id} className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors flex items-center gap-2 group border-l-2 border-transparent hover:border-orange-500"
                              onClick={() => handleAccountSelect(acc.id)}>
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-orange-500" />
                              {acc.title}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TechLabel>
                </div>

                <div className="col-span-4 flex items-end gap-3">
                  <div className="flex-1">
                    <TechLabel label="Payout Routing" icon={Navigation}>
                      <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                        <SelectTrigger className={`h-10 ${PREMIUM_ROUNDING_MD} bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold text-xs`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="RECEIPT">INCOME (IN/CR)</SelectItem>
                          <SelectItem value="PAYMENT">EXPENSE (OUT/DR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TechLabel>
                  </div>
                  <div className="w-20">
                    <TechLabel label="Ref" icon={Hash}>
                      <div className="h-10 flex items-center justify-center font-mono text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md">#{selectedAccountId || '---'}</div>
                    </TechLabel>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Ledger Manifest (The Workhorse) */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 min-h-0 flex flex-col md:overflow-hidden">
              <Card className={`flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden ${PREMIUM_ROUNDING}`}>
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
                        <th className="px-4 py-3 text-right border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400">Remaining</th>
                        <th className="px-4 py-3 text-right border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-40">Allocation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      {unpaidBills.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-24 text-center">
                            <div className="flex flex-col items-center gap-3 opacity-20">
                              <Package size={48} className="text-zinc-400" />
                              <div className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Workspace Vacant</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        unpaidBills.map((bill, idx) => (
                          <motion.tr key={`${bill.type}-${bill.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                            className={`group hover:bg-orange-50/30 dark:hover:bg-orange-500/5 transition-colors cursor-default ${selectedBillIds.has(bill.id.toString()) ? 'bg-orange-500/5' : ''}`}>
                            <td className="p-4 border-b border-zinc-50/50 dark:border-zinc-800/30">
                              <Checkbox checked={selectedBillIds.has(bill.id.toString())} onCheckedChange={() => toggleBill(bill.id, Number(bill.remaining_amount))} className="border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-orange-500" />
                            </td>
                            <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30">
                              <button onClick={() => fetchBillDetail(bill)} className="text-xs font-black text-orange-600 dark:text-orange-500 hover:underline uppercase tracking-tighter flex items-center gap-1.5 group/btn">
                                <FileText size={12} className="opacity-50" />
                                {bill.invoice_no}
                                <ArrowUpRight size={10} className="opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-1 group-hover/btn:translate-x-0" />
                              </button>
                            </td>
                            <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30">
                               <SignalBadge text={bill.bill_type_label} type={bill.bill_type_label === 'Sales' ? 'blue' : 'orange'} />
                            </td>
                            <td className="px-4 py-3 border-b border-zinc-50/50 dark:border-zinc-800/30 text-[11px] font-mono text-zinc-500 font-bold uppercase tracking-tighter">
                              {fmtDate(bill.date)}
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
                                      className={`h-8 text-right font-mono font-black text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-2 focus-visible:ring-orange-500 ${PREMIUM_ROUNDING_MD}`}
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
                <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-3 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
                  <div className="flex gap-4">
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Selected Entries</div>
                      <div className="text-xs font-mono font-black text-zinc-800 dark:text-zinc-200">{selectedBillIds.size} / {unpaidBills.length}</div>
                    </div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 self-center" />
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Total Outstanding</div>
                      <div className="text-xs font-mono font-black text-zinc-500">Rs {unpaidBills.reduce((s, b) => s + toNum(b.remaining_amount), 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {appliedFromAdvance > 0 && (
                      <div className={`px-3 py-1.5 bg-purple-500/5 border border-purple-500/20 ${PREMIUM_ROUNDING_MD} flex items-center gap-3 animate-in fade-in slide-in-from-right-2`}>
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
                        <div className="text-xl font-mono font-black text-orange-600 dark:text-orange-500 tracking-tighter">
                          Rs {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className={`w-10 h-10 ${ACCENT_GRADIENT} ${PREMIUM_ROUNDING_MD} flex items-center justify-center text-white shadow-lg shadow-orange-500/20`}>
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
            
            {/* Executive Summary Card */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-shrink-0">
              <Card className={`p-5 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING} relative overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-none`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4 relative z-10">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${ACCENT_GRADIENT}`} />
                      <h3 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-[0.2em]">Liquidity Command</h3>
                   </div>
                   <SignalBadge text={paymentType} type={paymentType === 'RECEIPT' ? 'green' : 'red'} />
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-end gap-4">
                    <div className="flex-1">
                      <TechLabel label="Primary Disbursement" icon={ArrowRightLeft}>
                         <div className="relative">
                           <Input type="number" value={amount || ""} onChange={e => setAmount(toNum(e.target.value))}
                            className={`h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-black text-2xl tracking-tighter px-4 ${PREMIUM_ROUNDING_MD} focus-visible:ring-orange-500 shadow-inner`} />
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
                        <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-500">Rs {(amount - discount).toLocaleString()}</div>
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

                        {paymentAccountId && paymentAccounts.find(a => a.id.toString() === paymentAccountId)?.account_type?.name === 'Bank' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2 pt-2">
                             <TechLabel label="Bank Method" icon={Navigation}>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                   <SelectTrigger className={`h-9 w-full bg-white dark:bg-zinc-800 border-orange-200 dark:border-orange-500/20 font-bold text-[10px] ${PREMIUM_ROUNDING_MD}`}>
                                      <SelectValue placeholder="Select Method..." />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-xl text-xs">
                                      <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                                      <SelectItem value="Card">Card Payment</SelectItem>
                                      <SelectItem value="Cheque">Cheque Release</SelectItem>
                                   </SelectContent>
                                </Select>
                             </TechLabel>
                             {paymentMethod === 'Cheque' && (
                                <div className="grid grid-cols-2 gap-2 pt-1 animate-in slide-in-from-top-2">
                                  <TechLabel label="Cheque No">
                                     <Input value={chequeNo} onChange={e => setChequeNo(e.target.value)} className={`h-9 font-mono text-xs ${PREMIUM_ROUNDING_MD}`} placeholder="CHQ#" />
                                  </TechLabel>
                                  <TechLabel label="Chq Date">
                                     <Input value={chequeDate} onChange={e => setChequeDate(e.target.value)} type="date" className={`h-9 text-[10px] ${PREMIUM_ROUNDING_MD} p-2`} />
                                  </TechLabel>
                                </div>
                             )}
                          </motion.div>
                        )}
                     </div>

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

                  <div className="pt-4">
                    <Button className={`w-full h-14 ${ACCENT_GRADIENT} hover:opacity-90 text-white font-black text-lg uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] ${PREMIUM_ROUNDING}`}
                      onClick={handleSave} disabled={loading}>
                      <motion.div className="flex items-center justify-center gap-2 relative z-10" animate={loading ? { opacity: 0.5 } : {}}>
                        {loading ? <RotateCcw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {loading ? "PROCESSING..." : (paymentType === 'RECEIPT' ? "EXECUTE INCOME" : "EXECUTE EXPENSE")}
                      </motion.div>
                    </Button>
                    <div className="flex flex-col items-center gap-1 mt-4">
                       <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-center leading-relaxed">System Verification Pending <br /> {new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Account Insight Card */}
            {selectedAccountId && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                 <Card className={`${CARD_BASE} p-5 ${PREMIUM_ROUNDING_MD} overflow-hidden shadow-lg shadow-zinc-200/50 dark:shadow-none`}>
                    <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                       <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                       <h4 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest leading-none pt-0.5">Financial Auditor</h4>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-500 font-bold">Ledger Balance</span>
                          <span className={`font-black font-mono ${currentBalance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>Rs {Math.abs(currentBalance).toLocaleString()} {balanceOrientation.toUpperCase()}</span>
                       </div>
                       <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-500 font-bold text-[10px]">Unused Advance</span>
                          <span className="font-black font-mono text-zinc-800 dark:text-zinc-200">Rs {toNum(advanceBalance).toLocaleString()}</span>
                       </div>
                       
                       <div className={`p-3 bg-zinc-50 dark:bg-zinc-900/50 ${PREMIUM_ROUNDING_MD} border border-zinc-100 dark:border-zinc-800`}>
                          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Contextual Analysis</div>
                          <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                             "Liquidity event detected for account #{selectedAccountId}. Current coverage ratio is {(amount / Math.max(1, currentBalance)).toFixed(2)}x against net exposure."
                          </p>
                       </div>
                    </div>
                 </Card>
              </motion.div>
            )}
          </div>
        </main>

        {/* Mobile Sticky Footer */}
        <div className="md:hidden sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-4 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.1)] transition-transform duration-300">
            <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex flex-col">
                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-wider mb-0.5">Net Disbursement</div>
                    <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none tracking-tighter">
                        <span className="text-sm font-bold mr-1 font-mono">Rs</span>
                        {(amount - discount).toLocaleString()}
                    </div>
                </div>
                <Button onClick={handleSave} className="h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 rounded-xl font-black text-sm uppercase tracking-wider transition-all active:scale-95" disabled={loading}>
                    {loading ? <RotateCcw size={16} className="mr-2 animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />}
                    {loading ? "..." : (paymentType === 'RECEIPT' ? "RECEIVE" : "PAY")}
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-zinc-400 font-bold">Allocated</span>
                    <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">Rs {totalAllocated.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center border-l border-zinc-100 dark:border-zinc-800">
                    <span className="text-[9px] uppercase text-zinc-400 font-bold">Unallocated</span>
                    <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">Rs {unallocatedAmount.toLocaleString()}</span>
                </div>
            </div>
        </div>

        {/* Bill Detail Modal */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className={`max-w-2xl ${PREMIUM_ROUNDING} border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden shadow-2xl`}>
            <DialogHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.4em]">Registry Analysis</span>
                  <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">
                    {selectedBillForDetail?.invoice_no || "Source Document"}
                  </DialogTitle>
                </div>
                <div className="text-right">
                  <SignalBadge text={selectedBillForDetail?.bill_type_label || "Unknown"} type="blue" />
                </div>
              </div>
            </DialogHeader>

            <DialogDescription className="sr-only">
              Itemized breakdown of the selected source document.
            </DialogDescription>

            <AnimatePresence mode="wait">
              {billDetailLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-20 flex flex-col items-center gap-4 text-zinc-400">
                  <RotateCcw className="w-8 h-8 animate-spin" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Scanning Repository...</span>
                </motion.div>
              ) : (
                <motion.div key="content" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={14} className="text-zinc-400" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Document Items</span>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {billItems.length === 0 ? (
                      <div className="py-20 text-center text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] italic">No transaction metadata available</div>
                    ) : (
                      billItems.map((item, idx) => (
                        <div key={idx} className={`flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:border-orange-500/30 transition-all ${PREMIUM_ROUNDING_MD}`}>
                          <div className="space-y-1">
                            <span className="block text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">{item.title}</span>
                            <span className="text-[10px] font-mono font-bold text-zinc-400">Rate: Rs {toNum(item.rate).toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-mono font-black text-zinc-900 dark:text-white">x{item.qty}</span>
                            <span className="text-xs font-mono font-black text-orange-600 dark:text-orange-500">Rs {toNum(item.subtotal).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Adjusted Net Total</span>
                    <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">
                      <span className="text-sm opacity-50 mr-2">Rs</span>
                      {toNum(selectedBillForDetail?.net_total).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
        `}</style>
      </SidebarInset>
    </SidebarProvider>
  );
}
