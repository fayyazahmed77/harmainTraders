import React, { useState, useEffect, useRef } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import {
    UserCheck,
    Search,
    Check,
    X,
    Link as LinkIcon,
    PlusCircle,
    Building2,
    Phone,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Clock,
    UserPlus,
    Users,
    KeyRound,
    MessageCircle,
    Copy,
    ShieldAlert,
    ShieldCheck,
    Power,
    RefreshCw,
    ExternalLink,
    Filter,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Setup", href: "/account" },
    { title: "Customer Approvals", href: "/customers/approvals" },
];

interface AccountSummary {
    id: number;
    code: string;
    title: string;
    mobile?: string;
    address1?: string;
    city_id?: number;
    city?: { id: number; name: string } | null;
    customer_user?: {
        id: number;
        username: string;
        mobile: string;
        is_active: boolean;
        approval_status: string;
    } | null;
}

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
    email: string | null;
    business_name: string | null;
    city: string | null;
    address: string | null;
    approval_status: "pending" | "approved" | "rejected" | string;
    rejection_reason: string | null;
    account_id: number | null;
    is_active: boolean;
    must_change_password: boolean;
    registered_via: "self_registered" | "erp_linked" | string;
    created_at: string;
    account?: AccountSummary | null;
    approver?: {
        id: number;
        name: string;
    } | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links?: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    customers: PaginatedData<CustomerUser>;
    filters: {
        tab: string;
        search: string;
        origin?: string;
        access?: string;
    };
    counts: {
        all: number;
        pending: number;
        approved: number;
        rejected: number;
        erp_linked: number;
        disabled: number;
    };
}

