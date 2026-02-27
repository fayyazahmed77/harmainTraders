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
    { title: "Material Control", href: "/offer" },
    { title: "Negotiation Registry", href: "/offer/list" },
    { title: "Protocol Archive", href: "#" },
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
                                <span>Protocol Archive</span>
                            </div>
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                                Offer Snapshot #{offer.id.toString().padStart(4, '0')}
                            </h1>
                            <p className="text-sm text-zinc-500 font-medium">
                                Reviewing historical negotiation dossiers for commercial entities.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/offer-list')}
                                className="rounded-xl border-zinc-200 dark:border-zinc-800 text-[11px] font-black uppercase tracking-widest h-12 px-6 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Return to Registry
                            </Button>
                            <div className="flex gap-2 h-12">
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(`/offer-list/${offer.id}/pdf`, '_blank')}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 text-[11px] font-black uppercase tracking-widest px-6 h-full"
                                >
                                    <FileText className="mr-2 h-4 w-4" /> PDF
                                </Button>
                                <Button
                                    onClick={() => window.location.href = `/offer-list/${offer.id}/download`}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 h-full font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20"
                                >
                                    <Download className="mr-2 h-4 w-4" /> Download
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

                            <div className="grid grid-cols-12 gap-8 items-start relative z-10">
                                <div className="col-span-12 lg:col-span-2 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <CalendarClock className="h-3 w-3" />
                                        Protocol Date
                                    </div>
                                    <div className="h-11 flex items-center px-4 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-sm font-black tabular-nums text-zinc-600">
                                        {new Date(offer.date).toLocaleDateString('en-GB')}
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <UserCircle2 className="h-3 w-3" />
                                        Negotiation Entity
                                    </div>
                                    <div className="flex bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 h-24 rounded-sm p-4 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase italic">
                                                {offer.account.title}
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-500 mt-1 max-w-[250px]">
                                                {offer.account.address || "Verified Commercial Entity"}
                                            </p>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                                            <UserCircle2 className="h-20 w-20" />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-3 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <ShieldCheck className="h-3 w-3 text-orange-500" />
                                        Pricing Rule
                                    </div>
                                    <div className="h-11 flex items-center px-4 border-2 border-orange-500/20 bg-orange-500/5 dark:bg-orange-500/10 rounded-sm font-black text-xs text-orange-600 uppercase italic tracking-wider">
                                        {offer.offertype === 'trade' ? 'Trade Price Protocol' :
                                            offer.offertype === 'retail' ? 'Retail Price Matrix' :
                                                'Dual Node Synchronization'}
                                    </div>
                                    <div className="text-[9px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1 text-orange-500">
                                        <ShieldCheck className="h-2.5 w-2.5" />
                                        Commercial Alignment Verified
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-3 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400">
                                        <FileText className="h-3 w-3" />
                                        Protocol Context
                                    </div>
                                    <div className="min-h-[64px] p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/50 rounded-md text-[10px] font-bold text-zinc-500 italic leading-relaxed">
                                        {offer.message_line?.messageline || "No additional context provided for this protocol."}
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
                                            {category} <span className="text-zinc-300 dark:text-zinc-600 px-2">/</span> {items.length} Nodes
                                        </span>
                                    </div>

                                    <Card className="border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 h-14 bg-zinc-50/50 dark:bg-zinc-950/20">
                                                        <th className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Material Node</th>
                                                        <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Full</th>
                                                        <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Pieces</th>
                                                        <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Retail Price</th>
                                                        <th className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Scheme Logic</th>
                                                        <th className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Settled Valuation</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item, idx) => (
                                                        <tr
                                                            key={item.id}
                                                            className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-orange-500/[0.02] dark:hover:bg-orange-500/[0.02] transition-colors h-16"
                                                        >
                                                            <td className="px-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase italic leading-none">
                                                                        {item.items.title}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-zinc-400 tracking-widest mt-1">
                                                                        NODE_ID: {item.id.toString().padStart(5, '0')}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 text-center text-xs font-black tabular-nums text-zinc-600 dark:text-zinc-400">{item.pack_ctn}</td>
                                                            <td className="px-4 text-center text-xs font-black tabular-nums text-zinc-600 dark:text-zinc-400">{item.loos_ctn}</td>
                                                            <td className="px-4 text-center text-xs font-black tabular-nums text-zinc-600 dark:text-zinc-400">Rs {item.mrp?.toLocaleString()}</td>
                                                            <td className="px-4 text-xs font-bold text-zinc-500 italic">{item.scheme || "---"}</td>
                                                            <td className="px-8 text-right">
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
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/90 dark:bg-zinc-100/90 backdrop-blur-xl border border-white/10 dark:border-black/5 rounded-full px-8 py-4 shadow-2xl flex items-center gap-10"
                        >
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-white/40 dark:text-black/40 uppercase tracking-[0.2em] mb-0.5">Total manifest nodes</span>
                                <span className="text-lg font-black text-orange-500 leading-none">{offer.items.length} ACTIVE</span>
                            </div>
                            <div className="h-8 w-px bg-white/10 dark:bg-black/5" />
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => window.open(`/offer-list/${offer.id}/pdf`, '_blank')}
                                    className="text-white dark:text-zinc-900 hover:bg-white/10 dark:hover:bg-black/5 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <FileText className="mr-2 h-4 w-4" /> Print PDF
                                </Button>
                                <Button
                                    onClick={() => router.visit('/offer-list')}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-500/30"
                                >
                                    Archive Protocol
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
