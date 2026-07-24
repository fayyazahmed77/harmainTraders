import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbItem } from "@/types";
import {
    ArrowLeftIcon,
    PrinterIcon,
    DownloadIcon,
    Receipt,
    Info,
    CheckCircle,
    Clock,
    Calendar,
    User,
    Building,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PurchaseItem {
    id: number;
    item_id: number;
    qty_carton: number;
    qty_pcs: number;
    total_pcs: number;
    trade_price: number;
    discount: number;
    gst_amount: number;
    subtotal: number;
    item: {
        id: number;
        title: string;
        code?: string;
        packing_qty?: number;
        retail?: number;
    };
}

interface Purchase {
    id: number;
    date: string;
    invoice: string;
    code?: string;
    supplier?: { id: number; title: string; current_balance?: number };
    salesman?: { id: number; name: string };
    firm?: { id: number; name: string };
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    extra_discount?: number;
    tax_total?: number;
    courier_charges?: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    message_line?: { id: number; messageline: string } | null;
    items: PurchaseItem[];
    created_at?: string;
}

interface Props {
    purchase: Purchase;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/" },
    { title: "Purchases", href: "/purchase" },
    { title: "Bill Details", href: "#" },
];

export default function View({ purchase }: Props) {
    const fmt = (amount: number) =>
        new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 2 })
            .format(amount).replace("PKR", "").trim();

    const fmtDate = (d: string | null | undefined) => {
        if (!d) return "N/A";
        const dt = new Date(d + "T00:00:00");
        return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    const fmtDateTime = (d: string | null | undefined) => {
        if (!d) return "N/A";
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        const date = dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        const time = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        return `${date} ${time}`;
    };

    const netTotal = Number(purchase.net_total || 0);
    const extraDiscount = Number(purchase.extra_discount || 0);
    const invoiceTotal = Math.max(0, netTotal - extraDiscount);
    const paid = Number(purchase.paid_amount || 0);
    const supplierBal = Number(purchase.supplier?.current_balance || 0);
    const prevBal = supplierBal - invoiceTotal + paid;
    const netBal = invoiceTotal + prevBal - paid;
    const remaining = Math.max(0, invoiceTotal - paid);

    const badge = remaining === 0
        ? { label: "Fully Paid", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300" }
        : paid > 0
            ? { label: "Partial Paid", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300" }
            : { label: "Unpaid", cls: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300" };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/20">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6 space-y-4 print:p-0">

                    {/* HEADER */}
                    <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 print:hidden">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.history.back()}
                                className="h-9 w-9 md:h-10 md:w-10 rounded-xl shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl md:text-2xl font-black tracking-tight text-black dark:text-white flex items-center gap-2">
                                    Purchase Bill <span className="font-mono text-primary bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded-lg text-lg md:text-xl border border-primary/10">{purchase.invoice}</span>
                                </h1>
                                <Badge className={cn("px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border flex items-center gap-1.5 shadow-none", badge.cls)}>
                                    <CheckCircle className="h-3 w-3" /> {badge.label}
                                </Badge>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Mobile 3-dot */}
                            <div className="md:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                                            <MoreVertical className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                                        <DropdownMenuItem onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=small`, "_blank")} className="cursor-pointer gap-2.5 text-xs font-bold py-2.5">
                                            <PrinterIcon className="h-4 w-4 text-orange-500" /> Print Small
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=big`, "_blank")} className="cursor-pointer gap-2.5 text-xs font-bold py-2.5">
                                            <PrinterIcon className="h-4 w-4 text-blue-500" /> Print Large
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => (window.location.href = `/purchase/${purchase.id}/download`)} className="cursor-pointer gap-2.5 text-xs font-bold py-2.5">
                                            <DownloadIcon className="h-4 w-4 text-emerald-500" /> Download PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Laptop compact */}
                            <div className="hidden md:flex lg:hidden items-center gap-1.5">
                                <Button variant="outline" onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=small`, "_blank")}
                                    className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-1.5">
                                    <PrinterIcon className="h-3.5 w-3.5 text-orange-500" /> Print Small
                                </Button>
                                <Button variant="outline" onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=big`, "_blank")}
                                    className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-1.5">
                                    <PrinterIcon className="h-3.5 w-3.5 text-blue-500" /> Print Large
                                </Button>
                                <Button variant="outline" onClick={() => (window.location.href = `/purchase/${purchase.id}/download`)}
                                    className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-1.5">
                                    <DownloadIcon className="h-3.5 w-3.5 text-emerald-500" /> Download PDF
                                </Button>
                            </div>

                            {/* Desktop full */}
                            <div className="hidden lg:flex items-center gap-2">
                                <Button variant="outline" onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=small`, "_blank")}
                                    className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-2">
                                    <PrinterIcon className="h-4 w-4 text-orange-500" /> Print Small
                                </Button>
                                <Button variant="outline" onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=big`, "_blank")}
                                    className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-2">
                                    <PrinterIcon className="h-4 w-4 text-blue-500" /> Print Large
                                </Button>
                                <Button variant="outline" onClick={() => (window.location.href = `/purchase/${purchase.id}/download`)}
                                    className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm flex items-center gap-2">
                                    <DownloadIcon className="h-4 w-4 text-emerald-500" /> Download PDF
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* INFO STRIP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 px-1 py-3 border-b border-zinc-200 dark:border-zinc-800 text-xs print:hidden">
                        {/* Left */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Supplier:</span>
                                <span className="text-black dark:text-white font-black uppercase">{purchase.supplier?.title || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Receipt className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Invoice #:</span>
                                <span className="text-orange-500 font-mono font-black">{purchase.invoice}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Invoice Date:</span>
                                <span className="text-black dark:text-white font-mono font-bold">{fmtDate(purchase.date)}</span>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Created At:</span>
                                <span className="text-black dark:text-white font-mono font-bold">
                                    {purchase.created_at ? fmtDateTime(purchase.created_at) : fmtDate(purchase.date)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Agent:</span>
                                <span className="text-black dark:text-white font-black uppercase">{purchase.salesman?.name || "Direct"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                <span className="text-black dark:text-white font-extrabold min-w-[80px]">Firm:</span>
                                <span className="text-black dark:text-white font-black uppercase">{purchase.firm?.name || "Haramain Traders"}</span>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="space-y-1">
                        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 py-0 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="px-6 py-1 pt-3 pb-0 bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Receipt className="h-5 w-5 text-primary" />
                                        <div>
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-200">Purchase Items Manifest</CardTitle>
                                            <CardDescription className="text-[10px] text-zinc-500 font-mono">Detailed manifest of products and transaction row totals</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-mono border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-none">PID_{purchase.id}</Badge>
                                </div>
                            </CardHeader>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse table-auto">
                                    <thead>
                                        <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                                            <th rowSpan={2} className="px-6 py-3 text-left align-middle border-b border-zinc-200 dark:border-zinc-800">#</th>
                                            <th rowSpan={2} className="px-3 py-3 text-left align-middle border-b border-zinc-200 dark:border-zinc-800">Description of Goods</th>
                                            <th colSpan={2} className="px-3 py-1.5 text-center border-b border-zinc-200 dark:border-zinc-800">Quantity</th>
                                            <th rowSpan={2} className="px-4 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">Retail</th>
                                            <th rowSpan={2} className="px-4 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">Rate</th>
                                            <th rowSpan={2} className="px-4 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">Disc %</th>
                                            <th rowSpan={2} className="px-4 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">After Discount</th>
                                            <th rowSpan={2} className="px-6 py-3 text-right align-middle border-b border-zinc-200 dark:border-zinc-800">Net Amount</th>
                                        </tr>
                                        <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                                            <th className="px-3 py-1.5 text-center border-r border-zinc-200 dark:border-zinc-800">Box</th>
                                            <th className="px-3 py-1.5 text-center">Pcs</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                                        {purchase.items.map((it, idx) => {
                                            const sg = Number(it.subtotal || 0);
                                            const dp = sg > 0 ? (Number(it.discount || 0) / sg) * 100 : 0;
                                            const adr = Number(it.trade_price || 0) * (1 - dp / 100);
                                            return (
                                                <tr key={it.id} className="group transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 border-l-2 border-transparent text-xs">
                                                    <td className="px-6 py-3.5 text-zinc-400 font-mono">{idx + 1}</td>
                                                    <td className="px-3 py-3.5">
                                                        <p className="font-bold text-zinc-900 dark:text-zinc-200 uppercase truncate max-w-[300px]">{it.item?.title}</p>
                                                        <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono mt-0.5 font-bold">Code: {it.item?.code || "N/A"} • Pk: {it.item?.packing_qty || 1}</p>
                                                    </td>
                                                    <td className="px-3 py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/40">{it.qty_carton}</td>
                                                    <td className="px-3 py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">{it.qty_pcs}</td>
                                                    <td className="px-4 py-3.5 text-right font-mono text-zinc-700 dark:text-zinc-300">{it.item?.retail ? fmt(it.item.retail) : "0.00"}</td>
                                                    <td className="px-4 py-3.5 text-right font-mono text-zinc-700 dark:text-zinc-300">{fmt(it.trade_price)}</td>
                                                    <td className="px-4 py-3.5 text-right font-mono text-rose-500">{dp > 0 ? dp.toFixed(2) : "0.00"}</td>
                                                    <td className="px-4 py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(adr)}</td>
                                                    <td className="px-6 py-3.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">{fmt(it.subtotal - it.discount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-zinc-50/50 dark:bg-zinc-950/20 font-black text-xs border-t border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <td colSpan={2} className="px-6 py-3.5 text-zinc-500">Total</td>
                                            <td className="px-3 py-3.5 text-center font-mono text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">{purchase.items.reduce((a, i) => a + Number(i.qty_carton || 0), 0)}</td>
                                            <td className="px-3 py-3.5 text-center font-mono text-zinc-900 dark:text-zinc-100">{purchase.items.reduce((a, i) => a + Number(i.qty_pcs || 0), 0)}</td>
                                            <td></td>
                                            <td></td>
                                            <td className="px-4 py-3.5 text-right text-rose-500 font-mono">-{fmt(purchase.items.reduce((a, i) => a + Number(i.discount || 0), 0))}</td>
                                            <td></td>
                                            <td className="px-6 py-3.5 text-right text-orange-500 font-mono">{fmt(purchase.items.reduce((a, i) => a + (Number(i.subtotal || 0) - Number(i.discount || 0)), 0))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    {/* Left */}
                                    <div className="space-y-12">
                                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-bold text-sm">
                                            <span>Total # Of Items:</span>
                                            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-black">{purchase.items.length}</span>
                                        </div>
                                        <div className="pt-4">
                                            <div className="w-48 border-b border-zinc-300 dark:border-zinc-700"></div>
                                            <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-black mt-2">Check By Name & Time</p>
                                        </div>
                                    </div>

                                    {/* Right */}
                                    <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold">
                                        <div className="flex justify-between items-center">
                                            <span>Courier Charges :-</span>
                                            <span className="font-mono text-zinc-800 dark:text-zinc-200">{fmt(purchase.courier_charges ?? 0)}</span>
                                        </div>
                                        {extraDiscount > 0 && (
                                            <div className="flex justify-between items-center text-rose-500">
                                                <span>Extra Discount :-</span>
                                                <span className="font-mono font-bold">-{fmt(extraDiscount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                            <span>Total Rs. :-</span>
                                            <span className="font-mono">{fmt(invoiceTotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Previous Balance :-</span>
                                            <span className={cn("font-mono font-bold", prevBal > 0 ? "text-rose-500" : prevBal < 0 ? "text-emerald-500" : "text-zinc-500")}>
                                                {prevBal < 0 ? "-" : ""}{fmt(Math.abs(prevBal))}
                                            </span>
                                        </div>
                                        <div className="w-full border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
                                        <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                            <span>Total Balance :-</span>
                                            <span className="font-mono text-orange-500">{fmt(invoiceTotal + prevBal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                                            <span>Cash Paid :-</span>
                                            <span className="font-mono font-black">{fmt(purchase.paid_amount)}</span>
                                        </div>
                                        <div className="w-full border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
                                        <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                            <span>Total Outstanding :</span>
                                            <span className={cn("font-mono font-black text-base", netBal > 0 ? "text-rose-600" : "text-emerald-600")}>
                                                {fmt(netBal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {purchase.message_line?.messageline && (
                            <Card className="bg-orange-500/[0.02] border border-orange-500/10 shadow-sm rounded-xl p-5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block mb-2 flex items-center gap-1.5">
                                    <Info className="h-4 w-4" /> Message Line / Special Notice
                                </span>
                                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 italic uppercase">"{purchase.message_line.messageline}"</p>
                            </Card>
                        )}
                    </div>

                    <div className="hidden print:flex flex-col items-center justify-center border-t border-zinc-200 pt-6 mt-12 text-center text-xs text-zinc-400 font-mono">
                        <p className="font-bold uppercase tracking-wider">Haramain Traders Wholesale & Supply Chain</p>
                        <p className="mt-1">Generated dynamically on {new Date().toLocaleString()}</p>
                    </div>

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
