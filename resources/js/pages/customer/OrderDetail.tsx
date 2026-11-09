import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import CustomerPortalLayout from "@/layouts/CustomerPortalLayout";
import {
    ShoppingCart,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    ArrowLeft,
    Check,
    X,
    FileText,
    MessageCircle,
    Download,
    ExternalLink,
    Receipt,
    Truck,
    Tag,
    MessageSquare,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
}

interface OrderItem {
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    retail_price: number | null;
    subtotal: number;
}

interface RevisionItem {
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

interface Revision {
    id: number;
    revision_number: number;
    status: "Pending" | "Accepted" | "Rejected";
    subtotal: number;
    discount_amount: number;
    delivery_charges: number;
    payable_amount: number;
    notes: string;
    created_at: string;
    items: RevisionItem[];
}

interface HistoryEntry {
    id: number;
    action: string;
    actor_type: string;
    description: string;
    created_at: string;
}

interface OnlineOrder {
    id: number;
    order_no: string;
    status: "pending" | "under_review" | "awaiting_customer_acceptance" | "confirmed" | "canceled" | string;
    subtotal: number;
    discount_type?: string;
    discount_rate?: number;
    discount_amount: number;
    delivery_charges: number;
    payable_amount: number;
    submitted_at: string;
    customer_remarks: string | null;
    customer_notes?: string | null;
    cancellation_reason: string | null;
    items: OrderItem[];
    revisions: Revision[];
    active_revision?: Revision | null;
    histories: HistoryEntry[];
    sale_id?: number | null;
    sale?: {
        id: number;
        invoice: string;
        net_total: number;
        status?: string;
    } | null;
}

interface Props {
    customer: CustomerUser;
    order: OnlineOrder;
}

export default function CustomerOrderDetail({ customer, order }: Props) {
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAcceptRevision = () => {
        if (confirm("Are you sure you want to accept the proposed order adjustments?")) {
            setIsSubmitting(true);
            router.post(
                `/customer/orders/${order.id}/accept-revision`,
                {},
                {
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    const handleRejectRevision = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(
            `/customer/orders/${order.id}/reject-revision`,
            { reason: rejectReason },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setRejectDialogOpen(false);
                },
            }
        );
    };

    const pendingRevision =
        order.active_revision ||
        order.revisions?.find(
            (r) =>
                r.status === "Pending" ||
                String((r as any).revision_status || "").toLowerCase() === "awaiting_customer_acceptance"
        );

    const whatsappAdminNumber = "923120000000"; // Haramain WhatsApp Support
    const whatsappHelpUrl = `https://wa.me/${whatsappAdminNumber}?text=${encodeURIComponent(
        `Assalam-o-Alaikum, I have an inquiry regarding my Online Order #${order.order_no} (Customer: ${customer.name}, Mobile: ${customer.mobile}).`
    )}`;

    return (
        <CustomerPortalLayout customer={customer}>
            <Head title={`Order #${order.order_no} - Haramain Traders`} />

