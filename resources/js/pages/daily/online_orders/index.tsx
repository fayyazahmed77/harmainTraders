import React, { useState, useMemo } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { cn } from "@/lib/utils";
import {
    ShoppingCart,
    Search,
    Calendar as CalendarIcon,
    Eye,
    Edit2,
    MessageCircle,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Filter,
    RefreshCw,
    MoreHorizontal,
    Printer,
    FileText,
    ArrowUpDown,
    ArrowUpRight,
    Activity,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    DollarSign,
    Package,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Daily", href: "/sales" },
    { title: "Online Orders", href: "/online-orders" },
];

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
    approval_status?: string;
    account_id?: number | null;
    business_name?: string | null;
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
    status: "pending" | "under_review" | "awaiting_customer_acceptance" | "confirmed" | "canceled" | string;
    subtotal: number;
    current_subtotal?: number;
    original_subtotal?: number;
    discount_type?: "none" | "fixed" | "percentage" | string;
    discount_rate?: number;
    discount_amount?: number;
    delivery_charges?: number;
    payable_amount: number;
    final_total?: number;
    submitted_at: string;
    customer_remarks?: string | null;
    customer_notes?: string | null;
    customer_user?: CustomerUser;
    sale?: Sale | null;
    items_count?: number;
    items?: any[];
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
        customer_user_id?: string | number | null;
        net_total?: string | null;
    };
    counts: {
        all: number;
        pending: number;
        under_review: number;
        awaiting_customer_acceptance: number;
        confirmed: number;
        canceled: number;
    };
    summary?: {
        total_orders: number;
        total_value: number;
        pending_orders: number;
        pending_value: number;
        under_review_orders: number;
        under_review_value: number;
        confirmed_orders: number;
        confirmed_value: number;
        canceled_orders: number;
        canceled_value?: number;
        weekly_trend?: {
            date: string;
            submitted: number;
            confirmed: number;
            count: number;
        }[];
    };
    customers?: CustomerUser[];
}

const FieldWrapper = ({
    label,
    children,
    className = "",
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`relative ${className}`}>
        <label className="absolute -top-2 left-3 px-1.5 bg-card text-[10px] font-bold uppercase tracking-wider text-muted-foreground z-10 leading-none">
            {label}
        </label>
        <div>{children}</div>
    </div>
);

