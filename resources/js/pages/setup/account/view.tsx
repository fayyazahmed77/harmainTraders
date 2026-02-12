"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Edit,
    MapPin,
    Phone,
    User,
    Hash,
    Calendar as CalendarIcon,
    CreditCard,
    FileText,
    Info,
    Globe,
    Building2,
    Tag,
    TrendingUp,
    Wallet
} from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { cn } from "@/lib/utils";

interface Account {
    id: number;
    code: string;
    title: string;
    type: string;
    account_type?: { id: number; name: string };
    purchase: boolean;
    cashbank: boolean;
    sale: boolean;
    opening_balance: number;
    opening_date: string | null;
    address1: string | null;
    address2: string | null;
    mobile: string | null;
    telephone1: string | null;
    telephone2: string | null;
    fax: string | null;
    gst: string | null;
    ntn: string | null;
    cnic: string | null;
    remarks: string | null;
    regards: string | null;
    fbr_date: string | null;
    credit_limit: number;
    aging_days: number;
    note_head: string | null;
    category: string | null;
    item_category: number | null;
    ats_percentage: number | null;
    ats_type: string | null;
    status: boolean;
    country?: { id: number; name: string };
    province?: { id: number; name: string };
    city?: { id: number; name: string };
    area?: { id: number; name: string };
    subarea?: { id: number; name: string };
    saleman?: { id: number; name: string };
    booker?: { id: number; name: string };
}

interface Props {
    account: Account;
    financial_summary?: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Account", href: "/account" },
    { title: "Detail", href: "#" },
];

