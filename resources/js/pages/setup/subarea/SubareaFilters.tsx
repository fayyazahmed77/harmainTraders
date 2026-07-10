import React, { useState, useEffect } from "react";
import { Search, X, Globe, Navigation, Building2, MapPin, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import { useDebounce } from "@/hooks/use-debounce";
import Select from "react-select";

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Province {
  id: number;
  country_id: number;
  name: string;
}

interface City {
  id: number;
  province_id: number;
  name: string;
}

interface Area {
  id: number;
  city_id: number;
  province_id: number;
  country_id: number;
  name: string;
}

interface Option {
  value: number;
  label: string;
}

interface SubareaFiltersProps {
  filters: {
    search?: string;
    country_id?: string | number;
    province_id?: string | number;
    city_id?: string | number;
    area_id?: string | number;
  };
  countries: Country[];
  provinces: Province[];
  cities: City[];
  areas: Area[];
}

export default function SubareaFilters({
  filters,
  countries = [],
  provinces = [],
  cities = [],
  areas = [],
}: SubareaFiltersProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(search, 300);

  // Selected Option states
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Option | null>(null);
  const [selectedCity, setSelectedCity] = useState<Option | null>(null);
  const [selectedArea, setSelectedArea] = useState<Option | null>(null);

  // Synchronize options with filters props
  useEffect(() => {
    if (filters.country_id) {
      const c = countries.find((co) => co.id === Number(filters.country_id));
      if (c) setSelectedCountry({ value: c.id, label: c.name });
    } else {
      setSelectedCountry(null);
    }
  }, [filters.country_id, countries]);

  useEffect(() => {
    if (filters.province_id) {
      const p = provinces.find((pr) => pr.id === Number(filters.province_id));
      if (p) setSelectedProvince({ value: p.id, label: p.name });
    } else {
      setSelectedProvince(null);
    }
  }, [filters.province_id, provinces]);

  useEffect(() => {
    if (filters.city_id) {
      const ci = cities.find((ct) => ct.id === Number(filters.city_id));
      if (ci) setSelectedCity({ value: ci.id, label: ci.name });
    } else {
      setSelectedCity(null);
    }
  }, [filters.city_id, cities]);

  useEffect(() => {
    if (filters.area_id) {
      const a = areas.find((ar) => ar.id === Number(filters.area_id));
      if (a) setSelectedArea({ value: a.id, label: a.name });
    } else {
      setSelectedArea(null);
    }
  }, [filters.area_id, areas]);

  const triggerNavigation = (
    searchVal: string,
    cId?: number | null,
    pId?: number | null,
    ciId?: number | null,
    aId?: number | null
  ) => {
    router.get(
      "/subareas",
      {
        search: searchVal || undefined,
        country_id: cId || undefined,
        province_id: pId || undefined,
        city_id: ciId || undefined,
        area_id: aId || undefined,
      },
      { preserveState: true, replace: true, preserveScroll: true }
    );
  };

  // Sync Search Debounce
  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? "")) {
      triggerNavigation(
        debouncedSearch,
        selectedCountry?.value,
        selectedProvince?.value,
        selectedCity?.value,
        selectedArea?.value
      );
    }
  }, [debouncedSearch]);

  // Dropdown cascades & handlers
  const handleCountryChange = (opt: Option | null) => {
    setSelectedCountry(opt);
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedArea(null);
    triggerNavigation(search, opt?.value, null, null, null);
  };

  const handleProvinceChange = (opt: Option | null) => {
    setSelectedProvince(opt);
    setSelectedCity(null);
    setSelectedArea(null);
    triggerNavigation(search, selectedCountry?.value, opt?.value, null, null);
  };

  const handleCityChange = (opt: Option | null) => {
    setSelectedCity(opt);
    setSelectedArea(null);
    triggerNavigation(search, selectedCountry?.value, selectedProvince?.value, opt?.value, null);
  };

  const handleAreaChange = (opt: Option | null) => {
    setSelectedArea(opt);
    triggerNavigation(search, selectedCountry?.value, selectedProvince?.value, selectedCity?.value, opt?.value);
  };

  const handleClearAll = () => {
    setSearch("");
    setSelectedCountry(null);
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedArea(null);
    router.get(
      "/subareas",
      {},
      { preserveState: true, replace: true, preserveScroll: true }
    );
  };

  // Cascade Filtering lists for searchable select dropdown options
  const countryOptions = countries.map((c) => ({ value: c.id, label: c.name }));

  const filteredProvinces = selectedCountry
    ? provinces.filter((p) => p.country_id === selectedCountry.value)
    : provinces;
  const provinceOptions = filteredProvinces.map((p) => ({ value: p.id, label: p.name }));

  const filteredCities = selectedProvince
    ? cities.filter((c) => c.province_id === selectedProvince.value)
    : selectedCountry
    ? cities.filter((c) => {
        const prov = provinces.find((p) => p.id === c.province_id);
        return prov?.country_id === selectedCountry.value;
      })
    : cities;
  const cityOptions = filteredCities.map((c) => ({ value: c.id, label: c.name }));

  const filteredAreas = selectedCity
    ? areas.filter((a) => a.city_id === selectedCity.value)
    : selectedProvince
    ? areas.filter((a) => a.province_id === selectedProvince.value)
    : selectedCountry
    ? areas.filter((a) => a.country_id === selectedCountry.value)
    : areas;
  const areaOptions = filteredAreas.map((a) => ({ value: a.id, label: a.name }));

  const hasActiveFilters = !!(
    search ||
    selectedCountry ||
    selectedProvince ||
    selectedCity ||
    selectedArea
  );

  const filterSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: "var(--radius)",
      borderColor: "var(--border)",
      "&:hover": { borderColor: "var(--ring)" },
      boxShadow: "none",
      height: "40px",
      fontSize: "0.875rem",
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "inherit",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted-foreground)",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--popover)",
      color: "var(--popover-foreground)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      zIndex: 50,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--accent)"
        : state.isFocused
        ? "var(--accent)"
        : "transparent",
      color: state.isSelected ? "var(--accent-foreground)" : "inherit",
      fontSize: "0.875rem",
      cursor: "pointer",
    }),
  };

  return (
    <div className="space-y-4 py-6 border-b">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
        {/* Search Text */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Search Subareas</label>
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
            <Input
              placeholder="Type name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-9 rounded-md border-zinc-200 dark:border-zinc-800 bg-background text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            Country
          </label>
          <Select<Option, false>
            options={countryOptions}
            value={selectedCountry}
            onChange={handleCountryChange}
            placeholder="All Countries"
            isClearable
            styles={filterSelectStyles}
          />
        </div>

        {/* Province */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
            Province
          </label>
          <Select<Option, false>
            options={provinceOptions}
            value={selectedProvince}
            onChange={handleProvinceChange}
            placeholder="All Provinces"
            isClearable
            styles={filterSelectStyles}
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            City
          </label>
          <Select<Option, false>
            options={cityOptions}
            value={selectedCity}
            onChange={handleCityChange}
            placeholder="All Cities"
            isClearable
            styles={filterSelectStyles}
          />
        </div>

        {/* Area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Area
          </label>
          <Select<Option, false>
            options={areaOptions}
            value={selectedArea}
            onChange={handleAreaChange}
            placeholder="All Areas"
            isClearable
            styles={filterSelectStyles}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
