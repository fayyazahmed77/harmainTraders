import React from "react";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import DataTable from "./DataTable";
import { Plus, Tag, Sparkles } from "lucide-react";
import { router } from "@inertiajs/react";
import { motion } from "framer-motion";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Material Control", href: "/offer" },
    { title: "Negotiation Registry", href: "/offer/list" },
];

interface Offer {
    id: number;
    date: string;
    offertype: string;
    account: {
        id: number;
        title: string;
    };
    user: {
        id: number;
        name: string;
    };
}

interface Props {
    offers: Offer[];
}

export default function Index({ offers }: Props) {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto w-full">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-[0.3em]">
                                <Sparkles className="h-3 w-3" />
                                <span>Commercial Intelligence</span>
                            </div>
                            <Heading
                                title="Negotiation Registry"
                                description="Comprehensive ledger of price offers, material tenders, and supplier negotiations."
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Button
                                onClick={() => router.visit("/offer-list/create")}
                                className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white transition-all duration-300 rounded-xl px-6 h-12 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-zinc-200 dark:shadow-none group"
                            >
                                <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                                Initialize New Offer
                            </Button>
                        </motion.div>
                    </div>

                    {/* Registry Surface */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative group mt-4"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-zinc-500/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                        <div className="relative bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] shadow-sm overflow-hidden backdrop-blur-xl p-2">
                            <div className="bg-zinc-50/50 dark:bg-zinc-950/30 rounded-[1.2rem] p-4 lg:p-6 border border-zinc-100/50 dark:border-zinc-800/50">
                                <DataTable data={offers} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
