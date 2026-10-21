import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, History as HistoryIcon, Activity, Sparkles, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import DataTable from "./DataTable";
import SalesReturnFilters from "./components/SalesReturnFilters";
import { SuccessDialog } from "./components/SuccessDialog";
import { BreadcrumbItem } from "@/types";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Distribution", href: "#" },
    { title: "Sales Return", href: "/sales-return" },
];

interface SalesReturn {
    id: number;
    date: string;
    invoice: string;
    original_invoice: string;
    customer_id: number;
    salesman_id: number;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    customer: {
        id: number;
        title: string;
    };
    salesman: {
        id: number;
        name: string;
    };
}

interface PaginatedReturns {
    data: SalesReturn[];
    current_page: number;
    last_page: number;
    per_page?: number;
    total: number;
    from?: number;
    to?: number;
    links?: any[];
}

interface Props {
    returns: PaginatedReturns;
    summary?: {
        total_volume: number;
        total_amount: number;
        total_items: number;
    };
    customers?: Array<{ id: number; title: string }>;
    salesmen?: Array<{ id: number; name: string }>;
    firms?: Array<{ id: number; name: string }>;
    filters?: Record<string, any>;
}

const PREMIUM_ROUNDING = "rounded-2xl";

export default function Index({
    returns,
    summary,
    customers = [],
    salesmen = [],
    firms = [],
    filters = {},
}: Props) {
    const { props } = usePage();
    const { flash } = props as any;
    const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
    const [successData, setSuccessData] = React.useState<any>(null);

    React.useEffect(() => {
        if (flash?.success_dialog) {
            setSuccessData(flash.success_dialog);
            setShowSuccessDialog(true);
        }
    }, [flash]);

    const totalVolume = summary?.total_volume ?? returns?.total ?? returns?.data?.length ?? 0;
    const totalAmount = summary?.total_amount ?? 0;
    const totalItems = summary?.total_items ?? 0;

    const stats = [
        { label: "Return Volume", value: totalVolume.toLocaleString(), icon: HistoryIcon, color: "orange" },
        { label: "Credit Issued", value: `₨ ${Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, color: "zinc" },
        { label: "Item Reconciliation", value: totalItems.toLocaleString(), icon: Activity, color: "orange" },
        { label: "Registry Health", value: "100%", icon: Sparkles, color: "emerald" },
    ];

    return (
        <SidebarProvider>
            <Head title="Credit Note Ledger | Sales Systems" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                        >
                            <Heading
                                title="Sales Return"
                                description="Comprehensive archive of customer returns and automated credit adjustments"
                            />

                            <div className="flex items-center gap-3">
                                <Button
                                    asChild
                                    className="rounded-xl h-12 px-6 bg-zinc-900 border-orange-500/20 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2 group"
                                >
                                    <Link href="/sales-return/create">
                                        <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                                        Authorize New Return
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>

                        {/* Top Analytics Cards (Mini) */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cn(
                                        PREMIUM_ROUNDING,
                                        "p-4 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 group hover:bg-white dark:hover:bg-zinc-900 transition-all shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                                        stat.color === 'orange' ? "bg-orange-500/10 text-orange-600" :
                                            stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
                                                "bg-zinc-500/10 text-zinc-600"
                                    )}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 group-hover:text-zinc-500 transition-colors">{stat.label}</p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">{stat.value}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Essential Core Filters Bar */}
                        <SalesReturnFilters
                            filters={filters}
                            customers={customers}
                            salesmen={salesmen}
                            firms={firms}
                            totalAmount={totalAmount}
                            totalCount={totalVolume}
                        />

                        {/* Main Content Area */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className={cn(
                                PREMIUM_ROUNDING,
                                "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-2xl shadow-zinc-200/50 dark:shadow-none overflow-hidden"
                            )}
                        >
                            <div className="p-1 bg-gradient-to-r from-orange-500/20 via-transparent to-transparent" />
                            <div className="p-6">
                                <DataTable data={returns?.data || []} pagination={returns} filters={filters} />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Style for custom scrollbar */}
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; border: 1px solid transparent; background-clip: padding-box; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
                `}</style>

                {successData && (
                    <SuccessDialog
                        open={showSuccessDialog}
                        onOpenChange={setShowSuccessDialog}
                        invoiceNo={successData.invoiceNo || String(successData.saleId)}
                        saleId={successData.saleId}
                        customerName={successData.customerName}
                        totalAmount={successData.totalAmount}
                        countItems={successData.countItems}
                        countFull={successData.countFull}
                        countPcs={successData.countPcs}
                        totalDiscount={successData.totalDiscount}
                        type={successData.type || 'create'}
                        onReturn={() => {
                            setShowSuccessDialog(false);
                            if (successData.type !== 'edit') {
                                router.visit("/sales-return/create");
                            }
                        }}
                    />
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
