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
    { title: "Offers", href: "/offer" },
    { title: "Offer List", href: "/offer/list" },
];

interface Offer {
    id: number;
    date: string;
    offertype: string;
    account: {
        id: number;
        title: string;
    };
    firm: {
        id: number;
        name: string;
    } | null;
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
                                <span>Business Info</span>
                            </div>
                            <Heading
                                title="Offer List"
                                description="View and manage all price offers and negotiations."
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
                                Add Offer
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
                        <DataTable data={offers} />
                    </motion.div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
