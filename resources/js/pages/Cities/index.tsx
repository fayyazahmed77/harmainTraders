"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/Cities/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, Building2, Globe, Database, Activity, ShieldCheck, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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


import Select, { SingleValue } from "react-select";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Cities", href: "/cities" }];

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
}

interface Country {
  id: number;
  name: string;
  code: string; // ISO code (e.g. "PK")
}

interface Province {
  id: number;
  name: string;
  code: string;
  country_id: number;
}

interface CountryOption {
  value: number;
  label: string;
  code: string;
}

interface ProvinceOption {
  value: number;
  label: string;
  code: string;
}

interface IndexProps {
  countries: Country[];
  provinces: Province[];
  cities: City[];
}

export default function Index({ cities, countries, provinces }: IndexProps) {
  useToastFromQuery();
  const pageProps = usePage().props as unknown as {
    auth: {
      user: any;
      permissions: string[];
    };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;

  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [province, setProvince] = useState<ProvinceOption | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);

  // handle country change -> load provinces
  const handleCountryChange = async (option: SingleValue<CountryOption>) => {
    setCountry(option);
    setProvince(null);
    setProvinceOptions([]);

    if (option) {
      try {
        const response = await fetch(`cities/countries/${option.value}/provinces`);

        const data: Province[] = await response.json();
        setProvinceOptions(
          data.map((p) => ({
            value: p.id,
            label: p.name,
            code: p.code,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!country || !province) return;

    const payload = {
      name,
      code,
      country_id: country.value,
      province_id: province.value,
      latitude,
      longitude,
    };

    router.post("/cities", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setCode("");
        setLatitude("");
        setLongitude("");
        setCountry(null);
        setProvince(null);
        setProvinceOptions([]);
      },
    });
  };

  const canCreate = Array.isArray(permissions) && permissions.includes("create cities");

  const countryOptions: CountryOption[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  return (
    <>

      <Head title="CITIES REGISTRY" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-[#fafafa]">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
            {/* Command Bar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-sm blur transition duration-1000 group-hover:duration-200 opacity-0 group-hover:opacity-100" />
              <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/80 backdrop-blur-xl border-2 border-orange-500/10 p-6 lg:p-8 rounded-sm shadow-2xl shadow-orange-500/5 transition-all hover:border-orange-500/20 select-none overflow-hidden">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-orange-600/20 rounded-sm blur-xl animate-pulse" />
                    <div className="relative p-5 bg-orange-600 text-white rounded-sm shadow-2xl shadow-orange-600/40 border-b-4 border-orange-800/50 group-hover:scale-105 transition-transform duration-500">
                      <Building2 className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                        CITIES <span className="text-orange-500 italic">REGISTRY</span>
                      </h1>
                      <div className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-sm">
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">v2.0</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                      Local Administrative Node Management Protocol
                    </p>
                  </div>
                </div>

                {/* Identity Console */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                  <div className="flex items-center gap-4 px-6 py-3 bg-muted/30 border-2 border-border/40 rounded-sm group/item hover:border-orange-500/20 transition-all">
                    <div className="p-2 bg-white rounded-sm shadow-sm border border-border group-hover/item:text-orange-600 transition-colors">
                      <Globe className="w-4 h-4 text-muted-foreground group-hover/item:text-orange-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">System Status</p>
                      <p className="text-xs font-black text-foreground flex items-center gap-1.5 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Operational
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 px-6 py-3 bg-muted/30 border-2 border-border/40 rounded-sm group/item hover:border-orange-500/20 transition-all">
                    <div className="p-2 bg-white rounded-sm shadow-sm border border-border">
                      <Database className="w-4 h-4 text-muted-foreground group-hover/item:text-orange-600 transition-colors" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Registry Scale</p>
                      <p className="text-xs font-black text-foreground uppercase tracking-tight">{cities.length} Active Nodes</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setOpenCreateDialog(true)}
                    disabled={!canCreate}
                    className="bg-orange-600 hover:bg-orange-700 h-16 px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 active:scale-95 transition-all group border-b-4 border-orange-800/50 text-white"
                  >
                    <Plus className="mr-3 w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    New City
                  </Button>
                </div>
              </div>
            </div>

            {/* Data Console */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {cities.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center bg-white border-2 border-dashed border-orange-500/10 rounded-sm group hover:border-orange-500/20 transition-all">
                  <div className="p-8 bg-orange-500/5 rounded-sm mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Plus className="w-12 h-12 text-orange-500/20" />
                  </div>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-1">NULL DATA DETECTED</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 italic mb-8">System awaiting administrative initialization...</p>
                  <Button
                    onClick={() => setOpenCreateDialog(true)}
                    variant="outline"
                    className="border-2 border-orange-500/20 hover:bg-orange-500/5 text-orange-600 font-black uppercase tracking-widest px-8 rounded-sm"
                  >
                    Initialize Registry
                  </Button>
                </div>
              ) : (
                <DataTable data={cities} countries={countries} provinces={provinces} />
              )}
            </motion.div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Genesis Dialog (Create) */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="rounded-sm border-2 border-orange-500/20 p-0 overflow-hidden sm:max-w-[600px] bg-white shadow-2xl max-h-[90vh] flex flex-col">
          <div className="h-2 bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)] flex-shrink-0" />
          <div className="p-8 lg:p-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-orange-600 text-white rounded-sm shadow-xl shadow-orange-600/20 ring-4 ring-orange-500/10 rotate-3 flex-shrink-0 transition-transform hover:rotate-0 duration-500">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none mb-1">
                    CITY <span className="text-orange-500 italic">GENESIS</span>
                  </DialogTitle>
                  <DialogDescription className="font-black text-orange-600 uppercase text-[10px] tracking-widest opacity-70">
                    Administrative Node Initialization
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      Jurisdiction
                    </Label>
                    <Select<CountryOption, false>
                      options={countryOptions}
                      value={country}
                      onChange={handleCountryChange}
                      placeholder="COUNTRY..."
                      className="technical-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: '2px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          '&:hover': { borderColor: 'rgba(249,115,22,0.4)' },
                          boxShadow: 'none',
                          height: '48px',
                          fontSize: '12px',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(0,0,0,0.02)'
                        })
                      }}
                      formatOptionLabel={(option: CountryOption) => (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png`}
                              alt={option.label}
                              className="w-6 h-4 rounded-sm object-cover border border-orange-500/10 shadow-sm"
                            />
                            <span className="tracking-tight">{option.label}</span>
                          </div>
                          <span className="text-[10px] font-black text-orange-600/40 font-mono">#{option.code}</span>
                        </div>
                      )}
                    />
                  </div>

                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Navigation className="w-3 h-3" />
                      Regional Area
                    </Label>
                    <Select<ProvinceOption, false>
                      options={provinceOptions}
                      value={province}
                      onChange={(option: SingleValue<ProvinceOption>) => setProvince(option)}
                      placeholder={country ? "SELECT PROVINCE..." : "AWAITING JURISDICTION..."}
                      isDisabled={!country}
                      className="technical-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '2px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          '&:hover': { borderColor: 'rgba(249,115,22,0.4)' },
                          boxShadow: 'none',
                          height: '48px',
                          fontSize: '12px',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          backgroundColor: state.isDisabled ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)',
                          opacity: state.isDisabled ? 0.5 : 1
                        })
                      }}
                      formatOptionLabel={(option: ProvinceOption) => (
                        <div className="flex items-center justify-between">
                          <span className="tracking-tight">{option.label}</span>
                          <span className="text-[10px] font-black text-orange-600/40 font-mono">#{option.code}</span>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      City Designation
                    </Label>
                    <Input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. LAHORE"
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-black uppercase tracking-tight transition-all"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Registry Code
                    </Label>
                    <Input
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. LHE"
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-mono font-black uppercase tracking-widest"
                    />
                  </div>
                </div>

                <div className="bg-orange-500/5 p-6 rounded-sm border-2 border-orange-500/10 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.2)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Geospatial Fixation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Latitude</Label>
                      <Input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="31.5204"
                        className="h-10 border-2 border-border/20 focus:border-orange-500 rounded-sm bg-white font-mono text-xs shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Longitude</Label>
                      <Input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="74.3587"
                        className="h-10 border-2 border-border/20 focus:border-orange-500 rounded-sm bg-white font-mono text-xs shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-orange-500/10 flex-shrink-0">
                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-14 px-8 rounded-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    onClick={() => setOpenCreateDialog(false)}
                  >
                    Abort
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 active:scale-95 group flex-1 text-white border-b-4 border-orange-800/50"
                  >
                    Commit Entry
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
