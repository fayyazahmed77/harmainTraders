import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Search, Filter, X, Calendar as CalendarIcon } from "lucide-react";
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

interface FilterProps {
    filters: {
        start_date?: string;
        end_date?: string;
        supplier_id?: string;
        status?: string;
        search?: string;
    };
    suppliers: {
        id: number;
        title: string;
    }[];
}

export default function PurchaseFilters({ filters, suppliers }: FilterProps) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });
    const [supplierId, setSupplierId] = useState(filters.supplier_id || "all");
    const [status, setStatus] = useState(filters.status || "all");
    const [search, setSearch] = useState(filters.search || "");

    const applyFilters = () => {
        router.get(
            "/purchase",
            {
                start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
                end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
                supplier_id: supplierId === "all" ? "" : supplierId,
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
        setSupplierId("all");
        setStatus("all");
        setSearch("");
        router.get("/purchase");
    };

    return (
        <div className=" p-4 rounded-lg shadow-sm border mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">

            {/* Date Range Picker */}
            <div className="flex-1 min-w-[200px]">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
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
            </div>


            {/* Supplier Filter */}
            <div className="flex-1 min-w-[180px]">
                <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={String(supplier.id)}>
                                {supplier.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[150px]">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Partial Return">Partial Return</SelectItem>
                        <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Search Input */}
            <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search invoice..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button onClick={applyFilters} className="bg-primary hover:bg-primary/90">
                    <Filter className="mr-2 h-4 w-4" /> Apply
                </Button>
                <Button variant="outline" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <X className="mr-2 h-4 w-4" /> Clear
                </Button>
            </div>
        </div>
    );
}
