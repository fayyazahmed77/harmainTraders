import * as React from "react";
import { Head, Link } from "@inertiajs/react";
import { 
    ArrowLeft, 
    FileText, 
    Download, 
    Calendar, 
    User, 
    Hash, 
    Receipt,
    CreditCard,
    CheckCircle2,
    CalendarDays,
    Info,
    History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface Props {
    account: any;
    payment: any;
    token: string;
}

export default function PaymentDetail({ account, payment, token }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const isCanceled = payment.cheque_status === 'Canceled';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center">
            <Head title={`Receipt ${payment.voucher_no}`} />

            {/* Header */}
            <header className="w-full max-w-2xl px-4 py-6 flex items-center justify-between sticky top-0 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
                <Link href={`/g/${token}`} className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 hover:text-orange-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="font-medium text-sm">Dashboard</span>
                </Link>
                
                <div className="text-center">
                    <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{account.title}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">{payment.voucher_no}</div>
                </div>

                <div className="w-10" aria-hidden="true" /> {/* Spacer */}
            </header>

            <main className="w-full max-w-2xl px-4 py-4 space-y-6 flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-white dark:bg-zinc-900 border-b pb-8 pt-8 flex flex-col items-center text-center">
                            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-full mb-4">
                                <Receipt className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl mb-1">Receipt Confirmation</CardTitle>
                            <div className="text-3xl font-black text-slate-900 dark:text-zinc-100 mb-4">
                                {formatCurrency(payment.amount)}
                            </div>
                            <Badge variant={isCanceled ? "destructive" : "default"} className={isCanceled ? "" : "bg-green-600"}>
                                {isCanceled ? "Canceled" : "Payment Received"}
                            </Badge>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Receipt Details */}
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                            <Hash className="h-3 w-3" /> Voucher No
                                        </div>
                                        <div className="font-semibold text-sm">{payment.voucher_no}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                            <CalendarDays className="h-3 w-3" /> Payment Date
                                        </div>
                                        <div className="font-semibold text-sm">{formatDate(payment.date)}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                            <CreditCard className="h-3 w-3" /> Method
                                        </div>
                                        <div className="font-semibold text-sm">{payment.payment_method}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                            <Info className="h-3 w-3" /> Status
                                        </div>
                                        <div className="font-semibold text-sm text-green-600">
                                            {payment.cheque_status || "Completed"}
                                        </div>
                                    </div>
                                </div>

                                {(payment.payment_method === 'Cheque' || payment.cheque_no) && (
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-lg border border-dashed space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cheque Info</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] text-muted-foreground uppercase">Cheque #</div>
                                                <div className="text-sm font-bold">{payment.cheque_no || "N/A"}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-muted-foreground uppercase">Cheque Date</div>
                                                <div className="text-sm font-bold">{payment.cheque_date ? formatDate(payment.cheque_date) : "N/A"}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1 pt-2">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Notes / Remarks</div>
                                    <div className="text-sm text-muted-foreground italic">
                                        {payment.remarks || "No additional remarks."}
                                    </div>
                                </div>
                            </div>

                            {/* Applied Bills */}
                            {payment.allocations && payment.allocations.length > 0 && (
                                <div className="bg-slate-50 dark:bg-zinc-900/50 border-t p-6 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                                        <History className="h-4 w-4" /> Bill Settlement
                                    </h4>
                                    <div className="space-y-3">
                                        {payment.allocations.map((alloc: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-sm bg-white dark:bg-zinc-900 p-3 rounded-lg border shadow-sm">
                                                <div className="space-y-0.5">
                                                    <div className="font-bold">{alloc.bill?.invoice || "Bill Adjustment"}</div>
                                                    <div className="text-[10px] text-muted-foreground">{alloc.bill_type.split('\\').pop()}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-green-600">{formatCurrency(alloc.amount)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Download Action */}
                            <div className="p-6 pt-0">
                                <a href={`/g/${token}/receipt/${payment.voucher_no}/pdf`} target="_blank">
                                    <Button className="w-full h-11 bg-orange-600 hover:bg-orange-700 font-bold gap-2">
                                        <Download className="h-5 w-5" /> Download Payment Slip
                                    </Button>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>

            <footer className="w-full max-w-2xl px-4 py-8 text-center space-y-4">
                <Separator />
                <div className="flex flex-col items-center gap-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Harnain Traders</div>
                    <div className="text-xs text-muted-foreground italic">Thank you for your business!</div>
                </div>
            </footer>
        </div>
    );
}
