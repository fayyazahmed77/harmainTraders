import * as React from "react";
import { Head, Link } from "@inertiajs/react";
import { 
    ArrowLeft, 
    FileText, 
    Download, 
    Calendar, 
    User, 
    Hash, 
    ShoppingCart,
    Tag,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface Props {
    account: any;
    sale: any;
    token: string;
}

export default function OrderDetail({ account, sale, token }: Props) {
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

    const isPending = sale.status === 'Pending Order';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center">
            <Head title={`Invoice ${sale.invoice}`} />

            {/* Header */}
            <header className="w-full max-w-4xl px-4 py-6 flex items-center justify-between sticky top-0 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
                <Link href={`/g/${token}`} className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 hover:text-orange-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="font-medium text-sm">Dashboard</span>
                </Link>
                
                <div className="text-center">
                    <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{account.title}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">{sale.invoice}</div>
                </div>

                <div className="w-10" aria-hidden="true" /> {/* Spacer */}
            </header>

            <main className="w-full max-w-4xl px-4 py-4 space-y-6 flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-white dark:bg-zinc-900 border-b pb-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl">Invoice Details</CardTitle>
                                        <Badge 
                                            variant={isPending ? "outline" : "default"} 
                                            className={isPending ? "text-orange-600 border-orange-200 bg-orange-50" : "bg-green-600"}
                                        >
                                            {isPending ? (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Pending Confirmation
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> {sale.status}
                                                </span>
                                            )}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{formatDate(sale.date)}</p>
                                </div>
                                
                                <a href={`/g/${token}/invoice/${sale.invoice}/pdf`} target="_blank">
                                    <Button variant="default" className="w-full md:w-auto gap-2 bg-orange-600 hover:bg-orange-700">
                                        <Download className="h-4 w-4" /> Download Slip
                                    </Button>
                                </a>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Information Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x dark:divide-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                                <div className="p-4 space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Hash className="h-3 w-3" /> Invoice No
                                    </div>
                                    <div className="font-semibold text-sm">{sale.invoice}</div>
                                </div>
                                <div className="p-4 space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                        <User className="h-3 w-3" /> Salesperson
                                    </div>
                                    <div className="font-semibold text-sm">{sale.salesman?.name || "Self Order"}</div>
                                </div>
                                <div className="p-4 space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Tag className="h-3 w-3" /> Payment Condition
                                    </div>
                                    <div className="font-semibold text-sm">
                                        {sale.remaining_amount <= 0 ? (
                                            <span className="text-green-600 flex items-center gap-1">Fully Paid</span>
                                        ) : (
                                            <span className="text-orange-600 flex items-center gap-1">
                                                {sale.paid_amount > 0 ? "Partially Paid" : "Unpaid"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider border-y">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Product Details</th>
                                            <th className="px-6 py-3 text-center">Qty</th>
                                            <th className="px-6 py-3 text-right">Price</th>
                                            <th className="px-6 py-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-zinc-800">
                                        {sale.items?.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-zinc-100">{item.item?.title}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">{item.item?.code}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="font-bold">
                                                        {item.qty_carton > 0 && `${item.qty_carton} CTN`}
                                                        {item.qty_carton > 0 && item.qty_pcs > 0 && " + "}
                                                        {item.qty_pcs > 0 && `${item.qty_pcs} PCS`}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">({item.total_pcs} Units)</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-medium">{formatCurrency(item.trade_price)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-zinc-100">
                                                    {formatCurrency(item.subtotal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Totals */}
                            <div className="p-6 bg-slate-50 dark:bg-zinc-900/80 border-t flex flex-col items-end space-y-3">
                                <div className="w-full md:w-72 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Gross Total</span>
                                        <span className="font-medium">{formatCurrency(sale.gross_total)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span className="font-medium text-red-600">-{formatCurrency(sale.discount_total)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-lg font-bold">Net Payable</span>
                                        <span className="text-xl font-black text-slate-900 dark:text-zinc-100">
                                            {formatCurrency(sale.net_total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Returns Section (If any) */}
                {sale.returns && sale.returns.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3"
                    >
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Returns & Adjustments
                        </h3>
                        {sale.returns.map((ret: any, idx: number) => (
                            <Card key={idx} className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 shadow-none">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-sm">Return #{ret.invoice}</div>
                                        <div className="text-[10px] text-muted-foreground">{formatDate(ret.date)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-red-600">-{formatCurrency(ret.net_total)}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                )}
            </main>

            <footer className="w-full max-w-4xl px-4 py-8 text-center space-y-4">
                <Separator />
                <div className="flex flex-col items-center gap-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Harnain Traders</div>
                    <div className="text-xs text-muted-foreground italic">Thank you for choosing us!</div>
                </div>
            </footer>
        </div>
    );
}
