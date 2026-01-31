"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";

interface ChequeDetail {
    id: number;
    cheque_no: string;
    entry_date: string;
    bank_name: string;
    status: string;
    remarks: string | null;
    voucher_code: string | null;
    created_at: string;
    created_by_name: string;
    // Payment details (if used)
    payment_amount?: number;
    payment_date?: string;
    assigned_to?: string;
    payment_voucher_no?: string;
    payment_cheque_status?: string;
    payment_clear_date?: string | null;
}

export default function ChequeBookShow() {
    const { chequebook } = usePage().props as unknown as { chequebook: ChequeDetail };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Cheques", href: "/chequebook" },
        { title: `Detail #${chequebook.cheque_no}`, href: "#" },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "issued":
            case "used":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Issued</Badge>;
            case "cancelled":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
            case "unused":
            default:
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Unused</Badge>;
        }
    };

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

                <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
                    {/* Header with Back Button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/chequebook">
                                <Button variant="outline" size="icon" className="h-8 w-8">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <h1 className="text-2xl font-bold">Cheque Details</h1>
                        </div>
                        <div>
                            {getStatusBadge(chequebook.status)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 🏦 Basic Cheque Info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    Cheque Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Bank Name</p>
                                        <p className="font-semibold">{chequebook.bank_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Cheque No</p>
                                        <p className="font-semibold text-primary">{chequebook.cheque_no}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Entry Date</p>
                                        <p className="font-medium">{new Date(chequebook.entry_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Voucher Code</p>
                                        <p className="font-medium">{chequebook.voucher_code || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Created By</p>
                                        <p className="font-medium">{chequebook.created_by_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Created At</p>
                                        <p className="font-medium">{new Date(chequebook.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {chequebook.remarks && (
                                    <div className="pt-2">
                                        <p className="text-muted-foreground text-sm">Remarks</p>
                                        <p className="text-sm bg-muted p-2 rounded-md mt-1">{chequebook.remarks}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 💰 Payment Usage Info (Only if Issued/Used) */}
                        {chequebook.status === 'issued' || chequebook.status === 'used' ? (
                            <Card className="border-blue-200 bg-blue-50/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Payment Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 text-sm">
                                        <div className="flex justify-between border-b pb-2 border-blue-100">
                                            <span className="text-muted-foreground">Assigned To (Payee)</span>
                                            <span className="font-bold text-blue-900">{chequebook.assigned_to}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2 border-blue-100">
                                            <span className="text-muted-foreground">Voucher No</span>
                                            <span className="font-medium">{chequebook.payment_voucher_no}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2 border-blue-100">
                                            <span className="text-muted-foreground">Payment Date</span>
                                            <span className="font-medium">{chequebook.payment_date ? new Date(chequebook.payment_date).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2 border-blue-100">
                                            <span className="text-muted-foreground">Cheque Status</span>
                                            {chequebook.payment_cheque_status === 'Clear' ? (
                                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">Cleared</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">{chequebook.payment_cheque_status}</span>
                                            )}
                                        </div>
                                        {chequebook.payment_clear_date && (
                                            <div className="flex justify-between border-b pb-2 border-blue-100">
                                                <span className="text-muted-foreground">Clear Date</span>
                                                <span className="font-medium">{new Date(chequebook.payment_clear_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-muted-foreground">Amount Paid</span>
                                            <span className="text-xl font-bold text-green-700">
                                                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(chequebook.payment_amount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-dashed flex items-center justify-center p-6 bg-muted/50">
                                <div className="text-center text-muted-foreground">
                                    <XCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p>This cheque has not been used yet.</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
