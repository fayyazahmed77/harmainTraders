import React, { useState } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import {
    ShoppingCart,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    MessageCircle,
    RefreshCw,
    Edit3,
    Check,
    X,
    UserCheck,
    Building2,
    MapPin,
    Phone,
    FileText,
    ArrowLeft,
    Send,
    Trash2,
    Plus,
    Search,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    business_name: string | null;
    city: string | null;
    address: string | null;
    approval_status: "pending" | "approved" | "rejected" | string;
    account_id: number | null;
    account?: {
        id: number;
        code: string;
        title: string;
    } | null;
}

interface ItemStockBalance {
    balance_pcs: number;
    balance_carton: number;
}

interface OrderItem {
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    retail_price: number | null;
    subtotal: number;
    item?: {
        id: number;
        name: string;
        code: string;
        packing: number;
    };
    stock_balance?: ItemStockBalance | null;
}

interface RevisionItem {
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    retail_price: number;
    subtotal: number;
}

interface Revision {
    id: number;
    revision_number: number;
    status: "Pending" | "Accepted" | "Rejected";
    subtotal: number;
    discount_type: "none" | "fixed" | "percentage";
    discount_rate: number;
    discount_amount: number;
    delivery_charges: number;
    payable_amount: number;
    notes: string;
    customer_remarks: string | null;
    created_at: string;
    responded_at: string | null;
    items: RevisionItem[];
}

interface HistoryEntry {
    id: number;
    action: string;
    previous_status: string | null;
    new_status: string | null;
    actor_type: string;
    description: string;
    reason: string | null;
    created_at: string;
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
    cancellation_reason: string | null;
    sale_id: number | null;
    customer_user: CustomerUser;
    items: OrderItem[];
    revisions: Revision[];
    histories: HistoryEntry[];
    sale?: {
        id: number;
        invoice: string;
        net_total: number;
        extra_discount?: number;
        total_receivable?: number;
        courier_charges?: number;
    } | null;
}

interface Props {
    order: OnlineOrder;
    whatsappDirectLink?: string | null;
    stockBalances?: Record<number, any>;
}

interface RevItem {
    item_id: number;
    item_name: string;
    item_code: string;
    packing: number;
    qty_carton: number;
    qty_pcs: number;
    quantity: number;
    unit_price: number;
    retail_price: number;
    available_stock_pcs: number;
}

