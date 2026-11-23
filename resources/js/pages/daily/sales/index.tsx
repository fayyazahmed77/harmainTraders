import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import SalesSummary from "./SalesSummary";
import SalesFilters from "./SalesFilters";
import DataTable from "./DataTable";
import { Plus, Info } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { SuccessDialog } from "./components/SuccessDialog";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Sales", href: "/sales" },
    { title: "New Invoice", href: "/sales/create" },
];
export type SaleStatus = "Completed" | "Partial Return" | "Returned" | "Pending Order" | "Canceled";
interface Sales {
    id: number;
    extra_discount: number;
    date: string;
    invoice: string;
    code: string;
    status: SaleStatus;
    is_online: boolean;
    customer_id: number;
    salesman_id: number;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    courier_charges: number;
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
    amount?: string;
    search?: string;
    is_online?: string;
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
    isLimited?: boolean;
}

export default function Index({ sales, summary, filters, customers, isLimited }: Props) {
    const { props } = usePage();
    const { flash } = props as any;
    const lastOpenedRef = React.useRef<string | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
    const [successData, setSuccessData] = React.useState<any>(null);

    useEffect(() => {
        if (flash?.pdf_url && flash.pdf_url !== lastOpenedRef.current) {
            window.open(flash.pdf_url, '_blank');
            lastOpenedRef.current = flash.pdf_url;
        }
    }, [flash]);

    useEffect(() => {
        if (flash?.success_dialog) {
            setSuccessData(flash.success_dialog);
            setShowSuccessDialog(true);
        }
    }, [flash]);

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 min-w-0 overflow-x-hidden">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Sales Dashboard</h1>
                            <p className="text-sm text-muted-foreground">
                                View sales performance, returns, and manage invoices.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.visit("/sales/create")}
                        >
                            <Plus className="mr-2" /> New Sale
                        </Button>
                    </div>

                    <SalesSummary summary={summary} sales={sales} />

                    <SalesFilters filters={filters} customers={customers} />

                    {isLimited && (
                        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                            <span className="flex items-center gap-2">
                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" /></svg>
                                Showing latest 100 invoices for fast loading. Apply date range or filters to search all invoices.
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs font-bold border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 shrink-0"
                                onClick={() => router.get("/sales", { all: "true" }, { preserveState: true, preserveScroll: true })}
                            >
                                Load All
                            </Button>
                        </div>
                    )}

                    <DataTable data={sales} />
                </div>

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
                                router.visit("/sales/create");
                            }
                        }}
                    />
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
