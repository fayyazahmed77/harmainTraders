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

    return (
        <div className="p-4 rounded-md bg-gray-100 dark:bg-card shadow-sm border mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
            {/* Date Range Picker */}
            <FieldWrapper label="Date Range" className="flex-1 min-w-[200px]">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-sky-600" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
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
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </FieldWrapper>

            {/* Customer Filter */}
            <FieldWrapper label="" className="flex-1 min-w-[220px]">
                <Popover open={customerPopupOpen} onOpenChange={setCustomerPopupOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="w-full h-10 justify-between border-slate-200 hover:border-sky-300 font-bold text-sm bg-white"
                        >
                            <span className="truncate">
                                {customerId === "all" ? "All Customers" : activeCustomer?.title}
                            </span>
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 shadow-xl border-slate-200" align="start">
                        <div className="p-2 border-b bg-slate-50">
                            <Input
                                placeholder="Search customer..."
                                value={custSearch}
                                onChange={(e) => setCustSearch(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-auto py-1">
                            <button
                                className={cn(
                                    "flex w-full items-center px-3 py-2 text-xs font-semibold hover:bg-sky-50 transition-colors capitalize",
                                    customerId === "all" && "bg-sky-100 text-sky-700"
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
                                        "flex w-full items-center px-3 py-2 text-xs font-semibold hover:bg-sky-50 transition-colors text-left capitalize",
                                        customerId === String(customer.id) && "bg-sky-100 text-sky-700"
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

            {/* Status Badges */}
            <div className="flex-1 min-w-[300px] flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-md shadow-sm h-10">
                <button
                    onClick={() => setStatus("all")}
                    className={cn(
                        "flex-1 px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-tighter transition-all",
                        status === "all" ? "bg-sky-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    All
                </button>
                {["Completed", "Partial Return", "Returned", "Pending Order", "Canceled"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={cn(
                            "flex-1 px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-tighter transition-all whitespace-nowrap",
                            status === s 
                                ? s === "Completed" ? "bg-green-600 text-white shadow-sm"
                                : s === "Pending Order" ? "bg-orange-500 text-white shadow-sm"
                                : s === "Canceled" ? "bg-slate-700 text-white shadow-sm"
                                : "bg-sky-600 text-white shadow-sm"
                                : "text-slate-500 hover:bg-slate-50"
                        )}
                    >
                        {s.replace(" Order", "")}
                    </button>
                ))}
            </div>

            {/* Online Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-md shadow-sm h-10">
                <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={cn(
                        "px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-tighter transition-all flex items-center gap-2",
                        isOnline ? "bg-orange-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Filter size={12} />
                    Online Only
                </button>
            </div>

            {/* Search Input */}
            <FieldWrapper label="" className="flex-1 min-w-[200px]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-sky-600 z-10" />
                    <Input
                        type="text"
                        placeholder="Search invoice..."
                        className="pl-8 h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors font-bold text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </FieldWrapper>

            {/* Clear Action */}
            <div className="flex items-center gap-2 h-10 mt-auto">
                <Button variant="ghost" onClick={clearFilters} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 p-0" title="Clear Filters">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
