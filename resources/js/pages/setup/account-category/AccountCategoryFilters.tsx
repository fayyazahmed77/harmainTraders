import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";

interface FilterProps {
    filters: {
        search?: string;
    };
}

export default function AccountCategoryFilters({ filters }: FilterProps) {
    const [search, setSearch] = useState(filters?.search || "");
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                "/account-category",
                { search },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const handleClear = () => {
        setSearch("");
        router.get(
            "/account-category",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative group flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                <Input
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-orange-500/20 transition-all text-xs font-bold"
                />
                {search && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <X className="h-3 w-3 text-zinc-500" />
                    </button>
                )}
            </div>

            <Button
                variant="ghost"
                onClick={handleClear}
                className="h-11 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
                Clear
            </Button>
        </div>
    );
}
