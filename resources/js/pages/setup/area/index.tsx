"use client";

import React, { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/area/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus } from "lucide-react";
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

const breadcrumbs: BreadcrumbItem[] = [{ title: "Areas", href: "/areas" }];

interface Area {
  id: number;
  name: string;
  country_id: number;
  province_id: number;
  city_id: number;
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

interface CityOption {
  value: number;
  label: string;
  code: string;
}

interface IndexProps {
  countries: Country[];
  provinces: Province[];
  cities: City[];
  areas: Area[];
}

export default function Index({ countries, provinces, cities, areas }: IndexProps) {
  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const canCreate = Array.isArray(permissions) && permissions.includes("create areas");

  // Dialog and form states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [province, setProvince] = useState<ProvinceOption | null>(null);
  const [city, setCity] = useState<CityOption | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);

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
  const handleCountryChange = (opt: CountryOption | null) => {
    setCountry(opt);
    setProvince(null);
    setCity(null);
    setProvinceOptions([]);
    setCityOptions([]);

    if (opt) fetchProvinces(opt.value);
  };

  const handleProvinceChange = (opt: ProvinceOption | null) => {
    setProvince(opt);
    setCity(null);
    setCityOptions([]);

    if (opt) fetchCities(opt.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!country || !province || !city || !areaName.trim()) return;

    const payload = {
      name: areaName,
      country_id: country.value,
      province_id: province.value, // ✅ fixed spelling
      city_id: city.value,
    };

    router.post("/areas", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setAreaName("");
        setCountry(null);
        setProvince(null);
        setCity(null);
        setProvinceOptions([]);
        setCityOptions([]);
      },
    });
  };

  const countryOptions: CountryOption[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  return (
    <>
      <Head title="Areas" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="mt-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">All Areas</h1>
                <p className="text-sm text-muted-foreground">
                  Manage all areas by country, province, and city.
                </p>
              </div>
              <Button
                className="bg-sky-500 mb-3"
                onClick={() => setOpenCreateDialog(true)}
                disabled={!canCreate}
              >
                <Plus className="mr-2" /> Add Area
              </Button>
            </div>

            {areas.length === 0 ? (
              <div>No areas found.</div>
            ) : (
              <DataTable
                areas={areas}
                countries={countries}
                provinces={provinces}
                cities={cities}
              />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Area Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Area</DialogTitle>
            <DialogDescription>
              Select Country → Province → City, then enter Area name.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {/* Country */}
            <div className="grid gap-2 mb-3">
              <Label htmlFor="country">Country</Label>
              <Select
                id="country"
                options={countryOptions}
                value={country}
                onChange={handleCountryChange}
                placeholder="Select country..."
                isSearchable
                formatOptionLabel={(opt) => (
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://flagcdn.com/w40/${opt.code.toLowerCase()}.png`}
                      alt={opt.label}
                      className="w-5 h-4 rounded"
                    />
                    <span>{opt.label}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      ({opt.code})
                    </span>
                  </div>
                )}
              />
            </div>

            {/* Province */}
            <div className="grid gap-2 mb-3">
              <Label htmlFor="province">Province</Label>
              <Select
                id="province"
                options={provinceOptions}
                value={province}
                onChange={handleProvinceChange}
                placeholder={country ? "Select province..." : "Select country first..."}
                isDisabled={!country}
                isSearchable
              />
            </div>

            {/* City */}
            <div className="grid gap-2 mb-3">
              <Label htmlFor="city">City</Label>
              <Select
                id="city"
                options={cityOptions}
                value={city}
                onChange={(opt) => setCity(opt)}
                placeholder={province ? "Select city..." : "Select province first..."}
                isDisabled={!province}
                isSearchable
              />
            </div>

            {/* Area Name */}
            <div className="grid gap-2 mb-4">
              <Label htmlFor="areaName">Area Name</Label>
              <Input
                id="areaName"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="Enter area name"
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-sky-500">
                Add Area
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
