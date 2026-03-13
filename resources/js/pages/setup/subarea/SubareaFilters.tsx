import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { router } from "@inertiajs/react";
import { useDebounce } from "@/hooks/use-debounce";

interface SubareaFiltersProps {
    filters: {
        search?: string;
    };
}

export default function SubareaFilters({ filters }: SubareaFiltersProps) {
    const [search, setSearch] = useState(filters.search ?? "");
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        router.get(
            "/subareas",
            { search: debouncedSearch },
            { preserveState: true, replace: true, preserveScroll: true }
        );
    }, [debouncedSearch]);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
            <div className="relative w-full max-w-sm group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                <Input
                    placeholder="Search subareas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 pl-11 pr-10 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm font-bold placeholder:text-zinc-400 focus:ring-orange-500/20 transition-all text-sm uppercase tracking-tight"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
