import React, { useState, useEffect } from "react";
import { Search, X, Globe, Navigation, Activity, RotateCcw, Filter } from "lucide-react";
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

interface Province {
  id: number;
  country_id: number;
  name: string;
  code: string;
}

interface Option {
  value: number | string;
  label: string;
  code?: string;
}

interface CityFiltersProps {
  filters: {
    search?: string;
    country_id?: string | number;
    province_id?: string | number;
    is_active?: string | number | boolean;
  };
  countries: Country[];
  provinces: Province[];
}

export default function CityFilters({
  filters,
  countries = [],
  provinces = [],
}: CityFiltersProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(search, 300);

  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Option | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Option | null>(null);

  const statusOptions: Option[] = [
    { value: "1", label: "Active Only" },
    { value: "0", label: "Offline / Inactive" },
  ];

  // Sync state with filters props
  useEffect(() => {
    if (filters.country_id && filters.country_id !== "ALL") {
      const c = countries.find((co) => co.id === Number(filters.country_id));
      if (c) setSelectedCountry({ value: c.id, label: c.name, code: c.code });
    } else {
      setSelectedCountry(null);
    }
  }, [filters.country_id, countries]);

  useEffect(() => {
    if (filters.province_id && filters.province_id !== "ALL") {
      const p = provinces.find((pr) => pr.id === Number(filters.province_id));
      if (p) setSelectedProvince({ value: p.id, label: p.name, code: p.code });
    } else {
      setSelectedProvince(null);
    }
  }, [filters.province_id, provinces]);

  useEffect(() => {
    if (filters.is_active !== undefined && filters.is_active !== "ALL") {
      const s = statusOptions.find((opt) => String(opt.value) === String(filters.is_active));
      if (s) setSelectedStatus(s);
    } else {
      setSelectedStatus(null);
    }
  }, [filters.is_active]);

  const triggerNavigation = (
    searchVal: string,
    cId?: number | string | null,
    pId?: number | string | null,
    statusVal?: number | string | null
  ) => {
    router.get(
      "/cities",
      {
        search: searchVal || undefined,
        country_id: cId || undefined,
        province_id: pId || undefined,
        is_active: statusVal !== undefined && statusVal !== null ? statusVal : undefined,
      },
      { preserveState: true, replace: true, preserveScroll: true }
    );
  };

  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? "")) {
      triggerNavigation(
        debouncedSearch,
        selectedCountry?.value,
        selectedProvince?.value,
        selectedStatus?.value
      );
    }
  }, [debouncedSearch]);

  const handleCountryChange = (opt: SingleValue<Option>) => {
    setSelectedCountry(opt);
    setSelectedProvince(null);
    triggerNavigation(search, opt ? opt.value : null, null, selectedStatus?.value);
  };

  const handleProvinceChange = (opt: SingleValue<Option>) => {
    setSelectedProvince(opt);
    triggerNavigation(search, selectedCountry?.value, opt ? opt.value : null, selectedStatus?.value);
  };

  const handleStatusChange = (opt: SingleValue<Option>) => {
    setSelectedStatus(opt);
    triggerNavigation(
      search,
      selectedCountry?.value,
      selectedProvince?.value,
      opt ? opt.value : null
    );
  };

  const handleClearAll = () => {
    setSearch("");
    setSelectedCountry(null);
    setSelectedProvince(null);
    setSelectedStatus(null);
    router.get(
      "/cities",
      {},
      { preserveState: true, replace: true, preserveScroll: true }
    );
  };

  // Filter provinces list based on selected country
  const filteredProvinces = selectedCountry
    ? provinces.filter((p) => p.country_id === Number(selectedCountry.value))
    : provinces;

  const countryOptions: Option[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  const provinceOptions: Option[] = filteredProvinces.map((p) => ({
    value: p.id,
    label: p.name,
    code: p.code,
  }));

  const activeFiltersCount = [
    search,
    selectedCountry,
    selectedProvince,
    selectedStatus,
  ].filter(Boolean).length;

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "38px",
      height: "38px",
      fontSize: "12px",
      fontWeight: "600",
      backgroundColor: "var(--background, #ffffff)",
      borderColor: state.isFocused ? "var(--primary, #e8941a)" : "var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      boxShadow: "none",
      "&:hover": {
        borderColor: "var(--ring, #e8941a)",
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground, #080706)",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted-foreground, #71717a)",
      fontSize: "12px",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--popover, #ffffff)",
      color: "var(--popover-foreground, #080706)",
      border: "1px solid var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
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
      fontSize: "12px",
      fontWeight: "500",
      cursor: "pointer",
      borderRadius: "0.375rem",
    }),
  };

  return (
    <div className="space-y-3 bg-card border border-border/70 rounded-xl p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cities by name, code, jurisdiction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-[38px] text-xs bg-background border-border/80 rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Country Filter */}
        <div className="lg:col-span-3">
          <Select<Option, false>
            options={countryOptions}
            value={selectedCountry}
            onChange={handleCountryChange}
            isClearable
            placeholder="All Countries"
            styles={selectStyles}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            formatOptionLabel={(opt) => (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {opt.code && (
                    <img
                      src={`https://flagcdn.com/w40/${opt.code.toLowerCase()}.png`}
                      alt={opt.label}
                      className="w-4 h-3 object-cover rounded-xs border border-border/60"
                    />
                  )}
                  <span>{opt.label}</span>
                </div>
                {opt.code && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    #{opt.code}
                  </span>
                )}
              </div>
            )}
          />
        </div>

        {/* Province Filter */}
        <div className="lg:col-span-3">
          <Select<Option, false>
            options={provinceOptions}
            value={selectedProvince}
            onChange={handleProvinceChange}
            isClearable
            placeholder={selectedCountry ? "All Provinces" : "Select Province"}
            styles={selectStyles}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            formatOptionLabel={(opt) => (
              <div className="flex items-center justify-between">
                <span>{opt.label}</span>
                {opt.code && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    #{opt.code}
                  </span>
                )}
              </div>
            )}
          />
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2">
          <Select<Option, false>
            options={statusOptions}
            value={selectedStatus}
            onChange={handleStatusChange}
            isClearable
            placeholder="All Statuses"
            styles={selectStyles}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
          />
        </div>
      </div>

      {/* Active Filter Chips & Clear Action */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Filter className="h-3 w-3" />
            <span>Active Filters ({activeFiltersCount}):</span>
          </div>

          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">
              Keyword: "{search}"
              <button onClick={() => setSearch("")} className="hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedCountry && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">
              Country: {selectedCountry.label}
              <button onClick={() => handleCountryChange(null)} className="hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedProvince && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">
              Province: {selectedProvince.label}
              <button onClick={() => handleProvinceChange(null)} className="hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">
              Status: {selectedStatus.label}
              <button onClick={() => handleStatusChange(null)} className="hover:opacity-75">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            Reset All
          </Button>
        </div>
      )}
    </div>
  );
}
