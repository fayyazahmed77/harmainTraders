"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { Link, usePage } from "@inertiajs/react";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { DataTable } from "@/components/setup/cheque/DataTable";

// ✅ Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
    { title: "Setup", href: "#" },
    { title: "Cheque Books", href: "/chequebook" },
];

// ✅ ChequeBook Interface
interface ChequeBook {
    id: number;
    bank_id: number;
    bank: {
        id: number;
        title: string;
    };
    logo_url: string;
    created_by_name: string;
    created_by_avatar?: string | null;
    entry_date?: string;
    voucher_code?: string | null;
    remarks?: string | null;
    prefix?: string;
    cheque_no: string;
    total_cheques?: number;
    created_at: string;
}

export default function ChequeBookPage() {
    // ✅ Inertia props
    const { chequebook } = usePage().props as unknown as {
        chequebook: ChequeBook[];
    };

    // ✅ Toast for success/error messages
    useToastFromQuery();

    // ✅ Auth & Permissions
    const pageProps = usePage().props as unknown as {
        auth: {
            user: any;
            permissions: string[];
        };
        errors: Record<string, string>;
    };

    const permissions = pageProps.auth.permissions;
    const errors = pageProps.errors;

    // ✅ Permission: can user create new cheque books?
    const canCreate = permissions.includes("create chequebook");

    // ✅ Route helper
    function route(_name: string): string {
        // Minimal route helper for development; replace with your real route helper (e.g. Ziggy) in production.
        if (_name === "cheque.create") return "/cheque/create";
        return "";
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 61)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="mt-6 px-6">
                    {/* ===== Header Section ===== */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Cheque Book Generation</h1>
                            <p className="text-sm text-muted-foreground">
                                Create and manage cheque books for different banks.
                            </p>
                        </div>

                        {/* ===== Add Button (Permission Based) ===== */}
                        {canCreate && (
                            <Link href={route("cheque.create")}>
                                <Button className="shadow-sm hover:shadow-md transition-all">
                                    <Plus className="mr-2 h-4 w-4" /> Generate Cheque Book
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* ===== Validation Errors ===== */}
                    {Object.keys(errors).length > 0 && (
                        <div className="p-3 mb-4 text-red-600 bg-red-50 rounded-md border border-red-200">
                            {Object.values(errors).map((err, idx) => (
                                <p key={idx}>{err}</p>
                            ))}
                        </div>
                    )}

                    {/* ===== Table Section ===== */}
                    {chequebook.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 border rounded-md">
                            No cheque books found.
                        </div>
                    ) : (
                        <DataTable data={chequebook} />
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
