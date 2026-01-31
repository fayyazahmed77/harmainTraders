import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import DataTable from "./DataTable";
import { Plus } from "lucide-react";
import { router, usePage } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Purchase", href: "/purchase" },
    { title: "New Invoice", href: "/purchase/create" },
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

import PurchaseSummary from "./PurchaseSummary";
import PurchaseFilters from "./PurchaseFilters";

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
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">All Purchase list </h1>
                            <p className="text-sm text-muted-foreground">
                                Manage your Purchase  here.
                            </p>
                        </div>
                        <Button
                            className="mb-3"
                            onClick={() => router.visit("/purchase/create")}
                        >
                            <Plus className="mr-2" /> Purchase
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
