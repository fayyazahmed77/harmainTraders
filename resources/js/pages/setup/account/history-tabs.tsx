import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRightLeft, CreditCard, Receipt, FileText, CheckCircle2, XCircle, Clock, FileDigit } from "lucide-react";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

// Utils
const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
    }).format(amount);
};

// --- Generic Paginator ---
const Paginator = ({ meta, onPageChange }: { meta: any, onPageChange: (p: number) => void }) => {
    if (!meta || meta.last_page <= 1) return null;
    return (
        <div className="flex items-center justify-between px-2 pt-4 border-t mt-4">
            <div className="text-sm text-muted-foreground">
                Showing page {meta.current_page} of {meta.last_page} ({meta.total} records)
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page === 1}
                    onClick={() => onPageChange(meta.current_page - 1)}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page === meta.last_page}
                    onClick={() => onPageChange(meta.current_page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

// --- Sales Tab ---
export const SalesHistoryTab = ({ accountId }: { accountId: number }) => {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        axios.get(`/account/${accountId}/history/sales?page=${page}`).then((res) => {
            setData(res.data.data);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
            });
            setLoading(false);
        });
    }, [accountId, page]);

    if (loading && data.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <Card className="shadow-none border border-muted">
            <CardHeader className="py-4 bg-muted/20 border-b">
                <CardTitle className="text-md flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-blue-500" />
                    Sales History
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/10">
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Gross</TableHead>
                            <TableHead>Net Total</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Remaining</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground italic">No sales found.</TableCell></TableRow>
                        ) : data.map((item: any) => (
                            <TableRow key={item.id} className="cursor-pointer hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                                <TableCell className="text-primary font-semibold">{item.invoice}</TableCell>
                                <TableCell>{formatCurrency(item.gross_total)}</TableCell>
                                <TableCell className="font-bold">{formatCurrency(item.net_total)}</TableCell>
                                <TableCell className="text-green-600">{formatCurrency(item.paid_amount)}</TableCell>
                                <TableCell>
                                    {Number(item.remaining_amount) > 0 ? (
                                        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                                            {formatCurrency(item.remaining_amount)}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 border">Paid</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="px-4 pb-4"><Paginator meta={meta} onPageChange={setPage} /></div>
            </CardContent>
        </Card>
    );
};

// --- Purchases Tab ---
export const PurchasesHistoryTab = ({ accountId }: { accountId: number }) => {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        axios.get(`/account/${accountId}/history/purchases?page=${page}`).then((res) => {
            setData(res.data.data);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
            });
            setLoading(false);
        });
    }, [accountId, page]);

    if (loading && data.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <Card className="shadow-none border border-muted">
            <CardHeader className="py-4 bg-muted/20 border-b">
                <CardTitle className="text-md flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-purple-500" />
                    Purchase History
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/10">
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Net Total</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Remaining</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground italic">No purchases found.</TableCell></TableRow>
                        ) : data.map((item: any) => (
                            <TableRow key={item.id} className="cursor-pointer hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                                <TableCell className="text-primary font-semibold">{item.invoice}</TableCell>
                                <TableCell className="font-bold">{formatCurrency(item.net_total)}</TableCell>
                                <TableCell className="text-blue-600">{formatCurrency(item.paid_amount)}</TableCell>
                                <TableCell>
                                    {Number(item.remaining_amount) > 0 ? (
                                        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 border">
                                            {formatCurrency(item.remaining_amount)}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 border">Paid</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="px-4 pb-4"><Paginator meta={meta} onPageChange={setPage} /></div>
            </CardContent>
        </Card>
    );
};

// --- Payments & Unpaid Bills Ledger ---
export const PaymentsLedgerTab = ({ accountId, accountType }: { accountId: number, accountType: string }) => {
    const [data, setData] = useState([]);
    const [unpaidBills, setUnpaidBills] = useState([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        axios.get(`/account/${accountId}/history/payments?page=${page}`).then((res) => {
            setData(res.data.data);
            setUnpaidBills(res.data.unpaid_bills || []);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
            });
            setLoading(false);
        });
    }, [accountId, page]);

    if (loading && data.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Box: History of Payments */}
            <Card className="shadow-none border border-muted flex flex-col h-full">
                <CardHeader className="py-4 bg-muted/20 border-b">
                    <CardTitle className="text-md flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-emerald-500" />
                        Complete Payment Ledger
                    </CardTitle>
                    <CardDescription className="text-xs">History of all receipts and payments made.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/10">
                                <TableHead>Date</TableHead>
                                <TableHead>Voucher</TableHead>
                                <TableHead>Method/Bank</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground italic">No payment transactions found.</TableCell></TableRow>
                            ) : data.map((item: any) => (
                                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/30">
                                    <TableCell className="text-xs whitespace-nowrap">{formatDate(item.date)}</TableCell>
                                    <TableCell className="text-xs font-semibold text-primary">{item.voucher_no}</TableCell>
                                    <TableCell className="text-xs">
                                        {item.payment_method}
                                        {item.cheque_no ? ` : ${item.cheque_no}` : ''}
                                        {item.payment_account ? ` (${item.payment_account.title})` : ''}
                                    </TableCell>
                                    <TableCell>
                                        {(item.payment_method === 'Cheque' || item.payment_method === 'Online') && item.cheque_status ? (
                                            <Badge variant="outline" className={`text-[10px] 
                                                ${item.cheque_status === 'Cleared' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                ${item.cheque_status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                ${item.cheque_status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            `}>
                                                {item.cheque_status}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200">Done</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-xs text-green-600">
                                        {item.type === 'RECEIPT' ? '+' : '-'}{formatCurrency(item.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-auto px-4 pb-4"><Paginator meta={meta} onPageChange={setPage} /></div>
                </CardContent>
            </Card>

            {/* Right Box: Outstanding Bills */}
            <Card className="shadow-none border border-muted flex flex-col h-[500px]">
                <CardHeader className="py-4 bg-red-50/50 border-b">
                    <CardTitle className="text-md flex items-center justify-between text-red-700">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Outstanding Unpaid {accountType === 'Customers' ? 'Invoices' : 'Bills'}
                        </div>
                        <Badge variant="destructive" className="bg-red-600">
                            {unpaidBills.length} Pending
                        </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">History of all unpaid bills.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-auto flex-1 h-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/10 sticky top-0 bg-white">
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead className="text-right">Balance Due</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {unpaidBills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic h-full flex items-center justify-center">
                                       <div className="flex flex-col items-center gap-2">
                                           <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                                           <p>All bills are settled.</p>
                                       </div>
                                    </TableCell>
                                </TableRow>
                            ) : unpaidBills.map((bill: any) => (
                                <TableRow key={bill.id} className="hover:bg-red-50/30">
                                    <TableCell className="text-xs">{formatDate(bill.date)}</TableCell>
                                    <TableCell className="text-xs font-semibold">{bill.invoice}</TableCell>
                                    <TableCell className="text-right font-bold text-red-600 text-xs">
                                        {formatCurrency(bill.remaining_amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                {unpaidBills.length > 0 && (
                     <div className="p-3 border-t bg-muted/10 flex justify-between items-center text-sm font-bold">
                         <span>Total Outstanding:</span>
                         <span className="text-red-700">
                             {formatCurrency(unpaidBills.reduce((acc, curr: any) => acc + Number(curr.remaining_amount), 0))}
                         </span>
                     </div>
                )}
            </Card>
        </div>
    );
};

import { cn } from "@/lib/utils";

// --- Bank Statement Tab ---
export const BankStatementTab = ({ accountId, accountType }: { accountId: number, accountType?: string }) => {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        axios.get(`/account/${accountId}/history/bank-statement?page=${page}`).then((res) => {
            setData(res.data.data);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
            });
            setLoading(false);
        });
    }, [accountId, page]);

    if (loading && data.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <Card className="shadow-none border border-muted">
            <CardHeader className="py-4 bg-muted/20 border-b">
                <CardTitle className="text-md flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    {accountType === 'Cheque in hand' ? 'Cheque IN/OUT Ledger' : 'Deep Banking/Cash Ledger'}
                </CardTitle>
                <CardDescription className="text-xs">Incoming and Outgoing flow record from this account.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/10">
                            <TableHead>Date</TableHead>
                            <TableHead>Ref / Voucher</TableHead>
                            <TableHead>Party / Dest.</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right text-green-700">Credit (IN)</TableHead>
                            <TableHead className="text-right text-red-700">Debit (OUT)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground italic">No transactions found.</TableCell></TableRow>
                        ) : data.map((item: any) => {
                            const isCanceled = item.cheque_status?.toLowerCase().includes('cancel');
                            return (
                                <TableRow key={item.id} className={cn("cursor-pointer transition-colors", isCanceled ? "bg-red-50/70 hover:bg-red-100/70" : "hover:bg-muted/30")}>
                                    <TableCell className={cn("text-xs whitespace-nowrap", isCanceled && "text-red-700/80")}>{formatDate(item.date)}</TableCell>
                                    <TableCell className={cn("text-xs font-semibold", isCanceled ? "text-red-700/80 line-through" : "text-primary")}>{item.voucher_no}</TableCell>
                                    <TableCell className={cn("text-xs max-w-[200px] truncate", isCanceled && "text-red-700/80")}>{item.account?.title || 'Unknown'}</TableCell>
                                    <TableCell className={cn("text-xs", isCanceled && "text-red-700/80")}>
                                        {item.payment_method}
                                        {item.cheque_no ? ` : ${item.cheque_no}` : ''}
                                    </TableCell>
                                    <TableCell>
                                        {(item.payment_method === 'Cheque' || item.payment_method === 'Online') && item.cheque_status ? (
                                            <Badge variant="outline" className={`text-[10px] 
                                                ${item.cheque_status === 'Cleared' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                ${item.cheque_status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                ${isCanceled ? 'bg-red-100 text-red-800 border-red-300 font-bold' : ''}
                                            `}>
                                                {item.cheque_status}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200">Cleared</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className={cn("text-right font-bold text-xs", 
                                        isCanceled ? "text-red-400 line-through" : "text-green-600 bg-green-50/10"
                                    )}>
                                        {item.type === 'RECEIPT' ? formatCurrency(item.amount) : '-'}
                                    </TableCell>
                                    <TableCell className={cn("text-right font-bold text-xs", 
                                        isCanceled ? "text-red-400 line-through" : "text-red-600 bg-red-50/10"
                                    )}>
                                        {item.type === 'PAYMENT' ? formatCurrency(item.amount) : '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <div className="px-4 pb-4"><Paginator meta={meta} onPageChange={setPage} /></div>
            </CardContent>
        </Card>
    );
};

// --- Issued Cheques Tab ---
export const ChequesTab = ({ accountId }: { accountId: number }) => {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        axios.get(`/account/${accountId}/history/cheques?page=${page}`).then((res) => {
            setData(res.data.data);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
            });
            setLoading(false);
        });
    }, [accountId, page]);

    if (loading && data.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <Card className="shadow-none border border-muted">
            <CardHeader className="py-4 bg-muted/20 border-b">
                <CardTitle className="text-md flex items-center gap-2">
                    <FileDigit className="h-4 w-4 text-emerald-500" />
                    Issued Cheques Register
                </CardTitle>
                <CardDescription className="text-xs">Detailed lifecycle of all cheques belonging to this bank.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/10">
                            <TableHead>Cheque No</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Party Name</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Cheque Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground italic">No cheques found.</TableCell></TableRow>
                        ) : data.map((item: any) => (
                            <TableRow key={item.id} className="cursor-pointer hover:bg-muted/30">
                                <TableCell className="font-semibold text-primary">{item.cheque_no}</TableCell>
                                <TableCell className="text-xs">{item.type}</TableCell>
                                <TableCell className="text-xs">{item.party_name}</TableCell>
                                <TableCell className="text-xs">{formatDate(item.issue_date)}</TableCell>
                                <TableCell className="text-xs font-semibold">{formatDate(item.cheque_date)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`text-[10px] 
                                        ${item.status === 'issued' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                        ${item.status === 'cleared' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                        ${item.status === 'cancelled' || item.status === 'bounced' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                        ${item.status === 'blank' || item.status === 'available' ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                                    `}>
                                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-xs">
                                     {item.amount > 0 ? formatCurrency(item.amount) : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="px-4 pb-4"><Paginator meta={meta} onPageChange={setPage} /></div>
            </CardContent>
        </Card>
    );
};
