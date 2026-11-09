import React, { useState } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import {
    ShoppingCart,
    Search,
    Calendar,
    Eye,
    MessageCircle,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowUpDown,
    Filter,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Daily", href: "/sales" },
    { title: "Online Orders", href: "/online-orders" },
];

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
    approval_status: "pending" | "approved" | "rejected" | string;
    account_id: number | null;
}

interface Sale {
    id: number;
    invoice: string;
    net_total: number;
    status: string;
}

interface OnlineOrder {
    id: number;
    order_no: string;
    customer_user_id: number;
    status: "pending" | "under_review" | "awaiting_customer_acceptance" | "confirmed" | "canceled";
    subtotal: number;
    discount_type: "none" | "fixed" | "percentage";
    discount_rate: number;
    discount_amount: number;
    delivery_charges: number;
    payable_amount: number;
    submitted_at: string;
    customer_remarks: string | null;
    customer_user?: CustomerUser;
    sale?: Sale | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    orders: PaginatedData<OnlineOrder>;
    filters: {
        tab: string;
        search: string;
        start_date: string | null;
        end_date: string | null;
    };
    counts: {
        all: number;
        pending: number;
        under_review: number;
        awaiting_customer_acceptance: number;
        confirmed: number;
        canceled: number;
    };
}

export default function OnlineOrdersIndex({ orders, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleTabChange = (tabKey: string) => {
        router.get(
            "/online-orders",
            {
                tab: tabKey,
                search: search || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            },
            { preserveState: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/online-orders",
            {
                tab: filters.tab,
                search: search || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        router.get("/online-orders", { tab: "all" });
    };

    const tabs = [
        { key: "all", label: "All Orders", count: counts.all },
        { key: "pending", label: "Pending", count: counts.pending, alert: counts.pending > 0 },
        { key: "under_review", label: "Under Review", count: counts.under_review },
        { key: "awaiting_customer_acceptance", label: "Awaiting Acceptance", count: counts.awaiting_customer_acceptance },
        { key: "confirmed", label: "Confirmed", count: counts.confirmed },
        { key: "canceled", label: "Canceled", count: counts.canceled },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-2.5 py-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            case "under_review":
                return (
                    <Badge className="bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 font-bold px-2.5 py-0.5">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Under Review
                    </Badge>
                );
            case "awaiting_customer_acceptance":
                return (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 font-bold px-2.5 py-0.5">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Awaiting Acceptance
                    </Badge>
                );
            case "confirmed":
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2.5 py-0.5">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Confirmed
                    </Badge>
                );
            case "canceled":
                return (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 font-bold px-2.5 py-0.5">
                        <XCircle className="w-3 h-3 mr-1" />
                        Canceled
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getApprovalBadge = (status?: string) => {
        const s = String(status || "").toLowerCase();
        if (s === "approved") {
            return (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Approved Customer
                </span>
            );
        }
        if (s === "rejected") {
            return (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200">
                    Rejected
                </span>
            );
        }
        return (
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200">
                Pending Approval
            </span>
        );
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <Head title="Online Orders Management" />

                <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                                <ShoppingCart className="h-4 w-4" />
                                <span>Online Commerce</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                                Online Orders
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Review, adjust, communicate, and confirm staged orders into ERP sales.
                            </p>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-px gap-2">
                        {tabs.map((tab) => {
                            const isActive = (filters.tab || "all") === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                        isActive
                                            ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg"
                                            : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:border-zinc-300"
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                            isActive
                                                ? "bg-emerald-600 text-white"
                                                : tab.alert
                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Filter Bar */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between"
                    >
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                type="text"
                                placeholder="Search Order #, Customer, Mobile..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 text-sm"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Date:</span>
                            </div>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-36 text-xs h-9"
                            />
                            <span className="text-zinc-400 text-xs">to</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-36 text-xs h-9"
                            />

                            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                                <Filter className="w-3.5 h-3.5 mr-1" />
                                Filter
                            </Button>

                            {(search || startDate || endDate || filters.tab !== "all") && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-9 text-xs"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </form>

                    {/* Orders Table */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3.5">Order Ref</th>
                                        <th className="px-4 py-3.5">Date & Time</th>
                                        <th className="px-4 py-3.5">Customer</th>
                                        <th className="px-4 py-3.5 text-right">Subtotal</th>
                                        <th className="px-4 py-3.5 text-right">Discount</th>
                                        <th className="px-4 py-3.5 text-right">Delivery</th>
                                        <th className="px-4 py-3.5 text-right">Payable</th>
                                        <th className="px-4 py-3.5 text-center">Status</th>
                                        <th className="px-4 py-3.5 text-center">ERP Sale</th>
                                        <th className="px-4 py-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {orders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-12 text-center text-zinc-500">
                                                No online orders found matching current criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.data.map((order) => (
                                            <tr
                                                key={order.id}
                                                className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                                                    order.status === "pending" ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                                                }`}
                                            >
                                                <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                                                    <Link
                                                        href={`/online-orders/${order.id}`}
                                                        className="text-emerald-600 hover:text-emerald-700 hover:underline"
                                                    >
                                                        {order.order_no}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-zinc-500">
                                                    {new Date(order.submitted_at).toLocaleDateString("en-PK", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {order.customer_user?.name || "Unknown"}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-zinc-500">
                                                            {order.customer_user?.mobile}
                                                        </span>
                                                        {getApprovalBadge(order.customer_user?.approval_status)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-medium text-zinc-700 dark:text-zinc-300">
                                                    Rs. {Number(order.subtotal).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-xs text-rose-600">
                                                    {Number(order.discount_amount) > 0
                                                        ? `-Rs. ${Number(order.discount_amount).toLocaleString()}`
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-xs text-zinc-600">
                                                    {Number(order.delivery_charges) > 0
                                                        ? `+Rs. ${Number(order.delivery_charges).toLocaleString()}`
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                    Rs. {Number(order.payable_amount).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {getStatusBadge(order.status)}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {order.sale ? (
                                                        <span className="inline-flex items-center text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300">
                                                            {order.sale.invoice}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <Link href={`/online-orders/${order.id}`}>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                                            Manage
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                                <div>
                                    Showing {orders.from} to {orders.to} of {orders.total} orders
                                </div>
                                <div className="flex gap-1">
                                    {orders.prev_page_url && (
                                        <Link href={orders.prev_page_url}>
                                            <Button size="sm" variant="outline" className="h-7 text-xs">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}
                                    {orders.next_page_url && (
                                        <Link href={orders.next_page_url}>
                                            <Button size="sm" variant="outline" className="h-7 text-xs">
                                                Next
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

