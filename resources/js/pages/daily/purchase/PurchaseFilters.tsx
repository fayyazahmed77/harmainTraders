import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Search, Filter, X, Calendar as CalendarIcon, Hash, User, ShieldCheck, ChevronDown } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

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

const PREMIUM_ROUNDING = "rounded-xl";

const FieldWrapper = ({ label, icon: Icon, children, className = "" }: { label: string; icon: any; children: React.ReactNode; className?: string }) => (
    <div className={cn("relative group flex-1", className)}>
        <div className="flex items-center gap-2 mb-1.5 px-1">
            <Icon className="h-3 w-3 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                {label}
            </label>
        </div>
        <div className="relative">
            {children}
        </div>
    </div>
);

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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                PREMIUM_ROUNDING,
                "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm"
            )}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">

                {/* 1. Temporal Range */}
                <FieldWrapper label="Temporal Range" icon={CalendarIcon}>
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
                                        <span className="tabular-nums">
                                            {format(date.from, "MMM dd")} — {format(date.to, "MMM dd")}
                                        </span>
                                    ) : (
                                        format(date.from, "MMM dd, y")
                                    )
                                ) : (
                                    "Select Date Window"
                                )}
                                <ChevronDown className="ml-auto h-3 w-3 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                className="bg-white dark:bg-zinc-900"
                            />
                        </PopoverContent>
                    </Popover>
                </FieldWrapper>

                {/* 2. Provider Selection */}
                <FieldWrapper label="Supplier Entity" icon={User}>
                    <Select value={supplierId} onValueChange={setSupplierId}>
                        <SelectTrigger className="w-full h-11 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-orange-500/50 transition-all text-xs font-bold">
                            <SelectValue placeholder="All Providers" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                            <SelectItem value="all" className="text-xs font-bold">All Providers</SelectItem>
                            {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={String(supplier.id)} className="text-xs font-bold">
                                    {supplier.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FieldWrapper>

                {/* 3. Operational Status */}
                <FieldWrapper label="Lifecycle Status" icon={ShieldCheck}>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full h-11 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-orange-500/50 transition-all text-xs font-bold">
                            <SelectValue placeholder="All States" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                            <SelectItem value="all" className="text-xs font-bold lowercase italic opacity-50">Filter by Status</SelectItem>
                            {["Completed", "Partial Return", "Returned"].map((s) => (
                                <SelectItem key={s} value={s} className="text-xs font-bold">
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FieldWrapper>

                {/* 4. Document Search */}
                <FieldWrapper label="Reference Query" icon={Hash}>
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Invoice # / ID"
                            className="w-full h-11 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 focus:border-orange-500/50 focus-visible:ring-0 transition-all text-xs font-bold tabular-nums"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    </div>
                </FieldWrapper>

                {/* 5. Protocol Actions */}
                <div className="flex items-end gap-3 lg:col-span-4 xl:col-span-1">
                    <Button
                        onClick={applyFilters}
                        className="flex-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-orange-600 dark:hover:bg-orange-500 text-white dark:text-zinc-900 h-11 rounded-xl shadow-lg shadow-zinc-200 dark:shadow-none font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Filter className="mr-2 h-3 w-3" /> Execute Filter
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={clearFilters}
                        className="h-11 w-11 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
