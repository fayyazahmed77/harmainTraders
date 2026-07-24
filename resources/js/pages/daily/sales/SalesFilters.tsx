import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, Filter, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";

interface FilterProps {
    filters: {
        start_date?: string;
        end_date?: string;
        customer_id?: string;
        status?: string;
        search?: string;
        is_online?: string;
    };
    customers: {
        id: number;
        title: string;
    }[];
}

const FieldWrapper = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
    <div className={`relative ${className}`}>
        <label className="absolute -top-2 left-3 px-2 bg-white dark:bg-[#0a0a0a] text-[11px] font-medium text-gray-600 z-10 leading-none">
            {label}
        </label>
        <div>
            {children}
        </div>
    </div>
);

export default function SalesFilters({ filters, customers }: FilterProps) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });
    const [customerId, setCustomerId] = useState(filters.customer_id || "all");
    const [status, setStatus] = useState(filters.status || "all");
    const [search, setSearch] = useState(filters.search || "");
    const [isOnline, setIsOnline] = useState(filters.is_online === 'true');

    const applyFilters = (overrides = {}) => {
        const newFilters = {
            start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
            end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
            customer_id: customerId === "all" ? "" : customerId,
            status: status === "all" ? "" : status,
            search: search,
            is_online: isOnline ? 'true' : '',
            ...overrides
        };

        router.get("/sales", newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setDate(undefined);
        setCustomerId("all");
        setStatus("all");
        setSearch("");
        setIsOnline(false);
        router.get("/sales");
    };

    // Auto-apply filters when state changes (except search which needs debounce)
    React.useEffect(() => {
        if (customerId !== (filters.customer_id || "all")) {
            applyFilters({ customer_id: customerId === "all" ? "" : customerId });
        }
    }, [customerId]);

    React.useEffect(() => {
        if (status !== (filters.status || "all")) {
            applyFilters({ status: status === "all" ? "" : status });
        }
    }, [status]);

    React.useEffect(() => {
        if (isOnline !== (filters.is_online === 'true')) {
            applyFilters({ is_online: isOnline ? 'true' : '' });
        }
    }, [isOnline]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || "")) {
                applyFilters({ search });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    React.useEffect(() => {
        const start = date?.from ? format(date.from, "yyyy-MM-dd") : "";
        const end = date?.to ? format(date.to, "yyyy-MM-dd") : "";
        if (start !== (filters.start_date || "") || end !== (filters.end_date || "")) {
            applyFilters({ start_date: start, end_date: end });
        }
    }, [date]);

    const activeCustomer = customers.find(c => String(c.id) === customerId);
    const [customerPopupOpen, setCustomerPopupOpen] = useState(false);
    const [custSearch, setCustSearch] = useState("");

    const filteredCusts = customers.filter(c => 
        c.title.toLowerCase().includes(custSearch.toLowerCase())
    );

    const isFiltered = !!(
        date?.from ||
        (customerId && customerId !== "all") ||
        (status && status !== "all") ||
        search ||
        isOnline
    );

    return (
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
                {/* Date Range Picker */}
                <FieldWrapper label="Date Range" className="w-full min-w-0">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-semibold h-10 text-xs border-border bg-background hover:bg-accent",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="truncate">
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "MMM dd, y")
                                        )
                                    ) : (
                                        "All Dates"
                                    )}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </FieldWrapper>

                {/* Customer Filter */}
                <FieldWrapper label="Select Customer" className="w-full min-w-0">
                    <Popover open={customerPopupOpen} onOpenChange={setCustomerPopupOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-10 justify-between font-semibold text-xs bg-background border-border hover:bg-accent px-3"
                            >
                                <span className="truncate">
                                    {customerId === "all" ? "All Customers" : activeCustomer?.title}
                                </span>
                                <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 shadow-xl border-border" align="start">
                            <div className="p-2 border-b bg-muted/40">
                                <Input
                                    placeholder="Search customer..."
                                    value={custSearch}
                                    onChange={(e) => setCustSearch(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="max-h-[260px] overflow-auto py-1">
                                <button
                                    className={cn(
                                        "flex w-full items-center px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors capitalize",
                                        customerId === "all" && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => {
                                        setCustomerId("all");
                                        setCustomerPopupOpen(false);
                                        setCustSearch("");
                                    }}
                                >
                                    All Customers
                                </button>
                                {filteredCusts.map((customer) => (
                                    <button
                                        key={customer.id}
                                        className={cn(
                                            "flex w-full items-center px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors text-left capitalize truncate",
                                            customerId === String(customer.id) && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => {
                                            setCustomerId(String(customer.id));
                                            setCustomerPopupOpen(false);
                                            setCustSearch("");
                                        }}
                                    >
                                        {customer.title}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </FieldWrapper>

                {/* Status Filter */}
                <FieldWrapper label="Status" className="w-full min-w-0">
                    <Select value={status} onValueChange={(val) => setStatus(val)}>
                        <SelectTrigger className="h-10 text-xs font-semibold bg-background border-border">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Partial Return">Partial Return</SelectItem>
                            <SelectItem value="Returned">Returned</SelectItem>
                            <SelectItem value="Pending Order">Pending Order</SelectItem>
                            <SelectItem value="Canceled">Canceled</SelectItem>
                        </SelectContent>
                    </Select>
                </FieldWrapper>

                {/* Search Invoice & Online & Reset */}
                <FieldWrapper label="Search Invoice" className="w-full min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-muted-foreground z-10" />
                            <Input
                                type="text"
                                placeholder="Invoice no..."
                                className="pl-8 pr-7 h-10 border-border bg-background focus:border-primary transition-colors font-semibold text-xs"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Online Toggle */}
                        <Button
                            type="button"
                            variant={isOnline ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsOnline(!isOnline)}
                            className={cn(
                                "h-10 px-2.5 text-[10px] font-black uppercase tracking-tighter shrink-0 transition-all",
                                isOnline ? "bg-orange-600 hover:bg-orange-700 text-white" : "text-muted-foreground"
                            )}
                            title="Filter Online Sales Only"
                        >
                            <Filter className="h-3 w-3 mr-1" />
                            Online
                        </Button>

                        {/* Clear Action */}
                        {isFiltered && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-10 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                                title="Clear All Filters"
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                <span className="text-[10px] font-bold uppercase">Reset</span>
                            </Button>
                        )}
                    </div>
                </FieldWrapper>
            </div>
        </div>
    );
}
