import React, { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import {
    Search,
    X,
    Calendar as CalendarIcon,
    Hash,
    User,
    ShieldCheck,
    ChevronDown,
    Check,
    Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { motion } from "framer-motion";

interface FilterProps {
    filters: {
        start_date?: string;
        end_date?: string;
        supplier_id?: string;
        status?: string;
        search?: string;
        amount?: string;
    };
    suppliers: {
        id: number;
        title: string;
        code?: string;
    }[];
}

const PREMIUM_ROUNDING = "rounded-xl";

const FieldWrapper = ({
    label,
    icon: Icon,
    children,
    className = "",
}: {
    label: string;
    icon: any;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={cn("relative group min-w-0 flex-1", className)}>
        <div className="flex items-center gap-2 mb-1.5 px-1">
            <Icon className="h-3 w-3 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                {label}
            </label>
        </div>
        <div className="relative">{children}</div>
    </div>
);

export default function PurchaseFilters({ filters, suppliers }: FilterProps) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });
    const [supplierId, setSupplierId] = useState(filters.supplier_id || "all");
    const [supplierOpen, setSupplierOpen] = useState(false);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [status, setStatus] = useState(filters.status || "all");
    const [search, setSearch] = useState(filters.search || "");
    const [amount, setAmount] = useState(filters.amount || "");

    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const amountTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync local state when server-side props change (e.g. after clearFilters)
    React.useEffect(() => {
        setDate({
            from: filters.start_date ? new Date(filters.start_date) : undefined,
            to: filters.end_date ? new Date(filters.end_date) : undefined,
        });
        setSupplierId(filters.supplier_id || "all");
        setStatus(filters.status || "all");
        setSearch(filters.search || "");
        setAmount(filters.amount || "");
    }, [filters.start_date, filters.end_date, filters.supplier_id, filters.status, filters.search, filters.amount]);

    const selectedSupplier = useMemo(() => {
        if (!supplierId || supplierId === "all") return null;
        return suppliers.find((s) => String(s.id) === String(supplierId)) || null;
    }, [suppliers, supplierId]);

    const filteredSuppliers = useMemo(() => {
        const q = supplierSearch.trim().toLowerCase();
        if (!q) return suppliers;
        return suppliers.filter(
            (s) =>
                s.title.toLowerCase().includes(q) ||
                (s.code && s.code.toLowerCase().includes(q)) ||
                String(s.id).includes(q)
        );
    }, [suppliers, supplierSearch]);

    const isFiltered = Boolean(
        date?.from ||
            date?.to ||
            (supplierId && supplierId !== "all") ||
            (status && status !== "all") ||
            (search && search.trim() !== "") ||
            (amount && String(amount).trim() !== "")
    );

    const applyFiltersWith = (overrides?: {
        date?: DateRange | undefined;
        supplier_id?: string;
        status?: string;
        search?: string;
        amount?: string;
    }) => {
        const targetDate = overrides && "date" in overrides ? overrides.date : date;
        const targetSupplier = overrides && "supplier_id" in overrides ? overrides.supplier_id : supplierId;
        const targetStatus = overrides && "status" in overrides ? overrides.status : status;
        const targetSearch = overrides && "search" in overrides ? overrides.search : search;
        const targetAmount = overrides && "amount" in overrides ? overrides.amount : amount;

        const params: Record<string, string> = {};
        if (targetDate?.from) params.start_date = format(targetDate.from, "yyyy-MM-dd");
        if (targetDate?.to) params.end_date = format(targetDate.to, "yyyy-MM-dd");
        if (targetSupplier && targetSupplier !== "all") params.supplier_id = targetSupplier;
        if (targetStatus && targetStatus !== "all") params.status = targetStatus;
        if (targetSearch && targetSearch.trim()) params.search = targetSearch.trim();
        if (targetAmount && String(targetAmount).trim()) params.amount = String(targetAmount).trim();

        router.get("/purchase", params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            applyFiltersWith({ search: val });
        }, 400);
    };

    const handleAmountChange = (val: string) => {
        setAmount(val);
        if (amountTimeoutRef.current) clearTimeout(amountTimeoutRef.current);
        amountTimeoutRef.current = setTimeout(() => {
            applyFiltersWith({ amount: val });
        }, 400);
    };

    const clearFilters = () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (amountTimeoutRef.current) clearTimeout(amountTimeoutRef.current);
        setDate(undefined);
        setSupplierId("all");
        setSupplierSearch("");
        setStatus("all");
        setSearch("");
        setAmount("");
        router.get("/purchase", {}, { preserveState: false });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                PREMIUM_ROUNDING,
                "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 shadow-sm"
            )}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 items-end">
                {/* 1. Date Range */}
                <FieldWrapper label="Date Range" icon={CalendarIcon} className="w-full">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-bold h-11 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-orange-500/50 transition-all text-xs",
                                    !date && "text-zinc-400"
                                )}
                            >
                                {date?.from ? (
                                    date.to ? (
                                        <span className="tabular-nums truncate">
                                            {format(date.from, "MMM dd")} — {format(date.to, "MMM dd")}
                                        </span>
                                    ) : (
                                        format(date.from, "MMM dd, y")
                                    )
                                ) : (
                                    "Select Dates"
                                )}
                                <ChevronDown className="ml-auto h-3 w-3 opacity-50 shrink-0" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden"
                            align="start"
                        >
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={(newDate) => {
                                    setDate(newDate);
                                    if (newDate?.from) {
                                        applyFiltersWith({ date: newDate });
                                    }
                                }}
                                numberOfMonths={2}
                                className="bg-white dark:bg-zinc-900"
                            />
                        </PopoverContent>
                    </Popover>
                </FieldWrapper>

                {/* 2. Searchable Supplier Dropdown */}
                <FieldWrapper label="Select Supplier" icon={User} className="w-full">
                    <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                    "w-full justify-between text-left font-bold h-11 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-orange-500/50 transition-all text-xs",
                                    !selectedSupplier && "text-zinc-700 dark:text-zinc-200"
                                )}
                            >
                                <span className="truncate">
                                    {selectedSupplier ? selectedSupplier.title : "All Suppliers"}
                                </span>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {selectedSupplier && (
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSupplierId("all");
                                                setSupplierSearch("");
                                                applyFiltersWith({ supplier_id: "all" });
                                            }}
                                            className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors"
                                            title="Clear Supplier"
                                        >
                                            <X className="h-3 w-3" />
                                        </span>
                                    )}
                                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[300px] p-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
                            align="start"
                        >
                            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search supplier name or code..."
                                        value={supplierSearch}
                                        onChange={(e) => setSupplierSearch(e.target.value)}
                                        className="h-8 pl-8 pr-7 text-xs font-semibold rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-visible:ring-1 focus-visible:ring-orange-500"
                                        autoFocus
                                    />
                                    {supplierSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setSupplierSearch("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto p-1 divide-y divide-zinc-50 dark:divide-zinc-800/40">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSupplierId("all");
                                        setSupplierOpen(false);
                                        applyFiltersWith({ supplier_id: "all" });
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors text-left cursor-pointer",
                                        supplierId === "all"
                                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                            : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <span>All Suppliers ({suppliers.length})</span>
                                    {supplierId === "all" && <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                                </button>

                                {filteredSuppliers.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-zinc-400 font-medium">
                                        No matching supplier found
                                    </div>
                                ) : (
                                    filteredSuppliers.map((supplier) => {
                                        const isSelected = String(supplier.id) === String(supplierId);
                                        return (
                                            <button
                                                key={supplier.id}
                                                type="button"
                                                onClick={() => {
                                                    const val = String(supplier.id);
                                                    setSupplierId(val);
                                                    setSupplierOpen(false);
                                                    applyFiltersWith({ supplier_id: val });
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors text-left cursor-pointer",
                                                    isSelected
                                                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                                        : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                )}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <div className="truncate">{supplier.title}</div>
                                                    {supplier.code && (
                                                        <div className="text-[10px] font-mono text-zinc-400">
                                                            Code: {supplier.code}
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </FieldWrapper>

                {/* 3. Status Filter */}
                <FieldWrapper label="Status" icon={ShieldCheck} className="w-full">
                    <Select
                        value={status}
                        onValueChange={(val) => {
                            setStatus(val);
                            applyFiltersWith({ status: val });
                        }}
                    >
                        <SelectTrigger className="w-full h-11 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-orange-500/50 transition-all text-xs font-bold">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                            <SelectItem value="all" className="text-xs font-bold lowercase italic opacity-50">
                                Search Status
                            </SelectItem>
                            {["Completed", "Paid", "Partial", "Partial Return", "Returned"].map((s) => (
                                <SelectItem key={s} value={s} className="text-xs font-bold">
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FieldWrapper>

                {/* 4. Filter by Amount */}
                <FieldWrapper label="Filter Amount" icon={Banknote} className="w-full">
                    <div className="relative">
                        <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Net / Bill Amount..."
                            className="w-full h-11 px-4 pr-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 focus:border-orange-500/50 focus-visible:ring-0 transition-all text-xs font-bold tabular-nums"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    if (amountTimeoutRef.current) clearTimeout(amountTimeoutRef.current);
                                    applyFiltersWith({ amount });
                                }
                            }}
                        />
                        {amount ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setAmount("");
                                    applyFiltersWith({ amount: "" });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-rose-500 transition-colors p-1 rounded-md"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <Banknote className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                        )}
                    </div>
                </FieldWrapper>

                {/* 5. Document Search + Reset */}
                <FieldWrapper label="Search Bill" icon={Hash} className="w-full">
                    <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <Input
                                type="text"
                                placeholder="Bill No / ID / Supplier"
                                className="w-full h-11 px-4 pr-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 focus:border-orange-500/50 focus-visible:ring-0 transition-all text-xs font-bold tabular-nums"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                        applyFiltersWith({ search });
                                    }
                                }}
                            />
                            {search ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        applyFiltersWith({ search: "" });
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-rose-500 transition-colors p-1 rounded-md"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            ) : (
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                            )}
                        </div>

                        {isFiltered && (
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shrink-0 text-xs font-bold gap-1.5"
                                title="Reset All Filters"
                            >
                                <X className="h-4 w-4 text-rose-500" />
                                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">
                                    Reset
                                </span>
                            </Button>
                        )}
                    </div>
                </FieldWrapper>
            </div>
        </motion.div>
    );
}
