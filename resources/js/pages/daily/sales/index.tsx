import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import SalesSummary from "./SalesSummary";
import SalesFilters from "./SalesFilters";
import DataTable from "./DataTable";
import { Plus } from "lucide-react";
import { router, usePage } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Sales", href: "/sales" },
    { title: "New Invoice", href: "/sales/create" },
];
export type SaleStatus = "Completed" | "Partial Return" | "Returned";
interface Sales {
    id: number;
    date: string;
    invoice: string;
    code: string;
    status: SaleStatus;
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

interface SummaryData {
    total_sales: number;
    total_sales_return: number;
    partial_return: number;
    total_paid: number;
    total_unpaid: number;
    pdf_url?: string;
}

interface FilterData {
    start_date?: string;
    end_date?: string;
    customer_id?: string;
    status?: string;
    search?: string;
}

interface CustomerData {
    id: number;
    title: string;
}

interface Props {
    sales: Sales[];
    summary: SummaryData;
    filters: FilterData;
    customers: CustomerData[];
}

export default function Index({ sales, summary, filters, customers }: Props) {
    const { props } = usePage();
    const { flash } = props as any;
    const lastOpenedRef = React.useRef<string | null>(null);

    useEffect(() => {
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
                            <h1 className="text-2xl font-bold mb-1">Sales Dashboard</h1>
                            <p className="text-sm text-muted-foreground">
                                View sales performance, returns, and manage invoices.
                            </p>
                        </div>
                        <Button
                            className=" mb-3"
                            onClick={() => router.visit("/sales/create")}
                        >
                            <Plus className="mr-2" /> New Sale
                        </Button>
                    </div>

                    <SalesSummary summary={summary} sales={sales} />

                    <SalesFilters filters={filters} customers={customers} />

                    <DataTable data={sales} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
