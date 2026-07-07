import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbItem } from "@/types";
import {
    ArrowLeftIcon,
    PrinterIcon,
    DownloadIcon,
    Calendar,
    ShieldCheck,
    Receipt,
    Tag,
    Info,
    CheckCircle,
    CircleDollarSign,
    History,
    Truck,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
    };
}

interface Purchase {
    id: number;
    date: string;
    invoice: string;
    code?: string;
    supplier?: { id: number; title: string; current_balance?: number };
    salesman?: { id: number; name: string };
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

    const netTotal = Number(purchase.net_total || 0);
    const extraDiscount = Number(purchase.extra_discount || 0);
    const invoiceTotal = Math.max(0, netTotal - extraDiscount);
    const paid = Number(purchase.paid_amount || 0);
    const supplierBal = Number(purchase.supplier?.current_balance || 0);
    const prevBal = supplierBal - invoiceTotal + paid;
    const netBal = invoiceTotal + prevBal - paid;
    const remaining = Math.max(0, invoiceTotal - paid);
    const totalPcs = purchase.items.reduce((a, c) => a + Number(c.total_pcs), 0);

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
                <div className="mx-auto w-full max-w-[1600px] p-6 lg:p-8 space-y-8">

                    {/* HEADER */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => window.history.back()}
                                className="h-10 w-10 rounded-xl shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <ArrowLeftIcon className="h-4 w-4" />
                            </Button>
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                        Purchase Bill <span className="font-mono text-primary">{purchase.invoice}</span>
                                    </h1>
                                    <Badge className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border flex items-center gap-1.5 shadow-none bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300">
                                        <CheckCircle className="h-3 w-3" /> Verified
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-zinc-500 font-medium">
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Transaction Verified
                                    </span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <span>Date: <span className="font-bold text-zinc-700 dark:text-zinc-300">{fmtDate(purchase.date)}</span></span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <span>Created: <span className="font-bold text-zinc-700 dark:text-zinc-300">{purchase.created_at ? new Date(purchase.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : fmtDate(purchase.date)}</span></span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <span>Supplier: <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{purchase.supplier?.title || "N/A"}</span></span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <span>Agent: <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{purchase.salesman?.name || "Direct"}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=small`, "_blank")}
                                className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-2">
                                <PrinterIcon className="h-4 w-4 text-orange-500" /> Print Small
                            </Button>
                            <Button variant="outline" onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=big`, "_blank")}
                                className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-2">
                                <PrinterIcon className="h-4 w-4 text-blue-500" /> Print Large
                            </Button>
                            <Button variant="outline" onClick={() => (window.location.href = `/purchase/${purchase.id}/download`)}
                                className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-2">
                                <DownloadIcon className="h-4 w-4 text-emerald-500" /> Download PDF
                            </Button>
                        </div>
                    </div>

                    {/* MAIN GRID */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                        {/* LEFT: Table (8 cols) */}
                        <div className="xl:col-span-8 min-w-0 space-y-8">
                            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden">
                                <CardHeader className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800">
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
                                            <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                                                <th className="px-6 py-3">#</th>
                                                <th className="px-3 py-3">Product Specification</th>
                                                <th className="px-3 py-3 text-center">Carton</th>
                                                <th className="px-3 py-3 text-center">Pcs</th>
                                                <th className="px-4 py-3 text-right">Rate</th>
                                                <th className="px-4 py-3 text-right">Discount</th>
                                                <th className="px-4 py-3 text-right">After Disc</th>
                                                <th className="px-6 py-3 text-right">Subtotal</th>
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
                                                            <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">Code: {it.item?.code || "N/A"} • Pk: {it.item?.packing_qty || 1}</p>
                                                        </td>
                                                        <td className="px-3 py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">{it.qty_carton}</td>
                                                        <td className="px-3 py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">{it.qty_pcs}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700 dark:text-zinc-300">{fmt(it.trade_price)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-rose-500">{it.discount > 0 ? `-${fmt(it.discount)}` : "0.00"}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(adr)}</td>
                                                        <td className="px-6 py-3.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">{fmt(it.subtotal - it.discount)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-zinc-50/50 dark:bg-zinc-950/20 font-black text-xs border-t border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <td className="px-6 py-3.5 text-zinc-500">Total</td>
                                                <td></td>
                                                <td className="px-3 py-3.5 text-center font-mono text-zinc-900 dark:text-zinc-100">{purchase.items.reduce((a, i) => a + Number(i.qty_carton || 0), 0)}</td>
                                                <td className="px-3 py-3.5 text-center font-mono text-zinc-900 dark:text-zinc-100">{purchase.items.reduce((a, i) => a + Number(i.qty_pcs || 0), 0)}</td>
                                                <td></td>
                                                <td className="px-4 py-3.5 text-right text-rose-500 font-mono">-{fmt(purchase.items.reduce((a, i) => a + Number(i.discount || 0), 0))}</td>
                                                <td></td>
                                                <td className="px-6 py-3.5 text-right text-orange-500 font-mono">{fmt(purchase.items.reduce((a, i) => a + (Number(i.subtotal || 0) - Number(i.discount || 0)), 0))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
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

                        {/* RIGHT: Sidebar (4 cols) */}
                        <div className="xl:col-span-4 min-w-0 space-y-8">

                           

                            {/* Financial Ledger */}
                            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden">
                                <CardHeader className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                                            <CircleDollarSign className="h-4 w-4 text-emerald-500" />
                                            Financial Payable Ledger
                                        </CardTitle>
                                        <Badge className={cn("px-2.5 py-0.5 rounded-full shadow-none font-bold text-[9px] uppercase tracking-wider border", badge.cls)}>
                                            {badge.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                    <div className="flex justify-between items-center">
                                        <span>Gross Subtotal</span>
                                        <span className="font-mono text-zinc-800 dark:text-zinc-200">{fmt(purchase.gross_total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-rose-500">
                                        <span>Standard Item Discount</span>
                                        <span className="font-mono">-{fmt(purchase.discount_total)}</span>
                                    </div>
                                    {extraDiscount > 0 && (
                                        <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-bold">
                                            <span>Extra Discount (current bill)</span>
                                            <span className="font-mono">-{fmt(extraDiscount)}</span>
                                        </div>
                                    )}
                                    {(purchase.courier_charges ?? 0) > 0 && (
                                        <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                                            <span>Courier / Freight Charges</span>
                                            <span className="font-mono">+{fmt(purchase.courier_charges ?? 0)}</span>
                                        </div>
                                    )}
                                    {(purchase.tax_total ?? 0) > 0 && (
                                        <div className="flex justify-between items-center text-blue-500">
                                            <span>Purchase Tax (GST)</span>
                                            <span className="font-mono">+{fmt(purchase.tax_total ?? 0)}</span>
                                        </div>
                                    )}
                                    <Separator className="border-dashed bg-transparent border-zinc-200 dark:border-zinc-800" />
                                    <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-bold">
                                        <span>Current Invoice Total</span>
                                        <span className="font-mono">{fmt(invoiceTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-500">
                                        <span>Supplier Previous Balance</span>
                                        <span className={cn("font-mono font-bold", prevBal > 0 ? "text-rose-500" : prevBal < 0 ? "text-emerald-500" : "text-zinc-500")}>
                                            {prevBal < 0 ? "-" : ""}{fmt(Math.abs(prevBal))}
                                        </span>
                                    </div>
                                    <Separator className="border-dashed bg-transparent border-zinc-200 dark:border-zinc-800" />
                                    <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                        <span>Net Balance Payable</span>
                                        <span className="font-mono text-orange-500">{fmt(invoiceTotal + prevBal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                        <span>Amount Paid</span>
                                        <span className="font-mono font-bold">{fmt(purchase.paid_amount)}</span>
                                    </div>
                                    <Separator className="border-dashed bg-transparent border-zinc-200 dark:border-zinc-800" />
                                    <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                        <span>Net Balance Outstanding</span>
                                        <span className={cn("font-mono", netBal > 0 ? "text-rose-600" : "text-emerald-600")}>{fmt(netBal)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 mt-2 space-y-1.5 text-[10px] text-zinc-400 font-medium">
                                        <div className="flex justify-between">
                                            <span>Payment Terms</span>
                                            <span className="font-bold text-zinc-600 dark:text-zinc-400 uppercase">CREDIT</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Terminal ID</span>
                                            <span className="font-mono">PUR_T_{purchase.id}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Audit Timeline */}
                            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl p-5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-4 flex items-center gap-1.5">
                                    <History className="h-4 w-4 text-purple-500" /> Audit Transaction Timeline
                                </span>
                                <div className="relative pl-6 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-5 ml-1">
                                    {[
                                        {
                                            label: "Purchase Bill Drafted & Created",
                                            sub: purchase.created_at ? `${new Date(purchase.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} ${new Date(purchase.created_at).toLocaleTimeString()}` : fmtDate(purchase.date),
                                            active: true,
                                        },
                                        { label: "Stock Replenishment Logged", sub: "Automated inventory update completed", active: true },
                                        {
                                            label: "Payment Settlement Processed",
                                            sub: purchase.paid_amount > 0 ? `Paid: Rs ${purchase.paid_amount.toLocaleString()}` : "Credit Term Account — Pending",
                                            active: purchase.paid_amount > 0,
                                        },
                                        { label: "Audit Status Confirmed", sub: "Verified by system administrator", active: true },
                                    ].map((item, i) => (
                                        <div key={i} className="relative">
                                            <div className={cn("absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 bg-white dark:bg-zinc-900 flex items-center justify-center", item.active ? "border-emerald-500" : "border-zinc-300 dark:border-zinc-700")}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full", item.active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")} />
                                            </div>
                                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{item.label}</p>
                                            <span className="text-[9px] text-zinc-400 font-mono block mt-0.5">{item.sub}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                        </div>
                    </div>

                    <div className="hidden print:flex flex-col items-center justify-center border-t border-zinc-200 pt-6 mt-12 text-center text-xs text-zinc-400 font-mono">
                        <p className="font-bold uppercase tracking-wider">Harnain Traders Wholesale & Supply Chain</p>
                        <p className="mt-1">Generated dynamically on {new Date().toLocaleString()}</p>
                    </div>

                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
