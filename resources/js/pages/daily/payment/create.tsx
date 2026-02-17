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

export default function PaymentVoucher({ accounts, paymentAccounts, messageLines }: Props) {
  // State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
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
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={[{ title: "Payment Voucher", href: "/payment/create" }]} />

        <div className="w-full p-4 space-y-4">
          {/* Header Form */}
          <Card className="p-4 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2">
              <Label>Entry Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="col-span-3 flex flex-col">
              <div className="flex justify-between">
                <Label>Party (Customer/Supplier)</Label>
                <div className="flex gap-2 text-xs font-bold">
                  {advanceBalance > 0 && (
                    <div className="text-orange-600 bg-orange-50 px-1 border border-orange-200 rounded">
                      Adv: {Number(advanceBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  <div className={currentBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                    Bal: {Number(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {balanceOrientation.toUpperCase()}
                  </div>
                </div>
              </div>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Party" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>{acc.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <Label>P-Type</Label>
              <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIPT">IN</SelectItem>
                  <SelectItem value="PAYMENT">OUT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <Label>Description</Label>
              <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks..." />
            </div>

            <div className="col-span-3">
              <Label>Message Line</Label>
              <Select value={selectedMessageId} onValueChange={setSelectedMessageId}>
                <SelectTrigger className="w-full bg-sky-50/50">
                  <SelectValue placeholder="Optional Message" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Message Line (Optional)</SelectItem>
                  {messageLines?.map(msg => (
                    <SelectItem key={msg.id} value={msg.id.toString()}>{msg.messageline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-4 ">
            <div className="col-span-9">
              {/* Unpaid Bills Table */}
              <Card className="p-0 gap-1 overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-12  p-2 text-xs font-semibold border-b items-center">
                  <div className="col-span-2 flex items-left justify-left">
                    <Checkbox
                      className="mr-2"
                      checked={unpaidBills.length > 0 && selectedBillIds.size === unpaidBills.length}
                      onCheckedChange={toggleAll}
                    />
                    <Label>Invoice #</Label>
                  </div>
                  <div className="col-span-1 border-l pl-2">Type</div>
                  <div className="col-span-2 border-l pl-2">Date</div>
                  <div className="col-span-2 border-l pl-2 text-right">Net Total</div>
                  <div className="col-span-2 border-l pl-2 text-right">Remaining</div>
                  <div className="col-span-3 border-l pl-2 text-right pr-4">Allocating</div>
                </div>

                {/* Rows */}
                <div className="max-h-[400px] overflow-auto">
                  {unpaidBills.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Select a party to view unpaid bills</div>
                  ) : (
                    unpaidBills.map(bill => (
                      <div key={`${bill.type}-${bill.id}`} className="grid grid-cols-12 p-2 text-sm border-b items-center hover:bg-gray-50">
                        <div className="col-span-2 flex items-left justify-left">
                          <Checkbox
                            className="mr-2"
                            checked={selectedBillIds.has(bill.id.toString())}
                            onCheckedChange={() => toggleBill(bill.id, Number(bill.remaining_amount))}
                          />
                          {bill.invoice_no}
                        </div>

                        <div className="col-span-1 text-xs text-gray-500 truncate">{bill.bill_type_label}</div>
                        <div className="col-span-2 text-gray-600 text-xs">{bill.date}</div>
                        <div className="col-span-2 text-right text-xs">{Number(bill.net_total).toFixed(2)}</div>
                        <div className="col-span-2 text-right font-bold text-red-600">{Number(bill.remaining_amount).toFixed(2)}</div>
                        <div className="col-span-3 text-right pr-4">
                          {selectedBillIds.has(bill.id.toString()) && (
                            <Input
                              type="number"
                              className="h-7 text-right text-xs font-bold"
                              value={allocations[bill.id.toString()] || 0}
                              onChange={(e) => handleAllocationChange(bill.id.toString(), e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Summary Card */}
              <Card className="p-4 mt-2 ">
                <div className="flex justify-between items-center px-4">
                  <div className="text-sm text-gray-600">
                    Selected Bills: <span className="font-bold text-gray-900">{selectedBillIds.size}</span>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-sm">
                      Total Allocated: <span className="font-bold text-blue-600">{totalAllocated.toFixed(2)}</span>
                    </div>
                    {appliedFromAdvance > 0 && (
                      <div className="text-sm">
                        Applied from Advance: <span className="font-bold text-purple-600">{appliedFromAdvance.toFixed(2)}</span>
                      </div>
                    )}
                    {unallocatedAmount > 0 && (
                      <div className="text-sm">
                        New Advance/Unallocated: <span className="font-bold text-orange-600">{unallocatedAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Panel - Payment Info */}
            <div className="col-span-3">
              <Card className="p-4 space-y-3 sticky top-[120px] gap-0">
                <div>
                  <div className="text-xs font-semibold">Payment Account</div>
                  <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Accounts</SelectLabel>
                        {/* Ideally filter for Cash/Bank accounts here */}
                        {paymentAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id.toString()}>{acc.title}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method (Only for Bank) */}
                {paymentAccountId && paymentAccounts.find(a => a.id.toString() === paymentAccountId)?.account_type?.name === 'Bank' && (
                  <div>
                    <div className="text-xs font-semibold">Payment Method</div>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Cheque Details (Only if Method is Cheque) */}
                {paymentMethod === 'Cheque' && (
                  <>
                    <div>
                      <div className="text-xs font-semibold">Cheque #</div>
                      <Input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Cheque Date</div>
                      <Input value={chequeDate} onChange={e => setChequeDate(e.target.value)} type="date" />
                    </div>
                  </>
                )}

                {advanceBalance > 0 && (
                  <div className="flex items-center space-x-2 bg-orange-50 p-2 rounded border border-orange-100 mb-2">
                    <Checkbox
                      id="use-advance"
                      checked={useAdvance}
                      onCheckedChange={(checked: boolean) => handleUseAdvanceToggle(checked)}
                    />
                    <Label htmlFor="use-advance" className="text-xs font-bold text-orange-700 cursor-pointer">
                      Use Advance Balance ({advanceBalance.toFixed(2)})
                    </Label>
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-xs font-semibold">Total Amount Paid</div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="font-bold text-lg"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold">Discount</div>
                  <Input value={discount} onChange={e => setDiscount(Number(e.target.value))} placeholder="0.00" />
                </div>

                <div>
                  <div className="text-xs font-semibold">Net Paid</div>
                  <div className="text-xl font-bold text-green-600">{(amount - discount).toFixed(2)}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold">Clear Date</div>
                  <Input value={clearDate} onChange={e => setClearDate(e.target.value)} type="date" />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button className="w-full" onClick={handleSave} disabled={loading}>
                    {loading ? "Processing..." : (paymentType === 'RECEIPT' ? 'Receive Payment' : 'Make Payment')}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
