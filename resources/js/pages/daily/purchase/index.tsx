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
import { SuccessSummaryDialog } from "./components/SuccessSummaryDialog";

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
    amount?: string;
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
    code?: string;
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
    isLimited?: boolean;
}

export default function Index({ purchases, summary, filters, suppliers, isLimited }: Props) {
    const { props } = usePage();
    const { flash } = props as any;
    const lastOpenedRef = React.useRef<string | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
    const [successData, setSuccessData] = React.useState<any>(null);

    React.useEffect(() => {
        if (flash?.pdf_url && flash.pdf_url !== lastOpenedRef.current) {
            window.open(flash.pdf_url, '_blank');
            lastOpenedRef.current = flash.pdf_url;
        }
    }, [flash]);

    React.useEffect(() => {
        if (flash?.success_dialog) {
            setSuccessData(flash.success_dialog);
            setShowSuccessDialog(true);
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

                    {isLimited && (
                        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                            <span className="flex items-center gap-2">
                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" /></svg>
                                Showing latest 100 bills for fast loading. Apply date range or filters to search all bills.
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs font-bold border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 shrink-0"
                                onClick={() => router.get("/purchase", { all: "true" }, { preserveState: true, preserveScroll: true })}
                            >
                                Load All
                            </Button>
                        </div>
                    )}

                    <DataTable data={purchases} />
                </div>

                {successData && (
                    <SuccessSummaryDialog
                        open={showSuccessDialog}
                        onOpenChange={setShowSuccessDialog}
                        supplierName={successData.supplierName}
                        totalItems={successData.totalItems}
                        totalFull={successData.totalFull}
                        totalPcs={successData.totalPcs}
                        gross={successData.gross}
                        discount={successData.discount}
                        net={successData.net}
                        purchaseId={successData.purchaseId}
                        mode={successData.mode || 'create'}
                        onReturn={() => {
                            setShowSuccessDialog(false);
                            if (successData.mode !== 'edit') {
                                router.visit("/purchase/create");
                            }
                        }}
                    />
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
