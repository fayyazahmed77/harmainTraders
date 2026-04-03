// Protocol Archive Surface - Premium View Redesign
import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Download,
    ArrowLeft,
    Workflow,
    CalendarClock,
    UserCircle2,
    ShieldCheck,
    BadgeInfo,
    LayoutGrid,
    Sparkles,
    History
} from "lucide-react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Offers", href: "/offer" },
    { title: "Offer List", href: "/offer/list" },
    { title: "View Offer", href: "#" },
];

interface OfferItem {
    id: number;
    pack_ctn: number;
    loos_ctn: number;
    mrp: number;
    price: number;
    scheme: string;
    items: {
        title: string;
        category: {
            name: string;
        };
    };
}

interface Offer {
    id: number;
    date: string;
    offertype: string;
    account: {
        id: number;
        title: string;
        address: string;
    };
    message_line?: {
        id: number;
        messageline: string;
    } | null;
    items: OfferItem[];
}

interface Props {
    offer: Offer;
}

export default function View({ offer }: Props) {
    // Group items by category
    const groupedItems = offer.items.reduce((acc, item) => {
        const categoryName = item.items.category?.name || "Uncategorized";
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(item);
        return acc;
    }, {} as Record<string, OfferItem[]>);

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto w-full">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-[0.3em]">
                                <Workflow className="h-3 w-3" />
                                <span>Offer Details</span>
                            </div>
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                                Offer Details #{offer.id.toString().padStart(4, '0')}
                            </h1>
                            <p className="text-sm text-zinc-500 font-medium">
                                View details of this price offer.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
                        >
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/offer-list')}
                                className="w-full sm:w-auto rounded-xl border-zinc-200 dark:border-zinc-800 text-[11px] font-black uppercase tracking-widest h-12 px-6 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                                Back to List
                            </Button>
                                <div className="flex flex-row gap-2 h-12">
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(`/offer-list/${offer.id}/pdf?group_by=category`, '_blank')}
                                        className="flex-1 sm:flex-none rounded-xl border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest px-4 h-full"
                                    >
                                        <LayoutGrid className="mr-2 h-4 w-4 shrink-0" /> Cat Print
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(`/offer-list/${offer.id}/pdf?group_by=company`, '_blank')}
                                        className="flex-1 sm:flex-none rounded-xl border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest px-4 h-full"
                                    >
                                        <History className="mr-2 h-4 w-4 shrink-0" /> Com Print
                                    </Button>
                                    <Button
                                        onClick={() => window.location.href = `/offer-list/${offer.id}/download`}
                                        className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 sm:px-6 h-full font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20"
                                    >
                                        <Download className="mr-2 h-4 w-4 hidden sm:block shrink-0" /> Download
                                    </Button>
                                </div>
                        </motion.div>
                    </div>

                    {/* Meta Surface */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="p-8 border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Sparkles className="h-24 w-24 text-orange-500" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative z-10">
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <CalendarClock className="h-3 w-3" />
                                        Offer Date
                                    </div>
                                    <div className="h-11 flex items-center px-4 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-sm font-black tabular-nums text-zinc-600 w-full truncate">
                                        {new Date(offer.date).toLocaleDateString('en-GB')}
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2 lg:col-span-5 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <UserCircle2 className="h-3 w-3" />
                                        Customer
                                    </div>
                                    <div className="flex bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 min-h-[44px] lg:h-24 rounded-sm p-4 relative overflow-hidden flex-col justify-center">
                                        <div className="relative z-10">
                                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase italic">
                                                {offer.account?.title || "General Customer"}
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-500 mt-1 max-w-[250px] truncate md:whitespace-normal">
                                                {offer.account?.address || "Commercial Protocol Lead"}
                                            </p>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                                            <UserCircle2 className="h-20 w-20" />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <FileText className="h-3 w-3" />
                                        Message
                                    </div>
                                    <div className="min-h-[44px] lg:min-h-[64px] p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/50 rounded-md text-[10px] font-bold text-zinc-500 italic leading-relaxed">
                                        {offer.message_line?.messageline || "No message."}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Manifest Archives */}
                    <div className="space-y-10 pb-20">
                        <AnimatePresence>
                            {Object.entries(groupedItems).map(([category, items], catIdx) => (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (catIdx * 0.1) }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-3 px-4">
                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                                            {category} <span className="text-zinc-300 dark:text-zinc-600 px-2">/</span> {items.length} Items
                                        </span>
                                    </div>

                                    <Card className="border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md overflow-hidden">
                                        <div className="overflow-x-auto w-full">
                                            <table className="w-full text-left border-collapse flex flex-col md:table">
                                                <thead className="hidden md:table-header-group">
                                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 h-14 bg-zinc-50/50 dark:bg-zinc-950/20">
                                                        <th className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Item</th>
                                                        {offer.offertype === '1' ? (
                                                            <>
                                                                <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Carton Price</th>
                                                                <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Loose Ctn Price</th>
                                                            </>
                                                        ) : (
                                                            <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Price</th>
                                                        )}
                                                        <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Retail Price</th>
                                                        <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Scheme</th>
                                                        {offer.offertype === '2' && <th className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Price</th>}
                                                    </tr>
                                                </thead>
                                                <tbody className="flex flex-col md:table-row-group">
                                                    {items.map((item, idx) => (
                                                        <tr
                                                            key={item.id}
                                                            className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-orange-500/[0.02] dark:hover:bg-orange-500/[0.02] transition-colors md:h-16 flex flex-col md:table-row p-4 md:p-0 gap-2 md:gap-0"
                                                        >
                                                            <td className="md:px-6 block md:table-cell pb-2 md:pb-0 border-b border-dashed border-zinc-100 dark:border-zinc-800 md:border-none">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase italic leading-none">
                                                                        {item.items.title}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-zinc-400 tracking-widest mt-1">
                                                                        NODE_ID: {item.id.toString().padStart(5, '0')}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            {offer.offertype === '1' ? (
                                                                <>
                                                                    <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                                        <div className="flex flex-row justify-between md:justify-center items-center">
                                                                            <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none md:hidden block">Carton Price</span>
                                                                            <span className="text-xs font-black tabular-nums text-zinc-600 dark:text-zinc-400">Rs {Number(item.pack_ctn).toLocaleString()}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                                        <div className="flex flex-row justify-between md:justify-center items-center">
                                                                            <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none md:hidden block">Loose Ctn Price</span>
                                                                            <span className="text-xs font-black tabular-nums text-zinc-600 dark:text-zinc-400">Rs {Number(item.loos_ctn).toLocaleString()}</span>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                                    <div className="flex flex-row justify-between md:justify-center items-center">
                                                                        <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none md:hidden block">Price</span>
                                                                        <span className="text-xs font-black tabular-nums text-blue-600 dark:text-blue-400">Rs {Number(item.price).toLocaleString()}</span>
                                                                    </div>
                                                                </td>
                                                            )}
                                                            <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                                <div className="flex flex-row justify-between md:justify-center items-center">
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none md:hidden block">Retail Price</span>
                                                                    <span className="text-xs font-black tabular-nums text-zinc-600 dark:text-zinc-400">Rs {item.mrp?.toLocaleString()}</span>
                                                                </div>
                                                            </td>
                                                            <td className="md:px-4 py-1 md:py-0 block md:table-cell">
                                                                <div className="flex flex-row space-x-2 md:space-x-0 md:flex-col justify-start items-center md:items-start text-xs font-bold text-zinc-500 italic">
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none md:hidden block shrink-0">Scheme:</span>
                                                                    <span className="truncate">{item.scheme || "---"}</span>
                                                                </div>
                                                            </td>
                                                            {offer.offertype === '2' && (
                                                                <td className="md:px-8 py-2 md:py-0 block md:table-cell mt-2 md:mt-0 font-bold border-t border-zinc-100 dark:border-zinc-800 border-dashed md:border-none flex flex-row justify-between items-center text-right">
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 leading-none md:hidden block">Price</span>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-sm font-black tabular-nums text-orange-600 dark:text-orange-400">
                                                                            <span className="text-[10px] mr-1 opacity-50 font-bold">Rs</span>
                                                                            {Number(item.price).toLocaleString()}
                                                                        </span>
                                                                        <div className="flex items-center gap-1 mt-0.5">
                                                                            <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                                                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Synchronized</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* View Footer */}
                    <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm md:max-w-max md:w-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/95 dark:bg-zinc-100/95 backdrop-blur-xl border border-white/10 dark:border-black/5 rounded-2xl md:rounded-full px-6 py-4 md:px-8 md:py-4 shadow-2xl flex flex-row items-center justify-between gap-4 md:gap-10"
                        >
                            <div className="flex flex-col shrink-0">
                                <span className="text-[8px] font-black text-white/40 dark:text-black/40 uppercase tracking-[0.2em] mb-0.5">Total Items</span>
                                <span className="text-sm md:text-lg font-black text-orange-500 leading-none">{offer.items.length} ACTIVE</span>
                            </div>
                            <div className="hidden md:block h-8 w-px bg-white/10 dark:bg-black/5" />
                            <div className="flex items-center gap-3 justify-end w-full md:w-auto">
                                <Button
                                    variant="ghost"
                                    onClick={() => window.open(`/offer-list/${offer.id}/pdf`, '_blank')}
                                    className="text-white dark:text-zinc-900 hover:bg-white/10 dark:hover:bg-black/5 font-black text-[10px] uppercase tracking-widest px-2 md:px-4 shrink-0"
                                >
                                    <FileText className="md:mr-2 h-4 w-4" /> <span className="hidden md:inline">Print PDF</span>
                                </Button>
                                <Button
                                    onClick={() => router.visit('/offer-list')}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl md:rounded-full px-4 md:px-6 h-9 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-500/30 flex-1 md:flex-none shrink-0 text-center"
                                >
                                    Back <span className="hidden md:inline">&nbsp;to List</span>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
