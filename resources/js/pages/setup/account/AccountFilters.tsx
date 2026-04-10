import React, { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { Search, X, Check, ChevronsUpDown } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface FilterProps {
    filters: {
        type?: string;
        city_id?: string;
        status?: string;
        search?: string;
    };
    accountTypes: {
        id: number;
        name: string;
    }[];
    cities: {
        id: number;
        name: string;
    }[];
}

export default function AccountFilters({ filters, accountTypes, cities }: FilterProps) {
    const [type, setType] = useState(filters.type || "all");
    const [cityId, setCityId] = useState(filters.city_id || "all");
    const [status, setStatus] = useState(filters.status || "all");
    const [search, setSearch] = useState(filters.search || "");
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get(
                "/account",
                {
                    type: type === "all" ? "" : type,
                    city_id: cityId === "all" ? "" : cityId,
                    status: status === "all" ? "" : status,
                    search: search,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, type, cityId, status]);

    const clearFilters = () => {
        setType("all");
        setCityId("all");
        setStatus("all");
        setSearch("");
        router.get("/account");
    };

    return (
        <div className="p-4 rounded-xl border mb-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/40 dark:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search Input */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                    <Input
                        type="text"
                        placeholder="Quick search..."
                        className="pl-9 h-10 border-zinc-200 focus:border-orange-500 focus:ring-orange-500 dark:bg-zinc-800 dark:border-zinc-700 transition-all rounded-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Type Filter */}
                <Combobox
                    options={[
                        { label: "Every Category", value: "all" },
                        ...accountTypes.map(t => ({ label: t.name, value: String(t.id) }))
                    ]}
                    value={type}
                    onChange={setType}
                    placeholder="Account Type"
                    searchPlaceholder="Search types..."
                />

                {/* City Filter */}
                <Combobox
                    options={[
                        { label: "Global (All Cities)", value: "all" },
                        ...cities.map(city => ({ label: city.name, value: String(city.id) }))
                    ]}
                    value={cityId}
                    onChange={setCityId}
                    placeholder="Select City"
                    searchPlaceholder="Search cities..."
                />

                {/* Status Filter */}
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 w-full rounded-lg dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-orange-500 transition-all">
                        <SelectValue placeholder="Login Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Conditions</SelectItem>
                        <SelectItem value="active">🟢 Active Only</SelectItem>
                        <SelectItem value="inactive">🔴 Offline Only</SelectItem>
                    </SelectContent>
                </Select>

                {/* Clear Actions */}
                <Button 
                    variant="ghost" 
                    onClick={clearFilters} 
                    className="h-10 px-4 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg font-bold text-xs uppercase tracking-widest transition-all border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-rose-300"
                >
                    <X className="mr-2 h-4 w-4" /> Reset Filters
                </Button>
            </div>
        </div>
    );
}
