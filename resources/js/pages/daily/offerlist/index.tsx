import React from "react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import DataTable from "./DataTable";
import { Plus } from "lucide-react";
import { router } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Offer", href: "/offer" },
    { title: "Listing", href: "/offer/list" },
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
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Offer List</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage your Offer Lists here.
                            </p>
                        </div>
                        <Button
                            className="bg-sky-500 mb-3"
                            onClick={() => router.visit("/offer-list/create")}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Create Offer
                        </Button>
                    </div>
                    <DataTable data={offers} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