export default function CustomerApprovalsIndex({ customers, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || "");

    // ─── ERP Selector Dialog State ──────────────────────────────────────────────
    const [erpModalOpen, setErpModalOpen] = useState(false);
    const [erpSearchQuery, setErpSearchQuery] = useState("");
    const [erpMobileFilter, setErpMobileFilter] = useState<"all" | "with_mobile" | "no_mobile">("all");
    const [erpPage, setErpPage] = useState(1);
    const [erpAccounts, setErpAccounts] = useState<PaginatedData<AccountSummary> | null>(null);
    const [erpLoading, setErpLoading] = useState(false);
    const [selectedErpAccountIds, setSelectedErpAccountIds] = useState<number[]>([]);
    const [selectedErpMap, setSelectedErpMap] = useState<Record<number, AccountSummary>>({});
    const [customMobiles, setCustomMobiles] = useState<Record<number, string>>({});
    const [provisioningSubmitting, setProvisioningSubmitting] = useState(false);

    // ─── Generated Credentials Modal State ──────────────────────────────────────
    const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState<any[]>([]);
    const [provisionSummary, setProvisionSummary] = useState<any>(null);
    const [skippedAccounts, setSkippedAccounts] = useState<any[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // ─── Link ERP Dialog State ──────────────────────────────────────────────────
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [activeCustomer, setActiveCustomer] = useState<CustomerUser | null>(null);
    const [accountSearchQuery, setAccountSearchQuery] = useState("");
    const [accountSearchResults, setAccountSearchResults] = useState<AccountSummary[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [linkSubmitting, setLinkSubmitting] = useState(false);

    // ─── Reject Dialog State ────────────────────────────────────────────────────
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    // ─── Search ERP Customers AJAX ──────────────────────────────────────────────
    const fetchErpCustomers = async (query = "", page = 1, mobileStatus = erpMobileFilter) => {
        setErpLoading(true);
        try {
            const res = await fetch(
                `/customers/approvals/search-erp-customers?query=${encodeURIComponent(query)}&page=${page}&mobile_status=${mobileStatus}`
            );
            const data: PaginatedData<AccountSummary> = await res.json();
            setErpAccounts(data);
            setErpPage(data.current_page || page);
            if (data?.data) {
                setSelectedErpMap((prev) => {
                    const next = { ...prev };
                    data.data.forEach((acc) => {
                        next[acc.id] = acc;
                    });
                    return next;
                });
            }
        } catch (err) {
            console.error("Failed to load ERP customers:", err);
        } finally {
            setErpLoading(false);
        }
    };

    const erpDebounceRef = useRef<any>(null);
    useEffect(() => {
        if (!erpModalOpen) return;
        if (erpDebounceRef.current) clearTimeout(erpDebounceRef.current);
        erpDebounceRef.current = setTimeout(() => {
            fetchErpCustomers(erpSearchQuery, 1, erpMobileFilter);
        }, 280);
        return () => clearTimeout(erpDebounceRef.current);
    }, [erpSearchQuery, erpMobileFilter, erpModalOpen]);

    // ─── Multi-Selection Logic (ERP Selector Modal) ──────────────────────────────
    const toggleSelectErpAccount = (id: number) => {
        setSelectedErpAccountIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAllErpPage = () => {
        if (!erpAccounts?.data) return;
        const pageIds = erpAccounts.data.map((acc) => acc.id);
        const allSelected = pageIds.every((id) => selectedErpAccountIds.includes(id));
        if (allSelected) {
            setSelectedErpAccountIds(selectedErpAccountIds.filter((id) => !pageIds.includes(id)));
        } else {
            setSelectedErpAccountIds(Array.from(new Set([...selectedErpAccountIds, ...pageIds])));
        }
    };

    // Helper: Check if an ERP account has a valid existing or custom mobile number
    const isAccountMobileReady = (accId: number): boolean => {
        const acc = selectedErpMap[accId] || erpAccounts?.data.find((a) => a.id === accId);
        const existing = acc?.mobile?.trim() || "";
        const custom = (customMobiles[accId] || "").replace(/[^0-9]/g, "");
        if (custom.length >= 10) return true;
        if (existing.replace(/[^0-9]/g, "").length >= 10) return true;
        return false;
    };

    const selectedMissingMobileCount = selectedErpAccountIds.filter(
        (id) => !isAccountMobileReady(id)
    ).length;

    // ─── Filter & Navigation Handlers ────────────────────────────────────────────
    const applyFilters = (newFilters: Partial<typeof filters>) => {
        router.get(
            "/customers/approvals",
            {
                tab: newFilters.tab !== undefined ? newFilters.tab : filters.tab,
                search: newFilters.search !== undefined ? newFilters.search : search || undefined,
                origin: newFilters.origin !== undefined ? newFilters.origin : filters.origin || undefined,
                access: newFilters.access !== undefined ? newFilters.access : filters.access || undefined,
            },
            { preserveState: true }
        );
    };

    const handleTabChange = (tabKey: string) => {
        applyFilters({ tab: tabKey.toLowerCase() });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: search });
    };

    // ─── Single & Bulk Actions ──────────────────────────────────────────────────
    const handleApprove = (customer: CustomerUser) => {
        router.post(`/customers/approvals/${customer.id}/approve`, {}, { preserveScroll: true });
    };

    const handleToggleAccess = (customer: CustomerUser, enable: boolean) => {
        router.post(
            `/customers/approvals/${customer.id}/toggle-access`,
            { enable },
            { preserveScroll: true }
        );
    };

    const handleResetPassword = async (customer: CustomerUser) => {
        if (!confirm(`Reset password for '${customer.name}'? A new temporary password will be generated for WhatsApp sharing.`)) {
            return;
        }

        try {
            const res = await fetch(`/customers/approvals/${customer.id}/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as any)?.content || "",
                },
            });
            const data = await res.json();
            if (data.success) {
                setGeneratedCredentials([
                    {
                        customer_name: customer.name,
                        username: data.username,
                        mobile: data.mobile,
                        temp_password: data.temp_password,
                        whatsapp_link: data.whatsapp_link,
                    },
                ]);
                setProvisionSummary({ total: 1, created: 1, reactivated: 0, skipped: 0 });
                setSkippedAccounts([]);
                setCredentialsModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to reset password", err);
            alert("Failed to reset password. Please try again.");
        }
    };

    // ─── Provision Selected ERP Accounts ─────────────────────────────────────────
    const handleProvisionSelectedErp = async () => {
        if (selectedErpAccountIds.length === 0) return;
        if (selectedMissingMobileCount > 0) {
            alert(
                `Please enter a valid 10+ digit mobile number for all ${selectedMissingMobileCount} selected customer(s) that are missing a mobile number.`
            );
            return;
        }
        setProvisioningSubmitting(true);

        try {
            const res = await fetch("/customers/approvals/provision-erp-bulk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as any)?.content || "",
                },
                body: JSON.stringify({
                    account_ids: selectedErpAccountIds,
                    custom_mobiles: customMobiles,
                }),
            });

            const data = await res.json();
            setProvisioningSubmitting(false);
            setErpModalOpen(false);
            setSelectedErpAccountIds([]);
            setCustomMobiles({});

            if (data.summary) {
                setProvisionSummary(data.summary);
                setGeneratedCredentials(data.credentials || []);
                setSkippedAccounts(data.skipped_details || []);
                setCredentialsModalOpen(true);
                router.reload({ only: ["customers", "counts"] });
            }
        } catch (err) {
            setProvisioningSubmitting(false);
            console.error("Provisioning failed:", err);
            alert("Failed to provision accounts. Please check your network and try again.");
        }
    };

    // ─── Copy Credentials Helper ────────────────────────────────────────────────
    const handleCopyCredential = (cred: any, index: number) => {
        const text = `Username: ${cred.username}\nMobile: ${cred.mobile}\nPassword: ${cred.temp_password}\nLogin: ${window.location.origin}/customer/login`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // ─── Reject Dialog Actions ──────────────────────────────────────────────────
    const openRejectDialog = (customer: CustomerUser) => {
        setActiveCustomer(customer);
        setRejectionReason("");
        setRejectDialogOpen(true);
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCustomer || !rejectionReason.trim()) return;
        setRejectSubmitting(true);
        router.post(
            `/customers/approvals/${activeCustomer.id}/reject`,
            { rejection_reason: rejectionReason },
            {
                onFinish: () => {
                    setRejectSubmitting(false);
                    setRejectDialogOpen(false);
                },
            }
        );
    };

    // ─── Link Dialog Actions ────────────────────────────────────────────────────
    const openLinkDialog = (customer: CustomerUser) => {
        setActiveCustomer(customer);
        setSelectedAccountId(null);
        setAccountSearchQuery(customer.name);
        setLinkDialogOpen(true);
        searchErpAccounts(customer.name);
    };

    const searchErpAccounts = async (term: string) => {
        if (!term.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/customers/approvals/search-accounts?query=${encodeURIComponent(term)}`);
            const data = await res.json();
            setAccountSearchResults(data);
        } catch (err) {
            console.error("Account search error", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLinkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCustomer || !selectedAccountId) return;
        setLinkSubmitting(true);
        router.post(
            `/customers/approvals/${activeCustomer.id}/link-account`,
            { account_id: selectedAccountId },
            {
                onFinish: () => {
                    setLinkSubmitting(false);
                    setLinkDialogOpen(false);
                },
            }
        );
    };

    // ─── WhatsApp Direct Message Link Helper ────────────────────────────────────
    const getCustomerWhatsAppLink = (c: CustomerUser): string | null => {
        if (!c.mobile) return null;
        let digits = c.mobile.replace(/[^0-9]/g, "");
        if (digits.startsWith("0092")) digits = digits.slice(2);
        else if (digits.startsWith("0") && digits.length >= 10) digits = "92" + digits.slice(1);
        else if (digits.length === 10 && digits.startsWith("3")) digits = "92" + digits;
        if (digits.length < 10) return null;

        const portalUrl = `${window.location.origin}/customer/login`;
        const customerName = c.business_name || c.name;
        const text =
            `*HARAMAIN TRADERS — B2B DIGITAL PORTAL*\n` +
            `═══════════════════════════════════════\n` +
            `*Assalam-o-Alaikum, ${customerName}*\n\n` +
            `Your official B2B Online Ordering Account is *${c.is_active ? "ACTIVE" : "REGISTERED"}*!\n\n` +
            `🔐 *YOUR PORTAL DETAILS:*\n` +
            `🌐 *Portal Login:* ${portalUrl}\n` +
            `👤 *Username:* ${c.username}\n` +
            `📱 *Registered Mobile:* ${c.mobile}\n\n` +
            `You can place orders online 24/7 and view your real-time trade prices & ledger anytime.\n\n` +
            `*Haramain Traders*\n` +
            `📞 Support / WhatsApp: 0331 8102001`;

        return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    };

    const goToCustomerPage = (page: number) => {
        if (page < 1 || page > customers.last_page || page === customers.current_page) return;
        router.get(
            "/customers/approvals",
            {
                tab: filters.tab,
                search: search || undefined,
                origin: filters.origin || undefined,
                access: filters.access || undefined,
                page,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const currentTab = (filters.tab || "pending").toLowerCase();

    const tabs = [
        { key: "pending", label: "Pending Approval", count: counts.pending, alert: counts.pending > 0 },
        { key: "approved", label: "Approved Customers", count: counts.approved },
        { key: "rejected", label: "Rejected", count: counts.rejected },
        { key: "all", label: "All Online Users", count: counts.all },
    ];

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <Head title="Customer Account Approvals & Access - Haramain ERP" />

                <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1650px] mx-auto w-full">
                    {/* ── Page Header & KPI Overview ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative overflow-hidden bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm"
                    >
                        <div className="absolute -right-12 -top-12 w-56 h-56 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                                    <UserCheck className="h-3.5 w-3.5" />
                                    <span>Customer Identity & Access Control</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-2">
                                    Online Customer Access & Approvals
                                </h1>
                                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
                                    Convert existing ERP customers into online portal users, review registrations, and manage portal login access in real time.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                {/* Quick Mini KPIs */}
                                <div className="hidden xl:flex items-center gap-2.5 mr-2">
                                    <div className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                            Active Portal Users
                                        </div>
                                        <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                            {Math.max(0, counts.all - counts.disabled)}
                                        </div>
                                    </div>
                                    <div className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                            ERP Linked
                                        </div>
                                        <div className="text-base font-black text-blue-600 dark:text-blue-400">
                                            {counts.erp_linked}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => {
                                        setErpModalOpen(true);
                                        setSelectedErpAccountIds([]);
                                        setCustomMobiles({});
                                    }}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs h-10 px-5 shadow-md shadow-emerald-600/15 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Existing ERP Customers
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Status Tabs, Search & Filter Control Bar ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
                        className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3.5"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                            {/* Animated Status Tabs */}
                            <div className="flex overflow-x-auto gap-1.5 p-1 bg-zinc-100/80 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                                {tabs.map((tab) => {
                                    const isActive = currentTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => handleTabChange(tab.key)}
                                            className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-lg transition-colors ${
                                                isActive
                                                    ? "text-white"
                                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeApprovalTab"
                                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-xs"
                                                />
                                            )}
                                            <span className="relative z-10">{tab.label}</span>
                                            <span
                                                className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black transition-colors ${
                                                    isActive
                                                        ? "bg-white/20 text-white"
                                                        : tab.alert
                                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                                        : "bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                                }`}
                                            >
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Origin & Access Quick Filters */}
                            <div className="flex items-center gap-2 text-xs">
                                <div className="relative flex items-center">
                                    <Filter className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
                                    <select
                                        value={filters.origin || "all"}
                                        onChange={(e) => applyFilters({ origin: e.target.value })}
                                        className="h-9 pl-8 pr-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer"
                                    >
                                        <option value="all">All Origins</option>
                                        <option value="erp_linked">ERP Linked Only</option>
                                        <option value="self_registered">Self Registered Only</option>
                                    </select>
                                </div>

                                <select
                                    value={filters.access || "all"}
                                    onChange={(e) => applyFilters({ access: e.target.value })}
                                    className="h-9 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer"
                                >
                                    <option value="all">All Access Status</option>
                                    <option value="active">Active Login Only</option>
                                    <option value="disabled">Disabled Login Only</option>
                                </select>
                            </div>
                        </div>

                        {/* Search Bar Row */}
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-md">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search customer name, username, mobile, or ERP code..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 pr-8 text-xs h-9 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch("");
                                                applyFilters({ search: "" });
                                            }}
                                            className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl shadow-xs"
                                >
                                    Search
                                </Button>
                            </form>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                <span>
                                    Showing{" "}
                                    <strong className="text-zinc-800 dark:text-zinc-200">
                                        {customers.from || 0}–{customers.to || 0}
                                    </strong>{" "}
                                    of{" "}
                                    <strong className="text-zinc-800 dark:text-zinc-200">
                                        {customers.total}
                                    </strong>{" "}
                                    portal accounts
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Customers Master Table ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden"
                    >
                        <TooltipProvider delayDuration={120}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50/90 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3.5">Customer & Business</th>
                                            <th className="px-4 py-3.5">Login Identifiers</th>
                                            <th className="px-4 py-3.5">Registration Type</th>
                                            <th className="px-4 py-3.5 text-center">Online Access</th>
                                            <th className="px-4 py-3.5 text-center">Approval Status</th>
                                            <th className="px-4 py-3.5">Linked ERP Account</th>
                                            <th className="px-5 py-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                        <AnimatePresence mode="popLayout">
                                            {customers.data.length === 0 ? (
                                                <motion.tr
                                                    key="empty-row"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <td colSpan={7} className="px-6 py-16 text-center text-zinc-500">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                                <Users className="w-6 h-6" />
                                                            </div>
                                                            <div className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                                                                No customer portal accounts found
                                                            </div>
                                                            <p className="text-xs text-zinc-400 max-w-sm">
                                                                No records match the selected tab or search filter. Click "Add Existing ERP Customers" above to provision online access.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ) : (
                                                customers.data.map((c, idx) => {
                                                    const isApproved = c.approval_status === "approved";
                                                    const isRejected = c.approval_status === "rejected";
                                                    const isErpLinked = c.registered_via === "erp_linked" || !!c.account_id;
                                                    const whatsappUrl = getCustomerWhatsAppLink(c);
                                                    const initials = (c.name || "C")
                                                        .replace(/[^a-zA-Z0-9\s]/g, "")
                                                        .trim()
                                                        .split(/\s+/)
                                                        .slice(0, 2)
                                                        .map((w) => w[0])
                                                        .join("")
                                                        .toUpperCase() || "CU";

                                                    return (
                                                        <motion.tr
                                                            key={c.id}
                                                            layout
                                                            initial={{ opacity: 0, y: 6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -6 }}
                                                            transition={{
                                                                duration: 0.2,
                                                                delay: Math.min(idx * 0.02, 0.25),
                                                                ease: "easeOut",
                                                            }}
                                                            className="group hover:bg-emerald-50/30 dark:hover:bg-zinc-800/50 transition-colors"
                                                        >
                                                            {/* Customer Name & Business */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border transition-transform group-hover:scale-105 ${
                                                                            c.is_active
                                                                                ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/70"
                                                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                                                                        }`}
                                                                    >
                                                                        {initials}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs truncate">
                                                                            {c.name}
                                                                        </div>
                                                                        {c.business_name && c.business_name !== c.name && (
                                                                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium truncate">
                                                                                <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                                                                                <span className="truncate">{c.business_name}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                                                                            <Calendar className="w-2.5 h-2.5" />
                                                                            <span>
                                                                                Registered:{" "}
                                                                                {new Date(c.created_at).toLocaleDateString("en-PK", {
                                                                                    day: "2-digit",
                                                                                    month: "short",
                                                                                    year: "numeric",
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Login Identifiers (Username & Mobile) */}
                                                            <td className="px-4 py-3.5">
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
                                                                    <span className="text-zinc-400 text-[10px] font-sans font-semibold">
                                                                        @
                                                                    </span>
                                                                    <span>{c.username}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-1 pl-0.5">
                                                                    <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                    <span>{c.mobile}</span>
                                                                </div>
                                                            </td>

                                                            {/* Registration Type Badge */}
                                                            <td className="px-4 py-3.5">
                                                                {isErpLinked ? (
                                                                    <Badge className="bg-blue-50/90 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 font-bold text-[10px] px-2.5 py-0.5 rounded-lg">
                                                                        ERP Linked
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-amber-50/90 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-bold text-[10px] px-2.5 py-0.5 rounded-lg">
                                                                        Self Registered
                                                                    </Badge>
                                                                )}
                                                            </td>

                                                            {/* Online Access Status (Enabled / Disabled) */}
                                                            <td className="px-4 py-3.5 text-center">
                                                                {c.is_active ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                        <ShieldCheck className="w-3 h-3" />
                                                                        Enabled
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                                                                        <ShieldAlert className="w-3 h-3" />
                                                                        Disabled
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Approval Status */}
                                                            <td className="px-4 py-3.5 text-center">
                                                                {isApproved && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                                        <Check className="w-3 h-3" />
                                                                        Approved
                                                                    </span>
                                                                )}
                                                                {isRejected && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100/80 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                                                                        <X className="w-3 h-3" />
                                                                        Rejected
                                                                    </span>
                                                                )}
                                                                {!isApproved && !isRejected && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                                        <Clock className="w-3 h-3" />
                                                                        Pending
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Linked ERP Account */}
                                                            <td className="px-4 py-3.5">
                                                                {c.account ? (
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800 flex items-center justify-center shrink-0">
                                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                                                                {c.account.title}
                                                                            </div>
                                                                            <div className="text-[10px] text-zinc-400 font-mono">
                                                                                Code: <strong className="text-zinc-600 dark:text-zinc-300">{c.account.code}</strong>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                                                            Not Linked
                                                                        </span>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => openLinkDialog(c)}
                                                                                    className="h-7 w-7 p-0 rounded-lg border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700"
                                                                                >
                                                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top">
                                                                                Link ERP Customer Account
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Row Actions (Icon-Only Buttons with Rich Tooltips) */}
                                                            <td className="px-5 py-3.5 text-right">
                                                                <div className="inline-flex items-center justify-end gap-1.5 bg-zinc-50/80 dark:bg-zinc-800/60 p-1 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60">
                                                                    {/* Approve Button (if pending) */}
                                                                    {!isApproved && !isRejected && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    onClick={() => handleApprove(c)}
                                                                                    className="h-8 w-8 p-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform hover:scale-105"
                                                                                >
                                                                                    <Check className="w-4 h-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top">
                                                                                Approve Customer Registration
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    )}

                                                                    {/* Reject Button (if pending) */}
                                                                    {!isApproved && !isRejected && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => openRejectDialog(c)}
                                                                                    className="h-8 w-8 p-0 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/50 transition-transform hover:scale-105"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top">
                                                                                Reject Customer Registration
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    )}

                                                                    {/* Direct WhatsApp Button */}
                                                                    {whatsappUrl ? (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <a
                                                                                    href={whatsappUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200/80 hover:border-emerald-600 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white transition-all hover:scale-105 shadow-2xs"
                                                                                >
                                                                                    <MessageCircle className="w-4 h-4" />
                                                                                </a>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top">
                                                                                Send Portal Login Info via WhatsApp ({c.mobile})
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed">
                                                                                    <MessageCircle className="w-4 h-4" />
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top">
                                                                                No valid mobile number for WhatsApp
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    )}

                                                                    {/* Password Reset & WhatsApp Credentials Modal */}
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleResetPassword(c)}
                                                                                className="h-8 w-8 p-0 rounded-lg border-amber-200/80 bg-amber-50/60 hover:bg-amber-500 text-amber-700 hover:text-white hover:border-amber-500 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white transition-all hover:scale-105 shadow-2xs"
                                                                            >
                                                                                <KeyRound className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top">
                                                                            Reset Password & Share New Credentials on WhatsApp
                                                                        </TooltipContent>
                                                                    </Tooltip>

                                                                    {/* Access Enable / Disable Toggle */}
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleToggleAccess(c, !c.is_active)}
                                                                                className={`h-8 w-8 p-0 rounded-lg transition-all hover:scale-105 shadow-2xs ${
                                                                                    c.is_active
                                                                                        ? "border-rose-200/80 bg-rose-50/60 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white"
                                                                                        : "border-emerald-200/80 bg-emerald-50/60 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                                                                                }`}
                                                                            >
                                                                                <Power className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top">
                                                                            {c.is_active
                                                                                ? "Disable Online Portal Login Access"
                                                                                : "Enable Online Portal Login Access"}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </TooltipProvider>

                        {/* ── Always-Visible Professional Pagination Bar ── */}
                        <div className="px-5 py-3.5 bg-zinc-50/80 dark:bg-zinc-800/50 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
                            <div className="flex items-center gap-2">
                                <span>
                                    Showing{" "}
                                    <strong className="text-zinc-800 dark:text-zinc-200">
                                        {customers.from || 0}
                                    </strong>{" "}
                                    to{" "}
                                    <strong className="text-zinc-800 dark:text-zinc-200">
                                        {customers.to || 0}
                                    </strong>{" "}
                                    of{" "}
                                    <strong className="text-zinc-800 dark:text-zinc-200">
                                        {customers.total}
                                    </strong>{" "}
                                    customers
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                <span>
                                    Page{" "}
                                    <strong className="text-zinc-800 dark:text-zinc-200">
                                        {customers.current_page}
                                    </strong>{" "}
                                    of{" "}
                                    <strong className="text-zinc-800 dark:text-zinc-200">
                                        {customers.last_page || 1}
                                    </strong>
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={customers.current_page <= 1}
                                    onClick={() => goToCustomerPage(1)}
                                    title="First Page"
                                    className="h-8 w-8 p-0 rounded-lg"
                                >
                                    <ChevronsLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={customers.current_page <= 1}
                                    onClick={() => goToCustomerPage(customers.current_page - 1)}
                                    className="h-8 px-2.5 text-xs rounded-lg gap-1"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Prev
                                </Button>

                                {/* Page Number Buttons */}
                                <div className="flex items-center gap-1 mx-1">
                                    {Array.from({ length: customers.last_page || 1 }, (_, i) => i + 1)
                                        .filter(
                                            (p) =>
                                                p === 1 ||
                                                p === (customers.last_page || 1) ||
                                                Math.abs(p - customers.current_page) <= 2
                                        )
                                        .map((p, idx, arr) => {
                                            const prev = arr[idx - 1];
                                            const showEllipsis = prev && p - prev > 1;
                                            const isCurrent = p === customers.current_page;
                                            return (
                                                <React.Fragment key={p}>
                                                    {showEllipsis && (
                                                        <span className="px-1 text-zinc-400">…</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => goToCustomerPage(p)}
                                                        className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all ${
                                                            isCurrent
                                                                ? "bg-emerald-600 text-white shadow-xs"
                                                                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        })}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={customers.current_page >= (customers.last_page || 1)}
                                    onClick={() => goToCustomerPage(customers.current_page + 1)}
                                    className="h-8 px-2.5 text-xs rounded-lg gap-1"
                                >
                                    Next
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={customers.current_page >= (customers.last_page || 1)}
                                    onClick={() => goToCustomerPage(customers.last_page || 1)}
                                    title="Last Page"
                                    className="h-8 w-8 p-0 rounded-lg"
                                >
                                    <ChevronsRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* ── DIALOG 1: ADD EXISTING ERP CUSTOMERS TO ONLINE ACCESS ─────── */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <Dialog open={erpModalOpen} onOpenChange={setErpModalOpen}>
                    <DialogContent className="sm:max-w-5xl max-w-[96vw] w-full max-h-[92vh] flex flex-col p-0 overflow-hidden gap-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                        {/* Top Header Section */}
                        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/5 via-teal-950/5 to-transparent dark:from-emerald-950/30 border-b border-zinc-200 dark:border-zinc-800">
                            <DialogHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6">
                                    <div>
                                        <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                                            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                                                <UserPlus className="w-5 h-5" />
                                            </div>
                                            <span>Select ERP Customers for Online Portal Access</span>
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                            Showing ERP customers from Chart of Accounts (<code className="font-mono font-bold text-emerald-700 dark:text-emerald-400">type = 3</code>) who do <strong>not</strong> yet have an online portal login. For customers without a mobile number, enter their WhatsApp/Mobile number directly below.
                                        </DialogDescription>
                                    </div>
                                    {erpAccounts && (
                                        <div className="shrink-0 flex items-center gap-2">
                                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-right shadow-2xs">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                    Eligible ERP Accounts
                                                </div>
                                                <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                                                    {erpAccounts.total.toLocaleString()} <span className="text-xs font-normal text-zinc-500">Unlinked</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogHeader>

                            {/* Search & Filter Bar */}
                            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search customer firm title, ERP account code (e.g. 000124), or mobile number..."
                                        value={erpSearchQuery}
                                        onChange={(e) => setErpSearchQuery(e.target.value)}
                                        className="pl-10 pr-8 h-9 text-xs bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 rounded-xl shadow-2xs"
                                        autoFocus
                                    />
                                    {erpSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setErpSearchQuery("")}
                                            className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Mobile Number Filter Pills */}
                                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0">
                                    {(
                                        [
                                            { key: "all", label: "All Unlinked" },
                                            { key: "with_mobile", label: "Has Mobile" },
                                            { key: "no_mobile", label: "No Mobile (Needs Input)" },
                                        ] as const
                                    ).map((f) => (
                                        <button
                                            key={f.key}
                                            type="button"
                                            onClick={() => setErpMobileFilter(f.key)}
                                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                                erpMobileFilter === f.key
                                                    ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selection Status Banner */}
                            {selectedErpAccountIds.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs">
                                    <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>{selectedErpAccountIds.length} customer(s) selected for online access</span>
                                        {selectedMissingMobileCount > 0 && (
                                            <span className="ml-2 inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-extrabold animate-pulse">
                                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                {selectedMissingMobileCount} selected customer(s) require a mobile number
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedErpAccountIds([])}
                                        className="text-[11px] font-bold text-rose-600 hover:underline"
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Customer Accounts Table Container */}
                        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-3 bg-zinc-50/40 dark:bg-zinc-950/30">
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-100/80 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-500 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3.5 py-3 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        !!erpAccounts?.data &&
                                                        erpAccounts.data.length > 0 &&
                                                        erpAccounts.data.every((acc) => selectedErpAccountIds.includes(acc.id))
                                                    }
                                                    onChange={toggleSelectAllErpPage}
                                                    title="Select all on this page"
                                                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="px-3 py-3 w-24">Code</th>
                                            <th className="px-3 py-3">Customer / Firm Title</th>
                                            <th className="px-3 py-3 w-72">Mobile / WhatsApp Number (Login ID)</th>
                                            <th className="px-3 py-3 w-36">City</th>
                                            <th className="px-3 py-3 w-40 text-center">Portal Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {erpLoading ? (
                                            <tr>
                                                <td colSpan={6} className="p-12 text-center text-xs text-zinc-400">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                                                        <span>Searching unlinked ERP customer accounts...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : !erpAccounts || erpAccounts.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-12 text-center text-xs text-zinc-400">
                                                    <div className="flex flex-col items-center justify-center gap-1.5">
                                                        <Users className="w-7 h-7 text-zinc-300" />
                                                        <div className="font-bold text-zinc-600 dark:text-zinc-300 text-sm">
                                                            No unlinked ERP customers found
                                                        </div>
                                                        <p className="text-[11px] text-zinc-400 max-w-md">
                                                            {erpSearchQuery
                                                                ? `No unlinked ERP customer matches "${erpSearchQuery}". Customers who are already active on the online portal are automatically hidden.`
                                                                : "All active ERP customers already have online portal accounts or no records match your filter."}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            erpAccounts.data.map((acc) => {
                                                const isSelected = selectedErpAccountIds.includes(acc.id);
                                                const hasSavedMobile = !!acc.mobile && acc.mobile.trim().replace(/[^0-9]/g, "").length >= 10;
                                                const customMobileVal = customMobiles[acc.id] !== undefined ? customMobiles[acc.id] : (acc.mobile || "");
                                                const cleanCustomDigits = customMobileVal.replace(/[^0-9]/g, "");
                                                const isMobileValid = cleanCustomDigits.length >= 10;

                                                return (
                                                    <tr
                                                        key={acc.id}
                                                        onClick={() => toggleSelectErpAccount(acc.id)}
                                                        className={`cursor-pointer transition-colors ${
                                                            isSelected
                                                                ? !isMobileValid
                                                                    ? "bg-amber-50/70 dark:bg-amber-950/25 hover:bg-amber-50"
                                                                    : "bg-emerald-50/60 dark:bg-emerald-950/25 hover:bg-emerald-50/80"
                                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                                                        }`}
                                                    >
                                                        <td className="px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleSelectErpAccount(acc.id)}
                                                                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono font-bold text-zinc-600 dark:text-zinc-400">
                                                            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                                                                {acc.code}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                                                                {acc.title}
                                                            </div>
                                                            {acc.address1 && (
                                                                <div className="text-[10px] text-zinc-400 truncate max-w-[260px]">
                                                                    {acc.address1}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                                            {hasSavedMobile && !isSelected && customMobiles[acc.id] === undefined ? (
                                                                <div className="flex items-center justify-between gap-2 group">
                                                                    <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                                                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                        {acc.mobile}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCustomMobiles((prev) => ({
                                                                                ...prev,
                                                                                [acc.id]: acc.mobile || "",
                                                                            }));
                                                                            if (!isSelected) toggleSelectErpAccount(acc.id);
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-emerald-600 hover:underline transition-opacity"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    <div className="relative flex items-center">
                                                                        <Phone
                                                                            className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${
                                                                                isMobileValid
                                                                                    ? "text-emerald-600"
                                                                                    : isSelected
                                                                                    ? "text-amber-600"
                                                                                    : "text-zinc-400"
                                                                            }`}
                                                                        />
                                                                        <Input
                                                                            type="tel"
                                                                            placeholder="Enter mobile (e.g. 03001234567)"
                                                                            value={customMobileVal}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                setCustomMobiles((prev) => ({
                                                                                    ...prev,
                                                                                    [acc.id]: val,
                                                                                }));
                                                                                // Automatically check the row when admin types a mobile number
                                                                                if (val.trim().length > 0 && !isSelected) {
                                                                                    setSelectedErpAccountIds((prev) =>
                                                                                        prev.includes(acc.id) ? prev : [...prev, acc.id]
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className={`h-8 pl-8 pr-7 text-xs font-mono rounded-lg ${
                                                                                !hasSavedMobile && !isMobileValid
                                                                                    ? isSelected
                                                                                        ? "border-amber-500 bg-amber-50/90 dark:bg-amber-950/50 focus-visible:ring-amber-500 text-amber-950 dark:text-amber-100 placeholder:text-amber-500/80 font-bold"
                                                                                        : "border-amber-300/90 bg-amber-50/40 dark:bg-amber-950/20 placeholder:text-amber-600/70"
                                                                                    : isMobileValid
                                                                                    ? "border-emerald-400 bg-white dark:bg-zinc-900 text-emerald-900 dark:text-emerald-200 font-bold"
                                                                                    : ""
                                                                            }`}
                                                                        />
                                                                        {isMobileValid ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-2 pointer-events-none" />
                                                                        ) : (
                                                                            <AlertCircle className="w-4 h-4 text-amber-500 absolute right-2 pointer-events-none" />
                                                                        )}
                                                                    </div>
                                                                    {!isMobileValid && (
                                                                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                                            <span>
                                                                                {isSelected
                                                                                    ? "⚠️ Required: Enter 11-digit mobile to enable online login"
                                                                                    : "No Mobile in ERP — type number to select & save"}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 font-medium">
                                                            {acc.city?.name ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                                                                    {acc.city.name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            {isMobileValid ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                                                                    <Check className="w-3 h-3" />
                                                                    Ready to Provision
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                                                                    <Phone className="w-3 h-3" />
                                                                    Needs Mobile
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination + Footer Controls */}
                        <div className="p-4 sm:px-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                            {/* Left: Pagination inside Modal */}
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                {erpAccounts && erpAccounts.last_page > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={erpPage <= 1 || erpLoading}
                                            onClick={() => fetchErpCustomers(erpSearchQuery, erpPage - 1, erpMobileFilter)}
                                            className="h-8 px-2.5 text-xs"
                                        >
                                            Prev Page
                                        </Button>
                                        <span className="px-2 font-semibold text-zinc-700 dark:text-zinc-300">
                                            Page {erpAccounts.current_page} of {erpAccounts.last_page}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={erpPage >= erpAccounts.last_page || erpLoading}
                                            onClick={() => fetchErpCustomers(erpSearchQuery, erpPage + 1, erpMobileFilter)}
                                            className="h-8 px-2.5 text-xs"
                                        >
                                            Next Page
                                        </Button>
                                    </div>
                                )}
                                <span className="hidden md:inline text-zinc-400">
                                    {erpAccounts
                                        ? `Showing ${erpAccounts.from || 0}–${erpAccounts.to || 0} of ${erpAccounts.total} unlinked customers`
                                        : ""}
                                </span>
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setErpModalOpen(false)}
                                    disabled={provisioningSubmitting}
                                    className="h-9 text-xs rounded-xl px-4"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleProvisionSelectedErp}
                                    disabled={
                                        selectedErpAccountIds.length === 0 ||
                                        selectedMissingMobileCount > 0 ||
                                        provisioningSubmitting
                                    }
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-9 text-xs px-5 rounded-xl shadow-md disabled:opacity-50"
                                >
                                    {provisioningSubmitting
                                        ? "Generating Credentials..."
                                        : selectedMissingMobileCount > 0
                                        ? `Enter ${selectedMissingMobileCount} Missing Mobile(s) First`
                                        : `Enable Online Access (${selectedErpAccountIds.length})`}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* ── DIALOG 2: ONE-TIME GENERATED CREDENTIALS & WHATSAPP SHARING ── */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <Dialog open={credentialsModalOpen} onOpenChange={setCredentialsModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-700 dark:text-emerald-400">
                                <KeyRound className="w-5 h-5 text-emerald-600" />
                                Online Credentials Ready for WhatsApp Sharing
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500">
                                Temporary login credentials have been generated. Click <strong>"Send via WhatsApp"</strong> to instantly open WhatsApp with the customer's welcome message and login details.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Summary Badges */}
                        {provisionSummary && (
                            <div className="flex flex-wrap gap-2 text-xs py-1">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                                    Created: {provisionSummary.created || 0}
                                </span>
                                {provisionSummary.reactivated > 0 && (
                                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-bold">
                                        Reactivated: {provisionSummary.reactivated}
                                    </span>
                                )}
                                {provisionSummary.skipped > 0 && (
                                    <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                                        Skipped (Invalid/Duplicate): {provisionSummary.skipped}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Credentials List */}
                        <div className="flex-1 overflow-y-auto space-y-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 my-2">
                            {generatedCredentials.length === 0 ? (
                                <div className="p-4 text-center text-xs text-zinc-500">
                                    No new temporary passwords were created. All selected accounts were already active.
                                </div>
                            ) : (
                                generatedCredentials.map((cred, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                        <div>
                                            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                                {cred.customer_name}
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 font-mono text-[11px]">
                                                <div>
                                                    <span className="text-zinc-400">Username:</span>{" "}
                                                    <strong>{cred.username}</strong>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400">Mobile:</span>{" "}
                                                    <strong>{cred.mobile}</strong>
                                                </div>
                                                <div className="col-span-2 text-emerald-700 dark:text-emerald-400 font-bold">
                                                    <span>Password:</span>{" "}
                                                    <code className="bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                                        {cred.temp_password}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCopyCredential(cred, idx)}
                                                className="h-8 text-xs font-semibold px-2"
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1" />
                                                {copiedIndex === idx ? "Copied!" : "Copy"}
                                            </Button>

                                            {cred.whatsapp_link && (
                                                <a
                                                    href={cred.whatsapp_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                                        Send WhatsApp
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Skipped Details Alert */}
                            {skippedAccounts.length > 0 && (
                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1 text-xs text-amber-900 dark:text-amber-200">
                                    <div className="font-bold flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        Accounts Skipped ({skippedAccounts.length}):
                                    </div>
                                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                                        {skippedAccounts.map((s, idx) => (
                                            <li key={idx}>
                                                <strong>[{s.account_code}] {s.customer_name}:</strong> {s.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="text-[11px] text-zinc-400 italic">
                            ⚠️ Note: Passwords are encrypted for safety. Make sure to send credentials to the customer now before closing this window.
                        </div>

                        <DialogFooter className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            <Button
                                type="button"
                                onClick={() => setCredentialsModalOpen(false)}
                                className="bg-zinc-800 hover:bg-zinc-900 text-white font-bold h-9 text-xs px-4"
                            >
                                Done & Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* ── DIALOG 3: MANUAL ERP LINK DIALOG ──────────────────────────── */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">Link ERP Chart of Accounts</DialogTitle>
                            <DialogDescription className="text-xs">
                                Select an existing Customer account from Chart of Accounts to link with '
                                {activeCustomer?.name}'.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleLinkSubmit} className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-semibold text-zinc-700">Search Customer Account</label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        type="text"
                                        value={accountSearchQuery}
                                        onChange={(e) => setAccountSearchQuery(e.target.value)}
                                        placeholder="Type account name or code..."
                                        className="text-xs h-9"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => searchErpAccounts(accountSearchQuery)}
                                        className="h-9 text-xs"
                                    >
                                        Search
                                    </Button>
                                </div>
                            </div>

                            <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg divide-y">
                                {isSearching ? (
                                    <div className="p-3 text-center text-xs text-zinc-500">Searching...</div>
                                ) : accountSearchResults.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-zinc-400">
                                        No matching customer accounts found.
                                    </div>
                                ) : (
                                    accountSearchResults.map((acc) => (
                                        <div
                                            key={acc.id}
                                            onClick={() => setSelectedAccountId(acc.id)}
                                            className={`p-2.5 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                                                selectedAccountId === acc.id
                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 font-bold"
                                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                            }`}
                                        >
                                            <div>
                                                <div>{acc.title}</div>
                                                <div className="text-[11px] text-zinc-400 font-mono">
                                                    [{acc.code}] {acc.mobile ? `• ${acc.mobile}` : ""}
                                                </div>
                                            </div>
                                            {selectedAccountId === acc.id && (
                                                <Check className="w-4 h-4 text-emerald-600" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setLinkDialogOpen(false)}
                                    disabled={linkSubmitting}
                                    className="h-8 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-bold"
                                    disabled={!selectedAccountId || linkSubmitting}
                                >
                                    {linkSubmitting ? "Linking..." : "Link Account"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* ── DIALOG 4: REJECT DIALOG ───────────────────────────────────── */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">Reject Customer Account</DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter a mandatory reason for rejecting '{activeCustomer?.name}'.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRejectSubmit} className="space-y-4 py-2">
                            <div>
                                <label className="text-xs font-semibold text-zinc-700">Rejection Reason</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="e.g. Unverified business phone number, outside delivery territory..."
                                    className="w-full text-xs mt-1 p-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRejectDialogOpen(false)}
                                    disabled={rejectSubmitting}
                                    className="h-8 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs font-bold"
                                    disabled={rejectSubmitting || !rejectionReason.trim()}
                                >
                                    {rejectSubmitting ? "Rejecting..." : "Confirm Rejection"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
