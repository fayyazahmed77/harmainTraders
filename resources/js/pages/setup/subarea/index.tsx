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
      borderRadius: '12px',
      border: '1px solid #e4e4e7',
      '&:hover': { borderColor: '#f97316' },
      boxShadow: 'none',
      height: '48px',
      fontSize: '0.875rem',
      fontWeight: '700',
      backgroundColor: state.isDisabled ? '#f4f4f5' : 'white',
      opacity: state.isDisabled ? 0.5 : 1
    })
  };

  return (
    <>
      <Head title="Subareas Management" />
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                    Subareas <span className="text-orange-500 italic">Management</span>
                  </h1>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-1 opacity-60">
                    Manage fine-grained locations within areas
                  </p>
                </div>

                <Button
                  onClick={() => setOpenCreateDialog(true)}
                  disabled={!canCreate}
                  className="rounded-xl h-12 px-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Subarea
                </Button>
              </motion.div>

              <SubareaSummary total={subareas.length} />
              <SubareaFilters filters={filters} />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden"
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
        <DialogContent className="max-w-2xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
          <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Add New Subarea</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Create a localized zone entry</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        Country
                      </Label>
                      <Select options={countryOptions} value={country} onChange={handleCountryChange} placeholder="Select" styles={technicalSelectStyles} />
                      {errors.country_id && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.country_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 flex items-center gap-2">
                        <Navigation className="w-3 h-3" />
                        Province
                      </Label>
                      <Select options={provinceOptions} value={province} onChange={handleProvinceChange} placeholder={country ? "Pick" : "..."} isDisabled={!country} styles={technicalSelectStyles} />
                      {errors.province_id && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.province_id}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 flex items-center gap-2">
                        <Building2 className="w-3 h-3" />
                        City
                      </Label>
                      <Select options={cityOptions} value={city} onChange={handleCityChange} placeholder={province ? "Pick" : "..."} isDisabled={!province} styles={technicalSelectStyles} />
                      {errors.city_id && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.city_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Area
                      </Label>
                      <Select options={areaOptions} value={area} onChange={(opt) => setArea(opt)} placeholder={city ? "Pick" : "..."} isDisabled={!city} styles={technicalSelectStyles} />
                      {errors.area_id && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.area_id}</p>}
                    </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Subarea Name</Label>
                  <Input
                    required
                    value={subareaName}
                    onChange={(e) => setSubareaName(e.target.value)}
                    placeholder="e.g. Block A"
                    className="h-12 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold transition-all text-sm"
                  />
                  {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.name}</p>}
                </div>
                
                <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
                    <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Zone Classification</p>
                    <p className="text-[10px] text-zinc-500 mt-1">This subarea will be grouped under the selected area node for localized logistics.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="ghost"
                type="button"
                className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
                onClick={() => setOpenCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
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
