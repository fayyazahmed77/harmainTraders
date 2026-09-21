import React, { useState, useEffect } from "react";
import { Search, X, Globe, Activity, RotateCcw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import { useDebounce } from "@/hooks/use-debounce";
import Select, { SingleValue } from "react-select";

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Option {
  value: number | string;
  label: string;
  code?: string;
}

interface ProvinceFiltersProps {
  filters: {
    search?: string;
    country_id?: string | number;
    is_active?: string | number | boolean;
  };
  countries: Country[];
}

export default function ProvinceFilters({
  filters,
  countries = [],
}: ProvinceFiltersProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(search, 300);

  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Option | null>(null);

  const statusOptions: Option[] = [
    { value: "1", label: "Active Only" },
    { value: "0", label: "Inactive / Suspended" },
  ];

  // Sync state with filters props
  useEffect(() => {
    if (filters.country_id && filters.country_id !== "ALL") {
      const c = countries.find((co) => co.id === Number(filters.country_id));
      if (c) setSelectedCountry({ value: c.id, label: c.name, code: c.code });
    } else {
      setSelectedCountry(null);
    }

    if (filters.is_active !== undefined && filters.is_active !== "" && filters.is_active !== "ALL") {
      const sVal = filters.is_active.toString();
      const s = statusOptions.find((so) => so.value.toString() === sVal);
      if (s) setSelectedStatus(s);
    } else {
      setSelectedStatus(null);
    }
  }, [filters, countries]);

  // Execute Inertia navigation on filter changes
  const applyFilters = (newFilters: {
    search?: string;
    country_id?: number | string;
    is_active?: string | number;
  }) => {
    const params: Record<string, string> = {};

    if (newFilters.search && newFilters.search.trim()) {
      params.search = newFilters.search.trim();
    }
    if (newFilters.country_id && newFilters.country_id !== "ALL") {
      params.country_id = newFilters.country_id.toString();
    }
    if (newFilters.is_active !== undefined && newFilters.is_active !== "" && newFilters.is_active !== "ALL") {
      params.is_active = newFilters.is_active.toString();
    }

    router.get("/provinces", params, {
      preserveState: true,
      replace: true,
      preserveScroll: true,
    });
  };

  // Debounced search trigger
  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? "")) {
      applyFilters({
        search: debouncedSearch,
        country_id: selectedCountry?.value,
        is_active: selectedStatus?.value,
      });
    }
  }, [debouncedSearch]);

  const handleCountryChange = (opt: SingleValue<Option>) => {
    setSelectedCountry(opt);
    applyFilters({
      search,
      country_id: opt?.value,
      is_active: selectedStatus?.value,
    });
  };

  const handleStatusChange = (opt: SingleValue<Option>) => {
    setSelectedStatus(opt);
    applyFilters({
      search,
      country_id: selectedCountry?.value,
      is_active: opt?.value,
    });
  };

  const handleReset = () => {
    setSearch("");
    setSelectedCountry(null);
    setSelectedStatus(null);
    router.get("/provinces", {}, {
      preserveState: true,
      replace: true,
      preserveScroll: true,
    });
  };

  const hasActiveFilters = Boolean(
    search || selectedCountry || selectedStatus
  );

  const countryOptions: Option[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--background, #ffffff)",
      borderColor: state.isFocused ? "var(--ring, #e8941a)" : "var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      minHeight: "38px",
      fontSize: "0.875rem",
      boxShadow: "none",
      "&:hover": {
        borderColor: "var(--ring, #e8941a)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--popover, #ffffff)",
      color: "var(--popover-foreground, #080706)",
      borderColor: "var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
    }),
    menuList: (base: any) => ({
      ...base,
      backgroundColor: "var(--popover, #ffffff)",
      borderRadius: "0.5rem",
      padding: "4px",
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--primary, #e8941a)"
        : state.isFocused
        ? "var(--accent, #f4f4f5)"
        : "transparent",
      color: state.isSelected
        ? "var(--primary-foreground, #ffffff)"
        : "var(--foreground, #080706)",
      cursor: "pointer",
      fontSize: "0.875rem",
      padding: "6px 12px",
      borderRadius: "0.375rem",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground, #080706)",
      fontSize: "0.875rem",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted-foreground, #71717a)",
      fontSize: "0.875rem",
    }),
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border/70 p-4 space-y-3 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search province name, code, or country..."
            className="pl-9 pr-8 h-10 rounded-lg text-sm bg-background border-border/80 focus-visible:ring-1"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Country Filter */}
        <div className="sm:col-span-4">
          <Select<Option, false>
            options={countryOptions}
            value={selectedCountry}
            onChange={handleCountryChange}
            isClearable
            placeholder="Filter by country..."
            styles={customSelectStyles}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            formatOptionLabel={(option: Option) => (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {option.code && (
                    <img
                      src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                      alt=""
                      className="w-4 h-3 rounded-xs object-cover"
                    />
                  )}
                  <span>{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {option.code}
                </span>
              </div>
            )}
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <Select<Option, false>
            options={statusOptions}
            value={selectedStatus}
            onChange={handleStatusChange}
            isClearable
            placeholder="Status..."
            styles={customSelectStyles}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
          />
        </div>
      </div>

      {/* Active Filter Chips & Clear Action */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium mr-1">
              <Filter className="w-3 h-3" /> Active Filters:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground font-medium border border-border/60">
                Keyword: "{search}"
                <button
                  onClick={() => setSearch("")}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCountry && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground font-medium border border-border/60">
                Country: {selectedCountry.label}
                <button
                  onClick={() => handleCountryChange(null)}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground font-medium border border-border/60">
                Status: {selectedStatus.label}
                <button
                  onClick={() => handleStatusChange(null)}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all
          </Button>
        </div>
      )}
    </div>
  );
}
