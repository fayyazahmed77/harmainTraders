import React from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import DataTable from "./DataTable";
import PurchaseSummary from "./PurchaseSummary";
import PurchaseFilters from "./PurchaseFilters";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Purchase", href: "/purchase" },
    { title: "New Purchase", href: "/purchase/create" },
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
            <Head title="Purchases | Harnain Traders" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 min-w-0 overflow-x-hidden">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Purchases</h1>
                            <p className="text-sm text-muted-foreground">
                                View and manage all items bought from suppliers.
                            </p>
                        </div>
                        <Button onClick={() => router.visit("/purchase/create")}>
                            <Plus className="mr-2" /> New Purchase
                        </Button>
                    </div>

                    <PurchaseSummary summary={summary} purchases={purchases} />

                    <PurchaseFilters filters={filters} suppliers={suppliers} />

                    <DataTable data={purchases} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
