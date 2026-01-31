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
import { router } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Purchase Return", href: "/purchase-return" },
    { title: "List", href: "/purchase-return" },
];

interface PurchaseReturn {
    id: number;
    date: string;
    invoice: string;
    original_invoice: string;
    supplier_id: number;
    salesman_id: number;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    supplier: {
        id: number;
        title: string;
    };
    salesman: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    returns: PurchaseReturn[];
}

export default function Index({ returns }: Props) {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Purchase Return List</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage your Purchase Returns here.
                            </p>
                        </div>
                       
                    </div>
                    <DataTable data={returns} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
