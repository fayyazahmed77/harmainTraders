import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbItem } from "@/types";
import {
    ArrowLeftIcon,
    PrinterIcon,
    ShieldCheck,
    Receipt,
    Info,
    RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SalesReturnItem {
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

interface SalesReturn {
    id: number;
    invoice: string;
    date: string;
    original_invoice: string;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    remarks?: string;
    customer: { id: number; title: string };
    salesman: { id: number; name: string } | null;
    firm?: { id: number; name: string } | null;
    items: SalesReturnItem[];
    created_at?: string;
}

interface Props {
    returnData: SalesReturn;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/" },
    { title: "Sales Return", href: "/sales-return" },
    { title: "Credit Note Details", href: "#" },
];

export default function View({ returnData }: Props) {
    const fmt = (amount: number) =>
        new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 2 })
            .format(amount).replace("PKR", "").trim();

    const fmtDate = (d: string | null | undefined) => {
        if (!d) return "N/A";
        const dt = new Date(d + "T00:00:00");
        return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    const grossTotal  = Number(returnData.gross_total   || 0);
    const discTotal   = Number(returnData.discount_total || 0);
    const taxTotal    = Number(returnData.tax_total      || 0);
    const netTotal    = Number(returnData.net_total      || 0);
    const totalCartons = returnData.items.reduce((a, c) => a + Number(c.qty_carton), 0);
    const totalPcs    = returnData.items.reduce((a, c) => a + Number(c.total_pcs),   0);

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
                                        Sales Return <span className="font-mono text-rose-500">{returnData.invoice}</span>
                                    </h1>
                                    <Badge className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border flex items-center gap-1.5 shadow-none bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300">
                                        <RotateCcw className="h-3 w-3" /> Credit Memo
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-zinc-500 font-medium">
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Reversal Verified
                                    </span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <span>Date: <span className="font-bold text-zinc-700 dark:text-zinc-300">{fmtDate(returnData.date)}</span></span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <span>Created: <span className="font-bold text-zinc-700 dark:text-zinc-300">{returnData.created_at ? new Date(returnData.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : fmtDate(returnData.date)}</span></span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <span>Customer: <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{returnData.customer?.title || "N/A"}</span></span>
                                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                    <span>Agent: <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{returnData.salesman?.name || "Direct"}</span></span>
                                    {returnData.firm && (
                                        <>
                                            <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                            <span>Firm: <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{returnData.firm.name}</span></span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={() => window.open(`/sales-return/${returnData.id}/pdf`, "_blank")}
                                className="h-10 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-2">
                                <PrinterIcon className="h-4 w-4 text-rose-500" /> Print Credit Note
                            </Button>
                        </div>
                    </div>

                    {/* MAIN GRID */}
                    <div className="space-y-8">
                            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden">
                                <CardHeader className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Receipt className="h-5 w-5 text-rose-500" />
                                            <div>
                                                <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-200">Return Items Manifest</CardTitle>
                                                <CardDescription className="text-[10px] text-zinc-500 font-mono">Itemized credit reversal of returned goods and row totals</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-mono border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-none">SRET_{returnData.id}</Badge>
                                    </div>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse table-auto">
                                        <thead>
                                            <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
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
                                            {returnData.items.map((it, idx) => {
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
                                                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                                            {it.item?.retail ? fmt(it.item.retail) : "0.00"}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700 dark:text-zinc-300">{fmt(it.trade_price)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-rose-500">
                                                            {dp > 0 ? dp.toFixed(2) : "0.00"}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(adr)}</td>
                                                        <td className="px-6 py-3.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">{fmt(it.subtotal - it.discount)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-zinc-50/50 dark:bg-zinc-950/20 font-black text-xs border-t border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <td colSpan={2} className="px-6 py-3.5 text-zinc-500">Total</td>
                                                <td className="px-3 py-3.5 text-center font-mono text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">{totalCartons}</td>
                                                <td className="px-3 py-3.5 text-center font-mono text-zinc-900 dark:text-zinc-100">{returnData.items.reduce((a, i) => a + Number(i.qty_pcs || 0), 0)}</td>
                                                <td></td>
                                                <td></td>
                                                <td className="px-4 py-3.5 text-right text-rose-500 font-mono">-{fmt(discTotal)}</td>
                                                <td></td>
                                                <td className="px-6 py-3.5 text-right text-orange-500 font-mono">{fmt(returnData.items.reduce((a, i) => a + (Number(i.subtotal || 0) - Number(i.discount || 0)), 0))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                        
                                        {/* Left Column: Total Items & Signature */}
                                        <div className="space-y-12">
                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-bold text-sm">
                                                <span>Total # Of Items:</span>
                                                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-black">
                                                    {returnData.items.length}
                                                </span>
                                            </div>
                                            
                                            <div className="pt-6">
                                                <div className="w-48 border-b border-zinc-300 dark:border-zinc-700"></div>
                                                <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-black mt-2">
                                                    Check By Name & Time
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Middle Column: Discount Amount & Original Invoice */}
                                        <div className="space-y-4 flex flex-col justify-start">
                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-bold text-sm">
                                                <span>Discount Reclaim:</span>
                                                <span className="font-mono text-rose-500 font-black">
                                                    {fmt(discTotal)}
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-zinc-500">
                                                Original Invoice Ref: <span className="font-mono text-zinc-800 dark:text-zinc-200 uppercase ml-1">{returnData.original_invoice || "Manual"}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Right Column: Financial Figures */}
                                        <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold">
                                            <div className="flex justify-between items-center">
                                                <span>Gross Return Subtotal :-</span>
                                                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                                                    {fmt(grossTotal)}
                                                </span>
                                            </div>
                                            {taxTotal > 0 && (
                                                <div className="flex justify-between items-center text-blue-500">
                                                    <span>Tax Adjustment (GST) :-</span>
                                                    <span className="font-mono">
                                                        +{fmt(taxTotal)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span>Total Cartons Returned :-</span>
                                                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                                                    {totalCartons}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Total Units (Pcs) Returned :-</span>
                                                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                                                    {totalPcs}
                                                </span>
                                            </div>
                                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
                                            <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-black text-sm">
                                                <span>Net Credit Entry :</span>
                                                <span className="font-mono text-rose-500 text-base font-black">
                                                    {fmt(netTotal)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                    </div>
                                </div>
                            </Card>

                            {returnData.remarks && (
                                <Card className="bg-orange-500/[0.02] border border-orange-500/10 shadow-sm rounded-xl p-5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block mb-2 flex items-center gap-1.5">
                                        <Info className="h-4 w-4" /> Memo Remarks / Special Notice
                                    </span>
                                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 italic uppercase">"{returnData.remarks}"</p>
                                </Card>
                            )}
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