export default function OnlineOrderShow({ order, whatsappDirectLink, stockBalances }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Daily", href: "/sales" },
        { title: "Online Orders", href: "/online-orders" },
        { title: `#${order.order_no}`, href: `/online-orders/${order.id}` },
    ];

    // Modals state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [cancelSubmitting, setCancelSubmitting] = useState(false);

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmDiscountType, setConfirmDiscountType] = useState<string>(order.discount_type || "none");
    const [confirmDiscountRate, setConfirmDiscountRate] = useState<number>(order.discount_rate || 0);
    const [confirmDeliveryCharges, setConfirmDeliveryCharges] = useState<number>(order.delivery_charges || 0);
    const [confirmSubmitting, setConfirmSubmitting] = useState(false);

    const buildDefaultRevItems = (): RevItem[] => {
        return (order.items || []).map((i: any) => {
            const productMeta = i.item || i.product;
            const packing = Math.max(
                1,
                Number(productMeta?.packing_size ?? productMeta?.packing ?? productMeta?.packing_qty ?? 1) || 1
            );
            const totalPcs = Number(i.total_pcs ?? i.quantity ?? 0);
            const qtyCarton = i.qty_carton !== undefined && i.qty_carton !== null
                ? Number(i.qty_carton)
                : Math.floor(totalPcs / packing);
            const qtyPcs = i.qty_pcs !== undefined && i.qty_pcs !== null
                ? Number(i.qty_pcs)
                : (totalPcs % packing);
            const unitPrice = Number(i.unit_price ?? i.price_piece ?? 0);
            const rawStock = i.available_stock_pcs ?? i.stock_balance?.balance_pcs;
            const liveStock = typeof rawStock === "number" ? rawStock : parseFloat(rawStock || "0");

            return {
                item_id: i.product_id || i.item_id,
                item_name: productMeta?.title || productMeta?.name || i.item_name_snapshot || i.item_name,
                item_code: productMeta?.code || i.item_code_snapshot || "",
                packing: packing,
                qty_carton: qtyCarton,
                qty_pcs: qtyPcs,
                quantity: (qtyCarton * packing) + qtyPcs,
                unit_price: unitPrice,
                retail_price: Number(i.retail_price || productMeta?.retail_price || 0),
                available_stock_pcs: isNaN(liveStock) ? 0 : liveStock,
            };
        });
    };

    const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
    const [revItems, setRevItems] = useState<RevItem[]>(buildDefaultRevItems);
    const [revDiscountType, setRevDiscountType] = useState<string>(order.discount_type || "none");
    const [revDiscountRate, setRevDiscountRate] = useState<number>(order.discount_rate || 0);
    const [revDelivery, setRevDelivery] = useState<number>(order.delivery_charges || 0);
    const [revNotes, setRevNotes] = useState("");
    const [revSubmitting, setRevSubmitting] = useState(false);

    // Product search state for revision modal
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchDebounceRef = React.useRef<any>(null);

    const openRevisionModal = () => {
        if (revItems.length === 0) {
            setRevItems(buildDefaultRevItems());
        }
        setRevisionDialogOpen(true);
    };

    // Handlers
    const handleStartReview = () => {
        router.post(`/online-orders/${order.id}/start-review`, {}, { preserveScroll: true });
    };

    const handleCancelSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellationReason.trim()) return;
        setCancelSubmitting(true);
        router.post(
            `/online-orders/${order.id}/cancel`,
            { cancellation_reason: cancellationReason },
            {
                onFinish: () => {
                    setCancelSubmitting(false);
                    setCancelDialogOpen(false);
                },
            }
        );
    };

    const handleConfirmSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmSubmitting(true);
        router.post(
            `/online-orders/${order.id}/confirm`,
            {
                discount_type: confirmDiscountType,
                discount_rate: confirmDiscountRate,
                delivery_charges: confirmDeliveryCharges,
            },
            {
                onFinish: () => {
                    setConfirmSubmitting(false);
                    setConfirmDialogOpen(false);
                },
            }
        );
    };

    const handleRevisionCartonChange = (index: number, cartons: number) => {
        const updated = [...revItems];
        const item = { ...updated[index] };
        const ctn = Math.max(0, cartons);
        item.qty_carton = ctn;
        item.quantity = (ctn * item.packing) + item.qty_pcs;
        updated[index] = item;
        setRevItems(updated);
    };

    const handleRevisionPcsChange = (index: number, pcs: number) => {
        const updated = [...revItems];
        const item = { ...updated[index] };
        const p = Math.max(0, pcs);
        item.qty_pcs = p;
        item.quantity = (item.qty_carton * item.packing) + p;
        updated[index] = item;
        setRevItems(updated);
    };

    const handleRevisionPriceChange = (index: number, newPrice: number) => {
        const updated = [...revItems];
        updated[index] = { ...updated[index], unit_price: Math.max(0, newPrice) };
        setRevItems(updated);
    };

    const handleRemoveRevisionItem = (index: number) => {
        if (revItems.length <= 1) {
            alert("Revision must contain at least 1 item. You cannot remove all items.");
            return;
        }
        setRevItems(revItems.filter((_, i) => i !== index));
    };

    const handleAddRevisionItem = (product: any) => {
        const existingIndex = revItems.findIndex((it) => it.item_id === product.id);
        if (existingIndex >= 0) {
            handleRevisionCartonChange(existingIndex, revItems[existingIndex].qty_carton + 1);
            setSearchQuery("");
            setSearchResults([]);
            setIsSearchOpen(false);
            return;
        }

        const packing = Math.max(1, Number(product.packing || 1) || 1);
        const rate = Number(product.sale_rate || product.trade_price || product.retail_price || 0);
        const newItem: RevItem = {
            item_id: product.id,
            item_name: product.title,
            item_code: product.code,
            packing: packing,
            qty_carton: 1,
            qty_pcs: 0,
            quantity: 1 * packing,
            unit_price: rate,
            retail_price: Number(product.retail_price || 0),
            available_stock_pcs: Number(product.available_stock_pcs || 0),
        };
        setRevItems([...revItems, newItem]);
        setSearchQuery("");
        setSearchResults([]);
        setIsSearchOpen(false);
    };

    const handleSearchInput = (val: string) => {
        setSearchQuery(val);
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        if (!val.trim()) {
            setSearchResults([]);
            setIsSearchOpen(false);
            return;
        }
        setIsSearching(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/online-orders/search-items?query=${encodeURIComponent(val.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                    setIsSearchOpen(true);
                }
            } catch (err) {
                console.error("Failed to search items", err);
            } finally {
                setIsSearching(false);
            }
        }, 250);
    };

    const handleRevisionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!revNotes.trim()) return;
        if (revItems.length === 0) {
            alert("Revision must contain at least 1 item.");
            return;
        }
        setRevSubmitting(true);
        router.post(
            `/online-orders/${order.id}/revision`,
            {
                items: revItems.map((item) => ({
                    product_id: item.item_id,
                    item_id: item.item_id,
                    qty_carton: item.qty_carton,
                    qty_pcs: item.qty_pcs,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    change_reason: revNotes,
                })),
                discount_type: revDiscountType,
                discount_rate: revDiscountRate,
                delivery_charges: revDelivery,
                change_reason: revNotes,
                notes: revNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRevSubmitting(false);
                    setRevisionDialogOpen(false);
                    setRevNotes("");
                },
                onError: (errors) => {
                    setRevSubmitting(false);
                    console.error("Revision submission error:", errors);
                },
                onFinish: () => {
                    setRevSubmitting(false);
                },
            }
        );
    };

    // Derived totals for confirmation dialog preview
    const calcSubtotal = order.subtotal;
    let calcDiscount = 0;
    if (confirmDiscountType === "percentage" && confirmDiscountRate > 0) {
        calcDiscount = Math.round(((calcSubtotal * confirmDiscountRate) / 100) * 100) / 100;
    } else if (confirmDiscountType === "fixed" && confirmDiscountRate > 0) {
        calcDiscount = Math.min(calcSubtotal, confirmDiscountRate);
    }
    const calcPayable = Math.max(0, calcSubtotal - calcDiscount + Number(confirmDeliveryCharges));

    // Revision derived totals
    const revSubtotal = revItems.reduce((acc, it) => acc + it.quantity * it.unit_price, 0);
    let revDiscountAmt = 0;
    if (revDiscountType === "percentage" && revDiscountRate > 0) {
        revDiscountAmt = Math.round(((revSubtotal * revDiscountRate) / 100) * 100) / 100;
    } else if (revDiscountType === "fixed" && revDiscountRate > 0) {
        revDiscountAmt = Math.min(revSubtotal, revDiscountRate);
    }
    const revPayable = Math.max(0, revSubtotal - revDiscountAmt + Number(revDelivery));

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <Head title={`Order #${order.order_no} - Online Orders`} />

                <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/online-orders"
                                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mr-1"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                    Order #{order.order_no}
                                </h1>
                                <Badge
                                    className={`px-3 py-1 text-xs font-bold ${
                                        order.status === "confirmed"
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                            : order.status === "canceled"
                                            ? "bg-rose-100 text-rose-800 border-rose-300"
                                            : order.status === "awaiting_customer_acceptance"
                                            ? "bg-orange-100 text-orange-800 border-orange-300"
                                            : order.status === "under_review"
                                            ? "bg-sky-100 text-sky-800 border-sky-300"
                                            : "bg-amber-100 text-amber-800 border-amber-300"
                                    }`}
                                >
                                    {order.status.replace(/_/g, " ").toUpperCase()}
                                </Badge>
                            </div>
                            <p className="text-xs text-zinc-500">
                                Submitted on{" "}
                                {new Date(order.submitted_at).toLocaleString("en-PK", {
                                    dateStyle: "full",
                                    timeStyle: "short",
                                })}
                            </p>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {whatsappDirectLink && (
                                <a
                                    href={whatsappDirectLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-sm"
                                    >
                                        <MessageCircle className="w-4 h-4 mr-1.5" />
                                        WhatsApp Customer
                                    </Button>
                                </a>
                            )}

                            {order.status === "pending" && (
                                <Button
                                    size="sm"
                                    onClick={handleStartReview}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs h-9 shadow-sm"
                                >
                                    <RefreshCw className="w-4 h-4 mr-1.5" />
                                    Start Review
                                </Button>
                            )}

                            {["pending", "under_review"].includes(order.status) && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={openRevisionModal}
                                        className="text-orange-700 border-orange-300 hover:bg-orange-50 font-semibold text-xs h-9"
                                    >
                                        <Edit3 className="w-4 h-4 mr-1.5" />
                                        Propose Revision
                                    </Button>

                                    <Button
                                        size="sm"
                                        onClick={() => setConfirmDialogOpen(true)}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-9 shadow-sm"
                                    >
                                        <Check className="w-4 h-4 mr-1.5" />
                                        Confirm into ERP Sale
                                    </Button>
                                </>
                            )}

                            {order.status === "awaiting_customer_acceptance" && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center text-xs font-bold text-orange-800 bg-orange-100 border border-orange-300 rounded-lg px-3 py-1.5 shadow-sm">
                                        <Clock className="w-3.5 h-3.5 mr-1.5 text-orange-600 animate-pulse" />
                                        Awaiting Customer Acceptance (Revision #{order.revision_number})
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={openRevisionModal}
                                        className="text-orange-700 border-orange-300 hover:bg-orange-50 font-semibold text-xs h-9"
                                    >
                                        <Edit3 className="w-4 h-4 mr-1.5" />
                                        Update Proposal
                                    </Button>
                                </div>
                            )}

                            {!["confirmed", "canceled"].includes(order.status) && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCancelDialogOpen(true)}
                                    className="text-rose-600 border-rose-300 hover:bg-rose-50 font-semibold text-xs h-9"
                                >
                                    <X className="w-4 h-4 mr-1.5" />
                                    Cancel Order
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Customer & ERP Status Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Customer Information Card */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    Customer Details
                                </span>
                                {(() => {
                                    const status = String(order.customer_user.approval_status || "").toLowerCase();
                                    if (status === "approved") {
                                        return (
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                                Approved
                                            </Badge>
                                        );
                                    }
                                    if (status === "rejected") {
                                        return (
                                            <Badge className="bg-rose-100 text-rose-800 border-rose-300">
                                                Rejected
                                            </Badge>
                                        );
                                    }
                                    return (
                                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                            Pending Approval
                                        </Badge>
                                    );
                                })()}
                            </div>

                            <div className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                                {order.customer_user.name}
                            </div>

                            <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                    <span>{order.customer_user.mobile}</span>
                                </div>
                                {order.customer_user.business_name && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                        <span>{order.customer_user.business_name}</span>
                                    </div>
                                )}
                                {order.customer_user.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                                        <span>
                                            {order.customer_user.address}
                                            {order.customer_user.city ? `, ${order.customer_user.city}` : ""}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Linked ERP Account Card */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                ERP Chart of Accounts Link
                            </span>

                            {order.customer_user.account ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Linked to Customer Account</span>
                                    </div>
                                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                            {order.customer_user.account.title}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            Code: {order.customer_user.account.code} (ID: #{order.customer_user.account.id})
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Not Linked to ERP Account</span>
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        Customer must be approved and linked to an ERP account before order confirmation.
                                    </p>
                                    <Link href="/customers/approvals">
                                        <Button size="sm" variant="outline" className="w-full text-xs h-8">
                                            Manage Customer Linkage
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* ERP Sales Invoice Status */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                ERP Sales Invoice
                            </span>

                            {order.sale ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Confirmed ERP Sale</span>
                                    </div>
                                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-base text-emerald-900 dark:text-emerald-100">
                                                {order.sale.invoice}
                                            </span>
                                            <Badge className="bg-emerald-600 text-white border-0 text-[10px] px-2 py-0.5">
                                                Confirmed
                                            </Badge>
                                        </div>
                                        <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                            Final Payable: Rs. {Number(order.sale.total_receivable ?? (order.sale.net_total - (order.sale.extra_discount || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        {Number(order.sale.extra_discount || 0) > 0 && (
                                            <div className="text-[11px] text-zinc-500">
                                                (Gross + Delivery: Rs. {Number(order.sale.net_total).toLocaleString(undefined, { minimumFractionDigits: 2 })} | Discount: -Rs. {Number(order.sale.extra_discount).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="text-xs text-zinc-500">
                                        Staged in online order pipeline. Stock and general ledger are untouched.
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {order.status === "awaiting_customer_acceptance"
                                            ? "Awaiting customer approval of revised quantities/prices."
                                            : "Awaiting administrator confirmation into finalized ERP Sale."}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Remarks Banner (if any) */}
                    {order.customer_remarks && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3">
                            <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                    Customer Remarks:
                                </span>
                                <p className="text-sm text-amber-900 dark:text-amber-200 mt-0.5">
                                    {order.customer_remarks}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Cancellation Reason Banner (if canceled) */}
                    {order.status === "canceled" && (
                        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300">
                                    Order Cancellation Reason:
                                </span>
                                <p className="text-sm text-rose-900 dark:text-rose-200 mt-0.5">
                                    {order.cancellation_reason || "No reason specified."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Staged Items Table */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                                    Order Items ({order.items.length})
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    Real-time warehouse stock checked against live ERP stock balances.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Product Name</th>
                                        <th className="px-4 py-3">Live Stock</th>
                                        <th className="px-4 py-3 text-right">Unit Price</th>
                                        <th className="px-4 py-3 text-right">Order Qty</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {order.items.map((item, idx) => {
                                        const rawStock = (item as any).available_stock_pcs ?? item.stock_balance?.balance_pcs;
                                        const liveStock = typeof rawStock === 'number' ? rawStock : parseFloat(rawStock || '0');
                                        const hasEnough = liveStock >= item.quantity;
                                        const productMeta = item.item || (item as any).product;
                                        return (
                                            <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                                <td className="px-4 py-3.5 text-zinc-400 text-xs">{idx + 1}</td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                        {item.item_name}
                                                    </div>
                                                    {productMeta && (
                                                        <div className="text-xs text-zinc-400">
                                                            Code: {productMeta.code} | Packing: {productMeta.packing ?? productMeta.packing_qty ?? 1} pcs
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Badge
                                                        className={`text-xs px-2 py-0.5 font-bold ${
                                                            liveStock < 0
                                                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                                                : liveStock === 0
                                                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                                                : !hasEnough
                                                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                        }`}
                                                    >
                                                        {liveStock < 0
                                                            ? `${liveStock} pcs (Deficit)`
                                                            : liveStock === 0
                                                            ? "0 pcs (Out of Stock)"
                                                            : `${liveStock} pcs in stock`}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-medium text-zinc-700 dark:text-zinc-300">
                                                    Rs. {Number(item.unit_price).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                                                    {item.quantity} pcs
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                                                    Rs. {Number(item.subtotal).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Totals Breakdown */}
                        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                            <div className="text-xs text-zinc-500 space-y-1">
                                <div>• Pending & Staged orders do not affect warehouse stock.</div>
                                <div>• Stock deduction occurs atomically when confirmed into an ERP sale.</div>
                            </div>

                            <div className="w-full sm:w-72 space-y-2 text-sm">
                                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        Rs. {Number(order.subtotal).toLocaleString()}
                                    </span>
                                </div>

                                {Number(order.discount_amount) > 0 && (
                                    <div className="flex justify-between text-rose-600">
                                        <span>
                                            Discount{" "}
                                            {order.discount_type === "percentage" ? `(${order.discount_rate}%)` : ""}:
                                        </span>
                                        <span className="font-semibold">
                                            -Rs. {Number(order.discount_amount).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {Number(order.delivery_charges) > 0 && (
                                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                                        <span>Delivery Charges:</span>
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            +Rs. {Number(order.delivery_charges).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-zinc-300 dark:border-zinc-700 flex justify-between font-black text-lg text-emerald-800 dark:text-emerald-300">
                                    <span>Final Payable:</span>
                                    <span>Rs. {Number(order.payable_amount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revisions & Audit History */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revisions List */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                                Revision History ({order.revisions.length})
                            </h3>

                            {order.revisions.length === 0 ? (
                                <p className="text-xs text-zinc-400">No revisions have been proposed for this order.</p>
                            ) : (
                                <div className="space-y-3">
                                    {order.revisions.map((rev) => (
                                        <div
                                            key={rev.id}
                                            className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                    Revision #{rev.revision_number}
                                                </span>
                                                <Badge
                                                    className={
                                                        String(rev.status || "").toLowerCase() === "accepted"
                                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                            : String(rev.status || "").toLowerCase() === "rejected"
                                                            ? "bg-rose-100 text-rose-800 border-rose-300"
                                                            : "bg-amber-100 text-amber-800 border-amber-300"
                                                    }
                                                >
                                                    {String(rev.status || "").toLowerCase() === "accepted"
                                                        ? "Accepted by Customer"
                                                        : String(rev.status || "").toLowerCase() === "rejected"
                                                        ? "Rejected by Customer"
                                                        : "Awaiting Customer Acceptance"}
                                                </Badge>
                                            </div>
                                            {rev.notes && (
                                                <div className="text-zinc-700 dark:text-zinc-300">
                                                    <span className="font-semibold text-zinc-500">Proposal Notes:</span> {rev.notes}
                                                </div>
                                            )}
                                            {rev.items && rev.items.length > 0 && (
                                                <div className="bg-white dark:bg-zinc-900/80 rounded-lg p-2.5 border border-zinc-200 dark:border-zinc-700 space-y-1">
                                                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Proposed Item Adjustments:</span>
                                                    {rev.items.map((it) => (
                                                        <div key={it.id} className="flex justify-between text-[11px] text-zinc-700 dark:text-zinc-300">
                                                            <span>{it.quantity}x {it.item_name} @ Rs. {Number(it.unit_price).toLocaleString()}</span>
                                                            <span className="font-semibold">Rs. {Number(it.subtotal).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-1 font-bold text-zinc-900 dark:text-zinc-100">
                                                <span>Proposed Payable:</span>
                                                <span className="text-emerald-700 dark:text-emerald-400">Rs. {Number(rev.payable_amount).toLocaleString()}</span>
                                            </div>
                                            {rev.customer_remarks && (
                                                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[11px]">
                                                    <strong>Customer Feedback:</strong> {rev.customer_remarks}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Audit Log / Timeline */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                                Order Activity Timeline
                            </h3>

                            <div className="space-y-3">
                                {order.histories.map((hist) => (
                                    <div key={hist.id} className="flex gap-3 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        <div className="space-y-0.5">
                                            <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                {hist.description}
                                            </div>
                                            <div className="text-zinc-400 text-[11px]">
                                                {new Date(hist.created_at).toLocaleString("en-PK", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}{" "}
                                                by {hist.actor_type}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel Dialog */}
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel Online Order #{order.order_no}</DialogTitle>
                            <DialogDescription>
                                Please provide a clear reason for cancellation. This will be recorded and shared with the customer.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCancelSubmit} className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-semibold text-zinc-700">
                                    Cancellation Reason <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    placeholder="e.g. Out of stock, Customer requested cancellation, Invalid address..."
                                    className="w-full text-sm mt-1 p-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCancelDialogOpen(false)}
                                    disabled={cancelSubmitting}
                                >
                                    Close
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-rose-600 hover:bg-rose-700 text-white"
                                    disabled={cancelSubmitting || !cancellationReason.trim()}
                                >
                                    {cancelSubmitting ? "Canceling..." : "Confirm Cancellation"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Confirm Dialog */}
                <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Confirm Order #{order.order_no} into ERP Sale</DialogTitle>
                            <DialogDescription>
                                This will create an authoritative ERP Sales invoice, deduct live inventory, and debit the customer ledger.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleConfirmSubmit} className="space-y-4 py-2">
                            {String(order.customer_user.approval_status || "").toLowerCase() !== "approved" && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
                                    Warning: Customer account is not Approved. Order cannot be confirmed until approved.
                                </div>
                            )}

                            {!order.customer_user.account_id && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
                                    Warning: Customer account is not linked to an ERP Chart of Accounts entry.
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-700">Discount Type</label>
                                    <select
                                        value={confirmDiscountType}
                                        onChange={(e) => setConfirmDiscountType(e.target.value)}
                                        className="w-full text-sm mt-1 p-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                                    >
                                        <option value="none">No Discount</option>
                                        <option value="fixed">Fixed Amount (Rs.)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-700">Discount Value</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={confirmDiscountRate}
                                        onChange={(e) => setConfirmDiscountRate(parseFloat(e.target.value) || 0)}
                                        disabled={confirmDiscountType === "none"}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-zinc-700">Delivery Charges (Rs.)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={confirmDeliveryCharges}
                                    onChange={(e) => setConfirmDeliveryCharges(parseFloat(e.target.value) || 0)}
                                    className="mt-1"
                                />
                            </div>

                            {/* Summary Calculation */}
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>Rs. {Number(calcSubtotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-rose-600">
                                    <span>Discount:</span>
                                    <span>-Rs. {Number(calcDiscount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Delivery Charges:</span>
                                    <span>+Rs. {Number(confirmDeliveryCharges).toLocaleString()}</span>
                                </div>
                                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-black text-sm text-emerald-800 dark:text-emerald-300">
                                    <span>Total Payable:</span>
                                    <span>Rs. {Number(calcPayable).toLocaleString()}</span>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setConfirmDialogOpen(false)}
                                    disabled={confirmSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={
                                        confirmSubmitting ||
                                        String(order.customer_user.approval_status || "").toLowerCase() !== "approved" ||
                                        !order.customer_user.account_id
                                    }
                                >
                                    {confirmSubmitting ? "Confirming..." : "Confirm & Create Sale"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Revision Dialog */}
                <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
                    <DialogContent className="w-[95vw] sm:max-w-5xl md:max-w-6xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-y-auto p-6">
                        <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                    <Edit3 className="w-4 h-4" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                        Propose Order Revision
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                                        Adjust carton/loose quantities, modify unit prices, or search & add items on customer request. The customer will review and approve these revisions.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleRevisionSubmit} className="space-y-4 py-2">
                            {/* Search & Add New Product */}
                            <div className="relative p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                        <Plus className="w-3.5 h-3.5 text-amber-600" />
                                        Add More Items on Customer Request
                                    </span>
                                    <span className="text-[11px] text-zinc-400">
                                        Type product name or code to search live catalog
                                    </span>
                                </div>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchInput(e.target.value)}
                                        onFocus={() => { if (searchResults.length > 0) setIsSearchOpen(true); }}
                                        placeholder="Search item by title or code (e.g. 'oil', 'cream', 'soap', 'PERFUME-016')..."
                                        className="pl-9 pr-8 h-9 text-xs bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600"
                                    />
                                    {isSearching && (
                                        <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-amber-600" />
                                    )}
                                </div>

                                {/* Autocomplete Search Dropdown */}
                                {isSearchOpen && searchResults.length > 0 && (
                                    <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {searchResults.map((prod) => (
                                            <div
                                                key={prod.id}
                                                onClick={() => handleAddRevisionItem(prod)}
                                                className="p-2.5 hover:bg-amber-50/70 dark:hover:bg-amber-950/30 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                        {prod.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                                                        <span className="font-mono text-zinc-400">Code: {prod.code}</span>
                                                        <span>•</span>
                                                        <span>Packing: <b>{prod.packing} pcs/ctn</b></span>
                                                        <span>•</span>
                                                        <span>Wholesale: <b className="text-emerald-700 dark:text-emerald-400">Rs. {Number(prod.sale_rate || prod.trade_price || 0).toLocaleString()}</b></span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 shrink-0">
                                                    <Badge
                                                        className={`text-[10px] px-2 py-0.5 font-bold ${
                                                            prod.available_stock_pcs <= 0
                                                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                                                : prod.available_stock_pcs < 20
                                                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                        }`}
                                                    >
                                                        {prod.available_stock_pcs <= 0 ? "0 stock" : `${prod.available_stock_pcs} pcs stock`}
                                                    </Badge>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1 px-2.5"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Add
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {isSearchOpen && searchResults.length === 0 && !isSearching && searchQuery.trim().length >= 2 && (
                                    <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl p-3 text-center text-xs text-zinc-500">
                                        No items found matching "{searchQuery}"
                                    </div>
                                )}
                            </div>

                            {/* Revised Items Table */}
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                <div className="bg-zinc-100/70 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                        Revised Items List ({revItems.length})
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        Total Pcs = (Carton × Packing) + Loose Pcs
                                    </span>
                                </div>
                                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 font-semibold uppercase tracking-wider text-[11px] z-10">
                                            <tr>
                                                <th className="px-3 py-2.5 w-8">#</th>
                                                <th className="px-3 py-2.5 min-w-[200px]">Product / Live Stock</th>
                                                <th className="px-3 py-2.5 text-center w-20">Packing</th>
                                                <th className="px-3 py-2.5 text-center w-24">Cartons</th>
                                                <th className="px-3 py-2.5 text-center w-24">Loose Pcs</th>
                                                <th className="px-3 py-2.5 text-center w-24">Total Pcs</th>
                                                <th className="px-3 py-2.5 text-right w-28">Unit Rate (Rs.)</th>
                                                <th className="px-3 py-2.5 text-right w-28">Subtotal</th>
                                                <th className="px-3 py-2.5 text-center w-12">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                                            {revItems.map((item, idx) => {
                                                const exceedsStock = item.available_stock_pcs !== undefined && item.quantity > item.available_stock_pcs;
                                                const itemSubtotal = item.quantity * item.unit_price;

                                                return (
                                                    <tr key={`${item.item_id}-${idx}`} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                                                        <td className="px-3 py-2.5 text-zinc-400 font-mono text-[11px]">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                                {item.item_name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {item.item_code && (
                                                                    <span className="text-[10px] text-zinc-400 font-mono">
                                                                        {item.item_code}
                                                                    </span>
                                                                )}
                                                                <Badge
                                                                    className={`text-[9px] px-1.5 py-0 font-semibold ${
                                                                        item.available_stock_pcs <= 0
                                                                            ? "bg-rose-100 text-rose-800 border-rose-200"
                                                                            : exceedsStock
                                                                            ? "bg-amber-100 text-amber-800 border-amber-300"
                                                                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                                    }`}
                                                                >
                                                                    {item.available_stock_pcs <= 0
                                                                        ? "0 stock"
                                                                        : `${item.available_stock_pcs} pcs stock`}
                                                                </Badge>
                                                                {exceedsStock && (
                                                                    <span className="text-[10px] text-amber-600 font-bold">
                                                                        ⚠️ Exceeds stock
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-zinc-600 dark:text-zinc-400 font-mono">
                                                            {item.packing} pcs
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={item.qty_carton}
                                                                onChange={(e) =>
                                                                    handleRevisionCartonChange(idx, parseInt(e.target.value) || 0)
                                                                }
                                                                className="w-20 h-8 text-center text-xs font-bold mx-auto"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={item.qty_pcs}
                                                                onChange={(e) =>
                                                                    handleRevisionPcsChange(idx, parseInt(e.target.value) || 0)
                                                                }
                                                                className="w-20 h-8 text-center text-xs font-bold mx-auto"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                                {item.quantity} pcs
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="any"
                                                                value={item.unit_price}
                                                                onChange={(e) =>
                                                                    handleRevisionPriceChange(idx, parseFloat(e.target.value) || 0)
                                                                }
                                                                className="w-24 h-8 text-right text-xs font-bold ml-auto"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                                                            Rs. {Number(itemSubtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveRevisionItem(idx)}
                                                                disabled={revItems.length <= 1}
                                                                title={revItems.length <= 1 ? "At least 1 item is required" : "Remove item"}
                                                                className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Revision Commercial Adjustments & Customer Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                Discount Type
                                            </label>
                                            <select
                                                value={revDiscountType}
                                                onChange={(e) => setRevDiscountType(e.target.value)}
                                                className="w-full text-xs mt-1 p-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                                            >
                                                <option value="none">No Discount</option>
                                                <option value="fixed">Fixed Amount (Rs.)</option>
                                                <option value="percentage">Percentage (%)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                                Discount Value
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={revDiscountRate}
                                                onChange={(e) => setRevDiscountRate(parseFloat(e.target.value) || 0)}
                                                disabled={revDiscountType === "none"}
                                                className="mt-1 h-8 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            Courier / Delivery Charges (Rs.)
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={revDelivery}
                                            onChange={(e) => setRevDelivery(parseFloat(e.target.value) || 0)}
                                            className="mt-1 h-8 text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            Revision Notes for Customer <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            required
                                            rows={2}
                                            value={revNotes}
                                            onChange={(e) => setRevNotes(e.target.value)}
                                            placeholder="e.g. Added requested extra items; adjusted packing quantities based on warehouse availability."
                                            className="w-full text-xs mt-1 p-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                                        />
                                    </div>
                                </div>

                                {/* Financial Summary Card */}
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between space-y-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Revised Commercial Breakdown
                                    </span>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                                            <span>Revised Items Subtotal:</span>
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                Rs. {Number(revSubtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {revDiscountAmt > 0 && (
                                            <div className="flex justify-between text-rose-600 font-semibold">
                                                <span>Special Discount ({revDiscountType === 'percentage' ? `${revDiscountRate}%` : 'Fixed'}):</span>
                                                <span>-Rs. {Number(revDiscountAmt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        {revDelivery > 0 && (
                                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                                                <span>Courier / Delivery Charges:</span>
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                    +Rs. {Number(revDelivery).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between items-center">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                Revised Final Payable:
                                            </span>
                                            <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                                                Rs. {Number(revPayable).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-[11px] text-zinc-400 italic">
                                        Notice: Sending this revision will place the order into 'Awaiting Customer Acceptance'. Warehouse stock and general ledger will remain safely untouched until customer accepts and order is confirmed.
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRevisionDialogOpen(false)}
                                    disabled={revSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                    disabled={revSubmitting || !revNotes.trim() || revItems.length === 0}
                                >
                                    {revSubmitting ? "Submitting..." : "Send Revision to Customer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    );
}

