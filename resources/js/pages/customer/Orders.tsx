import React from "react";
import { Head, Link } from "@inertiajs/react";
import CustomerPortalLayout from "@/layouts/CustomerPortalLayout";
import {
    ShoppingCart,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    ArrowRight,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
    approval_status: "pending" | "approved" | "rejected" | string;
}

interface OrderItem {
    id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

interface OnlineOrder {
    id: number;
    order_no: string;
    status: "pending" | "under_review" | "awaiting_customer_acceptance" | "confirmed" | "canceled";
    subtotal: number;
    discount_amount: number;
    delivery_charges: number;
    payable_amount: number;
    submitted_at: string;
    items: OrderItem[];
    active_revision?: {
        id: number;
        revision_number: number;
        status: string;
        payable_amount: number;
    } | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    customer: CustomerUser;
    orders: PaginatedData<OnlineOrder>;
}

export default function CustomerOrders({ customer, orders }: Props) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold px-2.5 py-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Admin Review
                    </Badge>
                );
            case "under_review":
                return (
                    <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-bold px-2.5 py-0.5">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Under Review
                    </Badge>
                );
            case "awaiting_customer_acceptance":
                return (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-bold px-2.5 py-0.5 animate-pulse">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Action Required: Review Changes
                    </Badge>
                );
            case "confirmed":
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold px-2.5 py-0.5">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Order Confirmed
                    </Badge>
                );
            case "canceled":
                return (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold px-2.5 py-0.5">
                        <XCircle className="w-3 h-3 mr-1" />
                        Canceled
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <CustomerPortalLayout customer={customer}>
            <Head title="My Online Orders - Haramain Traders" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                            My Wholesale Orders
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Track the status of your online wholesale orders, review proposed adjustments, and view confirmed sales.
                        </p>
                    </div>

                    <Link href="/live-offers">
                        <Button className="h-10 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                            New Wholesale Order
                        </Button>
                    </Link>
                </div>

                {/* Account Status Alert if Pending */}
                {String(customer.approval_status).toLowerCase() === "pending" && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <div className="font-bold">Account Pending Approval</div>
                            <p className="mt-0.5">
                                Your initial order is currently being reviewed by our sales team. Subsequent orders can be placed once your account is verified and approved.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Order History</h1>
                        <p className="text-xs text-zinc-500 mt-0.5">Track the status of your online wholesale orders</p>
                    </div>
                    <span className="text-xs font-semibold text-zinc-400">{orders.total} orders placed</span>
                </div>

                {/* Orders List */}
                {orders.data.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
                        <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
                        <h3 className="font-bold text-base text-zinc-700 dark:text-zinc-300">No orders yet</h3>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                            You haven't submitted any orders yet. Browse active promotions and add products to your cart.
                        </p>
                        <Link href="/live-offers">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
                                Browse Live Offers
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.data.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all space-y-4"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="font-black text-lg text-zinc-900 dark:text-zinc-100">
                                            #{order.order_no}
                                        </div>
                                        {getStatusBadge(order.status)}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {new Date(order.submitted_at).toLocaleDateString("en-PK", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>

                                {/* Items Preview */}
                                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                    {order.items.slice(0, 3).map((it) => (
                                        <div key={it.id} className="flex justify-between">
                                            <span>
                                                {it.quantity}x {it.item_name}
                                            </span>
                                            <span className="font-semibold">Rs. {Number(it.subtotal).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {order.items.length > 3 && (
                                        <div className="text-[11px] text-zinc-400 italic">
                                            + {order.items.length - 3} more items...
                                        </div>
                                    )}
                                </div>

                                {/* Action Required Banner */}
                                {order.status === "awaiting_customer_acceptance" && (
                                    <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl flex items-center justify-between text-xs text-orange-900 dark:text-orange-200">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                                            <span>The team has proposed adjustments to quantities or prices.</span>
                                        </div>
                                        <Link href={`/customer/orders/${order.order_no}`}>
                                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs">
                                                Review Changes
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {/* Card Footer */}
                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-zinc-400">Payable Amount: </span>
                                        <span className="font-black text-base text-emerald-700 dark:text-emerald-400">
                                            Rs. {Number(order.payable_amount).toLocaleString()}
                                        </span>
                                    </div>

                                    <Link href={`/customer/orders/${order.order_no}`}>
                                        <Button size="sm" variant="outline" className="text-xs h-8">
                                            View Details
                                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CustomerPortalLayout>
    );
}

