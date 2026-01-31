import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Search, Filter, X } from "lucide-react";
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
    // Assuming 'type' filter matches the account type Name (string) as per controller query logic assumption.
    const [type, setType] = useState(filters.type || "all");
    const [cityId, setCityId] = useState(filters.city_id || "all");
    const [status, setStatus] = useState(filters.status || "all");
    const [search, setSearch] = useState(filters.search || "");

    const applyFilters = () => {
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
            }
        );
    };

    const clearFilters = () => {
        setType("all");
        setCityId("all");
        setStatus("all");
        setSearch("");
        router.get("/account");
    };

    return (
        <div className="p-4 rounded-lg shadow-sm border mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
            {/* Type Filter */}
            <div className="flex-1 min-w-[180px]">
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {/* Full dynamic list */}
                        {accountTypes.map(t => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* City Filter */}
            <div className="flex-1 min-w-[180px]">
                <Select value={cityId} onValueChange={setCityId}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {cities.map((city) => (
                            <SelectItem key={city.id} value={String(city.id)}>
                                {city.name}
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Search Input */}
            <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search code or title..."
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