            <div className="space-y-6">
                {/* Order Top Banner */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/customer/orders"
                            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                                    Order #{order.order_no}
                                </span>
                                <Badge
                                    className={
                                        order.status === "confirmed"
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 capitalize text-[11px]"
                                            : order.status === "canceled"
                                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 capitalize text-[11px]"
                                            : order.status === "awaiting_customer_acceptance"
                                            ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 capitalize text-[11px]"
                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 capitalize text-[11px]"
                                    }
                                >
                                    {order.status.replace(/_/g, " ")}
                                </Badge>
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                                Submitted on{" "}
                                {new Date(order.submitted_at).toLocaleDateString("en-PK", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </div>
                        </div>
                    </div>

                    <a href={whatsappHelpUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 rounded-xl font-bold shadow-sm">
                            <MessageCircle className="w-4 h-4 mr-1.5" />
                            WhatsApp Support
                        </Button>
                    </a>
                </div>
                {/* Active Revision Banner */}
                {order.status === "awaiting_customer_acceptance" && pendingRevision && (
                    <div className="p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-300 dark:border-orange-700 shadow-md space-y-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="font-black text-base text-orange-950 dark:text-orange-100">
                                    Action Required: Order Revision Proposed
                                </h3>
                                <p className="text-xs sm:text-sm text-orange-900 dark:text-orange-200">
                                    Our team has reviewed your order and proposed updates to quantities, discounts, or delivery.
                                </p>
                            </div>
                        </div>

                        {pendingRevision.notes && (
                            <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 border border-orange-200">
                                <span className="font-bold text-orange-800 dark:text-orange-300">Note from sales team: </span>
                                {pendingRevision.notes}
                            </div>
                        )}

                        {/* Revised Items List & Financials */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-orange-200 p-4 space-y-3 text-xs">
                            <span className="font-bold uppercase tracking-wider text-zinc-500">Proposed Item Adjustments:</span>
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {pendingRevision.items?.map((revIt) => (
                                    <div key={revIt.id} className="py-2 flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                {revIt.item_name || (revIt as any).item_name_snapshot}
                                            </span>
                                            <div className="text-[11px] text-zinc-400">
                                                {(revIt as any).qty_carton !== undefined && Number((revIt as any).qty_carton) > 0
                                                    ? `${(revIt as any).qty_carton} ctn + ${Number((revIt as any).qty_pcs || 0)} pcs (${revIt.quantity || (revIt as any).total_pcs} pcs)`
                                                    : `${revIt.quantity || (revIt as any).total_pcs} pcs`}
                                                {" "}@ Rs. {Number(revIt.unit_price || (revIt as any).price_piece).toLocaleString()}
                                            </div>
                                        </div>
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                            Rs. {Number(revIt.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                                <div className="flex justify-between">
                                    <span>Proposed Subtotal:</span>
                                    <span className="font-semibold">Rs. {Number(pendingRevision.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                {Number(pendingRevision.discount_amount) > 0 && (
                                    <div className="flex justify-between text-rose-600 font-semibold">
                                        <span>Special Discount Applied:</span>
                                        <span>-Rs. {Number(pendingRevision.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {Number(pendingRevision.delivery_charges) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Delivery Charges:</span>
                                        <span>+Rs. {Number(pendingRevision.delivery_charges).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-black text-sm text-emerald-700 dark:text-emerald-400">
                                    <span>Revised Total Payable:</span>
                                    <span>Rs. {Number(pendingRevision.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Decision Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Button
                                onClick={handleAcceptRevision}
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 shadow-sm"
                            >
                                <Check className="w-4 h-4 mr-1.5" />
                                Accept Revised Order
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setRejectDialogOpen(true)}
                                disabled={isSubmitting}
                                className="text-rose-600 border-rose-300 hover:bg-rose-50 text-xs h-9"
                            >
                                <X className="w-4 h-4 mr-1.5" />
                                Decline Revision
                            </Button>
                        </div>
                    </div>
                )}

                {/* Confirmed Invoice Notification & Actions */}
                {order.sale ? (
                    <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
                                <Receipt className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-base text-emerald-950 dark:text-emerald-100">
                                        Sales Invoice #{order.sale.invoice}
                                    </span>
                                    <Badge className="bg-emerald-600 text-white border-0 text-[11px] px-2 py-0.5">
                                        Confirmed
                                    </Badge>
                                </div>
                                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                                    Official ERP invoice generated. You can view or download the complete invoice PDF for your business records.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href={`/customer/orders/${order.order_no}/invoice-pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button size="sm" variant="outline" className="h-9 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/50">
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    View Invoice
                                </Button>
                            </a>
                            <a
                                href={`/customer/orders/${order.order_no}/invoice-pdf`}
                                download={`Invoice-${order.sale.invoice}.pdf`}
                            >
                                <Button size="sm" className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                    <Download className="w-3.5 h-3.5 mr-1.5" />
                                    Download PDF
                                </Button>
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-2.5">
                            <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span>
                                <strong>ERP Invoice Status:</strong> Order is currently{" "}
                                <span className="capitalize font-semibold text-zinc-800 dark:text-zinc-200">{order.status.replace(/_/g, " ")}</span>. The official sales invoice and download option will appear here once approved by our team.
                            </span>
                        </div>
                    </div>
                )}

                {/* Customer Instructions / Remarks Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                        <MessageSquare className="w-4 h-4 text-amber-500" />
                        <span>Order Instructions & Remarks</span>
                    </div>
                    <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-medium">
                        {order.customer_remarks || order.customer_notes ? (
                            <span>{order.customer_remarks || order.customer_notes}</span>
                        ) : (
                            <span className="text-zinc-400 italic">No special instructions or remarks provided for this order.</span>
                        )}
                    </div>
                </div>

                {/* Order Summary & Items Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Ordered Products</h3>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                        {order.items.map((item) => (
                            <div key={item.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{item.item_name}</div>
                                    <div className="text-xs text-zinc-400">
                                        Qty: {item.quantity} pcs × Rs. {Number(item.unit_price).toLocaleString()}
                                    </div>
                                </div>
                                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                    Rs. {Number(item.subtotal).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Financial Breakdown */}
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                            <span>Order Subtotal:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                Rs. {Number(order.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                            <span className="flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Courier / Delivery Charges:</span>
                            </span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {Number(order.delivery_charges) > 0 ? (
                                    `+Rs. ${Number(order.delivery_charges).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Rs. 0.00 (Standard / Free Delivery)</span>
                                )}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                            <span className="flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Discount Given by Admin:</span>
                                {Number(order.discount_rate) > 0 && (
                                    <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                                        {order.discount_rate}% OFF
                                    </span>
                                )}
                            </span>
                            <span className="font-semibold">
                                {Number(order.discount_amount) > 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                                        -Rs. {Number(order.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                ) : (
                                    <span className="text-zinc-400">Rs. 0.00</span>
                                )}
                            </span>
                        </div>

                        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <div className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">Total Payable Amount</div>
                                <div className="text-[11px] text-zinc-400">Inclusive of all applied discounts & delivery</div>
                            </div>
                            <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">
                                Rs. {Number(order.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Status Updates</h3>
                    <div className="space-y-3">
                        {order.histories.map((hist) => (
                            <div key={hist.id} className="flex gap-3 text-xs">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <div>
                                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        {hist.description}
                                    </div>
                                    <div className="text-zinc-400 text-[11px]">
                                        {new Date(hist.created_at).toLocaleString("en-PK", {
                                            day: "2-digit",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Decline Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline Proposed Revision</DialogTitle>
                        <DialogDescription>
                            Please let us know why you are declining the revised order (optional). Our team will review again.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRejectRevision} className="space-y-4 py-2">
                        <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Price is higher than expected, needed full quantity..."
                            className="w-full text-sm p-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRejectDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Confirm Decline"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CustomerPortalLayout>
    );
}

