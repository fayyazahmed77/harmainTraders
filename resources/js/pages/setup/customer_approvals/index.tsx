import React, { useState } from "react";
import { Head, router, Link } from "@inertiajs/react";
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
}

interface Props {
    customers: PaginatedData<CustomerUser>;
    filters: {
        tab: string;
        search: string;
    };
    counts: {
        all: number;
        pending: number;
        approved: number;
        rejected: number;
    };
}

export default function CustomerApprovalsIndex({ customers, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || "");

    // Link ERP Dialog State
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [activeCustomer, setActiveCustomer] = useState<CustomerUser | null>(null);
    const [accountSearchQuery, setAccountSearchQuery] = useState("");
    const [accountSearchResults, setAccountSearchResults] = useState<AccountSummary[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [linkSubmitting, setLinkSubmitting] = useState(false);

    // Reject Dialog State
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    const handleTabChange = (tabKey: string) => {
        router.get(
            "/customers/approvals",
            {
                tab: tabKey.toLowerCase(),
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            "/customers/approvals",
            {
                tab: filters.tab,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleApprove = (customer: CustomerUser) => {
        router.post(`/customers/approvals/${customer.id}/approve`, {}, { preserveScroll: true });
    };

    const handleCreateAndLinkErp = (customer: CustomerUser) => {
        if (confirm(`Create a new Chart of Accounts Customer entry for '${customer.name}'?`)) {
            router.post(`/customers/approvals/${customer.id}/create-link-erp`, {}, { preserveScroll: true });
        }
    };

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

    const currentTab = (filters.tab || "pending").toLowerCase();

    const tabs = [
        { key: "pending", label: "Pending Approval", count: counts.pending, alert: counts.pending > 0 },
        { key: "approved", label: "Approved Customers", count: counts.approved },
        { key: "rejected", label: "Rejected", count: counts.rejected },
        { key: "all", label: "All Registrations", count: counts.all },
    ];

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50 min-h-screen">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <Head title="Customer Account Approvals - Haramain ERP" />

                <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                                <UserCheck className="h-4 w-4" />
                                <span>Security & Onboarding</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                                Customer Approvals
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Review self-registered online ordering customers, approve accounts, and link them to Chart of Accounts.
                            </p>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-px gap-2">
                        {tabs.map((tab) => {
                            const isActive = currentTab === tab.key;
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

                    {/* Search Bar */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between"
                    >
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                type="text"
                                placeholder="Search Name, Mobile, Business, City..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                                Search
                            </Button>
                            {search && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearch("");
                                        router.get("/customers/approvals", { tab: filters.tab });
                                    }}
                                    className="h-9"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </form>

                    {/* Customers Table */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3.5">Customer Name / User</th>
                                        <th className="px-4 py-3.5">Contact / Business</th>
                                        <th className="px-4 py-3.5">Location</th>
                                        <th className="px-4 py-3.5 text-center">Status</th>
                                        <th className="px-4 py-3.5">Linked ERP Account</th>
                                        <th className="px-4 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {customers.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                                                No customer registration records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.data.map((c) => (
                                            <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                        {c.name}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">
                                                        @{c.username} • Joined{" "}
                                                        {new Date(c.created_at).toLocaleDateString("en-PK", {
                                                            day: "2-digit",
                                                            month: "short",
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                                                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                                        <span>{c.mobile}</span>
                                                    </div>
                                                    {c.business_name && (
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                                                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                                            <span>{c.business_name}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-zinc-600 dark:text-zinc-400">
                                                    {c.city || "—"}
                                                    {c.address ? `, ${c.address}` : ""}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {(() => {
                                                        const status = String(c.approval_status || "").toLowerCase();
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
                                                    {c.rejection_reason && (
                                                        <div className="text-[11px] text-rose-600 mt-1 max-w-xs truncate">
                                                            Reason: {c.rejection_reason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {c.account ? (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                            <div>
                                                                <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                                                    {c.account.title}
                                                                </div>
                                                                <div className="text-[11px] text-zinc-400">
                                                                    [{c.account.code}]
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                Not Linked
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openLinkDialog(c)}
                                                                className="h-6 text-[11px] px-1.5"
                                                            >
                                                                <LinkIcon className="w-3 h-3 mr-1" />
                                                                Link
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleCreateAndLinkErp(c)}
                                                                className="h-6 text-[11px] px-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                                            >
                                                                <PlusCircle className="w-3 h-3 mr-1" />
                                                                Auto-Create
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right space-x-1">
                                                    {(() => {
                                                        const status = String(c.approval_status || "").toLowerCase();
                                                        const isApproved = status === "approved";
                                                        const isRejected = status === "rejected";

                                                        return (
                                                            <>
                                                                {!isApproved && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleApprove(c)}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-2.5"
                                                                    >
                                                                        <Check className="w-3.5 h-3.5 mr-1" />
                                                                        Approve
                                                                    </Button>
                                                                )}

                                                                {isApproved && (
                                                                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                                        Approved
                                                                    </span>
                                                                )}

                                                                {!isRejected && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => openRejectDialog(c)}
                                                                        className="text-rose-600 border-rose-200 hover:bg-rose-50 h-8 text-xs px-2.5"
                                                                    >
                                                                        <X className="w-3.5 h-3.5 mr-1" />
                                                                        Reject
                                                                    </Button>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Link Dialog */}
                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Link ERP Chart of Accounts</DialogTitle>
                            <DialogDescription>
                                Select an existing Customer account from the Chart of Accounts to link with '
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
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => searchErpAccounts(accountSearchQuery)}
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
                                                <div className="text-[11px] text-zinc-400">
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
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={!selectedAccountId || linkSubmitting}
                                >
                                    {linkSubmitting ? "Linking..." : "Link Account"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reject Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Customer Account</DialogTitle>
                            <DialogDescription>
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
                                    className="w-full text-sm mt-1 p-2 rounded-md border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRejectDialogOpen(false)}
                                    disabled={rejectSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-rose-600 hover:bg-rose-700 text-white"
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

