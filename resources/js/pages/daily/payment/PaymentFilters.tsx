import React, { useState, useEffect, useRef, useCallback } from "react";
import { router } from "@inertiajs/react";
import { Calendar as CalendarIcon, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface FilterProps {
    filters: {
        start_date?: string;
        end_date?: string;
        account_id?: string;
        type?: string;
        payment_method?: string;
        amount?: string;
    };
    accounts: {
        id: number;
        title: string;
        type: string;
    }[];
}

const DATE_DEBOUNCE_MS = 600;

export default function PaymentFilters({ filters, accounts }: FilterProps) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });
    const [accountId, setAccountId] = useState(filters.account_id || "all");
    const [type, setType] = useState(filters.type || "all");
    const [method, setMethod] = useState(filters.payment_method || "all");
    const [amount, setAmount] = useState(filters.amount || "");
    const [accountSearch, setAccountSearch] = useState("");
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
    const dateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const amountDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Core navigate helper ──────────────────────────────────────────────────
    const navigate = useCallback(
        (overrides: Record<string, string>, onlyProps: string[] = ["payments", "summary", "filters"]) => {
            const currentDate = date;
            const params: Record<string, string> = {
                start_date: currentDate?.from ? format(currentDate.from, "yyyy-MM-dd") : "",
                end_date: currentDate?.to ? format(currentDate.to, "yyyy-MM-dd") : "",
                account_id: accountId === "all" ? "" : accountId,
                type: type === "all" ? "" : type,
                payment_method: method === "all" ? "" : method,
                amount: amount.trim(),
                page: "1",
                ...overrides,
            };
            router.get("/payments", params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: onlyProps,
            });
        },
        [date, accountId, type, method, amount]
    );

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleDateChange = (newDate: DateRange | undefined) => {
        setDate(newDate);
        if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
        // Only fire when both ends are selected or both are cleared
        if ((newDate?.from && newDate?.to) || (!newDate?.from && !newDate?.to)) {
            dateDebounceRef.current = setTimeout(() => {
                navigate(
                    {
                        start_date: newDate?.from ? format(newDate.from, "yyyy-MM-dd") : "",
                        end_date: newDate?.to ? format(newDate.to, "yyyy-MM-dd") : "",
                    },
                    ["payments", "summary", "sales_summary", "purchase_summary", "analytics", "filters"]
                );
            }, DATE_DEBOUNCE_MS);
        }
    };

    const handleAccountChange = (val: string) => {
        setAccountId(val);
        setAccountSearch("");
        setAccountDropdownOpen(false);
        navigate({ account_id: val === "all" ? "" : val });
    };

    const handleTypeChange = (val: string) => {
        setType(val);
        navigate({ type: val === "all" ? "" : val });
    };

    const handleMethodChange = (val: string) => {
        setMethod(val);
        navigate({ payment_method: val === "all" ? "" : val });
    };

    const handleAmountChange = (val: string) => {
        setAmount(val);
        if (amountDebounceRef.current) clearTimeout(amountDebounceRef.current);
        amountDebounceRef.current = setTimeout(() => {
            navigate({ amount: val.trim() });
        }, 500);
    };

    const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (amountDebounceRef.current) clearTimeout(amountDebounceRef.current);
            navigate({ amount: amount.trim() });
        }
    };

    const clearFilters = () => {
        setDate(undefined);
        setAccountId("all");
        setType("all");
        setMethod("all");
        setAmount("");
        setAccountSearch("");
        if (amountDebounceRef.current) clearTimeout(amountDebounceRef.current);
        router.get(
            "/payments",
            { page: "1" },
            {
                replace: true,
                preserveState: true,
                preserveScroll: true,
                only: ["payments", "summary", "sales_summary", "purchase_summary", "analytics", "filters"],
            }
        );
    };

    // Cleanup debounces on unmount
    useEffect(() => () => {
        if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
        if (amountDebounceRef.current) clearTimeout(amountDebounceRef.current);
    }, []);

    // ── Filtered account list ─────────────────────────────────────────────────
    const filteredAccounts = accountSearch.trim()
        ? accounts.filter((a) =>
              a.title.toLowerCase().includes(accountSearch.toLowerCase())
          )
        : accounts;

    const selectedAccountTitle =
        accountId === "all"
            ? "All Accounts"
            : (accounts.find((a) => String(a.id) === accountId)?.title ?? "All Accounts");

    const hasFilters =
        !!date?.from ||
        accountId !== "all" ||
        type !== "all" ||
        method !== "all" ||
        !!amount.trim();

    return (
        <div className="p-4 rounded-lg shadow-sm border mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">

            {/* Date Range Picker */}
            <div className="flex-1 min-w-[200px]">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="payment-filter-date"
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} &ndash;{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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

            {/* Account Filter — searchable custom dropdown */}
            <div className="flex-1 min-w-[200px]">
                <Popover open={accountDropdownOpen} onOpenChange={setAccountDropdownOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id="payment-filter-account"
                            variant="outline"
                            className="w-full justify-between font-normal"
                        >
                            <span className="truncate">{selectedAccountTitle}</span>
                            <span className="ml-2 text-muted-foreground text-xs opacity-60">▾</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start">
                        {/* Search input */}
                        <div className="flex items-center border-b px-3 py-2 gap-2">
                            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <Input
                                id="payment-account-search"
                                autoFocus
                                placeholder="Search account…"
                                value={accountSearch}
                                onChange={(e) => setAccountSearch(e.target.value)}
                                className="h-7 border-none shadow-none focus-visible:ring-0 text-sm px-0"
                            />
                            {accountSearch && (
                                <button onClick={() => setAccountSearch("")}>
                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                        {/* Options list */}
                        <div className="max-h-60 overflow-y-auto py-1">
                            <button
                                className={cn(
                                    "w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors",
                                    accountId === "all" && "font-semibold text-primary bg-accent/50"
                                )}
                                onClick={() => handleAccountChange("all")}
                            >
                                All Accounts
                            </button>
                            {filteredAccounts.slice(0, 50).map((account) => (
                                <button
                                    key={account.id}
                                    className={cn(
                                        "w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center justify-between",
                                        String(account.id) === accountId && "font-semibold text-primary bg-accent/50"
                                    )}
                                    onClick={() => handleAccountChange(String(account.id))}
                                >
                                    <span className="truncate">{account.title}</span>
                                    {account.type && (
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground ml-2 px-1.5 py-0.5 rounded bg-muted shrink-0">
                                            {account.type}
                                        </span>
                                    )}
                                </button>
                            ))}
                            {filteredAccounts.length > 50 && (
                                <div className="px-3 py-1.5 text-[11px] text-muted-foreground text-center bg-muted/40 border-t">
                                    Showing top 50 of {filteredAccounts.length} — type to narrow down
                                </div>
                            )}
                            {filteredAccounts.length === 0 && (
                                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                                    No accounts found
                                </p>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Type Filter */}
            <div className="flex-1 min-w-[150px]">
                <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger id="payment-filter-type" className="w-full">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="RECEIPT">Receipt</SelectItem>
                        <SelectItem value="PAYMENT">Payment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Method Filter */}
            <div className="flex-1 min-w-[150px]">
                <Select value={method} onValueChange={handleMethodChange}>
                    <SelectTrigger id="payment-filter-method" className="w-full">
                        <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Amount Filter */}
            <div className="w-[130px] min-w-[110px] shrink-0 relative">
                <Input
                    id="payment-filter-amount"
                    type="number"
                    placeholder="Amount..."
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onKeyDown={handleAmountKeyDown}
                    className="w-full h-10 pr-7 text-sm"
                    min="0"
                    step="any"
                />
                {amount && (
                    <button
                        type="button"
                        onClick={() => {
                            setAmount("");
                            if (amountDebounceRef.current) clearTimeout(amountDebounceRef.current);
                            navigate({ amount: "" });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        title="Clear amount"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Clear — only when a filter is active */}
            {hasFilters && (
                <Button
                    id="payment-filter-clear"
                    variant="outline"
                    onClick={clearFilters}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    title="Clear all filters"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
