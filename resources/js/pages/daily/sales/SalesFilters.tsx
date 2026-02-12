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

    const applyFilters = () => {
        router.get(
            "/sales",
            {
                start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
                end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
                customer_id: customerId === "all" ? "" : customerId,
                status: status === "all" ? "" : status,
                search: search,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const clearFilters = () => {
        setDate(undefined);
        setCustomerId("all");
        setStatus("all");
        setSearch("");
        router.get("/sales");
    };

    return (
        <div className="p-4 rounded-lg shadow-sm border mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
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
            <FieldWrapper label="Filter by Customer" className="flex-1 min-w-[200px]">
                <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="w-full h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors">
                        <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        {customers.map((customer) => (
                            <SelectItem key={customer.id} value={String(customer.id)}>
                                {customer.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldWrapper>

            {/* Status Filter */}
            <FieldWrapper label="Status" className="flex-1 min-w-[150px]">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors">
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Partial Return">Partial Return</SelectItem>
                        <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                </Select>
            </FieldWrapper>

            {/* Search Input */}
            <FieldWrapper label="Search Invoice / Code" className="flex-1 min-w-[200px]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-sky-600 z-10" />
                    <Input
                        type="text"
                        placeholder="Type to search..."
                        className="pl-8 h-10 border-slate-200 hover:border-sky-300 focus:border-sky-500 transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </FieldWrapper>

            {/* Actions */}
            <div className="flex items-center gap-2 h-10 mt-auto">
                <Button onClick={applyFilters} className="bg-sky-600 hover:bg-sky-700 h-10">
                    <Filter className="mr-2 h-4 w-4" /> Apply
                </Button>
                <Button variant="outline" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 border-slate-200">
                    <X className="mr-2 h-4 w-4" /> Clear
                </Button>
            </div>
        </div>
    );
}
