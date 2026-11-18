import React, { useState, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import DataTable, { Offer } from "./DataTable";
import {
    Plus,
    Tag,
    Sparkles,
    Search,
    Calendar as CalendarIcon,
    Filter,
    RefreshCw,
    X,
    Layers,
    Radio,
    PackageCheck,
    Briefcase,
} from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Offers", href: "/offer-list" },
    { title: "Offer List", href: "/offer-list" },
];

interface Firm {
    id: number;
    name: string;
}

interface Props {
    offers: Offer[];
    firms?: Firm[];
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

export default function Index({ offers = [], firms = [] }: Props) {
    const [search, setSearch] = useState("");
    const [offerTypeFilter, setOfferTypeFilter] = useState<string>("all");
    const [liveStatusFilter, setLiveStatusFilter] = useState<string>("all");
    const [firmFilter, setFirmFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Filter offers client-side in real time
    const filteredOffers = useMemo(() => {
        return offers.filter((offer) => {
            // 1. Search by ID, Firm, Account, Prepared By
            if (search.trim()) {
                const q = search.trim().toLowerCase();
                const idMatch =
                    String(offer.id).includes(q) ||
                    `ofr-${String(offer.id).padStart(4, "0")}`.includes(q);
                const firmMatch = (offer.firm?.name || "haramain")
                    .toLowerCase()
                    .includes(q);
                const accMatch = (offer.account?.title || "general offer")
                    .toLowerCase()
                    .includes(q);
                const userMatch = (offer.user?.name || "")
                    .toLowerCase()
                    .includes(q);
                if (!idMatch && !firmMatch && !accMatch && !userMatch) {
                    return false;
                }
            }

            // 2. Offer Type Filter (1 = Customer Group, 2 = Market Offer)
            if (offerTypeFilter !== "all" && String(offer.offertype) !== offerTypeFilter) {
                return false;
            }

            // 3. Live Status Filter
            if (liveStatusFilter === "live" && !offer.is_live) {
                return false;
            }
            if (liveStatusFilter === "offline" && offer.is_live) {
                return false;
            }

            // 4. Firm Filter
            if (firmFilter !== "all") {
                if (firmFilter === "default" && offer.firm?.id) return false;
                if (firmFilter !== "default" && String(offer.firm?.id || "") !== firmFilter) {
                    return false;
                }
            }

            // 5. Date Range Filter
            if (dateRange?.from) {
                const raw = offer.date ? offer.date.split("T")[0] : "";
                if (!raw) return false;
                const offerDate = new Date(raw + "T00:00:00");
                const fromDate = new Date(
                    dateRange.from.getFullYear(),
                    dateRange.from.getMonth(),
                    dateRange.from.getDate()
                );
                if (offerDate < fromDate) return false;

                if (dateRange.to) {
                    const toDate = new Date(
                        dateRange.to.getFullYear(),
                        dateRange.to.getMonth(),
                        dateRange.to.getDate(),
                        23,
                        59,
                        59
                    );
                    if (offerDate > toDate) return false;
                }
            }

            return true;
        });
    }, [offers, search, offerTypeFilter, liveStatusFilter, firmFilter, dateRange]);

    // Summary KPIs
    const stats = useMemo(() => {
        const total = offers.length;
        const liveCount = offers.filter((o) => !!o.is_live).length;
        const groupCount = offers.filter((o) => String(o.offertype) === "1").length;
        const marketCount = offers.filter((o) => String(o.offertype) === "2").length;
        const totalItemsOffered = offers.reduce(
            (acc, o) => acc + Number(o.items_count || 0),
            0
        );
        return { total, liveCount, groupCount, marketCount, totalItemsOffered };
    }, [offers]);

    const hasActiveFilters =
        search.trim() !== "" ||
        offerTypeFilter !== "all" ||
        liveStatusFilter !== "all" ||
        firmFilter !== "all" ||
        !!dateRange?.from;

    const resetFilters = () => {
        setSearch("");
        setOfferTypeFilter("all");
        setLiveStatusFilter("all");
        setFirmFilter("all");
        setDateRange(undefined);
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50 min-w-0 overflow-x-hidden">
                <SiteHeader breadcrumbs={breadcrumbs} />
                <Head title="Offer List Management - Haramain ERP" />

                <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full min-w-0">
                    {/* ── Hero Header Section ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                        <div className="absolute -right-12 -top-12 w-56 h-56 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200/70 dark:border-orange-800/70 text-orange-600 dark:text-orange-400 font-black text-[10px] uppercase tracking-widest">
                                <Sparkles className="h-3 w-3" />
                                <span>Wholesale Pricing & B2B Catalog</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-2">
                                Price Offer Lists & Live Portal Catalog
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Create customer group & market price offers, synchronize item master rates, and publish live catalogs for online ordering.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
                            <Button
                                onClick={() => router.visit("/offer-list/create")}
                                className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white transition-all rounded-xl px-5 h-11 font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 group"
                            >
                                <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                                Create New Offer List
                            </Button>
                        </div>
                    </motion.div>

                    {/* ── KPI Summary Strip ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        {/* Total Offer Lists */}
                        <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-xs p-4 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                    Total Offer Lists
                                </span>
                                <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
                                    <Tag className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 text-2xl font-black text-foreground">
                                {stats.total}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 font-medium">
                                {stats.totalItemsOffered.toLocaleString()} total product lines configured
                            </div>
                        </div>

                        {/* Live Portal Offers */}
                        <div className="bg-card text-card-foreground rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-xs p-4 relative overflow-hidden bg-gradient-to-br from-orange-50/60 to-amber-50/30 dark:from-orange-950/25 dark:to-transparent">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-orange-700 dark:text-orange-400 tracking-wider">
                                    Live on B2B Portal
                                </span>
                                <div className="p-2 bg-orange-600 text-white rounded-xl shadow-xs">
                                    <Radio className="w-4 h-4 animate-pulse" />
                                </div>
                            </div>
                            <div className="mt-2 text-2xl font-black text-orange-700 dark:text-orange-300">
                                {stats.liveCount}
                            </div>
                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-semibold">
                                Visible to online customers right now
                            </div>
                        </div>

                        {/* Customer Group Offers */}
                        <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-xs p-4 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                    Customer Group Offers
                                </span>
                                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                                    <Layers className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {stats.groupCount}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 font-medium">
                                Carton & Loose Ctn Tier Pricing (Type 1)
                            </div>
                        </div>

                        {/* Market Offers */}
                        <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-xs p-4 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                    Market Offers
                                </span>
                                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                                    <PackageCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                                {stats.marketCount}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 font-medium">
                                Standard Market Rate Lists (Type 2)
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Comprehensive Filter Bar ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-4 sm:p-5"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                            {/* 1. Keyword Search */}
                            <FieldWrapper label="Search Offer # / Prepared By" className="lg:col-span-3">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="OFR-0001, Haramain, Admin..."
                                        className="pl-8 pr-7 h-10 text-xs font-semibold bg-background border-border"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch("")}
                                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </FieldWrapper>

                            {/* 2. Offer Date Range Picker */}
                            <FieldWrapper label="Offer Date Range (From – To)" className="lg:col-span-3">
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
                                                        "All Offer Dates"
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
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FieldWrapper>

                            {/* 3. Offer Type Filter */}
                            <FieldWrapper label="Offer Type" className="lg:col-span-2">
                                <Select value={offerTypeFilter} onValueChange={setOfferTypeFilter}>
                                    <SelectTrigger className="h-10 text-xs font-semibold bg-background border-border">
                                        <SelectValue placeholder="All Offer Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs font-semibold">
                                            All Offer Types
                                        </SelectItem>
                                        <SelectItem value="1" className="text-xs font-semibold">
                                            1: Customer Group
                                        </SelectItem>
                                        <SelectItem value="2" className="text-xs font-semibold">
                                            2: Market Offer
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldWrapper>

                            {/* 4. Portal Live Status Filter */}
                            <FieldWrapper label="Portal Status" className="lg:col-span-2">
                                <Select value={liveStatusFilter} onValueChange={setLiveStatusFilter}>
                                    <SelectTrigger className="h-10 text-xs font-semibold bg-background border-border">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs font-semibold">
                                            All Statuses
                                        </SelectItem>
                                        <SelectItem value="live" className="text-xs font-semibold text-orange-600">
                                            Live Now Only
                                        </SelectItem>
                                        <SelectItem value="offline" className="text-xs font-semibold">
                                            Draft / Offline Only
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldWrapper>

                            {/* 5. Firm Filter + Reset */}
                            <FieldWrapper label="Billing Firm" className="lg:col-span-2">
                                <div className="flex items-center gap-1.5">
                                    <Select value={firmFilter} onValueChange={setFirmFilter}>
                                        <SelectTrigger className="h-10 text-xs font-semibold bg-background border-border flex-1">
                                            <SelectValue placeholder="All Firms" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="text-xs font-semibold">
                                                All Firms
                                            </SelectItem>
                                            <SelectItem value="default" className="text-xs font-semibold">
                                                Default (Haramain)
                                            </SelectItem>
                                            {firms.map((f) => (
                                                <SelectItem
                                                    key={f.id}
                                                    value={String(f.id)}
                                                    className="text-xs font-semibold"
                                                >
                                                    {f.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {hasActiveFilters && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={resetFilters}
                                            title="Reset All Filters"
                                            className="h-10 w-10 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200 shrink-0"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </FieldWrapper>
                        </div>
                    </motion.div>

                    {/* ── Offer List DataTable Surface ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="relative group"
                    >
                        <DataTable data={filteredOffers} />
                    </motion.div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
