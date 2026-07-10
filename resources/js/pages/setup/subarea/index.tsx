import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/subarea/DataTable";
import SubareaSummary from "./SubareaSummary";
import SubareaFilters from "./SubareaFilters";
import { type BreadcrumbItem } from "@/types";
import { Plus, Layers, Globe, Navigation, Building2, MapPin } from "lucide-react";
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

const breadcrumbs: BreadcrumbItem[] = [{ title: "Subareas", href: "/subareas" }];

interface Subarea {
  id: number;
  name: string;
  country_id: number;
  province_id: number;
  city_id: number;
  area_id: number;
  status: string;
  created_by_name?: string;
  created_by_avatar?: string;
  created_at: string;
}

interface Area {
  id: number;
  name: string;
  city_id: number;
  province_id: number;
  country_id: number;
}

interface City {
  id: number;
  province_id: number;
  name: string;
}

interface Province {
  id: number;
  country_id: number;
  name: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Option {
  value: number;
  label: string;
}

interface IndexProps {
  countries: Country[];
  provinces: Province[];
  cities: City[];
  areas: Area[];
  subareas: Subarea[];
  filters: {
    search?: string;
    country_id?: string | number;
    province_id?: string | number;
    city_id?: string | number;
    area_id?: string | number;
  };
}

export default function Index({ countries, provinces, cities, areas, subareas, filters }: IndexProps) {
  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const canCreate = Array.isArray(permissions) && permissions.includes("create subareas");
  const errors = pageProps.errors || {};

  // Dialog and form states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [subareaName, setSubareaName] = useState("");
  const [country, setCountry] = useState<Option | null>(null);
  const [province, setProvince] = useState<Option | null>(null);
  const [city, setCity] = useState<Option | null>(null);
  const [area, setArea] = useState<Option | null>(null);
  
  const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [areaOptions, setAreaOptions] = useState<Option[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch cascades
  const fetchProvinces = async (countryId: number) => {
    try {
      const res = await fetch(`/subareas/countries/${countryId}/provinces`);
      const data = await res.json();
      setProvinceOptions(data.map((p: any) => ({ value: p.id, label: p.name })));
    } catch (err) { console.error(err); }
  };

  const fetchCities = async (provinceId: number) => {
    try {
      const res = await fetch(`/subareas/provinces/${provinceId}/cities`);
      const data = await res.json();
      setCityOptions(data.map((c: any) => ({ value: c.id, label: c.name })));
    } catch (err) { console.error(err); }
  };

  const fetchAreas = async (cityId: number) => {
    try {
      const res = await fetch(`/subareas/cities/${cityId}/areas`);
      const data = await res.json();
      setAreaOptions(data.map((a: any) => ({ value: a.id, label: a.name })));
    } catch (err) { console.error(err); }
  };

  // Handlers
  const handleCountryChange = (opt: Option | null) => {
    setCountry(opt);
    setProvince(null); setCity(null); setArea(null);
    setProvinceOptions([]); setCityOptions([]); setAreaOptions([]);
    if (opt) fetchProvinces(opt.value);
  };

  const handleProvinceChange = (opt: Option | null) => {
    setProvince(opt);
    setCity(null); setArea(null);
    setCityOptions([]); setAreaOptions([]);
    if (opt) fetchCities(opt.value);
  };

  const handleCityChange = (opt: Option | null) => {
    setCity(opt);
    setArea(null);
    setAreaOptions([]);
    if (opt) fetchAreas(opt.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country || !province || !city || !area || !subareaName.trim()) {
      return toast.error("Please fill in all required fields");
    }

    setIsSubmitting(true);
    const payload = {
      name: subareaName,
      country_id: country.value,
      province_id: province.value,
      city_id: city.value,
      area_id: area.value,
    };

    router.post("/subareas", payload, {
      onSuccess: () => {
        toast.success("Subarea created successfully");
        setOpenCreateDialog(false);
        setSubareaName("");
        setCountry(null); setProvince(null); setCity(null); setArea(null);
        setProvinceOptions([]); setCityOptions([]); setAreaOptions([]);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const countryOptions = countries.map(c => ({ value: c.id, label: c.name }));

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
      <Head title="Subareas Management" />
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-background">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Subareas
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage fine-grained locations within areas.
                  </p>
                </div>

                <Button
                  onClick={() => setOpenCreateDialog(true)}
                  disabled={!canCreate}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Subarea
                </Button>
              </motion.div>

              <SubareaSummary total={subareas.length} />
              <SubareaFilters
                filters={filters}
                countries={countries}
                provinces={provinces}
                cities={cities}
                areas={areas}
              />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <DataTable
                  subareas={subareas}
                  areas={areas}
                  cities={cities}
                  provinces={provinces}
                  countries={countries}
                />
              </motion.div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl rounded-lg">
          <DialogHeader>
            <DialogTitle>Add New Subarea</DialogTitle>
            <DialogDescription>Create a localized zone entry.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        Country
                      </Label>
                      <Select options={countryOptions} value={country} onChange={handleCountryChange} placeholder="Select" styles={technicalSelectStyles} />
                      {errors.country_id && <p className="text-xs text-destructive">{errors.country_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Navigation className="w-3 h-3" />
                        Province
                      </Label>
                      <Select options={provinceOptions} value={province} onChange={handleProvinceChange} placeholder={country ? "Pick" : "..."} isDisabled={!country} styles={technicalSelectStyles} />
                      {errors.province_id && <p className="text-xs text-destructive">{errors.province_id}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Building2 className="w-3 h-3" />
                        City
                      </Label>
                      <Select options={cityOptions} value={city} onChange={handleCityChange} placeholder={province ? "Pick" : "..."} isDisabled={!province} styles={technicalSelectStyles} />
                      {errors.city_id && <p className="text-xs text-destructive">{errors.city_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Area
                      </Label>
                      <Select options={areaOptions} value={area} onChange={(opt) => setArea(opt)} placeholder={city ? "Pick" : "..."} isDisabled={!city} styles={technicalSelectStyles} />
                      {errors.area_id && <p className="text-xs text-destructive">{errors.area_id}</p>}
                    </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Subarea Name</Label>
                  <Input
                    required
                    value={subareaName}
                    onChange={(e) => setSubareaName(e.target.value)}
                    placeholder="e.g. Block A"
                    className="h-10 text-sm"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-muted-foreground">Zone Classification</p>
                    <p className="text-xs text-muted-foreground mt-1">This subarea will be grouped under the selected area node for localized logistics.</p>
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
                {isSubmitting ? "Saving..." : "Create Subarea"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
