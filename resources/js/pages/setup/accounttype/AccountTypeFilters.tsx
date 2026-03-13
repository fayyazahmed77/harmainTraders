import React, { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FilterProps {
    filters: {
        search?: string;
    };
}

export default function AccountTypeFilters({ filters }: FilterProps) {
    const [search, setSearch] = useState(filters?.search || "");
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get(
                "/account-types",
                {
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
    }, [search]);

    const clearFilters = () => {
        setSearch("");
        router.get("/account-types");
    };

    return (
        <div className="p-4 rounded-lg shadow-sm border mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search account types..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <X className="mr-2 h-4 w-4" /> Clear
                </Button>
            </div>
        </div>
    );
}
