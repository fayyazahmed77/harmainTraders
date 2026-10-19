import React, { useState, useRef, useCallback, useMemo } from "react";
import { router } from "@inertiajs/react";
import { 
    Calendar as CalendarIcon, 
    RotateCcw, 
    Search, 
    X, 
    Filter, 
    SlidersHorizontal, 
    User, 
    Check,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface AccountOption {
    id: number;
    title: string;
    code?: string;
}

interface SalesmanOption {
    id: number;
    name: string;
}

interface FirmOption {
    id: number;
    name: string;
}

interface FilterProps {
    filters: {
        search?: string;
        start_date?: string;
        end_date?: string;
        supplier_id?: string;
        account_id?: string;
        salesman_id?: string;
        firm_id?: string;
        min_amount?: string;
        max_amount?: string;
        per_page?: string;
    };
    suppliers: AccountOption[];
    salesmen: SalesmanOption[];
    firms: FirmOption[];
    totalAmount?: number;
    totalCount?: number;
}

const DEBOUNCE_MS = 400;

export default function PurchaseReturnFilters({ 
    filters, 
    suppliers = [],
    salesmen = [],
    firms = []
}: FilterProps) {
    const [search, setSearch] = useState(filters.search || "");
    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });
    const [supplierId, setSupplierId] = useState(filters.supplier_id || filters.account_id || "all");
    const [salesmanId, setSalesmanId] = useState(filters.salesman_id || "all");
    const [firmId, setFirmId] = useState(filters.firm_id || "all");
    const [minAmount, setMinAmount] = useState(filters.min_amount || "");
    const [maxAmount, setMaxAmount] = useState(filters.max_amount || "");
    const [perPage, setPerPage] = useState(filters.per_page || "50");

    const [showAdvanced, setShowAdvanced] = useState(
        Boolean(filters.salesman_id || filters.firm_id || filters.min_amount || filters.max_amount)
    );

    // Dropdown popovers
    const [supplierOpen, setSupplierOpen] = useState(false);
    const [supplierSearch, setSupplierSearch] = useState("");

    const [salesmanOpen, setSalesmanOpen] = useState(false);
    const [salesmanSearch, setSalesmanSearch] = useState("");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Navigate Helper
    const navigate = useCallback(
        (overrides: Record<string, string> = {}) => {
            const params: Record<string, string> = {
                search: search.trim(),
                start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
                end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
                supplier_id: supplierId === "all" ? "" : supplierId,
                salesman_id: salesmanId === "all" ? "" : salesmanId,
                firm_id: firmId === "all" ? "" : firmId,
                min_amount: minAmount.trim(),
                max_amount: maxAmount.trim(),
                per_page: perPage || "50",
                page: "1",
                ...overrides,
            };

            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            router.get("/purchase-return", params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [search, date, supplierId, salesmanId, firmId, minAmount, maxAmount, perPage]
    );

    // Search Debounce
    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate({ search: val.trim() });
        }, DEBOUNCE_MS);
    };

    // Date Range Handlers
    const handleDateSelect = (range: DateRange | undefined) => {
        setDate(range);
        if ((range?.from && range?.to) || (!range?.from && !range?.to)) {
            navigate({
                start_date: range?.from ? format(range.from, "yyyy-MM-dd") : "",
                end_date: range?.to ? format(range.to, "yyyy-MM-dd") : "",
            });
        }
    };

    const applyDatePreset = (preset: "today" | "yesterday" | "this_week" | "this_month" | "last_month" | "clear") => {
        const now = new Date();
        let newRange: DateRange | undefined = undefined;

        if (preset === "today") {
            newRange = { from: now, to: now };
        } else if (preset === "yesterday") {
            const yest = subDays(now, 1);
            newRange = { from: yest, to: yest };
        } else if (preset === "this_week") {
            newRange = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
        } else if (preset === "this_month") {
            newRange = { from: startOfMonth(now), to: endOfMonth(now) };
        } else if (preset === "last_month") {
            const lastMonth = subMonths(now, 1);
            newRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        }

        setDate(newRange);
        navigate({
            start_date: newRange?.from ? format(newRange.from, "yyyy-MM-dd") : "",
            end_date: newRange?.to ? format(newRange.to, "yyyy-MM-dd") : "",
        });
    };

    // Amount Change
    const handleAmountChange = (field: "min_amount" | "max_amount", val: string) => {
        if (field === "min_amount") setMinAmount(val);
        else setMaxAmount(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate({ [field]: val.trim() });
        }, 500);
    };

    // Reset All Filters
    const resetAll = () => {
        setSearch("");
        setDate(undefined);
        setSupplierId("all");
        setSalesmanId("all");
        setFirmId("all");
        setMinAmount("");
        setMaxAmount("");
        setPerPage("50");
        router.get("/purchase-return", { per_page: "50" }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Filtered lists
    const supplierFiltered = useMemo(() => {
        const q = supplierSearch.toLowerCase().trim();
        if (!q) return suppliers;
        return suppliers.filter(s => 
            s.title.toLowerCase().includes(q) || 
            (s.code && s.code.toLowerCase().includes(q))
        );
    }, [suppliers, supplierSearch]);

    const salesmanFiltered = useMemo(() => {
        const q = salesmanSearch.toLowerCase().trim();
        if (!q) return salesmen;
        return salesmen.filter(s => s.name.toLowerCase().includes(q));
    }, [salesmen, salesmanSearch]);

    const selectedSupplierTitle = useMemo(() => {
        if (supplierId === "all") return "All Suppliers (Any Vendor)";
        const found = suppliers.find(s => String(s.id) === String(supplierId));
        return found ? `${found.title}${found.code ? ` (${found.code})` : ""}` : "Selected Supplier";
    }, [supplierId, suppliers]);

    const selectedSalesmanTitle = useMemo(() => {
        if (salesmanId === "all") return "All Salesmen";
        const found = salesmen.find(s => String(s.id) === String(salesmanId));
        return found ? found.name : "Selected Salesman";
    }, [salesmanId, salesmen]);

    const selectedFirmTitle = useMemo(() => {
        if (firmId === "all") return "All Firms";
        const found = firms.find(f => String(f.id) === String(firmId));
        return found ? found.name : "Selected Firm";
    }, [firmId, firms]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (search.trim()) count++;
        if (date?.from || date?.to) count++;
        if (supplierId !== "all") count++;
        if (salesmanId !== "all") count++;
        if (firmId !== "all") count++;
        if (minAmount.trim() || maxAmount.trim()) count++;
        return count;
    }, [search, date, supplierId, salesmanId, firmId, minAmount, maxAmount]);

    return (
        <div className="space-y-2.5">
            {/* Primary Filter Toolbar - Matches Journal Vouchers UI */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                    
                    {/* 1. Global Search */}
                    <div className="md:col-span-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                            placeholder="Search Return No, Origin Bill, remarks..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && navigate()}
                            className="h-9 pl-9 pr-8 text-xs bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-zinc-900 rounded-lg transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    navigate({ search: "" });
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* 2. Date Range Picker */}
                    <div className="md:col-span-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-9 w-full justify-start text-left text-xs font-normal rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 px-3 hover:bg-white dark:hover:bg-zinc-900 transition-colors",
                                        !date?.from ? "text-slate-500 dark:text-zinc-400" : "text-slate-900 dark:text-zinc-100 font-medium"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500 shrink-0" />
                                    <span className="truncate">
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "dd MMM yyyy")} &ndash; {format(date.to, "dd MMM yyyy")}
                                                </>
                                            ) : (
                                                format(date.from, "dd MMM yyyy")
                                            )
                                        ) : (
                                            "All Dates (Date Range)"
                                        )}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-900" align="start">
                                {/* Presets Bar */}
                                <div className="p-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex flex-wrap gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => applyDatePreset("today")} className="h-7 px-2 text-xs text-slate-700 dark:text-zinc-300">Today</Button>
                                    <Button size="sm" variant="ghost" onClick={() => applyDatePreset("yesterday")} className="h-7 px-2 text-xs text-slate-700 dark:text-zinc-300">Yesterday</Button>
                                    <Button size="sm" variant="ghost" onClick={() => applyDatePreset("this_week")} className="h-7 px-2 text-xs text-slate-700 dark:text-zinc-300">This Week</Button>
                                    <Button size="sm" variant="ghost" onClick={() => applyDatePreset("this_month")} className="h-7 px-2 text-xs text-slate-700 dark:text-zinc-300">This Month</Button>
                                    <Button size="sm" variant="ghost" onClick={() => applyDatePreset("last_month")} className="h-7 px-2 text-xs text-slate-700 dark:text-zinc-300">Last Month</Button>
                                    <Button size="sm" variant="ghost" onClick={() => applyDatePreset("clear")} className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50">Clear</Button>
                                </div>
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from || new Date()}
                                    selected={date}
                                    onSelect={handleDateSelect}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 3. Supplier / Vendor Entity Selector */}
                    <div className="md:col-span-3">
                        <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-9 w-full justify-between text-xs font-normal rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 px-3 hover:bg-white dark:hover:bg-zinc-900 transition-colors",
                                        supplierId === "all" ? "text-slate-500 dark:text-zinc-400" : "text-slate-900 dark:text-zinc-100 font-medium"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 truncate">
                                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{selectedSupplierTitle}</span>
                                    </div>
                                    <span className="text-slate-400 text-xs">▾</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-900" align="start">
                                <div className="p-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center gap-2">
                                    <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <Input
                                        placeholder="Search supplier by name or code..."
                                        value={supplierSearch}
                                        onChange={(e) => setSupplierSearch(e.target.value)}
                                        className="h-8 border-none shadow-none text-xs px-1 bg-transparent focus-visible:ring-0"
                                        autoFocus
                                    />
                                    {supplierSearch && (
                                        <button onClick={() => setSupplierSearch("")}>
                                            <X className="h-3.5 w-3.5 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-60 overflow-y-auto py-1 text-xs">
                                    <button
                                        onClick={() => {
                                            setSupplierId("all");
                                            setSupplierOpen(false);
                                            navigate({ supplier_id: "" });
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
                                            supplierId === "all" && "font-semibold text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-800"
                                        )}
                                    >
                                        <span>All Suppliers (Any Vendor)</span>
                                        {supplierId === "all" && <Check className="h-3.5 w-3.5 text-slate-600" />}
                                    </button>
                                    {supplierFiltered.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setSupplierId(String(s.id));
                                                setSupplierOpen(false);
                                                navigate({ supplier_id: String(s.id) });
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border-t border-slate-100 dark:border-zinc-800",
                                                String(supplierId) === String(s.id) && "font-semibold text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-800"
                                            )}
                                        >
                                            <span className="truncate">{s.title}</span>
                                            {s.code && <span className="font-mono text-[10px] text-slate-400 ml-2">{s.code}</span>}
                                        </button>
                                    ))}
                                    {supplierFiltered.length === 0 && (
                                        <div className="py-4 text-center text-xs text-slate-400">No suppliers found.</div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 4. Controls */}
                    <div className="md:col-span-1 flex items-center gap-1.5 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            title="Toggle Advanced Filters (Salesman, Firm, Amount)"
                            className={cn(
                                "h-9 w-9 rounded-lg border-slate-200 dark:border-zinc-700 transition-colors relative",
                                showAdvanced ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-slate-50/70 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
                            )}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {(salesmanId !== "all" || firmId !== "all" || minAmount || maxAmount) && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                            )}
                        </Button>

                        {activeFiltersCount > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={resetAll}
                                title="Reset All Filters"
                                className="h-9 w-9 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                </div>

                {/* Advanced Row (Salesman, Firm, Min Amount, Max Amount) */}
                {showAdvanced && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5">
                        
                        {/* Salesman Filter */}
                        <div className="md:col-span-4">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1 block">
                                Salesman / Representative
                            </label>
                            <Popover open={salesmanOpen} onOpenChange={setSalesmanOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-9 w-full justify-between text-xs font-normal rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 px-2.5",
                                            salesmanId !== "all" && "font-medium text-slate-900 dark:text-zinc-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5 truncate">
                                            <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">{selectedSalesmanTitle}</span>
                                        </div>
                                        <span className="text-slate-400 text-xs">▾</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-0 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-900" align="start">
                                    <div className="p-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center gap-2">
                                        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <Input
                                            placeholder="Search salesman..."
                                            value={salesmanSearch}
                                            onChange={(e) => setSalesmanSearch(e.target.value)}
                                            className="h-8 border-none shadow-none text-xs px-1 bg-transparent focus-visible:ring-0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-56 overflow-y-auto py-1 text-xs">
                                        <button
                                            onClick={() => {
                                                setSalesmanId("all");
                                                setSalesmanOpen(false);
                                                navigate({ salesman_id: "" });
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            All Salesmen
                                        </button>
                                        {salesmanFiltered.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    setSalesmanId(String(s.id));
                                                    setSalesmanOpen(false);
                                                    navigate({ salesman_id: String(s.id) });
                                                }}
                                                className="w-full text-left px-3 py-1.5 flex justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border-t border-slate-100 dark:border-zinc-800"
                                            >
                                                <span className="truncate">{s.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Firm Filter */}
                        <div className="md:col-span-4">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1 block">
                                Firm / Entity
                            </label>
                            <select
                                value={firmId}
                                onChange={(e) => {
                                    setFirmId(e.target.value);
                                    navigate({ firm_id: e.target.value === "all" ? "" : e.target.value });
                                }}
                                className="h-9 w-full text-xs rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 px-2.5 text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-slate-400 outline-none"
                            >
                                <option value="all">All Firms</option>
                                {firms.map((f) => (
                                    <option key={f.id} value={String(f.id)}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Min Amount */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1 block">
                                Min Return (Rs)
                            </label>
                            <Input
                                type="number"
                                placeholder="Min Rs 0"
                                value={minAmount}
                                onChange={(e) => handleAmountChange("min_amount", e.target.value)}
                                className="h-9 text-xs rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 font-mono text-right"
                            />
                        </div>

                        {/* Max Amount */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1 block">
                                Max Return (Rs)
                            </label>
                            <Input
                                type="number"
                                placeholder="Max Rs"
                                value={maxAmount}
                                onChange={(e) => handleAmountChange("max_amount", e.target.value)}
                                className="h-9 text-xs rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 font-mono text-right"
                            />
                        </div>

                    </div>
                )}
            </div>

            {/* Active Filters Pill Bar */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                        <Filter className="h-3 w-3" /> Active:
                    </span>

                    {search && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>Keyword: "{search}"</span>
                            <button onClick={() => { setSearch(""); navigate({ search: "" }); }} className="hover:text-slate-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {(date?.from || date?.to) && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>
                                Date: {date.from ? format(date.from, "dd MMM yyyy") : ""}
                                {date.to ? ` - ${format(date.to, "dd MMM yyyy")}` : ""}
                            </span>
                            <button onClick={() => { setDate(undefined); navigate({ start_date: "", end_date: "" }); }} className="hover:text-slate-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {supplierId !== "all" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>Supplier: {selectedSupplierTitle}</span>
                            <button onClick={() => { setSupplierId("all"); navigate({ supplier_id: "" }); }} className="hover:text-slate-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {salesmanId !== "all" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>Salesman: {selectedSalesmanTitle}</span>
                            <button onClick={() => { setSalesmanId("all"); navigate({ salesman_id: "" }); }} className="hover:text-slate-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {firmId !== "all" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>Firm: {selectedFirmTitle}</span>
                            <button onClick={() => { setFirmId("all"); navigate({ firm_id: "" }); }} className="hover:text-slate-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {(minAmount || maxAmount) && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>
                                Amount: {minAmount ? `Rs ${Number(minAmount).toLocaleString()}` : "0"} - {maxAmount ? `Rs ${Number(maxAmount).toLocaleString()}` : "Max"}
                            </span>
                            <button onClick={() => { setMinAmount(""); setMaxAmount(""); navigate({ min_amount: "", max_amount: "" }); }} className="hover:text-slate-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetAll}
                        className="h-6 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                        Clear All
                    </Button>
                </div>
            )}
        </div>
    );
}
