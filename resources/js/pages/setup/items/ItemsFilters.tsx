import React, { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { Search, Filter, X, Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface FilterProps {
    filters: {
        category_id?: string;
        status?: string;
        stock_status?: string;
        search?: string;
    };
    categories: {
        id: number;
        name: string;
    }[];
}

export default function ItemsFilters({ filters, categories }: FilterProps) {
    const [categoryId, setCategoryId] = useState(filters.category_id || "all");
    const [status, setStatus] = useState(filters.status || "all");
    const [stockStatus, setStockStatus] = useState(filters.stock_status || "all");
    const [search, setSearch] = useState(filters.search || "");
    const [categorySearchOpen, setCategorySearchOpen] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState("");
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get(
                "/items",
                {
                    category_id: categoryId === "all" ? "" : categoryId,
                    status: status === "all" ? "" : status,
                    stock_status: stockStatus === "all" ? "" : stockStatus,
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
    }, [search, categoryId, status, stockStatus]);

    const clearFilters = () => {
        setCategoryId("all");
        setStatus("all");
        setStockStatus("all");
        setSearch("");
        router.get("/items");
    };

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );

    const selectedCategory = categories.find((cat) => String(cat.id) === categoryId);

    return (
        <div className="p-4 rounded-lg shadow-sm border mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search code, title, company, category..."
                    className="pl-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-visible:ring-primary"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Category Filter - Searchable */}
            <div className="w-[200px]">
                <Popover open={categorySearchOpen} onOpenChange={setCategorySearchOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={categorySearchOpen}
                            className="w-full justify-between"
                        >
                            {categoryId === "all"
                                ? "All Categories"
                                : selectedCategory?.name || "Select Category"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search categories..."
                                    value={categorySearchQuery}
                                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-1">
                            <div
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    categoryId === "all" && "bg-accent"
                                )}
                                onClick={() => {
                                    setCategoryId("all");
                                    setCategorySearchOpen(false);
                                    setCategorySearchQuery("");
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        categoryId === "all" ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                All Categories
                            </div>
                            {filteredCategories.length === 0 ? (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                    No categories found.
                                </div>
                            ) : (
                                filteredCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                            categoryId === String(category.id) && "bg-accent"
                                        )}
                                        onClick={() => {
                                            setCategoryId(String(category.id));
                                            setCategorySearchOpen(false);
                                            setCategorySearchQuery("");
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                categoryId === String(category.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {category.name}
                                    </div>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Stock Filter */}
            <div className="w-[150px]">
                <Select value={stockStatus} onValueChange={setStockStatus}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Stock" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stock</SelectItem>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[150px]">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 transition-colors delay-75 duration-200">
                    <X className="mr-2 h-4 w-4" /> Clear
                </Button>
            </div>
        </div>
    );
}