export default function AccountView({ account, financial_summary }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const InfoRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) => (
        <div className="flex flex-col space-y-1.5 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </div>
            <div className="text-sm font-semibold text-foreground">
                {value || <span className="text-muted-foreground font-normal italic">Not specified</span>}
            </div>
        </div>
    );

    const renderFinancialSummary = () => {
        const type = account.account_type?.name || account.type;

        if (!financial_summary || Object.keys(financial_summary).length === 0) return null;

        if (type === 'Customers') {
            return (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
                            <TrendingUp className="h-4 w-4" />
                            Customer Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Sales</span>
                            <span className="font-bold">{formatCurrency(financial_summary.total_sales)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Amount Received</span>
                            <span className="font-bold text-green-600">{formatCurrency(financial_summary.total_receipts)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Returns</span>
                            <span className="font-bold text-orange-600">{formatCurrency(financial_summary.total_returns)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Unpaid Invoices</span>
                            <Badge variant="outline" className="font-bold text-red-600">
                                {financial_summary.unpaid_invoices} Pending
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (type === 'Supplier') {
            return (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-600">
                            <TrendingUp className="h-4 w-4" />
                            Supplier Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Purchases</span>
                            <span className="font-bold">{formatCurrency(financial_summary.total_purchases)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Amount Paid</span>
                            <span className="font-bold text-blue-600">{formatCurrency(financial_summary.total_payments)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Returns</span>
                            <span className="font-bold text-orange-600">{formatCurrency(financial_summary.total_returns)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Unpaid Bills</span>
                            <Badge variant="outline" className="font-bold text-red-600">
                                {financial_summary.unpaid_bills} Pending
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (type === 'Bank' || type === 'Cash') {
            return (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-600">
                            <Wallet className="h-4 w-4" />
                            {type} Statement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total In</span>
                            <span className="font-bold text-green-600">{formatCurrency(financial_summary.total_in)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Out</span>
                            <span className="font-bold text-red-600">{formatCurrency(financial_summary.total_out)}</span>
                        </div>
                        <div className="pt-2 border-t font-bold flex items-center justify-between">
                            <span className="text-sm">Current Balance</span>
                            <span className="text-sm">{formatCurrency(financial_summary.current_balance)}</span>
                        </div>

                        {type === 'Bank' && (
                            <div className="space-y-3 mt-4 pt-4 border-t">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Chequebook Usage</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2 bg-muted rounded text-center">
                                        <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                                        <div className="text-sm font-bold">{financial_summary.total_cheques}</div>
                                    </div>
                                    <div className="p-2 bg-muted rounded text-center">
                                        <div className="text-[10px] text-muted-foreground uppercase">Used</div>
                                        <div className="text-sm font-bold text-blue-600">{financial_summary.issued_cheques}</div>
                                    </div>
                                    <div className="p-2 bg-muted rounded text-center">
                                        <div className="text-[10px] text-muted-foreground uppercase">Avail.</div>
                                        <div className="text-sm font-bold text-green-600">{financial_summary.available_cheques}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        }

        return null;
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

                <div className="flex flex-1 flex-col gap-6 p-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{account.title}</h1>
                                <Badge variant={account.status ? "default" : "destructive"} className="px-2.5 py-0.5">
                                    {account.status ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <Hash className="h-4 w-4" />
                                    Code: <span className="text-foreground">{account.code}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-medium">
                                    <Tag className="h-4 w-4" />
                                    Type: <span className="text-foreground">{account.account_type?.name || account.type}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.visit("/account")} className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to List
                            </Button>
                            <Button onClick={() => router.visit(`/account/${account.id}/edit`)} className="gap-2">
                                <Edit className="h-4 w-4" /> Edit Account
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Stats Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="overflow-hidden border-primary/20 bg-primary/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        Financial Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase mb-1">Opening Balance</div>
                                        <div className="text-2xl font-bold text-primary">
                                            {formatCurrency(account.opening_balance)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary/10">
                                        <div>
                                            <div className="text-[10px] text-muted-foreground uppercase mb-1">Credit Limit</div>
                                            <div className="text-sm font-bold">{formatCurrency(account.credit_limit)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-muted-foreground uppercase mb-1">Aging Days</div>
                                            <div className="text-sm font-bold">{account.aging_days} Days</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Type-Specific Dynamic Summary */}
                            {renderFinancialSummary()}

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        Account Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Purchase</span>
                                        <Badge variant={account.purchase ? "secondary" : "outline"} className="text-[10px]">
                                            {account.purchase ? "Enabled" : "Disabled"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Cash / Bank</span>
                                        <Badge variant={account.cashbank ? "secondary" : "outline"} className="text-[10px]">
                                            {account.cashbank ? "Enabled" : "Disabled"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Sale</span>
                                        <Badge variant={account.sale ? "secondary" : "outline"} className="text-[10px]">
                                            {account.sale ? "Enabled" : "Disabled"}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Assignments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase mb-1 font-semibold">Salesman</div>
                                        <div className="text-sm font-medium">{account.saleman?.name || "Not assigned"}</div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase mb-1 font-semibold">Booker</div>
                                        <div className="text-sm font-medium">{account.booker?.name || "Not assigned"}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Areas */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        Identity & Contact Info
                                    </CardTitle>
                                    <CardDescription>General information and contact points</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                        <InfoRow icon={Phone} label="Mobile" value={account.mobile} />
                                        <InfoRow icon={Phone} label="Telephone 1" value={account.telephone1} />
                                        <InfoRow icon={Phone} label="Telephone 2" value={account.telephone2} />
                                        <InfoRow icon={Phone} label="Fax" value={account.fax} />
                                        <InfoRow icon={CalendarIcon} label="Opening Date" value={formatDate(account.opening_date)} />
                                        <InfoRow icon={CalendarIcon} label="FBR Date" value={formatDate(account.fbr_date)} />
                                    </div>

                                    <div className="mt-4 space-y-1 px-3">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            Postal Address
                                        </div>
                                        <div className="text-sm mt-1 leading-relaxed">
                                            {account.address1 || "No address provided"}
                                            {account.address2 && <div className="mt-0.5">{account.address2}</div>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        Location Hierarchy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                                        <InfoRow label="Country" value={account.country?.name} />
                                        <InfoRow label="Province" value={account.province?.name} />
                                        <InfoRow label="City" value={account.city?.name} />
                                        <InfoRow label="Area" value={account.area?.name} />
                                        <InfoRow label="Sub Area" value={account.subarea?.name} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Tax & Professional Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                        <InfoRow label="GST #" value={account.gst} />
                                        <InfoRow label="NTN #" value={account.ntn} />
                                        <InfoRow label="CNIC #" value={account.cnic} />
                                        <InfoRow label="Note Head" value={account.note_head} />
                                        <InfoRow label="Category" value={account.category} />
                                        <InfoRow label="Item Category" value={account.item_category} />
                                        <div className="md:col-span-2">
                                            <InfoRow label="A.T.S Info" value={account.ats_type ? `${account.ats_type} (${account.ats_percentage}%)` : null} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Remarks/Regards Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-muted/30 border-dashed">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Remarks</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                                            {account.remarks || "No supplementary remarks found for this account."}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/30 border-dashed">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Regards / Additional Info</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                                            {account.regards || "No complementary details available."}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
