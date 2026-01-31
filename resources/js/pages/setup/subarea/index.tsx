"use client";

import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/subarea/DataTable";
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
import Select from "react-select";
import useToastFromQuery from "@/hooks/useToastFromQuery";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Subareas", href: "/subareas" }];

// ========================== Interfaces ==========================
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

interface City {
  id: number;
  province_id: number;
  name: string;
  code: string;
}

interface Area {
  id: number;
  name: string;
  city_id: number;
  province_id: number;
  country_id: number;
}

interface Subarea {
  id: number;
  name: string;
  area_id: number;
  city_id: number;
  province_id: number;
  country_id: number;
  created_by_name?: string;
  created_by_avatar?: string;
  status: string;
  created_at: string;
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
  areas: Area[];
  subareas: Subarea[];
}

// ========================== Component ==========================
export default function Index({
  countries,
  provinces,
  cities,
  areas,
  subareas,
}: IndexProps) {
  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const canCreate =
    Array.isArray(permissions) && permissions.includes("create subareas");

  // ========================== States ==========================
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [subareaName, setSubareaName] = useState("");
  const [country, setCountry] = useState<Option | null>(null);
  const [province, setProvince] = useState<Option | null>(null);
  const [city, setCity] = useState<Option | null>(null);
  const [area, setArea] = useState<Option | null>(null);

  const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [areaOptions, setAreaOptions] = useState<Option[]>([]);

  // ========================== Fetch Cascades ==========================
  const fetchProvinces = async (countryId: number) => {
    try {
      const res = await fetch(`/subareas/countries/${countryId}/provinces`);
      const data = await res.json();
      setProvinceOptions(
        data.map((p: Province) => ({
          value: p.id,
          label: p.name,
          code: p.code,
        }))
      );
    } catch {
      setProvinceOptions([]);
    }
  };

  const fetchCities = async (provinceId: number) => {
    try {
      const res = await fetch(`/subareas/provinces/${provinceId}/cities`);
      const data = await res.json();
      setCityOptions(
        data.map((c: City) => ({
          value: c.id,
          label: c.name,
          code: c.code,
        }))
      );
    } catch {
      setCityOptions([]);
    }
  };

  const fetchAreas = async (cityId: number) => {
    try {
      const res = await fetch(`/subareas/cities/${cityId}/areas`);
      const data = await res.json();
      setAreaOptions(
        data.map((a: Area) => ({
          value: a.id,
          label: a.name,
        }))
      );
    } catch {
      setAreaOptions([]);
    }
  };

  // ========================== Handlers ==========================
  const handleCountryChange = (opt: Option | null) => {
    setCountry(opt);
    setProvince(null);
    setCity(null);
    setArea(null);
    setProvinceOptions([]);
    setCityOptions([]);
    setAreaOptions([]);

    if (opt) fetchProvinces(opt.value);
  };

  const handleProvinceChange = (opt: Option | null) => {
    setProvince(opt);
    setCity(null);
    setArea(null);
    setCityOptions([]);
    setAreaOptions([]);

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
    if (!country || !province || !city || !area || !subareaName.trim()) return;

    const payload = {
      name: subareaName,
      country_id: country.value,
      province_id: province.value,
      city_id: city.value,
      area_id: area.value,
    };

    router.post("/subareas", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setSubareaName("");
        setCountry(null);
        setProvince(null);
        setCity(null);
        setArea(null);
        setProvinceOptions([]);
        setCityOptions([]);
        setAreaOptions([]);
      },
    });
  };

  // ========================== Options ==========================
  const countryOptions: Option[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  return (
    <>
      <Head title="Subareas" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="mt-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">All Subareas</h1>
                <p className="text-sm text-muted-foreground">
                  Manage subareas by linking country, province, city, and area.
                </p>
              </div>
              <Button
                className="bg-sky-500 mb-3"
                onClick={() => setOpenCreateDialog(true)}
                disabled={!canCreate}
              >
                <Plus className="mr-2" /> Add Subarea
              </Button>
            </div>

            {subareas.length === 0 ? (
              <div>No subareas found.</div>
            ) : (
              <DataTable
                subareas={subareas}
                countries={countries}
                provinces={provinces}
                cities={cities}
                areas={areas}
              />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Subarea Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subarea</DialogTitle>
            <DialogDescription>
              Select Country → Province → City → Area, then enter Subarea name.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {/* Country */}
            <div className="grid gap-2 mb-3">
              <Label>Country</Label>
              <Select
                options={countryOptions}
                value={country}
                onChange={handleCountryChange}
                placeholder="Select country..."
                isSearchable
                formatOptionLabel={(opt) => (
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://flagcdn.com/w40/${opt.code?.toLowerCase()}.png`}
                      alt={opt.label}
                      className="w-5 h-4 rounded"
                    />
                    <span>{opt.label}</span>
                  </div>
                )}
              />
            </div>

            {/* Province */}
            <div className="grid gap-2 mb-3">
              <Label>Province</Label>
              <Select
                options={provinceOptions}
                value={province}
                onChange={handleProvinceChange}
                placeholder={
                  country ? "Select province..." : "Select country first..."
                }
                isDisabled={!country}
                isSearchable
              />
            </div>

            {/* City */}
            <div className="grid gap-2 mb-3">
              <Label>City</Label>
              <Select
                options={cityOptions}
                value={city}
                onChange={handleCityChange}
                placeholder={
                  province ? "Select city..." : "Select province first..."
                }
                isDisabled={!province}
                isSearchable
              />
            </div>

            {/* Area */}
            <div className="grid gap-2 mb-3">
              <Label>Area</Label>
              <Select
                options={areaOptions}
                value={area}
                onChange={(opt) => setArea(opt)}
                placeholder={city ? "Select area..." : "Select city first..."}
                isDisabled={!city}
                isSearchable
              />
            </div>

            {/* Subarea Name */}
            <div className="grid gap-2 mb-4">
              <Label>Subarea Name</Label>
              <Input
                value={subareaName}
                onChange={(e) => setSubareaName(e.target.value)}
                placeholder="Enter subarea name"
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-sky-500">
                Add Subarea
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
