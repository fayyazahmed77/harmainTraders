"use client";

import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/Cities/DataTable";
import CitySummary from "./CitySummary";
import CityFilters from "./CityFilters";
import { type BreadcrumbItem } from "@/types";
import {
  Plus,
  Building2,
  Globe,
  Navigation,
  Download,
  Activity,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import Select, { SingleValue } from "react-select";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Master Setup", href: "#" },
  { title: "Cities", href: "/cities" },
];

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Province {
  id: number;
  name: string;
  code: string;
  country_id: number;
}

interface City {
  id: number;
  country_id: number;
  province_id: number;
  name: string;
  code: string;
  latitude?: string;
  longitude?: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
  country?: Country;
  province?: Province;
}

interface Option {
  value: number;
  label: string;
  code?: string;
}

interface IndexProps {
  countries: Country[];
  provinces: Province[];
  cities: City[];
  filters: {
    search?: string;
    country_id?: string | number;
    province_id?: string | number;
    is_active?: string | number | boolean;
  };
  summary: {
    total_cities: number;
    active_cities: number;
    provinces_count: number;
    countries_count: number;
    mapped_coordinates_count: number;
  };
}

export default function Index({
  cities = [],
  countries = [],
  provinces = [],
  filters = {},
  summary = {
    total_cities: 0,
    active_cities: 0,
    provinces_count: 0,
    countries_count: 0,
    mapped_coordinates_count: 0,
  },
}: IndexProps) {
  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: {
      user: any;
      permissions: string[];
    };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth?.permissions || [];
  const canCreate =
    Array.isArray(permissions) &&
    (permissions.includes("edit cities") || permissions.includes("create cities"));

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [country, setCountry] = useState<Option | null>(null);
  const [province, setProvince] = useState<Option | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);

  // Country options for select
  const countryOptions: Option[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  // Handle Country selection with cascading Provinces
  const handleCountryChange = async (option: SingleValue<Option>) => {
    setCountry(option);
    setProvince(null);
    setProvinceOptions([]);

    if (option) {
      // Find directly in passed provinces or fetch if needed
      const filtered = provinces.filter((p) => p.country_id === option.value);
      if (filtered.length > 0) {
        setProvinceOptions(
          filtered.map((p) => ({
            value: p.id,
            label: p.name,
            code: p.code,
          }))
        );
      } else {
        try {
          const response = await fetch(`/cities/countries/${option.value}/provinces`);
          if (response.ok) {
            const data: Province[] = await response.json();
            setProvinceOptions(
              data.map((p) => ({
                value: p.id,
                label: p.name,
                code: p.code,
              }))
            );
          }
        } catch (error) {
          console.error("Failed to fetch provinces:", error);
        }
      }
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("City name is required");
      return;
    }
    if (!code.trim()) {
      toast.error("City code is required");
      return;
    }
    if (!country) {
      toast.error("Please select a Country");
      return;
    }
    if (!province) {
      toast.error("Please select a Province");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      country_id: country.value,
      province_id: province.value,
      latitude: latitude.trim() || null,
      longitude: longitude.trim() || null,
      is_active: isActive,
    };

    router.post("/cities", payload, {
      preserveScroll: true,
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setCode("");
        setLatitude("");
        setLongitude("");
        setIsActive(true);
        setCountry(null);
        setProvince(null);
        setProvinceOptions([]);
        toast.success("City created successfully");
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] || "Failed to create city";
        toast.error(msg);
      },
      onFinish: () => {
        setIsSubmitting(false);
      },
    });
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (!cities.length) {
      toast.info("No city data to export");
      return;
    }

    const headers = [
      "ID",
      "Name",
      "Code",
      "Country",
      "Province",
      "Latitude",
      "Longitude",
      "Status",
      "Created By",
      "Created At",
    ];

    const rows = cities.map((c) => [
      c.id,
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.code || "").replace(/"/g, '""')}"`,
      `"${(c.country?.name || "").replace(/"/g, '""')}"`,
      `"${(c.province?.name || "").replace(/"/g, '""')}"`,
      c.latitude || "",
      c.longitude || "",
      c.is_active ? "Active" : "Inactive",
      `"${(c.created_by_name || "").replace(/"/g, '""')}"`,
      `"${(c.created_at || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cities_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Cities export downloaded");
  };

  // Custom styles for react-select matching theme
  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--background, #ffffff)",
      borderColor: state.isFocused ? "var(--ring, #e8941a)" : "var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      minHeight: "42px",
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
      padding: "8px 12px",
      borderRadius: "0.375rem",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground, #080706)",
      fontSize: "0.875rem",
      fontWeight: 500,
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted-foreground, #71717a)",
      fontSize: "0.875rem",
    }),
  };

  return (
    <>
      <Head title="Cities Management" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
            {/* Top Enterprise Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      Cities Directory
                    </h1>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                      {summary.total_cities} records
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Manage territorial municipal districts, regional assignments, and geospatial coordinates
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3.5 gap-2 rounded-lg border-border text-foreground hover:bg-muted font-medium transition-all shadow-xs"
                >
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>

                {canCreate && (
                  <Button
                    onClick={() => setOpenCreateDialog(true)}
                    size="sm"
                    className="h-10 px-4 gap-2 rounded-lg font-semibold shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add City</span>
                  </Button>
                )}
              </div>
            </div>

            {/* KPI Summary Metrics Grid */}
            <CitySummary summary={summary} />

            {/* Live Filter Bar */}
            <CityFilters
              filters={filters}
              countries={countries}
              provinces={provinces}
            />

            {/* Main Data Table */}
            <div className="bg-card text-card-foreground rounded-xl border border-border/70 shadow-xs overflow-hidden">
              <DataTable
                data={cities}
                countries={countries}
                provinces={provinces}
              />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Modern Create City Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="rounded-xl border border-border sm:max-w-[560px] p-0 overflow-hidden bg-card text-card-foreground shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">
                  Add New City
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Register a municipal area under a country and province jurisdiction
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            {/* Country & Province Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  Country <span className="text-destructive">*</span>
                </Label>
                <Select<Option, false>
                  options={countryOptions}
                  value={country}
                  onChange={handleCountryChange}
                  placeholder="Select country..."
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
                  Province <span className="text-destructive">*</span>
                </Label>
                <Select<Option, false>
                  options={provinceOptions}
                  value={province}
                  onChange={(opt) => setProvince(opt)}
                  isDisabled={!country}
                  placeholder={
                    country ? "Select province..." : "Select country first..."
                  }
                  styles={customSelectStyles}
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                  formatOptionLabel={(option: Option) => (
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {option.code}
                      </span>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* City Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  City Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lahore, Dubai"
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  City Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LHE, DXB"
                  className="h-10 rounded-lg font-mono text-sm uppercase"
                />
              </div>
            </div>

            {/* Coordinates Section */}
            <div className="p-3.5 rounded-lg border border-border/70 bg-muted/20 space-y-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Geospatial Coordinates (Optional)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="31.5204"
                    className="h-9 text-xs font-mono rounded-md bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="74.3587"
                    className="h-9 text-xs font-mono rounded-md bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold cursor-pointer">
                  Operational Status
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Allow transactions and area assignments in this city
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <DialogFooter className="pt-3 border-t border-border/60 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg"
                onClick={() => setOpenCreateDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-lg px-6 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Save City"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
