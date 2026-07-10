import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/area/DataTable";
import AreaSummary from "./AreaSummary";
import AreaFilters from "./AreaFilters";
import { type BreadcrumbItem } from "@/types";
import { Plus, MapPin, Globe, Navigation, Building2 } from "lucide-react";
import { motion } from "framer-motion";
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
import useToastFromQuery from "@/hooks/useToastFromQuery";
import Select from "react-select";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Areas", href: "/areas" }];

interface Area {
  id: number;
  name: string;
  country_id: number;
  province_id: number;
  city_id: number;
  latitude?: string;
  longitude?: string;
  status: string;
  created_by_name?: string;
  created_by_avatar?: string;
  created_at: string;
}

interface City {
  id: number;
  province_id: number;
  name: string;
  code: string;
}

interface Province {
  id: number;
  country_id: number;
  name: string;
  code: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Option {
  value: number;
  label: string;
  code: string;
}

interface IndexProps {
  countries: Country[];
  provinces: Province[];
  cities: City[];
  areas: Area[];
  filters: {
    search?: string;
    country_id?: string | number;
    province_id?: string | number;
    city_id?: string | number;
  };
}

export default function Index({ countries, provinces, cities, areas, filters }: IndexProps) {
  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const canCreate = Array.isArray(permissions) && permissions.includes("create areas");
  const errors = pageProps.errors || {};

  // Dialog and form states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [country, setCountry] = useState<Option | null>(null);
  const [province, setProvince] = useState<Option | null>(null);
  const [city, setCity] = useState<Option | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch provinces for selected country
  const fetchProvinces = async (countryId: number) => {
    try {
      const res = await fetch(`/areas/countries/${countryId}/provinces`);
      if (!res.ok) throw new Error("Failed fetching provinces");
      const data = await res.json();
      setProvinceOptions(
        data.map((p: Province) => ({
          value: p.id,
          label: p.name,
          code: p.code,
        }))
      );
    } catch (err) {
      console.error(err);
      setProvinceOptions([]);
    }
  };

  // Fetch cities for selected province
  const fetchCities = async (provinceId: number) => {
    try {
      const res = await fetch(`/areas/provinces/${provinceId}/cities`);
      if (!res.ok) throw new Error("Failed fetching cities");
      const data = await res.json();
      setCityOptions(
        data.map((c: City) => ({
          value: c.id,
          label: c.name,
          code: c.code,
        }))
      );
    } catch (err) {
      console.error(err);
      setCityOptions([]);
    }
  };

  // Handlers
  const handleCountryChange = (opt: Option | null) => {
    setCountry(opt);
    setProvince(null);
    setCity(null);
    setProvinceOptions([]);
    setCityOptions([]);

    if (opt) fetchProvinces(opt.value);
  };

  const handleProvinceChange = (opt: Option | null) => {
    setProvince(opt);
    setCity(null);
    setCityOptions([]);

    if (opt) fetchCities(opt.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!country || !province || !city || !areaName.trim()) {
        return toast.error("Please fill in all required fields");
    }

    setIsSubmitting(true);
    const payload = {
      name: areaName,
      country_id: country.value,
      province_id: province.value,
      city_id: city.value,
      latitude,
      longitude,
    };

    router.post("/areas", payload, {
      onSuccess: () => {
        toast.success("Area created successfully");
        setOpenCreateDialog(false);
        setAreaName("");
        setLatitude("");
        setLongitude("");
        setCountry(null);
        setProvince(null);
        setCity(null);
        setProvinceOptions([]);
        setCityOptions([]);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const countryOptions: Option[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  const technicalSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: 'var(--radius)',
      borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
      '&:hover': { borderColor: state.isFocused ? 'var(--ring)' : 'var(--border-hover, #a1a1aa)' },
      boxShadow: 'none',
      height: '40px',
      fontSize: '0.875rem',
      fontWeight: '400',
      backgroundColor: state.isDisabled ? 'var(--muted)' : 'var(--background)',
      color: 'var(--foreground)',
      opacity: state.isDisabled ? 0.5 : 1
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'inherit'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'var(--popover)',
      color: 'var(--popover-foreground)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      zIndex: 50
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'var(--accent)' 
        : state.isFocused 
          ? 'var(--accent)' 
          : 'transparent',
      color: state.isSelected 
        ? 'var(--accent-foreground)' 
        : 'inherit',
      fontSize: '0.875rem',
      cursor: 'pointer'
    })
  };

  return (
    <>
      <Head title="Areas Management" />
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-background">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
              {/* Header section */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Areas
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage districts and local neighborhoods.
                  </p>
                </div>

                <Button
                  onClick={() => setOpenCreateDialog(true)}
                  disabled={!canCreate}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Area
                </Button>
              </motion.div>

              <AreaSummary total={areas.length} />
              <AreaFilters
                filters={filters}
                countries={countries}
                provinces={provinces}
                cities={cities}
              />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <DataTable
                  areas={areas}
                  countries={countries}
                  provinces={provinces}
                  cities={cities}
                />
              </motion.div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl rounded-lg">
          <DialogHeader>
            <DialogTitle>Add New Area</DialogTitle>
            <DialogDescription>Create a new local district node.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Country
                  </Label>
                  <Select<Option, false>
                    options={countryOptions}
                    value={country}
                    onChange={handleCountryChange}
                    placeholder="Select Country"
                    styles={technicalSelectStyles}
                  />
                  {errors.country_id && <p className="text-xs text-destructive">{errors.country_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Navigation className="w-3 h-3" />
                    Province
                  </Label>
                  <Select<Option, false>
                    options={provinceOptions}
                    value={province}
                    onChange={handleProvinceChange}
                    placeholder={country ? "Select Province" : "Awaiting Country..."}
                    isDisabled={!country}
                    styles={technicalSelectStyles}
                  />
                  {errors.province_id && <p className="text-xs text-destructive">{errors.province_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    City
                  </Label>
                  <Select<Option, false>
                    options={cityOptions}
                    value={city}
                    onChange={(opt) => setCity(opt)}
                    placeholder={province ? "Select City" : "Awaiting Province..."}
                    isDisabled={!province}
                    styles={technicalSelectStyles}
                  />
                  {errors.city_id && <p className="text-xs text-destructive">{errors.city_id}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Area Name</Label>
                  <Input
                    required
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="e.g. Gulberg III"
                    className="h-10 text-sm"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Latitude</Label>
                    <Input
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Latitude"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Longitude</Label>
                    <Input
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Longitude"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpenCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Create Area"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