export default function OnlineOrdersIndex({ orders, filters, counts, summary, customers = [] }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [netTotal, setNetTotal] = useState(filters.net_total || "");
    const [selectedCustomer, setSelectedCustomer] = useState<string>(
        filters.customer_user_id ? String(filters.customer_user_id) : "all"
    );
    const [customerPopupOpen, setCustomerPopupOpen] = useState(false);
    const [custSearch, setCustSearch] = useState("");

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });

    // Cancellation modal state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [targetOrder, setTargetOrder] = useState<OnlineOrder | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelSubmitting, setCancelSubmitting] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
            .format(amount || 0)
            .replace("PKR", "")
            .trim();
    };

    const activeCustomer = useMemo(
        () => customers.find((c) => String(c.id) === String(selectedCustomer)),
        [customers, selectedCustomer]
    );

    const filteredCusts = useMemo(() => {
        const term = custSearch.trim().toLowerCase();
        if (!term) return customers;
        return customers.filter(
            (c) =>
                c.name?.toLowerCase().includes(term) ||
                c.business_name?.toLowerCase().includes(term) ||
                c.mobile?.toLowerCase().includes(term) ||
                c.username?.toLowerCase().includes(term)
        );
    }, [customers, custSearch]);

    // Matrix Metrics Calculations
    const totalOrdersValue = Number(summary?.total_value || 0);
    const confirmedValue = Number(summary?.confirmed_value || 0);
    const pendingValue = Number(summary?.pending_value || 0);
    const underReviewValue = Number(summary?.under_review_value || 0);
    const canceledValue = Number(summary?.canceled_value || 0);

    // Active pipeline value excludes canceled orders for accurate fulfillment rate
    const activeTotalValue = Math.max(0, totalOrdersValue - canceledValue);
    const fulfillmentRate =
        activeTotalValue > 0
            ? Math.min(100, Math.max(0, Math.round((confirmedValue / activeTotalValue) * 100)))
            : counts.all - counts.canceled > 0
            ? Math.min(100, Math.round((counts.confirmed / (counts.all - counts.canceled)) * 100))
            : 0;

    const weeklyData = useMemo(() => {
        if (summary?.weekly_trend && summary.weekly_trend.length > 0) {
            return summary.weekly_trend;
        }
        return [];
    }, [summary]);

    const applyFilters = (overrides: Record<string, any> = {}) => {
        const startStr =
            overrides.start_date !== undefined
                ? overrides.start_date
                : dateRange?.from
                ? format(dateRange.from, "yyyy-MM-dd")
                : undefined;
        const endStr =
            overrides.end_date !== undefined
                ? overrides.end_date
                : dateRange?.to
                ? format(dateRange.to, "yyyy-MM-dd")
                : undefined;
        const custStr =
            overrides.customer_user_id !== undefined
                ? overrides.customer_user_id
                : selectedCustomer === "all" || !selectedCustomer
                ? undefined
                : selectedCustomer;

        router.get(
            "/online-orders",
            {
                tab: overrides.tab !== undefined ? overrides.tab : filters.tab,
                search: (overrides.search !== undefined ? overrides.search : search) || undefined,
                net_total: (overrides.net_total !== undefined ? overrides.net_total : netTotal) || undefined,
                start_date: startStr || undefined,
                end_date: endStr || undefined,
                customer_user_id: custStr || undefined,
                page: 1,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleTabChange = (tabKey: string) => {
        applyFilters({ tab: tabKey });
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleResetFilters = () => {
        setSearch("");
        setNetTotal("");
        setDateRange(undefined);
        setSelectedCustomer("all");
        setCustSearch("");
        router.get("/online-orders", { tab: filters.tab }, { preserveState: true });
    };

    const openCancelModal = (order: OnlineOrder) => {
        setTargetOrder(order);
        setCancelReason("");
        setCancelDialogOpen(true);
    };

    const handleConfirmCancel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetOrder || !cancelReason.trim()) return;

        setCancelSubmitting(true);
        router.post(
            `/online-orders/${targetOrder.id}/cancel`,
            { cancellation_reason: cancelReason },
            {
                onFinish: () => {
                    setCancelSubmitting(false);
                    setCancelDialogOpen(false);
                },
            }
        );
    };

    const openWhatsApp = (order: OnlineOrder) => {
        const mobile = order.customer_user?.mobile;
        if (!mobile) {
            alert("No registered mobile number found for this customer.");
            return;
        }

        const cleanMobile = mobile.replace(/[^0-9]/g, "");
        const formattedMobile = cleanMobile.startsWith("0") ? "92" + cleanMobile.slice(1) : cleanMobile;
        const total = Number(order.final_total || order.payable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
        const portalUrl = `${window.location.origin}/customer/orders/${order.order_no}`;

        const text = `Assalam-o-Alaikum ${order.customer_user?.name || "Customer"},\n\n` +
            `Your Online Order #${order.order_no} status: ${order.status.toUpperCase()}.\n` +
            `Net Payable Amount: Rs. ${total}\n\n` +
            `View your Order & Invoice details here:\n${portalUrl}\n\n` +
            `Thank you for choosing Haramain Traders!`;

        window.open(`https://wa.me/${formattedMobile}?text=${encodeURIComponent(text)}`, "_blank");
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 min-w-0 overflow-x-hidden">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <Head title="Online Orders - Haramain Traders" />

                <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 min-w-0">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1 tracking-tight">Online Orders Dashboard</h1>
                            <p className="text-sm text-muted-foreground">
                                Review submitted customer orders, edit products & pricing, and confirm into ERP Sales.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleTabChange("pending")}
                                className={filters.tab === "pending" ? "border-orange-500 text-orange-600 bg-orange-50 font-bold" : ""}
                            >
                                <Clock className="w-4 h-4 mr-1.5 text-orange-500" />
                                Pending Orders ({counts.pending})
                            </Button>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════ */}
                    {/* ── ONLINE ORDER PIPELINE MATRIX (Tailored for B2B Portal Orders) ─ */}
                    {/* ══════════════════════════════════════════════════════════════════ */}
                    <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-4 md:p-6 overflow-hidden">
                        {/* Top Pro-Bar: Pipeline Conversion & Fulfillment Rate */}
                        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-950/30 rounded-xl p-3.5 px-5 flex flex-col lg:flex-row items-center justify-between gap-4 mb-5 border border-orange-500/15">
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="h-10 w-10 rounded-xl bg-background border border-orange-500/20 flex items-center justify-center shadow-xs">
                                    <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight text-foreground">
                                        B2B Portal Order Pipeline
                                    </p>
                                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-black tracking-widest uppercase italic">
                                        {counts.pending > 0
                                            ? `${counts.pending} Pending Action`
                                            : "All Queues Clear"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 w-full lg:max-w-md">
                                <div className="flex justify-between items-center mb-1.5 px-1">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                        Order-to-Sale Confirmation Rate
                                    </span>
                                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400">
                                        {fulfillmentRate}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-background rounded-full p-[1px] border border-border/60">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${fulfillmentRate}%` }}
                                    />
                                </div>
                            </div>

                            <div className="hidden lg:flex items-center gap-4 text-muted-foreground border-l border-border pl-5 h-7">
                                <div className="text-right">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                        Total Orders
                                    </div>
                                    <div className="text-xs font-black text-foreground">
                                        {counts.all} Orders
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground pl-3 border-l border-border">
                                    <CalendarIcon className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="text-[10px] font-black tracking-tight uppercase">
                                        7-Day Velocity
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3-Column Matrix Cockpit Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                            {/* BLOCK 1: TOTAL PORTAL ORDER VALUE & CONFIRMED REVENUE */}
                            <div className="min-w-0 flex flex-col bg-orange-500/5 dark:bg-orange-950/20 rounded-xl p-4 xl:p-5 border border-orange-500/15 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 h-32 w-32 bg-orange-500/10 rounded-full blur-3xl opacity-60 group-hover:scale-150 transition-transform duration-1000" />
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-sm">
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20">
                                        {counts.all} Total Orders
                                    </span>
                                </div>
                                <p className="text-[9px] xl:text-[10px] font-black text-orange-700/80 dark:text-orange-400 uppercase tracking-[0.14em] mb-1">
                                    Total Portal Order Volume
                                </p>
                                <h3 className="text-2xl xl:text-3xl font-black text-foreground tracking-tight leading-none mb-3 uppercase truncate">
                                    Rs {formatCurrency(totalOrdersValue)}{" "}
                                    <span className="text-xs font-bold opacity-40">PKR</span>
                                </h3>
                                <div className="mt-auto space-y-2 relative z-10">
                                    <div className="flex items-center justify-between px-0.5">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                                            Confirmed ERP Sales ({counts.confirmed})
                                        </span>
                                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase font-mono">
                                            Rs {formatCurrency(confirmedValue)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between bg-background/70 backdrop-blur-xs p-2.5 rounded-xl border border-border/60">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                                            Active Review Queue ({counts.pending + counts.under_review + counts.awaiting_customer_acceptance})
                                        </span>
                                        <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 flex items-center font-mono">
                                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                            Rs {formatCurrency(pendingValue + underReviewValue)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 2: ORDER FULFILLMENT BREAKDOWN (RADIAL GAUGE + PIPELINE ROWS) */}
                            <div className="min-w-0 flex flex-col rounded-xl p-4 xl:p-5 border border-amber-500/15 bg-amber-500/5 dark:bg-amber-950/15 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[9px] xl:text-[10px] font-black uppercase tracking-[0.14em] text-amber-700/80 dark:text-amber-400">
                                        Order Queue Breakdown
                                    </p>
                                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shadow-xs bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 xl:gap-4 my-auto p-0.5 min-w-0">
                                    <div className="relative h-20 w-20 xl:h-24 xl:w-24 shrink-0">
                                        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                            <circle
                                                className="stroke-amber-500/15"
                                                cx="18"
                                                cy="18"
                                                r="15.9155"
                                                strokeWidth="3.2"
                                                fill="none"
                                            />
                                            <circle
                                                className="stroke-orange-500 transition-all duration-1000 ease-out"
                                                cx="18"
                                                cy="18"
                                                r="15.9155"
                                                strokeWidth="3.2"
                                                strokeDasharray={`${fulfillmentRate}, 100`}
                                                strokeLinecap="round"
                                                fill="none"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-base xl:text-xl font-black leading-none text-foreground">
                                                {fulfillmentRate}%
                                            </span>
                                            <span className="text-[7px] font-black text-muted-foreground uppercase tracking-tighter mt-0.5">
                                                Confirmed
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full min-w-0 space-y-1.5">
                                        <div className="flex justify-between items-center border-b border-amber-500/15 pb-1">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Pending ({counts.pending})
                                            </span>
                                            <span className="text-[11px] xl:text-xs font-black text-orange-600 dark:text-orange-400 font-mono">
                                                Rs {formatCurrency(pendingValue)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-amber-500/15 pb-1">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                                In Review ({counts.under_review + counts.awaiting_customer_acceptance})
                                            </span>
                                            <span className="text-[11px] xl:text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                                                Rs {formatCurrency(underReviewValue)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-0.5">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                                                Canceled ({counts.canceled})
                                            </span>
                                            <span className="text-xs font-black text-rose-500 font-mono italic">
                                                Rs {formatCurrency(canceledValue)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 3: 7-DAY ORDER VELOCITY CHART (SUBMITTED VS CONFIRMED) */}
                            <div className="min-w-0 flex flex-col bg-muted/20 border border-border rounded-xl p-4 xl:p-5 relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div>
                                        <p className="text-[9px] xl:text-[10px] font-black text-muted-foreground uppercase tracking-[0.14em] flex items-center">
                                            <Activity className="h-3 w-3 mr-1 text-orange-500" /> Order Velocity Matrix
                                        </p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">
                                            Submitted vs Confirmed (Last 7 Days)
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider leading-none">
                                                Submitted
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider leading-none">
                                                Confirmed
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-h-[125px] relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={weeklyData}>
                                            <defs>
                                                <linearGradient id="orderSubmittedBar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.95} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.15} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="var(--border)"
                                                opacity={0.5}
                                            />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fontSize: 8,
                                                    fontWeight: 700,
                                                    fill: "var(--muted-foreground)",
                                                }}
                                                dy={5}
                                            />
                                            <YAxis hide />
                                            <RechartsTooltip
                                                cursor={{ fill: "var(--muted)", opacity: 0.12 }}
                                                contentStyle={{
                                                    backgroundColor: "var(--card)",
                                                    borderRadius: "0.5rem",
                                                    border: "1px solid var(--border)",
                                                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                                    fontSize: "10px",
                                                }}
                                                formatter={(value: any, name: any) => [
                                                    `Rs ${formatCurrency(Number(value))}`,
                                                    name === "submitted" ? "Submitted" : "Confirmed",
                                                ]}
                                            />
                                            <Bar
                                                dataKey="submitted"
                                                fill="url(#orderSubmittedBar)"
                                                radius={[4, 4, 0, 0]}
                                                barSize={12}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="confirmed"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                dot={{
                                                    r: 2.5,
                                                    fill: "#10b981",
                                                    strokeWidth: 1,
                                                    stroke: "var(--card)",
                                                }}
                                                activeDot={{ r: 4, strokeWidth: 0 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Tabs Navigation */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                        {[
                            { key: "all", label: "All Orders", count: counts.all },
                            { key: "pending", label: "Pending", count: counts.pending, highlight: true },
                            {
                                key: "under_review",
                                label: "Under Review / Edited",
                                count: counts.under_review + counts.awaiting_customer_acceptance,
                            },
                            { key: "confirmed", label: "Confirmed Sales", count: counts.confirmed },
                            { key: "canceled", label: "Canceled", count: counts.canceled },
                        ].map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => handleTabChange(t.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    filters.tab === t.key
                                        ? "bg-orange-600 text-white shadow-sm"
                                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                                }`}
                            >
                                <span>{t.label}</span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                        filters.tab === t.key
                                            ? "bg-orange-700 text-white"
                                            : t.highlight && t.count > 0
                                            ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-extrabold"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                                    }`}
                                >
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════ */}
                    {/* ── ENHANCED FILTER BAR (Order No, Searchable Customer, 2-Date Picker, Net Total) ─ */}
                    {/* ══════════════════════════════════════════════════════════════════ */}
                    <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-4 sm:p-5">
                        <form
                            onSubmit={handleFilterSubmit}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end"
                        >
                            {/* 1. Order No / Search Input */}
                            <FieldWrapper label="Order No / Keyword" className="lg:col-span-3">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="ORD-2026..., Customer, Mobile"
                                        className="pl-8 pr-7 h-10 text-xs font-semibold bg-background border-border"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch("");
                                                applyFilters({ search: "" });
                                            }}
                                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </FieldWrapper>

                            {/* 2. Searchable Customer Dropdown */}
                            <FieldWrapper label="Select Customer" className="lg:col-span-3">
                                <Popover open={customerPopupOpen} onOpenChange={setCustomerPopupOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            className="w-full h-10 justify-between font-semibold text-xs bg-background border-border hover:bg-accent px-3"
                                        >
                                            <span className="truncate">
                                                {selectedCustomer === "all" || !activeCustomer
                                                    ? "All Customers"
                                                    : `${activeCustomer.name}${
                                                          activeCustomer.mobile ? ` (${activeCustomer.mobile})` : ""
                                                      }`}
                                            </span>
                                            <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0 shadow-xl border-border" align="start">
                                        <div className="p-2 border-b bg-muted/40">
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                                                <Input
                                                    placeholder="Search customer name, business, or mobile..."
                                                    value={custSearch}
                                                    onChange={(e) => setCustSearch(e.target.value)}
                                                    className="h-8 pl-8 text-xs"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[260px] overflow-auto py-1">
                                            <button
                                                type="button"
                                                className={cn(
                                                    "flex w-full items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors",
                                                    selectedCustomer === "all" && "bg-accent text-accent-foreground"
                                                )}
                                                onClick={() => {
                                                    setSelectedCustomer("all");
                                                    setCustomerPopupOpen(false);
                                                    setCustSearch("");
                                                    applyFilters({ customer_user_id: "" });
                                                }}
                                            >
                                                <span>All Customers</span>
                                                {selectedCustomer === "all" && (
                                                    <Check className="w-3.5 h-3.5 text-orange-600" />
                                                )}
                                            </button>
                                            {filteredCusts.length === 0 ? (
                                                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                                    No matching customer found.
                                                </div>
                                            ) : (
                                                filteredCusts.map((customer) => {
                                                    const isSel = String(customer.id) === String(selectedCustomer);
                                                    return (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            className={cn(
                                                                "flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-accent transition-colors text-left",
                                                                isSel && "bg-accent text-accent-foreground font-bold"
                                                            )}
                                                            onClick={() => {
                                                                const idStr = String(customer.id);
                                                                setSelectedCustomer(idStr);
                                                                setCustomerPopupOpen(false);
                                                                setCustSearch("");
                                                                applyFilters({ customer_user_id: idStr });
                                                            }}
                                                        >
                                                            <div className="min-w-0 pr-2">
                                                                <div className="font-semibold truncate">
                                                                    {customer.name}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground font-mono truncate">
                                                                    {customer.mobile || "No Mobile"}
                                                                    {customer.business_name &&
                                                                    customer.business_name !== customer.name
                                                                        ? ` • ${customer.business_name}`
                                                                        : ""}
                                                                </div>
                                                            </div>
                                                            {isSel && (
                                                                <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </FieldWrapper>

                            {/* 3. Single Unified Date Range Input (Select 2 Dates) */}
                            <FieldWrapper label="Order Date Range (From – To)" className="lg:col-span-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-between text-left font-semibold h-10 text-xs border-border bg-background hover:bg-accent px-3",
                                                !dateRange?.from && "text-muted-foreground"
                                            )}
                                        >
                                            <span className="flex items-center truncate">
                                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-orange-500 shrink-0" />
                                                <span className="truncate">
                                                    {dateRange?.from ? (
                                                        dateRange.to ? (
                                                            <>
                                                                {format(dateRange.from, "dd MMM yyyy")} –{" "}
                                                                {format(dateRange.to, "dd MMM yyyy")}
                                                            </>
                                                        ) : (
                                                            format(dateRange.from, "dd MMM yyyy")
                                                        )
                                                    ) : (
                                                        "Select Start & End Date"
                                                    )}
                                                </span>
                                            </span>
                                            {dateRange?.from && (
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDateRange(undefined);
                                                        applyFilters({ start_date: "", end_date: "" });
                                                    }}
                                                    className="ml-1 text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={(range) => {
                                                setDateRange(range);
                                                if (range?.from && range?.to) {
                                                    applyFilters({
                                                        start_date: format(range.from, "yyyy-MM-dd"),
                                                        end_date: format(range.to, "yyyy-MM-dd"),
                                                    });
                                                }
                                            }}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FieldWrapper>

                            {/* 4. Net Total Amount Filter */}
                            <FieldWrapper label="Net Total Amount" className="lg:col-span-2">
                                <div className="relative">
                                    <span className="text-[10px] font-black text-muted-foreground absolute left-3 top-3">
                                        Rs
                                    </span>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={netTotal}
                                        onChange={(e) => setNetTotal(e.target.value)}
                                        placeholder="e.g. 29904"
                                        className="pl-8 pr-7 h-10 text-xs font-mono font-semibold bg-background border-border"
                                    />
                                    {netTotal && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNetTotal("");
                                                applyFilters({ net_total: "" });
                                            }}
                                            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </FieldWrapper>

                            {/* 5. Filter & Reset Buttons */}
                            <div className="lg:col-span-1 flex items-center gap-1.5">
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-10 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex-1 shadow-xs"
                                    title="Apply Filters"
                                >
                                    <Filter className="w-3.5 h-3.5 sm:mr-1" />
                                    <span className="hidden xl:inline">Filter</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-10 w-10 p-0 text-xs shrink-0"
                                    title="Reset All Filters"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Data Table with Orange Header (Matching Sales DataTable) */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                    <TableRow className="border-b-0 hover:bg-transparent">
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3">Date</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3">Order No</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3">Customer</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3 text-center">Items</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3 text-right">Gross Total</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3 text-right">Discount</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3 text-right">Net Total</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3 text-center">Status</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-3.5 px-3 text-center w-20">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.data.length > 0 ? (
                                        orders.data.map((order) => {
                                            const subtotal = Number(order.current_subtotal || order.subtotal || order.original_subtotal || 0);
                                            const discount = Number(order.discount_amount || 0);
                                            const netTotal = Number(order.final_total || order.payable_amount || (subtotal - discount));
                                            const itemsCount = order.items_count ?? (order.items ? order.items.length : 1);

                                            return (
                                                <TableRow
                                                    key={order.id}
                                                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors border-b border-zinc-100 dark:border-zinc-800 text-xs"
                                                >
                                                    {/* Date */}
                                                    <TableCell className="py-3 px-3 whitespace-nowrap">
                                                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                                            {new Date(order.submitted_at).toLocaleDateString("en-PK", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </div>
                                                        <div className="text-[11px] text-zinc-400">
                                                            Time: {new Date(order.submitted_at).toLocaleTimeString("en-PK", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </div>
                                                    </TableCell>

                                                    {/* Order No */}
                                                    <TableCell className="py-3 px-3 whitespace-nowrap">
                                                        <Link
                                                            href={`/online-orders/${order.id}`}
                                                            className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-orange-600 transition-colors"
                                                        >
                                                            {order.order_no}
                                                        </Link>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200">
                                                                ONLINE
                                                            </span>
                                                            {(order as any).revision_number > 0 && (
                                                                <span className="text-[10px] text-zinc-400">
                                                                    Rev #{(order as any).revision_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Customer */}
                                                    <TableCell className="py-3 px-3">
                                                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 max-w-[220px] truncate">
                                                            {order.customer_user?.name || "Customer"}
                                                            {order.customer_user?.business_name && (
                                                                <span className="text-zinc-400 font-normal ml-1">
                                                                    ({order.customer_user.business_name})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-zinc-500">
                                                            Mobile: {order.customer_user?.mobile || "N/A"}
                                                        </div>
                                                    </TableCell>

                                                    {/* Items */}
                                                    <TableCell className="py-3 px-3 text-center font-mono font-medium">
                                                        {itemsCount}
                                                    </TableCell>

                                                    {/* Gross Total */}
                                                    <TableCell className="py-3 px-3 text-right font-mono font-semibold">
                                                        {subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                                    </TableCell>

                                                    {/* Discount */}
                                                    <TableCell className="py-3 px-3 text-right font-mono">
                                                        {discount > 0 ? (
                                                            <span className="text-rose-600 font-bold">
                                                                -{discount.toLocaleString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-400">0</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Net Total */}
                                                    <TableCell className="py-3 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                                        {netTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                                    </TableCell>

                                                    {/* Status Badge */}
                                                    <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                                                        {order.status === "confirmed" ? (
                                                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-bold px-2 py-0.5 text-[11px]">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Confirmed
                                                            </Badge>
                                                        ) : order.status === "canceled" ? (
                                                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 font-bold px-2 py-0.5 text-[11px]">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Canceled
                                                            </Badge>
                                                        ) : order.status === "pending" ? (
                                                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 font-bold px-2 py-0.5 text-[11px] animate-pulse">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                Pending
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 font-bold px-2 py-0.5 text-[11px]">
                                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                                Under Review
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    {/* Actions Dropdown */}
                                                    <TableCell className="py-3 px-3 text-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-52 text-xs font-medium">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/online-orders/${order.id}`} className="cursor-pointer">
                                                                        <Eye className="w-4 h-4 mr-2 text-zinc-500" />
                                                                        View Order
                                                                    </Link>
                                                                </DropdownMenuItem>

                                                                {!["confirmed", "canceled"].includes(order.status) && (
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/online-orders/${order.id}/edit`} className="cursor-pointer font-bold text-orange-600">
                                                                            <Edit2 className="w-4 h-4 mr-2 text-orange-500" />
                                                                            Propose Revision / Edit
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuItem onClick={() => openWhatsApp(order)} className="cursor-pointer text-emerald-600">
                                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                                    WhatsApp Customer
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem asChild>
                                                                    <a
                                                                        href={`/online-orders/${order.id}/invoice-pdf`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Printer className="w-4 h-4 mr-2 text-zinc-500" />
                                                                        Print Order Invoice
                                                                    </a>
                                                                </DropdownMenuItem>

                                                                {!["confirmed", "canceled"].includes(order.status) && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => openCancelModal(order)}
                                                                            className="cursor-pointer text-rose-600 hover:text-rose-700"
                                                                        >
                                                                            <XCircle className="w-4 h-4 mr-2" />
                                                                            Cancel Order
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                                                No online orders found in this view.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer (Matching Sales DataTable style) */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-muted-foreground">
                            <div>
                                Showing <strong>{orders.from || 0}</strong> to <strong>{orders.to || 0}</strong> of <strong>{orders.total}</strong> orders
                            </div>
                            <div className="flex items-center gap-2">
                                {orders.prev_page_url ? (
                                    <Link href={orders.prev_page_url} preserveState>
                                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                                            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                                            Previous
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 px-3 text-xs opacity-50">
                                        <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                                        Previous
                                    </Button>
                                )}

                                <span className="font-semibold px-2">
                                    Page {orders.current_page} of {orders.last_page}
                                </span>

                                {orders.next_page_url ? (
                                    <Link href={orders.next_page_url} preserveState>
                                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                                            Next
                                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 px-3 text-xs opacity-50">
                                        Next
                                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel Order Dialog */}
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel Online Order #{targetOrder?.order_no}</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel this online order? Please provide a reason for the record.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleConfirmCancel} className="space-y-4 py-2">
                            <textarea
                                rows={3}
                                required
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Reason for cancellation (e.g. Out of stock, customer requested cancellation)..."
                                className="w-full text-xs p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
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
                                    disabled={cancelSubmitting || !cancelReason.trim()}
                                >
                                    {cancelSubmitting ? "Canceling..." : "Confirm Cancellation"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
