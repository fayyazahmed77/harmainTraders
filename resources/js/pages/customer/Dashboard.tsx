import React from "react";
import { Head, Link } from "@inertiajs/react";
import CustomerPortalLayout from "@/layouts/CustomerPortalLayout";
import {
    Package,
    Clock,
    CheckCircle2,
    Receipt,
    Wallet,
    ArrowRight,
    Store,
    AlertCircle,
    TrendingUp,
    FileText,
    ExternalLink,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
    business_name?: string | null;
    approval_status: string;
    account_id?: number | null;
    account?: {
        id: number;
        code: string;
        title: string;
    } | null;
}

interface Metrics {
    total_orders: number;
    pending_orders: number;
    confirmed_orders: number;
    current_balance: number;
    due_bills_count: number;
    total_due_amount: number;
    paid_bills_count: number;
    is_linked: boolean;
}

interface OrderItem {
    id: number;
    item?: {
        title: string;
        code: string;
    };
}

interface RecentOrder {
    id: number;
    order_no: string;
    status: string;
    final_total: number;
    submitted_at: string;
    items?: OrderItem[];
}

interface RecentInvoice {
    id: number;
    invoice: string;
    date: string;
    total_receivable: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
}

interface Props {
    customer: CustomerUser;
    metrics: Metrics;
    recent_orders: RecentOrder[];
    recent_invoices: RecentInvoice[];
}

