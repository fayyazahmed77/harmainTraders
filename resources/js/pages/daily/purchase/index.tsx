import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { BreadcrumbItem } from "@/types";
import DataTable from "./DataTable";
import PurchaseSummary from "./PurchaseSummary";
import PurchaseFilters from "./PurchaseFilters";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Procurement", href: "#" },
    { title: "Purchase Registry", href: "/purchase" },
];

interface FilterData {
    start_date?: string;
    end_date?: string;
    supplier_id?: string;
    status?: string;
    search?: string;
}

interface SummaryData {
    total_purchase: number;
    total_paid: number;
    total_unpaid: number;
    total_returns: number;
    count: number;
}

interface Supplier {
    id: number;
    title: string;
}

interface Purchases {
    id: number;
    date: string;
    invoice: string;
    code: string;
    supplier_id: number;
    salesman_id: number;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
    supplier: {
        id: number;
        title: string;
    };
    salesman: {
        id: number;
        name: string;
    };
}

interface Props {
    purchases: Purchases[];
    summary: SummaryData;
    filters: FilterData;
    suppliers: Supplier[];
}

export default function Index({ purchases, summary, filters, suppliers }: Props) {
    const { props } = usePage();
    const { flash } = props as any;
    const lastOpenedRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        if (flash?.pdf_url && flash.pdf_url !== lastOpenedRef.current) {
            window.open(flash.pdf_url, '_blank');
            lastOpenedRef.current = flash.pdf_url;
        }
    }, [flash]);

    return (
        <SidebarProvider>
            <Head title="Procurement Registry | Business Intelligence" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                        >
                            <Heading
                                title="Procurement Analytics Dashboard"
                                description="Strategic oversight of supply chain acquisition and financial trade commitments"
                            />

                            <div className="flex items-center gap-3">
                                <Button
                                    asChild
                                    className="rounded-xl h-12 px-6 bg-zinc-900 border-orange-500/20 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2 group"
                                >
                                    <Link href="/purchase/create">
                                        <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                                        Initialize Procurement
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>

                        {/* Summary Section */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <PurchaseSummary summary={summary} purchases={purchases} />
                        </motion.div>

                        {/* Filters Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <PurchaseFilters filters={filters} suppliers={suppliers} />
                        </motion.div>

                        {/* Data Table Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-2xl shadow-zinc-200/50 dark:shadow-none overflow-hidden"
                        >
                            <div className="p-1 bg-gradient-to-r from-orange-500/20 via-transparent to-transparent" />
                            <div className="p-6">
                                <DataTable data={purchases} />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Custom Scrollbar Styles */}
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; border: 1px solid transparent; background-clip: padding-box; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
                `}</style>
            </SidebarInset>
        </SidebarProvider>
    );
}
