import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { router } from "@inertiajs/react";
import { 
    Calendar as CalendarIcon, 
    RotateCcw, 
    Search, 
    X, 
    Filter, 
    SlidersHorizontal, 
    ArrowRightLeft, 
    Check
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

interface FilterProps {
    filters: {
        search?: string;
        start_date?: string;
        end_date?: string;
        account_id?: string;
        debit_account_id?: string;
        credit_account_id?: string;
        min_amount?: string;
        max_amount?: string;
        per_page?: string;
    };
    accounts: AccountOption[];
    totalAmount?: number;
    totalCount?: number;
}

const DEBOUNCE_MS = 400;

export default function JournalVoucherFilters({ 
    filters, 
    accounts
}: FilterProps) {
    const [search, setSearch] = useState(filters.search || "");
    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });
    const [accountId, setAccountId] = useState(filters.account_id || "all");
    const [debitAccountId, setDebitAccountId] = useState(filters.debit_account_id || "all");
    const [creditAccountId, setCreditAccountId] = useState(filters.credit_account_id || "all");
    const [minAmount, setMinAmount] = useState(filters.min_amount || "");
    const [maxAmount, setMaxAmount] = useState(filters.max_amount || "");
    const [perPage, setPerPage] = useState(filters.per_page || "50");

    const [showAdvanced, setShowAdvanced] = useState(
        Boolean(filters.debit_account_id || filters.credit_account_id || filters.min_amount || filters.max_amount)
    );

    // Dropdown popovers
    const [partyOpen, setPartyOpen] = useState(false);
    const [partySearch, setPartySearch] = useState("");

    const [debitOpen, setDebitOpen] = useState(false);
    const [debitSearch, setDebitSearch] = useState("");

    const [creditOpen, setCreditOpen] = useState(false);
    const [creditSearch, setCreditSearch] = useState("");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Navigate Helper
    const navigate = useCallback(
        (overrides: Record<string, string> = {}) => {
            const params: Record<string, string> = {
                search: search.trim(),
                start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
                end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
                account_id: accountId === "all" ? "" : accountId,
                debit_account_id: debitAccountId === "all" ? "" : debitAccountId,
                credit_account_id: creditAccountId === "all" ? "" : creditAccountId,
                min_amount: minAmount.trim(),
                max_amount: maxAmount.trim(),
                per_page: perPage || "50",
                page: "1",
                ...overrides,
            };

            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            router.get("/journal-vouchers", params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [search, date, accountId, debitAccountId, creditAccountId, minAmount, maxAmount, perPage]
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
        setAccountId("all");
        setDebitAccountId("all");
        setCreditAccountId("all");
        setMinAmount("");
        setMaxAmount("");
        setPerPage("50");
        router.get("/journal-vouchers", { per_page: "50" }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Filter accounts
    const filterList = (list: AccountOption[], q: string) => {
        const query = q.toLowerCase().trim();
        if (!query) return list;
        return list.filter(a => 
            a.title.toLowerCase().includes(query) || 
            (a.code && a.code.toLowerCase().includes(query))
        );
    };

    const partyFiltered = useMemo(() => filterList(accounts, partySearch), [accounts, partySearch]);
    const debitFiltered = useMemo(() => filterList(accounts, debitSearch), [accounts, debitSearch]);
    const creditFiltered = useMemo(() => filterList(accounts, creditSearch), [accounts, creditSearch]);

    const selectedPartyTitle = useMemo(() => {
        if (accountId === "all") return "All Accounts (Any Side)";
        const acc = accounts.find(a => String(a.id) === String(accountId));
        return acc ? `${acc.title}${acc.code ? ` (${acc.code})` : ""}` : "Selected Account";
    }, [accountId, accounts]);

    const selectedDebitTitle = useMemo(() => {
        if (debitAccountId === "all") return "Any Debit Account";
        const acc = accounts.find(a => String(a.id) === String(debitAccountId));
        return acc ? `${acc.title}${acc.code ? ` (${acc.code})` : ""}` : "Selected Debit";
    }, [debitAccountId, accounts]);

    const selectedCreditTitle = useMemo(() => {
        if (creditAccountId === "all") return "Any Credit Account";
        const acc = accounts.find(a => String(a.id) === String(creditAccountId));
        return acc ? `${acc.title}${acc.code ? ` (${acc.code})` : ""}` : "Selected Credit";
    }, [creditAccountId, accounts]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (search.trim()) count++;
        if (date?.from || date?.to) count++;
        if (accountId !== "all") count++;
        if (debitAccountId !== "all") count++;
        if (creditAccountId !== "all") count++;
        if (minAmount.trim() || maxAmount.trim()) count++;
        return count;
    }, [search, date, accountId, debitAccountId, creditAccountId, minAmount, maxAmount]);

    return (
        <div className="space-y-2.5">
            {/* Primary Filter Toolbar - Clean Neutral Professional Styling */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                    
                    {/* 1. Global Search */}
                    <div className="md:col-span-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                            placeholder="Search Voucher No, remarks..."
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

                    {/* 3. Universal Party Selector */}
                    <div className="md:col-span-3">
                        <Popover open={partyOpen} onOpenChange={setPartyOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-9 w-full justify-between text-xs font-normal rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 px-3 hover:bg-white dark:hover:bg-zinc-900 transition-colors",
                                        accountId === "all" ? "text-slate-500 dark:text-zinc-400" : "text-slate-900 dark:text-zinc-100 font-medium"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 truncate">
                                        <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{selectedPartyTitle}</span>
                                    </div>
                                    <span className="text-slate-400 text-xs">▾</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-900" align="start">
                                <div className="p-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center gap-2">
                                    <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <Input
                                        placeholder="Search by title or code..."
                                        value={partySearch}
                                        onChange={(e) => setPartySearch(e.target.value)}
                                        className="h-8 border-none shadow-none text-xs px-1 bg-transparent focus-visible:ring-0"
                                        autoFocus
                                    />
                                    {partySearch && (
                                        <button onClick={() => setPartySearch("")}>
                                            <X className="h-3.5 w-3.5 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-60 overflow-y-auto py-1 text-xs">
                                    <button
                                        onClick={() => {
                                            setAccountId("all");
                                            setPartyOpen(false);
                                            navigate({ account_id: "" });
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
                                            accountId === "all" && "font-semibold text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-800"
                                        )}
                                    >
                                        <span>All Accounts (Any Side)</span>
                                        {accountId === "all" && <Check className="h-3.5 w-3.5 text-slate-600" />}
                                    </button>
                                    {partyFiltered.map((acc) => (
                                        <button
                                            key={acc.id}
                                            onClick={() => {
                                                setAccountId(String(acc.id));
                                                setPartyOpen(false);
                                                navigate({ account_id: String(acc.id) });
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border-t border-slate-100 dark:border-zinc-800",
                                                String(accountId) === String(acc.id) && "font-semibold text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-800"
                                            )}
                                        >
                                            <span className="truncate">{acc.title}</span>
                                            {acc.code && <span className="font-mono text-[10px] text-slate-400 ml-2">{acc.code}</span>}
                                        </button>
                                    ))}
                                    {partyFiltered.length === 0 && (
                                        <div className="py-4 text-center text-xs text-slate-400">No accounts found.</div>
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
                            title="Toggle Amount & Specific Sides Filters"
                            className={cn(
                                "h-9 w-9 rounded-lg border-slate-200 dark:border-zinc-700 transition-colors",
                                showAdvanced ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-slate-50/70 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
                            )}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
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

                {/* Advanced Row (Debit Account, Credit Account, Min Amount, Max Amount) */}
                {showAdvanced && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5">
                        
                        {/* Specific Debit Account */}
                        <div className="md:col-span-4">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1 block">
                                Debit Account (Dr)
                            </label>
                            <Popover open={debitOpen} onOpenChange={setDebitOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-9 w-full justify-between text-xs font-normal rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 px-2.5",
                                            debitAccountId !== "all" && "font-medium text-slate-900 dark:text-zinc-100"
                                        )}
                                    >
                                        <span className="truncate">{selectedDebitTitle}</span>
                                        <span className="text-slate-400 text-xs">▾</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-900" align="start">
                                    <div className="p-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center gap-2">
                                        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <Input
                                            placeholder="Search debit account..."
                                            value={debitSearch}
                                            onChange={(e) => setDebitSearch(e.target.value)}
                                            className="h-8 border-none shadow-none text-xs px-1 bg-transparent focus-visible:ring-0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-56 overflow-y-auto py-1 text-xs">
                                        <button
                                            onClick={() => {
                                                setDebitAccountId("all");
                                                setDebitOpen(false);
                                                navigate({ debit_account_id: "" });
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Any Debit Account
                                        </button>
                                        {debitFiltered.map((acc) => (
                                            <button
                                                key={acc.id}
                                                onClick={() => {
                                                    setDebitAccountId(String(acc.id));
                                                    setDebitOpen(false);
                                                    navigate({ debit_account_id: String(acc.id) });
                                                }}
                                                className="w-full text-left px-3 py-1.5 flex justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border-t border-slate-100 dark:border-zinc-800"
                                            >
                                                <span className="truncate">{acc.title}</span>
                                                {acc.code && <span className="font-mono text-[9px] text-slate-400">{acc.code}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Specific Credit Account */}
                        <div className="md:col-span-4">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1 block">
                                Credit Account (Cr)
                            </label>
                            <Popover open={creditOpen} onOpenChange={setCreditOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "h-9 w-full justify-between text-xs font-normal rounded-lg bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 px-2.5",
                                            creditAccountId !== "all" && "font-medium text-slate-900 dark:text-zinc-100"
                                        )}
                                    >
                                        <span className="truncate">{selectedCreditTitle}</span>
                                        <span className="text-slate-400 text-xs">▾</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-900" align="start">
                                    <div className="p-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center gap-2">
                                        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <Input
                                            placeholder="Search credit account..."
                                            value={creditSearch}
                                            onChange={(e) => setCreditSearch(e.target.value)}
                                            className="h-8 border-none shadow-none text-xs px-1 bg-transparent focus-visible:ring-0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-56 overflow-y-auto py-1 text-xs">
                                        <button
                                            onClick={() => {
                                                setCreditAccountId("all");
                                                setCreditOpen(false);
                                                navigate({ credit_account_id: "" });
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Any Credit Account
                                        </button>
                                        {creditFiltered.map((acc) => (
                                            <button
                                                key={acc.id}
                                                onClick={() => {
                                                    setCreditAccountId(String(acc.id));
                                                    setCreditOpen(false);
                                                    navigate({ credit_account_id: String(acc.id) });
                                                }}
                                                className="w-full text-left px-3 py-1.5 flex justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border-t border-slate-100 dark:border-zinc-800"
                                            >
                                                <span className="truncate">{acc.title}</span>
                                                {acc.code && <span className="font-mono text-[9px] text-slate-400">{acc.code}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Min Amount */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1 block">
                                Min Amount (Rs)
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
                                Max Amount (Rs)
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

                    {accountId !== "all" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>Account: {selectedPartyTitle}</span>
                            <button onClick={() => { setAccountId("all"); navigate({ account_id: "" }); }} className="hover:text-slate-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {debitAccountId !== "all" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>Dr: {selectedDebitTitle}</span>
                            <button onClick={() => { setDebitAccountId("all"); navigate({ debit_account_id: "" }); }} className="hover:text-slate-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {creditAccountId !== "all" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span>Cr: {selectedCreditTitle}</span>
                            <button onClick={() => { setCreditAccountId("all"); navigate({ credit_account_id: "" }); }} className="hover:text-slate-900">
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