export default function CustomerDashboard({ customer, metrics, recent_orders, recent_invoices }: Props) {
    const isApproved = String(customer.approval_status || "").toLowerCase() === "approved";

    const getOrderStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
            case "submitted":
                return (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 text-[11px] font-bold">
                        <Clock className="w-3 h-3 mr-1" /> Pending Review
                    </Badge>
                );
            case "under_review":
                return (
                    <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border-sky-300 text-[11px] font-bold">
                        Under Review
                    </Badge>
                );
            case "awaiting_customer_acceptance":
                return (
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-300 text-[11px] font-bold animate-pulse">
                        <AlertCircle className="w-3 h-3 mr-1" /> Action Required
                    </Badge>
                );
            case "confirmed":
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed
                    </Badge>
                );
            case "canceled":
                return (
                    <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 text-[11px] font-bold">
                        Canceled
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <CustomerPortalLayout customer={customer}>
            <Head title="Customer Dashboard - Haramain Traders" />

            <div className="space-y-6 sm:space-y-8">
                {/* Welcome Card & Fast Action */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
                                Wholesale Account
                            </span>
                            {isApproved ? (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px] font-bold px-2 py-0.5">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified & Approved
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-[10px] font-bold px-2 py-0.5">
                                    <Clock className="w-3 h-3 mr-1" /> Pending Admin Approval
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                            Welcome back, {customer.name}!
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
                            {customer.business_name ? (
                                <>Managing wholesale operations for <strong className="text-zinc-700 dark:text-zinc-300">{customer.business_name}</strong>.</>
                            ) : (
                                <>Access live trade offers, review wholesale order status, and manage verified ERP sales invoices.</>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Link href="/live-offers" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-11 px-5 rounded-xl font-black text-xs uppercase bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20">
                                <Store className="w-4 h-4 mr-2" />
                                Browse Live Catalog
                            </Button>
                        </Link>
                        <Link href="/customer/orders" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold text-xs border-zinc-300 dark:border-zinc-700">
                                View My Orders
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Metric 1: Outstanding Balance */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Account Balance</span>
                            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                Rs. {Number(metrics.current_balance || metrics.total_due_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <span className="text-xs font-medium text-zinc-400 mt-1 block">
                                {metrics.due_bills_count > 0 
                                    ? `${metrics.due_bills_count} unpaid / due bill${metrics.due_bills_count > 1 ? 's' : ''}`
                                    : "All bills fully settled"}
                            </span>
                        </div>
                    </div>

                    {/* Metric 2: Active / Pending Orders */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Orders In Review</span>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                {metrics.pending_orders}
                            </div>
                            <span className="text-xs font-medium text-zinc-400 mt-1 block">
                                {metrics.pending_orders > 0 ? "Awaiting admin processing or revision" : "No orders pending action"}
                            </span>
                        </div>
                    </div>

                    {/* Metric 3: Confirmed Wholesale Orders */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Orders</span>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                {metrics.confirmed_orders}
                            </div>
                            <span className="text-xs font-medium text-zinc-400 mt-1 block">
                                Total wholesale orders: {metrics.total_orders}
                            </span>
                        </div>
                    </div>

                    {/* Metric 4: Paid ERP Invoices */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Settled Invoices</span>
                            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
                                <Receipt className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                {metrics.paid_bills_count}
                            </div>
                            <span className="text-xs font-medium text-zinc-400 mt-1 block">
                                {metrics.is_linked ? "Official ERP sales invoices" : "Pending account linkage"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Split: Recent Orders & Recent Invoices */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Left: Recent Online Orders */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-amber-500" />
                                <h2 className="font-black text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    Recent Wholesale Orders
                                </h2>
                            </div>
                            <Link href="/customer/orders" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                                View all ({metrics.total_orders}) <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {recent_orders.length === 0 ? (
                            <div className="py-12 text-center text-zinc-400 space-y-3">
                                <Package className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                                <p className="text-xs">You have not submitted any wholesale orders yet.</p>
                                <Link href="/live-offers">
                                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs mt-2">
                                        Explore Live Offers
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {recent_orders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/customer/orders/${order.order_no}`}
                                        className="py-3.5 flex items-center justify-between hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 px-2 rounded-xl transition-colors group"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600">
                                                    #{order.order_no}
                                                </span>
                                                {getOrderStatusBadge(order.status)}
                                            </div>
                                            <div className="text-[11px] text-zinc-400">
                                                {order.items?.length || 0} items • {new Date(order.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-black text-xs text-zinc-900 dark:text-zinc-100">
                                                Rs. {Number(order.final_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 group-hover:text-amber-600 flex items-center justify-end gap-0.5 mt-0.5">
                                                Details <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Recent ERP Invoices & Paid Bills */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-emerald-500" />
                                <h2 className="font-black text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    Official Sales Invoices
                                </h2>
                            </div>
                            <Link href="/customer/invoices" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                                View all <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {!metrics.is_linked ? (
                            <div className="py-12 text-center text-zinc-400 space-y-2">
                                <Receipt className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                    ERP Account Not Linked Yet
                                </p>
                                <p className="text-[11px] max-w-xs mx-auto">
                                    Once our administration links your registration to your ERP ledger, all historical and confirmed invoices will appear here.
                                </p>
                            </div>
                        ) : recent_invoices.length === 0 ? (
                            <div className="py-12 text-center text-zinc-400 space-y-2">
                                <Receipt className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                                <p className="text-xs">No official sales invoices generated yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {recent_invoices.map((inv) => {
                                    const isPaid = Number(inv.remaining_amount) <= 0.005;
                                    return (
                                        <div
                                            key={inv.id}
                                            className="py-3.5 flex items-center justify-between hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 px-2 rounded-xl transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                        {inv.invoice}
                                                    </span>
                                                    {isPaid ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px] px-1.5 py-0 font-bold">
                                                            Paid
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 text-[10px] px-1.5 py-0 font-bold">
                                                            Due
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-zinc-400">
                                                    Date: {new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-black text-xs text-zinc-900 dark:text-zinc-100">
                                                        Rs. {Number(inv.total_receivable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                    {!isPaid && (
                                                        <span className="text-[10px] text-rose-600 font-bold block">
                                                            Due: Rs. {Number(inv.remaining_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>

                                                <a
                                                    href={`/customer/invoices/${inv.id}/pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-white transition-colors text-zinc-600 dark:text-zinc-400"
                                                    title="View PDF"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CustomerPortalLayout>
    );
}

