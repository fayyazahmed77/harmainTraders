import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { router } from "@inertiajs/react";
import { 
    Calendar as CalendarIcon, 
    RotateCcw, 
    Search, 
    X, 
    Building2, 
    User, 
    FileText, 
    CreditCard, 
    Banknote,
    ChevronDown,
    SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export interface AccountOption {
    id: number;
    title: string;
    code?: string;
}

interface FilterProps {
    filters: {
        status?: string;
        cheque_type?: 'bank' | 'hand' | string;
        account_id?: string;
        bank_account_id?: string;
        party_id?: string;
        voucher_no?: string;
        cheque_no?: string;
        amount?: string;
        start_date?: string;
        end_date?: string;
        date_type?: string;
        per_page?: string;
        page?: string;
    };
    accounts: AccountOption[];
    parties: AccountOption[];
}

const DEBOUNCE_MS = 400;

export default function ClearingChequeFilters({
    filters,
    accounts = [],
    parties = [],
}: FilterProps) {
    const [voucherNo, setVoucherNo] = useState(filters.voucher_no || "");
    const [chequeNo, setChequeNo] = useState(filters.cheque_no || "");
    const [amount, setAmount] = useState(filters.amount || "");
    const [partyId, setPartyId] = useState(filters.party_id || "all");
    const [bankAccountId, setBankAccountId] = useState(filters.bank_account_id || filters.account_id || "all");
    const [dateType, setDateType] = useState<"cheque_date" | "date" | "clear_date">(
        (filters.date_type as any) || "cheque_date"
    );

    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });

    const [partySearch, setPartySearch] = useState("");
    const [partyOpen, setPartyOpen] = useState(false);
    const [bankSearch, setBankSearch] = useState("");
    const [bankOpen, setBankOpen] = useState(false);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Filter parties by search
    const filteredParties = useMemo(() => {
        if (!partySearch.trim()) return parties;
        const q = partySearch.toLowerCase();
        return parties.filter((p) => 
            p.title.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q))
        );
    }, [parties, partySearch]);

    // Filter banks by search
    const filteredBanks = useMemo(() => {
        if (!bankSearch.trim()) return accounts;
        const q = bankSearch.toLowerCase();
        return accounts.filter((b) => b.title.toLowerCase().includes(q));
    }, [accounts, bankSearch]);

    const selectedPartyTitle = useMemo(() => {
        if (partyId === "all" || !partyId) return "All Parties";
        const found = parties.find((p) => String(p.id) === String(partyId));
        return found ? found.title : "All Parties";
    }, [parties, partyId]);

    const selectedBankTitle = useMemo(() => {
        if (bankAccountId === "all" || !bankAccountId) return "All Banks";
        const found = accounts.find((b) => String(b.id) === String(bankAccountId));
        return found ? found.title : "All Banks";
    }, [accounts, bankAccountId]);

    // Navigation trigger
    const navigate = useCallback(
        (overrides: Record<string, string | undefined>) => {
            const params: Record<string, string> = {
                status: filters.status || "Pending",
                cheque_type: filters.cheque_type || "bank",
                voucher_no: voucherNo.trim(),
                cheque_no: chequeNo.trim(),
                amount: amount.trim(),
                party_id: partyId === "all" ? "" : partyId,
                bank_account_id: bankAccountId === "all" ? "" : bankAccountId,
                account_id: bankAccountId === "all" ? "" : bankAccountId,
                date_type: dateType,
                start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
                end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
                per_page: filters.per_page || "50",
                page: "1",
                ...overrides,
            };

            // Clean up empty params
            Object.keys(params).forEach((key) => {
                if (params[key] === "" || params[key] === undefined) {
                    delete params[key];
                }
            });

            router.get("/clearing-cheque", params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [filters.status, filters.per_page, voucherNo, chequeNo, amount, partyId, bankAccountId, dateType, date]
    );

    // Debounce text inputs
    const triggerDebouncedNavigate = (overrides: Record<string, string | undefined>) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            navigate(overrides);
        }, DEBOUNCE_MS);
    };

    // Handlers
    const handleVoucherNoChange = (val: string) => {
        setVoucherNo(val);
        triggerDebouncedNavigate({ voucher_no: val });
    };

    const handleChequeNoChange = (val: string) => {
        setChequeNo(val);
        triggerDebouncedNavigate({ cheque_no: val });
    };

    const handleAmountChange = (val: string) => {
        setAmount(val);
        triggerDebouncedNavigate({ amount: val });
    };

    const handlePartySelect = (val: string) => {
        setPartyId(val);
        setPartyOpen(false);
        setPartySearch("");
        navigate({ party_id: val === "all" ? "" : val });
    };

    const handleBankSelect = (val: string) => {
        setBankAccountId(val);
        setBankOpen(false);
        setBankSearch("");
        navigate({ 
            bank_account_id: val === "all" ? "" : val,
            account_id: val === "all" ? "" : val 
        });
    };

    const handleDateTypeChange = (newType: "cheque_date" | "date" | "clear_date") => {
        setDateType(newType);
        if (date?.from || date?.to) {
            navigate({ date_type: newType });
        }
    };

    const handleDateChange = (newRange: DateRange | undefined) => {
        setDate(newRange);
        if ((newRange?.from && newRange?.to) || (!newRange?.from && !newRange?.to)) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                navigate({
                    start_date: newRange?.from ? format(newRange.from, "yyyy-MM-dd") : "",
                    end_date: newRange?.to ? format(newRange.to, "yyyy-MM-dd") : "",
                });
            }, 300);
        }
    };

    // Quick Date Presets
    const applyDatePreset = (preset: "today" | "this_week" | "this_month" | "next_30") => {
        const today = new Date();
        let range: DateRange | undefined;

        if (preset === "today") {
            range = { from: today, to: today };
        } else if (preset === "this_week") {
            range = { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
        } else if (preset === "this_month") {
            range = { from: startOfMonth(today), to: endOfMonth(today) };
        } else if (preset === "next_30") {
            range = { from: today, to: addDays(today, 30) };
        }

        setDate(range);
        navigate({
            start_date: range?.from ? format(range.from, "yyyy-MM-dd") : "",
            end_date: range?.to ? format(range.to, "yyyy-MM-dd") : "",
        });
    };

    const clearAllFilters = () => {
        setVoucherNo("");
        setChequeNo("");
        setAmount("");
        setPartyId("all");
        setBankAccountId("all");
        setDate(undefined);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        router.get(
            "/clearing-cheque",
            { 
                status: filters.status || "Pending",
                cheque_type: filters.cheque_type || "bank",
                page: "1"
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const hasActiveFilters = Boolean(
        voucherNo.trim() ||
        chequeNo.trim() ||
        amount.trim() ||
        (partyId !== "all" && partyId) ||
        (bankAccountId !== "all" && bankAccountId) ||
        date?.from
    );

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    return (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            {/* Header & Title */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-1 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">
                        Filter Cheques
                    </span>
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-wide border border-primary/20">
                            Active Filters
                        </span>
                    )}
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-8 text-xs font-bold text-muted-foreground hover:text-destructive flex items-center gap-1.5"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset All
                    </Button>
                )}
            </div>

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                
                {/* 1. Date Range Picker + Type Selector */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-primary" /> Date Range
                        </span>
                        <select
                            value={dateType}
                            onChange={(e) => handleDateTypeChange(e.target.value as any)}
                            className="bg-transparent border-none text-[9px] font-black uppercase text-primary focus:outline-none cursor-pointer"
                        >
                            <option value="cheque_date">Cheque Date</option>
                            <option value="date">Voucher Date</option>
                            <option value="clear_date">Clear Date</option>
                        </select>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full h-10 px-3 justify-start text-left text-xs font-medium rounded-xl border-border bg-background shadow-xs",
                                    !date?.from && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-60" />
                                <span className="truncate">
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "dd MMM yyyy")} - {format(date.to, "dd MMM yyyy")}
                                            </>
                                        ) : (
                                            format(date.from, "dd MMM yyyy")
                                        )
                                    ) : (
                                        "Select Dates"
                                    )}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                            {/* Quick Presets */}
                            <div className="flex items-center gap-1.5 pb-3 border-b mb-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold px-2"
                                    onClick={() => applyDatePreset("today")}
                                >
                                    Today
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold px-2"
                                    onClick={() => applyDatePreset("this_week")}
                                >
                                    This Week
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold px-2"
                                    onClick={() => applyDatePreset("this_month")}
                                >
                                    This Month
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold px-2"
                                    onClick={() => applyDatePreset("next_30")}
                                >
                                    Next 30 Days
                                </Button>
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateChange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* 2. Party Dropdown (Searchable) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" /> Party Name
                    </label>
                    <Popover open={partyOpen} onOpenChange={setPartyOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-10 px-3 justify-between text-left text-xs font-medium rounded-xl border-border bg-background shadow-xs"
                            >
                                <span className="truncate">{selectedPartyTitle}</span>
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-40 ml-1" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" align="start">
                            <div className="flex items-center border-b px-2 py-1.5 gap-2 mb-1">
                                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <Input
                                    placeholder="Search party..."
                                    value={partySearch}
                                    onChange={(e) => setPartySearch(e.target.value)}
                                    className="h-7 border-none shadow-none focus-visible:ring-0 text-xs px-1"
                                    autoFocus
                                />
                                {partySearch && (
                                    <button onClick={() => setPartySearch("")}>
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-0.5">
                                <button
                                    onClick={() => handlePartySelect("all")}
                                    className={cn(
                                        "w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-accent transition-colors flex items-center justify-between",
                                        partyId === "all" && "font-bold text-primary bg-primary/10"
                                    )}
                                >
                                    <span>All Parties</span>
                                </button>
                                {filteredParties.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handlePartySelect(String(p.id))}
                                        className={cn(
                                            "w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-accent transition-colors flex items-center justify-between",
                                            String(partyId) === String(p.id) && "font-bold text-primary bg-primary/10"
                                        )}
                                    >
                                        <span className="truncate">{p.title}</span>
                                        {p.code && (
                                            <span className="text-[10px] text-muted-foreground font-mono ml-2 shrink-0">
                                                {p.code}
                                            </span>
                                        )}
                                    </button>
                                ))}
                                {filteredParties.length === 0 && (
                                    <p className="text-center py-3 text-xs text-muted-foreground">
                                        No parties found
                                    </p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* 3. Account / Bank Dropdown (Searchable) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-primary" /> Account / Bank
                    </label>
                    <Popover open={bankOpen} onOpenChange={setBankOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-10 px-3 justify-between text-left text-xs font-medium rounded-xl border-border bg-background shadow-xs"
                            >
                                <span className="truncate">{selectedBankTitle}</span>
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-40 ml-1" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" align="start">
                            <div className="flex items-center border-b px-2 py-1.5 gap-2 mb-1">
                                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <Input
                                    placeholder="Search account..."
                                    value={bankSearch}
                                    onChange={(e) => setBankSearch(e.target.value)}
                                    className="h-7 border-none shadow-none focus-visible:ring-0 text-xs px-1"
                                    autoFocus
                                />
                                {bankSearch && (
                                    <button onClick={() => setBankSearch("")}>
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-0.5">
                                <button
                                    onClick={() => handleBankSelect("all")}
                                    className={cn(
                                        "w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-accent transition-colors flex items-center justify-between",
                                        bankAccountId === "all" && "font-bold text-primary bg-primary/10"
                                    )}
                                >
                                    <span>All Accounts</span>
                                </button>
                                {filteredBanks.map((b) => (
                                    <button
                                        key={b.id}
                                        onClick={() => handleBankSelect(String(b.id))}
                                        className={cn(
                                            "w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-accent transition-colors flex items-center justify-between",
                                            String(bankAccountId) === String(b.id) && "font-bold text-primary bg-primary/10"
                                        )}
                                    >
                                        <span className="truncate">{b.title}</span>
                                    </button>
                                ))}
                                {filteredBanks.length === 0 && (
                                    <p className="text-center py-3 text-xs text-muted-foreground">
                                        No accounts found
                                    </p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* 4. Voucher No Input */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3 text-primary" /> Voucher #
                    </label>
                    <div className="relative">
                        <Input
                            placeholder="e.g. CPV-0439"
                            value={voucherNo}
                            onChange={(e) => handleVoucherNoChange(e.target.value)}
                            className="h-10 text-xs rounded-xl pr-7 border-border bg-background"
                        />
                        {voucherNo && (
                            <button
                                onClick={() => handleVoucherNoChange("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 5. Cheque No Input */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-primary" /> Cheque No
                    </label>
                    <div className="relative">
                        <Input
                            placeholder="e.g. 86942741"
                            value={chequeNo}
                            onChange={(e) => handleChequeNoChange(e.target.value)}
                            className="h-10 text-xs rounded-xl pr-7 border-border bg-background"
                        />
                        {chequeNo && (
                            <button
                                onClick={() => handleChequeNoChange("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 6. Amount Input */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Banknote className="h-3 w-3 text-primary" /> Amount (Rs)
                    </label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="e.g. 150000"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="h-10 text-xs rounded-xl pr-7 border-border bg-background"
                        />
                        {amount && (
                            <button
                                onClick={() => handleAmountChange("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Filtering By:
                    </span>

                    {date?.from && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            <CalendarIcon className="h-3 w-3" />
                            <span className="capitalize">{dateType.replace("_", " ")}:</span>
                            {format(date.from, "dd MMM yyyy")}
                            {date.to && ` - ${format(date.to, "dd MMM yyyy")}`}
                            <button onClick={() => handleDateChange(undefined)} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}

                    {partyId !== "all" && partyId && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
                            <User className="h-3 w-3" />
                            Party: {selectedPartyTitle}
                            <button onClick={() => handlePartySelect("all")} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}

                    {bankAccountId !== "all" && bankAccountId && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
                            <Building2 className="h-3 w-3" />
                            Account: {selectedBankTitle}
                            <button onClick={() => handleBankSelect("all")} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}

                    {voucherNo.trim() && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                            <FileText className="h-3 w-3" />
                            Voucher: {voucherNo}
                            <button onClick={() => handleVoucherNoChange("")} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}

                    {chequeNo.trim() && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-500/20">
                            <CreditCard className="h-3 w-3" />
                            Cheque: {chequeNo}
                            <button onClick={() => handleChequeNoChange("")} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}

                    {amount.trim() && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold border border-orange-500/20">
                            <Banknote className="h-3 w-3" />
                            Amount: Rs {amount}
                            <button onClick={() => handleAmountChange("")} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

